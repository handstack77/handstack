using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using agent.Entity;
using agent.Options;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace agent.Controllers
{
    public abstract class TargetProcessControllerBase : AgentControllerBase
    {
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;
        private readonly ILogger logger;
        private readonly IHttpClientFactory httpClientFactory;
        private static readonly SemaphoreSlim syncLock = new SemaphoreSlim(1, 1);
        private static readonly ConcurrentDictionary<string, ManagedProcessState> states = new ConcurrentDictionary<string, ManagedProcessState>(StringComparer.OrdinalIgnoreCase);
        private static readonly ConcurrentDictionary<int, string> pidMap = new ConcurrentDictionary<int, string>();
        private static readonly ConcurrentDictionary<int, CpuUsageSample> cpuSamples = new ConcurrentDictionary<int, CpuUsageSample>();
        private static readonly object loadSyncRoot = new object();
        private static bool processStatesLoaded;

        protected TargetProcessControllerBase(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
        {
            this.optionsMonitor = optionsMonitor;
            logger = loggerFactory.CreateLogger(GetType().FullName ?? GetType().Name);
            this.httpClientFactory = httpClientFactory;

            EnsureProcessStatesLoaded();
        }

        protected IReadOnlyList<TargetProcessInfo> GetTargets()
        {
            var targets = optionsMonitor.CurrentValue.Targets;
            return targets
                .Where(target => string.IsNullOrWhiteSpace(target.Id) == false)
                .Select(target => new TargetProcessInfo
                {
                    Id = target.Id.Trim(),
                    Name = string.IsNullOrWhiteSpace(target.Name) == true ? target.Id.Trim() : target.Name.Trim(),
                    Description = target.Description ?? "",
                    ProcessName = target.ResolveProcessName(),
                    ExecutablePath = target.ExecutablePath ?? ""
                })
                .ToArray();
        }

        protected bool TryGetTarget(string id, out TargetProcessOptions? target)
        {
            target = null;
            if (string.IsNullOrWhiteSpace(id) == true)
            {
                return false;
            }

            target = optionsMonitor.CurrentValue.Targets
                .FirstOrDefault(item => string.Equals(item.Id, id, StringComparison.OrdinalIgnoreCase) == true);

            return target is not null;
        }

        protected async Task<TargetStatusResponse?> GetStatusAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return null;
            }

            cancellationToken.ThrowIfCancellationRequested();

            if (target.UseCommandBridge == true)
            {
                var bridgeStatus = await GetStatusFromCommandBridgeAsync(target, cancellationToken);
                if (bridgeStatus is not null)
                {
                    return bridgeStatus;
                }
            }

            var state = GetOrCreateState(target.Id);
            Process? process;

            lock (state.SyncRoot)
            {
                process = FindRunningProcess(target, state);
                if (process is not null)
                {
                    UpdateStateFromProcess(target.Id, state, process);
                }
            }

            var response = new TargetStatusResponse
            {
                Id = target.Id,
                Name = string.IsNullOrWhiteSpace(target.Name) == true ? target.Id : target.Name
            };

            if (process is null)
            {
                if (await IsReachableByStatusProbeAsync(target, cancellationToken) == true)
                {
                    response.State = "Running";
                    return response;
                }

                response.State = "Stopped";
                return response;
            }

            response.State = "Running";
            response.Pid = process.Id;
            response.StartTimeUtc = SafeGetStartTime(process);
            if (response.StartTimeUtc.HasValue == true)
            {
                response.Uptime = DateTimeOffset.UtcNow - response.StartTimeUtc.Value;
            }

            response.CpuPercent = CalculateCpuPercent(process);
            response.RamBytes = SafeGetWorkingSet(process);

            return response;
        }

        protected async Task<TargetCommandResult> StartAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "target_not_found",
                    Message = $"대상 '{id}'을(를) 찾을 수 없습니다."
                };
            }

            if (target.UseCommandBridge == true)
            {
                return await ExecuteCommandViaBridgeAsync(target, "start", cancellationToken);
            }

            await syncLock.WaitAsync(cancellationToken);
            try
            {
                var state = GetOrCreateState(target.Id);
                Process? runningProcess;
                lock (state.SyncRoot)
                {
                    runningProcess = FindRunningProcess(target, state);
                }

                if (runningProcess is not null)
                {
                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "already_running",
                        Message = $"대상 '{target.Id}'은(는) 이미 실행 중입니다.",
                        Pid = runningProcess.Id
                    };
                }

                if (await IsReachableByStatusProbeAsync(target, cancellationToken) == true)
                {
                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "already_running",
                        Message = $"대상 '{target.Id}'은(는) 외부 실행 상태로 감지되었습니다."
                    };
                }

                var processStartInfo = BuildProcessStartInfo(target);
                var process = new Process
                {
                    StartInfo = processStartInfo,
                    EnableRaisingEvents = true
                };

                process.Exited += HandleProcessExited;
                process.OutputDataReceived += (sender, eventArgs) =>
                {
                    if (string.IsNullOrWhiteSpace(eventArgs.Data) == false)
                    {
                        logger.LogInformation("[{TargetId}] {Message}", target.Id, eventArgs.Data);
                    }
                };
                process.ErrorDataReceived += (sender, eventArgs) =>
                {
                    if (string.IsNullOrWhiteSpace(eventArgs.Data) == false)
                    {
                        logger.LogError("[{TargetId}] {Message}", target.Id, eventArgs.Data);
                    }
                };

                if (process.Start() == false)
                {
                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "start_failed",
                        Message = $"대상 '{target.Id}' 시작에 실패했습니다."
                    };
                }

                if (processStartInfo.RedirectStandardOutput == true)
                {
                    process.BeginOutputReadLine();
                }

                if (processStartInfo.RedirectStandardError == true)
                {
                    process.BeginErrorReadLine();
                }

                lock (state.SyncRoot)
                {
                    state.Process = process;
                    state.LastPid = process.Id;
                    state.LastStartTimeUtc = SafeGetStartTime(process) ?? DateTimeOffset.UtcNow;
                    state.LastExitCode = null;
                    state.LastExitTimeUtc = null;

                    pidMap[process.Id] = target.Id;
                    cpuSamples.TryRemove(process.Id, out _);
                }

                SaveProcessState(target.Id, state);

                return new TargetCommandResult
                {
                    Success = true,
                    Message = $"대상 '{target.Id}'이(가) 시작되었습니다.",
                    Pid = process.Id
                };
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "대상 시작 실패: {TargetId}", target.Id);
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "start_exception",
                    Message = exception.Message
                };
            }
            finally
            {
                syncLock.Release();
            }
        }

        protected async Task<TargetCommandResult> StopAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "target_not_found",
                    Message = $"대상 '{id}'을(를) 찾을 수 없습니다."
                };
            }

            if (target.UseCommandBridge == true)
            {
                return await ExecuteCommandViaBridgeAsync(target, "stop", cancellationToken);
            }

            await syncLock.WaitAsync(cancellationToken);
            try
            {
                var state = GetOrCreateState(target.Id);
                Process? process;

                lock (state.SyncRoot)
                {
                    process = FindRunningProcess(target, state);
                }

                if (process is null)
                {
                    if (await IsReachableByStatusProbeAsync(target, cancellationToken) == true)
                    {
                        return new TargetCommandResult
                        {
                            Success = false,
                            ErrorCode = "external_target_control_not_supported",
                            Message = $"대상 '{target.Id}'은(는) 외부 실행 상태로 감지되어 컨테이너에서 중지할 수 없습니다."
                        };
                    }

                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "already_stopped",
                        Message = $"대상 '{target.Id}'은(는) 이미 중지되어 있습니다."
                    };
                }

                var timeoutSeconds = target.StopTimeoutSeconds <= 0 ? 20 : target.StopTimeoutSeconds;
                var timeout = TimeSpan.FromSeconds(timeoutSeconds);
                var stopResult = await StopProcessAsync(process, timeout, target.KillEntireProcessTree, cancellationToken);

                lock (state.SyncRoot)
                {
                    state.Process = null;
                    state.LastPid = process.Id;
                    state.LastExitCode = stopResult.ExitCode;
                    state.LastExitTimeUtc = DateTimeOffset.UtcNow;
                    pidMap.TryRemove(process.Id, out _);
                    cpuSamples.TryRemove(process.Id, out _);
                }

                SaveProcessState(target.Id, state);

                if (stopResult.Stopped == true)
                {
                    return new TargetCommandResult
                    {
                        Success = true,
                        Message = $"대상 '{target.Id}'이(가) 중지되었습니다.",
                        Pid = process.Id
                    };
                }

                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "stop_timeout",
                    Message = $"대상 '{target.Id}'을(를) {timeoutSeconds}초 내에 중지하지 못했습니다.",
                    Pid = process.Id
                };
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "대상 중지 실패: {TargetId}", target.Id);
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "stop_exception",
                    Message = exception.Message
                };
            }
            finally
            {
                syncLock.Release();
            }
        }

        protected async Task<TargetCommandResult> RestartAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "target_not_found",
                    Message = $"대상 '{id}'을(를) 찾을 수 없습니다."
                };
            }

            if (target.UseCommandBridge == true)
            {
                return await ExecuteCommandViaBridgeAsync(target, "restart", cancellationToken);
            }

            var stopResult = await StopAsync(id, cancellationToken);
            if (stopResult.Success == false && string.Equals(stopResult.ErrorCode, "already_stopped", StringComparison.Ordinal) == false)
            {
                return stopResult;
            }

            return await StartAsync(id, cancellationToken);
        }

        protected static string ResolveWorkingDirectory(TargetProcessOptions target)
        {
            var workingDirectory = target.WorkingDirectory?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(workingDirectory) == false)
            {
                return ResolvePath(workingDirectory);
            }

            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == false && IsPathLike(target.ExecutablePath) == true)
            {
                var executablePath = ResolvePath(target.ExecutablePath);
                var executableDirectory = Path.GetDirectoryName(executablePath);
                if (string.IsNullOrWhiteSpace(executableDirectory) == false)
                {
                    return executableDirectory;
                }
            }

            return AppContext.BaseDirectory;
        }

        protected static string ResolvePath(string path, string basePath)
        {
            basePath = ExpandPathVariables(basePath ?? "");
            if (string.IsNullOrWhiteSpace(basePath) == true)
            {
                basePath = AppContext.BaseDirectory;
            }

            basePath = Path.GetFullPath(basePath);
            path = ExpandPathVariables(path ?? "");
            if (string.IsNullOrWhiteSpace(path) == true)
            {
                return basePath;
            }

            if (Path.IsPathRooted(path) == true)
            {
                return Path.GetFullPath(path);
            }

            return Path.GetFullPath(path, basePath);
        }

        private void EnsureProcessStatesLoaded()
        {
            if (processStatesLoaded == true)
            {
                return;
            }

            lock (loadSyncRoot)
            {
                if (processStatesLoaded == true)
                {
                    return;
                }

                LoadProcessStates();
                processStatesLoaded = true;
            }
        }

        private async Task<TargetStatusResponse?> GetStatusFromCommandBridgeAsync(TargetProcessOptions target, CancellationToken cancellationToken)
        {
            if (TryCreateCommandBridgeRequest(
                target,
                HttpMethod.Get,
                $"bridge/targets/{Uri.EscapeDataString(target.Id)}/status",
                out var request,
                out var timeout,
                out var configError) == false)
            {
                logger.LogWarning("명령 브리지 설정 오류. 대상ID={TargetId}, 메시지={Message}", target.Id, configError?.Message ?? "구성 오류");
                return null;
            }

            using (request)
            using (var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken))
            {
                timeoutTokenSource.CancelAfter(timeout);

                try
                {
                    var client = httpClientFactory.CreateClient();
                    client.Timeout = Timeout.InfiniteTimeSpan;

                    using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeoutTokenSource.Token);
                    var payload = await response.Content.ReadAsStringAsync(timeoutTokenSource.Token);

                    if (response.StatusCode == HttpStatusCode.NotFound)
                    {
                        return null;
                    }

                    if (response.IsSuccessStatusCode == false)
                    {
                        logger.LogWarning("명령 브리지 상태 조회 실패. 대상ID={TargetId}, 상태코드={StatusCode}", target.Id, (int)response.StatusCode);
                        return null;
                    }

                    var status = TryDeserializeJson<TargetStatusResponse>(payload);
                    if (status is null)
                    {
                        logger.LogWarning("명령 브리지 상태 응답 파싱 실패. 대상ID={TargetId}", target.Id);
                        return null;
                    }

                    if (string.IsNullOrWhiteSpace(status.Id) == true)
                    {
                        status.Id = target.Id;
                    }

                    if (string.IsNullOrWhiteSpace(status.Name) == true)
                    {
                        status.Name = string.IsNullOrWhiteSpace(target.Name) == true ? target.Id : target.Name;
                    }

                    return status;
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested == false)
                {
                    logger.LogWarning("명령 브리지 상태 조회 시간 초과. 대상ID={TargetId}", target.Id);
                    return null;
                }
                catch (Exception exception)
                {
                    logger.LogWarning(exception, "명령 브리지 상태 조회 예외. 대상ID={TargetId}", target.Id);
                    return null;
                }
            }
        }

        private async Task<TargetCommandResult> ExecuteCommandViaBridgeAsync(TargetProcessOptions target, string command, CancellationToken cancellationToken)
        {
            if (TryCreateCommandBridgeRequest(
                target,
                HttpMethod.Post,
                $"bridge/targets/{Uri.EscapeDataString(target.Id)}/{command}",
                out var request,
                out var timeout,
                out var configError) == false)
            {
                return configError ?? BuildBridgeNotConfiguredResult(target, "명령 브리지 설정이 올바르지 않습니다.");
            }

            using (request)
            using (var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken))
            {
                timeoutTokenSource.CancelAfter(timeout);

                try
                {
                    var client = httpClientFactory.CreateClient();
                    client.Timeout = Timeout.InfiniteTimeSpan;

                    using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeoutTokenSource.Token);
                    var payload = await response.Content.ReadAsStringAsync(timeoutTokenSource.Token);

                    var bridgeResult = TryDeserializeJson<TargetCommandResult>(payload);
                    if (bridgeResult is not null &&
                        (bridgeResult.Success == true ||
                         bridgeResult.Pid.HasValue == true ||
                         string.IsNullOrWhiteSpace(bridgeResult.ErrorCode) == false ||
                         string.IsNullOrWhiteSpace(bridgeResult.Message) == false))
                    {
                        return bridgeResult;
                    }

                    if (response.IsSuccessStatusCode == true)
                    {
                        return new TargetCommandResult
                        {
                            Success = true,
                            Message = $"명령 브리지에서 '{target.Id}' 대상의 '{command}' 작업을 완료했습니다."
                        };
                    }

                    if (response.StatusCode == HttpStatusCode.NotFound)
                    {
                        return new TargetCommandResult
                        {
                            Success = false,
                            ErrorCode = "target_not_found",
                            Message = $"대상 '{target.Id}'을(를) 찾을 수 없습니다."
                        };
                    }

                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "bridge_http_error",
                        Message = $"명령 브리지 요청 실패: HTTP {(int)response.StatusCode}"
                    };
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested == false)
                {
                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "bridge_timeout",
                        Message = "명령 브리지 요청이 시간 초과되었습니다."
                    };
                }
                catch (Exception exception)
                {
                    logger.LogWarning(exception, "명령 브리지 호출 예외. 대상ID={TargetId}, 명령={Command}", target.Id, command);
                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "bridge_unreachable",
                        Message = "명령 브리지에 연결할 수 없습니다."
                    };
                }
            }
        }

        private bool TryCreateCommandBridgeRequest(
            TargetProcessOptions target,
            HttpMethod method,
            string relativePath,
            out HttpRequestMessage request,
            out TimeSpan timeout,
            out TargetCommandResult? error)
        {
            request = null!;
            timeout = TimeSpan.Zero;
            error = null;

            var bridgeUrl = target.CommandBridgeUrl?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(bridgeUrl) == true)
            {
                error = BuildBridgeNotConfiguredResult(target, "명령 브리지 URL이 비어 있습니다.");
                return false;
            }

            if (Uri.TryCreate(bridgeUrl, UriKind.Absolute, out var baseUri) == false)
            {
                error = BuildBridgeNotConfiguredResult(target, "명령 브리지 URL 형식이 올바르지 않습니다.");
                return false;
            }

            if (baseUri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal) == false)
            {
                baseUri = new Uri(baseUri.AbsoluteUri + "/", UriKind.Absolute);
            }

            var requestUri = new Uri(baseUri, relativePath.TrimStart('/'));
            request = new HttpRequestMessage(method, requestUri);

            var headerName = string.IsNullOrWhiteSpace(target.CommandBridgeHeaderName) == true
                ? "X-Bridge-Key"
                : target.CommandBridgeHeaderName.Trim();
            var headerValue = target.CommandBridgeKey?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(headerValue) == true)
            {
                request.Dispose();
                request = null!;
                error = BuildBridgeNotConfiguredResult(target, "명령 브리지 인증 키가 비어 있습니다.");
                return false;
            }

            request.Headers.Remove(headerName);
            request.Headers.TryAddWithoutValidation(headerName, headerValue);

            var timeoutSeconds = target.CommandBridgeTimeoutSeconds <= 0 ? 5 : target.CommandBridgeTimeoutSeconds;
            timeout = TimeSpan.FromSeconds(timeoutSeconds);
            return true;
        }

        private TargetCommandResult BuildBridgeNotConfiguredResult(TargetProcessOptions target, string message)
        {
            return new TargetCommandResult
            {
                Success = false,
                ErrorCode = "bridge_not_configured",
                Message = $"대상 '{target.Id}' 명령 브리지 설정 오류: {message}"
            };
        }

        private static T? TryDeserializeJson<T>(string payload)
            where T : class
        {
            if (string.IsNullOrWhiteSpace(payload) == true)
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<T>(payload, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                return null;
            }
        }

        protected static bool IsPathLike(string executablePath)
        {
            return executablePath.Contains(Path.DirectorySeparatorChar)
                || executablePath.Contains(Path.AltDirectorySeparatorChar)
                || executablePath.Contains(':')
                || executablePath.StartsWith(".", StringComparison.Ordinal);
        }

        protected static string ResolvePath(string path)
        {
            path = ExpandPathVariables(path);
            if (string.IsNullOrWhiteSpace(path) == true)
            {
                return AppContext.BaseDirectory;
            }

            if (Path.IsPathRooted(path) == true)
            {
                return Path.GetFullPath(path);
            }

            return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, path));
        }

        protected static string ExpandPathVariables(string path)
        {
            var expandedPath = Environment.ExpandEnvironmentVariables(path ?? "");
            return Regex.Replace(expandedPath, @"\$(\{(?<name>[A-Za-z_][A-Za-z0-9_]*)\}|(?<name>[A-Za-z_][A-Za-z0-9_]*))", match =>
            {
                var variableName = match.Groups["name"].Value;
                var value = Environment.GetEnvironmentVariable(variableName);
                return string.IsNullOrEmpty(value) == true ? match.Value : value;
            });
        }

        private ProcessStartInfo BuildProcessStartInfo(TargetProcessOptions target)
        {
            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == true)
            {
                throw new InvalidOperationException($"대상 '{target.Id}'의 실행 파일 경로가 비어 있습니다.");
            }

            var executablePath = target.ExecutablePath.Trim();
            if (IsPathLike(executablePath) == true)
            {
                executablePath = ResolvePath(executablePath);
                if (System.IO.File.Exists(executablePath) == false)
                {
                    throw new FileNotFoundException($"대상 '{target.Id}' 실행 파일을 찾을 수 없습니다.", executablePath);
                }
            }

            var workingDirectory = string.IsNullOrWhiteSpace(target.WorkingDirectory) == true
                ? (IsPathLike(executablePath) == true ? Path.GetDirectoryName(executablePath) ?? AppContext.BaseDirectory : AppContext.BaseDirectory)
                : ResolvePath(target.WorkingDirectory);

            var startInfo = new ProcessStartInfo
            {
                FileName = executablePath,
                Arguments = target.Arguments ?? "",
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            foreach (var item in target.EnvironmentVariables)
            {
                startInfo.Environment[item.Key] = item.Value;
            }

            return startInfo;
        }

        private Process? FindRunningProcess(TargetProcessOptions target, ManagedProcessState state)
        {
            if (state.Process is not null && IsRunning(state.Process) == true)
            {
                return state.Process;
            }

            if (state.LastPid.HasValue == true)
            {
                var processByPid = TryGetProcessByPid(state.LastPid.Value);
                if (processByPid is not null && IsRunning(processByPid) == true)
                {
                    state.Process = processByPid;
                    AttachProcessTracking(target.Id, processByPid);
                    return processByPid;
                }
            }

            var processName = target.ResolveProcessName();
            if (string.IsNullOrWhiteSpace(processName) == true)
            {
                return null;
            }

            var processes = Process.GetProcessesByName(processName);
            if (processes.Length == 0)
            {
                return null;
            }

            var normalizedTargetPath = "";
            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == false && IsPathLike(target.ExecutablePath) == true)
            {
                normalizedTargetPath = ResolvePath(target.ExecutablePath);
            }

            foreach (var process in processes)
            {
                if (IsRunning(process) == false)
                {
                    process.Dispose();
                    continue;
                }

                if (string.IsNullOrWhiteSpace(normalizedTargetPath) == false)
                {
                    var processPath = TryGetProcessPath(process);
                    if (string.IsNullOrWhiteSpace(processPath) == true)
                    {
                        process.Dispose();
                        continue;
                    }

                    if (string.Equals(Path.GetFullPath(processPath), normalizedTargetPath, StringComparison.OrdinalIgnoreCase) == false)
                    {
                        process.Dispose();
                        continue;
                    }
                }

                state.Process = process;
                state.LastPid = process.Id;
                state.LastStartTimeUtc = SafeGetStartTime(process);
                AttachProcessTracking(target.Id, process);
                SaveProcessState(target.Id, state);
                return process;
            }

            return null;
        }

        private async Task<bool> IsReachableByStatusProbeAsync(TargetProcessOptions target, CancellationToken cancellationToken)
        {
            if (target.UseStatusProbeWhenProcessNotFound == false)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(target.StatusProbeUrl) == true)
            {
                return false;
            }

            var timeoutSeconds = target.StatusProbeTimeoutSeconds <= 0 ? 3 : target.StatusProbeTimeoutSeconds;
            using var request = new HttpRequestMessage(HttpMethod.Get, target.StatusProbeUrl.Trim());
            using var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutTokenSource.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

            try
            {
                var client = httpClientFactory.CreateClient();
                client.Timeout = Timeout.InfiniteTimeSpan;

                using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeoutTokenSource.Token);
                return true;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested == false)
            {
                return false;
            }
            catch (Exception exception)
            {
                logger.LogDebug(exception, "상태 프로브 요청 실패: {TargetId}/{Url}", target.Id, target.StatusProbeUrl);
                return false;
            }
        }

        private void AttachProcessTracking(string targetId, Process process)
        {
            try
            {
                process.EnableRaisingEvents = true;
                process.Exited -= HandleProcessExited;
                process.Exited += HandleProcessExited;
                pidMap[process.Id] = targetId;
            }
            catch (Exception exception)
            {
                logger.LogDebug(exception, "프로세스 추적 연결 실패: {TargetId}/{Pid}", targetId, process.Id);
            }
        }

        private async Task<(bool Stopped, int? ExitCode)> StopProcessAsync(Process process, TimeSpan timeout, bool killEntireProcessTree, CancellationToken cancellationToken)
        {
            if (IsRunning(process) == false)
            {
                return (true, TryGetExitCode(process));
            }

            try
            {
                if (OperatingSystem.IsWindows() == true)
                {
                    try
                    {
                        if (process.CloseMainWindow() == true)
                        {
                            if (await WaitForExitAsync(process, timeout, cancellationToken) == true)
                            {
                                return (true, TryGetExitCode(process));
                            }
                        }
                    }
                    catch
                    {
                    }
                }

                process.Kill(killEntireProcessTree);
                if (await WaitForExitAsync(process, timeout, cancellationToken) == true)
                {
                    return (true, TryGetExitCode(process));
                }
            }
            catch (InvalidOperationException)
            {
                return (true, TryGetExitCode(process));
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "프로세스 중지 실패. PID={Pid}", process.Id);
            }

            return (false, TryGetExitCode(process));
        }

        private static async Task<bool> WaitForExitAsync(Process process, TimeSpan timeout, CancellationToken cancellationToken)
        {
            using var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutTokenSource.CancelAfter(timeout);

            try
            {
                await process.WaitForExitAsync(timeoutTokenSource.Token);
                return true;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested == false)
            {
                return IsRunning(process) == false;
            }
        }

        private static Process? TryGetProcessByPid(int pid)
        {
            try
            {
                return Process.GetProcessById(pid);
            }
            catch
            {
                return null;
            }
        }

        private static string TryGetProcessPath(Process process)
        {
            try
            {
                return process.MainModule?.FileName ?? "";
            }
            catch
            {
                return "";
            }
        }

        private static bool IsRunning(Process process)
        {
            try
            {
                return process.HasExited == false;
            }
            catch
            {
                return false;
            }
        }

        private static int? TryGetExitCode(Process process)
        {
            try
            {
                return process.HasExited == true ? process.ExitCode : null;
            }
            catch
            {
                return null;
            }
        }

        private static DateTimeOffset? SafeGetStartTime(Process process)
        {
            try
            {
                return process.StartTime.ToUniversalTime();
            }
            catch
            {
                return null;
            }
        }

        private static long? SafeGetWorkingSet(Process process)
        {
            try
            {
                return process.WorkingSet64;
            }
            catch
            {
                return null;
            }
        }

        private void UpdateStateFromProcess(string targetId, ManagedProcessState state, Process process)
        {
            state.TargetId = targetId;
            state.LastPid = process.Id;
            state.LastStartTimeUtc = SafeGetStartTime(process);
            pidMap[process.Id] = targetId;
        }

        private double? CalculateCpuPercent(Process process)
        {
            try
            {
                var pid = process.Id;
                var sample = new CpuUsageSample
                {
                    SampledAtUtc = DateTimeOffset.UtcNow,
                    TotalProcessorTime = process.TotalProcessorTime
                };

                if (cpuSamples.TryGetValue(pid, out var previous) == false)
                {
                    cpuSamples[pid] = sample;
                    return null;
                }

                cpuSamples[pid] = sample;

                var elapsedCpu = sample.TotalProcessorTime - previous.TotalProcessorTime;
                var elapsedWall = sample.SampledAtUtc - previous.SampledAtUtc;

                if (elapsedWall.TotalMilliseconds <= 0)
                {
                    return 0;
                }

                var cpu = elapsedCpu.TotalMilliseconds / (Environment.ProcessorCount * elapsedWall.TotalMilliseconds) * 100D;
                if (cpu < 0)
                {
                    cpu = 0;
                }

                return Math.Round(cpu, 2, MidpointRounding.AwayFromZero);
            }
            catch
            {
                return null;
            }
        }

        private void HandleProcessExited(object? sender, EventArgs eventArgs)
        {
            if (sender is not Process process)
            {
                return;
            }

            if (pidMap.TryRemove(process.Id, out var targetId) == false)
            {
                return;
            }

            var state = GetOrCreateState(targetId);
            lock (state.SyncRoot)
            {
                state.Process = null;
                state.TargetId = targetId;
                state.LastPid = process.Id;
                state.LastExitCode = TryGetExitCode(process);
                state.LastExitTimeUtc = DateTimeOffset.UtcNow;
                cpuSamples.TryRemove(process.Id, out _);
            }

            SaveProcessState(targetId, state);
            logger.LogInformation("대상 프로세스가 종료되었습니다. 대상ID={TargetId}, PID={Pid}, 종료코드={ExitCode}", targetId, process.Id, state.LastExitCode);
        }

        private void LoadProcessStates()
        {
            try
            {
                var stateDirectoryPath = ResolvePath(optionsMonitor.CurrentValue.StateDirectoryPath);
                if (Directory.Exists(stateDirectoryPath) == false)
                {
                    return;
                }

                foreach (var filePath in Directory.GetFiles(stateDirectoryPath, "*.json", SearchOption.TopDirectoryOnly))
                {
                    var payload = System.IO.File.ReadAllText(filePath);
                    var snapshot = JsonSerializer.Deserialize<ManagedProcessSnapshot>(payload);
                    if (snapshot is null || string.IsNullOrWhiteSpace(snapshot.TargetId) == true)
                    {
                        continue;
                    }

                    if (TryGetTarget(snapshot.TargetId, out var target) == false || target is null)
                    {
                        continue;
                    }

                    var state = GetOrCreateState(snapshot.TargetId);
                    lock (state.SyncRoot)
                    {
                        state.TargetId = snapshot.TargetId;
                        state.LastPid = snapshot.LastPid;
                        state.LastStartTimeUtc = snapshot.LastStartTimeUtc;
                        state.LastExitCode = snapshot.LastExitCode;
                        state.LastExitTimeUtc = snapshot.LastExitTimeUtc;

                        if (state.LastPid.HasValue == true)
                        {
                            var process = TryGetProcessByPid(state.LastPid.Value);
                            if (process is not null && IsRunning(process) == true)
                            {
                                state.Process = process;
                                AttachProcessTracking(target.Id, process);
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "프로세스 상태 로드에 실패했습니다.");
            }
        }

        private void SaveProcessState(string targetId, ManagedProcessState state)
        {
            try
            {
                var stateDirectoryPath = ResolvePath(optionsMonitor.CurrentValue.StateDirectoryPath);
                Directory.CreateDirectory(stateDirectoryPath);

                var snapshot = new ManagedProcessSnapshot
                {
                    TargetId = targetId,
                    LastPid = state.LastPid,
                    LastStartTimeUtc = state.LastStartTimeUtc,
                    LastExitCode = state.LastExitCode,
                    LastExitTimeUtc = state.LastExitTimeUtc
                };

                var filePath = Path.Combine(stateDirectoryPath, $"{targetId}.json");
                var payload = JsonSerializer.Serialize(snapshot, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                System.IO.File.WriteAllText(filePath, payload);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "프로세스 상태 저장에 실패했습니다. 대상ID={TargetId}", targetId);
            }
        }

        private ManagedProcessState GetOrCreateState(string targetId)
        {
            return states.GetOrAdd(targetId, key => new ManagedProcessState
            {
                TargetId = key
            });
        }

        private sealed class ManagedProcessState
        {
            public object SyncRoot { get; } = new object();

            public string TargetId { get; set; } = "";

            public Process? Process { get; set; }

            public int? LastPid { get; set; }

            public DateTimeOffset? LastStartTimeUtc { get; set; }

            public int? LastExitCode { get; set; }

            public DateTimeOffset? LastExitTimeUtc { get; set; }
        }

        private sealed class ManagedProcessSnapshot
        {
            public string TargetId { get; set; } = "";

            public int? LastPid { get; set; }

            public DateTimeOffset? LastStartTimeUtc { get; set; }

            public int? LastExitCode { get; set; }

            public DateTimeOffset? LastExitTimeUtc { get; set; }
        }

        private sealed class CpuUsageSample
        {
            public TimeSpan TotalProcessorTime { get; set; }

            public DateTimeOffset SampledAtUtc { get; set; }
        }
    }
}


