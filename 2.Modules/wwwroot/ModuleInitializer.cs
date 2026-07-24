using System;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json;

using Serilog;

using wwwroot.Entity;
using wwwroot.Extensions;

namespace wwwroot
{
    public class ModuleInitializer : IModuleInitializer
    {
        public string? ModuleID;

        public ModuleInitializer()
        {
            ModuleID = typeof(ModuleInitializer).Assembly.GetName().Name;
        }

        public void ConfigureServices(IServiceCollection services, IWebHostEnvironment environment, IConfiguration configuration)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module != null)
            {
                var moduleSettingFilePath = module.ModuleSettingFilePath;
                if (File.Exists(moduleSettingFilePath) == true)
                {
                    var configurationText = File.ReadAllText(moduleSettingFilePath);
                    var moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        var moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.AuthorizationKey = !string.IsNullOrWhiteSpace(moduleConfig.AuthorizationKey) ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.FileSyncTokens = moduleConfig.FileSyncTokens?
                            .Where(p => !string.IsNullOrWhiteSpace(p))
                            .Select(p => p.Trim())
                            .Distinct(StringComparer.Ordinal)
                            .ToList() ?? new System.Collections.Generic.List<string>();
                        ModuleConfiguration.CreateIDPolicy = moduleConfig.CreateIDPolicy ?? new CreateIDPolicyConfig();
                        ModuleConfiguration.CreateIDPolicy.AllowedScreens ??= new System.Collections.Generic.List<string>();
                        ModuleConfiguration.CreateIDPolicy.AuthorizationKeys ??= new System.Collections.Generic.List<CreateIDAuthorizationKeyConfig>();
                        foreach (var authorizationKey in ModuleConfiguration.CreateIDPolicy.AuthorizationKeys)
                        {
                            authorizationKey.AllowedIPs ??= new System.Collections.Generic.List<string>();
                        }
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.SystemVaultKey = moduleConfig.SystemVaultKey;
                        ModuleConfiguration.ContractBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ContractBasePath);
                        ModuleConfiguration.WWWRootBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.WWWRootBasePath);
                        ModuleConfiguration.ModuleLogFilePath = GlobalConfiguration.GetBaseFilePath(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.IsModuleLogging = !string.IsNullOrWhiteSpace(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.ModuleFilePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleFilePath);
                        ModuleConfiguration.TenantAppOrigins.Clear();
                        ModuleConfiguration.TenantAppReferers.Clear();
                        GlobalConfiguration.ContractRequestPath = string.IsNullOrWhiteSpace(moduleConfig.ContractRequestPath) ? "view" : moduleConfig.ContractRequestPath;
                        ModuleConfiguration.SharedFiles = LoadSharedFiles(moduleConfig.SharedFileConfigPath);

                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        var message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleSettingFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    var message = $"module.json 파일 확인 필요: {moduleSettingFilePath}";
                    Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                    throw new FileNotFoundException(message);
                }

                if (Directory.Exists(GlobalConfiguration.TenantAppBasePath) == true)
                {
                    foreach (var userWorkPath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                    {
                        var workDirectoryInfo = new DirectoryInfo(userWorkPath);
                        var userWorkID = workDirectoryInfo.Name;
                        foreach (var appBasePath in Directory.GetDirectories(userWorkPath))
                        {
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                var applicationID = directoryInfo.Name;
                                var tenantID = $"{userWorkID}|{applicationID}";
                                var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                                if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                                {
                                    try
                                    {
                                        var appSettingText = File.ReadAllText(settingFilePath);
                                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                        if (appSetting != null)
                                        {
                                            var withOriginUris = appSetting.WithOrigin;

                                            if (withOriginUris != null)
                                            {
                                                if (ModuleConfiguration.TenantAppOrigins.ContainsKey(tenantID) == true)
                                                {
                                                    Log.Logger.Warning("[{LogCategory}] " + $"'{applicationID}' WithOrigin 중복 확인 필요 ", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                                }
                                                else
                                                {
                                                    ModuleConfiguration.TenantAppOrigins.Add(tenantID, withOriginUris);
                                                }
                                            }

                                            var withRefererUris = appSetting.WithReferer;

                                            if (withRefererUris != null)
                                            {
                                                if (ModuleConfiguration.TenantAppReferers.ContainsKey(tenantID) == true)
                                                {
                                                    Log.Logger.Warning("[{LogCategory}] " + $"'{applicationID}' WithReferer 중복 확인 필요 ", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                                }
                                                else
                                                {
                                                    ModuleConfiguration.TenantAppReferers.Add(tenantID, withRefererUris);
                                                }
                                            }
                                        }
                                    }
                                    catch (Exception exception)
                                    {
                                        Log.Logger.Warning("[{LogCategory}] " + $"Tenant settings 확인 필요: {settingFilePath}, {exception.Message}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                    }
                                }
                            }
                        }
                    }
                }

                services.AddScoped<ModuleApiClient>();
                services.AddTransient<ISequentialIdGenerator, SequentialIdGenerator>();
            }
        }

        // module.json ModuleConfig.SharedFileConfigPath가 가리키는 "공통 파일 관리" 정보 파일(items[].requestPath/hostFilePath)을 읽어온다.
        private static System.Collections.Generic.List<SharedFileEntry> LoadSharedFiles(string? configPath)
        {
            var result = new System.Collections.Generic.List<SharedFileEntry>();
            var resolvedConfigPath = ResolveExistingFilePath(configPath);
            if (string.IsNullOrWhiteSpace(resolvedConfigPath) == true)
            {
                return result;
            }

            if (File.Exists(resolvedConfigPath) == false)
            {
                Log.Logger.Warning("[{LogCategory}] " + $"공통 파일 관리 정보 파일을 찾을 수 없습니다: {resolvedConfigPath}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadSharedFiles");
                return result;
            }

            try
            {
                var catalogText = File.ReadAllText(resolvedConfigPath);
                var catalog = JsonConvert.DeserializeObject<SharedFileCatalog>(catalogText);
                foreach (var item in catalog?.Items ?? new System.Collections.Generic.List<SharedFileEntry>())
                {
                    var hostFilePath = ResolveExistingFilePath(item.HostFilePath);
                    if (string.IsNullOrWhiteSpace(item.RequestPath) == false && string.IsNullOrWhiteSpace(hostFilePath) == false)
                    {
                        result.Add(new SharedFileEntry { RequestPath = item.RequestPath, HostFilePath = hostFilePath });
                    }
                }
            }
            catch (Exception exception)
            {
                Log.Logger.Warning("[{LogCategory}] " + $"공통 파일 관리 정보 파일 확인 필요: {resolvedConfigPath}, {exception.Message}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadSharedFiles");
            }

            return result;
        }

        // 환경변수를 확장하고, 상대경로면 모듈 실행 기준 경로와 결합한다. 로그 파일 경로 등과 달리 존재 여부만 확인하는 읽기 전용 경로이므로 디렉토리를 새로 만들지 않는다.
        private static string ResolveExistingFilePath(string? path)
        {
            var resolved = Environment.ExpandEnvironmentVariables((path ?? "").Trim());
            if (string.IsNullOrWhiteSpace(resolved) == true)
            {
                return "";
            }

            return Path.IsPathRooted(resolved) == true ? resolved : Path.GetFullPath(Path.Combine(GlobalConfiguration.EntryBasePath, resolved));
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == typeof(ModuleInitializer).Assembly.GetName().Name);
            if (!string.IsNullOrWhiteSpace(ModuleID) && module != null)
            {
                app.UseMiddleware<SharedFileServingMiddleware>();

                var wwwrootContractBasePath = PathExtensions.Combine(ModuleConfiguration.ContractBasePath, GlobalConfiguration.ApplicationID);
                if (!string.IsNullOrWhiteSpace(ModuleConfiguration.ContractBasePath) && Directory.Exists(wwwrootContractBasePath) == true)
                {
                    ModuleConfiguration.IsContractRequestPath = true;
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(wwwrootContractBasePath),
                        RequestPath = "/" + GlobalConfiguration.ContractRequestPath,
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
                            if (WithOnlyIPFilter.TryRejectStaticFile(httpContext.Context, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure") == true)
                            {
                                return;
                            }

                            var policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                            .ConfigureAwait(false)
                            .GetAwaiter().GetResult();

                            if (policy != null)
                            {
                                try
                                {
                                    var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                    corsService.ApplyResult(corsResult, httpContext.Context.Response);
                                }
                                catch
                                {
                                    Log.Logger.Warning("[{LogCategory}] " + $"ContractBasePath corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                        }
                    });
                }

                var wwwrootDirectory = string.IsNullOrWhiteSpace(ModuleConfiguration.WWWRootBasePath) ? PathExtensions.Combine(module.BasePath, "wwwroot") : ModuleConfiguration.WWWRootBasePath;
                if (!string.IsNullOrWhiteSpace(wwwrootDirectory) && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseMiddleware<CaseInsensitiveStaticFileMiddleware>(wwwrootDirectory);
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
                            if (WithOnlyIPFilter.TryRejectStaticFile(httpContext.Context, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure") == true)
                            {
                                return;
                            }

                            if (ModuleConfiguration.IsContractRequestPath == true)
                            {
                                if (httpContext.Context.Request.Path.ToString().StartsWith($"/{GlobalConfiguration.ContractRequestPath}/") == true)
                                {
                                    httpContext.Context.Response.StatusCode = StatusCodes.Status404NotFound;
                                    httpContext.Context.Response.ContentLength = 0;
                                    httpContext.Context.Response.Body = Stream.Null;
                                    return;
                                }
                            }

                            var policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                            .ConfigureAwait(false)
                            .GetAwaiter().GetResult();

                            if (policy != null)
                            {
                                try
                                {
                                    var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                    corsService.ApplyResult(corsResult, httpContext.Context.Response);
                                }
                                catch
                                {
                                    Log.Logger.Warning("[{LogCategory}] " + $"WWWRootBasePath corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }

                            if (httpContext.Context.Request.Path.ToString().IndexOf("syn.loader.") > -1)
                            {
                                if (httpContext.Context.Response.Headers.ContainsKey("Cache-Control") == false)
                                {
                                    httpContext.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");
                                }

                                if (httpContext.Context.Response.Headers.ContainsKey("Expires") == false)
                                {
                                    httpContext.Context.Response.Headers.Append("Expires", "-1");
                                }
                            }
                            else if (GlobalConfiguration.StaticFileCacheMaxAge > 0)
                            {
                                if (httpContext.Context.Response.Headers.ContainsKey("Cache-Control") == true)
                                {
                                    httpContext.Context.Response.Headers.Remove("Cache-Control");
                                }

                                httpContext.Context.Response.Headers.Append("Cache-Control", $"public, max-age={GlobalConfiguration.StaticFileCacheMaxAge}");
                            }

                            if (httpContext.Context.Response.Headers.ContainsKey("p3p") == true)
                            {
                                httpContext.Context.Response.Headers.Remove("p3p");
                            }

                            httpContext.Context.Response.Headers.Append("p3p", "CP=\"ALL ADM DEV PSAi COM OUR OTRo STP IND ONL\"");
                        }
                    });

                    var libDirectoryPath = PathExtensions.Combine(wwwrootDirectory, "lib");
                    if (Directory.Exists(libDirectoryPath) == true)
                    {
                        app.UseDirectoryBrowser(new DirectoryBrowserOptions
                        {
                            FileProvider = new PhysicalFileProvider(libDirectoryPath),
                            RequestPath = "/lib",
                            RedirectToAppendTrailingSlash = false
                        });
                    }
                }
            }
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("wwwroot");
        }
    }
}

