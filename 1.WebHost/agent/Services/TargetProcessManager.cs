using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using agent.Entity;
using agent.Options;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace agent.Services
{
    public sealed class TargetProcessManager : ITargetProcessManager
    {
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;
        private readonly IDotNetMonitorCollector collector;
        private readonly ILogger<TargetProcessManager> logger;
        private readonly SemaphoreSlim syncLock;
        private readonly ConcurrentDictionary<string, ManagedProcessState> states;
        private readonly ConcurrentDictionary<int, string> pidMap;
        private readonly ConcurrentDictionary<int, CpuUsageSample> cpuSamples;

        public TargetProcessManager(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IDotNetMonitorCollector collector,
            ILogger<TargetProcessManager> logger)
        {
            this.optionsMonitor = optionsMonitor;
            this.collector = collector;
            this.logger = logger;
            syncLock = new SemaphoreSlim(1, 1);
            states = new ConcurrentDictionary<string, ManagedProcessState>(StringComparer.OrdinalIgnoreCase);
            pidMap = new ConcurrentDictionary<int, string>();
            cpuSamples = new ConcurrentDictionary<int, CpuUsageSample>();

            LoadProcessStates();
        }

        public IReadOnlyList<TargetProcessInfo> GetTargets()
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

        public bool TryGetTarget(string id, out TargetProcessOptions? target)
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

        public async Task<TargetStatusResponse?> GetStatusAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return null;
            }

            cancellationToken.ThrowIfCancellationRequested();

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
                Name = string.IsNullOrWhiteSpace(target.Name) == true ? target.Id : target.Name,
                LastExitCode = state.LastExitCode,
                LastExitTimeUtc = state.LastExitTimeUtc,
                RequestStat = new TargetRequestStat(),
                ResponseStat = new TargetResponseStat()
            };

            if (process is null)
            {
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

            var monitorStats = await collector.GetStatsAsync(target, process.Id, cancellationToken);
            if (monitorStats is not null)
            {
                response.RequestStat = monitorStats.RequestStat;
                response.ResponseStat = monitorStats.ResponseStat;
            }

            return response;
        }

        public async Task<TargetCommandResult> StartAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "target_not_found",
                    Message = $"Target '{id}' was not found."
                };
            }

            await syncLock.WaitAsync(cancellationToken);
            try
            {
                var state = GetOrCreateState(target.Id);
                lock (state.SyncRoot)
                {
                    var runningProcess = FindRunningProcess(target, state);
                    if (runningProcess is not null)
                    {
                        return new TargetCommandResult
                        {
                            Success = false,
                            ErrorCode = "already_running",
                            Message = $"Target '{target.Id}' is already running.",
                            Pid = runningProcess.Id
                        };
                    }
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
                        Message = $"Target '{target.Id}' failed to start."
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
                    Message = $"Target '{target.Id}' started.",
                    Pid = process.Id
                };
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to start target: {TargetId}", target.Id);
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

        public async Task<TargetCommandResult> StopAsync(string id, CancellationToken cancellationToken)
        {
            if (TryGetTarget(id, out var target) == false || target is null)
            {
                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "target_not_found",
                    Message = $"Target '{id}' was not found."
                };
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
                    return new TargetCommandResult
                    {
                        Success = false,
                        ErrorCode = "already_stopped",
                        Message = $"Target '{target.Id}' is already stopped."
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
                        Message = $"Target '{target.Id}' stopped.",
                        Pid = process.Id
                    };
                }

                return new TargetCommandResult
                {
                    Success = false,
                    ErrorCode = "stop_timeout",
                    Message = $"Target '{target.Id}' could not be stopped within {timeoutSeconds} seconds.",
                    Pid = process.Id
                };
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to stop target: {TargetId}", target.Id);
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

        public async Task<TargetCommandResult> RestartAsync(string id, CancellationToken cancellationToken)
        {
            var stopResult = await StopAsync(id, cancellationToken);
            if (stopResult.Success == false && string.Equals(stopResult.ErrorCode, "already_stopped", StringComparison.Ordinal) == false)
            {
                return stopResult;
            }

            return await StartAsync(id, cancellationToken);
        }

        private static bool IsPathLike(string executablePath)
        {
            return executablePath.Contains(Path.DirectorySeparatorChar)
                || executablePath.Contains(Path.AltDirectorySeparatorChar)
                || executablePath.Contains(':')
                || executablePath.StartsWith(".", StringComparison.Ordinal);
        }

        private static string ResolvePath(string path)
        {
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

        private ProcessStartInfo BuildProcessStartInfo(TargetProcessOptions target)
        {
            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == true)
            {
                throw new InvalidOperationException($"Target '{target.Id}' has an empty executable path.");
            }

            var executablePath = target.ExecutablePath.Trim();
            if (IsPathLike(executablePath) == true)
            {
                executablePath = ResolvePath(executablePath);
                if (File.Exists(executablePath) == false)
                {
                    throw new FileNotFoundException($"Target '{target.Id}' executable file not found.", executablePath);
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
                logger.LogDebug(exception, "Failed to attach process tracking: {TargetId}/{Pid}", targetId, process.Id);
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
                logger.LogError(exception, "Failed to stop process. PID={Pid}", process.Id);
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
            logger.LogInformation("Target process exited. TargetId={TargetId}, Pid={Pid}, ExitCode={ExitCode}", targetId, process.Id, state.LastExitCode);
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
                    var payload = File.ReadAllText(filePath);
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
                logger.LogError(exception, "Failed to load process state.");
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

                File.WriteAllText(filePath, payload);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to save process state. TargetId={TargetId}", targetId);
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

