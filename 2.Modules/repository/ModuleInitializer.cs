using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
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
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.FileServerUrl = moduleConfig.FileServerUrl;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
                        ModuleConfiguration.IsExceptionDetailText = moduleConfig.IsExceptionDetailText;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        foreach (var basePath in moduleConfig.ContractBasePath)
                        {
                            ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath(basePath));
                        }

                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleBasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBasePath(moduleConfig.DatabaseContractPath, Path.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
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

                services.AddScoped<ModuleApiClient>();
                services.AddTransient<IRequestHandler<RepositoryRequest, object?>, RepositoryRequestHandler>();
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

                string wwwrootDirectory = Path.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(Path.Combine(wwwrootDirectory)),
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

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                {
                    foreach (var userWorkPath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                    {
                        DirectoryInfo workDirectoryInfo = new DirectoryInfo(userWorkPath);
                        string userWorkID = workDirectoryInfo.Name;
                        foreach (var appBasePath in Directory.GetDirectories(userWorkPath))
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                            string applicationID = directoryInfo.Name;
                            string tenantID = $"{userWorkID}|{applicationID}";
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var storages = appSetting.Storage;
                                    if (storages != null)
                                    {
                                        foreach (var storage in storages)
                                        {
                                            Repository repository = new Repository();

                                            repository.ApplicationID = storage.ApplicationID;
                                            repository.RepositoryID = storage.RepositoryID;
                                            repository.RepositoryName = storage.RepositoryName;
                                            repository.AccessID = storage.AccessID;
                                            repository.StorageType = storage.StorageType;
                                            repository.PhysicalPath = storage.PhysicalPath;
                                            repository.BlobContainerID = storage.BlobContainerID;
                                            repository.BlobConnectionString = storage.BlobConnectionString;
                                            repository.BlobItemUrl = storage.BlobItemUrl;
                                            repository.IsVirtualPath = storage.IsVirtualPath;
                                            repository.AccessMethod = storage.AccessMethod;
                                            repository.IsFileUploadDownloadOnly = storage.IsFileUploadDownloadOnly;
                                            repository.IsMultiUpload = storage.IsMultiUpload;
                                            repository.IsFileOverWrite = storage.IsFileOverWrite;
                                            repository.IsFileNameEncrypt = storage.IsFileNameEncrypt;
                                            repository.IsKeepFileExtension = storage.IsKeepFileExtension;
                                            repository.IsAutoPath = storage.IsAutoPath;
                                            repository.PolicyPathID = storage.PolicyPathID;
                                            repository.UploadTypeID = storage.UploadTypeID;
                                            repository.UploadExtensions = storage.UploadExtensions;
                                            repository.UploadCount = storage.UploadCount;
                                            repository.UploadSizeLimit = storage.UploadSizeLimit;
                                            repository.IsLocalDbFileManaged = storage.IsLocalDbFileManaged;
                                            repository.SQLiteConnectionString = storage.SQLiteConnectionString;
                                            repository.TransactionGetItem = storage.TransactionGetItem;
                                            repository.TransactionDeleteItem = storage.TransactionDeleteItem;
                                            repository.TransactionUpsertItem = storage.TransactionUpsertItem;
                                            repository.TransactionUpdateDependencyID = storage.TransactionUpdateDependencyID;
                                            repository.TransactionUpdateFileName = storage.TransactionUpdateFileName;
                                            repository.Comment = storage.Comment;
                                            repository.CreatedAt = storage.CreatedAt;
                                            repository.ModifiedAt = storage.ModifiedAt;

                                            if (ModuleConfiguration.FileRepositorys.Contains(repository) == false)
                                            {
                                                repository.PhysicalPath = repository.PhysicalPath.Replace("{appBasePath}", appBasePath);
                                                repository.PhysicalPath = GlobalConfiguration.GetBasePath(repository.PhysicalPath);
                                                DirectoryInfo repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                                if (repositoryDirectoryInfo.Exists == false)
                                                {
                                                    repositoryDirectoryInfo.Create();
                                                }

                                                repository.UserWorkID = userWorkID;
                                                repository.SettingFilePath = settingFilePath;

                                                if (repository.IsLocalDbFileManaged == true)
                                                {
                                                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.STR010.ZD01");
                                                }

                                                ModuleConfiguration.FileRepositorys.Add(repository);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                LoadContract();

                foreach (Repository item in ModuleConfiguration.FileRepositorys)
                {
                    if (item.StorageType == "FileSystem" && item.IsVirtualPath == true)
                    {
                        if (string.IsNullOrEmpty(item.PhysicalPath) == true || (item.SettingFilePath.ToStringSafe().StartsWith(GlobalConfiguration.TenantAppBasePath) == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false))
                        {
                            continue;
                        }

                        string physicalPath = item.PhysicalPath;
                        if (Directory.Exists(physicalPath) == false)
                        {
                            Directory.CreateDirectory(physicalPath);
                        }

                        try
                        {
                            string virtualPath = $"/{ModuleID}/{item.ApplicationID}/{item.RepositoryID}";
                            app.UseStaticFiles(new StaticFileOptions
                            {
                                ServeUnknownFileTypes = true,
                                DefaultContentType = "text/html",
                                FileProvider = new PhysicalFileProvider(physicalPath),
                                RequestPath = virtualPath,
                                OnPrepareResponse = (httpContext) =>
                                {
                                    bool isResponse = true;
                                    string virtualAccessMethod = item.AccessMethod;
                                    switch (virtualAccessMethod)
                                    {
                                        case "public":
                                            break;
                                        case "protected":
                                            string referer = httpContext.Context.Request.Headers.Referer.ToString();
                                            if (referer.EndsWith("/") == true)
                                            {
                                                referer = referer.Substring(0, referer.Length - 1);
                                            }
                                            string host = httpContext.Context.Request.Host.ToString();
                                            isResponse = (string.IsNullOrEmpty(referer) == false && (referer.IndexOf(host) > -1 || GlobalConfiguration.WithOrigins.IndexOf(referer) > -1));
                                            break;
                                        case "private":
                                            string? token = httpContext.Context.Request.Cookies["BearerToken"];
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
                                                    string[] tokenArray = token.Split(".");
                                                    string userID = tokenArray[0].DecodeBase64();

                                                    token = tokenArray[1];
                                                    bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(userID.PadRight(32, ' ')));
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

                                    string extension = httpContext.Context.Request.Query["ext"].ToString();
                                    if (string.IsNullOrEmpty(extension) == false)
                                    {
                                        string? mimeType = MimeHelper.GetMimeType("default" + extension);
                                        if (string.IsNullOrEmpty(mimeType) == true)
                                        {
                                            mimeType = "application/octet-stream";
                                        }

                                        httpContext.Context.Response.ContentType = mimeType;
                                    }

                                    if (isResponse == false)
                                    {
                                        httpContext.Context.Response.Clear();
                                        httpContext.Context.Response.StatusCode = 404;
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
            }
        }

        public void LoadContract()
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false)
                    {
                        continue;
                    }

                    Log.Logger.Information("[{LogCategory}] ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");

                    string[] repositoryFiles = Directory.GetFiles(basePath, "*.json", SearchOption.AllDirectories);
                    foreach (string repositoryFile in repositoryFiles)
                    {
                        try
                        {
                            if (File.Exists(repositoryFile) == true && (repositoryFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == false || string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == true))
                            {
                                var repositoryText = File.ReadAllText(repositoryFile);
                                if (repositoryText.StartsWith("{") == true)
                                {
                                    var repository = JsonConvert.DeserializeObject<Repository>(repositoryText);
                                    if (repository != null)
                                    {
                                        if (ModuleConfiguration.FileRepositorys.Find(x => x.ApplicationID == repository.ApplicationID
                                            && x.RepositoryID == repository.RepositoryID) == null)
                                        {
                                            if (repository.PhysicalPath.IndexOf("{appBasePath}") == -1)
                                            {
                                                repository.PhysicalPath = GlobalConfiguration.GetBasePath(repository.PhysicalPath);
                                                DirectoryInfo repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                                if (repositoryDirectoryInfo.Exists == false)
                                                {
                                                    repositoryDirectoryInfo.Create();
                                                }
                                            }

                                            repository.UserWorkID = "";
                                            repository.SettingFilePath = repositoryFile;

                                            if (repository.IsLocalDbFileManaged == true)
                                            {
                                                ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.STR010.ZD01");
                                            }

                                            ModuleConfiguration.FileRepositorys.Add(repository);
                                        }
                                        else
                                        {
                                            Log.Logger.Warning("[{LogCategory}] " + $"{repositoryFile} 업무 계약 중복 확인 필요", $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
                                        }
                                    }
                                }
                                else if (repositoryText.StartsWith("[") == true)
                                {
                                    var repositorys = JsonConvert.DeserializeObject<List<Repository>>(repositoryText);
                                    if (repositorys != null)
                                    {
                                        foreach (var repository in repositorys)
                                        {
                                            if (ModuleConfiguration.FileRepositorys.Find(x => x.ApplicationID == repository.ApplicationID
                                                && x.RepositoryID == repository.RepositoryID) == null)
                                            {
                                                if (repository.PhysicalPath.IndexOf("{appBasePath}") == -1)
                                                {
                                                    repository.PhysicalPath = GlobalConfiguration.GetBasePath(repository.PhysicalPath);
                                                    DirectoryInfo repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                                    if (repositoryDirectoryInfo.Exists == false)
                                                    {
                                                        repositoryDirectoryInfo.Create();
                                                    }
                                                }

                                                repository.UserWorkID = "";
                                                repository.SettingFilePath = repositoryFile;

                                                if (repository.IsLocalDbFileManaged == true)
                                                {
                                                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.STR010.ZD01");
                                                }

                                                ModuleConfiguration.FileRepositorys.Add(repository);
                                            }
                                            else
                                            {
                                                Log.Logger.Warning("[{LogCategory}] " + $"{repositoryFile} 업무 계약 중복 확인 필요", $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error("[{LogCategory}] " + $"{repositoryFile} 업무 계약 파일 오류 - " + exception.ToMessage(), $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Log.Logger.Error("[{LogCategory}] " + $"LoadContract 오류 - " + exception.ToMessage(), $"{ModuleConfiguration.ModuleID} ModuleInitializer/LoadContract");
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
