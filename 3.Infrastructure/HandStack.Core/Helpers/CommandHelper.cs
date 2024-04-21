using System;
using System.Collections.Generic;
using System.Diagnostics;
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
        public static bool isShowCommand { get; set; } = false;

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
                            ? new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "cmd",
                                Arguments = $"/c \"{item}\"",
                                WorkingDirectory = workingDirectory,
                                UseShellExecute = useShellExecute,
                                RedirectStandardError = redirectStandardError,
                                RedirectStandardOutput = redirectStandardOutput,
                                CreateNoWindow = createNoWindow

                            }
                            : new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = "/bin/bash",
                                Arguments = $"-c \"{item}\"",
                                WorkingDirectory = workingDirectory,
                                UseShellExecute = useShellExecute,
                                RedirectStandardError = redirectStandardError,
                                RedirectStandardOutput = redirectStandardOutput,
                                CreateNoWindow = createNoWindow
                            };

                        process.Run(isShowCommand, echoPrefix ?? DefaultPrefix.Value);

                        int exitCode = 0;
                        string? output = redirectStandardOutput == true ? process.StandardOutput.ReadToEnd() : null;
                        string? error = redirectStandardError == true ? process.StandardError.ReadToEnd() : null;

                        process.WaitForExit();

                        exitCode = process.ExitCode;

                        result.Add(new Tuple<int, string?, string?>(0
                            , output
                            , error
                        ));

                        if (ignoreExitCode == false && process.ExitCode != 0)
                        {
                            break;
                        }
                    }
                }
            }

            return result;
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
