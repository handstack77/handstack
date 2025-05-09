﻿using System;
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
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.ContractBasePath = GlobalConfiguration.GetBasePath(moduleConfig.ContractBasePath);
                        ModuleConfiguration.WWWRootBasePath = GlobalConfiguration.GetBasePath(moduleConfig.WWWRootBasePath);
                        ModuleConfiguration.ModuleLogFilePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.IsModuleLogging = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == false;
                        ModuleConfiguration.ModuleFilePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleFilePath);
                        GlobalConfiguration.ContractRequestPath = string.IsNullOrEmpty(moduleConfig.ContractRequestPath) == true ? "view" : moduleConfig.ContractRequestPath;

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
                            }
                        }
                    }
                }

                services.AddScoped<ModuleApiClient>();
                services.AddTransient<ISequentialIdGenerator, SequentialIdGenerator>();
            }
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == typeof(ModuleInitializer).Assembly.GetName().Name);
            if (string.IsNullOrEmpty(ModuleID) == false && module != null)
            {
                var wwwrootContractBasePath = PathExtensions.Combine(ModuleConfiguration.ContractBasePath, GlobalConfiguration.ApplicationID);
                if (string.IsNullOrEmpty(ModuleConfiguration.ContractBasePath) == false && Directory.Exists(wwwrootContractBasePath) == true)
                {
                    ModuleConfiguration.IsContractRequestPath = true;
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(wwwrootContractBasePath),
                        RequestPath = "/" + GlobalConfiguration.ContractRequestPath,
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

                var wwwrootDirectory = string.IsNullOrEmpty(ModuleConfiguration.WWWRootBasePath) == true ? PathExtensions.Combine(module.BasePath, "wwwroot") : ModuleConfiguration.WWWRootBasePath;
                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseMiddleware<CaseInsensitiveStaticFileMiddleware>(wwwrootDirectory);
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
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
