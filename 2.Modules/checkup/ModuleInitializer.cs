using System;
using System.IO;
using System.Linq;

using checkup.Entity;
using checkup.Extensions;
using checkup.Services;

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

namespace checkup
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
                var moduleConfigFilePath = PathExtensions.Combine(module.BasePath, "module.json");
                if (File.Exists(moduleConfigFilePath) == true)
                {
                    var configurationText = File.ReadAllText(moduleConfigFilePath);
                    var moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        var moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.ManagedAccessKey = moduleConfig.ManagedAccessKey;
                        ModuleConfiguration.EncryptionAES256Key = !string.IsNullOrWhiteSpace(moduleConfig.EncryptionAES256Key)
                            && (moduleConfig.EncryptionAES256Key.Length == 16 || moduleConfig.EncryptionAES256Key.Length == 32) ? moduleConfig.EncryptionAES256Key : "1234567890123456";
                        ModuleConfiguration.AuthorizationKey = !string.IsNullOrWhiteSpace(moduleConfig.AuthorizationKey) ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.AdministratorEmailID = moduleConfig.AdministratorEmailID;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleBasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.DatabaseContractPath, PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.WWWRootBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.WWWRootBasePath);
                        ModuleConfiguration.ModuleLogFilePath = GlobalConfiguration.GetBaseFilePath(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.IsModuleLogging = !string.IsNullOrWhiteSpace(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.ModuleFilePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleFilePath);

                        if (moduleConfig.ConnectionString.Contains('|'))
                        {
                            var values = moduleConfig.ConnectionString.SplitAndTrim('|');
                            if (values.Count >= 2 && values[0].ParseBool() == true)
                            {
                                ModuleConfiguration.ConnectionString = DecryptConnectionString(values[1]);
                            }
                            else if (values.Count >= 2)
                            {
                                ModuleConfiguration.ConnectionString = values[1];
                            }
                            else
                            {
                                ModuleConfiguration.ConnectionString = moduleConfig.ConnectionString;
                            }
                        }
                        else
                        {
                            ModuleConfiguration.ConnectionString = moduleConfig.ConnectionString;
                        }

                        if (!string.IsNullOrWhiteSpace(moduleConfig.ModuleConfigurationUrl))
                        {
                            GlobalConfiguration.ModuleConfigurationUrl.Add(moduleConfig.ModuleConfigurationUrl);
                        }

                        ModuleConfiguration.AllowClientIP = moduleConfig.AllowClientIP;
                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        var message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleConfigFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    var message = $"module.json 파일 확인 필요: {moduleConfigFilePath}";
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
                                var tenantID = $"{userWorkID}|{directoryInfo.Name}";
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
                                                Log.Logger.Warning("[{LogCategory}] " + $"'{tenantID}' WithOrigin 중복 확인 필요 ", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
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
                                                Log.Logger.Warning("[{LogCategory}] " + $"'{tenantID}' WithReferer 중복 확인 필요 ", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
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

                services.AddScoped<IJwtManager, JwtManager>();
                services.AddScoped<IUserAccountService, UserAccountService>();
                services.AddScoped<ModuleApiClient>();
            }
        }

        public string DecryptConnectionString(string? connectionString)
        {
            var result = "";
            if (connectionString != null)
            {
                try
                {
                    var values = connectionString.SplitAndTrim('.');

                    var encrypt = values[0];
                    var decryptKey = values[1];
                    var hostName = values[2];
                    var hash = values[3];

                    if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() == hash)
                    {
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                        result = encrypt.DecryptAES(decryptKey);
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(connectionString)} 확인 필요: " + exception.ToMessage(), "ModuleInitializer/DecryptConnectionString");
                }
            }

            return result;
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == typeof(ModuleInitializer).Assembly.GetName().Name);
            if (!string.IsNullOrWhiteSpace(ModuleID) && module != null)
            {
                app.Use(async (context, next) =>
                {
                    // 라이선스 및 요청경로 확인
                    await next.Invoke();
                });

                app.UseMiddleware<JwtMiddleware>();
                app.UseMiddleware<TenantUserSignMiddleware>();

                var wwwrootDirectory = string.IsNullOrWhiteSpace(ModuleConfiguration.WWWRootBasePath) ? PathExtensions.Combine(module.BasePath, "wwwroot", module.ModuleID) : ModuleConfiguration.WWWRootBasePath;

                var moduleAssets = PathExtensions.Combine(wwwrootDirectory, "assets");
                if (!string.IsNullOrWhiteSpace(moduleAssets) && Directory.Exists(moduleAssets) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(moduleAssets),
                        RequestPath = "/assets",
                        OnPrepareResponse = httpContext =>
                        {
                            if (WithOnlyIPFilter.TryRejectStaticFile(httpContext.Context, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure") == true)
                            {
                                return;
                            }
                        }
                    });
                }

                if (!string.IsNullOrWhiteSpace(wwwrootDirectory) && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        RequestPath = "/" + ModuleID,
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
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
                                var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                corsService.ApplyResult(corsResult, httpContext.Context.Response);
                            }
                        }
                    });
                }

                if (Directory.Exists(GlobalConfiguration.TenantAppBasePath) == false)
                {
                    Directory.CreateDirectory(GlobalConfiguration.TenantAppBasePath);
                }

                if (Directory.Exists(GlobalConfiguration.TenantAppBasePath) == true)
                {
                    var hostApps = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath);
                    var tenantAppRequestPath = string.IsNullOrWhiteSpace(GlobalConfiguration.TenantAppRequestPath) ? "host" : GlobalConfiguration.TenantAppRequestPath;

                    app.UseStaticFiles(new StaticFileOptions
                    {
                        RequestPath = $"/{tenantAppRequestPath}",
                        FileProvider = new PhysicalFileProvider(GlobalConfiguration.TenantAppBasePath),
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = async httpContext =>
                        {
                            if (WithOnlyIPFilter.TryRejectStaticFile(httpContext.Context, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure") == true)
                            {
                                return;
                            }

                            var isWithReferer = false;
                            var requestRefererUrl = httpContext.Context.Request.Headers.Referer.ToStringSafe();
                            var requestPath = httpContext.Context.Request.Path.ToString();
                            var paths = requestPath.SplitAndTrim('/');

                            if (paths.Count > 4)
                            {
                                var userWorkID = paths[1];
                                var applicationID = paths[2];
                                var moduleID = paths[3];

                                if ("wwwroot" == moduleID)
                                {
                                    var tenantID = $"{userWorkID}|{applicationID}";
                                    var physicalPath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "wwwroot");

                                    var isWithOrigin = false;
                                    CorsPolicy? policy = null;
                                    if (ModuleConfiguration.TenantAppOrigins.ContainsKey(tenantID) == true)
                                    {
                                        if (!string.IsNullOrWhiteSpace(requestRefererUrl))
                                        {
                                            var withOriginUris = ModuleConfiguration.TenantAppOrigins[tenantID];
                                            if (withOriginUris != null && withOriginUris.Count > 0)
                                            {
                                                for (var i = 0; i < withOriginUris.Count; i++)
                                                {
                                                    var withOriginUri = withOriginUris[i];
                                                    if (requestRefererUrl.IndexOf(withOriginUri) > -1)
                                                    {
                                                        isWithOrigin = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    if (isWithOrigin == true)
                                    {
                                        policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, "PublicCorsPolicy")
                                            .ConfigureAwait(false)
                                            .GetAwaiter().GetResult();
                                    }
                                    else
                                    {
                                        policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                                            .ConfigureAwait(false)
                                            .GetAwaiter().GetResult();
                                    }

                                    if (policy != null)
                                    {
                                        try
                                        {
                                            var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                            if (corsResult != null)
                                            {
                                                corsService.ApplyResult(corsResult, httpContext.Context.Response);
                                            }
                                        }
                                        catch (Exception exception)
                                        {
                                            Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {requestPath}, {exception.Message}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                        }
                                    }

                                    if (string.IsNullOrWhiteSpace(requestRefererUrl))
                                    {
                                        var settingFilePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "settings.json");
                                        if (File.Exists(settingFilePath) == true)
                                        {
                                            var appSettingText = await File.ReadAllTextAsync(settingFilePath);
                                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                            if (appSetting != null && appSetting.ApplicationID == applicationID)
                                            {
                                                if (appSetting.AllowAnonymousPath?.Contains("*") == true)
                                                {
                                                    isWithReferer = true;
                                                }
                                                else
                                                {
                                                    var tenantAppBasePath = $"/{GlobalConfiguration.TenantAppRequestPath}/{userWorkID}/{applicationID}/wwwroot";
                                                    if (appSetting.AllowAnonymousPath?.Contains(requestPath.Replace(new FileInfo(requestPath).Name, "*").Replace(tenantAppBasePath, "")) == true || appSetting.AllowAnonymousPath?.Contains(requestPath.Replace(tenantAppBasePath, "")) == true)
                                                    {
                                                        isWithReferer = true;
                                                    }
                                                    else
                                                    {
                                                        var requestAbsoluteUrl = httpContext.Context.Request.GetBaseUrl() + tenantAppBasePath;
                                                        if (appSetting.AllowAnonymousPath?.Contains(requestPath.Replace(requestAbsoluteUrl, "")) == true)
                                                        {
                                                            isWithReferer = true;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    if (isWithReferer == false)
                                    {
                                        if (ModuleConfiguration.TenantAppReferers.ContainsKey(tenantID) == true)
                                        {
                                            var baseUrl = httpContext.Context.Request.GetBaseUrl();
                                            if (requestRefererUrl.IndexOf(baseUrl) > -1)
                                            {
                                                isWithReferer = true;
                                            }
                                            else
                                            {
                                                var withRefererUris = ModuleConfiguration.TenantAppReferers[tenantID];
                                                if (withRefererUris != null && withRefererUris.Count > 0 && requestRefererUrl != null)
                                                {
                                                    for (var i = 0; i < withRefererUris.Count; i++)
                                                    {
                                                        var withRefererUri = withRefererUris[i];
                                                        if (requestRefererUrl.IndexOf(withRefererUri) > -1)
                                                        {
                                                            isWithReferer = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    if (isWithReferer == false)
                                    {
                                        httpContext.Context.Response.StatusCode = StatusCodes.Status403Forbidden;
                                        return;
                                    }
                                }
                                else
                                {
                                    httpContext.Context.Response.StatusCode = StatusCodes.Status403Forbidden;
                                }
                            }
                            else
                            {
                                httpContext.Context.Response.StatusCode = StatusCodes.Status400BadRequest;
                            }
                        }
                    });

                    Log.Logger.Information("[{LogCategory}] " + $"TenantApps Binding {hostApps.Length.ToCurrencyString()}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                }
            }
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("checkup");
        }
    }
}

