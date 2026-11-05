using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
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

    public static partial class GlobalConfiguration
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
        public static string WebHostRootPath = "";
        public static string BusinessServerUrl = "";
        public static int StaticFileCacheMaxAge = 0;
        public static bool IsExceptionDetailText = false;
        public static bool IsEnabledDevAutoSignIn = false;
        public static bool IsConfigurationWatching = false;
        public static bool IsSwaggerUI = false;
        public static bool IsModulePurgeContract = true;
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
        public static List<string> PhysicalFileProviders = [];
        public static List<string> WithOrigins = [];
        public static List<string> WithOnlyIPs = [];
        public static string FindGlobalIDServer = "";
        public static List<Exception?> UnhandledExceptions = [];
        public static List<string> ByPassBootstrappingLoggingKey = [];
        public static FileExtensionContentTypeProvider ContentTypeProvider = new();
        public static Dictionary<string, string> StaticFilesAllowRolePath = [];
        public static List<string> ModuleConfigurationUrl = [];
        public static Dictionary<string, ApplicationCodeSetting?> ApplicationCodes = [];
        public static string ApplicationRuntimeID = Guid.NewGuid().ToString("N");
        public static string SessionCookieName = "";
        public static string ContentSecurityPolicy = "";
        public static List<string> ModuleNames { get; set; } = [];
        public static List<ModuleInfo> Modules { get; set; } = [];
        public static bool IsPermissionRoles = false;
        public static List<PermissionRoles> PermissionRoles { get; set; } = [];
        public static Dictionary<string, LicenseItem> LoadModuleLicenses { get; set; } = [];

        public static string DefaultCulture => "ko-KR";
        public static string ProxyBasePath = "";
        public static bool IsAntiforgeryToken = false;

        /// <summary>
        /// 경로 문자열의 %NAME%, ${NAME}, $NAME 환경변수 표기를 치환한다.
        /// 값이 없는 변수는 원문 표기를 유지하고 경고 로그를 남긴다.
        /// </summary>
        public static string ExpandPathVariables(string? path)
        {
            var unresolvedNames = new List<string>();
            var expandedPath = EnvironmentVariableHelper.Expand(path, unresolvedNames);
            if (unresolvedNames.Count > 0)
            {
                Log.Logger.Warning("[{LogCategory}] 환경변수 치환 실패: {UnresolvedNames} 값이 없거나 비어 있어 원문을 유지합니다. 원본 경로: {OriginalPath}", "GlobalConfiguration/ExpandPathVariables", string.Join(", ", unresolvedNames), path);
            }

            return expandedPath;
        }

        public static string GetBaseDirectoryPath(string? basePath, string? defaultPath = "")
        {
            basePath = ExpandPathVariables(basePath);
            defaultPath = ExpandPathVariables(defaultPath);

            basePath = string.IsNullOrWhiteSpace(basePath) ? "" : (basePath.StartsWith('.') == true ? Path.GetFullPath(basePath, EntryBasePath) : new DirectoryInfo(basePath).FullName.Replace("\\", "/"));
            if (string.IsNullOrWhiteSpace(basePath) && !string.IsNullOrWhiteSpace(defaultPath))
            {
                basePath = defaultPath;
            }

            basePath = basePath.Replace("\\", "/");

            if (!string.IsNullOrWhiteSpace(basePath) && Directory.Exists(basePath) == false)
            {
                try
                {
                    Directory.CreateDirectory(basePath);
                }
                catch
                {
                    var filePath = Path.GetDirectoryName(basePath);
                    if (!string.IsNullOrWhiteSpace(filePath))
                    {
                        Directory.CreateDirectory(filePath);
                    }
                }
            }
            return basePath;
        }

        public static string GetBaseFilePath(string? basePath, string? defaultPath = "")
        {
            basePath = ExpandPathVariables(basePath);
            defaultPath = ExpandPathVariables(defaultPath);

            basePath = string.IsNullOrWhiteSpace(basePath) ? "" : (basePath.StartsWith('.') == true ? Path.GetFullPath(basePath, EntryBasePath) : new FileInfo(basePath).FullName.Replace("\\", "/"));
            if (string.IsNullOrWhiteSpace(basePath) && !string.IsNullOrWhiteSpace(defaultPath))
            {
                basePath = defaultPath;
            }

            basePath = basePath.Replace("\\", "/");

            if (!string.IsNullOrWhiteSpace(basePath) && File.Exists(basePath) == false)
            {
                try
                {
                    var directoryPath = Path.GetDirectoryName(basePath);
                    if (!string.IsNullOrWhiteSpace(directoryPath) && Directory.Exists(directoryPath) == false)
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
            ArgumentNullException.ThrowIfNull(transactionResult);
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
            if (clearModuleAppSettings.Count != 0 == true)
            {
                lock (ApplicationCodes)
                {
                    for (var i = clearModuleAppSettings.Count; 0 < i; --i)
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

            ArgumentNullException.ThrowIfNull(environment);
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

