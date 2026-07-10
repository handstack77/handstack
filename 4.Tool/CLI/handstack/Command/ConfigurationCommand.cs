using System;
using System.CommandLine;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;

using Newtonsoft.Json.Linq;

using Serilog;

namespace handstack
{
    internal static class ConfigurationCommand
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

            // configuration --ack=%HANDSTACK_HOME%/app/ack.exe --appsettings=ack.localhost.json
            var subCommandConfiguration = new Command("configuration", "의도된 ack 프로그램 및 모듈 환경설정을 적용합니다") {
                optionAckFile, optionAppSettingFile
            };

            subCommandConfiguration.SetAction((parseResult) =>
            {
                var ackFile = parseResult.GetValue(optionAckFile);
                var settings = parseResult.GetValue(optionAppSettingFile);

                if (ackFile != null && ackFile.Exists == true && settings != null && settings.Exists == true)
                {
                    var ackFileBasePath = PathExtensions.GetFullPath(ackFile.DirectoryName.ToStringSafe());
                    var sourceBasePath = PathExtensions.GetFullPath(settings.DirectoryName.ToStringSafe());
                    var targetBasePath = ackFileBasePath;

                    string toRemove = "/app";
                    int lastIndex = ackFileBasePath.LastIndexOf(toRemove);
                    if (lastIndex != -1)
                    {
                        targetBasePath = ackFileBasePath.Remove(lastIndex, toRemove.Length);
                    }

                    Log.Information($"configuration basepath source: {sourceBasePath}, target: {targetBasePath}");

                    var settingDirectoryPath = settings.DirectoryName.ToStringSafe();
                    var settingFilePath = settings.FullName.Replace("\\", "/");
                    var settingFileName = settings.Name;
                    try
                    {
                        var settingText = File.ReadAllText(settingFilePath);
                        var setting = JObject.Parse(settingText);
                        var moduleBasePath = setting.SelectToken("AppSettings.LoadModuleBasePath").ToStringSafe();
                        if (moduleBasePath.StartsWith(".") == true)
                        {
                            moduleBasePath = PathExtensions.Combine(ackFileBasePath, moduleBasePath);
                        }

                        var loadModules = setting.SelectToken("AppSettings.LoadModules");
                        if (string.IsNullOrWhiteSpace(moduleBasePath) == false && loadModules != null && loadModules.Count() > 0)
                        {
                            var wwwrootModuleBasePath = string.Empty;
                            var functionModuleBasePath = string.Empty;
                            var moduleSettingFile = "module.json";
                            var modules = (JArray)loadModules;
                            for (var i = 0; i < modules.Count; i++)
                            {
                                var module = modules[i];
                                var moduleID = module.ToString();
                                if (string.IsNullOrWhiteSpace(moduleID) == false)
                                {
                                    var splits = settingFileName.SplitAndTrim('.');
                                    if (splits.Count < 2)
                                    {
                                        Log.Error($"환경 설정 파일 이름 확인 필요: {settingFileName}");
                                        continue;
                                    }

                                    var programID = splits[0];
                                    var environment = splits[1];

                                    var sourceModuleSettingFilePath = string.Empty;
                                    if (moduleID.IndexOf("|") > -1)
                                    {
                                        var moduleIndex = modules.IndexOf(module);
                                        sourceModuleSettingFilePath = moduleID.SubstringSafe(moduleID.IndexOf("|") + 1);
                                        moduleID = moduleID.SubstringSafe(0, moduleID.IndexOf("|"));
                                        if (moduleIndex > -1)
                                        {
                                            modules[moduleIndex] = moduleID;
                                        }
                                    }
                                    else
                                    {
                                        sourceModuleSettingFilePath = PathExtensions.Combine(settingDirectoryPath, "modulesettings", $"{programID}.{moduleID}.{environment}.json");
                                        if (File.Exists(sourceModuleSettingFilePath) == false)
                                        {
                                            sourceModuleSettingFilePath = PathExtensions.Combine(settingDirectoryPath, "modules", $"{programID}.{moduleID}.{environment}.json");
                                        }
                                    }

                                    if (File.Exists(sourceModuleSettingFilePath) == true)
                                    {
                                        var directoryInfo = new DirectoryInfo(PathExtensions.Combine(moduleBasePath, moduleID));
                                        if (directoryInfo.Exists == true)
                                        {
                                            if (moduleID == "wwwroot")
                                            {
                                                wwwrootModuleBasePath = directoryInfo.FullName.Replace("\\", "/");
                                            }
                                            else if (moduleID == "function")
                                            {
                                                functionModuleBasePath = directoryInfo.FullName.Replace("\\", "/");
                                            }

                                            var sourceModuleSettingFileInfo = new FileInfo(sourceModuleSettingFilePath);
                                            var targetModuleSettingFilePath = PathExtensions.Combine(moduleBasePath, moduleID, moduleSettingFile);

                                            File.Copy(sourceModuleSettingFilePath, targetModuleSettingFilePath, true);
                                            Log.Information($"configuration modules source: {PathExtensions.GetFullPath(sourceModuleSettingFilePath).Replace(sourceBasePath, "")}, target: {PathExtensions.GetFullPath(targetModuleSettingFilePath).Replace(targetBasePath, "")}");
                                        }
                                        else
                                        {
                                            Log.Warning($"moduleBasePath: {moduleBasePath}, moduleID: {moduleID} 확인 필요");
                                        }
                                    }
                                }
                            }

                            var appBasePath = ackFile.DirectoryName.ToStringSafe();
                            var appSettingFileInfo = new FileInfo(PathExtensions.Combine(appBasePath, "appsettings.json"));
                            var appSettingFilePath = appSettingFileInfo.FullName;
                            File.WriteAllText(appSettingFilePath, setting.ToString());
                            Log.Information($"configuration appsettings source: {PathExtensions.GetFullPath(settingFilePath).Replace(sourceBasePath, "")}, target: {PathExtensions.GetFullPath(appSettingFilePath).Replace(targetBasePath, "")}");

                            var synConfigFilePath = PathExtensions.Combine(settingDirectoryPath, "synconfigs", settingFileName);
                            if (File.Exists(synConfigFilePath) == true && string.IsNullOrWhiteSpace(wwwrootModuleBasePath) == false)
                            {
                                var synConfigFileInfo = new FileInfo(PathExtensions.Combine(wwwrootModuleBasePath, "wwwroot", "syn.config.json"));
                                var appSynConfigFilePath = synConfigFileInfo.FullName;
                                File.Copy(synConfigFilePath, appSynConfigFilePath, true);
                                Log.Information($"configuration synconfigs source: {PathExtensions.GetFullPath(synConfigFilePath).Replace(sourceBasePath, "")}, target: {PathExtensions.GetFullPath(appSynConfigFilePath).Replace(targetBasePath, "")}");
                            }

                            var nodeConfigFilePath = PathExtensions.Combine(settingDirectoryPath, "nodeconfigs", settingFileName);
                            if (File.Exists(nodeConfigFilePath) == true && string.IsNullOrWhiteSpace(functionModuleBasePath) == false)
                            {
                                var nodeConfigFileInfo = new FileInfo(PathExtensions.Combine(functionModuleBasePath, "node.config.json"));
                                var appNodeConfigFilePath = nodeConfigFileInfo.FullName;
                                File.Copy(nodeConfigFilePath, appNodeConfigFilePath, true);
                                Log.Information($"configuration nodeconfigs source: {PathExtensions.GetFullPath(nodeConfigFilePath).Replace(sourceBasePath, "")}, target: {PathExtensions.GetFullPath(appNodeConfigFilePath).Replace(targetBasePath, "")}");
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                    }
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인 또는 settings:{settings?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
                }
            });

            rootCommand.Add(subCommandConfiguration);
        }
    }
}
