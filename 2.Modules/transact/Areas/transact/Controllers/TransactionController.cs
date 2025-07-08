using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using ChoETL;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

using transact.Entity;
using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class TransactionController : BaseController
    {
        private TransactLoggerClient loggerClient { get; }

        private TransactClient transactClient { get; }

        private readonly IMemoryCache memoryCache;

        private readonly IDistributedCache distributedCache;

        private Serilog.ILogger logger { get; }

        private int transactionRouteCount = 0;

        public TransactionController(IDistributedCache distributedCache, IMemoryCache memoryCache, Serilog.ILogger logger, TransactLoggerClient loggerClient, TransactClient transactClient)
        {
            this.distributedCache = distributedCache;
            this.memoryCache = memoryCache;
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.transactClient = transactClient;
        }

        // http://localhost:8421/transact/api/transaction/test
        [HttpGet("[action]")]
        public ActionResult Test()
        {
            ActionResult result = Ok();
            return result;
        }

        // http://localhost:8421/transact/api/transaction/has?projectID=HDS&businessID=SYS&transactionID=SYS010
        [HttpGet("[action]")]
        public ActionResult Has(string applicationID, string projectID, string transactionID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var value = TransactionMapper.HasCount(applicationID, projectID, transactionID);
                    result = Content(JsonConvert.SerializeObject(value), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "Transaction/Has");
                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/transaction/refresh?changeType=Created&filePath=HDS/ZZW/TST010.json
        [HttpGet("[action]")]
        public ActionResult Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ActionResult result = NotFound();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                var actionResult = false;

                try
                {
                    if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
                    {
                        filePath = filePath.Substring(1);
                    }

                    logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {changeType}, FilePath: {filePath}", "Transaction/Refresh");

                    var fileInfo = new FileInfo(filePath);

                    var businessContracts = TransactionMapper.BusinessMappings;
                    lock (businessContracts)
                    {
                        var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), changeType);
                        switch (watcherChangeTypes)
                        {
                            case WatcherChangeTypes.Created:
                            case WatcherChangeTypes.Changed:
                                if (string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
                                {
                                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                                    var itemPath = PathExtensions.Join(appBasePath, filePath);
                                    var directoryInfo = new DirectoryInfo(appBasePath);
                                    if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true)
                                    {
                                        var businessContract = BusinessContract.FromJson(System.IO.File.ReadAllText(itemPath));
                                        if (businessContract != null)
                                        {
                                            if (businessContracts.ContainsKey(itemPath) == true)
                                            {
                                                businessContracts.Remove(itemPath);
                                            }

                                            businessContract.TransactionProjectID = string.IsNullOrEmpty(businessContract.TransactionProjectID) == true ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                            fileInfo = new FileInfo(itemPath);
                                            businessContract.ApplicationID = string.IsNullOrEmpty(businessContract.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                            businessContract.ProjectID = string.IsNullOrEmpty(businessContract.ProjectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                            businessContract.TransactionID = string.IsNullOrEmpty(businessContract.TransactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                            businessContract.TransactionProjectID = string.IsNullOrEmpty(businessContract.TransactionProjectID) == true ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                            businessContracts.Add(itemPath, businessContract);

                                            logger.Information("[{LogCategory}] " + $"Add TenantApp Contract FilePath: {itemPath}", "Transaction/Refresh");
                                            actionResult = true;
                                        }
                                    }
                                }
                                else
                                {
                                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                                    {
                                        var itemPath = PathExtensions.Join(basePath, filePath);
                                        if (System.IO.File.Exists(itemPath) == true)
                                        {
                                            var businessContract = BusinessContract.FromJson(System.IO.File.ReadAllText(itemPath));
                                            if (businessContract != null)
                                            {
                                                if (businessContracts.ContainsKey(itemPath) == true)
                                                {
                                                    businessContracts.Remove(itemPath);
                                                }

                                                fileInfo = new FileInfo(itemPath);
                                                businessContract.ApplicationID = string.IsNullOrEmpty(businessContract.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                                businessContract.ProjectID = string.IsNullOrEmpty(businessContract.ProjectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                                businessContract.TransactionID = string.IsNullOrEmpty(businessContract.TransactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                                businessContract.TransactionProjectID = string.IsNullOrEmpty(businessContract.TransactionProjectID) == true ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                                businessContracts.Add(itemPath, businessContract, TimeSpan.FromDays(36500));

                                                logger.Information("[{LogCategory}] " + $"Add Contract FilePath: {itemPath}", "Transaction/Refresh");
                                                actionResult = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                break;
                            case WatcherChangeTypes.Deleted:
                                if (string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
                                {
                                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                                    var directoryInfo = new DirectoryInfo(appBasePath);
                                    if (directoryInfo.Exists == true)
                                    {
                                        var itemPath = PathExtensions.Join(appBasePath, filePath);
                                        if (fileInfo.Name != "publicTransactions.json")
                                        {
                                            logger.Information("[{LogCategory}] " + $"Delete TenantApp Contract FilePath: {itemPath}", "Transaction/Refresh");
                                            actionResult = TransactionMapper.Remove(itemPath);
                                        }
                                    }
                                }
                                else if (fileInfo.Name != "publicTransactions.json")
                                {
                                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                                    {
                                        var itemPath = PathExtensions.Join(basePath, filePath);
                                        if (System.IO.File.Exists(itemPath) == true)
                                        {
                                            logger.Information("[{LogCategory}] " + $"Delete Contract FilePath: {itemPath}", "Transaction/Refresh");

                                            actionResult = TransactionMapper.Remove(itemPath);
                                            break;
                                        }
                                    }
                                }
                                break;
                        }
                    }

                    result = Content(JsonConvert.SerializeObject(actionResult), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Transaction/Refresh");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/transaction/cache-clear?cacheKey=
        [HttpGet("[action]")]
        public ActionResult CacheClear(string cacheKey)
        {
            ActionResult result = BadRequest();
            try
            {
                if (string.IsNullOrEmpty(cacheKey) == true)
                {
                    var items = GetMemoryCacheKeys();
                    foreach (var item in items)
                    {
                        memoryCache.Remove(item);
                    }
                }
                else if (memoryCache.Get(cacheKey) != null)
                {
                    memoryCache.Remove(cacheKey);
                }
                else
                {
                    result = Ok();
                }
            }
            catch (Exception exception)
            {
                var exceptionText = exception.ToMessage();
                logger.Warning("[{LogCategory}] " + exceptionText, "Transaction/CacheClear");
                result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
            }

            return result;
        }

        // http://localhost:8421/transact/api/transaction/cache-keys
        [HttpGet("[action]")]
        public ActionResult CacheKeys()
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var items = GetMemoryCacheKeys();
                    result = Content(JsonConvert.SerializeObject(items), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "Transaction/CacheKeys");
                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        private List<string> GetMemoryCacheKeys()
        {
            var result = new List<string>();
            foreach (var cacheKey in ModuleConfiguration.CacheKeys)
            {
                if (cacheKey.StartsWith($"{ModuleConfiguration.ModuleID}|") == true)
                {
                    result.Add(cacheKey);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010"}
        // http://localhost:8421/transact/api/transaction/get?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
        [HttpGet("[action]")]
        public ActionResult Get(string base64Json)
        {
            var definition = new
            {
                ApplicationID = "",
                ProjectID = "",
                TransactionID = ""
            };

            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var json = base64Json.DecodeBase64();
                    var model = JsonConvert.DeserializeAnonymousType(json, definition);
                    if (model != null)
                    {
                        var businessContract = TransactionMapper.BusinessMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID &&
                            p.ProjectID == model.ProjectID &&
                            p.TransactionID == model.TransactionID).FirstOrDefault();

                        if (businessContract != null)
                        {
                            result = Content(JsonConvert.SerializeObject(businessContract), "application/json");
                        }
                    }
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Warning("[{LogCategory}] " + exceptionText, "Transaction/Get");
                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/transaction/retrieve?
        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID)
        {
            var model = new
            {
                ApplicationID = applicationID,
                ProjectID = projectID,
                TransactionID = transactionID
            };

            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var queryResults = TransactionMapper.BusinessMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID);

                    if (string.IsNullOrEmpty(model.ProjectID) == false)
                    {
                        queryResults = queryResults.Where(p =>
                            p.ProjectID == model.ProjectID);
                    }

                    if (string.IsNullOrEmpty(model.TransactionID) == false)
                    {
                        queryResults = queryResults.Where(p =>
                            p.TransactionID == model.TransactionID);
                    }

                    var businessContracts = queryResults.ToList();
                    result = Content(JsonConvert.SerializeObject(businessContracts), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Transaction/Retrieve");
                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/transaction/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var businessResults = TransactionMapper.BusinessMappings.Select(p => p.Key);
                    var businessMaps = businessResults.ToList();
                    if (businessMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(businessMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Transaction/Meta");
                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/transaction/execute
        [HttpPost("[action]")]
        public async Task<ActionResult> Execute(TransactionRequest request)
        {
            // 주요 구간 거래 명령 입력 횟수 및 명령 시간 기록
            var response = new TransactionResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }

            transactionRouteCount = request.System.Routes.Count > 0 ? request.System.Routes.Count - 1 : 0;
            var transactionWorkID = "mainapp";
            try
            {
                var baseUrl = HttpContext.Request.GetBaseUrl();
                var refererPath = HttpContext.Request.Headers.Referer.ToString();
                var tenantAppRequestPath = $"{baseUrl}/{GlobalConfiguration.TenantAppRequestPath}/";
                var transactionUserWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
                var transactionApplicationID = request.LoadOptions?.Get<string>("app-id").ToStringSafe();
                request.System.ProgramID = string.IsNullOrEmpty(transactionApplicationID) == false ? transactionApplicationID : request.System.ProgramID;

                if (string.IsNullOrEmpty(transactionUserWorkID) == false)
                {
                    transactionWorkID = transactionUserWorkID;
                }

                transactClient.DefaultResponseHeaderConfiguration(request, response, transactionRouteCount);

                if (ModuleConfiguration.IsValidationRequest == true)
                {
                    if (request.System.Routes.Count == 0 || distributedCache.Get(request.Transaction.GlobalID) == null)
                    {
                        response.ExceptionText = "잘못된 요청";
                        return Content(JsonConvert.SerializeObject(response), "application/json");
                    }
                    else
                    {
                        distributedCache.Remove(request.Transaction.GlobalID);
                    }

                    var jsMilliseconds = request.System.Routes[transactionRouteCount].RequestTick;
                    var dateTimeOffset = DateTimeOffset.FromUnixTimeMilliseconds(jsMilliseconds);
                    var interval = DateTimeOffset.UtcNow - dateTimeOffset;
                    if (interval.TotalSeconds > 180)
                    {
                        response.ExceptionText = "요청 만료";
                        return Content(JsonConvert.SerializeObject(response), "application/json");
                    }

                    var findGlobalID = ModuleConfiguration.RequestGlobalIDList.FirstOrDefault(p => p == request.Transaction.GlobalID);
                    if (string.IsNullOrEmpty(findGlobalID) == false)
                    {
                        response.ExceptionText = "중복 요청";
                        return Content(JsonConvert.SerializeObject(response), "application/json");
                    }

                    ModuleConfiguration.RequestGlobalIDList.Add(request.Transaction.GlobalID);
                }

                var isAllowRequestTransactions = false;
                if (ModuleConfiguration.AllowRequestTransactions.ContainsKey("*") == true)
                {
                    isAllowRequestTransactions = true;
                }
                else if (ModuleConfiguration.AllowRequestTransactions.ContainsKey(request.System.ProgramID) == true)
                {
                    var allowProjects = ModuleConfiguration.AllowRequestTransactions[request.System.ProgramID];
                    if (allowProjects != null && (allowProjects.Contains("*") == true || allowProjects.Contains(request.Transaction.BusinessID) == true))
                    {
                        isAllowRequestTransactions = true;
                    }
                }
                else if (refererPath.StartsWith(tenantAppRequestPath) && string.IsNullOrEmpty(transactionUserWorkID) == false && string.IsNullOrEmpty(transactionApplicationID) == false)
                {
                    isAllowRequestTransactions = true;
                }

                if (isAllowRequestTransactions == false)
                {
                    response.ExceptionText = $"애플리케이션 ID: '{request.System.ProgramID}', 프로젝트 ID: {request.Transaction.BusinessID} 요청 가능 거래 매핑 정보 확인 필요";
                    return Content(JsonConvert.SerializeObject(response), "application/json");
                }

                response.System.PathName = Request.Path;

                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.TransactionRequestLogging(request, transactionWorkID, "Y", (string error) =>
                    {
                        logger.Information("[{LogCategory}] [{GlobalID}] " + $"fallback error: {error}, Request JSON: {JsonConvert.SerializeObject(request)}", "Transaction/Execute", response.Transaction.GlobalID);
                    });
                }

                #region 입력 확인

                if (string.IsNullOrEmpty(request.Action) == true ||
                    string.IsNullOrEmpty(request.Kind) == true ||
                    request.System == null ||
                    request.Transaction == null ||
                    request.PayLoad == null ||
                    request.Interface == null)
                {
                    response.ExceptionText = "잘못된 입력 전문";
                    return LoggingAndReturn(response, transactionWorkID, "Y", null);
                }

                #endregion

                #region 입력 기본값 구성

                if (string.IsNullOrEmpty(request.Transaction.DataFormat) == true)
                {
                    request.Transaction.DataFormat = "J";
                }

                #endregion

                #region 기본 응답 정보 구성

                response.Message = new MessageType();
                if (request.Transaction.DataFormat == "T")
                {
                    if (request.PayLoad.DataMapSet == null)
                    {
                        request.PayLoad.DataMapSet = new List<List<DataMapItem>>();
                    }

                    request.PayLoad.DataMapSet.Clear();

                    foreach (var dataMapSetRaw in request.PayLoad.DataMapSetRaw)
                    {
                        var decryptInputData = transactClient.DecryptInputData(dataMapSetRaw, request.Transaction.CompressionYN);
                        var reqJArray = transactClient.ToJson(decryptInputData);
                        var reqInputs = JsonConvert.DeserializeObject<List<DataMapItem>>(reqJArray.ToString());
                        if (reqInputs != null)
                        {
                            foreach (var reqInput in reqInputs)
                            {
                                if (string.IsNullOrEmpty(reqInput.FieldID) == true)
                                {
                                    reqInput.FieldID = "DEFAULT";
                                    reqInput.Value = "";
                                }
                            }
                            request.PayLoad.DataMapSet.Add(reqInputs);
                        }
                    }
                }
                else if (request.Transaction.DataFormat == "J")
                {
                    if (request.Transaction.CompressionYN.ParseBool() == true)
                    {
                        if (request.PayLoad.DataMapSet == null)
                        {
                            request.PayLoad.DataMapSet = new List<List<DataMapItem>>();
                        }

                        request.PayLoad.DataMapSet.Clear();

                        foreach (var dataMapSetRaw in request.PayLoad.DataMapSetRaw)
                        {
                            var decryptInputData = transactClient.DecryptInputData(dataMapSetRaw, request.Transaction.CompressionYN);
                            if (decryptInputData == null)
                            {
                                request.PayLoad.DataMapSet.Add(new List<DataMapItem>());
                            }
                            else
                            {
                                var reqInput = JsonConvert.DeserializeObject<List<DataMapItem>>(decryptInputData);
                                if (reqInput == null)
                                {
                                    request.PayLoad.DataMapSet.Add(new List<DataMapItem>());
                                }
                                else
                                {
                                    request.PayLoad.DataMapSet.Add(reqInput);
                                }
                            }
                        }
                    }
                }
                else
                {
                    response.ExceptionText = $"데이터 포맷 '{request.Transaction.DataFormat}' 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "Y", null);
                }

                var cacheKey = string.Empty;
                if (ModuleConfiguration.IsCodeDataCache == true && request.LoadOptions?.Get<string>("codeCacheYN").ToStringSafe().ParseBool() == true)
                {
                    if (request.PayLoad != null && request.PayLoad.DataMapSet != null && request.PayLoad.DataMapSet.Count > 0)
                    {
                        var inputs = request.PayLoad.DataMapSet[0];
                        var cacheKeys = new List<string>();
                        for (var i = 0; i < inputs.Count; i++)
                        {
                            var input = inputs[i];
                            cacheKeys.Add(input.FieldID + ":" + (input.Value == null ? "null" : input.Value.ToString()));
                        }

                        cacheKey = $"{ModuleConfiguration.ModuleID}|{cacheKeys.ToJoin(";")}";

                        TransactionResponse? transactionResponse = null;
                        if (memoryCache.TryGetValue(cacheKey, out transactionResponse) == true)
                        {
                            if (transactionResponse == null)
                            {
                                transactionResponse = new TransactionResponse();
                            }

                            transactionResponse.ResponseID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, DateTime.Now.ToString("yyyyMMddHHmmss"));
                            transactClient.DefaultResponseHeaderConfiguration(request, transactionResponse, transactionRouteCount);
                            transactionResponse.System.PathName = Request.Path;
                            return LoggingAndReturn(transactionResponse, transactionWorkID, "Y", null);
                        }
                    }
                    else
                    {
                        response.ExceptionText = $"ProgramID: '{request.System.ProgramID}', BusinessID: '{request.Transaction.BusinessID}', TransactionID: '{request.Transaction.TransactionID}' 코드 데이터 거래 입력 전문 확인 필요";
                        return LoggingAndReturn(response, transactionWorkID, "Y", null);
                    }
                }

                #endregion

                #region 입력 정보 검증

                if (string.IsNullOrEmpty(request.Environment) == false)
                {
                    if (ModuleConfiguration.AvailableEnvironment.Count == 0 || ModuleConfiguration.AvailableEnvironment.Contains(request.Environment) == false)
                    {
                        response.ExceptionText = $"'{request.Environment}' 환경정보 구분코드 허용 안됨";
                        return LoggingAndReturn(response, transactionWorkID, "Y", null);
                    }
                }
                else
                {
                    response.ExceptionText = $"입력 전문 '{request.Environment}' 환경정보 구분코드 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "Y", null);
                }

                #endregion

                #region 입력 정보 복호화

                // F:Full, H:Header, B:Body 구간복호화 처리
                var encryptionType = request.LoadOptions?.Get<string>("encryptionType");
                var encryptionKey = request.LoadOptions?.Get<string>("encryptionKey");

                if (string.IsNullOrEmpty(encryptionType) == false && string.IsNullOrEmpty(encryptionKey) == false)
                {
                    if (encryptionType == "F")
                    {

                    }
                    else if (encryptionType == "H")
                    {

                    }
                    else if (encryptionType == "B")
                    {

                    }
                }

                #endregion

                #region 거래 Transaction 입력 전문 확인

                var dynamicContract = ModuleConfiguration.IsAllowDynamicRequest == true ? request.LoadOptions?.Get<string>("dynamic").ToStringSafe().ParseBool() : false;
                var businessContract = TransactionMapper.GetBusinessContract(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                if (businessContract == null && dynamicContract == true)
                {
                    var publicTransaction = TransactionMapper.GetPublicTransaction(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                    if (publicTransaction != null)
                    {
                        businessContract = new BusinessContract();
                        businessContract.TransactionApplicationID = request.System.ProgramID;
                        businessContract.ApplicationID = request.System.ProgramID;
                        businessContract.ProjectID = request.Transaction.BusinessID;
                        businessContract.TransactionProjectID = request.Transaction.BusinessID;
                        businessContract.TransactionID = request.Transaction.TransactionID;
                        businessContract.Services = new List<TransactionInfo>();
                        businessContract.Models = new List<Model>();

                        TransactionMapper.Upsert($"DYNAMIC|{request.System.ProgramID}|{request.Transaction.BusinessID}|{request.Transaction.TransactionID}", businessContract);
                    }
                }

                if (businessContract == null)
                {
                    response.ExceptionText = $"ProgramID '{request.System.ProgramID}', BusinessID '{request.Transaction.BusinessID}', TransactionID '{request.Transaction.TransactionID}' 거래 Transaction 입력 전문 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "Y", null);
                }
                else
                {
                    if (string.IsNullOrEmpty(businessContract.TransactionApplicationID) == true)
                    {
                        businessContract.TransactionApplicationID = request.System.ProgramID;
                    }
                }

                #endregion

                #region 거래 매핑 정보 확인

                TransactionInfo? transactionInfo = null;

                var services = from item in businessContract.Services
                               where item.ServiceID == request.Transaction.FunctionID
                               select item;

                if (services != null && services.Count() == 1)
                {
                    transactionInfo = services.ToList().FirstOrDefault<TransactionInfo>().DeepCopy();
                }
                else if (services != null && services.Count() > 1)
                {
                    response.ExceptionText = $"FunctionID '{request.Transaction.FunctionID}' 거래 매핑 중복 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                }

                if (transactionInfo == null && dynamicContract == true)
                {
                    var dynamicAuthorize = request.LoadOptions == null ? false : request.LoadOptions.Get<string>("authorize").ToStringSafe().ParseBool();
                    var dynamicCommandType = request.LoadOptions == null ? "" : request.LoadOptions.Get<string>("commandType").ToStringSafe();
                    var dynamicReturnType = request.LoadOptions == null ? "" : request.LoadOptions.Get<string>("returnType").ToStringSafe();
                    var dynamicTransactionScope = request.LoadOptions == null ? false : request.LoadOptions.Get<string>("transactionScope").ToStringSafe().ParseBool();
                    var dynamicTransactionLog = request.LoadOptions == null ? false : request.LoadOptions.Get<string>("transactionLog").ToStringSafe().ParseBool();

                    transactionInfo = new TransactionInfo();
                    transactionInfo.ServiceID = request.Transaction.FunctionID;
                    transactionInfo.Authorize = dynamicAuthorize;
                    transactionInfo.CommandType = dynamicCommandType;
                    transactionInfo.TransactionScope = dynamicTransactionScope;
                    transactionInfo.SequentialOptions = new List<SequentialOption>();
                    transactionInfo.ReturnType = string.IsNullOrEmpty(dynamicReturnType) == true ? "Json" : dynamicReturnType;
                    transactionInfo.AccessScreenID = new List<string>() { request.Transaction.TransactionID };
                    transactionInfo.TransactionLog = dynamicTransactionLog;
                    transactionInfo.Inputs = new List<ModelInputContract>();
                    transactionInfo.Outputs = new List<ModelOutputContract>();
                }

                if (transactionInfo == null)
                {
                    response.ExceptionText = $"FunctionID '{request.Transaction.FunctionID}' 거래 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                }

                var isAccessScreenID = false;
                if (transactionInfo.AccessScreenID == null)
                {
                    if (businessContract.TransactionID == request.Transaction.ScreenID)
                    {
                        isAccessScreenID = true;
                    }
                }
                else
                {
                    if (transactionInfo.AccessScreenID.IndexOf(request.Transaction.ScreenID) > -1)
                    {
                        isAccessScreenID = true;
                    }
                    else if (businessContract.TransactionID == request.Transaction.ScreenID)
                    {
                        isAccessScreenID = true;
                    }
                }

                if (isAccessScreenID == false)
                {
                    var publicTransaction = TransactionMapper.GetPublicTransaction(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                    if (publicTransaction != null)
                    {
                        isAccessScreenID = true;
                    }

                    if (isAccessScreenID == false)
                    {
                        response.ExceptionText = $"ScreenID '{request.Transaction.ScreenID}' 요청 가능화면 거래 매핑 정보 확인 필요";
                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                    }
                }

                #endregion

                #region 거래 입력 정보 생성

                var privillegeTypes = new Dictionary<string, string>();
                var requestSystemID = "";
                BearerToken? bearerToken = null;
                var token = request.AccessToken;
                try
                {
                    var isBypassAuthorizeIP = false;
                    if (string.IsNullOrEmpty(ModuleConfiguration.BypassAuthorizeIP.FirstOrDefault(p => p == "*")) == false)
                    {
                        isBypassAuthorizeIP = true;
                    }
                    else
                    {
                        foreach (var ip in ModuleConfiguration.BypassAuthorizeIP)
                        {
                            if (request.Interface.SourceIP.IndexOf(ip) > -1)
                            {
                                isBypassAuthorizeIP = true;
                                break;
                            }
                        }
                    }

                    if (GlobalConfiguration.IsPermissionRoles == true && isBypassAuthorizeIP == false)
                    {
                        var isAuthorized = false;
                        var permissionRoles = GlobalConfiguration.PermissionRoles.Where(x => x.ModuleID == "transact");
                        if (permissionRoles.Any() == true)
                        {
                            var queryID = $"/{request.System.ProgramID}/{request.Transaction.BusinessID}/{request.Transaction.TransactionID}";

                            var publicRoles = permissionRoles.Where(x => x.RoleID == "Public");
                            for (var i = 0; i < publicRoles.Count(); i++)
                            {
                                var publicRole = publicRoles.ElementAt(i);
                                if (publicRole != null)
                                {
                                    var allowTransactionPattern = new Regex($"[\\/]{publicRole.ApplicationID}[\\/]{publicRole.ProjectID}[\\/]{publicRole.TransactionID}");
                                    isAuthorized = allowTransactionPattern.IsMatch(queryID);
                                    if (isAuthorized == true)
                                    {
                                        break;
                                    }
                                }
                            }

                            if (isAuthorized == false)
                            {
                                var member = HttpContext.Request.Cookies[$"{GlobalConfiguration.CookiePrefixName}.Member"];
                                if (string.IsNullOrEmpty(member) == false)
                                {
                                    var user = JsonConvert.DeserializeObject<UserAccount>(member.DecodeBase64());
                                    if (user != null)
                                    {
                                        var userRoles = user.ApplicationRoleID.SplitComma();
                                        if (userRoles.Any() == true)
                                        {
                                            foreach (var permissionRole in permissionRoles.Where(x => x.RoleID != "Public"))
                                            {
                                                var roles = permissionRole.RoleID.SplitComma();
                                                if (roles.Intersect(userRoles).Any() == true)
                                                {
                                                    var allowTransactionPattern = new Regex($"[\\/]{permissionRole.ApplicationID}[\\/]{permissionRole.ProjectID}[\\/]{permissionRole.TransactionID}");
                                                    isAuthorized = allowTransactionPattern.IsMatch(queryID);
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
                            isAuthorized = true;
                        }

                        if (isAuthorized == false)
                        {
                            response.ExceptionText = "인증 자격 증명 확인 필요";
                            return Content(JsonConvert.SerializeObject(response), "application/json");
                        }
                    }

                    if (request.System.Routes.Count > 0)
                    {
                        var route = request.System.Routes[transactionRouteCount];
                        requestSystemID = route.SystemID;
                    }

                    // Referer 실행 경로가 Forbes 앱이고 요청 헤더에 Authorization가 있으면 인증 검증
                    UserAccount? userAccount = null;
                    if (refererPath.StartsWith(tenantAppRequestPath) == true)
                    {
                        var splits = refererPath.Replace(baseUrl, "").Split('/');
                        var userWorkID = splits.Length > 3 ? splits[2] : "";
                        var applicationID = splits.Length > 3 ? splits[3] : "";
                        if (string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                userAccount = HttpContext.Items["JwtAccount"] as UserAccount;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(token) == true && userAccount != null)
                    {
                        if (ModuleConfiguration.SystemID == requestSystemID && isBypassAuthorizeIP == true)
                        {
                        }
                        else if (transactionInfo.Authorize == true)
                        {
                            var isRoleYN = false;
                            if (transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                            {
                                var transactionMinRoleValue = Role.User.GetRoleValue(transactionInfo.Roles, true);
                                foreach (var userRole in userAccount.Roles)
                                {
                                    if (Enum.TryParse<Role>(userRole, out var parsedUserRole) == true)
                                    {
                                        var userRoleValue = (int)parsedUserRole;
                                        if (userRoleValue <= transactionMinRoleValue)
                                        {
                                            isRoleYN = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            var isClaimYN = false;
                            if (transactionInfo.Policys != null && transactionInfo.Policys.Count > 0)
                            {
                                foreach (var claim in userAccount.Claims)
                                {
                                    if (transactionInfo.Policys.ContainsKey(claim.Key) == true)
                                    {
                                        var allowClaims = transactionInfo.Policys[claim.Key];
                                        if (allowClaims == null || allowClaims.IndexOf(claim.Value) > -1)
                                        {
                                            isClaimYN = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (isRoleYN == false && isClaimYN == false)
                            {
                                response.ExceptionText = "앱 사용자 역할 또는 정책 권한 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                    }
                    else if (ModuleConfiguration.SystemID == requestSystemID && isBypassAuthorizeIP == true)
                    {
                        if (string.IsNullOrEmpty(token) == false && token.IndexOf(".") > -1 && string.IsNullOrEmpty(request.Transaction.OperatorID) == false)
                        {
                            var tokenArray = token.Split(".");
                            var userID = tokenArray[0].DecodeBase64();
                            var signature = tokenArray.Length > 2 ? (tokenArray[2] == GlobalConfiguration.HostAccessID.ToSHA256() ? request.Transaction.OperatorID.PaddingRight(32) : "") : request.Transaction.OperatorID.PaddingRight(32);

                            token = tokenArray[1];
                            try
                            {
                                bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(signature));
                            }
                            catch
                            {
                                response.ExceptionText = $"{request.Transaction.OperatorID}: BearerToken 정보가 훼손되거나 확인 할 수 없습니다. 다시 로그인 해야 합니다.";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                    }
                    else
                    {
                        if (ModuleConfiguration.SystemID != requestSystemID)
                        {
                            response.ExceptionText = $"SystemID: {requestSystemID} 확인 필요";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }
                        else if (string.IsNullOrEmpty(token) == true)
                        {
                            var moduleScheme = $"{GlobalConfiguration.CookiePrefixName}.{request.System.ModuleID}.AuthenticationScheme";
                            var isRoleYN = false;
                            if (refererPath.StartsWith(baseUrl) == true)
                            {
                                try
                                {
                                    var schemeProvider = HttpContext.RequestServices.GetRequiredService<IAuthenticationSchemeProvider>();
                                    var scheme = await schemeProvider.GetSchemeAsync(moduleScheme);
                                    if (scheme != null)
                                    {
                                        var authenticateResult = await HttpContext.AuthenticateAsync(moduleScheme);
                                        if (authenticateResult.Succeeded == true)
                                        {
                                            var principal = authenticateResult.Principal;
                                            if (principal?.Identity?.IsAuthenticated == true)
                                            {
                                                var roles = principal.FindFirst("Roles")?.Value;
                                                if (roles != null && transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                                                {
                                                    var transactionMinRoleValue = Role.User.GetRoleValue(transactionInfo.Roles, true);
                                                    foreach (var userRole in roles.SplitComma())
                                                    {
                                                        if (Enum.TryParse<Role>(userRole, out var parsedUserRole) == true)
                                                        {
                                                            var userRoleValue = (int)parsedUserRole;
                                                            if (userRoleValue <= transactionMinRoleValue)
                                                            {
                                                                isRoleYN = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                catch
                                {
                                    isRoleYN = false;
                                }
                            }

                            if (isRoleYN == false && ModuleConfiguration.UseApiAuthorize == true && transactionInfo.Authorize == true)
                            {
                                response.ExceptionText = $"'{businessContract.ApplicationID}' 애플리케이션, '{businessContract.ProjectID}' 프로젝트 또는 {moduleScheme} 역할 권한 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                        else if (refererPath.StartsWith(tenantAppRequestPath) == false && ModuleConfiguration.UseApiAuthorize == true)
                        {
                            if (token.IndexOf(".") == -1)
                            {
                                response.ExceptionText = "BearerToken 기본 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            var tokenArray = token.Split(".");
                            var userID = tokenArray[0].DecodeBase64();

                            if (userID != request.Transaction.OperatorID)
                            {
                                response.ExceptionText = "BearerToken 사용자 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            token = tokenArray[1];
                            var signature = tokenArray.Length > 2 ? (tokenArray[2] == GlobalConfiguration.HostAccessID.ToSHA256() ? request.Transaction.OperatorID.PaddingRight(32) : "") : request.Transaction.OperatorID.PaddingRight(32);

                            try
                            {
                                bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(signature));
                            }
                            catch
                            {
                                response.ExceptionText = $"{request.Transaction.OperatorID}: BearerToken 정보가 훼손되거나 확인 할 수 없습니다. 다시 로그인 해야 합니다.";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            if (bearerToken == null)
                            {
                                response.ExceptionText = "BearerToken 정보 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            if (transactionInfo.Authorize == true)
                            {
                                var isRoleYN = true;
                                if (transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                                {
                                    isRoleYN = false;
                                    var transactionMinRoleValue = Role.User.GetRoleValue(transactionInfo.Roles, true);
                                    foreach (var userRole in bearerToken.Policy.Roles)
                                    {
                                        if (Enum.TryParse<Role>(userRole, out var parsedUserRole) == true)
                                        {
                                            var userRoleValue = (int)parsedUserRole;
                                            if (userRoleValue <= transactionMinRoleValue)
                                            {
                                                isRoleYN = true;
                                                break;
                                            }
                                        }
                                    }
                                }

                                var isClaimYN = true;
                                if (transactionInfo.Policys != null && transactionInfo.Policys.Count > 0)
                                {
                                    isClaimYN = false;
                                    foreach (var claim in bearerToken.Policy.Claims)
                                    {
                                        if (transactionInfo.Policys.ContainsKey(claim.Key) == true)
                                        {
                                            var allowClaims = transactionInfo.Policys[claim.Key];
                                            if (allowClaims == null || allowClaims.IndexOf(claim.Value) > -1)
                                            {
                                                isClaimYN = true;
                                                break;
                                            }
                                        }
                                    }
                                }

                                if (isRoleYN == false && isClaimYN == false)
                                {
                                    response.ExceptionText = "BearerToken 역할 또는 정책 권한 확인 필요";
                                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                }
                            }
                        }
                        else
                        {
                            if (string.IsNullOrEmpty(token) == false)
                            {
                                if (token.IndexOf(".") > -1)
                                {
                                    var tokenArray = token.Split(".");
                                    var userID = tokenArray[0].DecodeBase64();

                                    token = tokenArray[1];
                                    var signature = tokenArray.Length > 2 ? (tokenArray[2] == GlobalConfiguration.HostAccessID.ToSHA256() ? userID.PaddingRight(32) : "") : userID.PaddingRight(32);
                                    try
                                    {
                                        bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(signature));
                                    }
                                    catch
                                    {
                                        response.ExceptionText = $"{userID}: BearerToken 정보가 훼손되거나 확인 할 수 없습니다. 다시 로그인 해야 합니다.";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }
                                }
                            }
                        }
                    }

                    // PrivillegeDatabaseDDL, PrivillegeDatabaseDML, PrivillegeDatabaseDCL, PrivillegePermissionEXE, PrivillegeFeatureRUN
                    var privillegeKeys = new List<string>();
                    var claims = new Dictionary<string, string>();
                    if (userAccount != null)
                    {
                        if (userAccount.Claims.ContainsKey("PrivillegeKeys") == true)
                        {
                            privillegeKeys = userAccount.Claims["PrivillegeKeys"].SplitAndTrim(',');
                            claims = userAccount.Claims;
                        }
                    }
                    else if (bearerToken != null)
                    {
                        if (bearerToken.Policy.Claims.ContainsKey("PrivillegeKeys") == true)
                        {
                            privillegeKeys = bearerToken.Policy.Claims["PrivillegeKeys"].SplitAndTrim(',');
                            claims = bearerToken.Policy.Claims;
                        }
                    }

                    foreach (var privillegeKey in privillegeKeys)
                    {
                        if (claims.ContainsKey(privillegeKey))
                        {
                            privillegeTypes.Add(privillegeKey, claims[privillegeKey]);
                        }
                    }
                }
                catch (Exception exception)
                {
                    response.ExceptionText = $"인증 또는 권한 확인 오류 - {exception.ToMessage()}";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                if (bearerToken != null)
                {
                    var clientIP = HttpContext.GetRemoteIpAddress(bearerToken.ClientIP, ModuleConfiguration.TrustedProxyIP).ToStringSafe();
                    var verifyTokenID = bearerToken.Policy.VerifyTokenID;
                    if (string.IsNullOrEmpty(verifyTokenID) == true)
                    {
                        if (bearerToken.ClientIP != clientIP)
                        {
                            response.ExceptionText = $"거래 액세스 토큰 IP 유효성 오류";
                            return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                        }
                    }
                    else
                    {
                        bearerToken.Policy.VerifyTokenID = "";
                        if (verifyTokenID == JsonConvert.SerializeObject(bearerToken).ToSHA256() && bearerToken.ClientIP == clientIP)
                        {
                            bearerToken.Policy.VerifyTokenID = verifyTokenID;
                        }
                        else
                        {
                            response.ExceptionText = $"거래 액세스 토큰 유효성 오류";
                            return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                        }
                    }

                    if (bearerToken.ExpiredAt != null && bearerToken.ExpiredAt < DateTime.UtcNow)
                    {
                        response.ExceptionText = $"거래 액세스 토큰 유효기간 만료";
                        return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                    }
                }

                var transactionObject = new TransactionObject();
                var applicationResponse = new ApplicationResponse();
                var businessModels = new List<Model>();
                var inputContracts = new List<ModelInputContract>();
                var outputContracts = new List<ModelOutputContract>();
                if (refererPath.StartsWith(tenantAppRequestPath) == false && string.IsNullOrEmpty(transactionUserWorkID) == true && string.IsNullOrEmpty(transactionInfo.RoutingCommandUri) == false)
                {
                    if (transactionInfo.RoutingCommandUri.IndexOf("http") == -1)
                    {
                        response.ExceptionText = $"거래 라우팅 경로 확인 필요";
                        return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                    }

                    var route = new Route();
                    route.SystemID = GlobalConfiguration.SystemID;
                    route.RequestTick = DateTime.UtcNow.GetJavascriptTime();
                    request.System.Routes.Add(route);

                    TransactionResponse? transactionResponse = null;
                    var transactionContent = string.Empty;

                    try
                    {
                        var routeResponse = await transactClient.TransactionRoute(transactionInfo, request);
                        transactionResponse = routeResponse.transactionResponse;
                        transactionContent = routeResponse.content;
                        applicationResponse.Acknowledge = transactionResponse.Message.ResponseStatus == "N" ? AcknowledgeType.Success : AcknowledgeType.Failure;
                        if (applicationResponse.Acknowledge == AcknowledgeType.Failure)
                        {
                            applicationResponse.ExceptionText = $"{transactionResponse.Message.MainCode}:{transactionResponse.Message.MainText}|{JsonConvert.SerializeObject(transactionResponse.Message.Additions)}";
                        }
                        applicationResponse.CorrelationID = transactionResponse.Transaction.GlobalID;
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = $"거래 라우팅 요청 오류: {exception.ToMessage()}";
                        return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                    }

                    try
                    {
                        switch (transactionInfo.ReturnType)
                        {
                            case "DynamicJson":
                            case "CodeHelp":
                            case "SchemeOnly":
                            case "SQLText":
                            case "Json":
                                applicationResponse.ResultJson = JsonConvert.SerializeObject(transactionResponse.Result.DataSet);
                                break;
                            case "Xml":
                            case "Scalar":
                                applicationResponse.ResultObject = transactionContent;
                                break;
                            case "NonQuery":
                                var nonQuery = 0;
                                if (int.TryParse(transactionContent.ToString(), out nonQuery))
                                {
                                    applicationResponse.ResultInteger = nonQuery;
                                }
                                else
                                {
                                    applicationResponse.ResultInteger = 0;
                                }

                                break;
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = $"거래 라우팅 응답 오류: {exception.ToMessage()}";
                        return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                    }
                }
                else
                {
                    // 거래 Inputs/Outpus 정보 확인
                    if (string.IsNullOrEmpty(request.PayLoad.DataMapInterface) == false)
                    {
                        if (transactionInfo.Inputs.Count == 0)
                        {
                            var dti = request.PayLoad.DataMapInterface.Split("|");
                            var inputs = dti[0].Split(",");
                            foreach (var item in inputs)
                            {
                                if (string.IsNullOrEmpty(item) == false)
                                {
                                    transactionInfo.Inputs.Add(new ModelInputContract()
                                    {
                                        ModelID = "Dynamic",
                                        Fields = new List<string>(),
                                        TestValues = new List<TestValue>(),
                                        DefaultValues = new List<DefaultValue>(),
                                        Type = item,
                                        BaseFieldMappings = new List<BaseFieldMapping>(),
                                        ParameterHandling = item == "Row" ? "Rejected" : "ByPassing"
                                    });
                                }
                            }
                        }

                        if (transactionInfo.Outputs.Count == 0)
                        {
                            var dti = request.PayLoad.DataMapInterface.Split("|");
                            var outputs = dti[1].Split(",");
                            foreach (var item in outputs)
                            {
                                if (string.IsNullOrEmpty(item) == false)
                                {
                                    transactionInfo.Outputs.Add(new ModelOutputContract()
                                    {
                                        ModelID = "Dynamic",
                                        Fields = new List<string>(),
                                        Type = item
                                    });
                                }
                            }
                        }
                    }

                    transactionObject.LoadOptions = request.LoadOptions;

                    if (transactionObject.LoadOptions == null)
                    {
                        transactionObject.LoadOptions = new Dictionary<string, string>();
                    }

                    foreach (var item in privillegeTypes)
                    {
                        transactionObject.LoadOptions.Add("$" + item.Key, item.Value);
                    }

                    transactionObject.RequestID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, request.Transaction.ScreenID, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                    transactionObject.GlobalID = request.Transaction.GlobalID;
                    transactionObject.TransactionID = string.Concat(businessContract.TransactionApplicationID
                        , "|"
                        , string.IsNullOrEmpty(businessContract.TransactionProjectID) == true ? businessContract.ProjectID : businessContract.TransactionProjectID
                        , "|"
                        , request.Transaction.TransactionID
                    );
                    transactionObject.ServiceID = request.Transaction.FunctionID;
                    transactionObject.TransactionScope = transactionInfo.TransactionScope;
                    transactionObject.ReturnType = transactionInfo.ReturnType;
                    transactionObject.InputsItemCount = request.PayLoad.DataMapCount;

                    businessModels = businessContract.Models;
                    inputContracts = transactionInfo.Inputs;
                    outputContracts = transactionInfo.Outputs;
                    var requestInputs = request.PayLoad.DataMapSet;

                    // 입력 항목이 계약과 동일한지 확인
                    if (inputContracts.Count > 0 && inputContracts.Count != request.PayLoad.DataMapCount.Count)
                    {
                        response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력 항목이 계약과 동일한지 확인 필요";
                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                    }

                    // 입력 항목ID가 계약에 적합한지 확인
                    var inputOffset = 0;
                    var requestInputItems = new Dictionary<string, List<List<DataMapItem>>>();
                    for (var i = 0; i < inputContracts.Count; i++)
                    {
                        var inputContract = inputContracts[i];
                        var model = businessModels.GetBusinessModel(inputContract.ModelID);

                        if (model == null && inputContract.ModelID != "Unknown" && inputContract.ModelID != "Dynamic")
                        {
                            response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{inputContract.ModelID}' 입력 모델 ID가 계약에 있는지 확인";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }

                        var inputCount = request.PayLoad.DataMapCount[i];
                        if (inputContract.Type == "Row" && inputCount != 1)
                        {
                            response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력 항목이 계약과 동일한지 확인 필요";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }

                        if (inputContract.ParameterHandling == "Rejected" && inputCount == 0)
                        {
                            response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 필요한 입력 항목이 필요";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }

                        if (inputContract.ParameterHandling == "ByPassing" && inputCount == 0)
                        {
                            continue;
                        }

                        List<DataMapItem> requestInput;
                        if (inputContract.ParameterHandling == "DefaultValue" && inputCount == 0)
                        {
                            if (inputContract.DefaultValues == null)
                            {
                                response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 필요한 기본값 입력 항목 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            request.PayLoad.DataMapCount[i] = 1;
                            transactionObject.InputsItemCount[i] = 1;
                            inputCount = 1;
                            requestInput = new List<DataMapItem>();

                            var fieldIndex = 0;
                            foreach (var REQ_FIELD_ID in inputContract.Fields)
                            {
                                var defaultValue = inputContract.DefaultValues[fieldIndex];
                                DatabaseColumn? column = null;

                                if (model == null)
                                {
                                    column = new DatabaseColumn()
                                    {
                                        Name = REQ_FIELD_ID,
                                        Length = -1,
                                        DataType = "String",
                                        Default = "",
                                        Require = false
                                    };
                                }
                                else
                                {
                                    column = model.Columns.FirstOrDefault(p => p.Name == REQ_FIELD_ID);
                                }

                                var tempReqInput = new DataMapItem();
                                tempReqInput.FieldID = REQ_FIELD_ID;

                                transactClient.SetInputDefaultValue(defaultValue, column, tempReqInput);

                                requestInput.Add(tempReqInput);

                                fieldIndex = fieldIndex + 1;
                            }

                            requestInputs.Add(requestInput);
                        }
                        else
                        {
                            requestInput = requestInputs[inputOffset];
                        }

                        if (inputContract.ModelID != "Unknown" && inputContract.ModelID != "Dynamic")
                        {
                            foreach (var item in requestInput)
                            {
                                if (inputContract.Fields.Contains(item.FieldID) == false)
                                {
                                    if (item.FieldID == "Flag")
                                    {
                                    }
                                    else
                                    {
                                        response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{item.FieldID}' 항목 ID가 계약에 있는지 확인";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }
                                }
                            }
                        }

                        requestInputItems.Add(inputContract.ModelID + i.ToString(), requestInputs.Skip(inputOffset).Take(inputCount).ToList());
                        inputOffset = inputOffset + inputCount;
                    }

                    var transactInputs = new List<List<TransactField>>();

                    var index = 0;
                    foreach (var requestInputItem in requestInputItems)
                    {
                        var modelID = requestInputItem.Key;
                        var inputItems = requestInputItem.Value;

                        // 입력 정보 생성
                        var inputContract = inputContracts[index];
                        var model = businessModels.GetBusinessModel(inputContract.ModelID);

                        if (model == null && inputContract.ModelID != "Unknown" && inputContract.ModelID != "Dynamic")
                        {
                            response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{inputContract.ModelID}' 입력 모델 ID가 계약에 있는지 확인";
                            return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                        }

                        for (var i = 0; i < inputItems.Count; i++)
                        {
                            var transactInput = new List<TransactField>();
                            var requestInput = inputItems[i];

                            foreach (var item in requestInput)
                            {
                                DatabaseColumn? column = null;

                                if (model == null)
                                {
                                    column = new DatabaseColumn()
                                    {
                                        Name = item.FieldID,
                                        Length = -1,
                                        DataType = "String",
                                        Default = "",
                                        Require = false
                                    };
                                }
                                else
                                {
                                    column = model.Columns.FirstOrDefault(p => p.Name == item.FieldID);
                                }

                                if (column == null)
                                {
                                    response.ExceptionText = $"'{inputContract.ModelID}' 입력 모델 또는 '{item.FieldID}' 항목 확인 필요";
                                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                }
                                else
                                {
                                    var transactField = new TransactField();
                                    transactField.FieldID = item.FieldID;
                                    transactField.Length = column.Length;
                                    transactField.DataType = column.DataType.ToString();

                                    if (item.Value == null)
                                    {
                                        if (column.Require == true)
                                        {
                                            transactField.Value = column.Default;
                                        }
                                        else
                                        {
                                            transactField.Value = null;
                                        }
                                    }
                                    else
                                    {
                                        if (item.Value.ToString() == "[DbNull]")
                                        {
                                            transactField.Value = null;
                                        }
                                        else
                                        {
                                            transactField.Value = item.Value;
                                            if (transactField.Value.ToString() == "")
                                            {
                                                var dataType = transactField.DataType.ToLower();
                                                if (dataType.Contains("string") == true || dataType.Contains("char") == true)
                                                {
                                                }
                                                else
                                                {
                                                    transactField.Value = null;
                                                }
                                            }
                                        }
                                    }

                                    transactInput.Add(transactField);
                                }
                            }

                            var bearerFields = bearerToken == null ? null : bearerToken.Variable as JObject;
                            if (bearerFields != null)
                            {
                                foreach (var item in bearerFields)
                                {
                                    var REQ_FIELD_ID = "$" + item.Key;

                                    if (transactInput.Where(p => p.FieldID == REQ_FIELD_ID).Count() > 0)
                                    {
                                        transactInput.RemoveAll(p => p.FieldID == REQ_FIELD_ID);
                                    }

                                    var jToken = item.Value;
                                    if (jToken == null)
                                    {
                                        response.ExceptionText = $"{REQ_FIELD_ID} Bearer 필드 확인 필요";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }

                                    var column = new DatabaseColumn()
                                    {
                                        Name = REQ_FIELD_ID,
                                        Length = -1,
                                        DataType = "String",
                                        Default = "",
                                        Require = false
                                    };

                                    var transactField = new TransactField();
                                    transactField.FieldID = REQ_FIELD_ID;
                                    transactField.Length = column.Length;
                                    transactField.DataType = column.DataType.ToString();

                                    object? REQ_FIELD_DAT = null;
                                    if (jToken is JValue)
                                    {
                                        REQ_FIELD_DAT = jToken.ToObject<string>();
                                    }
                                    else if (jToken is JObject)
                                    {
                                        REQ_FIELD_DAT = jToken.ToString();
                                    }
                                    else if (jToken is JArray)
                                    {
                                        REQ_FIELD_DAT = jToken.ToArray();
                                    }

                                    if (REQ_FIELD_DAT == null)
                                    {
                                        if (column.Require == true)
                                        {
                                            transactField.Value = column.Default;
                                        }
                                        else
                                        {
                                            transactField.Value = null;
                                        }
                                    }
                                    else
                                    {
                                        if (REQ_FIELD_DAT.ToString() == "[DbNull]")
                                        {
                                            transactField.Value = null;
                                        }
                                        else
                                        {
                                            transactField.Value = REQ_FIELD_DAT;
                                            if (transactField.Value.ToString() == "")
                                            {
                                                var dataType = transactField.DataType.ToLower();
                                                if (dataType.Contains("string") == true || dataType.Contains("char") == true)
                                                {
                                                }
                                                else
                                                {
                                                    transactField.Value = null;
                                                }
                                            }
                                        }
                                    }

                                    transactInput.Add(transactField);
                                }
                            }

                            transactInputs.Add(transactInput);
                        }

                        index = index + 1;
                    }

                    transactionObject.Inputs = transactInputs;
                }

                #endregion

                #region 명령 구분 확인(Console, DataTransaction, ApiServer, FileServer)

                request.Transaction.CommandType = transactionInfo.CommandType;
                response.Transaction.CommandType = transactionInfo.CommandType;
                if (refererPath.StartsWith(tenantAppRequestPath) == true && string.IsNullOrEmpty(transactionUserWorkID) == false && string.IsNullOrEmpty(transactionApplicationID) == false)
                {
                    if (ModuleConfiguration.AllowTenantTransactionCommands.IndexOf(transactionInfo.CommandType) > -1)
                    {
                        transactionObject.LoadOptions?.Add("$tenantID", $"{transactionUserWorkID}|{transactionApplicationID}");
                    }
                    else
                    {
                        response.ExceptionText = "제한된 거래 요청입니다.";
                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                    }
                }

                if (request.Action == "PSH")
                {
                    _ = Task.Run(async () =>
                    {
                        applicationResponse = await transactClient.ApplicationRequest(request, response, transactionInfo, transactionObject, businessModels, inputContracts, outputContracts, applicationResponse);
                    });
                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                }

                applicationResponse = await transactClient.ApplicationRequest(request, response, transactionInfo, transactionObject, businessModels, inputContracts, outputContracts, applicationResponse);

                if (string.IsNullOrEmpty(applicationResponse.ExceptionText) == false)
                {
                    response.ExceptionText = applicationResponse.ExceptionText;
                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                }

                #endregion

                #region 거래 명령 실행 및 결과 반환

                var responseData = string.Empty;
                var properties = "Transaction/Response ReturnType: " + transactionInfo.ReturnType.ToString();

                switch (transactionInfo.ReturnType)
                {
                    case "Scalar":
                        responseData = applicationResponse.ResultObject.ToStringSafe();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return Content(responseData, "text/html");
                    case "NonQuery":
                        responseData = applicationResponse.ResultInteger.ToString();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return Content(responseData, "text/html");
                    case "Xml":
                        responseData = applicationResponse.ResultObject == null ? "" : applicationResponse.ResultObject.ToStringSafe();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return Content(responseData, "application/xml");
                    case "DynamicJson":
                        responseData = applicationResponse.ResultJson == null ? "" : applicationResponse.ResultJson.ToString();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return Content(responseData, "application/json");
                    case "CodeHelp":
                    case "Json":
                        response.Message.ResponseStatus = "N"; // N: Normal, W: Warning, E: Error
                        response.Message.MainCode = nameof(MessageCode.T200);
                        response.Message.MainText = MessageCode.T200;

                        response.ResponseID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                        response.Acknowledge = AcknowledgeType.Success;
                        var executeDynamicTypeObject = (ExecuteDynamicTypeObject)Enum.Parse(typeof(ExecuteDynamicTypeObject), transactionInfo.ReturnType);
                        response.Result.ResponseType = ((int)executeDynamicTypeObject).ToString();

                        if (response.Transaction.DataFormat == "T")
                        {
                            var resultMeta = applicationResponse.ResultMeta;
                            var i = 0;
                            foreach (var dataMapItem in response.Result.DataSet)
                            {
                                var Value = dataMapItem.Value as JToken;
                                if (Value != null)
                                {
                                    if (Value is JObject)
                                    {
                                        var names = Value.ToObject<JObject>()?.Properties().Select(p => p.Name).ToList();
                                        if (names != null)
                                        {
                                            foreach (var item in names)
                                            {
                                                var data = Value[item]?.ToString();
                                                if (string.IsNullOrEmpty(data) == false)
                                                {
                                                    if (data.StartsWith('"') == true)
                                                    {
                                                        Value[item] = "\"" + data;
                                                    }

                                                    if (data.EndsWith('"') == true)
                                                    {
                                                        Value[item] = data + "\"";
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else if (Value is JArray)
                                    {
                                        var jtokens = Value.ToObject<JArray>()?.ToList();
                                        if (jtokens != null)
                                        {
                                            foreach (var jtoken in jtokens)
                                            {
                                                var names = jtoken.ToObject<JObject>()?.Properties().Select(p => p.Name).ToList();
                                                if (names != null)
                                                {
                                                    foreach (var item in names)
                                                    {
                                                        var data = jtoken[item]?.ToString();
                                                        if (string.IsNullOrEmpty(data) == false)
                                                        {
                                                            if (data.ToString().StartsWith('"') == true)
                                                            {
                                                                jtoken[item] = "\"" + data;
                                                            }

                                                            if (data.ToString().EndsWith('"') == true)
                                                            {
                                                                jtoken[item] = data + "\"";
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    var meta = resultMeta[i];
                                    if (Value.HasValues == true)
                                    {
                                        var jsonReader = new StringReader(Value.ToString());
                                        using var choJSONReader = new ChoJSONReader(jsonReader);
                                        var stringBuilder = new StringBuilder();
                                        using (var choCSVWriter = new ChoCSVWriter(stringBuilder, new ChoCSVRecordConfiguration()
                                        {
                                            Delimiter = "｜",
                                            EOLDelimiter = "↵"
                                        }).WithFirstLineHeader().QuoteAllFields(false))
                                        {
                                            choCSVWriter.Write(choJSONReader);
                                        }

                                        if (request.Transaction.CompressionYN.ParseBool() == true)
                                        {
                                            dataMapItem.Value = LZStringHelper.CompressToBase64(meta + "＾" + stringBuilder.ToString().Replace("\"\"", "\""));
                                        }
                                        else
                                        {
                                            dataMapItem.Value = meta + "＾" + stringBuilder.ToString().Replace("\"\"", "\"");
                                        }
                                    }
                                    else
                                    {
                                        dataMapItem.Value = meta + "＾";
                                    }
                                }

                                i = i + 1;
                            }
                        }
                        else
                        {
                            var resultMeta = applicationResponse.ResultMeta;
                            var i = 0;
                            foreach (var dataMapItem in response.Result.DataSet)
                            {
                                var value = dataMapItem.Value as JToken;
                                if (value != null)
                                {
                                    if (request.Transaction.CompressionYN.ParseBool() == true)
                                    {
                                        dataMapItem.Value = LZStringHelper.CompressToBase64(JsonConvert.SerializeObject(value));
                                    }
                                }

                                i = i + 1;
                            }
                        }

                        if (ModuleConfiguration.IsCodeDataCache == true && request.LoadOptions?.Get<string>("codeCacheYN").ToStringSafe().ParseBool() == true && string.IsNullOrEmpty(cacheKey) == false)
                        {
                            if (memoryCache.Get(cacheKey) == null)
                            {
                                ModuleConfiguration.CacheKeys.Add(cacheKey);

                                var cacheEntryOptions = new MemoryCacheEntryOptions()
                                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(ModuleConfiguration.CodeDataCacheTimeout))
                                    .RegisterPostEvictionCallback((key, value, reason, state) =>
                                    {
                                        ModuleConfiguration.CacheKeys.Remove(key.ToStringSafe());
                                    });

                                memoryCache.Set(cacheKey, response, cacheEntryOptions);
                            }
                            else
                            {
                                ModuleConfiguration.CacheKeys.Remove(cacheKey);
                            }
                        }

                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);

                    default:
                        response.ExceptionText = "ReturnType 확인 필요";
                        return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                #endregion
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
            }

            return LoggingAndReturn(response, transactionWorkID, "N", null);
        }

        private ActionResult LoggingAndReturn(TransactionResponse response, string transactionWorkID, string acknowledge, TransactionInfo? transactionInfo)
        {
            if (ModuleConfiguration.IsTransactionLogging == true || (transactionInfo != null && transactionInfo.TransactionLog == true))
            {
                loggerClient.TransactionResponseLogging(response, transactionWorkID, acknowledge, (string error) =>
                {
                    logger.Information("[{LogCategory}] [{GlobalID}] " + $"fallback error: {error}, Response JSON: {JsonConvert.SerializeObject(response)}", "Transaction/RequestDataTransaction", response.Transaction.GlobalID);
                });
            }

            if (response.System.Routes.Count > 0)
            {
                var route = response.System.Routes[response.System.Routes.Count - 1];
                route.ResponseTick = DateTime.UtcNow.GetJavascriptTime();
            }

            return Content(JsonConvert.SerializeObject(response), "application/json");
        }
    }
}
