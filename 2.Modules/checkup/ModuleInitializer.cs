using System;
using System.IO;
using System.Linq;
using System.Net;

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
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module != null)
            {
                string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                if (File.Exists(moduleConfigFilePath) == true)
                {
                    string configurationText = File.ReadAllText(moduleConfigFilePath);
                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        ModuleConfig moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.ManagedAccessKey = moduleConfig.ManagedAccessKey;
                        ModuleConfiguration.EncryptionAES256Key = string.IsNullOrEmpty(moduleConfig.EncryptionAES256Key) == false
                            && (moduleConfig.EncryptionAES256Key.Length == 16 || moduleConfig.EncryptionAES256Key.Length == 32) ? moduleConfig.EncryptionAES256Key : "1234567890123456";
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.AdministratorEmailID = moduleConfig.AdministratorEmailID;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
                        ModuleConfiguration.IsExceptionDetailText = moduleConfig.IsExceptionDetailText;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;
                        ModuleConfiguration.ModuleBasePath = string.IsNullOrEmpty(moduleConfig.ModuleBasePath) == true || Directory.Exists(moduleConfig.ModuleBasePath) == false ? "" : new DirectoryInfo(moduleConfig.ModuleBasePath).FullName;
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBasePath(moduleConfig.DatabaseContractPath, Path.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.TransactionContractPath = GlobalConfiguration.GetBasePath(moduleConfig.TransactionContractPath, Path.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "transact"));
                        ModuleConfiguration.FunctionContractPath = GlobalConfiguration.GetBasePath(moduleConfig.FunctionContractPath, Path.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "function"));
                        ModuleConfiguration.WWWRootBasePath = string.IsNullOrEmpty(moduleConfig.WWWRootBasePath) == true || Directory.Exists(moduleConfig.WWWRootBasePath) == false ? "" : new DirectoryInfo(moduleConfig.WWWRootBasePath).FullName;
                        ModuleConfiguration.ModuleLogFilePath = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == true || Directory.Exists(moduleConfig.ModuleLogFilePath) == false ? "" : new DirectoryInfo(moduleConfig.ModuleLogFilePath).FullName;
                        ModuleConfiguration.IsModuleLogging = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == false;
                        ModuleConfiguration.ModuleFilePath = string.IsNullOrEmpty(moduleConfig.ModuleFilePath) == true || Directory.Exists(moduleConfig.ModuleFilePath) == false ? "" : new DirectoryInfo(moduleConfig.ModuleFilePath).FullName;

                        if (moduleConfig.ConnectionString.IndexOf("|") > -1)
                        {
                            var values = moduleConfig.ConnectionString.SplitAndTrim('|');
                            if (values[0].ParseBool() == true)
                            {
                                ModuleConfiguration.ConnectionString = DecryptConnectionString(values[1]);
                            }
                            else
                            {
                                ModuleConfiguration.ConnectionString = values[1];
                            }
                        }
                        else
                        {
                            ModuleConfiguration.ConnectionString = moduleConfig.ConnectionString;
                        }

                        if (string.IsNullOrEmpty(moduleConfig.ModuleConfigurationUrl) == false)
                        {
                            GlobalConfiguration.ModuleConfigurationUrl.Add(moduleConfig.ModuleConfigurationUrl);
                        }

                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        string message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleConfigFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    string message = $"module.json 파일 확인 필요: {moduleConfigFilePath}";
                    Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                    throw new FileNotFoundException(message);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                {
                    foreach (var userWorkPath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                    {
                        DirectoryInfo workDirectoryInfo = new DirectoryInfo(userWorkPath);
                        string userWorkID = workDirectoryInfo.Name;
                        foreach (var appBasePath in Directory.GetDirectories(userWorkPath))
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                string tenantID = $"{userWorkID}|{directoryInfo.Name}";
                                string settingFilePath = Path.Combine(appBasePath, "settings.json");
                                if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                                {
                                    string appSettingText = File.ReadAllText(settingFilePath);
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
            string result = "";
            if (connectionString != null)
            {
                try
                {
                    var values = connectionString.SplitAndTrim('.');

                    string encrypt = values[0];
                    string decryptKey = values[1];
                    string hostName = values[2];
                    string hash = values[3];

                    if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() == hash)
                    {
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                        result = encrypt.DecryptAES(decryptKey);
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(connectionString)} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptConnectionString");
                }
            }

            return result;
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == typeof(ModuleInitializer).Assembly.GetName().Name);
            if (string.IsNullOrEmpty(ModuleID) == false && module != null)
            {
                app.Use(async (context, next) =>
                {
                    // 라이선스 및 요청경로 확인
                    await next.Invoke();
                });

                app.UseMiddleware<JwtMiddleware>();
                app.UseMiddleware<TenantUserSignMiddleware>();

                string wwwrootDirectory = string.IsNullOrEmpty(ModuleConfiguration.WWWRootBasePath) == true ? Path.Combine(module.BasePath, "wwwroot", module.ModuleID) : ModuleConfiguration.WWWRootBasePath;

                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(Path.Combine(wwwrootDirectory, "assets")),
                    RequestPath = "/assets"
                });

                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        RequestPath = "/" + ModuleID,
                        FileProvider = new PhysicalFileProvider(Path.Combine(wwwrootDirectory)),
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
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

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == false)
                {
                    Directory.CreateDirectory(GlobalConfiguration.TenantAppBasePath);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                {
                    var hostApps = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath);
                    string tenantAppRequestPath = string.IsNullOrEmpty(GlobalConfiguration.TenantAppRequestPath) == true ? "host" : GlobalConfiguration.TenantAppRequestPath;

                    app.UseStaticFiles(new StaticFileOptions
                    {
                        RequestPath = $"/{tenantAppRequestPath}",
                        FileProvider = new PhysicalFileProvider(GlobalConfiguration.TenantAppBasePath),
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = async httpContext =>
                        {
                            bool isWithReferer = false;
                            string requestRefererUrl = httpContext.Context.Request.Headers.Referer.ToStringSafe();
                            string requestPath = httpContext.Context.Request.Path.ToString();
                            var paths = requestPath.SplitAndTrim('/');

                            if (paths.Count > 4)
                            {
                                string userWorkID = paths[1];
                                string applicationID = paths[2];
                                string moduleID = paths[3];

                                if ("wwwroot" == moduleID)
                                {
                                    string tenantID = $"{userWorkID}|{applicationID}";
                                    string physicalPath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "wwwroot");

                                    bool isWithOrigin = false;
                                    CorsPolicy? policy = null;
                                    if (ModuleConfiguration.TenantAppOrigins.ContainsKey(tenantID) == true)
                                    {
                                        if (string.IsNullOrEmpty(requestRefererUrl) == false)
                                        {
                                            var withOriginUris = ModuleConfiguration.TenantAppOrigins[tenantID];
                                            if (withOriginUris != null && withOriginUris.Count > 0)
                                            {
                                                for (int i = 0; i < withOriginUris.Count; i++)
                                                {
                                                    string withOriginUri = withOriginUris[i];
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

                                    if (string.IsNullOrEmpty(requestRefererUrl) == true)
                                    {
                                        string settingFilePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "settings.json");
                                        if (File.Exists(settingFilePath) == true)
                                        {
                                            string appSettingText = await File.ReadAllTextAsync(settingFilePath);
                                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                            if (appSetting != null && appSetting.ApplicationID == applicationID)
                                            {
                                                if (appSetting.AllowAnonymousPath?.Contains("*") == true)
                                                {
                                                    isWithReferer = true;
                                                }
                                                else
                                                {
                                                    string tenantAppBasePath = $"/{GlobalConfiguration.TenantAppRequestPath}/{userWorkID}/{applicationID}/wwwroot";
                                                    if (appSetting.AllowAnonymousPath?.Contains(requestPath.Replace(new FileInfo(requestPath).Name, "*").Replace(tenantAppBasePath, "")) == true || appSetting.AllowAnonymousPath?.Contains(requestPath.Replace(tenantAppBasePath, "")) == true)
                                                    {
                                                        isWithReferer = true;
                                                    }
                                                    else
                                                    {
                                                        string requestAbsoluteUrl = httpContext.Context.Request.GetBaseUrl() + tenantAppBasePath;
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
                                            string baseUrl = httpContext.Context.Request.GetBaseUrl();
                                            if (requestRefererUrl.IndexOf(baseUrl) > -1)
                                            {
                                                isWithReferer = true;
                                            }
                                            else
                                            {
                                                var withRefererUris = ModuleConfiguration.TenantAppReferers[tenantID];
                                                if (withRefererUris != null && withRefererUris.Count > 0 && requestRefererUrl != null)
                                                {
                                                    for (int i = 0; i < withRefererUris.Count; i++)
                                                    {
                                                        string withRefererUri = withRefererUris[i];
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
