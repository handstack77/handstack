using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;

using HandStack.Core.ExtensionMethod;

using static System.Runtime.InteropServices.JavaScript.JSType;

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

        public static bool IsShowCommand { get; set; } = false;

        // var scriptsResult = CommandHelper.RunScript(scripts, false, true, true, true, workingDirectory);
        public static List<Tuple<int, string?, string?>> RunScript(string script, bool useShellExecute = false, bool redirectStandardError = false, bool redirectStandardOutput = false, bool createNoWindow = true, string? workingDirectory = null, bool? ignoreExitCode = false, string? echoPrefix = null)
        {
            List<Tuple<int, string?, string?>> result = new List<Tuple<int, string?, string?>>();
            if (string.IsNullOrEmpty(script) == false)
            {
                List<string> executeCommands = new List<string>();
                string[] scripts = script.Split(Environment.NewLine);
                foreach (string item in scripts)
                {
                    string command = item.Trim();
                    if (string.IsNullOrEmpty(command) == false)
                    {
                        executeCommands.Add(command);
                    }
                }

                foreach (string item in executeCommands)
                {
                    using (var process = new Process())
                    {
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

                        string? output = redirectStandardOutput == true ? process.StandardOutput.ReadToEnd() : null;
                        string? error = redirectStandardError == true ? process.StandardError.ReadToEnd() : null;

                        process.WaitForExit();

                        int exitCode = process.ExitCode;

                        result.Add(new Tuple<int, string?, string?>(exitCode
                            , output
                            , error
                        ));

                        if (ignoreExitCode == false && exitCode != 0)
                        {
                            break;
                        }
                    }
                }
            }

            return result;
        }

        // var scriptsResult = CommandHelper.RunScriptToConsole(scripts, false, true, workingDirectory);
        public static List<int> RunScriptToConsole(string script, bool useShellExecute = false, bool createNoWindow = true, string? workingDirectory = null, bool? ignoreExitCode = false, string? echoPrefix = null)
        {
            List<int> result = new List<int>();
            if (string.IsNullOrEmpty(script) == false)
            {
                List<string> executeCommands = new List<string>();
                string[] scripts = script.Split(Environment.NewLine);
                foreach (string item in scripts)
                {
                    string command = item.Trim();
                    if (string.IsNullOrEmpty(command) == false)
                    {
                        executeCommands.Add(command);
                    }
                }

                foreach (string item in executeCommands)
                {
                    using (var process = new Process())
                    {
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

                        int exitCode = process.ExitCode;

                        result.Add(exitCode);
                        if (ignoreExitCode == false && exitCode != 0)
                        {
                            break;
                        }
                    }
                }
            }

            return result;
        }

        // var scriptsResult = CommandHelper.RunScriptToFileLog(scripts, false, true, workingDirectory, "logfile.log");
        public static Tuple<int, string> RunScriptToFileLog(string script, bool useShellExecute = false, bool createNoWindow = true, string? workingDirectory = null, bool? ignoreExitCode = false, string? echoPrefix = null, string? logFilePath = null)
        {
            Tuple<int, string> result = new Tuple<int, string>(-1, string.Empty);
            if (string.IsNullOrEmpty(script) == false)
            {
                List<string> executeCommands = new List<string>();
                string[] scripts = script.Split(Environment.NewLine);
                foreach (string item in scripts)
                {
                    string command = item.Trim();
                    if (string.IsNullOrEmpty(command) == false)
                    {
                        executeCommands.Add(command);
                    }
                }

                foreach (string item in executeCommands)
                {
                    using (var process = new Process())
                    {
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

                        string logDirectory = Path.Combine(workingDirectory ?? Directory.GetCurrentDirectory(), "tasklogs");
                        logFilePath = logFilePath ?? Path.Combine(logDirectory, (echoPrefix ?? DefaultPrefix.Value).ToStringSafe() + Guid.NewGuid().ToString("N") + ".log");
                        FileInfo fileInfo = new FileInfo(logFilePath);
                        if (fileInfo.Directory?.Exists == false)
                        {
                            fileInfo.Directory.Create();
                        }

                        process.OutputDataReceived += (sender, e) =>
                        {
                            using (FileStream stream = new FileStream(logFilePath, FileMode.Append, FileAccess.Write, FileShare.Read))
                            using (StreamWriter writer = new StreamWriter(stream))
                            {
                                writer.WriteLine(e.Data);
                            }
                        };

                        process.ErrorDataReceived += (sender, e) =>
                        {
                            using (FileStream stream = new FileStream(logFilePath, FileMode.Append, FileAccess.Write, FileShare.Read))
                            using (StreamWriter writer = new StreamWriter(stream))
                            {
                                writer.WriteLine(e.Data);
                            }
                        };

                        process.Run(IsShowCommand, echoPrefix ?? DefaultPrefix.Value);

                        process.BeginOutputReadLine();
                        process.BeginErrorReadLine();

                        process.WaitForExit();

                        int exitCode = process.ExitCode;

                        result = new Tuple<int, string>(exitCode, logFilePath);
                        if (ignoreExitCode == false && exitCode != 0)
                        {
                            break;
                        }
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
