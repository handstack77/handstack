using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Serilog;

namespace handstack
{
    internal static class ListCommand
    {
        public static void Register(RootCommand rootCommand, HandstackCommandContext context)
        {
            var optionAckFile = context.OptionAckFile;
            var optionArguments = context.OptionArguments;
            var optionPort = context.OptionPort;
            var optionProcessID = context.OptionProcessID;
            var optionFormat = context.OptionFormat;
            var optionKey = context.OptionKey;
            var optionValue = context.OptionValue;
            var optionAppSettingFile = context.OptionAppSettingFile;
            var optionDirectory = context.OptionDirectory;
            var optionFile = context.OptionFile;
            var optionFind = context.OptionFind;
            var optionReplace = context.OptionReplace;
            var optionReplaceExpressions = context.OptionReplaceExpressions;
            var optionOptions = context.OptionOptions;

            var subCommandList = new Command("list", "ack 프로세스 목록을 조회합니다");
            subCommandList.SetAction((parseResult) =>
            {
                var currentId = Process.GetCurrentProcess().Id;
                var processes = new List<Process>();
                processes.AddRange(Process.GetProcessesByName("ack"));
                processes.AddRange(Process.GetProcessesByName("dotnet"));
                if (processes.Count > 0)
                {
                    var processPorts = new Dictionary<int, List<int>>();
                    var netstatScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"netstat -ano | findstr /R /C:\"LISTENING\"" : $"lsof -iTCP -n -P | grep -E '(LISTEN)'";
                    var netstatResult = CommandHelper.RunScript($"{netstatScript}", false, true, true);
                    if (netstatResult.Count > 0 && netstatResult[0].Item1 == 0)
                    {
                        var netstatOutput = netstatResult[0].Item2.ToStringSafe();

                        MatchCollection? matches = null;
                        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                        {
                            var regex = new Regex(@"TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]):(?<port>\d+)\s+.*LISTENING\s+(?<pid>\d+)");
                            matches = regex.Matches(netstatOutput);
                        }
                        else
                        {
                            var regex = new Regex(@"(\w+)\s+(?<pid>\d+)\s+\w+\s+\d+u\s+\w+\s+\w+\s+\d+t\d+\s+TCP\s+(?<ip>[\d\.]+|\[::1\]|\*):(?<port>\d+)\s+\(LISTEN\)");
                            matches = regex.Matches(netstatOutput);
                        }

                        if (matches != null)
                        {
                            foreach (Match match in matches)
                            {
                                if (int.TryParse(match.Groups["pid"].Value, out var processID) == true && int.TryParse(match.Groups["port"].Value, out var portNumber) == true)
                                {
                                    if (processPorts.ContainsKey(processID) == true)
                                    {
                                        var ports = processPorts[processID];
                                        if (ports.Contains(portNumber) == false)
                                        {
                                            ports.Add(portNumber);
                                        }
                                    }
                                    else
                                    {
                                        processPorts.Add(processID, new List<int> { portNumber });
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        Log.Error($"error: {netstatResult[0].Item3}");
                    }

                    var strings = new List<string>();
                    strings.Add($"pname|pid|port|startat|ram|cmd|path");
                    foreach (var process in processes)
                    {
                        if (process.Id == currentId)
                        {
                            continue;
                        }

                        var commandLine = "";
                        var commandLineScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"powershell -NoProfile -Command \"Get-CimInstance Win32_Process | Where-Object {{ $_.ProcessId -eq {process.Id} }} | Select-Object -ExpandProperty CommandLine\"" : $"ps -fp {process.Id} | awk '{{print $NF}}'";
                        var commandLineResult = CommandHelper.RunScript($"{commandLineScript}", false, true, true);
                        if (commandLineResult.Count > 0 && commandLineResult[0].Item1 == 0)
                        {
                            var commandLineOutput = commandLineResult[0].Item2.ToStringSafe();
                            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                            {
                                commandLine = commandLineOutput.Replace("\\", "/").Replace("CommandLine", "").Replace("\n", "").Replace("\r", "").Trim();
                            }
                            else
                            {
                                commandLine = commandLineOutput.Replace("CMD", "").Replace("\n", "").Replace("\r", "").Trim();
                            }
                        }

                        var isProcessCollect = false;
                        if (commandLine.StartsWith("dotnet") == true)
                        {
                            isProcessCollect = commandLine.IndexOf("ack.dll") > -1 ? true : false;
                        }
                        else
                        {
                            isProcessCollect = commandLine.IndexOf("ack.exe") > -1
                                || commandLine.IndexOf($"{Path.DirectorySeparatorChar}ack") > -1
                                ? true : false;
                        }

                        if (isProcessCollect == true)
                        {
                            if (processPorts.TryGetValue(process.Id, out var ports) == true)
                            {
                                var port = ports == null ? "" : string.Join(",", ports);
                                strings.Add($"{process.ProcessName}|{process.Id}|{port}|{process.StartTime:yyyy-MM-dd HH:mm:dd}|{process.WorkingSet64.ToByteSize()}|{commandLine}|{process.MainModule?.FileName}");
                            }
                        }
                    }

                    Log.Information(string.Join(Environment.NewLine, strings));
                }
            });
            rootCommand.Add(subCommandList);
        }
    }
}
