using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Serilog;

namespace handstack
{
    internal static class StopCommand
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

            var subCommandStop = new Command("stop", "ack 프로그램을 종료합니다") {
                optionProcessID, optionPort
            };

            subCommandStop.SetAction((parseResult) =>
            {
                var pid = parseResult.GetValue(optionProcessID) ?? 0;
                var port = parseResult.GetValue(optionPort);

                var processes = new List<Process>();
                processes.AddRange(Process.GetProcessesByName("ack"));
                processes.AddRange(Process.GetProcessesByName("dotnet"));

                if (pid == 0 && port == null)
                {
                    for (var i = 0; i < processes.Count; i++)
                    {
                        var process = processes[i];
                        try
                        {
                            if (process != null)
                            {
                                process.Kill(true);
                            }
                            else
                            {
                                Log.Information($"ProcessID:{pid} 프로세스 확인이 필요합니다");
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"ProcessID:{pid} 프로세스 Kill 오류");
                        }
                    }
                }
                else if (pid > 0)
                {
                    for (var i = 0; i < processes.Count; i++)
                    {
                        var process = processes[i];
                        if (process.Id == pid)
                        {
                            try
                            {
                                if (process != null)
                                {
                                    process.Kill(true);
                                }
                                else
                                {
                                    Log.Information($"ProcessID:{pid} 프로세스 확인이 필요합니다");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, $"ProcessID:{pid} 프로세스 Kill 오류");
                            }
                            break;
                        }
                    }
                }
                else if (port != null && port > 0)
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
                            var regex = new Regex(@"(\w+)\s+(?<pid>\d+)\s+\w+\s+\d+u\s+\w+\s+\w+\s+\d+t\d+\s+TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]|\*):(?<port>\d+)\s+\(LISTEN\)");
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

                    foreach (var processID in processPorts.Keys)
                    {
                        if (processPorts.TryGetValue(processID, out var usagePorts) == true)
                        {
                            if (usagePorts.Contains((int)port) == true)
                            {
                                var process = Process.GetProcessById(processID);
                                if (process != null)
                                {
                                    try
                                    {
                                        process.Kill(true);
                                    }
                                    catch (Exception exception)
                                    {
                                        Log.Error(exception, $"ProcessID:{processID} 프로세스 Kill 오류");
                                    }
                                }
                                else
                                {
                                    Log.Information($"ProcessID:{processID} 프로세스 확인이 필요합니다");
                                }
                            }
                        }
                    }
                }
            });

            rootCommand.Add(subCommandStop);
        }
    }
}
