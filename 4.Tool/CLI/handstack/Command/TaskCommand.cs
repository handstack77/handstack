using System;
using System.CommandLine;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Serilog;

namespace handstack
{
    internal static class TaskCommand
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

            var subCommandTask = new Command("task", "운영체제에 따라 사전에 정의된 배치 스크립트 업무를 수행합니다") {
                optionFile, optionValue
            };

            // handstack task --file=C:/tmp/task.json --value=checkman:build;dbclient:build
            subCommandTask.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);
                var value = parseResult.GetValue(optionValue);

                if (file != null && file.Exists == true && file.Name == "task.json" && string.IsNullOrWhiteSpace(value) == false)
                {
                    var command = value.ToStringSafe();
                    if (command.StartsWith("*:") == true)
                    {
                        var tasks = Program.BindTasks(file.FullName.Replace("\\", "/"), command);
                        if (tasks != null)
                        {
                            foreach (var task in tasks)
                            {
                                RunningTask(file, task);
                            }
                        }
                    }
                    else
                    {
                        var commands = command.SplitAndTrim(';');
                        foreach (var item in commands)
                        {
                            var task = Program.BindTask(file.FullName.Replace("\\", "/"), item);
                            if (task != null)
                            {
                                RunningTask(file, task);
                            }
                        }
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName.Replace("\\", "/")}, value:{value} 확인이 필요합니다");
                }

                static void RunningTask(FileInfo? file, Entity.Tasks task)
                {
                    foreach (var item in task.environments)
                    {
                        if (item.Key == "$DATE_STRING")
                        {
                            var dateString = DateTime.Now.ToString(string.IsNullOrWhiteSpace(item.Value) == true ? "yyyy-MM-dd" : item.Value);
                            CommandHelper.EnvironmentVariables.Add(item.Key.SubstringSafe(1).ToUpper(), dateString);
                        }
                        else if (item.Key.StartsWith("$") == true)
                        {
                            CommandHelper.EnvironmentVariables.Add(item.Key.SubstringSafe(1).ToUpper(), item.Value);
                        }
                        else
                        {
                            CommandHelper.EnvironmentVariables.Add(item.Key.ToUpper(), item.Value);
                        }
                    }

                    for (var i = 0; i < task.commands.Count; i++)
                    {
                        var command = task.commands[i];
                        foreach (var item in task.environments.Where(p => p.Key.StartsWith("$") == true))
                        {
                            task.commands[i] = command.Replace(item.Key, item.Value);
                            task.basepath = string.IsNullOrWhiteSpace(task.basepath) == true ? "" : task.basepath.Replace(item.Key, item.Value);
                        }
                    }

                    var scripts = string.Join(Environment.NewLine, task.commands);
                    var workingDirectory = string.IsNullOrWhiteSpace(task.basepath) == true ? (file?.DirectoryName).ToStringSafe() : task.basepath;
                    var scriptsResult = CommandHelper.RunScript(scripts, false, true, true, true, workingDirectory, task.ignoreExit);

                    var commandIndex = 1;
                    foreach (var item in scriptsResult)
                    {
                        if (item.Item1 != 0)
                        {
                            Log.Error($"command: {commandIndex}, error: {item.Item3}");
                        }

                        commandIndex = commandIndex + 1;
                    }
                }
            });

            rootCommand.Add(subCommandTask);
        }
    }
}
