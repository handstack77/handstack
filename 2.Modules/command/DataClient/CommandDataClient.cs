using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using command.Encapsulation;
using command.Entity;
using command.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;

namespace command.DataClient
{
    public class CommandDataClient : ICommandDataClient
    {
        private static readonly Regex parameterRegex = new Regex(@"\{(?<kind>[#@])(?<name>[^}]+)\}|(?<legacyKind>[$#])\{(?<legacyName>[^}]+)\}", RegexOptions.Compiled);

        private readonly IHttpClientFactory httpClientFactory;
        private readonly Serilog.ILogger logger;
        private readonly CommandLoggerClient loggerClient;

        public CommandDataClient(IHttpClientFactory httpClientFactory, Serilog.ILogger logger, CommandLoggerClient loggerClient)
        {
            this.httpClientFactory = httpClientFactory;
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        public async Task ExecuteDynamicCommandMap(DynamicRequest request, DynamicResponse response)
        {
            if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
            {
                response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                return;
            }

            if (request.ReturnType != ExecuteDynamicTypeObject.Json && request.ReturnType != ExecuteDynamicTypeObject.DynamicJson)
            {
                response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요";
                return;
            }

            var results = new List<CommandExecutionResult>();
            try
            {
                var logQuerys = new List<string>();
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

                    var commandMap = CommandMapper.GetCommandMap(queryObject.QueryID);
                    if (commandMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (commandMap.Use == false)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID} 비활성 command 확인 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || commandMap.TransactionLog == true)
                    {
                        logQuerys.Add(queryObject.QueryID);
                    }
                }

                if (logQuerys.Count > 0)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, $"QueryID: {string.Join(", ", logQuerys)}", "CommandDataClient/ExecuteDynamicCommandMap", (string error) =>
                    {
                        logger.Information("[{LogCategory}] [{GlobalID}] fallback error: {Error}", "CommandDataClient/ExecuteDynamicCommandMap", request.GlobalID, error);
                    });
                }

                foreach (var queryObject in request.DynamicObjects)
                {
                    var commandMap = CommandMapper.GetCommandMap(queryObject.QueryID);
                    if (commandMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        response.ResultJson = results;
                        return;
                    }

                    var parameters = BuildParameters(commandMap, queryObject);
                    CommandExecutionResult result;
                    if (commandMap.CommandType.Equals("CLI", StringComparison.OrdinalIgnoreCase))
                    {
                        result = await ExecuteCliAsync(commandMap, parameters);
                        if (result.ExitCode == null || commandMap.SuccessExitCodes.Contains(result.ExitCode.Value) == false)
                        {
                            results.Add(result);
                            response.ResultJson = results;
                            response.ExceptionText = $"QueryID - {queryObject.QueryID} CLI 실행 오류 ExitCode: {result.ExitCode}, StdErr: {result.StandardError}";
                            return;
                        }
                    }
                    else if (commandMap.CommandType.Equals("HTTP", StringComparison.OrdinalIgnoreCase) || commandMap.CommandType.Equals("WEB", StringComparison.OrdinalIgnoreCase))
                    {
                        result = await ExecuteHttpAsync(commandMap, parameters);
                        if (result.StatusCode == null || result.StatusCode < 200 || result.StatusCode >= 300)
                        {
                            results.Add(result);
                            response.ResultJson = results;
                            response.ExceptionText = $"QueryID - {queryObject.QueryID} HTTP 요청 오류 StatusCode: {result.StatusCode}, ReasonPhrase: {result.ReasonPhrase}";
                            return;
                        }
                    }
                    else
                    {
                        response.ResultJson = results;
                        response.ExceptionText = $"QueryID - {queryObject.QueryID} CommandType 확인 필요: {commandMap.CommandType}";
                        return;
                    }

                    results.Add(result);
                }

                response.Acknowledge = AcknowledgeType.Success;
                response.ResultMeta = new List<string>() { "CommandID:String;Type:String;ExitCode:Int32;StatusCode:Int32;ElapsedMS:Int64;" };
                response.ResultJson = results;
            }
            catch (Exception exception)
            {
                response.ResultJson = results;
                response.ExceptionText = exception.ToMessage();
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] command 실행 오류", "CommandDataClient/ExecuteDynamicCommandMap", request.GlobalID);
            }
        }

        private static Dictionary<string, object?> BuildParameters(CommandMap commandMap, QueryObject queryObject)
        {
            var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var parameter in queryObject.Parameters)
            {
                AddParameterAliases(result, parameter.ParameterName, parameter.Value);
            }

            foreach (var parameterMap in commandMap.Parameters)
            {
                if (TryGetParameterValue(queryObject.Parameters, parameterMap.Name, out var value) == false)
                {
                    if (!parameterMap.DefaultValue.Equals("NULL", StringComparison.OrdinalIgnoreCase))
                    {
                        value = parameterMap.DefaultValue;
                    }
                    else if (parameterMap.Required == true)
                    {
                        throw new InvalidOperationException($"ParameterMap - {parameterMap.Name}에 대한 매핑 정보 필요");
                    }
                    else
                    {
                        value = null;
                    }
                }

                AddParameterAliases(result, parameterMap.Name, value);
            }

            return result;
        }

        private static bool TryGetParameterValue(List<DynamicParameter> parameters, string parameterName, out object? value)
        {
            value = null;
            var normalizedName = NormalizeParameterName(parameterName);
            var parameter = parameters.FirstOrDefault(item =>
                item.ParameterName.Equals(parameterName, StringComparison.OrdinalIgnoreCase) ||
                NormalizeParameterName(item.ParameterName).Equals(normalizedName, StringComparison.OrdinalIgnoreCase));
            if (parameter == null)
            {
                return false;
            }

            value = parameter.Value;
            return true;
        }

        private static void AddParameterAliases(Dictionary<string, object?> parameters, string parameterName, object? value)
        {
            if (string.IsNullOrWhiteSpace(parameterName))
            {
                return;
            }

            parameters[parameterName] = value;
            parameters[NormalizeParameterName(parameterName)] = value;
        }

        private static string NormalizeParameterName(string parameterName)
        {
            return parameterName.Trim().TrimStart('@', '#', '$');
        }

        private async Task<CommandExecutionResult> ExecuteCliAsync(CommandMap commandMap, Dictionary<string, object?> parameters)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new CommandExecutionResult
            {
                CommandID = commandMap.CommandID,
                Type = "CLI"
            };

            var executablePath = ResolveExecutablePath(ApplyTemplate(commandMap.ExecutablePath, parameters));
            if (string.IsNullOrWhiteSpace(executablePath))
            {
                throw new InvalidOperationException($"CommandID - {commandMap.CommandID} executable 확인 필요");
            }

            var arguments = ApplyTemplate(commandMap.Arguments, parameters);
            var workingDirectory = ResolveDirectoryPath(ApplyTemplate(commandMap.WorkingDirectory, parameters));

            using var process = new Process();
            process.StartInfo = new ProcessStartInfo
            {
                FileName = executablePath,
                Arguments = arguments,
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            foreach (var environmentVariable in commandMap.EnvironmentVariables)
            {
                var key = ApplyTemplate(environmentVariable.Key, parameters);
                var value = ApplyTemplate(environmentVariable.Value, parameters);
                if (!string.IsNullOrWhiteSpace(key))
                {
                    process.StartInfo.Environment[key] = value;
                }
            }

            var timeout = GetTimeout(commandMap);
            using var timeoutTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(timeout));
            Task<string>? outputTask = null;
            Task<string>? errorTask = null;
            try
            {
                if (process.Start() == false)
                {
                    throw new InvalidOperationException($"CommandID - {commandMap.CommandID} CLI 프로세스 시작 오류");
                }

                outputTask = process.StandardOutput.ReadToEndAsync();
                errorTask = process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync(timeoutTokenSource.Token);

                result.ExitCode = process.ExitCode;
                result.StandardOutput = Truncate(await outputTask, commandMap.MaxOutputBytes);
                result.StandardError = Truncate(await errorTask, commandMap.MaxOutputBytes);
            }
            catch (OperationCanceledException)
            {
                TryKillProcess(process);
                result.ExitCode = null;
                result.StandardOutput = outputTask == null ? "" : Truncate(await outputTask, commandMap.MaxOutputBytes);
                var stderr = errorTask == null ? "" : Truncate(await errorTask, commandMap.MaxOutputBytes);
                result.StandardError = string.IsNullOrWhiteSpace(stderr) ? $"Timeout after {timeout} seconds" : $"Timeout after {timeout} seconds. {stderr}";
            }
            finally
            {
                stopwatch.Stop();
                result.ElapsedMS = stopwatch.ElapsedMilliseconds;
            }

            return result;
        }

        private async Task<CommandExecutionResult> ExecuteHttpAsync(CommandMap commandMap, Dictionary<string, object?> parameters)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new CommandExecutionResult
            {
                CommandID = commandMap.CommandID,
                Type = "HTTP"
            };

            var method = new HttpMethod(string.IsNullOrWhiteSpace(commandMap.Method) ? "GET" : commandMap.Method);
            var url = ApplyTemplate(commandMap.Url, parameters);
            if (string.IsNullOrWhiteSpace(url))
            {
                throw new InvalidOperationException($"CommandID - {commandMap.CommandID} url 확인 필요");
            }

            url = AppendQueryParameters(url, commandMap.QueryParameters, parameters);
            url = AppendAuthorizationQueryParameter(url, commandMap.Authorization, parameters);

            using var request = new HttpRequestMessage(method, url);
            request.Content = CreateHttpContent(commandMap, parameters, method);
            ApplyAuthorizationHeader(request, commandMap.Authorization, parameters);

            foreach (var header in commandMap.Headers)
            {
                var key = ApplyTemplate(header.Key, parameters);
                var value = ApplyTemplate(header.Value, parameters);
                AddHeader(request, key, value);
            }

            var timeout = GetTimeout(commandMap);
            using var timeoutTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(timeout));
            var httpClient = httpClientFactory.CreateClient(ModuleConfiguration.ModuleID);
            try
            {
                using var response = await httpClient.SendAsync(request, timeoutTokenSource.Token);
                result.StatusCode = (int)response.StatusCode;
                result.ReasonPhrase = response.ReasonPhrase ?? "";
                foreach (var header in response.Headers)
                {
                    result.Headers[header.Key] = string.Join(",", header.Value);
                }

                foreach (var header in response.Content.Headers)
                {
                    result.Headers[header.Key] = string.Join(",", header.Value);
                }

                result.ResponseContent = Truncate(await response.Content.ReadAsStringAsync(timeoutTokenSource.Token), commandMap.MaxOutputBytes);
            }
            finally
            {
                stopwatch.Stop();
                result.ElapsedMS = stopwatch.ElapsedMilliseconds;
            }

            return result;
        }

        private static string AppendQueryParameters(string url, Dictionary<string, string> queryParameters, Dictionary<string, object?> parameters)
        {
            if (queryParameters.Count == 0)
            {
                return url;
            }

            var values = new List<KeyValuePair<string, string>>();
            foreach (var queryParameter in queryParameters)
            {
                var key = ApplyTemplate(queryParameter.Key, parameters);
                if (string.IsNullOrWhiteSpace(key) == true)
                {
                    continue;
                }

                values.Add(new KeyValuePair<string, string>(key, ApplyTemplate(queryParameter.Value, parameters)));
            }

            return AppendQueryPairs(url, values);
        }

        private static string AppendAuthorizationQueryParameter(string url, CommandAuthorizationMap authorization, Dictionary<string, object?> parameters)
        {
            if (authorization == null ||
                authorization.Type.Equals("ApiKey", StringComparison.OrdinalIgnoreCase) == false ||
                authorization.In.Equals("Query", StringComparison.OrdinalIgnoreCase) == false)
            {
                return url;
            }

            var key = ApplyTemplate(authorization.Name, parameters);
            var value = ApplyTemplate(authorization.Value, parameters);
            if (string.IsNullOrWhiteSpace(key) == true)
            {
                return url;
            }

            return AppendQueryPairs(url, new[] { new KeyValuePair<string, string>(key, value) });
        }

        private static string AppendQueryPairs(string url, IEnumerable<KeyValuePair<string, string>> values)
        {
            var query = string.Join("&", values
                .Where(item => string.IsNullOrWhiteSpace(item.Key) == false)
                .Select(item => $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value.ToStringSafe())}"));
            if (string.IsNullOrWhiteSpace(query) == true)
            {
                return url;
            }

            var separator = url.Contains('?') == true
                ? (url.EndsWith("?") == true || url.EndsWith("&") == true ? "" : "&")
                : "?";
            return url + separator + query;
        }

        private static HttpContent? CreateHttpContent(CommandMap commandMap, Dictionary<string, object?> parameters, HttpMethod method)
        {
            var hasRawBody = string.IsNullOrWhiteSpace(commandMap.Body) == false;
            var hasBodyParts = commandMap.BodyParts.Count > 0;
            if (hasRawBody == false && hasBodyParts == false)
            {
                return null;
            }

            if (method == HttpMethod.Get || method == HttpMethod.Head)
            {
                throw new InvalidOperationException($"CommandID - {commandMap.CommandID} {method.Method} 요청은 body를 지원하지 않습니다");
            }

            var bodyType = string.IsNullOrWhiteSpace(commandMap.BodyType) ? "raw" : commandMap.BodyType;
            if (bodyType.Equals("form-data", StringComparison.OrdinalIgnoreCase) == true ||
                bodyType.Equals("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var multipart = new MultipartFormDataContent();
                foreach (var part in commandMap.BodyParts)
                {
                    AddMultipartPart(multipart, part, parameters);
                }

                return multipart;
            }

            var body = ApplyTemplate(commandMap.Body, parameters);
            return string.IsNullOrWhiteSpace(body) == true
                ? null
                : new StringContent(body, Encoding.UTF8, string.IsNullOrWhiteSpace(commandMap.ContentType) ? "application/json" : commandMap.ContentType);
        }

        private static void AddMultipartPart(MultipartFormDataContent multipart, CommandBodyPartMap part, Dictionary<string, object?> parameters)
        {
            var name = ApplyTemplate(part.Name, parameters);
            if (string.IsNullOrWhiteSpace(name) == true)
            {
                return;
            }

            var partType = string.IsNullOrWhiteSpace(part.Type) ? "text" : part.Type;
            if (partType.Equals("file", StringComparison.OrdinalIgnoreCase) == true)
            {
                var fileName = ApplyTemplate(part.FileName, parameters);
                var contentType = ApplyTemplate(part.ContentType, parameters);
                var path = ResolveFilePath(ApplyTemplate(part.Path, parameters));
                HttpContent content;
                if (string.IsNullOrWhiteSpace(path) == false)
                {
                    if (File.Exists(path) == false)
                    {
                        throw new FileNotFoundException($"form-data file path 확인 필요: {path}", path);
                    }

                    content = new StreamContent(File.OpenRead(path));
                    if (string.IsNullOrWhiteSpace(fileName) == true)
                    {
                        fileName = System.IO.Path.GetFileName(path);
                    }
                }
                else
                {
                    var base64 = ApplyTemplate(part.Base64, parameters);
                    if (string.IsNullOrWhiteSpace(base64) == true)
                    {
                        base64 = ApplyTemplate(part.Value, parameters);
                    }

                    if (string.IsNullOrWhiteSpace(base64) == true)
                    {
                        throw new InvalidOperationException($"form-data file part - {name} base64 또는 path 확인 필요");
                    }

                    content = new ByteArrayContent(Convert.FromBase64String(base64));
                    if (string.IsNullOrWhiteSpace(fileName) == true)
                    {
                        fileName = name;
                    }
                }

                if (string.IsNullOrWhiteSpace(contentType) == false)
                {
                    content.Headers.TryAddWithoutValidation("Content-Type", contentType);
                }

                multipart.Add(content, name, fileName);
                return;
            }

            var value = ApplyTemplate(part.Value, parameters);
            var textContent = string.IsNullOrWhiteSpace(part.ContentType) == true
                ? new StringContent(value, Encoding.UTF8)
                : new StringContent(value, Encoding.UTF8, ApplyTemplate(part.ContentType, parameters));
            multipart.Add(textContent, name);
        }

        private static void ApplyAuthorizationHeader(HttpRequestMessage request, CommandAuthorizationMap authorization, Dictionary<string, object?> parameters)
        {
            if (authorization == null || string.IsNullOrWhiteSpace(authorization.Type) == true)
            {
                return;
            }

            var type = authorization.Type.Replace("-", "").Replace(" ", "");
            if (type.Equals("Basic", StringComparison.OrdinalIgnoreCase) == true)
            {
                var username = ApplyTemplate(authorization.Username, parameters);
                var password = ApplyTemplate(authorization.Password, parameters);
                var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                SetAuthorizationHeader(request, "Basic", token);
                return;
            }

            if (type.Equals("Bearer", StringComparison.OrdinalIgnoreCase) == true ||
                type.Equals("JwtBearer", StringComparison.OrdinalIgnoreCase) == true)
            {
                var token = ApplyTemplate(authorization.Value, parameters);
                if (string.IsNullOrWhiteSpace(token) == false)
                {
                    SetAuthorizationHeader(request, "Bearer", token);
                }

                return;
            }

            if (type.Equals("ApiKey", StringComparison.OrdinalIgnoreCase) == true &&
                authorization.In.Equals("Query", StringComparison.OrdinalIgnoreCase) == false)
            {
                AddHeader(request, ApplyTemplate(authorization.Name, parameters), ApplyTemplate(authorization.Value, parameters));
            }
        }

        private static void SetAuthorizationHeader(HttpRequestMessage request, string scheme, string value)
        {
            request.Headers.Remove("Authorization");
            request.Headers.TryAddWithoutValidation("Authorization", $"{scheme} {value}");
        }

        private static void AddHeader(HttpRequestMessage request, string key, string value)
        {
            if (string.IsNullOrWhiteSpace(key) == true)
            {
                return;
            }

            if (key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase) == true && request.Content != null)
            {
                request.Content.Headers.Remove("Content-Type");
                request.Content.Headers.TryAddWithoutValidation("Content-Type", value);
                return;
            }

            if (request.Headers.TryAddWithoutValidation(key, value) == false && request.Content != null)
            {
                request.Content.Headers.TryAddWithoutValidation(key, value);
            }
        }

        private static int GetTimeout(CommandMap commandMap)
        {
            var timeout = commandMap.Timeout > 0 ? commandMap.Timeout : ModuleConfiguration.DefaultCommandTimeout;
            return timeout <= 0 ? 30 : timeout;
        }

        private static string ResolveExecutablePath(string executablePath)
        {
            if (string.IsNullOrWhiteSpace(executablePath))
            {
                return "";
            }

            if (executablePath.IndexOf('/') == -1 && executablePath.IndexOf('\\') == -1)
            {
                return executablePath;
            }

            return Path.IsPathRooted(executablePath) ? executablePath : GlobalConfiguration.GetBaseDirectoryPath(executablePath);
        }

        private static string ResolveDirectoryPath(string workingDirectory)
        {
            if (string.IsNullOrWhiteSpace(workingDirectory))
            {
                return Directory.GetCurrentDirectory();
            }

            return Path.IsPathRooted(workingDirectory) ? workingDirectory : GlobalConfiguration.GetBaseDirectoryPath(workingDirectory);
        }

        private static string ResolveFilePath(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return "";
            }

            return Path.IsPathRooted(filePath) ? filePath : GlobalConfiguration.GetBaseDirectoryPath(filePath);
        }

        private static string ApplyTemplate(string template, Dictionary<string, object?> parameters)
        {
            if (string.IsNullOrWhiteSpace(template))
            {
                return template.ToStringSafe();
            }

            return parameterRegex.Replace(template, match =>
            {
                var isLegacy = match.Groups["legacyKind"].Success;
                var kind = isLegacy == true ? match.Groups["legacyKind"].Value : match.Groups["kind"].Value;
                var name = isLegacy == true ? match.Groups["legacyName"].Value : match.Groups["name"].Value;
                if (parameters.TryGetValue(name, out var value) == false)
                {
                    return "";
                }

                var text = value.ToStringSafe();
                if (kind == "#")
                {
                    return isLegacy == true ? EscapeTemplateValue(text) : QuoteTemplateValue(text);
                }

                return text;
            });
        }

        private static string QuoteTemplateValue(string value)
        {
            return "\"" + EscapeTemplateValue(value) + "\"";
        }

        private static string EscapeTemplateValue(string value)
        {
            return value
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\r", "\\r")
                .Replace("\n", "\\n")
                .Replace("\t", "\\t");
        }

        private static string Truncate(string value, int maxOutputBytes)
        {
            var maxBytes = maxOutputBytes > 0 ? maxOutputBytes : ModuleConfiguration.DefaultMaxOutputBytes;
            if (maxBytes <= 0)
            {
                return value;
            }

            var bytes = Encoding.UTF8.GetBytes(value);
            if (bytes.Length <= maxBytes)
            {
                return value;
            }

            return Encoding.UTF8.GetString(bytes.Take(maxBytes).ToArray()) + $"... [truncated {bytes.Length - maxBytes} bytes]";
        }

        private static void TryKillProcess(Process process)
        {
            try
            {
                if (process.HasExited == false)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch
            {
            }
        }

        public void Dispose()
        {
        }
    }
}
