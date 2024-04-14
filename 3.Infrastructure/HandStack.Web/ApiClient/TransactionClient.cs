using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

using Serilog;

namespace HandStack.Web.ApiClient
{
    public class TransactionClient
    {
        private readonly ILogger logger;
        private readonly IMediator mediator;

        private static Dictionary<string, JObject> apiServices = new Dictionary<string, JObject>();

        public TransactionClient(ILogger logger, IMediator mediator)
        {
            this.logger = logger;
            this.mediator = mediator;
        }

        public bool AddFindService(string systemID, string serverType)
        {
            bool result = false;
            try
            {
                string findID = systemID + serverType;
                if (apiServices.ContainsKey(findID) == false)
                {
                    Uri uri = new Uri(TransactionConfig.DiscoveryApiServerUrl + $"?systemID={systemID}&serverType={serverType}");
                    RestClient client = new RestClient();

                    RestRequest apiRequest = new RestRequest(uri, Method.Get);
                    apiRequest.AddHeader("Content-Type", "application/json");
                    apiRequest.AddHeader("cache-control", "no-cache");

                    apiRequest.Timeout = TransactionConfig.TransactionTimeout;
                    var apiResponse = client.Execute<TransactionResponse>(apiRequest, Method.Get);

                    if (apiResponse.ResponseStatus == ResponseStatus.Completed)
                    {
                        var content = apiResponse.Content;
                        if (content != null)
                        {
                            JObject apiService = JObject.Parse(content);
                            if (apiService != null)
                            {
                                var exception = apiService["ExceptionText"];
                                string exceptionText = exception == null ? "" : exception.ToString();
                                if (string.IsNullOrEmpty(exceptionText) == true)
                                {
                                    result = true;
                                    apiServices.Add(systemID + serverType, apiService);
                                }
                            }
                            else
                            {
                                logger.Error($"systemID: {systemID}, serverType: {serverType} AddFindService 오류: {apiResponse.Content}");
                            }
                        }
                        else
                        {
                            logger.Error($"systemID: {systemID}, serverType: {serverType} AddFindService 오류: {uri.ToString()}");
                        }
                    }
                }
                else
                {
                    result = true;
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"systemID: {systemID}, serverType: {serverType} AddFindService 오류");
            }

            return result;
        }

        public bool AddApiService(string systemID, string serverType, JObject apiService)
        {
            bool result = false;
            try
            {
                string findID = systemID + serverType;
                if (apiServices.ContainsKey(findID) == false)
                {
                    apiServices.Add(systemID + serverType, apiService);
                }
                else
                {
                    result = true;
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"systemID: {systemID}, serverType: {serverType} AddApiService 오류");
            }

            return result;
        }

        public async Task<Dictionary<string, JToken>> TransactionDirect(string businessServerUrl, TransactionClientObject transactionObject)
        {
            dynamic hasException = new ExpandoObject();
            Dictionary<string, JToken> result = new Dictionary<string, JToken>();
            string requestID = string.Empty;

            try
            {
                transactionObject.ReturnType = string.IsNullOrEmpty(transactionObject.ReturnType) == true ? "Json" : transactionObject.ReturnType;

                if (transactionObject.InputsItemCount.Count == 0)
                {
                    transactionObject.InputsItemCount.Add(transactionObject.Inputs.Count);
                }

                requestID = GetRequestID(transactionObject);
                transactionObject.RequestID = requestID;

                TransactionRequest transactionRequest = CreateTransactionRequest("SYN", transactionObject);

                RestClient client = new RestClient();

                if (string.IsNullOrEmpty(GlobalConfiguration.FindGlobalIDServer) == false)
                {
                    var idRequest = new RestRequest(GlobalConfiguration.FindGlobalIDServer, Method.Post);
                    idRequest.AddStringBody(JsonConvert.SerializeObject(new
                    {
                        applicationID = transactionObject.ProgramID,
                        projectID = transactionObject.BusinessID,
                        transactionID = transactionObject.TransactionID,
                        serviceID = transactionObject.FunctionID,
                        screenID = transactionObject.ScreenID,
                        tokenID = TransactionConfig.Program.ClientTokenID.Substring(0, 6).PadLeft(6, '0')
                    }), DataFormat.Json);
                    idRequest.AddHeader("Content-Type", "application/json");
                    idRequest.AddHeader("cache-control", "no-cache");
                    var idResponse = await client.ExecuteAsync<string>(idRequest);
                    var globalID = idResponse.Data;
                    if (string.IsNullOrEmpty(globalID) == false)
                    {
                        transactionRequest.Transaction.GlobalID = globalID;
                    }
                }

                if (businessServerUrl.IndexOf("event://") > -1)
                {
                    TransactionResponse? transactionResponse = null;
                    string moduleEventName = businessServerUrl.Replace("event://", "");
                    Type? type = Assembly.Load(moduleEventName.Split(".")[0])?.GetType(moduleEventName);
                    if (type != null)
                    {
                        object? instance = Activator.CreateInstance(type, transactionRequest);
                        if (instance == null)
                        {
                            transactionResponse = new TransactionResponse();
                            transactionResponse.ExceptionText = $"moduleEventName: {moduleEventName} 확인 필요";
                        }
                        else
                        {
                            object? eventResponse = await mediator.Send(instance);
                            if (eventResponse != null)
                            {
                                transactionResponse = JsonConvert.DeserializeObject<TransactionResponse>(JsonConvert.SerializeObject(eventResponse));
                            }
                            else
                            {
                                transactionResponse = new TransactionResponse();
                                transactionResponse.ExceptionText = $"moduleEventName: {moduleEventName} 확인 필요";
                            }
                        }
                    }
                    else
                    {
                        transactionResponse = new TransactionResponse();
                        transactionResponse.ExceptionText = $"moduleEventName: {moduleEventName} 확인 필요";
                    }

                    if (transactionResponse != null && transactionResponse.Acknowledge == AcknowledgeType.Success)
                    {
                        if (transactionResponse.Result.DataSet != null && transactionResponse.Result.DataSet.Count > 0)
                        {
                            foreach (var item in transactionResponse.Result.DataSet)
                            {
                                try
                                {
                                    if (item.Value is JToken)
                                    {
                                        result.Add(item.FieldID, (JToken)item.Value);
                                    }
                                    else if (item.Value != null)
                                    {
                                        result.Add(item.FieldID, JToken.FromObject(item.Value));
                                    }
                                    else
                                    {
                                        result.Add(item.FieldID, JToken.FromObject(""));
                                    }
                                }
                                catch (Exception exception)
                                {
                                    result.Clear();
                                    hasException.ErrorMessage = $"Ok|Completed|{string.Concat(item.FieldID, " ", exception.Message)}";
                                    result.Add("HasException", JObject.FromObject(hasException));
                                    break;
                                }
                            }
                        }
                    }
                    else
                    {
                        hasException.ErrorMessage = $"Ok|Completed|{string.Concat("응답 오류 - ", moduleEventName)}";
                        result.Add("HasException", JObject.FromObject(hasException));
                    }
                }
                else
                {
                    var restRequest = new RestRequest(businessServerUrl, Method.Post);
                    restRequest.AddStringBody(JsonConvert.SerializeObject(transactionRequest), DataFormat.Json);

                    restRequest.AddHeader("Content-Type", "application/json");
                    restRequest.AddHeader("cache-control", "no-cache");
                    restRequest.AddHeader("ClientTag", TransactionConfig.ClientTag);

                    var restResponse = await client.ExecuteAsync<TransactionResponse>(restRequest);
                    if (restResponse != null && restResponse.StatusCode != HttpStatusCode.NotFound && restResponse.ResponseStatus == ResponseStatus.Completed)
                    {
                        var content = restResponse.Content;
                        if (content != null)
                        {
                            TransactionResponse? transactionResponse = JsonConvert.DeserializeObject<TransactionResponse>(content);

                            if (transactionResponse != null && transactionResponse.Acknowledge == AcknowledgeType.Success)
                            {
                                if (transactionResponse.Result.DataSet != null && transactionResponse.Result.DataSet.Count > 0)
                                {
                                    foreach (var item in transactionResponse.Result.DataSet)
                                    {
                                        try
                                        {
                                            if (item.Value is JToken)
                                            {
                                                result.Add(item.FieldID, (JToken)item.Value);
                                            }
                                            else if (item.Value != null)
                                            {
                                                result.Add(item.FieldID, JToken.FromObject(item.Value));
                                            }
                                            else
                                            {
                                                result.Add(item.FieldID, JToken.FromObject(""));
                                            }
                                        }
                                        catch (Exception exception)
                                        {
                                            result.Clear();
                                            hasException.ErrorMessage = $"Ok|Completed|{string.Concat(item.FieldID, " ", exception.Message)}";
                                            result.Add("HasException", JObject.FromObject(hasException));
                                            break;
                                        }
                                    }
                                }
                            }
                            else
                            {
                                hasException.ErrorMessage = $"Ok|Completed|{string.Concat("응답 오류 - ", content)}";
                                result.Add("HasException", JObject.FromObject(hasException));
                            }
                        }
                    }
                    else
                    {
                        if (restResponse != null)
                        {
                            ResponseStatus responseStatus = restResponse.ResponseStatus;
                            HttpStatusCode statusCode = restResponse.StatusCode;

                            hasException.ErrorMessage = $"{statusCode}|{responseStatus}|{restResponse.ErrorMessage}";
                        }
                        else
                        {
                            hasException.ErrorMessage = $"{HttpStatusCode.Gone}|None|연결 오류";
                        }

                        result.Add("HasException", JObject.FromObject(hasException));
                    }
                }
            }
            catch (Exception exception)
            {
                hasException.ErrorMessage = $"{HttpStatusCode.Gone}|None|{exception.Message}";
                result.Add("HasException", JObject.FromObject(hasException));
            }

            return result;
        }

        private static string GetRequestID(TransactionClientObject transactionObject)
        {
            string requestID;
            var installType = TransactionConfig.Program.InstallType;
            var environment = TransactionConfig.Transaction.RunningEnvironment;
            var machineTypeID = TransactionConfig.Transaction.MachineTypeID;
            var programID = transactionObject.ProgramID.PadLeft(8, '0');
            var businessID = transactionObject.BusinessID.PadLeft(3, '0');
            var transactionID = transactionObject.TransactionID.PadLeft(6, '0');
            var functionID = transactionObject.FunctionID.PadLeft(4, '0');
            var tokenID = TransactionConfig.Program.ClientTokenID.Substring(0, 6).PadLeft(6, '0');
            var requestTime = DateTime.Now.ToString("HHmmss");

            // -- 36바이트 = 설치구분 1자리(L: Local, C: Cloud, O: Onpremise) + 환경 ID 1자리 + 애플리케이션 ID 8자리 + 프로젝트 ID 3자리 + 거래 ID 6자리 + 기능 ID 4자리 + 시스템 구분 1자리 (W: WEB, P: Program, S: SVR, E: EXT) + ClientTokenID 6자리 + Timestamp (HHmmss) 6자리
            requestID = $"{installType}{environment}{programID}{businessID}{transactionID}{functionID}{machineTypeID}{tokenID}{requestTime}";
            return requestID;
        }

        private TransactionRequest CreateTransactionRequest(string action, TransactionClientObject transactionObject)
        {
            TransactionRequest transactionRequest = new TransactionRequest();
            transactionRequest.AccessToken = "";
            transactionRequest.Action = action;
            transactionRequest.Kind = transactionObject.Kind;
            transactionRequest.ClientTag = string.Concat(TransactionConfig.Transaction.SystemID, "|", TransactionConfig.Transaction.MachineName, "|", TransactionConfig.Program.ProgramName, "|", TransactionConfig.Transaction.RunningEnvironment);
            transactionRequest.LoadOptions = new Dictionary<string, string>();
            transactionRequest.LoadOptions.Add("encryptionType", TransactionConfig.Transaction.EncryptionType);
            transactionRequest.LoadOptions.Add("encryptionKey", TransactionConfig.Transaction.EncryptionKey);
            transactionRequest.LoadOptions.Add("platform", Environment.OSVersion.Platform.ToString());
            transactionRequest.RequestID = string.Concat(transactionObject.ProgramID, transactionObject.BusinessID, transactionObject.TransactionID, transactionObject.FunctionID, TransactionConfig.Transaction.RunningEnvironment, DateTime.Now.ToString("yyyyMMddHHmmssffffff"));
            transactionRequest.Version = TransactionConfig.Transaction.ProtocolVersion;
            transactionRequest.Environment = TransactionConfig.Transaction.RunningEnvironment;

            transactionRequest.System.ProgramID = transactionObject.ProgramID;
            transactionRequest.System.Version = TransactionConfig.Program.ProgramVersion;
            transactionRequest.System.LocaleID = TransactionConfig.Program.LanguageID;
            transactionRequest.System.HostName = TransactionConfig.Transaction.MachineName;
            transactionRequest.System.Routes.Add(new Route()
            {
                SystemID = TransactionConfig.Transaction.SystemID,
                RequestTick = DateTimeExtensions.GetJavascriptTime()
            });

            transactionRequest.Interface.DevicePlatform = Environment.OSVersion.Platform.ToString();
            transactionRequest.Interface.InterfaceID = TransactionConfig.Transaction.MachineTypeID;
            transactionRequest.Interface.SourceIP = TransactionConfig.Program.IPAddress;
            transactionRequest.Interface.SourcePort = 0;
            transactionRequest.Interface.SourceMac = TransactionConfig.Program.MacAddress;
            transactionRequest.Interface.ConnectionType = TransactionConfig.Program.NetworkInterfaceType;
            transactionRequest.Interface.Timeout = TransactionConfig.TransactionTimeout;

            transactionRequest.Transaction.GlobalID = transactionRequest.RequestID;
            transactionRequest.Transaction.BusinessID = transactionObject.BusinessID;
            transactionRequest.Transaction.TransactionID = transactionObject.TransactionID;
            transactionRequest.Transaction.FunctionID = transactionObject.FunctionID;
            transactionRequest.Transaction.SimulationType = transactionObject.SimulationType;
            transactionRequest.Transaction.TerminalGroupID = TransactionConfig.Program.BranchCode;
            transactionRequest.Transaction.OperatorID = TransactionConfig.OperatorUser.UserID;
            transactionRequest.Transaction.ScreenID = string.IsNullOrEmpty(transactionObject.ScreenID) == true ? transactionObject.TransactionID : transactionObject.ScreenID;
            transactionRequest.Transaction.DataFormat = TransactionConfig.Transaction.DataFormat;
            transactionRequest.Transaction.CompressionYN = TransactionConfig.Transaction.CompressionYN;
            transactionRequest.Transaction.StartTraceID = transactionObject.StartTraceID;

            transactionRequest.PayLoad.DataMapInterface = transactionObject.DataMapInterface;
            transactionRequest.PayLoad.DataMapCount = transactionObject.InputsItemCount;
            transactionRequest.PayLoad.DataMapSet = new List<List<DataMapItem>>();

            foreach (var inputs in transactionObject.Inputs)
            {
                List<DataMapItem> reqInputs = new List<DataMapItem>();
                foreach (var item in inputs)
                {
                    reqInputs.Add(new DataMapItem() { FieldID = item.prop, Value = item.val });
                }
                transactionRequest.PayLoad.DataMapSet.Add(reqInputs);
            }

            return transactionRequest;
        }

        public async Task<string?> OnewayTransactionCommandAsync(string[] transactionCommands, string globalID, string queryID, dynamic? dynamicParameters, List<ServiceParameter>? serviceParameters = null)
        {
            string? result = null;
            try
            {
                if (dynamicParameters is List<DynamicParameter>)
                {
                    string applicationID = transactionCommands[0];
                    string projectID = transactionCommands[1];
                    string transactionID = transactionCommands[2];
                    string serviceID = transactionCommands[3];

                    TransactionClientObject transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    transactionObject.ProgramID = applicationID;
                    transactionObject.BusinessID = projectID;
                    transactionObject.TransactionID = transactionID;
                    transactionObject.FunctionID = serviceID;
                    transactionObject.ScreenID = "MessageServer";

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("GlobalID", globalID);
                    inputs.Add("QueryID", queryID);

                    if (serviceParameters != null)
                    {
                        foreach (var item in serviceParameters)
                        {
                            inputs.Add(item.prop, item.val);
                        }
                    }

                    foreach (var item in dynamicParameters)
                    {
                        if (item != null)
                        {
                            if (item.ParameterName is string && item.Value is string)
                            {
                                inputs.Add((string)item.ParameterName, (string)item.Value);
                            }
                        }
                    }

                    transactionObject.Inputs.Add(inputs);

                    string requestID = "OnewayTransactionCommand" + DateTime.Now.ToString("yyyyMMddHHmmss");
                    var transactionResult = await TransactionDirect(GlobalConfiguration.BusinessServerUrl, transactionObject);
                    result = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                }
            }
            catch (Exception exception)
            {
                result = exception.ToMessage();
                logger.Error("[{LogCategory}] " + $"GlobalID: {globalID}, {result}", "TransactionClient/OnewayTransactionCommand");
            }

            return result;
        }

        public string? OnewayTransactionCommand(string[] transactionCommands, string globalID, string queryID, dynamic? dynamicParameters, List<ServiceParameter>? serviceParameters = null)
        {
            string? result = null;
            try
            {
                if (dynamicParameters is List<DynamicParameter>)
                {
                    string applicationID = transactionCommands[0];
                    string projectID = transactionCommands[1];
                    string transactionID = transactionCommands[2];
                    string serviceID = transactionCommands[3];

                    TransactionClientObject transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    transactionObject.ProgramID = applicationID;
                    transactionObject.BusinessID = projectID;
                    transactionObject.TransactionID = transactionID;
                    transactionObject.FunctionID = serviceID;
                    transactionObject.ScreenID = "MessageServer";

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("GlobalID", globalID);
                    inputs.Add("QueryID", queryID);

                    if (serviceParameters != null)
                    {
                        foreach (var item in serviceParameters)
                        {
                            inputs.Add(item.prop, item.val);
                        }
                    }

                    foreach (var item in dynamicParameters)
                    {
                        if (item != null)
                        {
                            if (item.ParameterName is string && item.Value is string)
                            {
                                inputs.Add((string)item.ParameterName, (string)item.Value);
                            }
                        }
                    }

                    transactionObject.Inputs.Add(inputs);

                    string requestID = "OnewayTransactionCommandAsync" + DateTime.Now.ToString("yyyyMMddHHmmss");
                    Task.Run(async () =>
                    {
                        try
                        {
                            var transactionResult = await TransactionDirect(GlobalConfiguration.BusinessServerUrl, transactionObject);
                            result = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                        }
                        catch (Exception exception)
                        {
                            logger.Error("[{LogCategory}] " + $"GlobalID: {globalID}, {exception.ToMessage()}, None", "TransactionClient/OnewayTransactionCommandAsync");
                        }
                    });
                }
            }
            catch (Exception exception)
            {
                result = exception.ToMessage();
                logger.Error("[{LogCategory}] " + $"GlobalID: {globalID}, {result}", "TransactionClient/OnewayTransactionCommandAsync");
            }

            return result;
        }

        public string? FallbackTransactionCommand(string[] transactionCommands, string globalID, string queryID, dynamic? dynamicParameters)
        {
            string? result = null;
            try
            {
                if (dynamicParameters is List<DynamicParameter>)
                {
                    string applicationID = transactionCommands[0];
                    string projectID = transactionCommands[1];
                    string transactionID = transactionCommands[2];
                    string serviceID = transactionCommands[3];

                    TransactionClientObject transactionObject = new TransactionClientObject();
                    transactionObject.SystemID = TransactionConfig.Transaction.SystemID;
                    transactionObject.ProgramID = applicationID;
                    transactionObject.BusinessID = projectID;
                    transactionObject.TransactionID = transactionID;
                    transactionObject.FunctionID = serviceID;
                    transactionObject.ScreenID = "MessageServer";

                    List<ServiceParameter> inputs = new List<ServiceParameter>();
                    inputs.Add("GlobalID", globalID);
                    inputs.Add("QueryID", queryID);

                    foreach (var item in dynamicParameters)
                    {
                        if (item != null)
                        {
                            if (item.ParameterName is string && item.Value is string)
                            {
                                inputs.Add((string)item.ParameterName, (string)item.Value);
                            }
                        }
                    }

                    transactionObject.Inputs.Add(inputs);

                    string requestID = "FallbackTransactionCommand" + DateTime.Now.ToString("yyyyMMddHHmmss");
                    Task.Run(async () =>
                    {
                        try
                        {
                            var transactionResult = await TransactionDirect(GlobalConfiguration.BusinessServerUrl, transactionObject);
                            result = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                        }
                        catch (Exception exception)
                        {
                            logger.Error("[{LogCategory}] " + $"GlobalID: {globalID}, {exception.ToMessage()}", "TransactionClient/FallbackTransactionNone");
                        }
                    });
                }
            }
            catch (Exception exception)
            {
                result = exception.ToMessage();
                logger.Error("[{LogCategory}] " + $"GlobalID: {globalID}, {result}", "TransactionClient/FallbackTransactionCommand");
            }

            return result;
        }
    }
}
