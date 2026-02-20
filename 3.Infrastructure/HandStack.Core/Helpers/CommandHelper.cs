using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Core.Helpers
{
    /// <summary>
    /// 배치 명령을 수행후 표준 출력값을 반환
    /// </summary>
    /// <code>
    /// var executeResult = CommandHelper.RunScript($"uglifyjs --compress --mangle --output {minifyFilePath} -- {outputFileName}");
    /// </code>
    public static class CommandHelper
    {
        public static Dictionary<string, string> EnvironmentVariables { get; set; } = new Dictionary<string, string>();

        public static int SuccessExitCode { get; set; } = 0;

        public static bool IsShowCommand { get; set; } = false;

        // var scriptsResult = CommandHelper.RunScript(scripts, false, true, true, true, workingDirectory);
        public static List<Tuple<int, string?, string?>> RunScript(string script, bool useShellExecute = false, bool redirectStandardError = false, bool redirectStandardOutput = false, bool createNoWindow = true, string? workingDirectory = null, bool? ignoreExitCode = false, string? echoPrefix = null)
        {
            var result = new List<Tuple<int, string?, string?>>();
            if (!string.IsNullOrEmpty(script))
            {
                var executeCommands = new List<string>();
                var scripts = script.Split(Environment.NewLine);
                foreach (var item in scripts)
                {
                    var command = item.Trim();
                    if (!string.IsNullOrEmpty(command))
                    {
                        executeCommands.Add(command);
                    }
                }

                foreach (var item in executeCommands)
                {
                    using var process = new Process();
                    process.StartInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                        ? new ProcessStartInfo
                        {
                            FileName = "cmd",
                            Arguments = $"/c \"{item}\"",
                            WorkingDirectory = workingDirectory,
                            UseShellExecute = useShellExecute,
                            RedirectStandardError = redirectStandardError,
                            RedirectStandardOutput = redirectStandardOutput,
                            CreateNoWindow = createNoWindow

                        }
                        : new ProcessStartInfo
                        {
                            FileName = "/bin/bash",
                            Arguments = $"-c \"{item}\"",
                            WorkingDirectory = workingDirectory,
                            UseShellExecute = useShellExecute,
                            RedirectStandardError = redirectStandardError,
                            RedirectStandardOutput = redirectStandardOutput,
                            CreateNoWindow = createNoWindow
                        };

                    foreach (var variable in EnvironmentVariables)
                    {
                        process.StartInfo.EnvironmentVariables[variable.Key] = variable.Value;
                    }

                    process.Run(IsShowCommand, echoPrefix ?? DefaultPrefix.Value);

                    var output = redirectStandardOutput == true ? process.StandardOutput.ReadToEnd() : null;
                    var error = redirectStandardError == true ? process.StandardError.ReadToEnd() : null;

                    process.WaitForExit();

                    var exitCode = process.ExitCode;

                    result.Add(new Tuple<int, string?, string?>(exitCode
                        , output
                        , error
                    ));

                    if (ignoreExitCode == false && exitCode != SuccessExitCode)
                    {
                        break;
                    }
                }
            }

            return result;
        }

        // var scriptsResult = CommandHelper.RunScriptToConsole(scripts, false, true, workingDirectory);
        public static List<int> RunScriptToConsole(string script, bool useShellExecute = false, bool createNoWindow = true, string? workingDirectory = null, bool? ignoreExitCode = false, string? echoPrefix = null)
        {
            var result = new List<int>();
            if (!string.IsNullOrEmpty(script))
            {
                var executeCommands = new List<string>();
                var scripts = script.Split(Environment.NewLine);
                foreach (var item in scripts)
                {
                    var command = item.Trim();
                    if (!string.IsNullOrEmpty(command))
                    {
                        executeCommands.Add(command);
                    }
                }

                foreach (var item in executeCommands)
                {
                    using var process = new Process();
                    process.StartInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                        ? new ProcessStartInfo
                        {
                            FileName = "cmd",
                            Arguments = $"/c \"{item}\"",
                            WorkingDirectory = workingDirectory,
                            UseShellExecute = useShellExecute,
                            RedirectStandardError = true,
                            RedirectStandardOutput = true,
                            CreateNoWindow = createNoWindow

                        }
                        : new ProcessStartInfo
                        {
                            FileName = "/bin/bash",
                            Arguments = $"-c \"{item}\"",
                            WorkingDirectory = workingDirectory,
                            UseShellExecute = useShellExecute,
                            RedirectStandardError = true,
                            RedirectStandardOutput = true,
                            CreateNoWindow = createNoWindow
                        };

                    foreach (var variable in EnvironmentVariables)
                    {
                        process.StartInfo.EnvironmentVariables[variable.Key] = variable.Value;
                    }

                    process.OutputDataReceived += (sender, e) => Console.WriteLine(e.Data);
                    process.ErrorDataReceived += (sender, e) => Console.WriteLine(e.Data);

                    process.Run(IsShowCommand, echoPrefix ?? DefaultPrefix.Value);

                    process.BeginOutputReadLine();
                    process.BeginErrorReadLine();

                    process.WaitForExit();

                    var exitCode = process.ExitCode;

                    result.Add(exitCode);
                    if (ignoreExitCode == false && exitCode != 0)
                    {
                        break;
                    }
                }
            }

            return result;
        }

        // var scriptsResult = CommandHelper.RunScriptToFileLog(scripts, false, true, workingDirectory, "logfile.log");
        public static Tuple<int, string> RunScriptToFileLog(string script, bool useShellExecute = false, bool createNoWindow = true, string? workingDirectory = null, bool? ignoreExitCode = false, string? echoPrefix = null, string? logFilePath = null)
        {
            var result = new Tuple<int, string>(-1, string.Empty);
            if (!string.IsNullOrEmpty(script))
            {
                var executeCommands = new List<string>();
                var scripts = script.Split(Environment.NewLine);
                foreach (var item in scripts)
                {
                    var command = item.Trim();
                    if (!string.IsNullOrEmpty(command))
                    {
                        executeCommands.Add(command);
                    }
                }

                foreach (var item in executeCommands)
                {
                    using var process = new Process();
                    process.StartInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                        ? new ProcessStartInfo
                        {
                            FileName = "cmd",
                            Arguments = $"/c \"{item}\"",
                            WorkingDirectory = workingDirectory,
                            UseShellExecute = useShellExecute,
                            RedirectStandardError = true,
                            RedirectStandardOutput = true,
                            CreateNoWindow = createNoWindow

                        }
                        : new ProcessStartInfo
                        {
                            FileName = "/bin/bash",
                            Arguments = $"-c \"{item}\"",
                            WorkingDirectory = workingDirectory,
                            UseShellExecute = useShellExecute,
                            RedirectStandardError = true,
                            RedirectStandardOutput = true,
                            CreateNoWindow = createNoWindow
                        };

                    foreach (var variable in EnvironmentVariables)
                    {
                        process.StartInfo.EnvironmentVariables[variable.Key] = variable.Value;
                    }

                    var logDirectory = PathExtensions.Combine(workingDirectory ?? Directory.GetCurrentDirectory(), "tasklogs");
                    logFilePath = logFilePath ?? PathExtensions.Combine(logDirectory, (echoPrefix ?? DefaultPrefix.Value).ToStringSafe() + Guid.NewGuid().ToString("N") + ".log");
                    var fileInfo = new FileInfo(logFilePath);
                    if (fileInfo.Directory?.Exists == false)
                    {
                        fileInfo.Directory.Create();
                    }

                    process.OutputDataReceived += (sender, e) =>
                    {
                        using var stream = new FileStream(logFilePath, FileMode.Append, FileAccess.Write, FileShare.Read);
                        using var writer = new StreamWriter(stream);
                        writer.WriteLine(e.Data);
                    };

                    process.ErrorDataReceived += (sender, e) =>
                    {
                        using var stream = new FileStream(logFilePath, FileMode.Append, FileAccess.Write, FileShare.Read);
                        using var writer = new StreamWriter(stream);
                        writer.WriteLine(e.Data);
                    };

                    process.Run(IsShowCommand, echoPrefix ?? DefaultPrefix.Value);

                    process.BeginOutputReadLine();
                    process.BeginErrorReadLine();

                    process.WaitForExit();

                    var exitCode = process.ExitCode;

                    result = new Tuple<int, string>(exitCode, logFilePath);
                    if (ignoreExitCode == false && exitCode != 0)
                    {
                        break;
                    }
                }
            }

            return result;
        }
    }
}

internal static class DefaultPrefix
{
    static DefaultPrefix()
    {
    }

    public static readonly string Value = Assembly.GetEntryAssembly()?.GetName().Name ?? "BatchClient";
}

