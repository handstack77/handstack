using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using HandStack.Core.Extensions;
using HandStack.Web;
using HandStack.Web.Entity;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using Serilog;

namespace repository.Areas.repository.Controllers
{
    [Area("repository")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class ManagedController : ControllerBase
    {
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, IConfiguration configuration)
        {
            this.configuration = configuration;
            this.environment = environment;
        }

        // http://localhost:8080/repository/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    lock (ModuleConfiguration.FileRepositorys)
                    {
                        ModuleConfiguration.FileRepositorys.Clear();
                        try
                        {
                            if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                            {
                                foreach (var appBasePath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                                {
                                    DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                                    string applicationID = directoryInfo.Name;

                                    string settingFilePath = Path.Combine(appBasePath, "settings.json");
                                    if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(applicationID) == false)
                                    {
                                        string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                        TenantAppStorageRefresh(appSetting);
                                    }
                                }
                            }

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
                                        if (System.IO.File.Exists(repositoryFile) == true)
                                        {
                                            var repositoryText = System.IO.File.ReadAllText(repositoryFile);
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

                    result = Ok();
                }
                catch (Exception exception)
                {
                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8080/repository/api/managed/reset-app-contract?applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult ResetAppContract(string applicationID)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    lock (ModuleConfiguration.FileRepositorys)
                    {
                        var appRepositorys = ModuleConfiguration.FileRepositorys.Where(x => x.ApplicationID == applicationID).ToList();
                        for (int i = appRepositorys.Count(); i > 0; i--)
                        {
                            var item = appRepositorys[i - 1];
                            ModuleConfiguration.FileRepositorys.Remove(item);
                        }

                        if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath, applicationID)) == true)
                        {
                            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, applicationID);
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(applicationID) == false)
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    TenantAppStorageRefresh(appSetting);
                                }
                            }

                            var repositoryFile = Path.Combine(GlobalConfiguration.TenantAppBasePath, applicationID, "repository", "storage.json");
                            try
                            {
                                if (System.IO.File.Exists(repositoryFile) == true)
                                {
                                    var repositoryText = System.IO.File.ReadAllText(repositoryFile);
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
                                Log.Logger.Error("[{LogCategory}] " + $"{repositoryFile} 저장소 계약 파일 오류 - " + exception.ToMessage(), "ManagedController/ResetAppContract");
                            }
                        }
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        private static void TenantAppStorageRefresh(AppSettings? appSetting)
        {
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
                            if (repository.PhysicalPath.IndexOf("{appBasePath}") == -1)
                            {
                                repository.PhysicalPath = GlobalConfiguration.GetBasePath(repository.PhysicalPath);
                                DirectoryInfo repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                if (repositoryDirectoryInfo.Exists == false)
                                {
                                    repositoryDirectoryInfo.Create();
                                }
                            }
                            ModuleConfiguration.FileRepositorys.Add(repository);
                        }
                    }
                }
            }
        }
    }
}
