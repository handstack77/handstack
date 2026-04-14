using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using transact.Entity;
using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public partial class WorkflowController : BaseController
    {
        private readonly Serilog.ILogger logger;
        private readonly IDistributedCache distributedCache;
        private readonly TransactLoggerClient loggerClient;
        private readonly TransactClient transactClient;

        public WorkflowController(IDistributedCache distributedCache, Serilog.ILogger logger, TransactLoggerClient loggerClient, TransactClient transactClient)
        {
            this.logger = logger;
            this.distributedCache = distributedCache;
            this.loggerClient = loggerClient;
            this.transactClient = transactClient;
        }

        // http://localhost:8421/transact/api/workflow/execute
        [HttpPost("[action]")]
        public async Task<ActionResult> Execute(TransactionRequest request)
        {
            var response = new TransactionResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }

            var transactionRouteCount = request.System.Routes.Count > 0 ? request.System.Routes.Count - 1 : -1;
            var transactionWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
            transactionWorkID = string.IsNullOrWhiteSpace(transactionWorkID) ? "mainapp" : transactionWorkID;

            try
            {
                transactClient.DefaultResponseHeaderConfiguration(request, response, transactionRouteCount);

                if (ModuleConfiguration.IsValidationRequest == true)
                {
                    if (ModuleConfiguration.BypassGlobalIDTransactions.Contains(request.Transaction.TransactionID) == false && (request.System.Routes.Count == 0 || distributedCache.Get(request.Transaction.GlobalID) == null))
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

                    if (ModuleConfiguration.IsValidationGlobalID == true && ModuleConfiguration.BypassGlobalIDTransactions.Contains(request.Transaction.TransactionID) == false)
                    {
                        var findGlobalID = ModuleConfiguration.RequestGlobalIDList.FirstOrDefault(p => p == request.Transaction.GlobalID);
                        if (!string.IsNullOrWhiteSpace(findGlobalID))
                        {
                            response.ExceptionText = "중복 요청";
                            return Content(JsonConvert.SerializeObject(response), "application/json");
                        }

                        ModuleConfiguration.RequestGlobalIDList.Add(request.Transaction.GlobalID);
                    }
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

                if (isAllowRequestTransactions == false)
                {
                    response.ExceptionText = $"애플리케이션 ID: '{request.System.ProgramID}', 프로젝트 ID: {request.Transaction.BusinessID} 요청 가능 거래 매핑 정보 확인 필요";
                    return Content(JsonConvert.SerializeObject(response), "application/json");
                }

                response.System.PathName = Request.Path;

                if (string.IsNullOrWhiteSpace(request.Action) ||
                    string.IsNullOrWhiteSpace(request.Kind) ||
                    request.System == null ||
                    request.Transaction == null ||
                    request.PayLoad == null ||
                    request.Interface == null)
                {
                    response.ExceptionText = "잘못된 입력 전문";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (string.IsNullOrWhiteSpace(request.Transaction.DataFormat))
                {
                    request.Transaction.DataFormat = "J";
                }

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
                        if (!TryDeserializeDataMapItems(reqJArray.ToString(), out var reqInputs))
                        {
                            response.ExceptionText = "입력 데이터 맵 정보 확인 필요";
                            return LoggingAndReturn(response, transactionWorkID, "N", null);
                        }

                        request.PayLoad.DataMapSet.Add(reqInputs);
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
                            if (string.IsNullOrWhiteSpace(decryptInputData))
                            {
                                request.PayLoad.DataMapSet.Add(new List<DataMapItem>());
                            }
                            else if (!TryDeserializeDataMapItems(decryptInputData, out var reqInput))
                            {
                                response.ExceptionText = "입력 데이터 맵 정보 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "N", null);
                            }
                            else
                            {
                                request.PayLoad.DataMapSet.Add(reqInput);
                            }
                        }
                    }
                }
                else
                {
                    response.ExceptionText = $"데이터 포맷 '{request.Transaction.DataFormat}' 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (request.PayLoad.DataMapCount.Count == 0 && request.PayLoad.DataMapSet.Count > 0)
                {
                    request.PayLoad.DataMapCount.Add(request.PayLoad.DataMapSet.Count);
                }

                if (string.IsNullOrWhiteSpace(request.Environment) ||
                    ModuleConfiguration.AvailableEnvironment.Count == 0 ||
                    ModuleConfiguration.AvailableEnvironment.Contains(request.Environment) == false)
                {
                    response.ExceptionText = $"입력 전문 '{request.Environment}' 환경정보 구분코드 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                var isAllowWorkflowRequestTransaction = false;
                if (ModuleConfiguration.AllowRequestTransactions.ContainsKey("*") == true)
                {
                    isAllowWorkflowRequestTransaction = true;
                }
                else if (ModuleConfiguration.AllowRequestTransactions.ContainsKey(request.System.ProgramID) == true)
                {
                    var allowProjects = ModuleConfiguration.AllowRequestTransactions[request.System.ProgramID];
                    if (allowProjects != null && (allowProjects.Contains("*") == true || allowProjects.Contains(request.Transaction.BusinessID) == true))
                    {
                        isAllowWorkflowRequestTransaction = true;
                    }
                }
                else
                {
                    var baseUrl = HttpContext.Request.GetBaseUrl();
                    var refererPath = HttpContext.Request.Headers.Referer.ToString();
                    var tenantAppRequestPath = $"{baseUrl}/{GlobalConfiguration.TenantAppRequestPath}/";
                    var transactionUserWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
                    var transactionApplicationID = request.LoadOptions?.Get<string>("app-id").ToStringSafe();
                    isAllowWorkflowRequestTransaction = refererPath.StartsWith(tenantAppRequestPath) &&
                        !string.IsNullOrWhiteSpace(transactionUserWorkID) &&
                        !string.IsNullOrWhiteSpace(transactionApplicationID);
                }

                if (isAllowWorkflowRequestTransaction == false)
                {
                    response.ExceptionText = $"애플리케이션 ID: '{request.System.ProgramID}', 프로젝트 ID: {request.Transaction.BusinessID} 요청 가능 거래 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.TransactionRequestLogging(request, transactionWorkID, "Y", (string error) =>
                    {
                        logger.Information("[{LogCategory}] [{GlobalID}] " + $"fallback error: {error}, Request JSON: {JsonConvert.SerializeObject(request)}", "Workflow/Execute", request.Transaction.GlobalID);
                    });
                }

                var businessContract = TransactionMapper.GetBusinessContract(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                if (businessContract == null)
                {
                    response.ExceptionText = $"ProgramID '{request.System.ProgramID}', BusinessID '{request.Transaction.BusinessID}', TransactionID '{request.Transaction.TransactionID}' 거래 Workflow 입력 전문 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                if (string.IsNullOrWhiteSpace(businessContract.TransactionApplicationID))
                {
                    businessContract.TransactionApplicationID = request.System.ProgramID;
                }

                var transactionInfo = businessContract.Services.FirstOrDefault(item => item.ServiceID == request.Transaction.FunctionID)?.DeepCopy();
                if (transactionInfo == null)
                {
                    response.ExceptionText = $"FunctionID '{request.Transaction.FunctionID}' Workflow 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", null);
                }

                var isAccessScreenID = false;
                if (transactionInfo.AccessScreenID == null)
                {
                    isAccessScreenID = businessContract.TransactionID == request.Transaction.ScreenID;
                }
                else if (transactionInfo.AccessScreenID.IndexOf(request.Transaction.ScreenID) > -1)
                {
                    isAccessScreenID = true;
                }
                else if (businessContract.TransactionID == request.Transaction.ScreenID)
                {
                    isAccessScreenID = true;
                }

                if (isAccessScreenID == false)
                {
                    var publicTransaction = TransactionMapper.GetPublicTransaction(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                    isAccessScreenID = publicTransaction != null;
                }

                if (isAccessScreenID == false)
                {
                    response.ExceptionText = $"ScreenID '{request.Transaction.ScreenID}' 요청 가능화면 Workflow 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                if (transactionInfo.CommandType != "W" || transactionInfo.WorkflowSteps.Count == 0)
                {
                    response.ExceptionText = $"CommandType: '{transactionInfo.CommandType}', WorkflowSteps: '{transactionInfo.WorkflowSteps.Count}' Workflow 매핑 정보 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                request.Transaction.CommandType = transactionInfo.CommandType;
                response.Transaction.CommandType = transactionInfo.CommandType;

                var workflowResult = await ExecuteWorkflowAsync(request, businessContract, transactionInfo, new List<string>());
                if (workflowResult.Success == false)
                {
                    response.ExceptionText = workflowResult.ExceptionText;
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                response.Message.ResponseStatus = "N";
                response.Message.MainCode = nameof(MessageCode.T200);
                response.Message.MainText = MessageCode.T200;
                response.ResponseID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                response.Acknowledge = AcknowledgeType.Success;

                var returnType = string.IsNullOrWhiteSpace(transactionInfo.ReturnType) ? "Json" : transactionInfo.ReturnType;
                if (System.Enum.TryParse<ExecuteDynamicTypeObject>(returnType, out var executeDynamicTypeObject) == false)
                {
                    executeDynamicTypeObject = ExecuteDynamicTypeObject.Json;
                }

                response.Result.ResponseType = ((int)executeDynamicTypeObject).ToString();
                response.Result.DataSet = workflowResult.DataSet;
                response.Result.DataSetMeta = workflowResult.ResultMeta.Count > 0
                    ? workflowResult.ResultMeta
                    : workflowResult.DataSet.Select(item => item.FieldID).ToList();

                response.Result.DataMapCount.Clear();
                foreach (var dataMapItem in response.Result.DataSet)
                {
                    var value = JTokenFromObject(dataMapItem.Value);
                    response.Result.DataMapCount.Add(value.Type == JTokenType.Array ? value.Count() : 1);
                    if (request.Transaction.CompressionYN.ParseBool() == true && (value is JObject || value is JArray))
                    {
                        dataMapItem.Value = LZStringHelper.CompressToBase64(JsonConvert.SerializeObject(value));
                    }
                }

                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] Workflow 실행 오류", "Workflow/Execute", request.Transaction.GlobalID);
            }

            return LoggingAndReturn(response, transactionWorkID, "N", null);
        }

        private ActionResult LoggingAndReturn(TransactionResponse response, string transactionWorkID, string acknowledge, TransactionInfo? transactionInfo)
        {
            if (ModuleConfiguration.IsTransactionLogging == true || (transactionInfo != null && transactionInfo.TransactionLog == true))
            {
                loggerClient.TransactionResponseLogging(response, transactionWorkID, acknowledge, (string error) =>
                {
                    logger.Information("[{LogCategory}] [{GlobalID}] " + $"fallback error: {error}, Response JSON: {JsonConvert.SerializeObject(response)}", "Workflow/Execute", response.Transaction.GlobalID);
                });
            }

            return Content(JsonConvert.SerializeObject(response), "application/json");
        }

        private static Dictionary<string, JToken> CreateStepValues(List<DataMapItem> dataSet, WorkflowStep step)
        {
            var values = FlattenDataMapItems(dataSet);
            if (step.OutputMappings.Count == 0)
            {
                return values;
            }

            foreach (var mapping in step.OutputMappings)
            {
                var targetFieldID = string.IsNullOrWhiteSpace(mapping.TargetFieldID) ? mapping.SourceFieldID : mapping.TargetFieldID;
                if (TryGetValue(values, mapping.SourceFieldID, out var sourceValue) == true)
                {
                    AddFlattenedValue(values, targetFieldID, sourceValue);
                }
                else if (mapping.DefaultValue != null)
                {
                    AddFlattenedValue(values, targetFieldID, JToken.FromObject(mapping.DefaultValue));
                }
                else if (mapping.Required == true)
                {
                    throw new System.InvalidOperationException($"SourceFieldID '{mapping.SourceFieldID}' 출력 매핑 확인 필요");
                }
            }

            return values;
        }

        private static Dictionary<string, JToken> FlattenDataMapItems(List<DataMapItem> dataMapItems)
        {
            var values = new Dictionary<string, JToken>(System.StringComparer.OrdinalIgnoreCase);
            foreach (var item in dataMapItems)
            {
                if (string.IsNullOrWhiteSpace(item.FieldID))
                {
                    continue;
                }

                AddFlattenedValue(values, item.FieldID, JTokenFromObject(item.Value));
            }

            return values;
        }

        private static void AddFlattenedValue(Dictionary<string, JToken> values, string fieldID, JToken value)
        {
            if (string.IsNullOrWhiteSpace(fieldID))
            {
                return;
            }

            values[fieldID] = value;
            if (value is JObject jObject)
            {
                foreach (var property in jObject.Properties())
                {
                    values[property.Name] = property.Value;
                    values[$"{fieldID}.{property.Name}"] = property.Value;
                }
            }
            else if (value is JArray jArray && jArray.First is JObject firstObject)
            {
                foreach (var property in firstObject.Properties())
                {
                    values[property.Name] = property.Value;
                    values[$"{fieldID}.{property.Name}"] = property.Value;
                }
            }
        }

        private static bool TryGetValue(Dictionary<string, JToken> values, string fieldID, out JToken value)
        {
            value = JValue.CreateNull();
            if (string.IsNullOrWhiteSpace(fieldID))
            {
                return false;
            }

            return values.TryGetValue(fieldID, out value!);
        }

        private static JToken JTokenFromObject(object? value)
        {
            if (value == null)
            {
                return JValue.CreateNull();
            }

            if (value is JToken token)
            {
                return token;
            }

            return JToken.FromObject(value);
        }

        private static bool TryDeserializeDataMapItems(string json, out List<DataMapItem> items)
        {
            items = new List<DataMapItem>();
            try
            {
                items = JsonConvert.DeserializeObject<List<DataMapItem>>(json) ?? new List<DataMapItem>();
                return true;
            }
            catch
            {
                return false;
            }
        }


        private async Task<WorkflowRunResult> ExecuteWorkflowAsync(TransactionRequest request, BusinessContract businessContract, TransactionInfo workflowInfo, List<string> workflowPath)
        {
            var result = new WorkflowRunResult();
            var workflowApplicationID = string.IsNullOrWhiteSpace(businessContract.TransactionApplicationID) ? businessContract.ApplicationID : businessContract.TransactionApplicationID;
            var workflowProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;
            var workflowKey = $"{workflowApplicationID}|{workflowProjectID}|{businessContract.TransactionID}|{workflowInfo.ServiceID}";
            if (workflowPath.Contains(workflowKey, StringComparer.OrdinalIgnoreCase) == true)
            {
                result.ExceptionText = $"Workflow 순환 호출 확인 필요: {string.Join(" -> ", workflowPath)} -> {workflowKey}";
                return result;
            }

            workflowPath.Add(workflowKey);
            try
            {
                var workflowSteps = workflowInfo.WorkflowSteps;
                if (workflowSteps.Count == 0)
                {
                    result.ExceptionText = $"'{workflowKey}' WorkflowSteps 확인 필요";
                    return result;
                }

                var requestValues = FlattenDataMapItems(request.PayLoad.DataMapSet.SelectMany(item => item).ToList());
                var stepValues = new Dictionary<string, Dictionary<string, JToken>>(System.StringComparer.OrdinalIgnoreCase);
                for (var i = 0; i < workflowSteps.Count; i++)
                {
                    var step = workflowSteps[i];
                    if (string.IsNullOrWhiteSpace(step.StepID))
                    {
                        step.StepID = $"{step.CommandType}{(i + 1).ToString().PadLeft(2, '0')}";
                    }

                    WorkflowStepResult stepResult;
                    try
                    {
                        stepResult = new WorkflowStepResult();
                        var applicationID = string.IsNullOrWhiteSpace(step.ApplicationID)
                            ? (businessContract.TransactionApplicationID.ToStringSafe() == "" ? businessContract.ApplicationID : businessContract.TransactionApplicationID.ToStringSafe())
                            : step.ApplicationID;
                        var projectID = string.IsNullOrWhiteSpace(step.TransactionProjectID) ? businessContract.ProjectID : step.TransactionProjectID;
                        var transactionID = string.IsNullOrWhiteSpace(step.TransactionID) ? businessContract.TransactionID : step.TransactionID;
                        var serviceID = string.IsNullOrWhiteSpace(step.ServiceID) ? workflowInfo.ServiceID : step.ServiceID;

                        BusinessContract? targetContract;
                        if (businessContract.ApplicationID == applicationID &&
                            businessContract.ProjectID == projectID &&
                            businessContract.TransactionID == transactionID)
                        {
                            targetContract = businessContract;
                        }
                        else
                        {
                            targetContract = TransactionMapper.GetBusinessContract(applicationID, projectID, transactionID);
                        }

                        if (targetContract == null)
                        {
                            stepResult.ExceptionText = $"ApplicationID '{applicationID}', ProjectID '{projectID}', TransactionID '{transactionID}' 계약 확인 필요";
                        }
                        else
                        {
                            if (string.IsNullOrWhiteSpace(targetContract.TransactionApplicationID))
                            {
                                targetContract.TransactionApplicationID = applicationID;
                            }

                            var targetInfo = targetContract.Services.FirstOrDefault(item => item.ServiceID == serviceID)?.DeepCopy();
                            if (targetInfo == null)
                            {
                                stepResult.ExceptionText = $"ServiceID '{serviceID}' 거래 매핑 정보 확인 필요";
                            }
                            else
                            {
                                var commandType = string.IsNullOrWhiteSpace(step.CommandType) ? targetInfo.CommandType : step.CommandType;
                                commandType = commandType.ToStringSafe().ToUpperInvariant();
                                if (string.IsNullOrWhiteSpace(commandType))
                                {
                                    stepResult.ExceptionText = $"StepID '{step.StepID}' CommandType 확인 필요";
                                }
                                else if (commandType == "W")
                                {
                                    var stepRequest = CloneStepRequest(request, applicationID, projectID, transactionID, serviceID, commandType);
                                    var workflowResult = await ExecuteWorkflowAsync(stepRequest, targetContract, targetInfo, workflowPath);
                                    if (workflowResult.Success == false)
                                    {
                                        stepResult.ExceptionText = workflowResult.ExceptionText;
                                    }
                                    else
                                    {
                                        stepResult.Success = true;
                                        stepResult.DataSet = workflowResult.DataSet;
                                        stepResult.ResultMeta = workflowResult.ResultMeta;
                                        stepResult.Values = CreateStepValues(stepResult.DataSet, step);
                                    }
                                }
                                else
                                {
                                    targetInfo.CommandType = commandType;
                                    targetInfo.ReturnType = string.IsNullOrWhiteSpace(step.ReturnType) ? targetInfo.ReturnType : step.ReturnType;
                                    targetInfo.ReturnType = string.IsNullOrWhiteSpace(targetInfo.ReturnType) ? "Json" : targetInfo.ReturnType;
                                    targetInfo.TransactionScope = step.TransactionScope ?? targetInfo.TransactionScope;

                                    var stepRequestForRoute = CloneStepRequest(request, applicationID, projectID, transactionID, serviceID, commandType);
                                    var transactionObject = new TransactionObject();
                                    transactionObject.LoadOptions = stepRequestForRoute.LoadOptions == null ? new Dictionary<string, string>() : new Dictionary<string, string>(stepRequestForRoute.LoadOptions);
                                    transactionObject.RequestID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, stepRequestForRoute.Environment, stepRequestForRoute.Transaction.ScreenID, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                                    transactionObject.GlobalID = stepRequestForRoute.Transaction.GlobalID;
                                    transactionObject.TransactionID = string.Concat(
                                        string.IsNullOrWhiteSpace(targetContract.TransactionApplicationID) ? targetContract.ApplicationID : targetContract.TransactionApplicationID,
                                        "|",
                                        string.IsNullOrWhiteSpace(targetContract.TransactionProjectID) ? targetContract.ProjectID : targetContract.TransactionProjectID,
                                        "|",
                                        stepRequestForRoute.Transaction.TransactionID);
                                    transactionObject.ServiceID = stepRequestForRoute.Transaction.FunctionID;
                                    transactionObject.TransactionScope = targetInfo.TransactionScope;
                                    transactionObject.ReturnType = targetInfo.ReturnType;
                                    transactionObject.ClientTag = stepRequestForRoute.ClientTag;

                                    if (step.InputMappings.Count == 0)
                                    {
                                        var payloadInputs = new List<List<TransactField>>();
                                        foreach (var inputItems in stepRequestForRoute.PayLoad.DataMapSet)
                                        {
                                            var fields = new List<TransactField>();
                                            foreach (var item in inputItems)
                                            {
                                                fields.Add(new TransactField()
                                                {
                                                    FieldID = item.FieldID,
                                                    Length = -1,
                                                    DataType = "String",
                                                    Value = item.Value
                                                });
                                            }

                                            payloadInputs.Add(fields);
                                        }

                                        transactionObject.Inputs = payloadInputs;
                                        transactionObject.InputsItemCount = stepRequestForRoute.PayLoad.DataMapCount.Count > 0
                                            ? new List<int>(stepRequestForRoute.PayLoad.DataMapCount)
                                            : new List<int>() { transactionObject.Inputs.Count };
                                    }
                                    else
                                    {
                                        var groupedFields = new Dictionary<int, List<TransactField>>();
                                        foreach (var mapping in step.InputMappings)
                                        {
                                            var targetInputIndex = mapping.TargetInputIndex < 0 ? 0 : mapping.TargetInputIndex;
                                            if (groupedFields.ContainsKey(targetInputIndex) == false)
                                            {
                                                groupedFields.Add(targetInputIndex, new List<TransactField>());
                                            }

                                            var hasMappingValue = false;
                                            JToken value = JValue.CreateNull();
                                            if (mapping.DefaultValue != null && string.IsNullOrWhiteSpace(mapping.SourceFieldID))
                                            {
                                                value = JToken.FromObject(mapping.DefaultValue);
                                                hasMappingValue = true;
                                            }
                                            else
                                            {
                                                Dictionary<string, JToken>? sourceValues = null;
                                                var source = mapping.Source.ToStringSafe();
                                                if (source.Equals("Step", System.StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(mapping.SourceStepID) == false)
                                                {
                                                    if (string.IsNullOrWhiteSpace(mapping.SourceStepID) == false)
                                                    {
                                                        stepValues.TryGetValue(mapping.SourceStepID, out sourceValues);
                                                    }
                                                }
                                                else
                                                {
                                                    sourceValues = requestValues;
                                                }

                                                if (sourceValues != null && TryGetValue(sourceValues, mapping.SourceFieldID, out value) == true)
                                                {
                                                    hasMappingValue = true;
                                                }
                                                else if (mapping.DefaultValue != null)
                                                {
                                                    value = JToken.FromObject(mapping.DefaultValue);
                                                    hasMappingValue = true;
                                                }
                                            }

                                            if (hasMappingValue == false)
                                            {
                                                if (mapping.Required == true)
                                                {
                                                    throw new InvalidOperationException($"SourceFieldID '{mapping.SourceFieldID}' 입력 매핑 확인 필요");
                                                }

                                                value = JTokenFromObject("");
                                            }

                                            object? fieldValue;
                                            if (value.Type == JTokenType.Null || value.Type == JTokenType.Undefined)
                                            {
                                                fieldValue = null;
                                            }
                                            else if (value is JValue jValue)
                                            {
                                                fieldValue = jValue.Value;
                                            }
                                            else
                                            {
                                                fieldValue = value;
                                            }

                                            var targetFieldID = string.IsNullOrWhiteSpace(mapping.TargetFieldID) ? mapping.SourceFieldID : mapping.TargetFieldID;
                                            groupedFields[targetInputIndex].Add(new TransactField()
                                            {
                                                FieldID = targetFieldID,
                                                Length = mapping.Length,
                                                DataType = string.IsNullOrWhiteSpace(mapping.DbType) ? "String" : mapping.DbType,
                                                Value = fieldValue
                                            });
                                        }

                                        var inputGroupCount = Math.Max(targetInfo.Inputs.Count, groupedFields.Keys.DefaultIfEmpty(0).Max() + 1);
                                        for (var inputIndex = 0; inputIndex < inputGroupCount; inputIndex++)
                                        {
                                            if (groupedFields.TryGetValue(inputIndex, out var fields) == true && fields.Count > 0)
                                            {
                                                transactionObject.InputsItemCount.Add(1);
                                                transactionObject.Inputs.Add(fields);
                                            }
                                            else
                                            {
                                                transactionObject.InputsItemCount.Add(0);
                                            }
                                        }
                                    }

                                    var inputContracts = targetInfo.Inputs;
                                    if (inputContracts.Count == 0)
                                    {
                                        inputContracts = new List<ModelInputContract>();
                                        if (transactionObject.InputsItemCount.Any(item => item > 0) == true)
                                        {
                                            for (var inputIndex = 0; inputIndex < transactionObject.InputsItemCount.Count; inputIndex++)
                                            {
                                                inputContracts.Add(new ModelInputContract()
                                                {
                                                    ModelID = "Dynamic",
                                                    Fields = new List<string>(),
                                                    Type = "Row",
                                                    BaseFieldMappings = new List<BaseFieldMapping>(),
                                                    ParameterHandling = "Rejected"
                                                });
                                            }
                                        }
                                    }

                                    var outputContracts = step.ServiceOutputs.Count > 0 ? step.ServiceOutputs : targetInfo.Outputs;
                                    var applicationResponse = await transactClient.RequestDataTransactionAsync(stepRequestForRoute, targetInfo, transactionObject, inputContracts, outputContracts);
                                    if (!string.IsNullOrWhiteSpace(applicationResponse.ExceptionText))
                                    {
                                        stepResult.ExceptionText = applicationResponse.ExceptionText;
                                    }
                                    else
                                    {
                                        var dataSet = new List<DataMapItem>();
                                        switch (targetInfo.ReturnType)
                                        {
                                            case "Scalar":
                                                dataSet.Add(new DataMapItem() { FieldID = "Scalar", Value = applicationResponse.ResultObject });
                                                break;
                                            case "NonQuery":
                                                dataSet.Add(new DataMapItem() { FieldID = "RowsAffected", Value = applicationResponse.ResultInteger });
                                                break;
                                            case "Xml":
                                                dataSet.Add(new DataMapItem() { FieldID = "Xml", Value = applicationResponse.ResultObject });
                                                break;
                                            default:
                                                if (string.IsNullOrWhiteSpace(applicationResponse.ResultJson) == false)
                                                {
                                                    var token = JToken.Parse(applicationResponse.ResultJson);
                                                    if (token is JArray array)
                                                    {
                                                        foreach (var arrayItem in array)
                                                        {
                                                            if (arrayItem is not JObject itemObject)
                                                            {
                                                                dataSet.Add(new DataMapItem() { FieldID = "Result", Value = arrayItem });
                                                            }
                                                            else
                                                            {
                                                                var fieldID = itemObject["id"] ?? itemObject["ID"] ?? itemObject["fieldID"] ?? itemObject["FieldID"];
                                                                var value = itemObject["value"] ?? itemObject["Value"];

                                                                dataSet.Add(new DataMapItem()
                                                                {
                                                                    FieldID = fieldID.ToStringSafe(),
                                                                    Value = value
                                                                });
                                                            }
                                                        }
                                                    }
                                                    else
                                                    {
                                                        dataSet.Add(new DataMapItem() { FieldID = "Result", Value = token });
                                                    }
                                                }
                                                break;
                                        }

                                        stepResult.Success = true;
                                        stepResult.DataSet = dataSet;
                                        stepResult.ResultMeta = applicationResponse.ResultMeta;
                                        stepResult.Values = CreateStepValues(stepResult.DataSet, step);
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        result.ExceptionText = $"StepID '{step.StepID}' Workflow 실행 오류 - {exception.ToMessage()}";
                        return result;
                    }

                    if (stepResult.Success == false)
                    {
                        result.ExceptionText = $"StepID '{step.StepID}' Workflow 실행 오류 - {stepResult.ExceptionText}";
                        return result;
                    }

                    stepValues[step.StepID] = stepResult.Values;
                    result.DataSet = stepResult.DataSet;
                    result.ResultMeta = stepResult.ResultMeta;
                    result.Values = stepResult.Values;
                }

                result.Success = true;
                return result;
            }
            finally
            {
                workflowPath.Remove(workflowKey);
            }
        }

        private static TransactionRequest CloneStepRequest(TransactionRequest request, string applicationID, string projectID, string transactionID, string serviceID, string commandType)
        {
            var stepRequest = JsonConvert.DeserializeObject<TransactionRequest>(JsonConvert.SerializeObject(request));
            if (stepRequest == null)
            {
                throw new InvalidOperationException("Workflow 단계 요청 생성 오류");
            }

            stepRequest.System.ProgramID = applicationID;
            stepRequest.Transaction.BusinessID = projectID;
            stepRequest.Transaction.TransactionID = transactionID;
            stepRequest.Transaction.FunctionID = serviceID;
            stepRequest.Transaction.CommandType = commandType;
            stepRequest.Transaction.ScreenID = string.IsNullOrWhiteSpace(stepRequest.Transaction.ScreenID) ? transactionID : stepRequest.Transaction.ScreenID;
            return stepRequest;
        }

    }
}
