using System;
using System.IO;
using System.Linq;

using HandStack.Web;
using HandStack.Web.Entity;
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
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module != null)
            {
                string moduleSettingFilePath = module.ModuleSettingFilePath;
                if (File.Exists(moduleSettingFilePath) == true)
                {
                    string configurationText = File.ReadAllText(moduleSettingFilePath);
                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        ModuleConfig moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.ApplicationID = moduleConfigJson.ApplicationID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.AuthorizationKey = GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
                        ModuleConfiguration.IsExceptionDetailText = moduleConfig.IsExceptionDetailText;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;
                        ModuleConfiguration.ContractRequestPath = string.IsNullOrEmpty(moduleConfig.ContractRequestPath) == true ? "view" : moduleConfig.ContractRequestPath;
                        ModuleConfiguration.ContractBasePath = GlobalConfiguration.GetBasePath(moduleConfig.ContractBasePath);
                        ModuleConfiguration.WWWRootBasePath = GlobalConfiguration.GetBasePath(moduleConfig.WWWRootBasePath);
                        ModuleConfiguration.ModuleLogFilePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.IsModuleLogging = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == false;
                        ModuleConfiguration.ModuleFilePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleFilePath);

                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        string message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleSettingFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    string message = $"module.json 파일 확인 필요: {moduleSettingFilePath}";
                    Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                    throw new FileNotFoundException(message);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                {
                    foreach (var appBasePath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                        if (directoryInfo.Exists == true)
                        {
                            string applicationID = directoryInfo.Name;

                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(applicationID) == false)
                            {
                                string appSettingText = File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var withOriginUris = appSetting.WithOrigin;

                                    if (withOriginUris != null)
                                    {
                                        if (ModuleConfiguration.TenantAppOrigins.ContainsKey(applicationID) == true)
                                        {
                                            Log.Logger.Warning("[{LogCategory}] " + $"'{applicationID}' WithOrigin 중복 확인 필요 ", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                        }
                                        else
                                        {
                                            ModuleConfiguration.TenantAppOrigins.Add(applicationID, withOriginUris);
                                        }
                                    }

                                    var withRefererUris = appSetting.WithReferer;

                                    if (withRefererUris != null)
                                    {
                                        if (ModuleConfiguration.TenantAppReferers.ContainsKey(applicationID) == true)
                                        {
                                            Log.Logger.Warning("[{LogCategory}] " + $"'{applicationID}' WithReferer 중복 확인 필요 ", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                        }
                                        else
                                        {
                                            ModuleConfiguration.TenantAppReferers.Add(applicationID, withRefererUris);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                services.AddScoped<ModuleApiClient>();
            }
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == typeof(ModuleInitializer).Assembly.GetName().Name);
            if (string.IsNullOrEmpty(ModuleID) == false && module != null)
            {
                app.Use(async (context, next) =>
                {
                    // 요청 경로 확인
                    await next.Invoke();
                });

                if (string.IsNullOrEmpty(ModuleConfiguration.ContractBasePath) == false && Directory.Exists(ModuleConfiguration.ContractBasePath) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(ModuleConfiguration.ContractBasePath),
                        RequestPath = "/" + ModuleConfiguration.ContractRequestPath,
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
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

                string wwwrootDirectory = string.IsNullOrEmpty(ModuleConfiguration.WWWRootBasePath) == true ? Path.Combine(module.BasePath, "wwwroot") : ModuleConfiguration.WWWRootBasePath;
                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(Path.Combine(wwwrootDirectory)),
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
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

                    string libDirectoryPath = Path.Combine(wwwrootDirectory, "lib");
                    if (Directory.Exists(libDirectoryPath) == true)
                    {
                        app.UseDirectoryBrowser(new DirectoryBrowserOptions
                        {
                            FileProvider = new PhysicalFileProvider(libDirectoryPath),
                            RequestPath = "/lib"
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
