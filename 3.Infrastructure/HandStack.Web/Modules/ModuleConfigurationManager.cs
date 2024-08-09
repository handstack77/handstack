using System;
using System.Collections.Generic;
using System.IO;

using Newtonsoft.Json;

namespace HandStack.Web.Modules
{
    public class ModuleConfigurationManager : IModuleConfigurationManager
    {
        public IEnumerable<ModuleInfo> GetModules()
        {
            List<ModuleInfo> modules = new List<ModuleInfo>();
            if (string.IsNullOrEmpty(GlobalConfiguration.LoadModuleBasePath) == true)
            {
                GlobalConfiguration.LoadModuleBasePath = Path.Combine(GlobalConfiguration.EntryBasePath, @"modules");
            }

            if (Directory.Exists(GlobalConfiguration.LoadModuleBasePath) == false)
            {
                Directory.CreateDirectory(GlobalConfiguration.LoadModuleBasePath);
            }

            string moduleSettingFile = "module.json";
            foreach (string moduleBasePath in Directory.GetDirectories(GlobalConfiguration.LoadModuleBasePath))
            {
                DirectoryInfo directoryInfo = new DirectoryInfo(moduleBasePath);
                var moduleID = GlobalConfiguration.ModuleNames.Find((item) =>
                {
                    return item.StartsWith(directoryInfo.Name);
                });

                if (string.IsNullOrEmpty(moduleID) == false)
                {
                    string moduleSettingFilePath = Path.Combine(moduleBasePath, moduleSettingFile);
                    if (moduleID.IndexOf("|") > -1)
                    {
                        string passModuleSettingFilePath = moduleID.Substring(moduleID.IndexOf("|") + 1);
                        if (File.Exists(passModuleSettingFilePath) == true)
                        {
                            moduleSettingFilePath = passModuleSettingFilePath;
                            moduleID = directoryInfo.Name;
                        }
                        else
                        {
                            Console.WriteLine($"moduleID: {moduleID} 설정 경로 확인 필요. {passModuleSettingFilePath}");
                        }
                    }

                    if (File.Exists(moduleSettingFilePath) == true)
                    {
                        using var reader = new StreamReader(moduleSettingFilePath);
                        string content = reader.ReadToEnd();
                        dynamic? module = JsonConvert.DeserializeObject(content);

                        if (module != null)
                        {
                            var moduleInfo = new ModuleInfo();
                            moduleInfo.ModuleID = moduleID;
                            moduleInfo.BasePath = moduleBasePath;
                            moduleInfo.ModuleSettingFilePath = moduleSettingFilePath;
                            moduleInfo.Name = moduleID;
                            moduleInfo.Version = Version.Parse(module.Version.ToString());
                            moduleInfo.IsBundledWithHost = module.IsBundledWithHost;

                            if (module.ModuleConfig?.EventAction != null)
                            {
                                List<string> keyValues = new List<string>();
                                foreach (var item in module.ModuleConfig.EventAction)
                                {
                                    keyValues.Add(item.ToString());
                                }

                                moduleInfo.EventAction = keyValues;
                            }

                            if (module.ModuleConfig?.SubscribeAction != null)
                            {
                                List<string> keyValues = new List<string>();
                                foreach (var item in module.ModuleConfig.SubscribeAction)
                                {
                                    keyValues.Add(item.ToString());
                                }

                                moduleInfo.SubscribeAction = keyValues;
                            }

                            if (module.LoadPassAssemblyPath != null)
                            {
                                List<string> keyValues = new List<string>();
                                foreach (var item in module.LoadPassAssemblyPath)
                                {
                                    keyValues.Add(item.ToString());
                                }

                                moduleInfo.LoadPassAssemblyPath = keyValues;
                            }

                            modules.Add(moduleInfo);
                        }
                    }
                }
            }

            return modules;
        }
    }
}
