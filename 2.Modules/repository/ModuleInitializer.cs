using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.Helper;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.Modules;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json;

using repository.Entity;
using repository.Events;
using repository.Extensions;
using repository.Services;

using RestSharp;

using Serilog;

namespace repository
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
                        ModuleConfiguration.FileServerUrl = moduleConfig.FileServerUrl;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.XFrameOptions = moduleConfig.XFrameOptions;
                        ModuleConfiguration.ContentSecurityPolicy = moduleConfig.ContentSecurityPolicy;

                        ModuleConfiguration.IsContractFileWatching = moduleConfig.IsContractFileWatching;
                        foreach (var basePath in moduleConfig.ContractBasePath)
                        {
                            ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath(basePath));
                        }

                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleBasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.DatabaseContractPath, PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.ModuleLogFilePath = GlobalConfiguration.GetBaseFilePath(moduleConfig.ModuleLogFilePath);
                        ModuleConfiguration.IsModuleLogging = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == false;
                        ModuleConfiguration.ModuleFilePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleFilePath);

                        ModuleConfiguration.AllowClientIP = moduleConfig.AllowClientIP;
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

                RepositoryMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

                services.AddScoped<ModuleApiClient>();
                services.AddSingleton<IStorageProviderFactory, StorageProviderFactory>();
                services.AddTransient<IRequestHandler<RepositoryRequest, object?>, RepositoryRequestHandler>();
            }
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == typeof(ModuleInitializer).Assembly.GetName().Name);
            if (string.IsNullOrEmpty(ModuleID) == false && module != null)
            {
                app.Use(async (context, next) =>
                {
                    // 요청 경로 확인
                    await next.Invoke();
                });

                var wwwrootDirectory = PathExtensions.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        RequestPath = "/" + ModuleID,
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
                                    Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                        }
                    });
                }

                foreach (var item in ModuleConfiguration.FileRepositorys)
                {
                    if (item.StorageType == "FileSystem" && item.IsVirtualPath == true)
                    {
                        if (string.IsNullOrEmpty(item.PhysicalPath) == true || (item.SettingFilePath.ToStringSafe().StartsWith(GlobalConfiguration.TenantAppBasePath) == true))
                        {
                            continue;
                        }

                        var physicalPath = item.PhysicalPath;
                        if (Directory.Exists(physicalPath) == false)
                        {
                            Directory.CreateDirectory(physicalPath);
                        }

                        try
                        {
                            var virtualPath = $"/{ModuleID}/{item.ApplicationID}/{item.RepositoryID}";
                            app.UseStaticFiles(new StaticFileOptions
                            {
                                ServeUnknownFileTypes = true,
                                DefaultContentType = "text/html",
                                FileProvider = new PhysicalFileProvider(physicalPath),
                                RequestPath = virtualPath,
                                OnPrepareResponse = (httpContext) =>
                                {
                                    var isResponse = true;
                                    var virtualAccessMethod = item.AccessMethod;
                                    switch (virtualAccessMethod)
                                    {
                                        case "public":
                                            break;
                                        case "protected":
                                            var baseUrl = httpContext.Context.Request.GetBaseUrl();
                                            if (baseUrl.Contains("localhost") == true || baseUrl.Contains("127.0.0.1") == true)
                                            {
                                            }
                                            else
                                            {
                                                var referer = httpContext.Context.Request.Headers.Referer.ToString();
                                                if (referer.EndsWith("/") == true)
                                                {
                                                    referer = referer.Substring(0, referer.Length - 1);
                                                }
                                                var host = httpContext.Context.Request.Host.ToString();
                                                isResponse = (string.IsNullOrEmpty(referer) == false && (referer.IndexOf(host) > -1 || GlobalConfiguration.WithOrigins.IndexOf(referer) > -1));
                                            }
                                            break;
                                        case "private":
                                            var token = httpContext.Context.Request.Cookies["BearerToken"];
                                            if (string.IsNullOrEmpty(token) == true)
                                            {
                                                token = httpContext.Context.Request.Headers["BearerToken"];
                                            }

                                            if (string.IsNullOrEmpty(token) == true)
                                            {
                                                token = httpContext.Context.Request.Query["BearerToken"];
                                            }

                                            BearerToken? bearerToken = null;
                                            if (string.IsNullOrEmpty(token) == false)
                                            {
                                                try
                                                {
                                                    var tokenArray = token.Split(".");
                                                    var userID = tokenArray[0].DecodeBase64();

                                                    token = tokenArray[1];
                                                    bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(userID.PaddingRight(32)));
                                                }
                                                catch (Exception exception)
                                                {
                                                    Log.Error("[{LogCategory}] " + $"token: {token}, exception: {exception.ToMessage()}", "Startup/UseStaticFiles");
                                                }
                                            }

                                            if (bearerToken == null)
                                            {
                                                isResponse = false;
                                            }
                                            else
                                            {
                                                if (bearerToken.Policy != null)
                                                {
                                                    isResponse = true;
                                                }
                                                else
                                                {
                                                    // bearerToken.Policy.Claims 내 정책 확인으로 검증 적용
                                                    // ...

                                                    isResponse = false;
                                                }
                                            }
                                            break;
                                        default:
                                            isResponse = false;
                                            break;
                                    }

                                    var policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                                        .ConfigureAwait(false)
                                        .GetAwaiter().GetResult();

                                    var extension = httpContext.Context.Request.Query["ext"].ToString();
                                    if (string.IsNullOrEmpty(extension) == false)
                                    {
                                        var mimeType = MimeHelper.GetMimeType("default" + extension);
                                        if (string.IsNullOrEmpty(mimeType) == true)
                                        {
                                            mimeType = "application/octet-stream";
                                        }

                                        httpContext.Context.Response.ContentType = mimeType;
                                    }

                                    if (isResponse == false)
                                    {
                                        httpContext.Context.Response.Clear();
                                        httpContext.Context.Response.StatusCode = StatusCodes.Status404NotFound;
                                    }

                                    if (policy != null)
                                    {
                                        try
                                        {
                                            var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                            corsService.ApplyResult(corsResult, httpContext.Context.Response);
                                        }
                                        catch
                                        {
                                            Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                        }
                                    }
                                }
                            });
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error(exception, "[{LogCategory}] " + $"physicalPath: {physicalPath}, RequestPath: /{ModuleID}/{item.RepositoryID}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                        }
                    }
                }

                var client = new RestClient();
                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == true && basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == false && ModuleConfiguration.IsContractFileWatching == true)
                    {
                        var fileSyncManager = new FileSyncManager(basePath, "*.json");
                        fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                        {
                            if (GlobalConfiguration.IsRunning == true && fileInfo.FullName.Replace("\\", "/").IndexOf(basePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                            {
                                var filePath = fileInfo.FullName.Replace("\\", "/").Replace(basePath, "");
                                var hostUrl = $"http://localhost:{GlobalConfiguration.OriginPort}/repository/api/storage/refresh?changeType={changeTypes}&filePath={filePath}";

                                var request = new RestRequest(hostUrl, Method.Get);
                                request.Timeout = TimeSpan.FromSeconds(3);
                                request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                                try
                                {
                                    var response = await client.ExecuteAsync(request);
                                    if (response.StatusCode != HttpStatusCode.OK)
                                    {
                                        Log.Warning("[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요. {response.Content.ToStringSafe()}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                    }
                                }
                                catch (Exception exception)
                                {
                                    Log.Error(exception, "[{LogCategory}] " + $"{filePath} 파일 서버 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                        };

                        Log.Information("[{LogCategory}] Repository File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                        fileSyncManager.Start();
                        ModuleConfiguration.RepositoryFileSyncManager.Add(basePath, fileSyncManager);
                    }
                }
            }
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("repository");
        }
    }
}
