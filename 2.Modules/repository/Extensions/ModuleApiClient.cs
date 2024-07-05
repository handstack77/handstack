using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Web.Extensions;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;

using Microsoft.Extensions.Configuration;

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
                TransactionClientObject transactionObject = new TransactionClientObject();
                transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                transactionObject.ProgramID = transactionInfo[0];
                transactionObject.BusinessID = transactionInfo[1];
                transactionObject.TransactionID = transactionInfo[2];
                transactionObject.FunctionID = transactionInfo[3];
                transactionObject.ScreenID = transactionObject.TransactionID;

                List<ServiceParameter> inputs = new List<ServiceParameter>();
                inputs.Add("ApplicationID", applicationIDs);
                transactionObject.Inputs.Add(inputs);

                var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);

                if (transactionResult.ContainsKey("HasException") == true)
                {
                    logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/GetRepositorys");
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
                    var transactionInfo = string.IsNullOrEmpty(repository.TransactionGetItem) == true ? $"{ModuleConfiguration.ApplicationID}|STR|SLT010|GD01".Split("|") : repository.TransactionGetItem.Split("|");
                    TransactionClientObject transactionObject = new TransactionClientObject();
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
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "FileManagerController/GetRepositoryItem");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryID);
                    inputs.Add("ItemID", itemID);
                    inputs.Add("ApplicationID", applicationID);
                    inputs.Add("BusinessID", businessID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/GetRepositoryItem");
                        return result;
                    }
                    else
                    {
                        result = transactionResult?["FormData0"]?.ToObject<RepositoryItems>();
                        if (result != null && string.IsNullOrEmpty(result.ItemID) == true)
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
                    var transactionInfo = string.IsNullOrEmpty(repository.TransactionGetItems) == true ? $"{ModuleConfiguration.ApplicationID}|STR|SLT010|LD01".Split("|") : repository.TransactionGetItems.Split("|");
                    TransactionClientObject transactionObject = new TransactionClientObject();
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
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "FileManagerController/GetRepositoryItems");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryID);
                    inputs.Add("DependencyID", dependencyID);
                    inputs.Add("ApplicationID", applicationID);
                    inputs.Add("BusinessID", businessID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/GetRepositoryItems");
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
            bool result = false;

            try
            {
                var repository = GetRepository(applicationID, repositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrEmpty(repository.TransactionDeleteItem) == true ? $"{ModuleConfiguration.ApplicationID}|STR|SLT010|DD01".Split("|") : repository.TransactionDeleteItem.Split("|");
                    TransactionClientObject transactionObject = new TransactionClientObject();
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
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "FileManagerController/DeleteRepositoryItem");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryID);
                    inputs.Add("ItemID", itemID);
                    inputs.Add("ApplicationID", applicationID);
                    inputs.Add("BusinessID", businessID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/DeleteRepositoryItem");
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
            bool result = false;

            try
            {
                var repository = GetRepository(repositoryItem.ApplicationID, repositoryItem.RepositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrEmpty(repository.TransactionUpsertItem) == true ? $"{ModuleConfiguration.ApplicationID}|STR|SLT010|MD01".Split("|") : repository.TransactionUpsertItem.Split("|");
                    TransactionClientObject transactionObject = new TransactionClientObject();
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
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "FileManagerController/GetRepUpsertRepositoryItemositoryItems");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
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

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);

                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/UpsertRepositoryItem");
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
            bool result = false;

            try
            {
                var repository = GetRepository(repositoryItem.ApplicationID, repositoryItem.RepositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrEmpty(repository.TransactionUpdateDependencyID) == true ? $"{ModuleConfiguration.ApplicationID}|STR|SLT010|UD01".Split("|") : repository.TransactionUpdateDependencyID.Split("|");
                    TransactionClientObject transactionObject = new TransactionClientObject();
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
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "FileManagerController/UpdateDependencyID");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("RepositoryID", repositoryItem.RepositoryID);
                    inputs.Add("ItemID", repositoryItem.ItemID);
                    inputs.Add("BusinessID", repositoryItem.BusinessID);
                    inputs.Add("ApplicationID", repositoryItem.ApplicationID);
                    inputs.Add("SourceDependencyID", repositoryItem.DependencyID);
                    inputs.Add("TargetDependencyID", targetDependencyID);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/UpdateDependencyID");
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
            bool result = false;

            try
            {
                var repository = GetRepository(repositoryItem.ApplicationID, repositoryItem.RepositoryID);
                if (repository != null)
                {
                    var transactionInfo = string.IsNullOrEmpty(repository.TransactionUpdateFileName) == true ? $"{ModuleConfiguration.ApplicationID}|STR|SLT010|UD02".Split("|") : repository.TransactionUpdateFileName.Split("|");
                    TransactionClientObject transactionObject = new TransactionClientObject();
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
                        logger.Error("[{LogCategory}] " + $"transactionInfo: {transactionInfo} 확인 필요", "FileManagerController/UpdateFileName");
                        return result;
                    }
                    transactionObject.ScreenID = transactionObject.TransactionID;

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("ApplicationID", repositoryItem.ApplicationID);
                    inputs.Add("RepositoryID", repositoryItem.RepositoryID);
                    inputs.Add("ItemID", sourceItemID);
                    inputs.Add("BusinessID", repositoryItem.BusinessID);
                    inputs.Add("FileName", repositoryItem.FileName);
                    transactionObject.Inputs.Add(inputs);

                    var transactionResult = await transactionClient.TransactionDirect(ModuleConfiguration.BusinessServerUrl, transactionObject);
                    if (transactionResult.ContainsKey("HasException") == true)
                    {
                        logger.Error("[{LogCategory}] " + $"ErrorMessage: {transactionResult?["HasException"]?["ErrorMessage"]?.ToString()}", "FileManagerController/UpdateFileName");
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
