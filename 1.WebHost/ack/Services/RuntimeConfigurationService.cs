using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Modules;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace ack.Services
{
    internal class RuntimeConfigurationService
    {
        private readonly ILogger logger;

        private static readonly object syncRoot = new object();

        private static readonly StringComparer keyComparer = StringComparer.OrdinalIgnoreCase;

        private static readonly Dictionary<string, Action<JToken, ConfigurationApplyResult>> realtimeGlobalAppliers = new Dictionary<string, Action<JToken, ConfigurationApplyResult>>(keyComparer)
        {
            ["AppSettings:BusinessServerUrl"] = (token, result) =>
            {
                GlobalConfiguration.BusinessServerUrl = token.ToString().Trim();
            },
            ["AppSettings:FindGlobalIDServer"] = (token, result) =>
            {
                GlobalConfiguration.FindGlobalIDServer = token.ToString().Trim();
            },
            ["AppSettings:HostAccessID"] = (token, result) =>
            {
                var value = token.ToString().Trim();
                if (string.IsNullOrWhiteSpace(value) == true)
                {
                    result.Errors.Add("AppSettings:HostAccessID is required.");
                    return;
                }

                GlobalConfiguration.HostAccessID = value;
            },
            ["AppSettings:IsTenantFunction"] = (token, result) =>
            {
                if (TryReadBoolean(token, out var value) == false)
                {
                    result.Errors.Add("AppSettings:IsTenantFunction must be a boolean value.");
                    return;
                }

                GlobalConfiguration.IsTenantFunction = value;
            },
            ["AppSettings:IsExceptionDetailText"] = (token, result) =>
            {
                if (TryReadBoolean(token, out var value) == false)
                {
                    result.Errors.Add("AppSettings:IsExceptionDetailText must be a boolean value.");
                    return;
                }

                GlobalConfiguration.IsExceptionDetailText = value;
            },
            ["AppSettings:ContractRequestPath"] = (token, result) =>
            {
                GlobalConfiguration.ContractRequestPath = token.ToString().Trim();
            },
            ["AppSettings:TenantAppRequestPath"] = (token, result) =>
            {
                GlobalConfiguration.TenantAppRequestPath = token.ToString().Trim();
            },
            ["AppSettings:CookiePrefixName"] = (token, result) =>
            {
                GlobalConfiguration.CookiePrefixName = token.ToString().Trim();
            },
            ["AppSettings:UserSignExpire"] = (token, result) =>
            {
                if (TryReadInt32(token, out var value) == false)
                {
                    result.Errors.Add("AppSettings:UserSignExpire must be an integer value.");
                    return;
                }

                GlobalConfiguration.UserSignExpire = value;
            },
            ["AppSettings:StaticFileCacheMaxAge"] = (token, result) =>
            {
                if (TryReadInt32(token, out var value) == false)
                {
                    result.Errors.Add("AppSettings:StaticFileCacheMaxAge must be an integer value.");
                    return;
                }

                GlobalConfiguration.StaticFileCacheMaxAge = value;
            },
            ["AppSettings:WithOnlyIPs"] = (token, result) =>
            {
                if (token is not JArray array)
                {
                    result.Errors.Add("AppSettings:WithOnlyIPs must be an array.");
                    return;
                }

                var withOnlyIPs = new List<string>();
                foreach (var item in array.Values<string>())
                {
                    var ip = WithOnlyIPFilter.NormalizeIPAddress(item);
                    if (string.IsNullOrWhiteSpace(ip) == false && withOnlyIPs.Contains(ip) == false)
                    {
                        withOnlyIPs.Add(ip);
                    }
                }

                lock (GlobalConfiguration.WithOnlyIPs)
                {
                    GlobalConfiguration.WithOnlyIPs.Clear();
                    GlobalConfiguration.WithOnlyIPs.AddRange(withOnlyIPs);
                }
            },
            ["AppSettings:IsPermissionRoles"] = (token, result) =>
            {
                if (TryReadBoolean(token, out var value) == false)
                {
                    result.Errors.Add("AppSettings:IsPermissionRoles must be a boolean value.");
                    return;
                }

                GlobalConfiguration.IsPermissionRoles = value;
            },
            ["AppSettings:PermissionRoles"] = (token, result) =>
            {
                if (token is not JArray)
                {
                    result.Errors.Add("AppSettings:PermissionRoles must be an array.");
                    return;
                }

                var permissionRoles = token.ToObject<List<PermissionRoles>>() ?? new List<PermissionRoles>();
                GlobalConfiguration.PermissionRoles = permissionRoles;
            }
        };

        private static readonly List<string> restartRequiredGlobalKeys = new List<string>
        {
            "AppSettings:UseContractSync",
            "AppSettings:UseHttpLogging",
            "AppSettings:UseForwardProxy",
            "AppSettings:UseResponseComression",
            "AppSettings:InstallType",
            "AppSettings:ApplicationID",
            "AppSettings:ProgramName",
            "AppSettings:RunningEnvironment",
            "AppSettings:HostName",
            "AppSettings:SystemID",
            "AppSettings:IsSwaggerUI",
            "AppSettings:IsModulePurgeContract",
            "AppSettings:SessionState",
            "AppSettings:ProxyBasePath",
            "AppSettings:IsAntiforgeryToken",
            "AppSettings:TenantAppBasePath",
            "AppSettings:BatchProgramBasePath",
            "AppSettings:CreateAppTempPath",
            "AppSettings:ForbesBasePath",
            "AppSettings:LoadModuleBasePath",
            "AppSettings:LoadModules",
            "AppSettings:LoadModuleLicenses",
            "AppSettings:ModuleConfigurationUrl",
            "AppSettings:DiscoveryApiServerUrl",
            "AppSettings:DomainAPIServer",
            "AppSettings:ComressionEnableForHttps",
            "AppSettings:ComressionMimeTypes",
            "AppSettings:ForwardProxyIP",
            "AppSettings:UseSameIPProxy",
            "AppSettings:AuthenticationLoginPath",
            "AppSettings:AuthenticationLogoutPath",
            "AppSettings:SqidsAlphabet",
            "AppSettings:LicenseKey",
            "AppSettings:LicenseSignature",
            "AppSettings:WithOrigins"
        };

        public RuntimeConfigurationService(ILogger logger)
        {
            this.logger = logger;
        }

        public GlobalConfigurationSnapshot GetGlobalConfigurationSnapshot()
        {
            var values = new Dictionary<string, object?>()
            {
                ["AppSettings:BusinessServerUrl"] = GlobalConfiguration.BusinessServerUrl,
                ["AppSettings:FindGlobalIDServer"] = GlobalConfiguration.FindGlobalIDServer,
                ["AppSettings:HostAccessID"] = GlobalConfiguration.HostAccessID,
                ["AppSettings:IsTenantFunction"] = GlobalConfiguration.IsTenantFunction,
                ["AppSettings:IsExceptionDetailText"] = GlobalConfiguration.IsExceptionDetailText,
                ["AppSettings:ContractRequestPath"] = GlobalConfiguration.ContractRequestPath,
                ["AppSettings:TenantAppRequestPath"] = GlobalConfiguration.TenantAppRequestPath,
                ["AppSettings:CookiePrefixName"] = GlobalConfiguration.CookiePrefixName,
                ["AppSettings:UserSignExpire"] = GlobalConfiguration.UserSignExpire,
                ["AppSettings:StaticFileCacheMaxAge"] = GlobalConfiguration.StaticFileCacheMaxAge,
                ["AppSettings:WithOnlyIPs"] = GlobalConfiguration.WithOnlyIPs.ToArray(),
                ["AppSettings:IsPermissionRoles"] = GlobalConfiguration.IsPermissionRoles,
                ["AppSettings:PermissionRoles"] = GlobalConfiguration.PermissionRoles
            };

            return new GlobalConfigurationSnapshot()
            {
                Values = values,
                RealtimeApplicableKeys = realtimeGlobalAppliers.Keys.OrderBy(p => p).ToList(),
                RestartRequiredKeys = restartRequiredGlobalKeys.OrderBy(p => p).ToList()
            };
        }

        public ModuleMediatorConfigurationSnapshot GetModuleMediatorConfigurationSnapshot()
        {
            var modules = GlobalConfiguration.Modules
                .Select(p => new ModuleMediatorConfigurationItem()
                {
                    ModuleID = p.ModuleID,
                    EventAction = p.EventAction.ToList(),
                    SubscribeAction = p.SubscribeAction.ToList()
                })
                .OrderBy(p => p.ModuleID)
                .ToList();

            return new ModuleMediatorConfigurationSnapshot()
            {
                Modules = modules
            };
        }

        public ConfigurationApplyResult ApplyGlobalConfiguration(GlobalConfigurationApplyRequest request)
        {
            var result = new ConfigurationApplyResult()
            {
                PersistToFile = request.PersistToFile
            };

            if (request.Values == null || request.Values.Count == 0)
            {
                result.Errors.Add("values is required.");
                return result;
            }

            lock (syncRoot)
            {
                foreach (var pair in request.Values)
                {
                    var normalizedKey = NormalizeGlobalKey(pair.Key);
                    if (string.IsNullOrWhiteSpace(normalizedKey) == true)
                    {
                        result.IgnoredKeys.Add(pair.Key);
                        continue;
                    }

                    if (realtimeGlobalAppliers.TryGetValue(normalizedKey, out var applyAction) == true)
                    {
                        var beforeErrorCount = result.Errors.Count;
                        applyAction(pair.Value, result);
                        if (result.Errors.Count == beforeErrorCount)
                        {
                            result.AppliedKeys.Add(normalizedKey);
                            UpdateConfigurationRoot(normalizedKey, pair.Value);
                        }
                    }
                    else if (normalizedKey.StartsWith("AppSettings:", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        result.RestartRequiredKeys.Add(normalizedKey);
                    }
                    else
                    {
                        result.IgnoredKeys.Add(pair.Key);
                    }
                }

                if (request.PersistToFile == true)
                {
                    PersistAppSettings(request.Values, result);
                }
            }

            if (result.Errors.Count > 0)
            {
                logger.Warning("[{LogCategory}] Runtime GlobalConfiguration apply completed with errors: {Errors}", "RuntimeConfigurationService/ApplyGlobalConfiguration", string.Join(", ", result.Errors));
            }

            return result;
        }

        public ConfigurationApplyResult ApplyModuleMediatorConfiguration(string moduleID, ModuleMediatorConfigurationApplyRequest request)
        {
            var result = new ConfigurationApplyResult()
            {
                PersistToFile = request.PersistToFile
            };

            if (string.IsNullOrWhiteSpace(moduleID) == true)
            {
                result.Errors.Add("moduleID is required.");
                return result;
            }

            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID.Equals(moduleID, StringComparison.OrdinalIgnoreCase));
            if (module == null)
            {
                result.Errors.Add($"moduleID '{moduleID}' not found.");
                return result;
            }

            if (request.EventAction == null && request.SubscribeAction == null)
            {
                result.Errors.Add("eventAction or subscribeAction is required.");
                return result;
            }

            lock (syncRoot)
            {
                if (request.EventAction != null)
                {
                    module.EventAction = NormalizeActions(request.EventAction);
                    result.AppliedKeys.Add("ModuleConfig:EventAction");
                }

                if (request.SubscribeAction != null)
                {
                    module.SubscribeAction = NormalizeActions(request.SubscribeAction);
                    result.AppliedKeys.Add("ModuleConfig:SubscribeAction");
                }

                if (request.PersistToFile == true)
                {
                    PersistModuleSetting(module, request, result);
                }
            }

            if (result.Errors.Count > 0)
            {
                logger.Warning("[{LogCategory}] Runtime ModuleConfiguration apply completed with errors. moduleID: {ModuleID}, Errors: {Errors}", "RuntimeConfigurationService/ApplyModuleMediatorConfiguration", module.ModuleID, string.Join(", ", result.Errors));
            }

            return result;
        }

        private static List<string> NormalizeActions(IEnumerable<string> actions)
        {
            return actions
                .Where(p => string.IsNullOrWhiteSpace(p) == false)
                .Select(p => p.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();
        }

        private static string NormalizeGlobalKey(string key)
        {
            var result = key.ToStringSafe().Trim();
            if (string.IsNullOrWhiteSpace(result) == true)
            {
                return "";
            }

            if (result.StartsWith("AppSettings:", StringComparison.OrdinalIgnoreCase) == false)
            {
                result = $"AppSettings:{result}";
            }

            return result;
        }

        private static bool TryReadBoolean(JToken token, out bool value)
        {
            if (token.Type == JTokenType.Boolean)
            {
                value = token.Value<bool>();
                return true;
            }

            return bool.TryParse(token.ToString(), out value);
        }

        private static bool TryReadInt32(JToken token, out int value)
        {
            if (token.Type == JTokenType.Integer)
            {
                value = token.Value<int>();
                return true;
            }

            return int.TryParse(token.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
        }

        private static void UpdateConfigurationRoot(string key, JToken value)
        {
            if (GlobalConfiguration.ConfigurationRoot == null)
            {
                return;
            }

            switch (value.Type)
            {
                case JTokenType.String:
                case JTokenType.Integer:
                case JTokenType.Float:
                case JTokenType.Boolean:
                    GlobalConfiguration.ConfigurationRoot[key] = value.ToString();
                    break;
            }
        }

        private static string GetAppSettingsFilePath()
        {
            var appSettingsFilePath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "appsettings.json");
            if (File.Exists(appSettingsFilePath) == false)
            {
                appSettingsFilePath = PathExtensions.Combine(Environment.CurrentDirectory, "appsettings.json");
            }

            return appSettingsFilePath;
        }

        private static void SetTokenValueByPath(JObject root, string keyPath, JToken value)
        {
            var segments = keyPath.Split(':', StringSplitOptions.RemoveEmptyEntries);
            var current = root;
            for (var i = 0; i < segments.Length - 1; i++)
            {
                var segment = segments[i];
                if (current[segment] is not JObject child)
                {
                    child = new JObject();
                    current[segment] = child;
                }

                current = child;
            }

            current[segments[^1]] = value.DeepClone();
        }

        private void PersistAppSettings(Dictionary<string, JToken> values, ConfigurationApplyResult result)
        {
            try
            {
                var appSettingsFilePath = GetAppSettingsFilePath();
                if (File.Exists(appSettingsFilePath) == false)
                {
                    result.Errors.Add($"appsettings file not found: {appSettingsFilePath}");
                    return;
                }

                var appSettingsText = File.ReadAllText(appSettingsFilePath);
                var root = JObject.Parse(appSettingsText);
                foreach (var pair in values)
                {
                    var normalizedKey = NormalizeGlobalKey(pair.Key);
                    if (string.IsNullOrWhiteSpace(normalizedKey) == true)
                    {
                        continue;
                    }

                    SetTokenValueByPath(root, normalizedKey, pair.Value);
                }

                File.WriteAllText(appSettingsFilePath, root.ToString(Formatting.Indented));
                result.Persisted = true;
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] appsettings save failed", "RuntimeConfigurationService/PersistAppSettings");
                result.Errors.Add("appsettings save failed.");
            }
        }

        private void PersistModuleSetting(ModuleInfo module, ModuleMediatorConfigurationApplyRequest request, ConfigurationApplyResult result)
        {
            try
            {
                var moduleSettingFilePath = module.ModuleSettingFilePath.ToStringSafe();
                if (string.IsNullOrWhiteSpace(moduleSettingFilePath) == true)
                {
                    result.Errors.Add($"module setting file path is empty. moduleID: {module.ModuleID}");
                    return;
                }

                if (Path.IsPathRooted(moduleSettingFilePath) == false)
                {
                    moduleSettingFilePath = Path.GetFullPath(moduleSettingFilePath, GlobalConfiguration.EntryBasePath);
                }

                if (File.Exists(moduleSettingFilePath) == false)
                {
                    result.Errors.Add($"module setting file not found: {moduleSettingFilePath}");
                    return;
                }

                var moduleSettingText = File.ReadAllText(moduleSettingFilePath);
                var root = JObject.Parse(moduleSettingText);
                var moduleConfig = root["ModuleConfig"] as JObject ?? new JObject();
                if (request.EventAction != null)
                {
                    moduleConfig["EventAction"] = JArray.FromObject(module.EventAction);
                }

                if (request.SubscribeAction != null)
                {
                    moduleConfig["SubscribeAction"] = JArray.FromObject(module.SubscribeAction);
                }

                root["ModuleConfig"] = moduleConfig;

                File.WriteAllText(moduleSettingFilePath, root.ToString(Formatting.Indented));
                result.Persisted = true;
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] module setting save failed. moduleID: {ModuleID}", "RuntimeConfigurationService/PersistModuleSetting", module.ModuleID);
                result.Errors.Add($"module setting save failed. moduleID: {module.ModuleID}");
            }
        }
    }

    internal class GlobalConfigurationApplyRequest
    {
        public Dictionary<string, JToken> Values { get; set; } = new Dictionary<string, JToken>(StringComparer.OrdinalIgnoreCase);

        public bool PersistToFile { get; set; } = true;
    }

    internal class ModuleMediatorConfigurationApplyRequest
    {
        public List<string>? EventAction { get; set; }

        public List<string>? SubscribeAction { get; set; }

        public bool PersistToFile { get; set; } = true;
    }

    internal class ConfigurationApplyResult
    {
        public bool PersistToFile { get; set; }

        public bool Persisted { get; set; }

        public List<string> AppliedKeys { get; set; } = new List<string>();

        public List<string> RestartRequiredKeys { get; set; } = new List<string>();

        public List<string> IgnoredKeys { get; set; } = new List<string>();

        public List<string> Errors { get; set; } = new List<string>();
    }

    internal class GlobalConfigurationSnapshot
    {
        public Dictionary<string, object?> Values { get; set; } = new Dictionary<string, object?>();

        public List<string> RealtimeApplicableKeys { get; set; } = new List<string>();

        public List<string> RestartRequiredKeys { get; set; } = new List<string>();
    }

    internal class ModuleMediatorConfigurationSnapshot
    {
        public List<ModuleMediatorConfigurationItem> Modules { get; set; } = new List<ModuleMediatorConfigurationItem>();
    }

    internal class ModuleMediatorConfigurationItem
    {
        public string ModuleID { get; set; } = "";

        public List<string> EventAction { get; set; } = new List<string>();

        public List<string> SubscribeAction { get; set; } = new List<string>();
    }
}
