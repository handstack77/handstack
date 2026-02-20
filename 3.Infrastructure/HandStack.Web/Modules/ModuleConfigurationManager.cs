using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HandStack.Web.Modules
{
    public class ModuleConfigurationManager : IModuleConfigurationManager
    {
        public IEnumerable<ModuleInfo> GetModules()
        {
            var modules = new List<ModuleInfo>();
            if (string.IsNullOrEmpty(GlobalConfiguration.LoadModuleBasePath))
            {
                GlobalConfiguration.LoadModuleBasePath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, @"modules");
            }

            if (Directory.Exists(GlobalConfiguration.LoadModuleBasePath) == false)
            {
                Directory.CreateDirectory(GlobalConfiguration.LoadModuleBasePath);
            }

            using var httpClient = new HttpClient() { Timeout = TimeSpan.FromSeconds(3) };
            var moduleSettingFile = "module.json";
            foreach (var moduleBasePath in Directory.GetDirectories(GlobalConfiguration.LoadModuleBasePath))
            {
                var directoryInfo = new DirectoryInfo(moduleBasePath);
                var moduleID = GlobalConfiguration.ModuleNames.Find((item) =>
                {
                    return item == directoryInfo.Name;
                });

                if (!string.IsNullOrEmpty(moduleID))
                {
                    DefaultModuleConfigJson? module = null;
                    var moduleSettingFilePath = PathExtensions.Combine(moduleBasePath, moduleSettingFile);
                    if (moduleID.IndexOf("|") > -1)
                    {
                        var parts = moduleID.Split('|', StringSplitOptions.RemoveEmptyEntries);
                        moduleID = parts[0];
                        var fileUri = parts[1];

                        if (fileUri.StartsWith("http://", StringComparison.OrdinalIgnoreCase) == true || fileUri.StartsWith("https://", StringComparison.OrdinalIgnoreCase) == true)
                        {
                            using var request = new HttpRequestMessage(HttpMethod.Get, fileUri);

                            request.Headers.Add("HandStack-MachineID", GlobalConfiguration.HardwareID);
                            request.Headers.Add("HandStack-IP", GlobalConfiguration.ServerLocalIP);
                            request.Headers.Add("HandStack-HostName", GlobalConfiguration.HostName);
                            request.Headers.Add("HandStack-Environment", GlobalConfiguration.RunningEnvironment);

                            using var response = httpClient.Send(request);
                            response.EnsureSuccessStatusCode();

                            var secretData = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                            var keyItem = JsonConvert.DeserializeObject<KeyItem>(secretData)!;
                            var content = keyItem.IsEncryption.ToBoolean() == true ? keyItem.Value.DecryptAES(keyItem.Key.PadRight(32, '0').Substring(0, 32)) : keyItem.Value;

                            var settings = new JsonSerializerSettings();
                            settings.Converters.Add(new StringOrArrayConverter());
                            module = JsonConvert.DeserializeObject<DefaultModuleConfigJson>(content, settings);
                        }
                        else if (File.Exists(fileUri) == true)
                        {
                            moduleSettingFilePath = fileUri;
                            moduleID = directoryInfo.Name;

                            if (File.Exists(moduleSettingFilePath) == true)
                            {
                                using var reader = new StreamReader(moduleSettingFilePath);
                                var content = reader.ReadToEnd();

                                var settings = new JsonSerializerSettings();
                                settings.Converters.Add(new StringOrArrayConverter());
                                module = JsonConvert.DeserializeObject<DefaultModuleConfigJson>(content, settings);
                            }
                        }
                    }
                    else if (File.Exists(moduleSettingFilePath) == true)
                    {
                        using var reader = new StreamReader(moduleSettingFilePath);
                        var content = reader.ReadToEnd();

                        var settings = new JsonSerializerSettings();
                        settings.Converters.Add(new StringOrArrayConverter());
                        module = JsonConvert.DeserializeObject<DefaultModuleConfigJson>(content, settings);
                    }

                    if (module != null)
                    {
                        var moduleInfo = new ModuleInfo();
                        moduleInfo.ModuleID = moduleID;
                        moduleInfo.BasePath = moduleBasePath;
                        moduleInfo.ModuleSettingFilePath = moduleSettingFilePath;
                        moduleInfo.Name = moduleID;
                        moduleInfo.Version = Version.Parse(module.Version.ToString());
                        moduleInfo.IsBundledWithHost = module.IsBundledWithHost;
                        moduleInfo.IsCopyContract = module.IsCopyContract;
                        moduleInfo.IsPurgeContract = module.IsPurgeContract;

                        if (module.ModuleConfig?.ContractBasePath != null)
                        {
                            var keyValues = new List<string>();
                            foreach (var item in module.ModuleConfig.ContractBasePath)
                            {
                                keyValues.Add(item.ToString());
                            }

                            moduleInfo.ContractBasePath = keyValues;
                        }

                        if (module.ModuleConfig?.EventAction != null)
                        {
                            var keyValues = new List<string>();
                            foreach (var item in module.ModuleConfig.EventAction)
                            {
                                keyValues.Add(item.ToString());
                            }

                            moduleInfo.EventAction = keyValues;
                        }

                        if (module.ModuleConfig?.SubscribeAction != null)
                        {
                            var keyValues = new List<string>();
                            foreach (var item in module.ModuleConfig.SubscribeAction)
                            {
                                keyValues.Add(item.ToString());
                            }

                            moduleInfo.SubscribeAction = keyValues;
                        }

                        if (module.LoadPassAssemblyPath != null)
                        {
                            var keyValues = new List<string>();
                            foreach (var item in module.LoadPassAssemblyPath)
                            {
                                var passAssemblyPath = PathExtensions.Join(moduleBasePath, item);
                                keyValues.Add(passAssemblyPath);
                            }

                            moduleInfo.LoadPassAssemblyPath = keyValues;
                        }

                        modules.Add(moduleInfo);
                    }
                    else
                    {
                        Console.WriteLine($"moduleID: {moduleID} 설정 경로 확인 필요.");
                    }
                }
            }

            return modules;
        }
    }

    public class DefaultModuleConfigJson : ModuleSetting
    {
        public List<string> LoadPassAssemblyPath { get; set; }

        public DefaultModuleConfig ModuleConfig { get; set; }

        public DefaultModuleConfigJson()
        {
            ModuleConfig = new DefaultModuleConfig();
            LoadPassAssemblyPath = new List<string>();
        }
    }

    public class DefaultModuleConfig
    {
        public List<string> ContractBasePath { get; set; }

        public List<string> EventAction { get; set; }

        public List<string> SubscribeAction { get; set; }

        public DefaultModuleConfig()
        {
            ContractBasePath = new List<string>();
            EventAction = new List<string>();
            SubscribeAction = new List<string>();
        }
    }

    public class StringOrArrayConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(List<string>);
        }

#pragma warning disable CS8765
        public override object? ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
#pragma warning restore CS8765
        {
            var token = JToken.Load(reader);
            if (token.Type == JTokenType.Array)
            {
                return token.ToObject<List<string>>();
            }
            return new List<string> { token.ToString() };
        }

#pragma warning disable CS8765
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
#pragma warning restore CS8765
        {
            var list = (List<string>)value;
            if (list.Count == 1)
            {
                writer.WriteValue(list[0]);
            }
            else
            {
                writer.WriteStartArray();
                foreach (var item in list)
                {
                    writer.WriteValue(item);
                }
                writer.WriteEndArray();
            }
        }
    }
}

