using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using HandStack.Core.Extensions;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using repository.Extensions;

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

        private readonly ModuleApiClient moduleApiClient;

        public ManagedController(IWebHostEnvironment environment, IConfiguration configuration, ModuleApiClient moduleApiClient)
        {
            this.configuration = configuration;
            this.environment = environment;
            this.moduleApiClient = moduleApiClient;
        }

        // http://localhost:8000/repository/api/managed/reset-app-contract?applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult ResetAppContract(string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
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

                        string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                        if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(appBasePath) == true)
                        {
                            string tenantID = $"{userWorkID}|{applicationID}";
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
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

                            var repositoryFile = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "repository", "storage.json");
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
                                                repository.PhysicalPath = repository.PhysicalPath.Replace("{appBasePath}", appBasePath);
                                                repository.PhysicalPath = GlobalConfiguration.GetBasePath(repository.PhysicalPath);
                                                DirectoryInfo repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                                if (repositoryDirectoryInfo.Exists == false)
                                                {
                                                    repositoryDirectoryInfo.Create();
                                                }

                                                repository.UserWorkID = userWorkID;
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
                                                    repository.PhysicalPath = repository.PhysicalPath.Replace("{appBasePath}", appBasePath);
                                                    repository.PhysicalPath = GlobalConfiguration.GetBasePath(repository.PhysicalPath);
                                                    DirectoryInfo repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                                    if (repositoryDirectoryInfo.Exists == false)
                                                    {
                                                        repositoryDirectoryInfo.Create();
                                                    }

                                                    repository.UserWorkID = userWorkID;
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
    }
}
