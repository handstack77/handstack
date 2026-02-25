using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using repository.Entity;

using Serilog;

namespace repository.Extensions
{
    public class ModuleApiClient
    {
        private readonly ILogger logger;
        private readonly TransactionClient transactionClient;

        public ModuleApiClient(ILogger logger, TransactionClient transactionClient)
        {
            this.logger = logger;
            this.transactionClient = transactionClient;
        }

        public async Task<List<Repository>?> GetRepositorys(string applicationIDs = "")
        {
            List<Repository>? result = null;

            try
            {
                var transactionInfo = ModuleConfiguration.TransactionFileRepositorys.Split("|");
                var transactionObject = new TransactionClientObject();
                transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                transactionObject.ProgramID = transactionInfo[0];
                transactionObject.BusinessID = transactionInfo[1];
                transactionObject.TransactionID = transactionInfo[2];
                transactionObject.FunctionID = transactionInfo[3];
                transactionObject.ScreenID = transactionObject.TransactionID;

                var inputs = new List<ServiceParameter>();
                inputs.Add("ApplicationID", applicationIDs);
                transactionObject.Inputs.Add(inputs);

                var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);

                if (transactionResult.ContainsKey("HasException") == true)
                {
                    logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/GetRepositorys");
                    return result;
                }
                else
                {
                    result = transactionResult?["GridData0"]?.ToObject<List<Repository>>();
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"applicationIDs: {applicationIDs}, Message: " + exception.ToMessage(), "ModuleApiClient/GetRepositorys");
            }

            return result;
        }

        public Repository? GetRepository(string applicationID, string repositoryID)
        {
            Repository? result = null;
            if (ModuleConfiguration.FileRepositorys != null && ModuleConfiguration.FileRepositorys.Count > 0)
            {
                result = ModuleConfiguration.FileRepositorys.AsQueryable().Where(p => p.ApplicationID == applicationID
                    && p.RepositoryID == repositoryID).FirstOrDefault();

                if (result == null)
                {
                    var userWorkID = string.Empty;
                    var appBasePath = string.Empty;
                    var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (var directory in directories)
                    {
                        var directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName.Replace("\\", "/");
                            userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                            break;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(userWorkID) && Directory.Exists(appBasePath) == true)
                    {
                        var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true)
                        {
                            var appSettingText = System.IO.File.ReadAllText(settingFilePath);
                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                            if (appSetting != null)
                            {
                                var storages = appSetting.Storage;
                                if (storages != null)
                                {
                                    foreach (var storage in storages)
                                    {
                                        var repository = new Repository();

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

                                        var findRepository = ModuleConfiguration.FileRepositorys.FirstOrDefault(p => p.ApplicationID == repository.ApplicationID
                                            && p.RepositoryID == repository.RepositoryID
                                            && p.UserWorkID == userWorkID
                                        );

                                        if (findRepository == null)
                                        {
                                            repository.PhysicalPath = repository.PhysicalPath.Replace("{appBasePath}", appBasePath);
                                            repository.PhysicalPath = GlobalConfiguration.GetBaseDirectoryPath(repository.PhysicalPath);
                                            var repositoryDirectoryInfo = new DirectoryInfo(repository.PhysicalPath);
                                            if (repositoryDirectoryInfo.Exists == false)
                                            {
                                                repositoryDirectoryInfo.Create();
                                            }

                                            repository.UserWorkID = userWorkID;
                                            repository.SettingFilePath = settingFilePath;

                                            if (repository.IsLocalDbFileManaged == true)
                                            {
                                                ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.ZD01");
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
            return result;
        }

        public async Task<RepositoryItems?> GetRepositoryItem(string applicationID, string repositoryID, string itemID, string businessID)
        {
            RepositoryItems? result = null;
            try
            {
                var repository = GetRepository(applicationID, repositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrWhiteSpace(repository.TransactionGetItem) ? $"{GlobalConfiguration.ApplicationID}|STR|SLT010|GD01".Split("|") : repository.TransactionGetItem.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    if (transactionInfo.Length == 3)
                    {
                        transactionObject.ProgramID = applicationID;
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else if (transactionInfo.Length == 4)
                    {
                        transactionObject.ProgramID = transactionInfo[0];
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "ModuleApiClient/GetRepositoryItem");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    var inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryID);
                    inputs.Add("ItemID", itemID);
                    inputs.Add("ApplicationID", applicationID);
                    inputs.Add("BusinessID", businessID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/GetRepositoryItem");
                        return result;
                    }
                    else
                    {
                        result = transactionResult?["FormData0"]?.ToObject<RepositoryItems>();
                        if (result != null && string.IsNullOrWhiteSpace(result.ItemID))
                        {
                            result = null;
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"repositoryID: {repositoryID}, itemID: {itemID}, Message: " + exception.ToMessage(), "ModuleApiClient/GetRepositoryItem");
            }

            return result;
        }

        public async Task<List<RepositoryItems>?> GetRepositoryItems(string applicationID, string repositoryID, string dependencyID, string businessID)
        {
            List<RepositoryItems>? result = null;
            try
            {
                var repository = GetRepository(applicationID, repositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrWhiteSpace(repository.TransactionGetItems) ? $"{GlobalConfiguration.ApplicationID}|STR|SLT010|LD01".Split("|") : repository.TransactionGetItems.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    if (transactionInfo.Length == 3)
                    {
                        transactionObject.ProgramID = applicationID;
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else if (transactionInfo.Length == 4)
                    {
                        transactionObject.ProgramID = transactionInfo[0];
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "ModuleApiClient/GetRepositoryItems");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    var inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryID);
                    inputs.Add("DependencyID", dependencyID);
                    inputs.Add("ApplicationID", applicationID);
                    inputs.Add("BusinessID", businessID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/GetRepositoryItems");
                        return result;
                    }
                    else
                    {
                        result = transactionResult?["GridData0"]?.ToObject<List<RepositoryItems>>();
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"repositoryID: {repositoryID}, dependencyID: {dependencyID}, Message: " + exception.ToMessage(), "ModuleApiClient/GetRepositoryItems");
            }

            return result;
        }

        public async Task<bool> DeleteRepositoryItem(string applicationID, string repositoryID, string itemID, string businessID)
        {
            var result = false;

            try
            {
                var repository = GetRepository(applicationID, repositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrWhiteSpace(repository.TransactionDeleteItem) ? $"{GlobalConfiguration.ApplicationID}|STR|SLT010|DD01".Split("|") : repository.TransactionDeleteItem.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    if (transactionInfo.Length == 3)
                    {
                        transactionObject.ProgramID = applicationID;
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else if (transactionInfo.Length == 4)
                    {
                        transactionObject.ProgramID = transactionInfo[0];
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "ModuleApiClient/DeleteRepositoryItem");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    var inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryID);
                    inputs.Add("ItemID", itemID);
                    inputs.Add("ApplicationID", applicationID);
                    inputs.Add("BusinessID", businessID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/DeleteRepositoryItem");
                        return result;
                    }
                    else
                    {
                        result = true;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"repositoryID: {repositoryID}, itemID: {itemID}, Message: " + exception.ToMessage(), "ModuleApiClient/DeleteRepositoryItem");
            }

            return result;
        }

        public async Task<bool> UpsertRepositoryItem(RepositoryItems repositoryItem)
        {
            var result = false;

            try
            {
                var repository = GetRepository(repositoryItem.ApplicationID, repositoryItem.RepositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrWhiteSpace(repository.TransactionUpsertItem) ? $"{GlobalConfiguration.ApplicationID}|STR|SLT010|MD01".Split("|") : repository.TransactionUpsertItem.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    if (transactionInfo.Length == 3)
                    {
                        transactionObject.ProgramID = repositoryItem.ApplicationID;
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else if (transactionInfo.Length == 4)
                    {
                        transactionObject.ProgramID = transactionInfo[0];
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "ModuleApiClient/GetRepUpsertRepositoryItemositoryItems");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    var inputs = new List<ServiceParameter>();
                    inputs.Add("ItemID", repositoryItem.ItemID);
                    inputs.Add("ApplicationID", repositoryItem.ApplicationID);
                    inputs.Add("BusinessID", repositoryItem.BusinessID);
                    inputs.Add("RepositoryID", repositoryItem.RepositoryID);
                    inputs.Add("DependencyID", repositoryItem.DependencyID);
                    inputs.Add("FileName", repositoryItem.FileName);
                    inputs.Add("SortingNo", repositoryItem.SortingNo);
                    inputs.Add("Comment", repositoryItem.Comment);
                    inputs.Add("PhysicalPath", repositoryItem.PhysicalPath);
                    inputs.Add("AbsolutePath", repositoryItem.AbsolutePath);
                    inputs.Add("RelativePath", repositoryItem.RelativePath);
                    inputs.Add("Extension", repositoryItem.Extension);
                    inputs.Add("Size", repositoryItem.Size);
                    inputs.Add("MD5", repositoryItem.MD5);
                    inputs.Add("MimeType", repositoryItem.MimeType);
                    inputs.Add("CreationTime", repositoryItem.CreationTime?.ToString("yyyy-MM-dd hh:mm:ss"));
                    inputs.Add("LastWriteTime", repositoryItem.LastWriteTime?.ToString("yyyy-MM-dd hh:mm:ss"));
                    inputs.Add("CustomPath1", repositoryItem.CustomPath1);
                    inputs.Add("CustomPath2", repositoryItem.CustomPath2);
                    inputs.Add("CustomPath3", repositoryItem.CustomPath3);
                    inputs.Add("PolicyPath", repositoryItem.PolicyPath);
                    inputs.Add("CreatedMemberNo", repositoryItem.CreatedMemberNo);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);

                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/UpsertRepositoryItem");
                        return result;
                    }
                    else
                    {
                        result = true;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"repositoryID: {repositoryItem.RepositoryID}, itemID: {repositoryItem.ItemID}, Message: " + exception.ToMessage(), "ModuleApiClient/UpsertRepositoryItem");
            }

            return result;
        }

        public async Task<bool> UpdateDependencyID(RepositoryItems repositoryItem, string targetDependencyID)
        {
            var result = false;

            try
            {
                var repository = GetRepository(repositoryItem.ApplicationID, repositoryItem.RepositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrWhiteSpace(repository.TransactionUpdateDependencyID) ? $"{GlobalConfiguration.ApplicationID}|STR|SLT010|UD01".Split("|") : repository.TransactionUpdateDependencyID.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    if (transactionInfo.Length == 3)
                    {
                        transactionObject.ProgramID = repositoryItem.ApplicationID;
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else if (transactionInfo.Length == 4)
                    {
                        transactionObject.ProgramID = transactionInfo[0];
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "ModuleApiClient/UpdateDependencyID");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    var inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryItem.RepositoryID);
                    inputs.Add("ItemID", repositoryItem.ItemID);
                    inputs.Add("BusinessID", repositoryItem.BusinessID);
                    inputs.Add("ApplicationID", repositoryItem.ApplicationID);
                    inputs.Add("SourceDependencyID", repositoryItem.DependencyID);
                    inputs.Add("TargetDependencyID", targetDependencyID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/UpdateDependencyID");
                        return result;
                    }
                    else
                    {
                        result = true;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"repositoryID: {repositoryItem.RepositoryID}, targetDependencyID: {targetDependencyID}, Message: " + exception.ToMessage(), "ModuleApiClient/UpdateDependencyID");
            }

            return result;
        }

        public async Task<bool> UpdateFileName(RepositoryItems repositoryItem, string sourceItemID)
        {
            var result = false;

            try
            {
                var repository = GetRepository(repositoryItem.ApplicationID, repositoryItem.RepositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrWhiteSpace(repository.TransactionUpdateFileName) ? $"{GlobalConfiguration.ApplicationID}|STR|SLT010|UD02".Split("|") : repository.TransactionUpdateFileName.Split("|");
                    var transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    if (transactionInfo.Length == 3)
                    {
                        transactionObject.ProgramID = repositoryItem.RepositoryID;
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else if (transactionInfo.Length == 4)
                    {
                        transactionObject.ProgramID = transactionInfo[0];
                        transactionObject.BusinessID = transactionInfo[1];
                        transactionObject.TransactionID = transactionInfo[2];
                        transactionObject.FunctionID = transactionInfo[3];
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "ModuleApiClient/UpdateFileName");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    var inputs = new List<ServiceParameter>();
                    inputs.Add("ApplicationID", repositoryItem.ApplicationID);
                    inputs.Add("RepositoryID", repositoryItem.RepositoryID);
                    inputs.Add("ItemID", sourceItemID);
                    inputs.Add("BusinessID", repositoryItem.BusinessID);
                    inputs.Add("FileName", repositoryItem.FileName);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject, ModuleConfiguration.ModuleID);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "ModuleApiClient/UpdateFileName");
                        return result;
                    }
                    else
                    {
                        result = true;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"repositoryID: {repositoryItem.RepositoryID}, Message: " + exception.ToMessage(), "ModuleApiClient/UpdateFileName");
            }

            return result;
        }
    }
}

