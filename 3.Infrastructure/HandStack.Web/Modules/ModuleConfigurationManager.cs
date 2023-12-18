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

            string modulesFileName = "module.json";
            foreach (string moduleBasePath in Directory.GetDirectories(GlobalConfiguration.LoadModuleBasePath))
            {
                var modulesPath = Path.Combine(moduleBasePath, modulesFileName);

                if (Directory.Exists(moduleBasePath) == true)
                {
                    using var reader = new StreamReader(modulesPath);
                    string content = reader.ReadToEnd();
                    dynamic? module = JsonConvert.DeserializeObject(content);

                    if (module != null)
                    {
                        if (GlobalConfiguration.ModuleNames.IndexOf(module.ModuleID.ToString()) > -1)
                        {
                            var moduleID = module.ModuleID;

                            var moduleInfo = new ModuleInfo();
                            moduleInfo.ModuleID = moduleID;
                            moduleInfo.BasePath = moduleBasePath;
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

                            modules.Add(moduleInfo);
                        }
                    }
                }
            }

            return modules;
        }
    }
}
