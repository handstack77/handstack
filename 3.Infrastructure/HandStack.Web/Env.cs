using System;
using System.Linq;
using System.Reflection;

using Microsoft.Extensions.Configuration;

using Serilog;

namespace HandStack.Web
{
    // Env.Var("ModuleConfig:SystemID")
    public sealed class Env
    {
        public static string? Var(string key)
        {
            IConfiguration? configuration;
            if (key.Contains("::") == true)
            {
                string moduleID = key.Split("::")[0];
                key = key.Split("::")[1];
                configuration = GetModuleConfiguration(moduleID);
            }
            else if (GlobalConfiguration.ConfigurationRoot == null)
            {
                configuration = new ConfigurationBuilder()
                    .AddUserSecrets(Assembly.GetEntryAssembly() ?? Assembly.GetCallingAssembly())
                    .Build();
            }
            else
            {
                configuration = GlobalConfiguration.ConfigurationRoot;
            }

            var value = configuration?[key];
            if (string.IsNullOrEmpty(value) == false)
            {
                return value;
            }

            if (key.Contains(":") == false)
            {
                value = Environment.GetEnvironmentVariable(key);
            }

            return value;
        }

        // Env.BindSection(new AppSettingsConfig(), "AppSettings")
        public static bool BindSection(object instance, string? key = "")
        {
            IConfiguration? configuration;
            if (GlobalConfiguration.ConfigurationRoot == null)
            {
                configuration = new ConfigurationBuilder()
                    .AddUserSecrets(Assembly.GetEntryAssembly() ?? Assembly.GetCallingAssembly())
                    .Build();
            }
            else
            {
                configuration = GlobalConfiguration.ConfigurationRoot;
            }

            return BindInstance(configuration, instance, key);
        }

        // Env.BindSection("dbclient", new ModuleConfigJson(), "ModuleConfig")
        public static bool BindSection(string moduleID, object instance, string? key = "")
        {
            return BindInstance(GetModuleConfiguration(moduleID), instance, key);
        }

        private static IConfiguration? GetModuleConfiguration(string moduleID)
        {
            IConfiguration? result = null;
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == moduleID);
            if (module == null)
            {
                return result;
            }
            else
            {
                if (module.Configuration == null)
                {
                    result = new ConfigurationBuilder()
                        .AddJsonFile(module.ModuleSettingFilePath)
                        .AddUserSecrets(module.Assembly ?? Assembly.GetEntryAssembly() ?? Assembly.GetCallingAssembly())
                        .Build();

                    module.Configuration = result;
                }
                else
                {
                    result = module.Configuration;
                }
            }

            return result;
        }

        private static bool BindInstance(IConfiguration? configuration, object instance, string? key)
        {
            bool result = false;
            if (configuration == null)
            {
                return result;
            }

            try
            {
                if (string.IsNullOrEmpty(key) == true)
                {
                    configuration.Bind(instance);
                }
                else
                {
                    var value = configuration[key];
                    if (string.IsNullOrEmpty(value) == false)
                    {
                        return result;
                    }

                    configuration.GetSection(key).Bind(instance);
                }
                result = true;
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"key: {key} 항목 및 인스턴스 확인 필요", "Env/BindSection");
            }

            return result;
        }
    }
}
