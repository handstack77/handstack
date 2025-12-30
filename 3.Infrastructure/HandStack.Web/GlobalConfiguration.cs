using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Licensing;
using HandStack.Web.Entity;
using HandStack.Web.Model;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json.Linq;

using Serilog;

namespace HandStack.Web
{
    public class ModuleSetting
    {
        public string ModuleID { get; set; }

        public string Name { get; set; }

        public string ApplicationID { get; set; }

        public string Company { get; set; }

        public bool IsRequiredLicense { get; set; }

        public bool IsBundledWithHost { get; set; }

        public bool IsCopyContract { get; set; }

        public bool IsPurgeContract { get; set; }

        public string Version { get; set; }

        public ModuleSetting()
        {
            ModuleID = "";
            Name = "";
            ApplicationID = "HDS";
            Company = "";
            IsRequiredLicense = false;
            IsBundledWithHost = false;
            IsCopyContract = true;
            IsPurgeContract = false;
            Version = "";
        }
    }

    public static class GlobalConfiguration
    {
        public static IConfigurationRoot? ConfigurationRoot = null;
        public static string InstallType = "L";
        public static string RunningEnvironment = "D";
        public static string OSPlatform = "";
        public static string HostName = "";
        public static string SystemName = "";
        public static string HardwareID = "HANDSTACK_HOSTACCESSID";
        public static string HostAccessID = "HANDSTACK_HOSTACCESSID";
        public static string SystemID = "HANDSTACK";
        public static string ProcessID = "";
        public static string ProcessName = "";
        public static bool UseStaticFilesAuthorize = false;
        public static string ApplicationID = "HDS";
        public static string ApplicationName = "";
        public static string ApplicationVersion = "";
        public static string EntryBasePath = "";
        public static string ContentRootPath = "";
        public static string ContractRequestPath = "";
        public static string EnvironmentName = "";
        public static string WebRootPath = "";
        public static string BusinessServerUrl = "";
        public static int StaticFileCacheMaxAge = 0;
        public static bool IsTenantFunction = false;
        public static bool IsExceptionDetailText = false;
        public static bool IsSwaggerUI = false;
        public static bool IsModulePurgeContract = true;
        public static string TenantAppRequestPath = "";
        public static string TenantAppBasePath = "";
        public static string BatchProgramBasePath = "";
        public static string CreateAppTempPath = "";
        public static string ForbesBasePath = "";
        public static string LoadModuleBasePath = "";
        public static string LoadContractBasePath = "";
        public static int UserSignExpire = 720;
        public static string CookiePrefixName = "";
        public static string ServerLocalIP = "127.0.0.1";
        public static int OriginPort = 80;
        public static int ServerPort = 8421;
        public static int ServerDevCertSslPort = 8443;
        public static string ServerDevCertFilePath = "";
        public static string? ServerDevCertPassword;
        public static string ExternalIPAddress = "";
        public static bool IsApiFindServer = true;
        public static bool IsRunning = false;
        public static List<string> PhysicalFileProviders = new List<string>();
        public static List<string> DisposeTenantApps = new List<string>();
        public static List<string> WithOrigins = new List<string>();
        public static string FindGlobalIDServer = "";
        public static List<Exception?> UnhandledExceptions = new List<Exception?>();
        public static JObject? DomainAPIServer = null;
        public static List<string> ByPassBootstrappingLoggingKey = new List<string>();
        public static FileExtensionContentTypeProvider ContentTypeProvider = new FileExtensionContentTypeProvider();
        public static Dictionary<string, string> StaticFilesAllowRolePath = new Dictionary<string, string>();
        public static List<string> ModuleConfigurationUrl = new List<string>();
        public static Dictionary<string, ApplicationCodeSetting?> ApplicationCodes = new Dictionary<string, ApplicationCodeSetting?>();
        public static string ApplicationRuntimeID = Guid.NewGuid().ToString("N");
        public static string SessionCookieName = "";
        public static string ContentSecurityPolicy = "";
        public static List<string> ModuleNames { get; set; } = new List<string>();
        public static List<ModuleInfo> Modules { get; set; } = new List<ModuleInfo>();
        public static bool IsPermissionRoles = false;
        public static List<PermissionRoles> PermissionRoles { get; set; } = new List<PermissionRoles>();
        public static Dictionary<string, LicenseItem> LoadModuleLicenses { get; set; } = new Dictionary<string, LicenseItem>();

        public static string DefaultCulture => "ko-KR";

        public static string GetBaseDirectoryPath(string? basePath, string? defaultPath = "")
        {
            basePath = Environment.ExpandEnvironmentVariables(basePath.ToStringSafe());
            basePath = string.IsNullOrEmpty(basePath) == true ? "" : (basePath.StartsWith(".") == true ? Path.GetFullPath(basePath, EntryBasePath) : new DirectoryInfo(basePath).FullName.Replace("\\", "/"));
            if (string.IsNullOrEmpty(basePath) == true && string.IsNullOrEmpty(defaultPath) == false)
            {
                basePath = defaultPath;
            }

            basePath = basePath.Replace("\\", "/");

            if (string.IsNullOrEmpty(basePath) == false && Directory.Exists(basePath) == false)
            {
                try
                {
                    Directory.CreateDirectory(basePath);
                }
                catch
                {
                    var filePath = Path.GetDirectoryName(basePath);
                    if (string.IsNullOrEmpty(filePath) == false)
                    {
                        Directory.CreateDirectory(filePath);
                    }
                }
            }
            return basePath;
        }

        public static string GetBaseFilePath(string? basePath, string? defaultPath = "")
        {
            basePath = Environment.ExpandEnvironmentVariables(basePath.ToStringSafe());
            basePath = string.IsNullOrEmpty(basePath) == true ? "" : (basePath.StartsWith(".") == true ? Path.GetFullPath(basePath, EntryBasePath) : new FileInfo(basePath).FullName.Replace("\\", "/"));
            if (string.IsNullOrEmpty(basePath) == true && string.IsNullOrEmpty(defaultPath) == false)
            {
                basePath = defaultPath;
            }

            basePath = basePath.Replace("\\", "/");

            if (string.IsNullOrEmpty(basePath) == false && File.Exists(basePath) == false)
            {
                try
                {
                    var directoryPath = Path.GetDirectoryName(basePath);
                    if (string.IsNullOrEmpty(directoryPath) == false && Directory.Exists(directoryPath) == false)
                    {
                        Directory.CreateDirectory(directoryPath);
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] 파일 디렉토리 생성 확인 필요: {BasePath}", "GlobalConfiguration/GetBaseFilePath", basePath);
                }
            }
            return basePath;
        }

        public static bool InitailizeAppSetting(Dictionary<string, JToken> transactionResult)
        {
            var result = false;
            if (transactionResult.Count > 0 && transactionResult.ContainsKey("HasException") == false)
            {
                lock (ApplicationCodes)
                {
                    string? codeID = null;
                    foreach (var item in transactionResult["GridData0"])
                    {
                        codeID = item.Value<string>("CodeID");
                        if (codeID != null)
                        {
                            if (ApplicationCodes.ContainsKey(codeID) == true)
                            {
                                ApplicationCodes.Remove(codeID);
                            }

                            ApplicationCodes.Add(codeID, new ApplicationCodeSetting()
                            {
                                CodeID = codeID,
                                Value = item.Value<string>("Value"),
                                DataType = item.Value<string>("DataType"),
                                Area = item.Value<string>("Area"),
                                CommonYN = (item.Value<string>("CommonYN").ToBoolean() == true)
                            });
                        }
                    }
                }

                result = true;
            }
            else
            {
                if (transactionResult.ContainsKey("HasException") == true)
                {
                    Log.Error("[{LogCategory}] " + transactionResult["HasException"].ToString(), "IndexController/InitailizeAppSettingAsync");
                }
                else
                {
                    Log.Error("[{LogCategory}] Core 환경설정 조회 오류", "IndexController/InitailizeAppSettingAsync");
                }
            }

            return result;
        }

        public static bool ClearPrivateAppSetting(string moduleID)
        {
            var result = false;
            var clearModuleAppSettings = ApplicationCodes.Where(x => x.Value != null && x.Value.Area == moduleID && x.Value.CommonYN == false).ToList();
            if (clearModuleAppSettings.Any() == true)
            {
                lock (ApplicationCodes)
                {
                    for (var i = clearModuleAppSettings.Count(); 0 < i; --i)
                    {
                        var item = clearModuleAppSettings[i];
                        ApplicationCodes.Remove(item.Key);
                    }
                }
            }

            return result;
        }

        public static StringBuilder BootstrappingVariables(IWebHostEnvironment environment)
        {
            var sb = new StringBuilder();
            var nl = Environment.NewLine;

            sb.Append($"ApplicationName: {environment.ApplicationName}{nl}");
            sb.Append($"ContentRootFileProvider: {environment.ContentRootFileProvider}{nl}");
            sb.Append($"ContentRootPath: {environment.ContentRootPath}{nl}");
            sb.Append($"EnvironmentName: {environment.EnvironmentName}{nl}");
            sb.Append($"WebRootFileProvider: {environment.WebRootFileProvider}{nl}");
            sb.Append($"WebRootPath: {environment.WebRootPath}{nl}");

            return sb;
        }

        public static StringBuilder BootstrappingVariables(IConfigurationRoot configuration)
        {
            var sb = new StringBuilder();
            var nl = Environment.NewLine;
            var rule = string.Concat(nl, new string('-', 40), nl);

            sb.Append($"{nl}");
            sb.Append($"EntryBasePath: {GlobalConfiguration.EntryBasePath}");
            sb.Append($"{nl}Configuration{rule}");
            foreach (var pair in configuration.AsEnumerable())
            {
                if (ByPassBootstrappingLoggingKey.Contains(pair.Key) == false)
                {
                    sb.Append($"{pair.Key}: {pair.Value}{nl}");
                }
            }
            sb.Append(nl);

            sb.Append($"Environment Variables{rule}");
            var vars = Environment.GetEnvironmentVariables();
            foreach (var key in vars.Keys.Cast<string>().OrderBy(key => key, StringComparer.OrdinalIgnoreCase))
            {
                if (ByPassBootstrappingLoggingKey.Contains(key) == false)
                {
                    var value = vars[key];
                    sb.Append($"{key}: {value}{nl}");
                }
            }

            return sb;
        }
    }
}
