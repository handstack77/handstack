using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Core.Helpers
{
    /// <summary>
    /// 배치 명령을 수행후 표준 출력값을 반환
    /// </summary>
    /// <code>
    /// int exitCode = CommandHelper.Run("foo.exe");
    /// int exitCode = CommandHelper.Run("foo.exe", "arg1 arg2", "my-directory", isStartUpLog: true);
    /// int exitCode = await CommandHelper.RunAsync("foo.exe");
    /// int exitCode = await CommandHelper.RunAsync("foo.exe", "arg1 arg2", "my-directory", isStartUpLog: true);
    /// int exitCode = CommandHelper.Run("yarn", windowsName: "cmd", windowsArgs: "/c yarn");
    /// var output1 = CommandHelper.Execute("foo.exe");
    /// var output2 = CommandHelper.Execute("foo.exe", "arg1 arg2", "my-directory", isStartUpLog: true);
    /// var output3 = await CommandHelper.ExecuteAsync("foo.exe");
    /// var output4 = await CommandHelper.ExecuteAsync("foo.exe", "arg1 arg2", "my-directory", isStartUpLog: true);
    /// var output5 = Execute("yarn", windowsName: "cmd", windowsArgs: "/c yarn");
    /// output5.ExitCode, output5.Result
    /// </code>
    public static class CommandHelper
    {
        public static List<Tuple<int, string?, string?>> RunScript(string script, bool useShellExecute = false, bool redirectStandardError = false, bool redirectStandardOutput = false, bool createNoWindow = true, string? workingDirectory = null)
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
                        var escapedArgs = item.Replace("\"", "\\\"");
                        process.StartInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                            ? new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "cmd",
                                Arguments = $"/c \"{escapedArgs}\"",
                                WorkingDirectory = workingDirectory,
                                UseShellExecute = useShellExecute,
                                RedirectStandardError = redirectStandardError,
                                RedirectStandardOutput = redirectStandardOutput,
                                CreateNoWindow = createNoWindow

                            }
                            : new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "/bin/bash",
                                Arguments = $"-c \"{escapedArgs}\"",
                                WorkingDirectory = workingDirectory,
                                UseShellExecute = useShellExecute,
                                RedirectStandardError = redirectStandardError,
                                RedirectStandardOutput = redirectStandardOutput,
                                CreateNoWindow = createNoWindow
                            };

                        process.Run(false, DefaultPrefix.Value);

                        result.Add(new Tuple<int, string?, string?>(process.ExitCode
                            , redirectStandardOutput == true ? process.StandardOutput.ReadToEnd() : null
                            , redirectStandardError == true ? process.StandardError.ReadToEnd() : null
                        ));

                        if (process.ExitCode != 0)
                        {
                            break;
                        }
                    }
                }
            }

            return result;
        }

        public static async Task<List<Tuple<int, string?, string?>>> RunScriptAsync(string script, bool useShellExecute = false, bool redirectStandardError = false, bool redirectStandardOutput = false, bool createNoWindow = true, string? workingDirectory = null)
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
                        var escapedArgs = item.Replace("\"", "\\\"");
                        process.StartInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                            ? new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "cmd",
                                Arguments = $"/c \"{escapedArgs}\"",
                                WorkingDirectory = workingDirectory,
                                UseShellExecute = useShellExecute,
                                RedirectStandardError = redirectStandardError,
                                RedirectStandardOutput = redirectStandardOutput,
                                CreateNoWindow = createNoWindow

                            }
                            : new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "/bin/bash",
                                Arguments = $"-c \"{escapedArgs}\"",
                                WorkingDirectory = workingDirectory,
                                UseShellExecute = useShellExecute,
                                RedirectStandardError = redirectStandardError,
                                RedirectStandardOutput = redirectStandardOutput,
                                CreateNoWindow = createNoWindow
                            };

                        await process.RunAsync(false, DefaultPrefix.Value);

                        result.Add(new Tuple<int, string?, string?>(process.ExitCode
                            , redirectStandardOutput == true ? process.StandardOutput.ReadToEnd() : null
                            , redirectStandardError == true ? process.StandardError.ReadToEnd() : null
                        ));

                        if (process.ExitCode != 0)
                        {
                            break;
                        }
                    }
                }
            }

            return result;
        }

        public static int Run(string name, string? args = null, string? workingDirectory = null, bool isStartUpLog = false, string? windowsName = null, string? windowsArgs = null, string? echoPrefix = null, Action<IDictionary<string, string?>>? configureEnvironment = null)
        {
            using (var process = new Process())
            {
                process.StartInfo = ProcessStartInfo.Create(name, args, workingDirectory, false, windowsName, windowsArgs, configureEnvironment);
                process.Run(isStartUpLog, echoPrefix ?? DefaultPrefix.Value);

                if (process.ExitCode != 0)
                {
                    // 예외 처리
                }

                return process.ExitCode;
            }
        }

        public static async Task<int> RunAsync(string name, string? args = null, string? workingDirectory = null, bool isStartUpLog = false, string? windowsName = null, string? windowsArgs = null, string? echoPrefix = null, Action<IDictionary<string, string?>>? configureEnvironment = null)
        {
            using (var process = new Process())
            {
                process.StartInfo = ProcessStartInfo.Create(name, args, workingDirectory, false, windowsName, windowsArgs, configureEnvironment);
                await process.RunAsync(isStartUpLog, echoPrefix ?? DefaultPrefix.Value).ConfigureAwait(false);

                if (process.ExitCode != 0)
                {
                    // 예외 처리
                }

                return process.ExitCode;
            }
        }

        public static (int ExitCode, string Result) Execute(string name, string? args = null, string? workingDirectory = null, bool isStartUpLog = false, string? windowsName = null, string? windowsArgs = null, string? echoPrefix = null, Action<IDictionary<string, string?>>? configureEnvironment = null)
        {
            using (var process = new Process())
            {
                process.StartInfo = ProcessStartInfo.Create(name, args, workingDirectory, true, windowsName, windowsArgs, configureEnvironment);

                var runProcess = process.RunAsync(isStartUpLog, echoPrefix ?? DefaultPrefix.Value);
                var readOutput = process.StandardOutput.ReadToEndAsync();

                Task.WaitAll(runProcess, readOutput);

                if (process.ExitCode != 0)
                {
                    // 예외 처리
                }

                return (process.ExitCode, readOutput.Result);
            }
        }

        public static async Task<(int ExitCode, string Result)> ExecuteAsync(string name, string? args = null, string? workingDirectory = null, bool isStartUpLog = false, string? windowsName = null, string? windowsArgs = null, string? echoPrefix = null, Action<IDictionary<string, string?>>? configureEnvironment = null)
        {
            using (var process = new Process())
            {
                process.StartInfo = ProcessStartInfo.Create(name, args, workingDirectory, true, windowsName, windowsArgs, configureEnvironment);

                var runProcess = process.RunAsync(isStartUpLog, echoPrefix ?? DefaultPrefix.Value);
                var readOutput = process.StandardOutput.ReadToEndAsync();

                await Task.WhenAll(runProcess, readOutput).ConfigureAwait(false);

                if (process.ExitCode != 0)
                {
                    // 예외 처리
                }

                return (process.ExitCode, readOutput.Result);
            }
        }
    }

    internal static class ProcessExtensions
    {
        public static void Run(this Process process, bool isStartUpLog, string echoPrefix)
        {
            process.EchoAndStart(isStartUpLog, echoPrefix);
            process.WaitForExit();
        }

        public static Task RunAsync(this Process process, bool isStartUpLog, string echoPrefix)
        {
            var tcs = new TaskCompletionSource<object?>();
            process.Exited += (s, e) => tcs.SetResult(default);
            process.EnableRaisingEvents = true;
            process.EchoAndStart(isStartUpLog, echoPrefix);
            return tcs.Task;
        }

        private static void EchoAndStart(this Process process, bool isStartUpLog, string echoPrefix)
        {
            if (isStartUpLog == true)
            {
                var message = $"{(string.IsNullOrEmpty(process.StartInfo.WorkingDirectory) ? "" : $"{echoPrefix}: Working Directory: {process.StartInfo.WorkingDirectory}{Environment.NewLine}")}{echoPrefix}: {process.StartInfo.FileName} {process.StartInfo.Arguments}";
                Console.WriteLine(message);
            }

            process.Start();
        }
    }

    internal static class ProcessStartInfo
    {
        public static System.Diagnostics.ProcessStartInfo Create(string name, string? args, string? workingDirectory, bool captureOutput, string? windowsName, string? windowsArgs, Action<IDictionary<string, string?>>? configureEnvironment)
        {
            var startInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? new System.Diagnostics.ProcessStartInfo
                {
                    FileName = windowsName ?? name,
                    Arguments = windowsArgs ?? args,
                    WorkingDirectory = workingDirectory,
                    UseShellExecute = false,
                    RedirectStandardError = false,
                    RedirectStandardOutput = captureOutput,
                    CreateNoWindow = true

                }
                : new System.Diagnostics.ProcessStartInfo
                {
                    FileName = name,
                    Arguments = args,
                    WorkingDirectory = workingDirectory,
                    UseShellExecute = false,
                    RedirectStandardError = false,
                    RedirectStandardOutput = captureOutput,
                    CreateNoWindow = true
                };

            configureEnvironment?.Invoke(startInfo.Environment);

            return startInfo;
        }
    }

    internal static class DefaultPrefix
    {
        static DefaultPrefix()
        {
        }

        public static readonly string Value = Assembly.GetEntryAssembly()?.GetName().Name ?? "BatchClient";
    }
}
