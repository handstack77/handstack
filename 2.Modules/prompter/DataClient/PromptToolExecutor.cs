using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Entity;
using prompter.KernelPlugin;

using Serilog;

namespace prompter.DataClient
{
    public class PromptToolExecutor
    {
        private static readonly Dictionary<string, Type> KernelPlugins = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            ["math"] = typeof(MathPlugin),
            ["time"] = typeof(TimePlugin),
            ["text"] = typeof(TextPlugin)
        };

        public List<LLMToolDefinition> BuildTools(PromptMap promptMap, ILogger logger)
        {
            var result = new List<LLMToolDefinition>();
            if (promptMap.Tools.Mode == "none" || promptMap.Tools.Items.Count == 0)
            {
                return result;
            }

            foreach (var item in promptMap.Tools.Items)
            {
                switch (item.Kind)
                {
                    case "kernel":
                        AddKernelTools(item, result, logger);
                        break;
                    case "cli":
                        AddExternalTool(item, ModuleConfiguration.AllowedCliTools, "cli", result, logger);
                        break;
                    case "mcp":
                        AddExternalTool(item, ModuleConfiguration.AllowedMcpServers, "mcp", result, logger);
                        break;
                }
            }

            return result;
        }

        public async Task<string> ExecuteAsync(LLMToolCall toolCall, IReadOnlyList<LLMToolDefinition> tools, ILogger logger, CancellationToken cancellationToken)
        {
            var tool = tools.FirstOrDefault(item => item.FunctionName == toolCall.FunctionName);
            if (tool == null)
            {
                throw new InvalidOperationException($"허용되지 않은 tool 호출 차단: {toolCall.FunctionName}");
            }

            switch (tool.Source)
            {
                case KernelToolBinding kernelTool:
                    return ExecuteKernelTool(kernelTool, toolCall.Arguments);
                case ExternalToolBinding externalTool when externalTool.Kind == "cli":
                    return await ExecuteCliToolAsync(externalTool, cancellationToken);
                case ExternalToolBinding externalTool when externalTool.Kind == "mcp":
                    return await ExecuteMcpToolAsync(externalTool, toolCall.Arguments, cancellationToken);
                default:
                    throw new InvalidOperationException($"tool 실행 바인딩 확인 필요: {toolCall.FunctionName}");
            }
        }

        private static void AddKernelTools(PromptToolDeclaration declaration, List<LLMToolDefinition> tools, ILogger logger)
        {
            if (KernelPlugins.TryGetValue(declaration.Name, out var pluginType) == false)
            {
                logger.Warning("[{LogCategory}] " + $"KernelPlugin 미지원: {declaration.Name}", "PromptToolExecutor/AddKernelTools");
                return;
            }

            var allowedPlugin = ModuleConfiguration.AllowedKernelPlugins.FirstOrDefault(item =>
                string.Equals(item.Name, declaration.Name, StringComparison.OrdinalIgnoreCase));
            if (allowedPlugin == null)
            {
                logger.Warning("[{LogCategory}] " + $"KernelPlugin allowlist 없음: {declaration.Name}", "PromptToolExecutor/AddKernelTools");
                return;
            }

            var declaredFunctions = declaration.Functions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var declaredFunction in declaredFunctions)
            {
                if (allowedPlugin.Functions.Any(item => string.Equals(item, declaredFunction, StringComparison.OrdinalIgnoreCase)) == false)
                {
                    logger.Warning("[{LogCategory}] " + $"KernelPlugin function allowlist 불일치: {declaration.Name}.{declaredFunction}", "PromptToolExecutor/AddKernelTools");
                    continue;
                }

                var method = pluginType.GetMethods(BindingFlags.Instance | BindingFlags.Public)
                    .FirstOrDefault(item => string.Equals(item.Name, declaredFunction, StringComparison.OrdinalIgnoreCase));
                if (method == null)
                {
                    logger.Warning("[{LogCategory}] " + $"KernelPlugin function 없음: {declaration.Name}.{declaredFunction}", "PromptToolExecutor/AddKernelTools");
                    continue;
                }

                tools.Add(new LLMToolDefinition
                {
                    Kind = "kernel",
                    FunctionName = SanitizeFunctionName($"kernel_{declaration.Name}_{method.Name}"),
                    DisplayName = $"{declaration.Name}.{method.Name}",
                    Description = GetDescription(method),
                    Parameters = BuildParameterSchema(method),
                    Source = new KernelToolBinding(declaration.Name, method.Name, pluginType, method)
                });
            }
        }

        private static void AddExternalTool(PromptToolDeclaration declaration, List<AllowedExternalTool> allowlist, string kind, List<LLMToolDefinition> tools, ILogger logger)
        {
            if (IsExternalToolAllowed(declaration, allowlist, out var allowed, out var reason) == false || allowed == null)
            {
                logger.Warning("[{LogCategory}] " + $"{kind} tool 차단: {declaration.Name}, {reason}", "PromptToolExecutor/AddExternalTool");
                return;
            }

            var functionName = SanitizeFunctionName($"{kind}_{declaration.Name}");
            var schema = kind == "mcp" ? BuildMcpToolSchema() : BuildCliToolSchema();
            tools.Add(new LLMToolDefinition
            {
                Kind = kind,
                FunctionName = functionName,
                DisplayName = declaration.Name,
                Description = kind == "mcp"
                    ? $"{declaration.Name} MCP server tool call"
                    : $"{declaration.Name} CLI command",
                Parameters = schema,
                Source = new ExternalToolBinding
                {
                    Kind = kind,
                    Name = declaration.Name,
                    Command = declaration.Command,
                    Args = SplitToolArgs(declaration.Args),
                    WorkingDirectory = allowed.WorkingDirectory,
                    Timeout = declaration.Timeout > 0 ? declaration.Timeout : allowed.Timeout
                }
            });
        }

        private static bool IsExternalToolAllowed(PromptToolDeclaration declaration, List<AllowedExternalTool> allowlist, out AllowedExternalTool? allowed, out string reason)
        {
            allowed = allowlist.FirstOrDefault(item => string.Equals(item.Name, declaration.Name, StringComparison.OrdinalIgnoreCase));
            if (allowed == null)
            {
                reason = "name allowlist 없음";
                return false;
            }

            if (string.IsNullOrWhiteSpace(allowed.CommandPrefix) == true ||
                declaration.Command.StartsWith(allowed.CommandPrefix, StringComparison.OrdinalIgnoreCase) == false)
            {
                reason = "command prefix 불일치";
                return false;
            }

            if (string.IsNullOrWhiteSpace(allowed.ArgsPrefix) == false &&
                declaration.Args.StartsWith(allowed.ArgsPrefix, StringComparison.OrdinalIgnoreCase) == false)
            {
                reason = "args prefix 불일치";
                return false;
            }

            reason = "";
            return true;
        }

        private static string ExecuteKernelTool(KernelToolBinding binding, string arguments)
        {
            JObject args;
            try
            {
                args = string.IsNullOrWhiteSpace(arguments) == true ? new JObject() : JObject.Parse(arguments);
            }
            catch
            {
                args = new JObject();
            }

            var instance = Activator.CreateInstance(binding.PluginType);
            var values = new List<object?>();
            var executableParameters = GetExecutableParameters(binding.Method).ToList();
            foreach (var parameter in binding.Method.GetParameters())
            {
                if (IsSkippedParameter(parameter) == true)
                {
                    values.Add(parameter.HasDefaultValue ? parameter.DefaultValue : null);
                    continue;
                }

                JToken? token = args[parameter.Name.ToStringSafe()];
                if (token == null && executableParameters.Count == 1)
                {
                    token = args["input"] ?? args["value"] ?? args.Properties().FirstOrDefault()?.Value;
                }

                if (token == null)
                {
                    values.Add(parameter.HasDefaultValue ? parameter.DefaultValue : GetDefaultValue(parameter.ParameterType));
                    continue;
                }

                values.Add(token.ToObject(parameter.ParameterType));
            }

            var value = binding.Method.Invoke(instance, values.ToArray());
            return value.ToStringSafe();
        }

        private static async Task<string> ExecuteCliToolAsync(ExternalToolBinding binding, CancellationToken cancellationToken)
        {
            var timeout = binding.Timeout <= 0 ? 10 : binding.Timeout;
            using var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutTokenSource.CancelAfter(TimeSpan.FromSeconds(timeout));

            var processStartInfo = new ProcessStartInfo
            {
                FileName = binding.Command,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            if (string.IsNullOrWhiteSpace(binding.WorkingDirectory) == false)
            {
                processStartInfo.WorkingDirectory = binding.WorkingDirectory;
            }

            foreach (var arg in binding.Args)
            {
                processStartInfo.ArgumentList.Add(arg);
            }

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();
            var outputTask = process.StandardOutput.ReadToEndAsync(timeoutTokenSource.Token);
            var errorTask = process.StandardError.ReadToEndAsync(timeoutTokenSource.Token);
            try
            {
                await process.WaitForExitAsync(timeoutTokenSource.Token);
            }
            catch (OperationCanceledException)
            {
                try
                {
                    process.Kill(true);
                }
                catch
                {
                }

                throw new TimeoutException($"CLI tool timeout: {binding.Name}, timeout={timeout}s");
            }

            var output = await outputTask;
            var error = await errorTask;
            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException($"CLI tool non-zero exit: {binding.Name}, exitCode={process.ExitCode}, stderr={error}");
            }

            return string.IsNullOrWhiteSpace(error) == true ? output : output + Environment.NewLine + error;
        }

        private static async Task<string> ExecuteMcpToolAsync(ExternalToolBinding binding, string arguments, CancellationToken cancellationToken)
        {
            JObject args;
            try
            {
                args = string.IsNullOrWhiteSpace(arguments) == true ? new JObject() : JObject.Parse(arguments);
            }
            catch
            {
                args = new JObject();
            }

            var toolName = args["tool"]?.ToStringSafe();
            if (string.IsNullOrWhiteSpace(toolName) == true)
            {
                throw new InvalidOperationException($"MCP tool 호출에는 tool 인자가 필요합니다: {binding.Name}");
            }

            var toolArguments = args["arguments"] as JObject ?? new JObject();
            return await ExecuteMcpJsonRpcAsync(binding, toolName, toolArguments, cancellationToken);
        }

        private static async Task<string> ExecuteMcpJsonRpcAsync(ExternalToolBinding binding, string toolName, JObject toolArguments, CancellationToken cancellationToken)
        {
            var timeout = binding.Timeout <= 0 ? 10 : binding.Timeout;
            using var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutTokenSource.CancelAfter(TimeSpan.FromSeconds(timeout));

            var processStartInfo = new ProcessStartInfo
            {
                FileName = binding.Command,
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            if (string.IsNullOrWhiteSpace(binding.WorkingDirectory) == false)
            {
                processStartInfo.WorkingDirectory = binding.WorkingDirectory;
            }

            foreach (var arg in binding.Args)
            {
                processStartInfo.ArgumentList.Add(arg);
            }

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();
            var errorTask = process.StandardError.ReadToEndAsync(timeoutTokenSource.Token);

            try
            {
                await WriteMcpMessageAsync(process.StandardInput.BaseStream, new JObject
                {
                    ["jsonrpc"] = "2.0",
                    ["id"] = 1,
                    ["method"] = "initialize",
                    ["params"] = new JObject
                    {
                        ["protocolVersion"] = "2024-11-05",
                        ["capabilities"] = new JObject(),
                        ["clientInfo"] = new JObject
                        {
                            ["name"] = "handstack-prompter",
                            ["version"] = "1.0.0"
                        }
                    }
                }, timeoutTokenSource.Token);
                await ReadMcpMessageAsync(process.StandardOutput.BaseStream, timeoutTokenSource.Token);
                await WriteMcpMessageAsync(process.StandardInput.BaseStream, new JObject
                {
                    ["jsonrpc"] = "2.0",
                    ["method"] = "notifications/initialized"
                }, timeoutTokenSource.Token);

                await WriteMcpMessageAsync(process.StandardInput.BaseStream, new JObject
                {
                    ["jsonrpc"] = "2.0",
                    ["id"] = 2,
                    ["method"] = "tools/call",
                    ["params"] = new JObject
                    {
                        ["name"] = toolName,
                        ["arguments"] = toolArguments
                    }
                }, timeoutTokenSource.Token);

                var response = await ReadMcpMessageAsync(process.StandardOutput.BaseStream, timeoutTokenSource.Token);
                try
                {
                    process.Kill(true);
                }
                catch
                {
                }

                if (response["error"] != null)
                {
                    throw new InvalidOperationException($"MCP tool error: {response["error"]?.ToString(Formatting.None)}");
                }

                return response["result"]?.ToString(Formatting.None) ?? "";
            }
            catch (OperationCanceledException)
            {
                try
                {
                    process.Kill(true);
                }
                catch
                {
                }

                var error = await SafeReadErrorAsync(errorTask);
                throw new TimeoutException($"MCP tool timeout: {binding.Name}, timeout={timeout}s, stderr={error}");
            }
        }

        private static async Task WriteMcpMessageAsync(Stream stream, JObject message, CancellationToken cancellationToken)
        {
            var payload = Encoding.UTF8.GetBytes(message.ToString(Formatting.None));
            var header = Encoding.ASCII.GetBytes($"Content-Length: {payload.Length}\r\n\r\n");
            await stream.WriteAsync(header, cancellationToken);
            await stream.WriteAsync(payload, cancellationToken);
            await stream.FlushAsync(cancellationToken);
        }

        private static async Task<JObject> ReadMcpMessageAsync(Stream stream, CancellationToken cancellationToken)
        {
            var headers = new List<string>();
            while (true)
            {
                var line = await ReadAsciiLineAsync(stream, cancellationToken);
                if (line == "")
                {
                    break;
                }

                headers.Add(line);
            }

            var lengthHeader = headers.FirstOrDefault(item => item.StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase));
            if (lengthHeader == null)
            {
                throw new InvalidOperationException("MCP response Content-Length 확인 필요");
            }

            var length = int.Parse(lengthHeader.Substring("Content-Length:".Length).Trim(), CultureInfo.InvariantCulture);
            var buffer = new byte[length];
            var offset = 0;
            while (offset < length)
            {
                var read = await stream.ReadAsync(buffer.AsMemory(offset, length - offset), cancellationToken);
                if (read == 0)
                {
                    throw new EndOfStreamException("MCP response stream 종료");
                }

                offset += read;
            }

            return JObject.Parse(Encoding.UTF8.GetString(buffer));
        }

        private static async Task<string> ReadAsciiLineAsync(Stream stream, CancellationToken cancellationToken)
        {
            var bytes = new List<byte>();
            while (true)
            {
                var buffer = new byte[1];
                var read = await stream.ReadAsync(buffer.AsMemory(0, 1), cancellationToken);
                if (read == 0)
                {
                    throw new EndOfStreamException("MCP header stream 종료");
                }

                if (buffer[0] == '\n')
                {
                    break;
                }

                if (buffer[0] != '\r')
                {
                    bytes.Add(buffer[0]);
                }
            }

            return Encoding.ASCII.GetString(bytes.ToArray());
        }

        private static async Task<string> SafeReadErrorAsync(Task<string> errorTask)
        {
            try
            {
                return await errorTask;
            }
            catch
            {
                return "";
            }
        }

        private static string[] SplitToolArgs(string args)
        {
            return args.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        private static string SanitizeFunctionName(string value)
        {
            var builder = new StringBuilder(value.Length);
            foreach (var ch in value)
            {
                builder.Append(char.IsLetterOrDigit(ch) || ch == '_' ? ch : '_');
            }

            return builder.ToString();
        }

        private static string GetDescription(MethodInfo method)
        {
            var description = method.GetCustomAttribute<DescriptionAttribute>()?.Description;
            return string.IsNullOrWhiteSpace(description) == true ? method.Name : description;
        }

        private static JObject BuildParameterSchema(MethodInfo method)
        {
            var properties = new JObject();
            var required = new JArray();
            foreach (var parameter in GetExecutableParameters(method))
            {
                properties[parameter.Name.ToStringSafe()] = new JObject
                {
                    ["type"] = ToJsonSchemaType(parameter.ParameterType),
                    ["description"] = parameter.GetCustomAttribute<DescriptionAttribute>()?.Description ?? parameter.Name.ToStringSafe()
                };

                if (parameter.HasDefaultValue == false)
                {
                    required.Add(parameter.Name.ToStringSafe());
                }
            }

            return new JObject
            {
                ["type"] = "object",
                ["properties"] = properties,
                ["required"] = required
            };
        }

        private static JObject BuildCliToolSchema()
        {
            return new JObject
            {
                ["type"] = "object",
                ["properties"] = new JObject
                {
                    ["args"] = new JObject
                    {
                        ["type"] = "string",
                        ["description"] = "Optional argument note. The configured contract args are executed."
                    }
                }
            };
        }

        private static JObject BuildMcpToolSchema()
        {
            return new JObject
            {
                ["type"] = "object",
                ["properties"] = new JObject
                {
                    ["tool"] = new JObject
                    {
                        ["type"] = "string",
                        ["description"] = "MCP tool name to call on the declared server."
                    },
                    ["arguments"] = new JObject
                    {
                        ["type"] = "object",
                        ["description"] = "MCP tool arguments."
                    }
                },
                ["required"] = new JArray("tool")
            };
        }

        private static IEnumerable<ParameterInfo> GetExecutableParameters(MethodInfo method)
        {
            return method.GetParameters().Where(parameter => IsSkippedParameter(parameter) == false);
        }

        private static bool IsSkippedParameter(ParameterInfo parameter)
        {
            return parameter.ParameterType == typeof(IFormatProvider)
                || parameter.ParameterType == typeof(CultureInfo);
        }

        private static string ToJsonSchemaType(Type type)
        {
            var actualType = Nullable.GetUnderlyingType(type) ?? type;
            if (actualType == typeof(int) || actualType == typeof(long) || actualType == typeof(short) || actualType == typeof(byte))
            {
                return "integer";
            }

            if (actualType == typeof(double) || actualType == typeof(decimal) || actualType == typeof(float))
            {
                return "number";
            }

            if (actualType == typeof(bool))
            {
                return "boolean";
            }

            return "string";
        }

        private static object? GetDefaultValue(Type type)
        {
            return type.IsValueType == true ? Activator.CreateInstance(type) : null;
        }
    }

    internal record KernelToolBinding(string PluginName, string FunctionName, Type PluginType, MethodInfo Method);

    internal record ExternalToolBinding
    {
        public string Kind { get; set; } = "";

        public string Name { get; set; } = "";

        public string Command { get; set; } = "";

        public string[] Args { get; set; } = Array.Empty<string>();

        public string WorkingDirectory { get; set; } = "";

        public int Timeout { get; set; } = 10;
    }
}
