using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using ChoETL;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using transact.Entity;
using transact.Extensions;

namespace transact.Events
{
    /*
    DynamicRequest dynamicRequest = new DynamicRequest();
    Type? type = Assembly.Load("transact")?.GetType("transact.Events.TransactRequest");
    if (type != null)
    {
        object? instance = Activator.CreateInstance(type, dynamicRequest);
        if (instance != null)
        {
            object? eventResponse = await mediator.Send(instance);
            if (eventResponse != null)
            {
                response = JsonConvert.DeserializeObject<DynamicResponse>(JsonConvert.SerializeObject(eventResponse));
            }
            else
            {
                response = new DynamicResponse();
                response.ExceptionText = $"moduleEventName: transact.Events.TransactRequest 확인 필요";
            }
        }
    }
    */
    public class TransactRequest : IRequest<object?>
    {
        public object? Request { get; set; }

        public TransactRequest(object? request)
        {
            Request = request;
        }
    }

    public class TransactRequestHandler : IRequestHandler<TransactRequest, object?>
    {
        private TransactClient transactClient { get; }

        private TransactLoggerClient loggerClient { get; }
        
        private Serilog.ILogger logger { get; }

        private readonly IMemoryCache memoryCache;

        private readonly IDistributedCache distributedCache;

        public TransactRequestHandler(IDistributedCache distributedCache, IMemoryCache memoryCache, Serilog.ILogger logger, TransactLoggerClient loggerClient, TransactClient transactClient)
        {
            this.logger = logger;
            this.distributedCache = distributedCache;
            this.memoryCache = memoryCache;
            this.loggerClient = loggerClient;
            this.transactClient = transactClient;
        }

        public async Task<object?> Handle(TransactRequest requestTransact, CancellationToken cancellationToken)
        {
            TransactionRequest? request = requestTransact.Request as TransactionRequest;
            TransactionResponse? response = new TransactionResponse();

            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "요청 정보 확인 필요";
                return response;
            }

            string transactionWorkID = "mainapp";
            try
            {
                var transactionUserWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
                var transactionApplicationID = request.LoadOptions?.Get<string>("app-id").ToStringSafe();
                request.System.ProgramID = string.IsNullOrEmpty(transactionApplicationID) == false ? transactionApplicationID : request.System.ProgramID;

                if (string.IsNullOrEmpty(transactionUserWorkID) == false)
                {
                    transactionWorkID = transactionUserWorkID;
                }

                if (ModuleConfiguration.IsValidationRequest == true)
                {
                    if (distributedCache.Get(request.Transaction.GlobalID) == null)
                    {
                        response.ExceptionText = "잘못된 요청";
                        return response;
                    }
                    else
                    {
                        distributedCache.Remove(request.Transaction.GlobalID);
                    }
                }

                bool isAllowRequestTransactions = false;
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
                    return response;
                }

                transactClient.DefaultResponseHeaderConfiguration(request, response);
                response.System.PathName = "event";

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

                    foreach (string dataMapSetRaw in request.PayLoad.DataMapSetRaw)
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

                        foreach (string dataMapSetRaw in request.PayLoad.DataMapSetRaw)
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

                string cacheKey = string.Empty;
                if (ModuleConfiguration.IsCodeDataCache == true && request.LoadOptions?.Get<string>("codeCacheYN").ToStringSafe().ParseBool() == true)
                {
                    if (request.PayLoad != null && request.PayLoad.DataMapSet != null && request.PayLoad.DataMapSet.Count > 0)
                    {
                        var inputs = request.PayLoad.DataMapSet[0];
                        List<string> cacheKeys = new List<string>();
                        for (int i = 0; i < inputs.Count; i++)
                        {
                            var input = inputs[i];
                            cacheKeys.Add(input.FieldID + ":" + (input.Value == null ? "null" : input.Value.ToString()));
                        }

                        cacheKey = cacheKeys.ToJoin(";");

                        TransactionResponse? transactionResponse = null;
                        if (memoryCache.TryGetValue(cacheKey, out transactionResponse) == true)
                        {
                            if (transactionResponse == null)
                            {
                                transactionResponse = new TransactionResponse();
                            }

                            transactionResponse.ResponseID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, DateTime.Now.ToString("yyyyMMddHHmmss"));
                            transactClient.DefaultResponseHeaderConfiguration(request, transactionResponse);
                            transactionResponse.System.PathName = "event";;
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
                    // 환경정보구분코드가 허용 범위인지 확인
                    if (string.IsNullOrEmpty(ModuleConfiguration.AvailableEnvironment) == true || (string.IsNullOrEmpty(ModuleConfiguration.AvailableEnvironment) == false && ModuleConfiguration.AvailableEnvironment.Split(",").Where(p => p == request.Environment).Count() == 0))
                    {
                        response.ExceptionText = $"'{request.Environment}' 환경정보 구분코드가 허용 안됨";
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
                BusinessContract? businessContract = TransactionMapper.GetBusinessContract(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
                if (businessContract == null && dynamicContract == true)
                {
                    PublicTransaction? publicTransaction = TransactionMapper.GetPublicTransaction(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
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
                    bool dynamicAuthorize = request.LoadOptions == null ? false : request.LoadOptions.Get<string>("authorize").ToStringSafe().ParseBool();
                    string dynamicCommandType = request.LoadOptions == null ? "" : request.LoadOptions.Get<string>("commandType").ToStringSafe();
                    string dynamicReturnType = request.LoadOptions == null ? "" : request.LoadOptions.Get<string>("returnType").ToStringSafe();
                    bool dynamicTransactionScope = request.LoadOptions == null ? false : request.LoadOptions.Get<string>("transactionScope").ToStringSafe().ParseBool();
                    bool dynamicTransactionLog = request.LoadOptions == null ? false : request.LoadOptions.Get<string>("transactionLog").ToStringSafe().ParseBool();

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

                bool isAccessScreenID = false;
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
                    PublicTransaction? publicTransaction = TransactionMapper.GetPublicTransaction(request.System.ProgramID, request.Transaction.BusinessID, request.Transaction.TransactionID);
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

                string requestSystemID = "";
                BearerToken? bearerToken = null;
                string token = request.AccessToken;
                try
                {
                    bool isBypassAuthorizeIP = false;
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

                    if (request.System.Routes.Count > 0)
                    {
                        var route = request.System.Routes[request.System.Routes.Count - 1];
                        requestSystemID = route.SystemID;
                    }

                    if (ModuleConfiguration.SystemID == requestSystemID && isBypassAuthorizeIP == true)
                    {
                        if (string.IsNullOrEmpty(token) == false && token.IndexOf(".") > -1 && string.IsNullOrEmpty(request.Transaction.OperatorID) == false)
                        {
                            string[] tokenArray = token.Split(".");
                            string userID = tokenArray[0].DecodeBase64();

                            token = tokenArray[1];
                            bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(request.Transaction.OperatorID.PadRight(32, ' ')));
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
                            if (ModuleConfiguration.UseApiAuthorize == true && transactionInfo.Authorize == true)
                            {
                                response.ExceptionText = $"'{businessContract.ApplicationID}' 애플리케이션 또는 '{businessContract.ProjectID}' 프로젝트 권한 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }
                        }
                        else if (ModuleConfiguration.UseApiAuthorize == true)
                        {
                            if (token.IndexOf(".") == -1)
                            {
                                response.ExceptionText = "BearerToken 기본 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            string[] tokenArray = token.Split(".");
                            string userID = tokenArray[0].DecodeBase64();

                            if (userID != request.Transaction.OperatorID)
                            {
                                response.ExceptionText = "BearerToken 사용자 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            token = tokenArray[1];
                            bearerToken = JsonConvert.DeserializeObject<BearerToken>(token.DecryptAES(request.Transaction.OperatorID.PadRight(32, ' ')));

                            if (bearerToken == null)
                            {
                                response.ExceptionText = "BearerToken 정보 무결성 확인 필요";
                                return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                            }

                            if (transactionInfo.Authorize == true)
                            {
                                if (transactionInfo.Roles != null && transactionInfo.Roles.Count > 0)
                                {
                                    bool isRoleYN = false;
                                    foreach (var role in bearerToken.Policy.Roles)
                                    {
                                        if (transactionInfo.Roles.IndexOf(role) > -1)
                                        {
                                            isRoleYN = true;
                                            break;
                                        }
                                    }

                                    if (isRoleYN == false)
                                    {
                                        response.ExceptionText = "BearerToken 역할 권한 확인 필요";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }
                                }

                                if (transactionInfo.Policys != null && transactionInfo.Policys.Count > 0)
                                {
                                    bool isClaimYN = false;
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

                                    if (isClaimYN == false)
                                    {
                                        response.ExceptionText = "BearerToken 정책 권한 확인 필요";
                                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                    }
                                }
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    response.ExceptionText = $"인증 또는 권한 확인 오류 - {exception.ToMessage()}";
                    return LoggingAndReturn(response, transactionWorkID, "N", transactionInfo);
                }

                // 거래 Inputs/Outpus 정보 확인
                if (string.IsNullOrEmpty(request.PayLoad.DataMapInterface) == false)
                {
                    if (transactionInfo.Inputs.Count == 0)
                    {
                        string[] dti = request.PayLoad.DataMapInterface.Split("|");
                        string[] inputs = dti[0].Split(",");
                        foreach (string item in inputs)
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
                        string[] dti = request.PayLoad.DataMapInterface.Split("|");
                        string[] outputs = dti[1].Split(",");
                        foreach (string item in outputs)
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

                TransactionObject transactionObject = new TransactionObject();
                transactionObject.LoadOptions = request.LoadOptions;
                if (transactionObject.LoadOptions != null && transactionObject.LoadOptions.Count > 0)
                {
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

                List<Model> businessModels = businessContract.Models;
                List<ModelInputContract> inputContracts = transactionInfo.Inputs;
                List<ModelOutputContract> outputContracts = transactionInfo.Outputs;
                var requestInputs = request.PayLoad.DataMapSet;

                // 입력 항목이 계약과 동일한지 확인
                if (inputContracts.Count > 0 && inputContracts.Count != request.PayLoad.DataMapCount.Count)
                {
                    response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력 항목이 계약과 동일한지 확인 필요";
                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                }

                // 입력 항목ID가 계약에 적합한지 확인
                int inputOffset = 0;
                Dictionary<string, List<List<DataMapItem>>> requestInputItems = new Dictionary<string, List<List<DataMapItem>>>();
                for (int i = 0; i < inputContracts.Count; i++)
                {
                    ModelInputContract inputContract = inputContracts[i];
                    Model? model = businessModels.GetBusinessModel(inputContract.ModelID);

                    if (model == null && inputContract.ModelID != "Unknown" && inputContract.ModelID != "Dynamic")
                    {
                        response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{inputContract.ModelID}' 입력 모델 ID가 계약에 있는지 확인";
                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                    }

                    int inputCount = request.PayLoad.DataMapCount[i];
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

                        int fieldIndex = 0;
                        foreach (string REQ_FIELD_ID in inputContract.Fields)
                        {
                            DefaultValue defaultValue = inputContract.DefaultValues[fieldIndex];
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

                            DataMapItem tempReqInput = new DataMapItem();
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

                List<List<TransactField>> transactInputs = new List<List<TransactField>>();

                int index = 0;
                foreach (var requestInputItem in requestInputItems)
                {
                    string modelID = requestInputItem.Key;
                    List<List<DataMapItem>> inputItems = requestInputItem.Value;

                    // 입력 정보 생성
                    ModelInputContract inputContract = inputContracts[index];
                    Model? model = businessModels.GetBusinessModel(inputContract.ModelID);

                    if (model == null && inputContract.ModelID != "Unknown" && inputContract.ModelID != "Dynamic")
                    {
                        response.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{inputContract.ModelID}' 입력 모델 ID가 계약에 있는지 확인";
                        return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                    }

                    for (int i = 0; i < inputItems.Count; i++)
                    {
                        List<TransactField> transactInput = new List<TransactField>();
                        List<DataMapItem> requestInput = inputItems[i];

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
                                TransactField transactField = new TransactField();
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
                                            string dataType = transactField.DataType.ToLower();
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

                        JObject? bearerFields = bearerToken == null ? null : bearerToken.Variable as JObject;
                        if (bearerFields != null)
                        {
                            foreach (var item in bearerFields)
                            {
                                string REQ_FIELD_ID = "$" + item.Key;
                                JToken? jToken = item.Value;
                                if (jToken == null)
                                {
                                    response.ExceptionText = $"{REQ_FIELD_ID} Bearer 필드 확인 필요";
                                    return LoggingAndReturn(response, transactionWorkID, "Y", transactionInfo);
                                }

                                DatabaseColumn column = new DatabaseColumn()
                                {
                                    Name = REQ_FIELD_ID,
                                    Length = -1,
                                    DataType = "String",
                                    Default = "",
                                    Require = false
                                };

                                TransactField transactField = new TransactField();
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
                                            string dataType = transactField.DataType.ToLower();
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

                #endregion

                #region 명령 구분 확인(Console, DataTransaction, ApiServer, FileServer)

                request.Transaction.CommandType = transactionInfo.CommandType;
                response.Transaction.CommandType = transactionInfo.CommandType;
                ApplicationResponse applicationResponse = new ApplicationResponse();

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

                string responseData = string.Empty;
                string properties = "Transaction/Response ReturnType: " + transactionInfo.ReturnType.ToString();

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

                        return responseData;
                    case "NonQuery":
                        responseData = applicationResponse.ResultInteger.ToString();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return responseData;
                    case "Xml":
                        responseData = applicationResponse.ResultObject == null ? "" : applicationResponse.ResultObject.ToStringSafe();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return responseData;
                    case "DynamicJson":
                        responseData = applicationResponse.ResultJson == null ? "" : applicationResponse.ResultJson.ToString();

                        if (ModuleConfiguration.IsTransactionLogging == true || transactionInfo?.TransactionLog == true)
                        {
                            loggerClient.TransactionMessageLogging(response.Transaction.GlobalID, "Y", response.System.ProgramID, response.Transaction.BusinessID, response.Transaction.TransactionID, response.Transaction.FunctionID, responseData, properties, (string error) =>
                            {
                                logger.Information("[{LogCategory}] fallback error: " + error + ", " + responseData, properties);
                            });
                        }

                        return responseData;
                    case "CodeHelp":
                    case "Json":
                        response.Message.ResponseStatus = "N"; // N: Normal, W: Warning, E: Error
                        response.Message.MainCode = nameof(MessageCode.T200);
                        response.Message.MainText = MessageCode.T200;

                        response.ResponseID = string.Concat(ModuleConfiguration.SystemID, GlobalConfiguration.HostName, request.Environment, DateTime.Now.ToString("yyyyMMddHHmmddsss"));
                        response.Acknowledge = AcknowledgeType.Success;
                        ExecuteDynamicTypeObject executeDynamicTypeObject = (ExecuteDynamicTypeObject)Enum.Parse(typeof(ExecuteDynamicTypeObject), transactionInfo.ReturnType);
                        response.Result.ResponseType = ((int)executeDynamicTypeObject).ToString();

                        if (response.Transaction.DataFormat == "T")
                        {
                            List<string> resultMeta = applicationResponse.ResultMeta;
                            int i = 0;
                            foreach (var dataMapItem in response.Result.DataSet)
                            {
                                JToken? Value = dataMapItem.Value as JToken;
                                if (Value != null)
                                {
                                    if (Value is JObject)
                                    {
                                        var names = Value.ToObject<JObject>()?.Properties().Select(p => p.Name).ToList();
                                        if (names != null)
                                        {
                                            foreach (var item in names)
                                            {
                                                string? data = Value[item]?.ToString();
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
                                                        string? data = jtoken[item]?.ToString();
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

                                    string meta = resultMeta[i];
                                    if (Value.HasValues == true)
                                    {
                                        var jsonReader = new StringReader(Value.ToString());
                                        using (ChoJSONReader choJSONReader = new ChoJSONReader(jsonReader))
                                        {
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
                            List<string> resultMeta = applicationResponse.ResultMeta;
                            int i = 0;
                            foreach (var dataMapItem in response.Result.DataSet)
                            {
                                JToken? value = dataMapItem.Value as JToken;
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
                                memoryCache.Set(cacheKey, response, TimeSpan.FromMinutes(ModuleConfiguration.CodeDataCacheTimeout));
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

        private TransactionResponse LoggingAndReturn(TransactionResponse response, string transactionWorkID, string acknowledge, TransactionInfo? transactionInfo)
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

            return response;
        }
    }
}
