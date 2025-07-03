using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection.Metadata;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.Helper;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using repository.Entity;
using repository.Extensions;
using repository.Message;
using repository.Services;

using Serilog;

using static System.Reflection.Metadata.BlobBuilder;

namespace repository.Controllers
{
    [Area("repository")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class StorageController : BaseController
    {
        private readonly ModuleApiClient moduleApiClient;
        private readonly ISequentialIdGenerator sequentialIdGenerator;
        private readonly IStorageProviderFactory storageProviderFactory;

        private ILogger logger { get; }

        private IConfiguration configuration { get; }

        public StorageController(ModuleApiClient moduleApiClient, ISequentialIdGenerator sequentialIdGenerator, ILogger logger, IConfiguration configuration, IStorageProviderFactory storageProviderFactory)
        {
            this.moduleApiClient = moduleApiClient;
            this.sequentialIdGenerator = sequentialIdGenerator;
            this.logger = logger;
            this.configuration = configuration;
            this.storageProviderFactory = storageProviderFactory;
        }

        // http://localhost:8421/repository/api/storage/get-client-ip
        [HttpGet("[action]")]
        public string? GetClientIP()
        {
            return HttpContext.GetRemoteIpAddress();
        }

        // http://localhost:8421/repository/api/storage/action-handler
        [HttpGet("[action]")]
        public async Task<ActionResult> ActionHandler()
        {
            ActionResult result = Ok();
            var jsonContentResult = new JsonContentResult();
            jsonContentResult.Result = false;

            var action = Request.Query["Action"].ToString();

            switch (action)
            {
                case "GetItem":
                    result = await GetItem(jsonContentResult);
                    break;
                case "GetItems":
                    result = await GetItems(jsonContentResult);
                    break;
                case "UpdateDependencyID":
                    result = await UpdateDependencyID(jsonContentResult);
                    break;
                case "UpdateFileName":
                    result = await UpdateFileName(jsonContentResult);
                    break;
                default:
                    result = NotFound();
                    break;
            }

            Response.Headers["Access-Control-Expose-Headers"] = "FileModelType, FileResult";
            Response.Headers["FileModelType"] = "JsonContentResult";
            Response.Headers["FileResult"] = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(jsonContentResult)));
            return result;
        }

        private async Task<ActionResult> UpdateDependencyID(JsonContentResult jsonContentResult)
        {
            ActionResult result = BadRequest();
            var applicationID = Request.Query["ApplicationID"].ToString();
            var repositoryID = Request.Query["RepositoryID"].ToString();
            var sourceDependencyID = Request.Query["SourceDependencyID"].ToString();
            var targetDependencyID = Request.Query["TargetDependencyID"].ToString();
            var businessID = string.IsNullOrEmpty(Request.Query["BusinessID"]) == true ? "0" : Request.Query["BusinessID"].ToString();

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(sourceDependencyID) == true || string.IsNullOrEmpty(targetDependencyID) == true)
            {
                var message = $"UpdateDependencyID 요청 정보가 유효하지 않습니다, repositoryID: {repositoryID}, sourceDependencyID: {sourceDependencyID}, targetDependencyID: {targetDependencyID}";
                jsonContentResult.Message = message;
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                jsonContentResult.Message = "UpdateDependencyID RepositoryID 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            List<RepositoryItems>? items = null;
            if (repository.IsLocalDbFileManaged == true)
            {
                items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                {
                    ApplicationID = applicationID,
                    BusinessID = businessID,
                    RepositoryID = repositoryID,
                    DependencyID = sourceDependencyID
                });
            }
            else
            {
                items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, sourceDependencyID, businessID);
            }

            var isDataUpsert = false;
            if (items != null && items.Count > 0)
            {
                for (var i = 0; i < items.Count; i++)
                {
                    var item = items[i];

                    if (repository.IsLocalDbFileManaged == true)
                    {
                        isDataUpsert = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.UD01", new
                        {
                            ApplicationID = applicationID,
                            BusinessID = item.BusinessID,
                            RepositoryID = repositoryID,
                            ItemID = item.ItemID,
                            SourceDependencyID = item.DependencyID,
                            TargetDependencyID = targetDependencyID
                        }) > 0;
                    }
                    else
                    {
                        item.ApplicationID = applicationID;
                        isDataUpsert = await moduleApiClient.UpdateDependencyID(item, targetDependencyID);
                    }

                    if (isDataUpsert == false)
                    {
                        jsonContentResult.Result = false;
                        jsonContentResult.Message = "UpdateDependencyID 데이터 거래 오류";
                        logger.Warning("[{LogCategory}] 데이터 거래 오류 " + JsonConvert.SerializeObject(item), "StorageController/UpdateDependencyID");
                        return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
                    }
                }
            }
            else
            {
                jsonContentResult.Message = $"DependencyID: '{sourceDependencyID}' 파일 요청 정보 확인 필요";
                result = Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            jsonContentResult.Result = true;
            result = Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");

            return result;
        }

        // ItemID, FileName이 동일하게 관리되는 Profile 업로드 타입을 위한 기능 UD02 거래에서 변경 관리할 것인지 확인 필요
        private async Task<ActionResult> UpdateFileName(JsonContentResult jsonContentResult)
        {
            ActionResult result = BadRequest();
            var applicationID = Request.Query["ApplicationID"].ToString();
            var repositoryID = Request.Query["RepositoryID"].ToString();
            var itemID = Request.Query["ItemID"].ToString();
            var changeFileName = Request.Query["FileName"].ToString();
            var businessID = string.IsNullOrEmpty(Request.Query["BusinessID"]) == true ? "0" : Request.Query["BusinessID"].ToString();

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true || string.IsNullOrEmpty(changeFileName) == true)
            {
                jsonContentResult.Message = $"UpdateFileName 요청 정보가 유효하지 않습니다, repositoryID: {repositoryID}, itemID: {itemID}, fileName: {changeFileName}";
                return BadRequest(jsonContentResult.Message);
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                jsonContentResult.Message = "UpdateFileName RepositoryID 요청 정보 확인 필요";
                return BadRequest(jsonContentResult.Message);
            }

            RepositoryItems? item = null;
            if (repository.IsLocalDbFileManaged == true)
            {
                var items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.GD01", new
                {
                    ApplicationID = applicationID,
                    BusinessID = businessID,
                    RepositoryID = repositoryID,
                    ItemID = itemID
                });

                if (items != null && items.Count > 0)
                {
                    item = items[0];
                }
            }
            else
            {
                item = await moduleApiClient.GetRepositoryItem(applicationID, repositoryID, itemID, businessID);
            }

            var isDataUpsert = false;
            if (item != null)
            {
                if (item.FileName.Trim() == changeFileName.Trim())
                {
                    jsonContentResult.Message = "동일한 파일명으로 변경 불가";
                    return BadRequest(jsonContentResult.Message);
                }

                var customPath1 = item.CustomPath1;
                var customPath2 = item.CustomPath2;
                var customPath3 = item.CustomPath3;

                var repositoryManager = new RepositoryManager();
                repositoryManager.PersistenceDirectoryPath = repositoryManager.GetPhysicalPath(repository, customPath1, customPath2, customPath3);
                var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, customPath1, customPath2, customPath3);
                var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
                relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";

                var isExistFile = false;

                var storageProvider = storageProviderFactory.Create(repository, item.CustomPath1, item.CustomPath2, item.CustomPath3);
                if (storageProvider == null)
                {
                    var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                    logger.Warning("[{LogCategory}] " + errorText, "StorageController/UpdateFileName");
                    result = BadRequest(errorText);
                    return result;
                }

                string sourceFileName = repository.IsFileNameEncrypt ? item.ItemID : item.FileName;
                var sourceBlobID = relativeDirectoryUrlPath + sourceFileName;

                isExistFile = await storageProvider.FileExistsAsync(sourceBlobID);
                if (isExistFile == true)
                {
                    var newBlobID = relativeDirectoryUrlPath + changeFileName;
                    await storageProvider.MoveAsync(sourceBlobID, newBlobID, item.MimeType);
                }
                else
                {
                    jsonContentResult.Message = $"파일 없음, 파일 요청 정보 확인 필요. repositoryID: {repositoryID}, itemID: {itemID}, fileName: {changeFileName}";
                    return BadRequest(jsonContentResult.Message);
                }

                var backupItemID = item.ItemID;
                item.ApplicationID = applicationID;
                item.ItemID = changeFileName;
                item.PhysicalPath = item.PhysicalPath.Replace(item.FileName, changeFileName);
                item.RelativePath = item.RelativePath.Replace(item.FileName, changeFileName);
                item.AbsolutePath = item.AbsolutePath.Replace(item.FileName, changeFileName);
                item.FileName = changeFileName;

                if (repository.IsLocalDbFileManaged == true)
                {
                    isDataUpsert = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.UD02", new
                    {
                        ApplicationID = applicationID,
                        BusinessID = item.BusinessID,
                        RepositoryID = repositoryID,
                        ItemID = item.ItemID,
                        FileName = item.FileName,
                    }) > 0;
                }
                else
                {
                    isDataUpsert = await moduleApiClient.UpdateFileName(item, backupItemID);
                }

                if (isDataUpsert == false)
                {
                    jsonContentResult.Result = false;
                    jsonContentResult.Message = "UpdateFileName 데이터 거래 오류";
                    return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
                }
            }
            else
            {
                jsonContentResult.Message = $"데이터 없음, 파일 요청 정보 확인 필요. repositoryID: {repositoryID}, itemID: {itemID}, fileName: {changeFileName}";
                return BadRequest(jsonContentResult.Message);
            }

            jsonContentResult.Result = true;
            result = Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            return result;
        }

        private async Task<ActionResult> GetItem(JsonContentResult jsonContentResult)
        {
            ActionResult result = BadRequest();
            var applicationID = Request.Query["ApplicationID"].ToString();
            var repositoryID = Request.Query["RepositoryID"].ToString();
            var itemID = Request.Query["ItemID"].ToString();
            var businessID = string.IsNullOrEmpty(Request.Query["BusinessID"]) == true ? "0" : Request.Query["BusinessID"].ToString();

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true)
            {
                jsonContentResult.Message = $"GetItem 요청 정보가 유효하지 않습니다, repositoryID: {repositoryID}, dependencyID: {itemID}";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                jsonContentResult.Message = $"RepositoryID: '{repositoryID}' 파일 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            RepositoryItems? item = null;
            if (repository.IsLocalDbFileManaged == true)
            {
                var items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.GD01", new
                {
                    ApplicationID = applicationID,
                    BusinessID = businessID,
                    RepositoryID = repositoryID,
                    ItemID = itemID
                });

                if (items != null && items.Count > 0)
                {
                    item = items[0];
                }
            }
            else
            {
                item = await moduleApiClient.GetRepositoryItem(applicationID, repositoryID, itemID, businessID);
            }

            if (item != null)
            {
                var entity = new
                {
                    ItemID = item.ItemID,
                    RepositoryID = item.RepositoryID,
                    DependencyID = item.DependencyID,
                    FileName = item.FileName,
                    SortingNo = item.SortingNo,
                    AbsolutePath = item.AbsolutePath,
                    RelativePath = item.RelativePath,
                    Extension = item.Extension,
                    Size = item.Size,
                    MimeType = item.MimeType,
                    CustomPath1 = item.CustomPath1,
                    CustomPath2 = item.CustomPath2,
                    CustomPath3 = item.CustomPath3,
                    PolicyPath = item.PolicyPath,
                    MD5 = item.MD5
                };

                jsonContentResult.Result = true;
                result = Content(JsonConvert.SerializeObject(entity), "application/json");
            }
            else
            {
                jsonContentResult.Message = $"ItemID: '{itemID}' 파일 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            return result;
        }

        private async Task<ActionResult> GetItems(JsonContentResult jsonContentResult)
        {
            ActionResult result = BadRequest();
            var applicationID = Request.Query["ApplicationID"].ToString();
            var repositoryID = Request.Query["RepositoryID"].ToString();
            var dependencyID = Request.Query["DependencyID"].ToString();
            var businessID = string.IsNullOrEmpty(Request.Query["BusinessID"]) == true ? "0" : Request.Query["BusinessID"].ToString();

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(dependencyID) == true)
            {
                jsonContentResult.Message = $"GetItems 요청 정보가 유효하지 않습니다, repositoryID: {repositoryID}, dependencyID: {dependencyID}";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                jsonContentResult.Message = $"RepositoryID: '{repositoryID}' 파일 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            List<RepositoryItems>? items = null;
            if (repository.IsLocalDbFileManaged == true)
            {
                items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                {
                    ApplicationID = applicationID,
                    BusinessID = businessID,
                    RepositoryID = repositoryID,
                    DependencyID = dependencyID
                });
            }
            else
            {
                items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
            }

            var entitys = new List<dynamic>();
            if (items != null)
            {
                foreach (var item in items)
                {
                    entitys.Add(new
                    {
                        ItemID = item.ItemID,
                        RepositoryID = item.RepositoryID,
                        DependencyID = item.DependencyID,
                        FileName = item.FileName,
                        SortingNo = item.SortingNo,
                        AbsolutePath = item.AbsolutePath,
                        RelativePath = item.RelativePath,
                        Extension = item.Extension,
                        Size = item.Size,
                        MimeType = item.MimeType,
                        CustomPath1 = item.CustomPath1,
                        CustomPath2 = item.CustomPath2,
                        CustomPath3 = item.CustomPath3,
                        PolicyPath = item.PolicyPath,
                        MD5 = item.MD5
                    });
                }
            }
            else
            {
                jsonContentResult.Message = $"DependencyID: '{dependencyID}' 파일 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            jsonContentResult.Result = true;
            result = Content(JsonConvert.SerializeObject(entitys), "application/json");

            return result;
        }

        // http://localhost:8421/repository/api/storage/get-repository
        [HttpGet("[action]")]
        public ContentResult GetRepository(string applicationID, string repositoryID)
        {
            var result = "{}";

            if (string.IsNullOrEmpty(repositoryID) == false)
            {
                var repository = moduleApiClient.GetRepository(applicationID, repositoryID);

                if (repository != null)
                {
                    var entity = new
                    {
                        RepositoryID = repository.RepositoryID,
                        RepositoryName = repository.RepositoryName,
                        StorageType = repository.StorageType,
                        IsMultiUpload = repository.IsMultiUpload,
                        IsAutoPath = repository.IsAutoPath,
                        PolicyPathID = repository.PolicyPathID,
                        UploadType = repository.UploadTypeID,
                        UploadExtensions = repository.UploadExtensions,
                        UploadCount = repository.UploadCount,
                        UploadSizeLimit = repository.UploadSizeLimit
                    };
                    result = JsonConvert.SerializeObject(entity);
                }
            }

            return Content(result, "application/json");
        }

        // http://localhost:8421/repository/api/storage/upload-file
        [HttpPost("[action]")]
        public async Task<ActionResult> UploadFile([FromForm] IFormFile? file)
        {
            var result = new FileUploadResult();
            result.Result = false;
            var applicationID = Request.Query["ApplicationID"].ToString();
            var repositoryID = Request.Query["RepositoryID"].ToString();
            var dependencyID = Request.Query["DependencyID"].ToString();
            var businessID = string.IsNullOrEmpty(Request.Query["BusinessID"]) == true ? "0" : Request.Query["BusinessID"].ToString();

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(dependencyID) == true)
            {
                result.Message = "UploadFile RepositoryID 또는 DependencyID 필수 요청 정보 필요";
                return Content(JsonConvert.SerializeObject(result), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                result.Message = "UploadFile RepositoryID 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(result), "application/json");
            }

            var sortingNo = string.IsNullOrEmpty(Request.Query["SortingNo"]) == true ? 1 : Request.Query["SortingNo"].ToString().GetInt();
            var saveFileName = string.IsNullOrEmpty(Request.Query["FileName"]) == true ? "" : Request.Query["FileName"].ToString();
            var comment = string.IsNullOrEmpty(Request.Query["Comment"]) == true ? "" : Request.Query["Comment"].ToString();
            var customPath1 = string.IsNullOrEmpty(Request.Query["CustomPath1"]) == true ? "" : Request.Query["CustomPath1"].ToString();
            var customPath2 = string.IsNullOrEmpty(Request.Query["CustomPath2"]) == true ? "" : Request.Query["CustomPath2"].ToString();
            var customPath3 = string.IsNullOrEmpty(Request.Query["CustomPath3"]) == true ? "" : Request.Query["CustomPath3"].ToString();
            var userID = string.IsNullOrEmpty(Request.Query["UserID"]) == true ? "" : Request.Query["UserID"].ToString();

            RepositoryItems? repositoryItem = null;
            if (Request.HasFormContentType == true)
            {
                if (file == null)
                {
                    result.Message = "업로드 파일 정보 없음";
                    return Content(JsonConvert.SerializeObject(result), "application/json");
                }
                else
                {
                    try
                    {
                        if (repository.UploadSizeLimit < file.Length)
                        {
                            result.Message = repository.UploadSizeLimit.ToByteSize() + " 이상 업로드 할 수 없습니다";
                            return Content(JsonConvert.SerializeObject(result), "application/json");
                        }

                        var repositoryManager = new RepositoryManager();
                        repositoryManager.PersistenceDirectoryPath = repositoryManager.GetPhysicalPath(repository, customPath1, customPath2, customPath3);
                        var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, customPath1, customPath2, customPath3);
                        var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
                        relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";

                        var storageProvider = storageProviderFactory.Create(repository, customPath1, customPath2, customPath3);
                        if (storageProvider == null)
                        {
                            var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                            logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFile");
                            result.Message = errorText;
                            return Content(JsonConvert.SerializeObject(result), "application/json");
                        }

                        if (repository.IsMultiUpload == true)
                        {
                            List<RepositoryItems>? items;
                            if (repository.IsFileUploadDownloadOnly == true)
                            {
                                result.RemainingCount = repository.UploadCount;
                            }
                            else
                            {
                                if (repository.IsLocalDbFileManaged == true)
                                {
                                    items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                                    {
                                        ApplicationID = applicationID,
                                        BusinessID = businessID,
                                        RepositoryID = repositoryID,
                                        DependencyID = dependencyID
                                    });
                                }
                                else
                                {
                                    items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                                }

                                if (items != null && items.Count() > 0)
                                {
                                    if (items.Count > repository.UploadCount)
                                    {
                                        result.Message = $"{repository.UploadCount} 건 이상 파일 업로드 할 수 없습니다";
                                        return Content(JsonConvert.SerializeObject(result), "application/json");
                                    }
                                }

                                result.RemainingCount = repository.UploadCount - (items == null ? 1 : items.Count + 1);
                            }
                        }
                        else
                        {
                            List<RepositoryItems>? items;
                            if (repository.IsFileUploadDownloadOnly == true)
                            {
                                result.RemainingCount = repository.UploadCount;
                            }
                            else
                            {
                                if (repository.IsLocalDbFileManaged == true)
                                {
                                    items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                                    {
                                        ApplicationID = applicationID,
                                        BusinessID = businessID,
                                        RepositoryID = repositoryID,
                                        DependencyID = dependencyID
                                    });
                                }
                                else
                                {
                                    items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                                }

                                if (items != null && items.Count() > 0)
                                {
                                    foreach (var item in items)
                                    {
                                        string deleteFileName;
                                        if (repository.IsFileNameEncrypt == true)
                                        {
                                            deleteFileName = item.ItemID;
                                        }
                                        else
                                        {
                                            deleteFileName = item.FileName;
                                        }

                                        await storageProvider.DeleteAsync(deleteFileName);

                                        if (repository.IsLocalDbFileManaged == true)
                                        {
                                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.DD01", new
                                            {
                                                ApplicationID = applicationID,
                                                BusinessID = item.BusinessID,
                                                RepositoryID = repositoryID,
                                                ItemID = item.ItemID
                                            });
                                        }
                                        else
                                        {
                                            await moduleApiClient.DeleteRepositoryItem(applicationID, repositoryID, item.ItemID, item.BusinessID);
                                        }
                                    }
                                }
                            }
                        }

                        var absolutePath = "";
                        var relativePath = "";
                        var policyPath = repositoryManager.GetPolicyPath(repository);
                        var fileName = string.IsNullOrEmpty(saveFileName) == true ? file.FileName : saveFileName;
                        var extension = Path.GetExtension(fileName);
                        if (string.IsNullOrEmpty(extension) == true)
                        {
                            extension = Path.GetExtension(file.FileName);
                        }

                        repositoryItem = new RepositoryItems();
                        repositoryItem.ItemID = repository.IsFileNameEncrypt == true ? sequentialIdGenerator.NewId().ToString("N") : fileName;
                        repositoryItem.ApplicationID = applicationID;
                        repositoryItem.BusinessID = businessID;
                        repositoryItem.SortingNo = sortingNo;
                        repositoryItem.Comment = comment;
                        repositoryItem.FileName = fileName;
                        repositoryItem.Extension = extension;
                        repositoryItem.MimeType = GetMimeType(file.FileName);
                        repositoryItem.Size = file.Length;
                        repositoryItem.RepositoryID = repositoryID;
                        repositoryItem.DependencyID = dependencyID;
                        repositoryItem.CustomPath1 = customPath1;
                        repositoryItem.CustomPath2 = customPath2;
                        repositoryItem.CustomPath3 = customPath3;
                        repositoryItem.PolicyPath = policyPath;
                        repositoryItem.CreatedMemberNo = userID;
                        repositoryItem.CreatedAt = DateTime.Now;


                        switch (repository.StorageType)
                        {
                            case "AzureBlob":
                            case "AwsS3":
                            case "GoogleCloudStorage":
                                var blobID = relativeDirectoryUrlPath + repositoryItem.ItemID;

                                if (repository.IsFileNameEncrypt == false && repository.IsFileOverWrite == false)
                                {
                                    blobID = await storageProvider.GetDuplicateCheckUniqueFileName(blobID);
                                    repositoryItem.ItemID = blobID;
                                    repositoryItem.FileName = blobID;
                                }

                                var openReadStream = file.OpenReadStream();
                                var headers = new BlobHttpHeaders
                                {
                                    ContentType = repositoryItem.MimeType
                                };

                                var (creationTime, lastWriteTime) = await storageProvider.UploadAsync(repositoryItem.ItemID, openReadStream, repositoryItem.MimeType);

                                repositoryItem.PhysicalPath = "";
                                repositoryItem.MD5 = GetStreamMD5Hash(openReadStream);
                                repositoryItem.CreationTime = creationTime;
                                repositoryItem.LastWriteTime = lastWriteTime;

                                if (repository.IsVirtualPath == true)
                                {
                                    relativePath = relativeDirectoryUrlPath + repositoryItem.ItemID;
                                    if (string.IsNullOrEmpty(repository.BlobItemUrl) == true)
                                    {
                                        absolutePath = $"//{repository.RepositoryID}.blob.core.windows.net/{repository.BlobContainerID.ToLower()}/";
                                        absolutePath = absolutePath + relativePath;
                                    }
                                    else
                                    {
                                        absolutePath = repository.BlobItemUrl
                                            .Replace("[CONTAINERID]", repository.BlobContainerID.ToLower())
                                            .Replace("[BLOBID]", relativePath);
                                    }
                                }
                                else
                                {
                                    relativePath = $"/http-download-file?repositoryID={repositoryItem.RepositoryID}&itemID={repositoryItem.ItemID}&applicationID={repositoryItem.ApplicationID}";
                                    relativePath = $"{Request.Path.Value?.Replace("/upload-file", "")}{relativePath}";
                                    absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                }

                                repositoryItem.RelativePath = relativePath;
                                repositoryItem.AbsolutePath = absolutePath;
                                break;
                            case "FileSystem":
                                var itemPhysicalPath = repositoryManager.GetSavePath(repositoryItem.ItemID);

                                if (repository.IsFileNameEncrypt == false && repository.IsFileOverWrite == false)
                                {
                                    itemPhysicalPath = repositoryManager.GetDuplicateCheckUniqueFileName(itemPhysicalPath);
                                    var renewFileInfo = new FileInfo(itemPhysicalPath);
                                    var renewFileName = renewFileInfo.Name;
                                    repositoryItem.ItemID = renewFileName;
                                    repositoryItem.FileName = renewFileName;
                                }

                                using (var fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                                {
                                    await file.CopyToAsync(fileStream);
                                }

                                if (repository.IsKeepFileExtension == true)
                                {
                                    itemPhysicalPath = itemPhysicalPath + extension;
                                    using var fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                                    await file.CopyToAsync(fileStream);
                                }

                                var fileInfo = new FileInfo(itemPhysicalPath);
                                repositoryItem.PhysicalPath = itemPhysicalPath;
                                repositoryItem.MD5 = GetFileMD5Hash(itemPhysicalPath);
                                repositoryItem.CreationTime = fileInfo.CreationTime;
                                repositoryItem.LastWriteTime = fileInfo.LastWriteTime;

                                if (repository.IsVirtualPath == true)
                                {
                                    if (string.IsNullOrEmpty(repository.UserWorkID) == true)
                                    {
                                        relativePath = $"/{ModuleConfiguration.ModuleID}/{repository.ApplicationID}/{repository.RepositoryID}/";
                                        relativePath = relativePath + relativeDirectoryUrlPath + repositoryItem.ItemID;
                                    }
                                    else
                                    {
                                        relativePath = $"/{ModuleConfiguration.ModuleID}/api/storage/virtual-download-file?applicationID={repository.ApplicationID}&repositoryID={repository.RepositoryID}&subDirectory={repositoryItem.CustomPath1}&fileName={repositoryItem.ItemID}";
                                    }

                                    absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                }
                                else
                                {
                                    relativePath = $"/http-download-file?repositoryID={repositoryItem.RepositoryID}&itemID={repositoryItem.ItemID}&applicationID={repositoryItem.ApplicationID}";
                                    relativePath = $"{Request.Path.Value?.Replace("/upload-file", "")}{relativePath}";
                                    absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                }

                                repositoryItem.RelativePath = relativePath;
                                repositoryItem.AbsolutePath = absolutePath;
                                break;
                            default:
                                var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                                logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFile");
                                return BadRequest(errorText);
                        }

                        var isDataUpsert = false;
                        if (repository.IsFileUploadDownloadOnly == true)
                        {
                            isDataUpsert = true;
                        }
                        else
                        {
                            if (repository.IsLocalDbFileManaged == true)
                            {
                                isDataUpsert = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.MD01", repositoryItem) > 0;
                            }
                            else
                            {
                                isDataUpsert = await moduleApiClient.UpsertRepositoryItem(repositoryItem);
                            }
                        }

                        if (isDataUpsert == true)
                        {
                            result.ItemID = repositoryItem.ItemID;
                            result.Result = true;
                        }
                        else
                        {
                            result.Message = "UpsertRepositoryItem 데이터 거래 오류";
                            logger.Error("[{LogCategory}] " + $"{result.Message} - {JsonConvert.SerializeObject(repositoryItem)}", "StorageController/UploadFile");
                            return Content(JsonConvert.SerializeObject(result), "application/json");
                        }
                    }
                    catch (Exception exception)
                    {
                        result.Message = exception.Message;
                        logger.Error("[{LogCategory}] " + $"{result.Message} - {JsonConvert.SerializeObject(repositoryItem)}", "StorageController/UploadFile");
                        return Content(JsonConvert.SerializeObject(result), "application/json");
                    }
                }
            }
            else
            {
                string? xFileName = Request.Headers["X-File-Name"];
                string? xFileSize = Request.Headers["X-File-Size"];

                if (string.IsNullOrEmpty(xFileName) == true || string.IsNullOrEmpty(xFileSize) == true)
                {
                    result.Message = "업로드 파일 정보 없음";
                    return Content(JsonConvert.SerializeObject(result), "application/json");
                }
                else
                {
                    try
                    {
                        xFileName = WebUtility.UrlDecode(xFileName);
                        var fileName = string.IsNullOrEmpty(saveFileName) == true ? xFileName : saveFileName;
                        var fileLength = xFileSize.GetLong();

                        if (repository.UploadSizeLimit < fileLength)
                        {
                            result.Message = repository.UploadSizeLimit.ToByteSize() + " 이상 업로드 할 수 없습니다";
                            return Content(JsonConvert.SerializeObject(result), "application/json");
                        }

                        var repositoryManager = new RepositoryManager();
                        repositoryManager.PersistenceDirectoryPath = repositoryManager.GetPhysicalPath(repository, customPath1, customPath2, customPath3);
                        var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, customPath1, customPath2, customPath3);
                        var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
                        relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";

                        var storageProvider = storageProviderFactory.Create(repository, customPath1, customPath2, customPath3);
                        if (storageProvider == null)
                        {
                            var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                            logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFile");
                            result.Message = errorText;
                            return Content(JsonConvert.SerializeObject(result), "application/json");
                        }

                        if (repository.IsMultiUpload == true)
                        {
                            List<RepositoryItems>? items = null;
                            if (repository.IsLocalDbFileManaged == true)
                            {
                                items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                                {
                                    ApplicationID = applicationID,
                                    BusinessID = businessID,
                                    RepositoryID = repositoryID,
                                    DependencyID = dependencyID
                                });
                            }
                            else
                            {
                                items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                            }

                            if (items != null && items.Count() > 0)
                            {
                                if (items.Count > repository.UploadCount)
                                {
                                    result.Message = $"{repository.UploadCount} 건 이상 파일 업로드 할 수 없습니다";
                                    return Content(JsonConvert.SerializeObject(result), "application/json");
                                }
                            }

                            result.RemainingCount = repository.UploadCount - (items == null ? 1 : items.Count + 1);
                        }
                        else
                        {
                            List<RepositoryItems>? items = null;
                            if (repository.IsLocalDbFileManaged == true)
                            {
                                items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                                {
                                    ApplicationID = applicationID,
                                    BusinessID = businessID,
                                    RepositoryID = repositoryID,
                                    DependencyID = dependencyID
                                });
                            }
                            else
                            {
                                items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                            }

                            if (items != null && items.Count() > 0)
                            {
                                foreach (var item in items)
                                {
                                    string deleteFileName;
                                    if (repository.IsFileNameEncrypt == true)
                                    {
                                        deleteFileName = item.ItemID;
                                    }
                                    else
                                    {
                                        deleteFileName = item.FileName;
                                    }


                                    await storageProvider.DeleteAsync(deleteFileName);

                                    if (repository.IsLocalDbFileManaged == true)
                                    {
                                        ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.DD01", new
                                        {
                                            ApplicationID = applicationID,
                                            BusinessID = item.BusinessID,
                                            RepositoryID = repositoryID,
                                            ItemID = item.ItemID
                                        });
                                    }
                                    else
                                    {
                                        await moduleApiClient.DeleteRepositoryItem(applicationID, repositoryID, item.ItemID, item.BusinessID);
                                    }
                                }
                            }
                        }

                        var absolutePath = "";
                        var relativePath = "";
                        var policyPath = repositoryManager.GetPolicyPath(repository);
                        var extension = Path.GetExtension(fileName);
                        if (string.IsNullOrEmpty(extension) == true)
                        {
                            extension = Path.GetExtension(xFileName);
                        }

                        repositoryItem = new RepositoryItems();
                        repositoryItem.ItemID = repository.IsFileNameEncrypt == true ? sequentialIdGenerator.NewId().ToString("N") : fileName;
                        repositoryItem.ApplicationID = applicationID;
                        repositoryItem.BusinessID = businessID;
                        repositoryItem.SortingNo = sortingNo;
                        repositoryItem.Comment = comment;
                        repositoryItem.FileName = fileName;
                        repositoryItem.Extension = extension;
                        repositoryItem.MimeType = GetMimeType(xFileName);
                        repositoryItem.Size = fileLength;
                        repositoryItem.RepositoryID = repositoryID;
                        repositoryItem.DependencyID = dependencyID;
                        repositoryItem.CustomPath1 = customPath1;
                        repositoryItem.CustomPath2 = customPath2;
                        repositoryItem.CustomPath3 = customPath3;
                        repositoryItem.PolicyPath = policyPath;
                        repositoryItem.CreatedMemberNo = userID;
                        repositoryItem.CreatedAt = DateTime.Now;

                        switch (repository.StorageType)
                        {
                            case "AzureBlob":
                            case "AwsS3":
                            case "GoogleCloudStorage":
                                var blobID = relativeDirectoryUrlPath + repositoryItem.ItemID;

                                if (repository.IsFileNameEncrypt == false && repository.IsFileOverWrite == false)
                                {
                                    blobID = await storageProvider.GetDuplicateCheckUniqueFileName(blobID);
                                    repositoryItem.ItemID = blobID;
                                    repositoryItem.FileName = blobID;
                                }


                                using (var openReadStream = new MemoryStream(8192))
                                {
                                    await Request.BodyReader.CopyToAsync(openReadStream);
                                    openReadStream.Position = 0;
                                    var headers = new BlobHttpHeaders
                                    {
                                        ContentType = repositoryItem.MimeType
                                    };


                                    var (creationTime, lastWriteTime) = await storageProvider.UploadAsync(repositoryItem.ItemID, openReadStream, repositoryItem.MimeType);

                                    repositoryItem.PhysicalPath = "";
                                    repositoryItem.MD5 = GetStreamMD5Hash(openReadStream);
                                    repositoryItem.CreationTime = creationTime;
                                    repositoryItem.LastWriteTime = lastWriteTime;
                                }

                                if (repository.IsVirtualPath == true)
                                {
                                    relativePath = relativeDirectoryUrlPath + repositoryItem.ItemID;
                                    if (string.IsNullOrEmpty(repository.BlobItemUrl) == true)
                                    {
                                        absolutePath = $"//{repository.RepositoryID}.blob.core.windows.net/{repository.BlobContainerID.ToLower()}/";
                                        absolutePath = absolutePath + relativePath;
                                    }
                                    else
                                    {
                                        absolutePath = repository.BlobItemUrl
                                            .Replace("[CONTAINERID]", repository.BlobContainerID.ToLower())
                                            .Replace("[BLOBID]", relativePath);
                                    }
                                }
                                else
                                {
                                    relativePath = $"/http-download-file?repositoryID={repositoryItem.RepositoryID}&itemID={repositoryItem.ItemID}&applicationID={repositoryItem.ApplicationID}";
                                    relativePath = $"{Request.Path.Value?.Replace("/upload-file", "")}{relativePath}";
                                    absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                }
                                break;
                            case "FileSystem":
                                var itemPhysicalPath = repositoryManager.GetSavePath(repositoryItem.ItemID);

                                if (repository.IsFileNameEncrypt == false && repository.IsFileOverWrite == false)
                                {
                                    itemPhysicalPath = repositoryManager.GetDuplicateCheckUniqueFileName(itemPhysicalPath);
                                    var renewFileInfo = new FileInfo(itemPhysicalPath);
                                    var renewFileName = renewFileInfo.Name;
                                    repositoryItem.ItemID = renewFileName;
                                    repositoryItem.FileName = renewFileName;
                                }

                                using (var fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                                using (var memoryStream = new MemoryStream(8192))
                                {
                                    await Request.BodyReader.CopyToAsync(memoryStream);
                                    memoryStream.Position = 0;
                                    await memoryStream.CopyToAsync(fileStream);

                                    if (repository.IsKeepFileExtension == true)
                                    {
                                        itemPhysicalPath = itemPhysicalPath + extension;
                                        using var keepFileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                                        memoryStream.Position = 0;
                                        await memoryStream.CopyToAsync(keepFileStream);
                                    }
                                }

                                var fileInfo = new FileInfo(itemPhysicalPath);
                                repositoryItem.PhysicalPath = itemPhysicalPath;
                                repositoryItem.MD5 = GetFileMD5Hash(itemPhysicalPath);
                                repositoryItem.CreationTime = fileInfo.CreationTime;
                                repositoryItem.LastWriteTime = fileInfo.LastWriteTime;

                                if (repository.IsVirtualPath == true)
                                {
                                    if (string.IsNullOrEmpty(repository.UserWorkID) == true)
                                    {
                                        relativePath = $"/{ModuleConfiguration.ModuleID}/{repository.ApplicationID}/{repository.RepositoryID}/";
                                        relativePath = relativePath + relativeDirectoryUrlPath + repositoryItem.ItemID;
                                    }
                                    else
                                    {
                                        relativePath = $"/{ModuleConfiguration.ModuleID}/api/storage/virtual-download-file?applicationID={repository.ApplicationID}&repositoryID={repository.RepositoryID}&subDirectory={repositoryItem.CustomPath1}&fileName={repositoryItem.ItemID}";
                                    }

                                    absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                }
                                else
                                {
                                    relativePath = $"/http-download-file?repositoryID={repositoryItem.RepositoryID}&itemID={repositoryItem.ItemID}&applicationID={repositoryItem.ApplicationID}";
                                    relativePath = $"{Request.Path.Value?.Replace("/upload-file", "")}{relativePath}";
                                    absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                }

                                repositoryItem.RelativePath = relativePath;
                                repositoryItem.AbsolutePath = absolutePath;
                                break;
                            default:
                                var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                                logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFile");
                                return BadRequest(errorText);
                        }

                        var isDataUpsert = false;
                        if (repository.IsLocalDbFileManaged == true)
                        {
                            isDataUpsert = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.MD01", repositoryItem) > 0;
                        }
                        else
                        {
                            isDataUpsert = await moduleApiClient.UpsertRepositoryItem(repositoryItem);
                        }

                        if (isDataUpsert == true)
                        {
                            result.ItemID = repositoryItem.ItemID;
                            result.Result = true;
                        }
                        else
                        {
                            result.Message = "UpsertRepositoryItem 데이터 거래 오류";
                            logger.Error("[{LogCategory}] " + $"{result.Message} - {JsonConvert.SerializeObject(repositoryItem)}", "StorageController/UploadFile");
                            return Content(JsonConvert.SerializeObject(result), "application/json");
                        }
                    }
                    catch (Exception exception)
                    {
                        result.Message = exception.Message;
                        logger.Error("[{LogCategory}] " + $"{result.Message} - {JsonConvert.SerializeObject(repositoryItem)}", "StorageController/UploadFile");
                        return Content(JsonConvert.SerializeObject(result), "application/json");
                    }
                }
            }

            var entity = new
            {
                ItemID = repositoryItem.ItemID,
                RepositoryID = repositoryItem.RepositoryID,
                DependencyID = repositoryItem.DependencyID,
                FileName = repositoryItem.FileName,
                SortingNo = repositoryItem.SortingNo,
                AbsolutePath = repositoryItem.AbsolutePath,
                RelativePath = repositoryItem.RelativePath,
                Extension = repositoryItem.Extension,
                Size = repositoryItem.Size,
                MimeType = repositoryItem.MimeType,
                CustomPath1 = repositoryItem.CustomPath1,
                CustomPath2 = repositoryItem.CustomPath2,
                CustomPath3 = repositoryItem.CustomPath3,
                PolicyPath = repositoryItem.PolicyPath,
                MD5 = repositoryItem.MD5
            };

            Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
            Response.Headers.Append("FileModelType", "FileItemResult");
            Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(entity))));
            Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
            Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
            return Content(JsonConvert.SerializeObject(result), "application/json");
        }

        // http://localhost:8421/repository/api/storage/upload-files
        [HttpPost("[action]")]
        public async Task<ActionResult> UploadFiles([FromForm] List<IFormFile> files)
        {
            var result = new MultiFileUploadResult();
            result.Result = false;
            var elementID = Request.Query["ElementID"].ToString();
            var applicationID = Request.Query["ApplicationID"].ToString();
            var repositoryID = Request.Query["RepositoryID"].ToString();
            var dependencyID = Request.Query["DependencyID"].ToString();
            var businessID = string.IsNullOrEmpty(Request.Query["BusinessID"]) == true ? "0" : Request.Query["BusinessID"].ToString();

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(dependencyID) == true)
            {
                result.Message = "UploadFiles RepositoryID 또는 DependencyID 필수 요청 정보 필요";
                return Content(JsonConvert.SerializeObject(result), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                result.Message = "UploadFiles RepositoryID 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(result), "application/json");
            }

            var saveFileName = string.IsNullOrEmpty(Request.Query["FileName"]) == true ? "" : Request.Query["FileName"].ToString();
            var comment = Request.Query["Comment"].ToString();
            var customPath1 = Request.Query["CustomPath1"].ToString();
            var customPath2 = Request.Query["CustomPath2"].ToString();
            var customPath3 = Request.Query["CustomPath3"].ToString();
            var responseType = string.IsNullOrEmpty(Request.Query["responseType"]) == true ? "callback" : Request.Query["responseType"].ToString();
            var userID = string.IsNullOrEmpty(Request.Query["UserID"]) == true ? "" : Request.Query["UserID"].ToString();
            var callback = string.IsNullOrEmpty(Request.Query["Callback"]) == true ? "" : Request.Query["Callback"].ToString();

            RepositoryItems? repositoryItem = null;

            var stringBuilder = new StringBuilder(512);
            var scriptStart = "<script type='text/javascript'>";
            var scriptEnd = "</script>";

            if (Request.HasFormContentType == true)
            {
                foreach (var file in files)
                {
                    if (file == null || file.Length == 0)
                    {
                        stringBuilder.AppendLine(scriptStart);
                        stringBuilder.AppendLine("alert('업로드 파일을 확인 할 수 없습니다');");
                        stringBuilder.AppendLine("history.go(-1);");
                        stringBuilder.AppendLine(scriptEnd);
                        return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
                    }
                    else
                    {
                        if (repository.UploadSizeLimit < file.Length)
                        {
                            stringBuilder.AppendLine(scriptStart);
                            stringBuilder.AppendLine("alert('" + repository.UploadSizeLimit.ToCurrencyString() + "이상 업로드 할 수 없습니다');");
                            stringBuilder.AppendLine("history.go(-1);");
                            stringBuilder.AppendLine(scriptEnd);
                            return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
                        }
                    }
                }

                var repositoryManager = new RepositoryManager();
                repositoryManager.PersistenceDirectoryPath = repositoryManager.GetPhysicalPath(repository, customPath1, customPath2, customPath3);
                var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, customPath1, customPath2, customPath3);
                var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
                relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";
                var policyPath = repositoryManager.GetPolicyPath(repository);

                var storageProvider = storageProviderFactory.Create(repository, customPath1, customPath2, customPath3);

                if (storageProvider == null)
                {
                    var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                    logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFiles");
                    return BadRequest(errorText);
                }

                if (repository.IsMultiUpload == true)
                {
                    if (repository.IsFileUploadDownloadOnly == true)
                    {
                        result.RemainingCount = repository.UploadCount;
                    }
                    else
                    {
                        List<RepositoryItems>? items = null;
                        if (repository.IsLocalDbFileManaged == true)
                        {
                            items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                            {
                                ApplicationID = applicationID,
                                BusinessID = businessID,
                                RepositoryID = repositoryID,
                                DependencyID = dependencyID
                            });
                        }
                        else
                        {
                            items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                        }

                        if (items != null && items.Count > 0)
                        {
                            if (result.RemainingCount <= 0 || (items.Count + files.Count) > repository.UploadCount)
                            {
                                stringBuilder.AppendLine(scriptStart);
                                stringBuilder.AppendLine("alert('" + $"{repository.UploadCount} 건 이상 파일 업로드 할 수 없습니다');");
                                stringBuilder.AppendLine("history.go(-1);");
                                stringBuilder.AppendLine(scriptEnd);
                                return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
                            }
                        }

                        result.RemainingCount = repository.UploadCount - (items == null ? files.Count : items.Count + files.Count);
                    }
                }
                else
                {
                    if (repository.IsFileUploadDownloadOnly == true)
                    {
                        result.RemainingCount = repository.UploadCount;
                    }
                    else
                    {
                        List<RepositoryItems>? items = null;
                        if (repository.IsLocalDbFileManaged == true)
                        {
                            items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                            {
                                ApplicationID = applicationID,
                                BusinessID = businessID,
                                RepositoryID = repositoryID,
                                DependencyID = dependencyID
                            });
                        }
                        else
                        {
                            items = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                        }

                        if (items != null && items.Count() > 0)
                        {
                            foreach (var item in items)
                            {
                                string deleteFileName;
                                if (repository.IsFileNameEncrypt == true)
                                {
                                    deleteFileName = item.ItemID;
                                }
                                else
                                {
                                    deleteFileName = item.FileName;
                                }

                                switch (repository.StorageType)
                                {
                                    case "AzureBlob":
                                    case "AwsS3":
                                    case "GoogleCloudStorage":
                                        var blobID = relativeDirectoryUrlPath + deleteFileName;
                                        await storageProvider.DeleteAsync(blobID);
                                        break;
                                    case "FileSystem":
                                        repositoryManager.Delete(deleteFileName);
                                        break;
                                    default:
                                        var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                                        logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFile");
                                        return BadRequest(errorText);
                                }

                                if (repository.IsLocalDbFileManaged == true)
                                {
                                    ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.DD01", new
                                    {
                                        ApplicationID = applicationID,
                                        BusinessID = item.BusinessID,
                                        RepositoryID = repositoryID,
                                        ItemID = item.ItemID
                                    });
                                }
                                else
                                {
                                    await moduleApiClient.DeleteRepositoryItem(applicationID, repositoryID, item.ItemID, item.BusinessID);
                                }
                            }
                        }
                    }
                }

                var sortingNo = 1;
                foreach (var file in files)
                {
                    var fileUploadResult = new FileUploadResult();
                    fileUploadResult.Result = false;
                    if (file == null)
                    {
                        result.Message = "업로드 파일 정보 없음";
                    }
                    else
                    {
                        try
                        {
                            var absolutePath = "";
                            var relativePath = "";
                            var fileName = string.IsNullOrEmpty(saveFileName) == true ? file.FileName : saveFileName;
                            var extension = Path.GetExtension(fileName);
                            if (string.IsNullOrEmpty(extension) == true)
                            {
                                extension = Path.GetExtension(file.FileName);
                            }

                            repositoryItem = new RepositoryItems();
                            repositoryItem.ItemID = repository.IsFileNameEncrypt == true ? sequentialIdGenerator.NewId().ToString("N") : fileName;
                            repositoryItem.ApplicationID = applicationID;
                            repositoryItem.BusinessID = businessID;
                            repositoryItem.SortingNo = sortingNo;
                            repositoryItem.Comment = comment;
                            repositoryItem.FileName = fileName;
                            repositoryItem.Extension = extension;
                            repositoryItem.MimeType = GetMimeType(fileName);
                            repositoryItem.Size = file.Length;
                            repositoryItem.RepositoryID = repositoryID;
                            repositoryItem.DependencyID = dependencyID;
                            repositoryItem.CustomPath1 = customPath1;
                            repositoryItem.CustomPath2 = customPath2;
                            repositoryItem.CustomPath3 = customPath3;
                            repositoryItem.PolicyPath = policyPath;
                            repositoryItem.CreatedMemberNo = userID;
                            repositoryItem.CreatedAt = DateTime.Now;

                            switch (repository.StorageType)
                            {
                                case "AzureBlob":
                                case "AwsS3":
                                case "GoogleCloudStorage":
                                    var blobID = relativeDirectoryUrlPath + repositoryItem.ItemID;

                                    if (repository.IsFileNameEncrypt == false && repository.IsFileOverWrite == false)
                                    {
                                        blobID = await storageProvider.GetDuplicateCheckUniqueFileName(blobID);
                                        repositoryItem.ItemID = blobID;
                                        repositoryItem.FileName = blobID;
                                    }

                                    using (var openReadStream = file.OpenReadStream())
                                    {
                                        var (creationTime, lastWriteTime) = await storageProvider.UploadAsync(repositoryItem.ItemID, openReadStream, repositoryItem.MimeType);
                                        repositoryItem.MD5 = GetStreamMD5Hash(openReadStream);
                                        repositoryItem.CreationTime = creationTime;
                                        repositoryItem.LastWriteTime = lastWriteTime;
                                    }

                                    repositoryItem.PhysicalPath = "";

                                    if (repository.IsVirtualPath == true)
                                    {
                                        relativePath = relativeDirectoryUrlPath + repositoryItem.ItemID;
                                        if (string.IsNullOrEmpty(repository.BlobItemUrl) == true)
                                        {
                                            absolutePath = $"//{repository.RepositoryID}.blob.core.windows.net/{repository.BlobContainerID.ToLower()}/";
                                            absolutePath = absolutePath + relativePath;
                                        }
                                        else
                                        {
                                            absolutePath = repository.BlobItemUrl
                                                .Replace("[CONTAINERID]", repository.BlobContainerID.ToLower())
                                                .Replace("[BLOBID]", relativePath);
                                        }
                                    }
                                    else
                                    {
                                        relativePath = $"/http-download-file?repositoryID={repositoryItem.RepositoryID}&itemID={repositoryItem.ItemID}&applicationID={repositoryItem.ApplicationID}";
                                        relativePath = $"{Request.Path.Value?.Replace("/upload-files", "")}{relativePath}";
                                        absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                    }

                                    repositoryItem.RelativePath = relativePath;
                                    repositoryItem.AbsolutePath = absolutePath;
                                    break;
                                case "FileSystem":
                                    var itemPhysicalPath = repositoryManager.GetSavePath(repositoryItem.ItemID);

                                    if (repository.IsFileNameEncrypt == false && repository.IsFileOverWrite == false)
                                    {
                                        itemPhysicalPath = repositoryManager.GetDuplicateCheckUniqueFileName(itemPhysicalPath);
                                        var renewFileInfo = new FileInfo(itemPhysicalPath);
                                        var renewFileName = renewFileInfo.Name;
                                        repositoryItem.ItemID = renewFileName;
                                        repositoryItem.FileName = renewFileName;
                                    }

                                    using (var fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
                                    {
                                        await file.CopyToAsync(fileStream);
                                    }

                                    if (repository.IsKeepFileExtension == true)
                                    {
                                        itemPhysicalPath = itemPhysicalPath + extension;
                                        using var fileStream = new FileStream(itemPhysicalPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                                        await file.CopyToAsync(fileStream);
                                    }

                                    var fileInfo = new FileInfo(itemPhysicalPath);
                                    repositoryItem.PhysicalPath = itemPhysicalPath;
                                    repositoryItem.MD5 = GetFileMD5Hash(itemPhysicalPath);
                                    repositoryItem.CreationTime = fileInfo.CreationTime;
                                    repositoryItem.LastWriteTime = fileInfo.LastWriteTime;

                                    if (repository.IsVirtualPath == true)
                                    {
                                        if (string.IsNullOrEmpty(repository.UserWorkID) == true)
                                        {
                                            relativePath = $"/{ModuleConfiguration.ModuleID}/{repository.ApplicationID}/{repository.RepositoryID}/";
                                            relativePath = relativePath + relativeDirectoryUrlPath + repositoryItem.ItemID;
                                        }
                                        else
                                        {
                                            relativePath = $"/{ModuleConfiguration.ModuleID}/api/storage/virtual-download-file?applicationID={repository.ApplicationID}&repositoryID={repository.RepositoryID}&subDirectory={repositoryItem.CustomPath1}&fileName={repositoryItem.ItemID}";
                                        }

                                        absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                    }
                                    else
                                    {
                                        relativePath = $"/http-download-file?repositoryID={repositoryItem.RepositoryID}&itemID={repositoryItem.ItemID}&applicationID={repositoryItem.ApplicationID}";
                                        relativePath = $"{Request.Path.Value?.Replace("/upload-files", "")}{relativePath}";
                                        absolutePath = ModuleConfiguration.FileServerUrl + relativePath;
                                    }

                                    repositoryItem.RelativePath = relativePath;
                                    repositoryItem.AbsolutePath = absolutePath;
                                    break;
                                default:
                                    var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                                    logger.Warning("[{LogCategory}] " + errorText, "StorageController/UploadFiles");
                                    return BadRequest(errorText);
                            }

                            var isDataUpsert = false;
                            if (repository.IsFileUploadDownloadOnly == true)
                            {
                                isDataUpsert = true;
                            }
                            else
                            {
                                if (repository.IsLocalDbFileManaged == true)
                                {
                                    isDataUpsert = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.MD01", repositoryItem) > 0;
                                }
                                else
                                {
                                    isDataUpsert = await moduleApiClient.UpsertRepositoryItem(repositoryItem);
                                }
                            }

                            if (isDataUpsert == true)
                            {
                                fileUploadResult.ItemID = repositoryItem.ItemID;
                                fileUploadResult.Result = true;
                            }
                            else
                            {
                                fileUploadResult.Message = "UpsertRepositoryItem 데이터 거래 오류";
                                logger.Error("[{LogCategory}] " + $"{result.Message} - {JsonConvert.SerializeObject(repositoryItem)}", "StorageController/UploadFiles");
                            }
                        }
                        catch (Exception exception)
                        {
                            fileUploadResult.Message = exception.Message;
                        }
                    }

                    result.FileUploadResults.Add(fileUploadResult);
                    sortingNo = sortingNo + 1;
                }

                result.Result = true;
            }
            else
            {
                stringBuilder.AppendLine(scriptStart);
                stringBuilder.AppendLine("alert('잘못된 파일 업로드 요청');");
                stringBuilder.AppendLine("history.go(-1);");
                stringBuilder.AppendLine(scriptEnd);
                return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
            }

            if (repository.IsFileUploadDownloadOnly == true)
            {
                if (responseType == "callback")
                {
                    stringBuilder.AppendLine(scriptStart);
                    stringBuilder.AppendLine("var elementID = '" + elementID + "';");
                    stringBuilder.AppendLine("var callback = '" + callback + "';");
                    stringBuilder.AppendLine("var repositoryID = '" + repositoryID + "';");
                    stringBuilder.AppendLine("var repositoryItems = [];");

                    // stringBuilder.AppendLine("parent." + callback + "(repositoryID, repositoryItems);");
                    stringBuilder.AppendLine("parent.postMessage({action: 'upload-files', elementID: elementID, callback: callback, repositoryID: repositoryID, repositoryItems: repositoryItems}, '*');");
                    stringBuilder.AppendLine(scriptEnd);

                    return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
                }
                else if (responseType == "json")
                {
                    Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
                    Response.Headers.Append("FileModelType", "MultiFileItemResult");
                    Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes("[]")));
                    Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
                    Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
                    return Content(JsonConvert.SerializeObject(result), "application/json");
                }
                else
                {
                    return Content("", "text/html", Encoding.UTF8);
                }
            }
            else
            {
                List<RepositoryItems>? repositoryItems = null;
                if (repository.IsLocalDbFileManaged == true)
                {
                    repositoryItems = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                    {
                        ApplicationID = applicationID,
                        BusinessID = businessID,
                        RepositoryID = repositoryID,
                        DependencyID = dependencyID
                    });
                }
                else
                {
                    repositoryItems = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                }

                if (repositoryItems != null && repositoryItems.Count > 0 && string.IsNullOrEmpty(callback) == false)
                {
                    if (responseType == "callback")
                    {
                        stringBuilder.AppendLine(scriptStart);
                        stringBuilder.AppendLine("var elementID = '" + elementID + "';");
                        stringBuilder.AppendLine("var callback = '" + callback + "';");
                        stringBuilder.AppendLine("var repositoryID = '" + repositoryID + "';");
                        stringBuilder.AppendLine("var repositoryItems = [];");

                        for (var i = 0; i < repositoryItems.Count; i++)
                        {
                            var item = repositoryItems[i];
                            var entity = new
                            {
                                ItemID = item.ItemID,
                                RepositoryID = item.RepositoryID,
                                DependencyID = item.DependencyID,
                                FileName = item.FileName,
                                SortingNo = item.SortingNo,
                                AbsolutePath = item.AbsolutePath,
                                RelativePath = item.RelativePath,
                                Extension = item.Extension,
                                Size = item.Size,
                                MimeType = item.MimeType,
                                CustomPath1 = item.CustomPath1,
                                CustomPath2 = item.CustomPath2,
                                CustomPath3 = item.CustomPath3,
                                PolicyPath = item.PolicyPath,
                                MD5 = item.MD5
                            };

                            stringBuilder.AppendLine("repositoryItems.push(" + Extensions.JsonConverter.Serialize(entity) + ");");
                        }

                        // stringBuilder.AppendLine("parent." + callback + "(repositoryID, repositoryItems);");
                        stringBuilder.AppendLine("parent.postMessage({action: 'upload-files', elementID: elementID, callback: callback, repositoryID: repositoryID, repositoryItems: repositoryItems}, '*');");
                        stringBuilder.AppendLine(scriptEnd);

                        return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
                    }
                    else if (responseType == "json")
                    {
                        var entitys = new List<dynamic>();
                        for (var i = 0; i < repositoryItems.Count; i++)
                        {
                            var item = repositoryItems[i];
                            var entity = new
                            {
                                ItemID = item.ItemID,
                                RepositoryID = item.RepositoryID,
                                DependencyID = item.DependencyID,
                                FileName = item.FileName,
                                SortingNo = item.SortingNo,
                                AbsolutePath = item.AbsolutePath,
                                RelativePath = item.RelativePath,
                                Extension = item.Extension,
                                Size = item.Size,
                                MimeType = item.MimeType,
                                CustomPath1 = item.CustomPath1,
                                CustomPath2 = item.CustomPath2,
                                CustomPath3 = item.CustomPath3,
                                PolicyPath = item.PolicyPath,
                                MD5 = item.MD5
                            };

                            entitys.Add(entity);
                        }

                        Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
                        Response.Headers.Append("FileModelType", "MultiFileItemResult");
                        Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(entitys))));
                        Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
                        Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
                        return Content(JsonConvert.SerializeObject(result), "application/json");
                    }
                    else
                    {
                        return Content("", "text/html", Encoding.UTF8);
                    }
                }
                else
                {
                    stringBuilder.AppendLine(scriptStart);
                    stringBuilder.AppendLine("alert('잘못된 파일 업로드 요청');");
                    stringBuilder.AppendLine("history.go(-1);");
                    stringBuilder.AppendLine(scriptEnd);
                    return Content(stringBuilder.ToString(), "text/html", Encoding.UTF8);
                }
            }
        }

        // http://localhost:8421/repository/api/storage/download-file
        [HttpPost("[action]")]
        public async Task<ActionResult> DownloadFile([FromBody] DownloadRequest downloadRequest)
        {
            ActionResult result = NotFound();

            var downloadResult = new DownloadResult();
            downloadResult.Result = false;

            var applicationID = downloadRequest.ApplicationID;
            var repositoryID = downloadRequest.RepositoryID;
            var itemID = downloadRequest.ItemID;
            var fileMD5 = downloadRequest.FileMD5;
            var tokenID = downloadRequest.TokenID;
            var businessID = downloadRequest.BusinessID;
            var disposition = downloadRequest.Disposition;

            // 보안 검증 처리

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true)
            {
                downloadResult.Message = "DownloadFile RepositoryID 또는 ItemID 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                downloadResult.Message = "DownloadFile RepositoryID 요청 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            switch (repository.StorageType)
            {
                case "AzureBlob":
                case "AwsS3":
                case "GoogleCloudStorage":
                    result = await ExecuteObjectFileDownload(downloadResult, applicationID, repositoryID, itemID, businessID);
                    break;
                case "FileSystem":
                    result = await ExecuteFileDownload(downloadResult, applicationID, repositoryID, itemID, businessID);
                    break;
                default:
                    var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                    logger.Warning("[{LogCategory}] " + errorText, "StorageController/DownloadFile");
                    return BadRequest(errorText);
            }

            if (string.IsNullOrEmpty(disposition) == false)
            {
                Response.Headers["Content-Disposition"] = disposition;
            }

            Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
            Response.Headers.Append("FileModelType", "DownloadResult");
            Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(downloadResult))));
            Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
            Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
            return result;
        }

        // http://localhost:8421/repository/api/storage/http-download-file?repositoryid=2FD91746-D77A-4EE1-880B-14AA604ACE5A&itemID=
        [HttpGet("[action]")]
        public async Task<ActionResult> HttpDownloadFile(string applicationID, string repositoryID, string itemID, string? fileMD5, string? tokenID, string? businessID, string? disposition)
        {
            ActionResult result = NotFound();

            var downloadResult = new DownloadResult();
            downloadResult.Result = false;

            // 보안 검증 처리

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true)
            {
                downloadResult.Message = "HttpDownloadFile RepositoryID 또는 ItemID 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                downloadResult.Message = "HttpDownloadFile RepositoryID 요청 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            if (repository.AccessMethod != "public")
            {
                var isWithOrigin = false;
                var requestRefererUrl = Request.Headers.Referer.ToString();
                if (string.IsNullOrEmpty(requestRefererUrl) == false)
                {
                    var tenantAppRequestPath = $"/{GlobalConfiguration.TenantAppRequestPath}/";
                    if (requestRefererUrl.IndexOf(tenantAppRequestPath) > -1)
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

                        var tenantID = $"{userWorkID}|{applicationID}";
                        if (Directory.Exists(appBasePath) == true)
                        {
                            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true)
                            {
                                var appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var withRefererUris = appSetting.WithReferer;
                                    if (withRefererUris != null)
                                    {
                                        for (var i = 0; i < withRefererUris.Count; i++)
                                        {
                                            var withRefererUri = withRefererUris[i];
                                            if (requestRefererUrl.IndexOf(withRefererUri) > -1)
                                            {
                                                isWithOrigin = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        for (var i = 0; i < GlobalConfiguration.WithOrigins.Count; i++)
                        {
                            var origin = GlobalConfiguration.WithOrigins[i];
                            if (requestRefererUrl.IndexOf(origin) > -1)
                            {
                                isWithOrigin = true;
                                break;
                            }
                        }
                    }
                }

                if (isWithOrigin == false)
                {
                    result = BadRequest();
                    return result;
                }
            }

            switch (repository.StorageType)
            {
                case "AzureBlob":
                case "AwsS3":
                case "GoogleCloudStorage":
                    result = await ExecuteObjectFileDownload(downloadResult, applicationID, repositoryID, itemID, businessID.ToStringSafe());
                    break;
                case "FileSystem":
                    result = await ExecuteFileDownload(downloadResult, applicationID, repositoryID, itemID, businessID.ToStringSafe());
                    break;
                default:
                    var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                    logger.Warning("[{LogCategory}] " + errorText, "StorageController/http-download-file");
                    return BadRequest(errorText);
            }

            if (string.IsNullOrEmpty(disposition) == false)
            {
                Response.Headers["Content-Disposition"] = disposition;
            }

            Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
            Response.Headers.Append("FileModelType", "DownloadResult");
            Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(downloadResult))));
            Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
            Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
            return result;
        }

        // http://localhost:8421/repository/api/storage/virtual-download-file?repositoryID=2FD91746-D77A-4EE1-880B-14AA604ACE5A&fileName=강아지.jpg&subDirectory=2020
        [HttpGet("[action]")]
        public async Task<ActionResult> VirtualDownloadFile(string applicationID, string repositoryID, string fileName, string? subDirectory, string? disposition)
        {
            ActionResult result = NotFound();

            var downloadResult = new DownloadResult();
            downloadResult.Result = false;

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(fileName) == true)
            {
                downloadResult.Message = "VirtualDownloadFile RepositoryID 또는 fileName 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                downloadResult.Message = "VirtualDownloadFile RepositoryID 요청 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            if (repository.AccessMethod != "public")
            {
                var isWithOrigin = false;
                var requestRefererUrl = Request.Headers.Referer.ToString();
                if (string.IsNullOrEmpty(requestRefererUrl) == false)
                {
                    var tenantAppRequestPath = $"/{GlobalConfiguration.TenantAppRequestPath}/";
                    if (requestRefererUrl.IndexOf(tenantAppRequestPath) > -1)
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

                        if (string.IsNullOrEmpty(userWorkID) == false && Directory.Exists(appBasePath) == true)
                        {
                            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true)
                            {
                                var appSettingText = System.IO.File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var withRefererUris = appSetting.WithReferer;
                                    if (withRefererUris != null)
                                    {
                                        for (var i = 0; i < withRefererUris.Count; i++)
                                        {
                                            var withRefererUri = withRefererUris[i];
                                            if (requestRefererUrl.IndexOf(withRefererUri) > -1)
                                            {
                                                isWithOrigin = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        for (var i = 0; i < GlobalConfiguration.WithOrigins.Count; i++)
                        {
                            var origin = GlobalConfiguration.WithOrigins[i];
                            if (requestRefererUrl.IndexOf(origin) > -1)
                            {
                                isWithOrigin = true;
                                break;
                            }
                        }
                    }
                }

                if (isWithOrigin == false)
                {
                    result = BadRequest();
                    return result;
                }
            }

            result = await VirtualFileDownload(downloadResult, applicationID, repositoryID, fileName, subDirectory);

            if (string.IsNullOrEmpty(disposition) == false)
            {
                Response.Headers["Content-Disposition"] = disposition;
            }

            Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
            Response.Headers.Append("FileModelType", "DownloadResult");
            Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(downloadResult))));
            Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
            Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
            return result;
        }

        // http://localhost:8421/repository/api/storage/virtual-delete-file?repositoryid=2FD91746-D77A-4EE1-880B-14AA604ACE5A&filename=강아지.jpg&subdirectory=2020
        [HttpGet("[action]")]
        public async Task<ActionResult> VirtualDeleteFile(string applicationID, string repositoryID, string fileName, string subDirectory)
        {
            ActionResult result = NotFound();

            var deleteResult = new DeleteResult();
            deleteResult.Result = false;

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(fileName) == true)
            {
                deleteResult.Message = "VirtualDeleteFile RepositoryID 또는 fileName 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, deleteResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                deleteResult.Message = "VirtualDeleteFile RepositoryID 요청 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, deleteResult.Message);
                return result;
            }

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(fileName) == true)
            {
                deleteResult.Message = "VirtualDeleteFile RepositoryID 또는 fileName 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, deleteResult.Message);
                return result;
            }

            if (repository.IsVirtualPath == false)
            {
                deleteResult.Message = "Virtual 작업 지원 안함";
                result = StatusCode(StatusCodes.Status400BadRequest, deleteResult.Message);
                return result;
            }

            var repositoryManager = new RepositoryManager();

            switch (repository.StorageType)
            {
                case "AzureBlob":
                case "AwsS3":
                case "GoogleCloudStorage":
                    var storageProvider = storageProviderFactory.Create(repository, "", "", "");
                    if (storageProvider == null)
                    {
                        var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                        logger.Warning("[{LogCategory}] " + errorText, "StorageController/VirtualDeleteFile");
                        result = BadRequest(errorText);
                        return result;
                    }

                    var blobID = (string.IsNullOrEmpty(applicationID) == false ? applicationID + "/" : "") + (string.IsNullOrEmpty(subDirectory) == false ? subDirectory + "/" : "") + fileName;
                    if (await storageProvider.FileExistsAsync(blobID) == true)
                    {
                        await storageProvider.DeleteAsync(blobID);
                        deleteResult.Result = true;
                    }
                    else
                    {
                        result = NotFound();
                        deleteResult.Message = $"파일을 찾을 수 없습니다. FileID - '{blobID}'";
                    }

                    break;
                case "FileSystem":
                    var persistenceDirectoryPath = repository.PhysicalPath;
                    if (string.IsNullOrEmpty(applicationID) == false)
                    {
                        persistenceDirectoryPath = PathExtensions.Combine(repository.PhysicalPath, applicationID);
                    }

                    if (string.IsNullOrEmpty(subDirectory) == true)
                    {
                        repositoryManager.PersistenceDirectoryPath = persistenceDirectoryPath;
                    }
                    else
                    {
                        repositoryManager.PersistenceDirectoryPath = PathExtensions.Combine(persistenceDirectoryPath, subDirectory);
                    }

                    var filePath = PathExtensions.Combine(repositoryManager.PersistenceDirectoryPath, fileName);
                    try
                    {
                        if (System.IO.File.Exists(filePath) == true)
                        {
                            System.IO.File.Delete(filePath);
                            deleteResult.Result = true;
                        }
                        else
                        {
                            result = NotFound();
                            deleteResult.Message = $"파일을 찾을 수 없습니다. fileName - '{fileName}', subDirectory - '{subDirectory}'";
                        }
                    }
                    catch (Exception exception)
                    {
                        result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                        deleteResult.Message = $"파일을 삭제 중 오류가 발생했습니다. fileName - '{fileName}', subDirectory - '{subDirectory}', message - '{exception.Message}'";
                        logger.Error("[{LogCategory}] " + $"{deleteResult.Message} - {exception.ToMessage()}", "StorageController/VirtualFileDownload");
                    }
                    break;
            }

            Response.Headers.Append("Access-Control-Expose-Headers", "FileModelType, FileResult");
            Response.Headers.Append("FileModelType", "DeleteResult");
            Response.Headers.Append("FileResult", Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(deleteResult))));
            Response.Headers.Append("X-Frame-Options", ModuleConfiguration.XFrameOptions);
            Response.Headers.Append("Content-Security-Policy", ModuleConfiguration.ContentSecurityPolicy);
            return result;
        }

        // http://localhost:8421/repository/api/storage/get-repositorys
        [HttpGet("[action]")]
        public string GetRepositorys()
        {
            var result = "";
            try
            {
                if (ModuleConfiguration.FileRepositorys != null)
                {
                    result = JsonConvert.SerializeObject(ModuleConfiguration.FileRepositorys);
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "StorageController/GetRepositorys");
            }

            return result;
        }

        // http://localhost:8421/repository/api/storage/remove-item?repositoryID=AttachFile&itemid=12345678
        [HttpGet("[action]")]
        public async Task<ActionResult> RemoveItem(string applicationID, string repositoryID, string itemID, string businessID)
        {
            var jsonContentResult = new JsonContentResult();
            jsonContentResult.Result = false;

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true)
            {
                jsonContentResult.Message = "RemoveItem RepositoryID 또는 ItemID 필수 요청 정보 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                jsonContentResult.Message = "RemoveItem RepositoryID 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            try
            {
                RepositoryItems? repositoryItem = null;
                if (repository.IsLocalDbFileManaged == true)
                {
                    var items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.GD01", new
                    {
                        ApplicationID = applicationID,
                        BusinessID = businessID,
                        RepositoryID = repositoryID,
                        ItemID = itemID
                    });

                    if (items != null && items.Count > 0)
                    {
                        repositoryItem = items[0];
                    }
                }
                else
                {
                    repositoryItem = await moduleApiClient.GetRepositoryItem(applicationID, repositoryID, itemID, businessID);
                }

                if (repositoryItem != null)
                {
                    var repositoryManager = new RepositoryManager();
                    repositoryManager.PersistenceDirectoryPath = repositoryManager.GetRepositoryItemPath(repository, repositoryItem);
                    var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
                    var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
                    relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";

                    var storageProvider = storageProviderFactory.Create(repository, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
                    if (storageProvider == null)
                    {
                        var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                        logger.Warning("[{LogCategory}] " + errorText, "StorageController/RemoveItem");

                        jsonContentResult.Message = errorText;
                        return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
                    }

                    string deleteFileName;
                    if (repository.IsFileNameEncrypt == true)
                    {
                        deleteFileName = repositoryItem.ItemID;
                    }
                    else
                    {
                        deleteFileName = repositoryItem.FileName;
                    }

                    switch (repository.StorageType)
                    {
                        case "AzureBlob":
                        case "AwsS3":
                        case "GoogleCloudStorage":
                            var blobID = relativeDirectoryUrlPath + deleteFileName;
                            await storageProvider.DeleteAsync(blobID);
                            break;
                        case "FileSystem":
                            repositoryManager.Delete(deleteFileName);
                            break;
                        default:
                            var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                            logger.Warning("[{LogCategory}] " + errorText, "StorageController/RemoveItem");
                            return BadRequest(errorText);
                    }

                    if (repository.IsLocalDbFileManaged == true)
                    {
                        ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.DD01", new
                        {
                            ApplicationID = applicationID,
                            BusinessID = repositoryItem.BusinessID,
                            RepositoryID = repositoryID,
                            ItemID = repositoryItem.ItemID
                        });
                    }
                    else
                    {
                        await moduleApiClient.DeleteRepositoryItem(applicationID, repositoryID, repositoryItem.ItemID, repositoryItem.BusinessID);
                    }

                    jsonContentResult.Result = true;
                }
                else
                {
                    jsonContentResult.Message = $"ItemID: '{itemID}' 파일 요청 정보 확인 필요";
                }
            }
            catch (Exception exception)
            {
                jsonContentResult.Message = exception.Message;
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "StorageController/RemoveItem");
            }

            return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
        }

        // http://localhost:8421/repository/api/storage/remove-items?repositoryID=AttachFile&dependencyID=helloworld
        [HttpGet("[action]")]
        public async Task<ActionResult> RemoveItems(string applicationID, string repositoryID, string dependencyID, string businessID)
        {
            var jsonContentResult = new JsonContentResult();
            jsonContentResult.Result = false;

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(dependencyID) == true)
            {
                jsonContentResult.Message = "RepositoryID 또는 DependencyID 필수 요청 정보 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);

            if (repository == null)
            {
                jsonContentResult.Message = "RepositoryID 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
            }

            try
            {
                List<RepositoryItems>? repositoryItems = null;
                if (repository.IsLocalDbFileManaged == true)
                {
                    repositoryItems = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.LD01", new
                    {
                        ApplicationID = applicationID,
                        BusinessID = businessID,
                        RepositoryID = repositoryID,
                        DependencyID = dependencyID
                    });
                }
                else
                {
                    repositoryItems = await moduleApiClient.GetRepositoryItems(applicationID, repositoryID, dependencyID, businessID);
                }

                if (repositoryItems != null && repositoryItems.Count > 0)
                {
                    var repositoryManager = new RepositoryManager();

                    foreach (var repositoryItem in repositoryItems)
                    {
                        repositoryManager.PersistenceDirectoryPath = repositoryManager.GetRepositoryItemPath(repository, repositoryItem);
                        var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
                        var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
                        relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";


                        var storageProvider = storageProviderFactory.Create(repository, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
                        if (storageProvider == null)
                        {
                            var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                            logger.Warning("[{LogCategory}] " + errorText, "StorageController/RemoveItems");

                            jsonContentResult.Message = errorText;
                            return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
                        }

                        string deleteFileName;
                        if (repository.IsFileNameEncrypt == true)
                        {
                            deleteFileName = repositoryItem.ItemID;
                        }
                        else
                        {
                            deleteFileName = repositoryItem.FileName;
                        }

                        switch (repository.StorageType)
                        {
                            case "AzureBlob":
                            case "AwsS3":
                            case "GoogleCloudStorage":
                                var blobID = relativeDirectoryUrlPath + deleteFileName;
                                await storageProvider.DeleteAsync(blobID);
                                break;
                            case "FileSystem":
                                repositoryManager.Delete(deleteFileName);
                                break;
                            default:
                                var errorText = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                                logger.Warning("[{LogCategory}] " + errorText, "StorageController/RemoveItems");
                                return BadRequest(errorText);
                        }

                        if (repository.IsLocalDbFileManaged == true)
                        {
                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, repository, "STR.SLT010.DD01", new
                            {
                                ApplicationID = applicationID,
                                BusinessID = repositoryItem.BusinessID,
                                RepositoryID = repositoryID,
                                ItemID = repositoryItem.ItemID
                            });
                        }
                        else
                        {
                            await moduleApiClient.DeleteRepositoryItem(applicationID, repositoryID, repositoryItem.ItemID, repositoryItem.BusinessID);
                        }
                    }

                    jsonContentResult.Result = true;
                }
                else
                {
                    jsonContentResult.Message = $"DependencyID: '{dependencyID}' 파일 요청 정보 확인 필요";
                }
            }
            catch (Exception exception)
            {
                jsonContentResult.Message = exception.Message;
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "StorageController/RemoveItems");
            }

            return Content(JsonConvert.SerializeObject(jsonContentResult), "application/json");
        }

        private async Task<ActionResult> VirtualFileDownload(DownloadResult downloadResult, string applicationID, string repositoryID, string fileName, string? subDirectory)
        {
            ActionResult result;

            if (string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(fileName) == true)
            {
                downloadResult.Message = "RepositoryID 또는 fileName 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);

            if (repository == null)
            {
                downloadResult.Message = "RepositoryID 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            if (repository.IsVirtualPath == false)
            {
                downloadResult.Message = "Virtual 다운로드 지원 안함";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repositoryManager = new RepositoryManager();

            if (repository.StorageType == "AzureBlob")
            {
                var container = new BlobContainerClient(repository.BlobConnectionString, repository.BlobContainerID.ToLower());
                await container.CreateIfNotExistsAsync(PublicAccessType.Blob);
                var blobID = (string.IsNullOrEmpty(applicationID) == false ? applicationID + "/" : "") + (string.IsNullOrEmpty(subDirectory) == false ? subDirectory + "/" : "") + fileName;
                var blob = container.GetBlobClient(blobID);
                if (await blob.ExistsAsync() == true)
                {
                    BlobDownloadInfo blobDownloadInfo = await blob.DownloadAsync();
                    result = File(blobDownloadInfo.Content, blobDownloadInfo.ContentType, fileName, true);

                    BlobProperties properties = await blob.GetPropertiesAsync();
                    downloadResult.FileName = fileName;
                    downloadResult.MimeType = properties.ContentType;
                    downloadResult.MD5 = properties.ContentHash.ToBase64String();
                    downloadResult.Length = properties.ContentLength;
                    downloadResult.CreationTime = properties.CreatedOn.LocalDateTime;
                    downloadResult.LastWriteTime = properties.LastModified.LocalDateTime;
                    downloadResult.Result = true;
                }
                else
                {
                    result = NotFound();
                    downloadResult.Message = $"파일을 찾을 수 없습니다. FileID - '{blobID}'";
                }
            }
            else
            {
                var persistenceDirectoryPath = repository.PhysicalPath;
                if (string.IsNullOrEmpty(applicationID) == false)
                {
                    persistenceDirectoryPath = PathExtensions.Combine(repository.PhysicalPath, applicationID);
                }

                if (string.IsNullOrEmpty(subDirectory) == true)
                {
                    repositoryManager.PersistenceDirectoryPath = persistenceDirectoryPath;
                }
                else
                {
                    repositoryManager.PersistenceDirectoryPath = PathExtensions.Combine(persistenceDirectoryPath, subDirectory);
                }

                var filePath = PathExtensions.Combine(repositoryManager.PersistenceDirectoryPath, fileName);
                try
                {
                    if (System.IO.File.Exists(filePath) == true)
                    {
                        var mimeType = GetMimeType(fileName);

                        result = PhysicalFile(filePath, mimeType, fileName, true);

                        var fileInfo = new FileInfo(filePath);
                        downloadResult.FileName = fileName;
                        downloadResult.MimeType = mimeType;
                        downloadResult.MD5 = GetFileMD5Hash(filePath);
                        downloadResult.Length = fileInfo.Length;
                        downloadResult.CreationTime = fileInfo.CreationTime;
                        downloadResult.LastWriteTime = fileInfo.LastWriteTime;
                        downloadResult.Result = true;
                    }
                    else
                    {
                        result = NotFound();
                        downloadResult.Message = $"파일을 찾을 수 없습니다. fileName - '{fileName}', subDirectory - '{subDirectory}'";
                    }
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                    downloadResult.Message = $"파일을 다운로드 중 오류가 발생했습니다. fileName - '{fileName}', subDirectory - '{subDirectory}', message - '{exception.Message}'";
                    logger.Error("[{LogCategory}] " + $"{downloadResult.Message} - {exception.ToMessage()}", "StorageController/VirtualFileDownload");
                }
            }

            return result;
        }

        private async Task<ActionResult> ExecuteObjectFileDownload(DownloadResult downloadResult, string applicationID, string repositoryID, string itemID, string businessID)
        {
            ActionResult result = NotFound();

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true)
            {
                downloadResult.Message = "RepositoryID 또는 itemID 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                downloadResult.Message = "RepositoryID 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            RepositoryItems? repositoryItem = null;
            if (repository.IsLocalDbFileManaged == true)
            {
                var items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.GD01", new
                {
                    ApplicationID = applicationID,
                    BusinessID = businessID,
                    RepositoryID = repositoryID,
                    ItemID = itemID
                });

                if (items != null && items.Count > 0)
                {
                    repositoryItem = items[0];
                }
            }
            else
            {
                repositoryItem = await moduleApiClient.GetRepositoryItem(applicationID, repositoryID, itemID, businessID);
            }

            if (repositoryItem == null)
            {
                downloadResult.Message = "파일 정보 없음";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repositoryManager = new RepositoryManager();
            var relativeDirectoryPath = repositoryManager.GetRelativePath(repository, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
            var relativeDirectoryUrlPath = string.IsNullOrEmpty(relativeDirectoryPath) == true ? "" : relativeDirectoryPath;
            relativeDirectoryUrlPath = relativeDirectoryUrlPath.Length <= 1 ? "" : relativeDirectoryUrlPath.Substring(relativeDirectoryUrlPath.Length - 1) == "/" ? relativeDirectoryUrlPath : relativeDirectoryUrlPath + "/";

            var storageProvider = storageProviderFactory.Create(repository, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
            if (storageProvider == null)
            {
                downloadResult.Message = $"ApplicationID: {repository.ApplicationID}, RepositoryID: {repository.RepositoryID}, StorageType: {repository.StorageType} 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            string fileName;
            if (repository.IsFileNameEncrypt == true)
            {
                fileName = repositoryItem.ItemID;
            }
            else
            {
                fileName = repositoryItem.FileName;
            }

            var blobID = relativeDirectoryUrlPath + fileName;
            if (await storageProvider.FileExistsAsync(blobID) == true)
            {
                var downloadResultData = await storageProvider.DownloadAsync(blobID);
                string downloadFileName;
                if (string.IsNullOrEmpty(Path.GetExtension(repositoryItem.FileName)) == true && string.IsNullOrEmpty(repositoryItem.Extension) == false)
                {
                    downloadFileName = string.Concat(repositoryItem.FileName, repositoryItem.Extension);
                }
                else
                {
                    downloadFileName = repositoryItem.FileName;
                }

                result = File(downloadResultData.Content, repositoryItem.MimeType, downloadFileName, true);

                downloadResult.FileName = downloadFileName;
                downloadResult.MimeType = repositoryItem.MimeType;
                downloadResult.MD5 = repositoryItem.MD5;
                downloadResult.Length = repositoryItem.Size;
                downloadResult.CreationTime = repositoryItem.CreationTime;
                downloadResult.LastWriteTime = repositoryItem.LastWriteTime;
                downloadResult.Result = true;
            }
            else
            {
                result = NotFound();
                downloadResult.Message = $"파일을 찾을 수 없습니다. FileID - '{itemID}'";
            }

            return result;
        }

        private async Task<ActionResult> ExecuteFileDownload(DownloadResult downloadResult, string applicationID, string repositoryID, string itemID, string businessID)
        {
            ActionResult result = NotFound();

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(repositoryID) == true || string.IsNullOrEmpty(itemID) == true)
            {
                downloadResult.Message = "RepositoryID 또는 itemID 필수 요청 정보 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            var repository = moduleApiClient.GetRepository(applicationID, repositoryID);
            if (repository == null)
            {
                downloadResult.Message = "RepositoryID 정보 확인 필요";
                result = StatusCode(StatusCodes.Status400BadRequest, downloadResult.Message);
                return result;
            }

            RepositoryItems? repositoryItem = null;
            if (repository.IsLocalDbFileManaged == true)
            {
                var items = ModuleExtensions.ExecuteMetaSQL<RepositoryItems>(repository, "STR.SLT010.GD01", new
                {
                    ApplicationID = applicationID,
                    BusinessID = businessID,
                    RepositoryID = repositoryID,
                    ItemID = itemID
                });

                if (items != null && items.Count > 0)
                {
                    repositoryItem = items[0];
                }
            }
            else
            {
                repositoryItem = await moduleApiClient.GetRepositoryItem(applicationID, repositoryID, itemID, businessID);
            }

            if (repositoryItem == null)
            {
                downloadResult.Message = "파일 정보 없음";
                return result;
            }

            try
            {
                var filePath = repositoryItem.PhysicalPath;
                if (System.IO.File.Exists(filePath) == true)
                {
                    var mimeType = repositoryItem.MimeType;
                    if (string.IsNullOrEmpty(mimeType) == true)
                    {
                        mimeType = GetMimeType(repositoryItem.FileName);
                    }

                    string downloadFileName;
                    if (string.IsNullOrEmpty(Path.GetExtension(repositoryItem.FileName)) == true && string.IsNullOrEmpty(repositoryItem.Extension) == false)
                    {
                        downloadFileName = string.Concat(repositoryItem.FileName, repositoryItem.Extension);
                    }
                    else
                    {
                        downloadFileName = repositoryItem.FileName;
                    }

                    result = PhysicalFile(filePath, mimeType, downloadFileName, true);

                    var fileInfo = new FileInfo(filePath);
                    downloadResult.FileName = downloadFileName;
                    downloadResult.MimeType = mimeType;
                    downloadResult.MD5 = repositoryItem.MD5;
                    downloadResult.Length = repositoryItem.Size;
                    downloadResult.CreationTime = repositoryItem.CreationTime;
                    downloadResult.LastWriteTime = repositoryItem.LastWriteTime;
                    downloadResult.Result = true;
                }
                else
                {
                    result = NotFound();
                    downloadResult.Message = $"파일을 찾을 수 없습니다. FileID - '{itemID}'";
                }
            }
            catch (Exception exception)
            {
                result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                downloadResult.Message = $"파일을 다운로드 중 오류가 발생했습니다. FileID - '{itemID}', '{exception.Message}'";
                logger.Error("[{LogCategory}] " + $"{downloadResult.Message} - {exception.ToMessage()}", "StorageController/ExecuteFileDownload");
            }

            return result;
        }

        // http://localhost:8421/repository/api/storage/get-mime-type?path=test.json
        [HttpGet("[action]")]
        public string GetMimeType(string path)
        {
            var result = MimeHelper.GetMimeType(Path.GetFileName(path));
            if (string.IsNullOrEmpty(result) == true)
            {
                result = "application/octet-stream";
            }

            return result;
        }

        private string GetFileMD5Hash(string filePath)
        {
            using var md5 = MD5.Create();
            using var stream = System.IO.File.OpenRead(filePath);
            return BitConverter.ToString(md5.ComputeHash(stream)).Replace("-", string.Empty);
        }

        private string GetStreamMD5Hash(Stream fileStream)
        {
            using var md5 = MD5.Create();
            return BitConverter.ToString(md5.ComputeHash(fileStream)).Replace("-", string.Empty);
        }

        // http://localhost:8421/repository/api/storage/get-md5-hash?value=s
        [HttpGet("[action]")]
        public string GetMD5Hash(string value)
        {
            using var md5 = MD5.Create();
            return BitConverter.ToString(md5.ComputeHash(Encoding.UTF8.GetBytes(value))).Replace("-", string.Empty);
        }
    }
}
