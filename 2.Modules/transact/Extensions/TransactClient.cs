﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

using transact.Entity;

namespace transact.Extensions
{
    public class TransactClient
    {
        private Serilog.ILogger logger { get; }

        private TransactLoggerClient loggerClient { get; }

        private readonly IMediator mediator;

        public TransactClient(Serilog.ILogger logger, TransactLoggerClient loggerClient, IMediator mediator)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.mediator = mediator;
        }

        public async Task<(TransactionResponse transactionResponse, string content)> TransactionRoute(TransactionInfo transactionInfo, TransactionRequest transactionRequest)
        {
            (TransactionResponse transactionResponse, string content) result;
            var transactionContent = "";
            var transactionResponse = new TransactionResponse();
            DefaultResponseHeaderConfiguration(transactionRequest, transactionResponse, -1);
            var requestID = string.Empty;

            try
            {
                var installType = TransactionConfig.Program.InstallType;
                var environment = TransactionConfig.Transaction.RunningEnvironment;
                var machineTypeID = TransactionConfig.Transaction.MachineTypeID;
                var programID = transactionRequest.System.ProgramID.PadLeft(8, '0');
                var businessID = transactionRequest.Transaction.BusinessID.PadLeft(3, '0');
                var transactionID = transactionRequest.Transaction.TransactionID.PadLeft(6, '0');
                var functionID = transactionRequest.Transaction.FunctionID.PadLeft(4, '0');
                var tokenID = TransactionConfig.Program.ClientTokenID.Substring(0, 6).PadLeft(6, '0');
                var requestTime = DateTime.Now.ToString("HHmmss");

                transactionRequest.RequestID = $"{installType}{environment}{programID}{businessID}{transactionID}{functionID}{machineTypeID}{tokenID}{requestTime}";

                var client = new RestClient();
                var restRequest = new RestRequest(transactionInfo.RoutingCommandUri, Method.Post);
                restRequest.AddStringBody(JsonConvert.SerializeObject(transactionRequest), DataFormat.Json);

                restRequest.AddHeader("Content-Type", "application/json");
                restRequest.AddHeader("cache-control", "no-cache");
                restRequest.AddHeader("ClientTag", TransactionConfig.ClientTag);

                var restResponse = await client.ExecuteAsync(restRequest);
                if (restResponse != null && restResponse.StatusCode != HttpStatusCode.NotFound && restResponse.ResponseStatus == ResponseStatus.Completed)
                {
                    switch (transactionInfo.ReturnType)
                    {
                        case "Xml":
                        case "Scalar":
                        case "NonQuery":
                            transactionContent = restResponse.Content.ToStringSafe();
                            break;
                        default:
                            var content = restResponse.Content;
                            if (content != null)
                            {
                                transactionResponse = JsonConvert.DeserializeObject<TransactionResponse>(content)!;
                            }
                            break;
                    }
                }
                else
                {
                    if (restResponse != null)
                    {
                        var responseStatus = restResponse.ResponseStatus;
                        var statusCode = restResponse.StatusCode;

                        transactionResponse.ExceptionText = $"TransactionRoute 응답 확인 필요 {statusCode}|{responseStatus}|{restResponse.ErrorMessage}";
                    }
                    else
                    {
                        transactionResponse.ExceptionText = $"TransactionRoute 연결 확인 필요";
                    }
                }
            }
            catch (Exception exception)
            {
                transactionResponse.ExceptionText = $"TransactionRoute 예외 확인 필요 {exception.Message}";
            }

            result = new(transactionResponse, transactionContent);
            return result;
        }

        public async Task<ApplicationResponse> ApplicationRequest(TransactionRequest request, TransactionResponse response, TransactionInfo? transactionInfo, TransactionObject transactionObject, List<Model> businessModels, List<ModelInputContract> inputContracts, List<ModelOutputContract> outputContracts, ApplicationResponse applicationResponse)
        {
            if (transactionInfo != null)
            {
                switch (transactionInfo.CommandType)
                {
                    case "C":
                    case "T":
                    case "D":
                    case "A":
                    case "F":
                    case "P":
                        applicationResponse = await DataTransactionAsync(request, response, transactionInfo, transactionObject, businessModels, inputContracts, outputContracts);
                        break;
                    case "S":
                        applicationResponse = await SequentialDataTransactionAsync(request, response, transactionInfo, transactionObject, businessModels, inputContracts, outputContracts);
                        if (string.IsNullOrEmpty(applicationResponse.ExceptionText) == true)
                        {
                            applicationResponse = SequentialResultContractValidation(applicationResponse, request, response, transactionInfo, transactionObject, businessModels, outputContracts);
                        }
                        break;
                    case "R":
                        applicationResponse = new ApplicationResponse();
                        if (transactionInfo != null)
                        {
                            var applicationID = request.System.ProgramID;
                            var projectID = request.Transaction.BusinessID;
                            var transactionID = request.Transaction.TransactionID;

                            var dummyFileDirectory = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "..", "tmp", GlobalConfiguration.ApplicationID, "dummyfile");
                            if (Directory.Exists(dummyFileDirectory) == false)
                            {
                                Directory.CreateDirectory(dummyFileDirectory);
                            }

                            var dummyFile = PathExtensions.Combine(applicationID, projectID, transactionID, transactionInfo.ServiceID + ".dat");
                            var dummyFilePath = PathExtensions.Combine(dummyFileDirectory, dummyFile);
                            if (File.Exists(dummyFilePath) == false)
                            {
                                applicationResponse.ExceptionText = $"DummyFile: {dummyFile} 확인 필요";
                            }
                            else
                            {
                                var dummyData = File.ReadAllText(dummyFilePath);
                                switch ((ExecuteDynamicTypeObject)Enum.Parse(typeof(ExecuteDynamicTypeObject), transactionObject.ReturnType))
                                {
                                    case ExecuteDynamicTypeObject.Json:
                                        applicationResponse.ResultMeta = new List<string>();
                                        applicationResponse.ResultJson = dummyData;
                                        break;
                                    case ExecuteDynamicTypeObject.Scalar:
                                        applicationResponse.ResultObject = dummyData;
                                        break;
                                    case ExecuteDynamicTypeObject.NonQuery:
                                        applicationResponse.ResultInteger = dummyData.IsInteger() == true ? int.Parse(dummyData) : 0;
                                        break;
                                    case ExecuteDynamicTypeObject.SQLText:
                                        applicationResponse.ResultJson = dummyData;
                                        break;
                                    case ExecuteDynamicTypeObject.SchemeOnly:
                                        applicationResponse.ResultJson = dummyData;
                                        break;
                                    case ExecuteDynamicTypeObject.CodeHelp:
                                        applicationResponse.ResultJson = dummyData;
                                        break;
                                    case ExecuteDynamicTypeObject.Xml:
                                        applicationResponse.ResultObject = dummyData;
                                        break;
                                    case ExecuteDynamicTypeObject.DynamicJson:
                                        applicationResponse.ResultJson = dummyData;
                                        break;
                                }

                                applicationResponse = DummyDataTransaction(request, response, transactionInfo, transactionObject, businessModels, inputContracts, outputContracts, applicationResponse);
                            }
                        }
                        else
                        {
                            applicationResponse.ExceptionText = "transactionInfo 확인 필요";
                        }
                        break;
                    default:
                        applicationResponse = new ApplicationResponse();
                        applicationResponse.ExceptionText = "CommandType 확인 필요";
                        break;
                }
            }
            else
            {
                applicationResponse.ExceptionText = "transactionInfo 확인 필요";
            }

            return applicationResponse;
        }

        public string? DecryptInputData(string inputData, string decrptCode)
        {
            string? result;
            if (decrptCode.ParseBool() == true)
            {
                result = LZStringHelper.DecompressFromBase64(inputData);
            }
            else
            {
                result = inputData;
            }

            return result;
        }

        public ApplicationResponse SequentialResultContractValidation(ApplicationResponse applicationResponse, TransactionRequest request, TransactionResponse response, TransactionInfo transactionInfo, TransactionObject transactionObject, List<Model> businessModels, List<ModelOutputContract> outputContracts)
        {
            var outputs = JsonConvert.DeserializeObject<List<DataMapItem>>(applicationResponse.ResultJson);

            if (outputs != null && outputContracts.Count > 0)
            {
                if (outputContracts.Where(p => p.Type == "Dynamic").Count() > 0)
                {
                }
                else
                {
                    var additionCount = outputContracts.Where(p => p.Type == "Addition").Count();
                    var disposeCount = outputContracts.Where(p => p.BaseFieldRelation?.DisposeResult == true).Count();
                    if ((outputContracts.Count - disposeCount - additionCount + (additionCount > 0 ? 1 : 0)) != outputs.Count)
                    {
                        applicationResponse.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 출력 모델 개수 및 SequentialResultContractValidation 확인 필요, 계약 건수 - '{outputContracts.Count}', 응답 건수 - '{outputs.Count}'";
                        return applicationResponse;
                    }

                    var lastIndex = outputs.Count - 1;
                    for (var i = 0; i < outputs.Count; i++)
                    {
                        var output = outputs[i];
                        var outputContract = outputContracts[i];
                        var model = businessModels.GetBusinessModel(outputContract.ModelID);

                        if (model == null && outputContract.ModelID != "Unknown" && outputContract.ModelID != "Dynamic")
                        {
                            applicationResponse.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{outputContract.ModelID}' 출력 모델 ID가 계약에 있는지 확인";
                            return applicationResponse;
                        }

                        var responseData = new DataMapItem();
                        responseData.FieldID = output.FieldID;

                        if (additionCount > 0 && i == lastIndex)
                        {
                            continue;
                        }

                        dynamic tempParseJson;
                        if (model == null)
                        {
                            if (outputContract.ModelID == "Unknown")
                            {
                                if (outputContract.Type == "Form")
                                {
                                    tempParseJson = JObject.Parse(output.Value.ToStringSafe());
                                    var jObject = (JObject)tempParseJson;
                                    foreach (var property in jObject.Properties())
                                    {
                                        if (outputContract.Fields.Contains(property.Name) == false)
                                        {
                                            applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                            return applicationResponse;
                                        }
                                    }
                                }
                                else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                {
                                    tempParseJson = JArray.Parse(output.Value.ToStringSafe());
                                    if (tempParseJson.Count > 0)
                                    {
                                        var jObject = (JObject)tempParseJson.First;
                                        foreach (var property in jObject.Properties())
                                        {
                                            if (outputContract.Fields.Contains(property.Name) == false)
                                            {
                                                applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                return applicationResponse;
                                            }
                                        }
                                    }
                                }
                                else if (outputContract.Type == "Chart")
                                {
                                    tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                                }
                                else if (outputContract.Type == "Dynamic")
                                {
                                    tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                                }
                            }
                            else if (outputContract.ModelID == "Dynamic")
                            {
                                if (outputContract.Type == "Form")
                                {
                                    tempParseJson = JObject.Parse(output.Value.ToStringSafe());
                                }
                                else if (outputContract.Type == "Grid")
                                {
                                    tempParseJson = JArray.Parse(output.Value.ToStringSafe());
                                }
                                else if (outputContract.Type == "Chart")
                                {
                                    tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                                }
                                else if (outputContract.Type == "DataSet")
                                {
                                    tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                                }
                                else if (outputContract.Type == "Dynamic")
                                {
                                    tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                                }
                            }
                        }
                        else
                        {
                            if (outputContract.Type == "Form")
                            {
                                tempParseJson = JObject.Parse(output.Value.ToStringSafe());
                                var jObject = (JObject)tempParseJson;
                                foreach (var property in jObject.Properties())
                                {
                                    if (model.Columns.IsContain(property.Name) == false)
                                    {
                                        applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                        return applicationResponse;
                                    }
                                }
                            }
                            else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                            {
                                tempParseJson = JArray.Parse(output.Value.ToStringSafe());
                                if (tempParseJson.Count > 0)
                                {
                                    var jObject = (JObject)tempParseJson.First;
                                    foreach (var property in jObject.Properties())
                                    {
                                        if (model.Columns.IsContain(property.Name) == false)
                                        {
                                            applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                            return applicationResponse;
                                        }
                                    }
                                }
                            }
                            else if (outputContract.Type == "Chart")
                            {
                                tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                            }
                            else if (outputContract.Type == "Dynamic")
                            {
                                tempParseJson = JToken.Parse(output.Value.ToStringSafe());
                            }
                        }
                    }
                }
            }

            return applicationResponse;
        }

        public async Task<ApplicationResponse> SequentialDataTransactionAsync(TransactionRequest request, TransactionResponse response, TransactionInfo transactionInfo, TransactionObject transactionObject, List<Model> businessModels, List<ModelInputContract> inputContracts, List<ModelOutputContract> outputContracts)
        {
            var applicationResponse = new ApplicationResponse();
            foreach (var sequentialOption in transactionInfo.SequentialOptions)
            {
                var sequentialinputContracts = new List<ModelInputContract>();
                foreach (var inputIdex in sequentialOption.ServiceInputFields)
                {
                    sequentialinputContracts.Add(inputContracts[inputIdex]);
                }

                var sequentialOutputContracts = new List<ModelOutputContract>();
                foreach (var modelOutputContract in sequentialOption.ServiceOutputs)
                {
                    sequentialOutputContracts.Add(modelOutputContract);
                }

                applicationResponse = await SequentialRequestDataTransactionAsync(request, transactionObject, sequentialOption, sequentialinputContracts, sequentialOutputContracts);

                if (string.IsNullOrEmpty(applicationResponse.ExceptionText) == false)
                {
                    return applicationResponse;
                }

                var transactionID = string.IsNullOrEmpty(sequentialOption.TransactionID) == true ? request.Transaction.TransactionID : sequentialOption.TransactionID;
                var serviceID = string.IsNullOrEmpty(sequentialOption.ServiceID) == true ? transactionObject.ServiceID : sequentialOption.ServiceID;

                response.Result = new ResultType();
                response.Result.DataSet = new List<DataMapItem>();

                if (transactionInfo.ReturnType == "Json")
                {
                    var outputs = JsonConvert.DeserializeObject<List<DataMapItem>>(applicationResponse.ResultJson);
                    if (outputs != null)
                    {
                        if (sequentialOption.ResultHandling == "ResultSet")
                        {
                            #region ResultSet

                            if (sequentialOutputContracts.Count > 0)
                            {
                                if (sequentialOutputContracts.Where(p => p.Type == "Dynamic").Count() > 0)
                                {
                                    for (var i = 0; i < outputs.Count; i++)
                                    {
                                        var output = outputs[i];
                                        dynamic outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        var responseData = new DataMapItem();
                                        responseData.FieldID = output.FieldID;
                                        responseData.Value = outputJson;
                                        response.Result.DataSet.Add(responseData);
                                    }
                                }
                                else
                                {
                                    var additionCount = sequentialOutputContracts.Where(p => p.Type == "Addition").Count();
                                    var disposeCount = sequentialOutputContracts.Where(p => p.BaseFieldRelation?.DisposeResult == true).Count();
                                    if ((sequentialOutputContracts.Count - disposeCount - additionCount + (additionCount > 0 ? 1 : 0)) != outputs.Count)
                                    {
                                        applicationResponse.ExceptionText = $"'{transactionID}|{serviceID}' 거래 입력에 출력 모델 개수 및 SequentialDataTransactionAsync 확인 필요, 계약 건수 - '{sequentialOutputContracts.Count}', 응답 건수 - '{outputs.Count}'";
                                        return applicationResponse;
                                    }

                                    var lastIndex = outputs.Count - 1;
                                    for (var i = 0; i < outputs.Count; i++)
                                    {
                                        var output = outputs[i];
                                        var outputContract = sequentialOutputContracts[i];
                                        var model = businessModels.GetBusinessModel(outputContract.ModelID);
                                        if (model == null && outputContract.ModelID != "Unknown" && outputContract.ModelID != "Dynamic")
                                        {
                                            applicationResponse.ExceptionText = $"'{transactionID}|{serviceID}' 거래 입력에 '{outputContract.ModelID}' 출력 모델 ID가 계약에 있는지 확인";
                                            return applicationResponse;
                                        }

                                        dynamic? outputJson = null;
                                        var responseData = new DataMapItem();
                                        responseData.FieldID = output.FieldID;

                                        if (additionCount > 0 && i == lastIndex)
                                        {
                                            try
                                            {
                                                var messagesJson = JArray.Parse(output.Value.ToStringSafe());
                                                for (var j = 0; j < messagesJson.Count; j++)
                                                {
                                                    var adiMessage = new Addition();
                                                    adiMessage.Type = "F"; // S: System, P: Program, F: Feature
                                                    adiMessage.Code = messagesJson[j]["MessageCode"].ToStringSafe();
                                                    adiMessage.Text = messagesJson[j]["MessageText"].ToStringSafe();
                                                    response.Message.Additions.Add(adiMessage);
                                                }
                                            }
                                            catch (Exception exception)
                                            {
                                                var adiMessage = new Addition();
                                                adiMessage.Type = "P"; // S: System, P: Program, F: Feature
                                                adiMessage.Code = "E001";
                                                adiMessage.Text = exception.ToMessage();
                                                response.Message.Additions.Add(adiMessage);

                                                logger.Warning("[{LogCategory}] [{GlobalID}] " + adiMessage.Text, "Transaction/ADI_MSG", request.Transaction.GlobalID);
                                            }
                                            continue;
                                        }

                                        if (ModuleConfiguration.IsDataMasking == true && (ModuleConfiguration.MaskingMethod == "Syn" || ModuleConfiguration.MaskingMethod == "Aes"))
                                        {
                                            var correlationID = response.CorrelationID;
                                            foreach (var masking in outputContract.Maskings)
                                            {
                                                if (outputContract.Type == "Form")
                                                {
                                                    outputJson = JObject.Parse(output.Value.ToStringSafe());
                                                    var jObject = (JObject)outputJson;
                                                    SetDataMasking(correlationID, masking, jObject);
                                                    output.Value = outputJson;
                                                }
                                                else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                                {
                                                    outputJson = JArray.Parse(output.Value.ToStringSafe());
                                                    if (outputJson.Count > 0)
                                                    {
                                                        foreach (JObject jObject in outputJson)
                                                        {
                                                            SetDataMasking(correlationID, masking, jObject);
                                                            output.Value = outputJson;
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        if (model == null)
                                        {
                                            if (outputContract.ModelID == "Unknown")
                                            {
                                                if (outputContract.Type == "Form")
                                                {
                                                    outputJson = JObject.Parse(output.Value.ToStringSafe());
                                                    var jObject = (JObject)outputJson;
                                                    foreach (var property in jObject.Properties())
                                                    {
                                                        if (outputContract.Fields.Contains(property.Name) == false)
                                                        {
                                                            applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                            return applicationResponse;
                                                        }
                                                    }
                                                }
                                                else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                                {
                                                    outputJson = JArray.Parse(output.Value.ToStringSafe());
                                                    if (outputJson.Count > 0)
                                                    {
                                                        var jObject = (JObject)outputJson.First;
                                                        foreach (var property in jObject.Properties())
                                                        {
                                                            if (outputContract.Fields.Contains(property.Name) == false)
                                                            {
                                                                applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                                return applicationResponse;
                                                            }
                                                        }
                                                    }
                                                }
                                                else if (outputContract.Type == "Chart")
                                                {
                                                    outputJson = JToken.Parse(output.Value.ToStringSafe());
                                                }
                                                else if (outputContract.Type == "Dynamic")
                                                {
                                                    outputJson = JToken.Parse(output.Value.ToStringSafe());
                                                }
                                            }
                                            else if (outputContract.ModelID == "Dynamic")
                                            {
                                                if (outputContract.Type == "Form")
                                                {
                                                    outputJson = JObject.Parse(output.Value.ToStringSafe());
                                                }
                                                else if (outputContract.Type == "Grid")
                                                {
                                                    outputJson = JArray.Parse(output.Value.ToStringSafe());
                                                }
                                                else if (outputContract.Type == "Chart")
                                                {
                                                    outputJson = JToken.Parse(output.Value.ToStringSafe());
                                                }
                                                else if (outputContract.Type == "DataSet")
                                                {
                                                    outputJson = JToken.Parse(output.Value.ToStringSafe());
                                                }
                                                else if (outputContract.Type == "Dynamic")
                                                {
                                                    outputJson = JToken.Parse(output.Value.ToStringSafe());
                                                }
                                            }
                                        }
                                        else
                                        {
                                            if (outputContract.Type == "Form")
                                            {
                                                outputJson = JObject.Parse(output.Value.ToStringSafe());
                                                var jObject = (JObject)outputJson;
                                                foreach (var property in jObject.Properties())
                                                {
                                                    if (model.Columns.IsContain(property.Name) == false)
                                                    {
                                                        applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                        return applicationResponse;
                                                    }
                                                }
                                            }
                                            else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                            {
                                                outputJson = JArray.Parse(output.Value.ToStringSafe());
                                                if (outputJson.Count > 0)
                                                {
                                                    var jObject = (JObject)outputJson.First;
                                                    foreach (var property in jObject.Properties())
                                                    {
                                                        if (model.Columns.IsContain(property.Name) == false)
                                                        {
                                                            applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                            return applicationResponse;
                                                        }
                                                    }
                                                }
                                            }
                                            else if (outputContract.Type == "Chart")
                                            {
                                                outputJson = JToken.Parse(output.Value.ToStringSafe());
                                            }
                                            else if (outputContract.Type == "Dynamic")
                                            {
                                                outputJson = JToken.Parse(output.Value.ToStringSafe());
                                            }
                                        }

                                        responseData.Value = outputJson;
                                        response.Result.DataSet.AddUnique(sequentialOption.ResultOutputFields[i], responseData);
                                    }
                                }
                            }

                            #endregion
                        }
                        else if (sequentialOption.ResultHandling == "FieldMapping")
                        {
                            #region FieldMapping

                            if (outputs.Count() > 0)
                            {
                                foreach (var inputIdex in sequentialOption.TargetInputFields)
                                {
                                    var modelInputContract = inputContracts[inputIdex];
                                    MappingTransactionInputsValue(transactionObject, inputIdex, modelInputContract, JObject.Parse(outputs[0].Value.ToStringSafe()));
                                }
                            }

                            #endregion
                        }
                    }
                    else
                    {
                        applicationResponse.ExceptionText = $"'{transactionID}|{serviceID}' 거래 응답 없음";
                        return applicationResponse;
                    }
                }
                else
                {
                    applicationResponse.ExceptionText = $"'{transactionID}|{serviceID}' 순차 처리 되는 거래 응답은 Json만 지원";
                    return applicationResponse;
                }
            }

            return applicationResponse;
        }

        public ApplicationResponse DummyDataTransaction(TransactionRequest request, TransactionResponse response, TransactionInfo transactionInfo, TransactionObject transactionObject, List<Model> businessModels, List<ModelInputContract> inputContracts, List<ModelOutputContract> outputContracts, ApplicationResponse applicationResponse)
        {
            if (string.IsNullOrEmpty(applicationResponse.ExceptionText) == false)
            {
                return applicationResponse;
            }

            response.Result = new ResultType();
            response.Result.DataSet = new List<DataMapItem>();

            switch (transactionInfo.ReturnType)
            {
                case "DynamicJson":
                    response.Result.DataSet.Add(new DataMapItem()
                    {
                        FieldID = "DynamicJson",
                        Value = JsonConvert.DeserializeObject<dynamic>(applicationResponse.ResultJson)
                    });

                    break;
                case "CodeHelp":
                    var responseCodeObject = JsonConvert.DeserializeObject<ResponseCodeObject>(applicationResponse.ResultJson);
                    var input = request.PayLoad?.DataMapSet?[0].Where(p => p.FieldID == "CodeHelpID").FirstOrDefault();

                    response.Result.DataSet.Add(new DataMapItem()
                    {
                        FieldID = input == null ? "CodeHelp" : input.Value.ToStringSafe(),
                        Value = responseCodeObject
                    });

                    break;
                case "SchemeOnly":
                    var resultJson = JObject.Parse(applicationResponse.ResultJson);
                    foreach (var property in resultJson.Properties())
                    {
                        response.Result.DataSet.Add(new DataMapItem()
                        {
                            FieldID = property.Name,
                            Value = property.Value.ToString(Formatting.None)
                        });
                    }

                    break;
                case "SQLText":
                    var sqlJson = JObject.Parse(applicationResponse.ResultJson);
                    var sqlData = new DataMapItem();
                    sqlData.FieldID = "SQLText";
                    sqlData.Value = sqlJson;
                    response.Result.DataSet.Add(sqlData);

                    break;
                case "Json":
                    var outputs = JsonConvert.DeserializeObject<List<DataMapItem>>(applicationResponse.ResultJson);
                    if (outputs != null && outputContracts.Count > 0)
                    {
                        if (outputContracts.Where(p => p.Type == "Dynamic").Count() > 0)
                        {
                            for (var i = 0; i < outputs.Count; i++)
                            {
                                var output = outputs[i];
                                dynamic outputJson = JToken.Parse(output.Value.ToStringSafe());
                                var responseData = new DataMapItem();
                                responseData.FieldID = output.FieldID;
                                responseData.Value = outputJson;
                                response.Result.DataSet.Add(responseData);
                            }
                        }
                        else
                        {
                            var additionCount = outputContracts.Where(p => p.Type == "Addition").Count();
                            var disposeCount = outputContracts.Where(p => p.BaseFieldRelation?.DisposeResult == true).Count();
                            if ((outputContracts.Count - disposeCount - additionCount + (additionCount > 0 ? 1 : 0)) != outputs.Count)
                            {
                                applicationResponse.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 출력 모델 개수 및 DataTransactionAsync 확인 필요, 계약 건수 - '{outputContracts.Count}', 응답 건수 - '{outputs.Count}'";
                                return applicationResponse;
                            }

                            var lastIndex = outputs.Count - 1;
                            for (var i = 0; i < outputs.Count; i++)
                            {
                                var output = outputs[i];
                                var outputContract = outputContracts[i];
                                var model = businessModels.GetBusinessModel(outputContract.ModelID);
                                if (model == null && outputContract.ModelID != "Unknown" && outputContract.ModelID != "Dynamic")
                                {
                                    applicationResponse.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{outputContract.ModelID}' 출력 모델 ID가 계약에 있는지 확인";
                                    return applicationResponse;
                                }

                                dynamic? outputJson = null;
                                var responseData = new DataMapItem();
                                responseData.FieldID = output.FieldID;

                                if (additionCount > 0 && i == lastIndex)
                                {
                                    try
                                    {
                                        var messagesJson = JArray.Parse(output.Value.ToStringSafe());
                                        for (var j = 0; j < messagesJson.Count; j++)
                                        {
                                            var adiMessage = new Addition();
                                            adiMessage.Code = messagesJson[j]["MessageCode"].ToStringSafe();
                                            adiMessage.Text = messagesJson[j]["MessageText"].ToStringSafe();
                                            response.Message.Additions.Add(adiMessage);
                                        }
                                    }
                                    catch (Exception exception)
                                    {
                                        var adiMessage = new Addition();
                                        adiMessage.Code = "E001";
                                        adiMessage.Text = exception.ToMessage();
                                        logger.Warning("[{LogCategory}] [{GlobalID}] " + adiMessage.Text, "Transaction/ADI_MSG", request.Transaction.GlobalID);
                                        response.Message.Additions.Add(adiMessage);
                                    }
                                    continue;
                                }

                                if (ModuleConfiguration.IsDataMasking == true && (ModuleConfiguration.MaskingMethod == "Syn" || ModuleConfiguration.MaskingMethod == "Aes"))
                                {
                                    var correlationID = response.CorrelationID;
                                    foreach (var masking in outputContract.Maskings)
                                    {
                                        if (outputContract.Type == "Form")
                                        {
                                            outputJson = JObject.Parse(output.Value.ToStringSafe());
                                            var jObject = (JObject)outputJson;
                                            SetDataMasking(correlationID, masking, jObject);
                                            output.Value = outputJson;
                                        }
                                        else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                        {
                                            outputJson = JArray.Parse(output.Value.ToStringSafe());
                                            if (outputJson.Count > 0)
                                            {
                                                foreach (JObject jObject in outputJson)
                                                {
                                                    SetDataMasking(correlationID, masking, jObject);
                                                    output.Value = outputJson;
                                                }
                                            }
                                        }
                                    }
                                }

                                if (model == null)
                                {
                                    if (outputContract.ModelID == "Unknown")
                                    {
                                        if (outputContract.Type == "Form")
                                        {
                                            outputJson = JObject.Parse(output.Value.ToStringSafe());
                                            var jObject = (JObject)outputJson;
                                            foreach (var property in jObject.Properties())
                                            {
                                                if (outputContract.Fields.Contains(property.Name) == false)
                                                {
                                                    applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                    return applicationResponse;
                                                }
                                            }
                                        }
                                        else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                        {
                                            outputJson = JArray.Parse(output.Value.ToStringSafe());
                                            if (outputJson.Count > 0)
                                            {
                                                var jObject = (JObject)outputJson.First;
                                                foreach (var property in jObject.Properties())
                                                {
                                                    if (outputContract.Fields.Contains(property.Name) == false)
                                                    {
                                                        applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                        return applicationResponse;
                                                    }
                                                }
                                            }
                                        }
                                        else if (outputContract.Type == "Chart")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Dynamic")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                    }
                                    else if (outputContract.ModelID == "Dynamic")
                                    {
                                        if (outputContract.Type == "Form")
                                        {
                                            outputJson = JObject.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Grid")
                                        {
                                            outputJson = JArray.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Chart")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "DataSet")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Dynamic")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                    }
                                }
                                else
                                {
                                    if (outputContract.Type == "Form")
                                    {
                                        outputJson = JObject.Parse(output.Value.ToStringSafe());
                                        var jObject = (JObject)outputJson;
                                        foreach (var property in jObject.Properties())
                                        {
                                            if (model.Columns.IsContain(property.Name) == false)
                                            {
                                                applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                return applicationResponse;
                                            }
                                        }
                                    }
                                    else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                    {
                                        outputJson = JArray.Parse(output.Value.ToStringSafe());
                                        if (outputJson.Count > 0)
                                        {
                                            var jObject = (JObject)outputJson.First;
                                            foreach (var property in jObject.Properties())
                                            {
                                                if (model.Columns.IsContain(property.Name) == false)
                                                {
                                                    applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                    return applicationResponse;
                                                }
                                            }
                                        }
                                    }
                                    else if (outputContract.Type == "Chart")
                                    {
                                        outputJson = JToken.Parse(output.Value.ToStringSafe());
                                    }
                                    else if (outputContract.Type == "Dynamic")
                                    {
                                        outputJson = JToken.Parse(output.Value.ToStringSafe());
                                    }
                                }

                                responseData.Value = outputJson;
                                response.Result.DataSet.Add(responseData);
                            }
                        }
                    }
                    break;
            }

            return applicationResponse;
        }

        public async Task<ApplicationResponse> DataTransactionAsync(TransactionRequest request, TransactionResponse response, TransactionInfo transactionInfo, TransactionObject transactionObject, List<Model> businessModels, List<ModelInputContract> inputContracts, List<ModelOutputContract> outputContracts)
        {
            var applicationResponse = await RequestDataTransactionAsync(request, transactionInfo, transactionObject, inputContracts, outputContracts);

            if (string.IsNullOrEmpty(applicationResponse.ExceptionText) == false)
            {
                return applicationResponse;
            }

            response.Result = new ResultType();
            response.Result.DataSet = new List<DataMapItem>();

            switch (transactionInfo.ReturnType)
            {
                case "DynamicJson":
                    response.Result.DataSet.Add(new DataMapItem()
                    {
                        FieldID = "DynamicJson",
                        Value = JsonConvert.DeserializeObject<dynamic>(applicationResponse.ResultJson)
                    });

                    break;
                case "CodeHelp":
                    var responseCodeObject = JsonConvert.DeserializeObject<ResponseCodeObject>(applicationResponse.ResultJson);
                    var input = request.PayLoad?.DataMapSet?[0].Where(p => p.FieldID == "CodeHelpID").FirstOrDefault();

                    response.Result.DataSet.Add(new DataMapItem()
                    {
                        FieldID = input == null ? "CodeHelp" : input.Value.ToStringSafe(),
                        Value = responseCodeObject
                    });

                    break;
                case "SchemeOnly":
                    var resultJson = JObject.Parse(applicationResponse.ResultJson);
                    foreach (var property in resultJson.Properties())
                    {
                        response.Result.DataSet.Add(new DataMapItem()
                        {
                            FieldID = property.Name,
                            Value = property.Value.ToString(Formatting.None)
                        });
                    }

                    break;
                case "SQLText":
                    var sqlJson = JObject.Parse(applicationResponse.ResultJson);
                    var sqlData = new DataMapItem();
                    sqlData.FieldID = "SQLText";
                    sqlData.Value = sqlJson;
                    response.Result.DataSet.Add(sqlData);

                    break;
                case "Json":
                    var outputs = JsonConvert.DeserializeObject<List<DataMapItem>>(applicationResponse.ResultJson);
                    if (outputs != null && outputContracts.Count > 0)
                    {
                        if (outputContracts.Where(p => p.Type == "Dynamic").Count() > 0)
                        {
                            for (var i = 0; i < outputs.Count; i++)
                            {
                                var output = outputs[i];
                                dynamic outputJson = JToken.Parse(output.Value.ToStringSafe());
                                var responseData = new DataMapItem();
                                responseData.FieldID = output.FieldID;
                                responseData.Value = outputJson;
                                response.Result.DataSet.Add(responseData);
                            }
                        }
                        else
                        {
                            var additionCount = outputContracts.Where(p => p.Type == "Addition").Count();
                            var disposeCount = outputContracts.Where(p => p.BaseFieldRelation?.DisposeResult == true).Count();
                            if ((outputContracts.Count - disposeCount - additionCount + (additionCount > 0 ? 1 : 0)) != outputs.Count)
                            {
                                applicationResponse.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 출력 모델 개수 및 DataTransactionAsync 확인 필요, 계약 건수 - '{outputContracts.Count}', 응답 건수 - '{outputs.Count}'";
                                return applicationResponse;
                            }

                            var lastIndex = outputs.Count - 1;
                            for (var i = 0; i < outputs.Count; i++)
                            {
                                var output = outputs[i];
                                var outputContract = outputContracts[i];
                                var model = businessModels.GetBusinessModel(outputContract.ModelID);
                                if (model == null && outputContract.ModelID != "Unknown" && outputContract.ModelID != "Dynamic")
                                {
                                    applicationResponse.ExceptionText = $"'{transactionObject.TransactionID}|{request.Transaction.FunctionID}' 거래 입력에 '{outputContract.ModelID}' 출력 모델 ID가 계약에 있는지 확인";
                                    return applicationResponse;
                                }

                                dynamic? outputJson = null;
                                var responseData = new DataMapItem();
                                responseData.FieldID = output.FieldID;

                                if (additionCount > 0 && i == lastIndex)
                                {
                                    try
                                    {
                                        var messagesJson = JArray.Parse(output.Value.ToStringSafe());
                                        for (var j = 0; j < messagesJson.Count; j++)
                                        {
                                            var adiMessage = new Addition();
                                            adiMessage.Code = messagesJson[j]["MessageCode"].ToStringSafe();
                                            adiMessage.Text = messagesJson[j]["MessageText"].ToStringSafe();
                                            response.Message.Additions.Add(adiMessage);
                                        }
                                    }
                                    catch (Exception exception)
                                    {
                                        var adiMessage = new Addition();
                                        adiMessage.Code = "E001";
                                        adiMessage.Text = exception.ToMessage();
                                        logger.Warning("[{LogCategory}] [{GlobalID}] " + adiMessage.Text, "Transaction/ADI_MSG", request.Transaction.GlobalID);
                                        response.Message.Additions.Add(adiMessage);
                                    }
                                    continue;
                                }

                                if (ModuleConfiguration.IsDataMasking == true && (ModuleConfiguration.MaskingMethod == "Syn" || ModuleConfiguration.MaskingMethod == "Aes"))
                                {
                                    var correlationID = response.CorrelationID;
                                    foreach (var masking in outputContract.Maskings)
                                    {
                                        if (outputContract.Type == "Form")
                                        {
                                            outputJson = JObject.Parse(output.Value.ToStringSafe());
                                            var jObject = (JObject)outputJson;
                                            SetDataMasking(correlationID, masking, jObject);
                                            output.Value = outputJson;
                                        }
                                        else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                        {
                                            outputJson = JArray.Parse(output.Value.ToStringSafe());
                                            if (outputJson.Count > 0)
                                            {
                                                foreach (JObject jObject in outputJson)
                                                {
                                                    SetDataMasking(correlationID, masking, jObject);
                                                    output.Value = outputJson;
                                                }
                                            }
                                        }
                                    }
                                }

                                if (model == null)
                                {
                                    if (outputContract.ModelID == "Unknown")
                                    {
                                        if (outputContract.Type == "Form")
                                        {
                                            outputJson = JObject.Parse(output.Value.ToStringSafe());
                                            var jObject = (JObject)outputJson;
                                            foreach (var property in jObject.Properties())
                                            {
                                                if (outputContract.Fields.Contains(property.Name) == false)
                                                {
                                                    applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                    return applicationResponse;
                                                }
                                            }
                                        }
                                        else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                        {
                                            outputJson = JArray.Parse(output.Value.ToStringSafe());
                                            if (outputJson.Count > 0)
                                            {
                                                var jObject = (JObject)outputJson.First;
                                                foreach (var property in jObject.Properties())
                                                {
                                                    if (outputContract.Fields.Contains(property.Name) == false)
                                                    {
                                                        applicationResponse.ExceptionText = $"{outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                        return applicationResponse;
                                                    }
                                                }
                                            }
                                        }
                                        else if (outputContract.Type == "Chart")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Dynamic")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                    }
                                    else if (outputContract.ModelID == "Dynamic")
                                    {
                                        if (outputContract.Type == "Form")
                                        {
                                            outputJson = JObject.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Grid")
                                        {
                                            outputJson = JArray.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Chart")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "DataSet")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                        else if (outputContract.Type == "Dynamic")
                                        {
                                            outputJson = JToken.Parse(output.Value.ToStringSafe());
                                        }
                                    }
                                }
                                else
                                {
                                    if (outputContract.Type == "Form")
                                    {
                                        outputJson = JObject.Parse(output.Value.ToStringSafe());
                                        var jObject = (JObject)outputJson;
                                        foreach (var property in jObject.Properties())
                                        {
                                            if (model.Columns.IsContain(property.Name) == false)
                                            {
                                                applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                return applicationResponse;
                                            }
                                        }
                                    }
                                    else if (outputContract.Type == "Grid" || outputContract.Type == "DataSet")
                                    {
                                        outputJson = JArray.Parse(output.Value.ToStringSafe());
                                        if (outputJson.Count > 0)
                                        {
                                            var jObject = (JObject)outputJson.First;
                                            foreach (var property in jObject.Properties())
                                            {
                                                if (model.Columns.IsContain(property.Name) == false)
                                                {
                                                    applicationResponse.ExceptionText = $"'{model.Name}' {outputContract.Type} 출력 모델에 '{property.Name}' 항목 확인 필요";
                                                    return applicationResponse;
                                                }
                                            }
                                        }
                                    }
                                    else if (outputContract.Type == "Chart")
                                    {
                                        outputJson = JToken.Parse(output.Value.ToStringSafe());
                                    }
                                    else if (outputContract.Type == "Dynamic")
                                    {
                                        outputJson = JToken.Parse(output.Value.ToStringSafe());
                                    }
                                }

                                responseData.Value = outputJson;
                                response.Result.DataSet.Add(responseData);
                            }
                        }
                    }
                    break;
            }

            return applicationResponse;
        }

        public void SetDataMasking(string correlationID, Masking masking, JObject jObject)
        {
            var targetFieldID = masking.TargetFieldID;
            var targetField = jObject[targetFieldID];
            if (targetField != null)
            {
                var targetFieldValue = targetField.ToStringSafe();
                if (ModuleConfiguration.MaskingMethod == "Syn")
                {
                    jObject[targetFieldID + "_$MASKING"] = SynCryptoHelper.Encrypt(targetFieldValue, correlationID);
                }
                else
                {
                    var aesResult = CryptoHelper.AesEncode(targetFieldValue, correlationID);
                    jObject[targetFieldID + "_$MASKING"] = $"{aesResult.iv}|{aesResult.encrypted}";
                }

                var matchPattern = masking.MatchPattern;
                if (string.IsNullOrEmpty(matchPattern) == true)
                {
                    jObject[targetFieldID] = targetFieldValue.Replace(0, targetFieldValue.Length, "".PadLeft(targetFieldValue.Length, ModuleConfiguration.MaskingChar));
                }
                else
                {
                    var regex = new Regex(matchPattern);
                    var matches = regex.Matches(targetFieldValue);
                    foreach (Match match in matches)
                    {
                        targetFieldValue = targetFieldValue.Replace(match.Index, match.Length, "".PadLeft(match.Length, ModuleConfiguration.MaskingChar));
                    }

                    jObject[targetFieldID] = targetFieldValue;
                }
            }
        }

        public void SetInputDefaultValue(DefaultValue defaultValue, DatabaseColumn? column, DataMapItem tempReqInput)
        {
            if (column == null)
            {
                tempReqInput.Value = "";
            }
            else
            {
                switch (column.DataType)
                {
                    case "String":
                        tempReqInput.Value = defaultValue.String;
                        break;
                    case "Int32":
                        tempReqInput.Value = defaultValue.Integer;
                        break;
                    case "Boolean":
                        tempReqInput.Value = defaultValue.Boolean;
                        break;
                    case "DateTime":
                        DateTime dateValue;
                        if (DateTime.TryParseExact(defaultValue.String, "o", CultureInfo.InvariantCulture, DateTimeStyles.None, out dateValue) == true)
                        {
                            tempReqInput.Value = dateValue;
                        }
                        else
                        {
                            tempReqInput.Value = DateTime.Now;
                        }
                        break;
                    default:
                        tempReqInput.Value = "";
                        break;
                }
            }
        }

        public void MappingTransactionInputsValue(TransactionObject transactionObject, int modelInputIndex, ModelInputContract modelInputContract, JObject formOutput)
        {
            var transactInputs = transactionObject.Inputs;
            var inputCount = 0;
            var inputOffset = 0;
            for (var i = 0; i < transactionObject.InputsItemCount.Count; i++)
            {
                inputCount = transactionObject.InputsItemCount[i];

                if (i <= modelInputIndex)
                {
                    break;
                }

                inputOffset = inputOffset + inputCount;
            }

            var inputs = transactInputs.Skip(inputOffset).Take(inputCount).ToList();

            if (modelInputContract.Type == "Row")
            {
                if (inputs.Count > 0)
                {
                    var serviceParameters = inputs[0];

                    foreach (var item in formOutput)
                    {
                        var fieldItem = serviceParameters.Where(p => p.FieldID == item.Key).FirstOrDefault();
                        if (fieldItem != null)
                        {
                            if (item.Value == null)
                            {
                                fieldItem.Value = null;
                            }
                            else
                            {
                                fieldItem.Value = ((JValue)item.Value).Value;
                            }
                        }
                    }
                }
            }
            else if (modelInputContract.Type == "List")
            {
                if (inputs.Count > 0)
                {
                    var findParameters = inputs[0];

                    foreach (var item in formOutput)
                    {
                        var findItem = findParameters.Where(p => p.FieldID == item.Key).FirstOrDefault();
                        if (findItem != null)
                        {
                            for (var i = 0; i < inputs.Count; i++)
                            {
                                var serviceParameters = inputs[i];

                                var fieldItem = serviceParameters.Where(p => p.FieldID == item.Key).FirstOrDefault();
                                if (fieldItem != null)
                                {
                                    if (item.Value == null)
                                    {
                                        fieldItem.Value = null;
                                    }
                                    else
                                    {
                                        fieldItem.Value = ((JValue)item.Value).Value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        public async Task<ApplicationResponse> SequentialRequestDataTransactionAsync(TransactionRequest request, TransactionObject transactionObject, SequentialOption sequentialOption, List<ModelInputContract> inputContracts, List<ModelOutputContract> outputContracts)
        {
            var responseObject = new ApplicationResponse();
            responseObject.Acknowledge = AcknowledgeType.Failure;

            try
            {
                var businessID = string.IsNullOrEmpty(sequentialOption.TransactionProjectID) == true ? request.Transaction.BusinessID : sequentialOption.TransactionProjectID;
                var transactionID = string.IsNullOrEmpty(sequentialOption.TransactionID) == true ? request.Transaction.TransactionID : sequentialOption.TransactionID;
                var serviceID = string.IsNullOrEmpty(sequentialOption.ServiceID) == true ? transactionObject.ServiceID : sequentialOption.ServiceID;

                var transactionApplicationID = transactionObject.TransactionID.Split("|")[0];
                var transactionProjectID = transactionObject.TransactionID.Split("|")[1];

                var routeSegmentID = $"{transactionApplicationID}|{transactionProjectID}|{sequentialOption.CommandType}|{request.Environment}";

                var transactionUserWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
                if (string.IsNullOrEmpty(transactionUserWorkID) == false)
                {
                    routeSegmentID = transactionUserWorkID + "|" + routeSegmentID;
                }

                var messageServerUrl = TransactionMapper.GetRoutingCommandUri(routeSegmentID);

                if (string.IsNullOrEmpty(messageServerUrl) == true)
                {
                    responseObject.ExceptionText = $"routeSegmentID: {routeSegmentID} 환경변수 확인";
                    return responseObject;
                }

                var dynamicRequest = new DynamicRequest();
                dynamicRequest.AccessToken = request.AccessToken;
                dynamicRequest.Action = request.Action;
                dynamicRequest.ClientTag = request.ClientTag;
                dynamicRequest.Environment = request.Environment;
                dynamicRequest.RequestID = request.RequestID;
                dynamicRequest.GlobalID = request.Transaction.GlobalID;
                dynamicRequest.Version = request.Version;
                dynamicRequest.LoadOptions = transactionObject.LoadOptions;
                dynamicRequest.IsTransaction = transactionObject.TransactionScope;
                dynamicRequest.ReturnType = (ExecuteDynamicTypeObject)Enum.Parse(typeof(ExecuteDynamicTypeObject), transactionObject.ReturnType);
                var dynamicObjects = new List<QueryObject>();

                var transactInputs = transactionObject.Inputs;

                var inputOffset = 0;
                var requestInputItems = new Dictionary<string, List<List<TransactField>>>();
                for (var i = 0; i < transactionObject.InputsItemCount.Count; i++)
                {
                    var inputCount = transactionObject.InputsItemCount[i];
                    if (inputCount > 0 && inputContracts.Count > 0)
                    {
                        var inputContract = inputContracts[i];
                        var inputs = transactInputs.Skip(inputOffset).Take(inputCount).ToList();

                        for (var j = 0; j < inputs.Count; j++)
                        {
                            var serviceParameters = inputs[j];

                            var queryObject = new QueryObject();
                            queryObject.QueryID = string.Concat(transactionApplicationID, "|", transactionProjectID, "|", transactionID, "|", serviceID, i.ToString().PadLeft(2, '0'));

                            var baseFieldRelations = new List<BaseFieldRelation?>();
                            var jsonObjectTypes = new List<JsonObjectType>();
                            foreach (var item in outputContracts)
                            {
                                var jsonObjectType = (JsonObjectType)Enum.Parse(typeof(JsonObjectType), item.Type + "Json");
                                jsonObjectTypes.Add(jsonObjectType);

                                if (jsonObjectType == JsonObjectType.AdditionJson)
                                {
                                    queryObject.JsonObject = jsonObjectType;
                                }

                                if (item.BaseFieldRelation != null)
                                {
                                    baseFieldRelations.Add(item.BaseFieldRelation);
                                }
                            }
                            queryObject.JsonObjects = jsonObjectTypes;

                            var parameters = new List<DynamicParameter>();
                            foreach (var item in serviceParameters)
                            {
                                parameters.Append(item.FieldID, (DbType)Enum.Parse(typeof(DbType), item.DataType), item.Value);
                            }

                            queryObject.Parameters = parameters;
                            queryObject.BaseFieldMappings = inputContract.BaseFieldMappings;
                            queryObject.BaseFieldRelations = baseFieldRelations;
                            queryObject.IgnoreResult = inputContract.IgnoreResult;
                            dynamicObjects.Add(queryObject);
                        }
                    }
                    else
                    {
                        var queryObject = new QueryObject();
                        queryObject.QueryID = string.Concat(transactionApplicationID, "|", transactionProjectID, "|", transactionID, "|", serviceID, i.ToString().PadLeft(2, '0'));

                        var baseFieldRelations = new List<BaseFieldRelation?>();
                        var jsonObjectTypes = new List<JsonObjectType>();
                        foreach (var item in outputContracts)
                        {
                            var jsonObjectType = (JsonObjectType)Enum.Parse(typeof(JsonObjectType), item.Type + "Json");
                            jsonObjectTypes.Add(jsonObjectType);

                            if (jsonObjectType == JsonObjectType.AdditionJson)
                            {
                                queryObject.JsonObject = jsonObjectType;
                            }

                            if (item.BaseFieldRelation != null)
                            {
                                baseFieldRelations.Add(item.BaseFieldRelation);
                            }
                        }
                        queryObject.JsonObjects = jsonObjectTypes;
                        queryObject.Parameters = new List<DynamicParameter>();
                        queryObject.BaseFieldMappings = new List<BaseFieldMapping>();
                        queryObject.BaseFieldRelations = baseFieldRelations;
                        queryObject.IgnoreResult = false;
                        dynamicObjects.Add(queryObject);
                    }

                    inputOffset = inputOffset + inputCount;
                }

                dynamicRequest.DynamicObjects = dynamicObjects;
                dynamicRequest.ClientTag = transactionObject.ClientTag;

                var restClient = new RestClient();
                var restRequest = new RestRequest(messageServerUrl, Method.Post);

                restRequest.AddHeader("Content-Type", "application/json");
                restRequest.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                var json = JsonConvert.SerializeObject(dynamicRequest);
                restRequest.AddParameter("application/json", json, ParameterType.RequestBody);

                DynamicResponse? response;
                var restResponse = await restClient.ExecuteAsync(restRequest);

                if (restResponse.StatusCode == HttpStatusCode.OK)
                {
                    var content = restResponse.Content;
                    if (content != null)
                    {
                        if (dynamicRequest.ReturnType == ExecuteDynamicTypeObject.Xml)
                        {
                            response = new DynamicResponse();
                            response.ResultObject = content;
                        }
                        else
                        {
                            response = JsonConvert.DeserializeObject<DynamicResponse>(content);
                            if (response == null)
                            {
                                response = new DynamicResponse();
                            }
                        }

                        responseObject.Acknowledge = response.Acknowledge;

                        if (responseObject.Acknowledge == AcknowledgeType.Success)
                        {
                            switch (dynamicRequest.ReturnType)
                            {
                                case ExecuteDynamicTypeObject.Json:
                                    responseObject.ResultMeta = response.ResultMeta;
                                    responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                    break;
                                case ExecuteDynamicTypeObject.Scalar:
                                    responseObject.ResultObject = response.ResultObject;
                                    break;
                                case ExecuteDynamicTypeObject.NonQuery:
                                    responseObject.ResultInteger = response.ResultInteger;
                                    break;
                                case ExecuteDynamicTypeObject.SQLText:
                                    responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                    break;
                                case ExecuteDynamicTypeObject.SchemeOnly:
                                    responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                    break;
                                case ExecuteDynamicTypeObject.CodeHelp:
                                    responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                    break;
                                case ExecuteDynamicTypeObject.Xml:
                                    responseObject.ResultObject = response.ResultObject as string;
                                    break;
                                case ExecuteDynamicTypeObject.DynamicJson:
                                    responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                    break;
                            }
                        }
                        else
                        {
                            responseObject.ExceptionText = response.ExceptionText;
                        }
                    }
                    else
                    {
                        responseObject.ExceptionText = $"AP X-Requested Response Error: {restResponse.Content}";
                    }
                }
                else
                {
                    responseObject.ExceptionText = $"AP X-Requested Transfort Error: {restResponse.ErrorMessage}";
                }
            }
            catch (Exception exception)
            {
                responseObject.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.Transaction.GlobalID, "N", responseObject.ExceptionText, "Transaction/SequentialRequestDataTransaction", (string error) =>
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + responseObject.ExceptionText, "Transaction/SequentialRequestDataTransaction", request.Transaction.GlobalID);
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + responseObject.ExceptionText, "Transaction/SequentialRequestDataTransaction", request.Transaction.GlobalID);
                }
            }

            return responseObject;
        }

        public async Task<ApplicationResponse> RequestDataTransactionAsync(TransactionRequest request, TransactionInfo transactionInfo, TransactionObject transactionObject, List<ModelInputContract> inputContracts, List<ModelOutputContract> outputContracts)
        {
            var responseObject = new ApplicationResponse();
            responseObject.Acknowledge = AcknowledgeType.Failure;

            try
            {
                var transactionApplicationID = transactionObject.TransactionID.Split("|")[0];
                var transactionProjectID = transactionObject.TransactionID.Split("|")[1];
                var routeSegmentID = $"{transactionApplicationID}|{transactionProjectID}|{request.Transaction.CommandType}|{request.Environment}";

                var transactionUserWorkID = request.LoadOptions?.Get<string>("work-id").ToStringSafe();
                if (string.IsNullOrEmpty(transactionUserWorkID) == false)
                {
                    routeSegmentID = transactionUserWorkID + "|" + routeSegmentID;
                }

                var messageServerUrl = TransactionMapper.GetRoutingCommandUri(routeSegmentID);

                if (string.IsNullOrEmpty(messageServerUrl) == true)
                {
                    responseObject.ExceptionText = $"routeSegmentID: {routeSegmentID} 환경변수 확인";
                    return responseObject;
                }

                var dynamicRequest = new DynamicRequest();
                dynamicRequest.AccessToken = request.AccessToken;
                dynamicRequest.Action = request.Action;
                dynamicRequest.ClientTag = request.ClientTag;
                dynamicRequest.Environment = request.Environment;
                dynamicRequest.RequestID = request.RequestID;
                dynamicRequest.GlobalID = request.Transaction.GlobalID;
                dynamicRequest.Version = request.Version;
                dynamicRequest.LoadOptions = transactionObject.LoadOptions;
                dynamicRequest.IsTransaction = transactionObject.TransactionScope;
                dynamicRequest.ReturnType = (ExecuteDynamicTypeObject)Enum.Parse(typeof(ExecuteDynamicTypeObject), transactionObject.ReturnType);
                var dynamicObjects = new List<QueryObject>();

                var transactInputs = transactionObject.Inputs;

                var inputOffset = 0;
                var requestInputItems = new Dictionary<string, List<List<TransactField>>>();
                for (var i = 0; i < transactionObject.InputsItemCount.Count; i++)
                {
                    var inputCount = transactionObject.InputsItemCount[i];
                    if (inputCount > 0 && inputContracts.Count > 0)
                    {
                        var inputContract = inputContracts[i];
                        var inputs = transactInputs.Skip(inputOffset).Take(inputCount).ToList();

                        for (var j = 0; j < inputs.Count; j++)
                        {
                            var serviceParameters = inputs[j];

                            var queryObject = new QueryObject();
                            queryObject.QueryID = string.Concat(transactionObject.TransactionID, "|", transactionObject.ServiceID, i.ToString().PadLeft(2, '0'));

                            var baseFieldRelations = new List<BaseFieldRelation?>();
                            var jsonObjectTypes = new List<JsonObjectType>();
                            foreach (var item in outputContracts)
                            {
                                var jsonObjectType = (JsonObjectType)Enum.Parse(typeof(JsonObjectType), item.Type + "Json");
                                jsonObjectTypes.Add(jsonObjectType);

                                if (jsonObjectType == JsonObjectType.AdditionJson)
                                {
                                    queryObject.JsonObject = jsonObjectType;
                                }

                                if (item.BaseFieldRelation != null)
                                {
                                    baseFieldRelations.Add(item.BaseFieldRelation);
                                }
                            }
                            queryObject.JsonObjects = jsonObjectTypes;

                            var parameters = new List<DynamicParameter>();
                            foreach (var item in serviceParameters)
                            {
                                parameters.Append(item.FieldID, (DbType)Enum.Parse(typeof(DbType), item.DataType), item.Value);
                            }

                            queryObject.Parameters = parameters;
                            queryObject.BaseFieldMappings = inputContract.BaseFieldMappings;
                            queryObject.BaseFieldRelations = baseFieldRelations;
                            queryObject.IgnoreResult = inputContract.IgnoreResult;
                            dynamicObjects.Add(queryObject);
                        }
                    }
                    else
                    {
                        var queryObject = new QueryObject();
                        queryObject.QueryID = string.Concat(transactionObject.TransactionID, "|", transactionObject.ServiceID, i.ToString().PadLeft(2, '0'));

                        var baseFieldRelations = new List<BaseFieldRelation?>();
                        var jsonObjectTypes = new List<JsonObjectType>();
                        foreach (var item in outputContracts)
                        {
                            var jsonObjectType = (JsonObjectType)Enum.Parse(typeof(JsonObjectType), item.Type + "Json");
                            jsonObjectTypes.Add(jsonObjectType);

                            if (jsonObjectType == JsonObjectType.AdditionJson)
                            {
                                queryObject.JsonObject = jsonObjectType;
                            }

                            if (item.BaseFieldRelation != null)
                            {
                                baseFieldRelations.Add(item.BaseFieldRelation);
                            }
                        }
                        queryObject.JsonObjects = jsonObjectTypes;
                        queryObject.Parameters = new List<DynamicParameter>();
                        queryObject.BaseFieldMappings = new List<BaseFieldMapping>();
                        queryObject.BaseFieldRelations = baseFieldRelations;
                        queryObject.IgnoreResult = false;
                        dynamicObjects.Add(queryObject);
                    }

                    inputOffset = inputOffset + inputCount;
                }

                dynamicRequest.DynamicObjects = dynamicObjects;
                dynamicRequest.ClientTag = transactionObject.ClientTag;

                DynamicResponse? response = null;

                if (messageServerUrl.IndexOf("event://") > -1)
                {
                    var moduleEventName = messageServerUrl.Replace("event://", "");
                    var type = Assembly.Load(moduleEventName.Split(".")[0])?.GetType(moduleEventName);
                    if (type != null)
                    {
                        var instance = Activator.CreateInstance(type, dynamicRequest);
                        if (instance == null)
                        {
                            response = new DynamicResponse();
                            response.ExceptionText = $"moduleEventName: {moduleEventName} 확인 필요";
                        }
                        else
                        {
                            var eventResponse = await mediator.Send(instance);
                            if (eventResponse != null)
                            {
                                response = JsonConvert.DeserializeObject<DynamicResponse>(JsonConvert.SerializeObject(eventResponse));
                            }
                            else
                            {
                                response = new DynamicResponse();
                                response.ExceptionText = $"moduleEventName: {moduleEventName} 확인 필요";
                            }
                        }
                    }
                    else
                    {
                        response = new DynamicResponse();
                        response.ExceptionText = $"moduleEventName: {moduleEventName} 확인 필요";
                    }
                }
                else
                {
                    var restClient = new RestClient(messageServerUrl);
                    // restClient.Proxy = BypassWebProxy.Default;
                    var restRequest = new RestRequest(messageServerUrl, Method.Post);

                    restRequest.AddHeader("Content-Type", "application/json");
                    restRequest.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                    var json = JsonConvert.SerializeObject(dynamicRequest);
                    restRequest.AddParameter("application/json", json, ParameterType.RequestBody);

                    var restResponse = await restClient.ExecuteAsync(restRequest);

                    if (restResponse.StatusCode == HttpStatusCode.OK)
                    {
                        var content = restResponse.Content;
                        if (content != null)
                        {
                            if (dynamicRequest.ReturnType == ExecuteDynamicTypeObject.Xml)
                            {
                                response = new DynamicResponse();
                                response.ResultObject = content;
                            }
                            else
                            {
                                response = JsonConvert.DeserializeObject<DynamicResponse>(content);
                                if (response == null)
                                {
                                    response = new DynamicResponse();
                                }
                            }
                        }
                    }
                    else
                    {
                        responseObject.ExceptionText = $"AP X-Requested Transfort Error: {restResponse.ErrorMessage}";
                    }
                }

                if (response != null)
                {
                    responseObject.Acknowledge = response.Acknowledge;

                    if (responseObject.Acknowledge == AcknowledgeType.Success)
                    {
                        switch (dynamicRequest.ReturnType)
                        {
                            case ExecuteDynamicTypeObject.Json:
                                responseObject.ResultMeta = response.ResultMeta;
                                responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                break;
                            case ExecuteDynamicTypeObject.Scalar:
                                responseObject.ResultObject = response.ResultObject;
                                break;
                            case ExecuteDynamicTypeObject.NonQuery:
                                responseObject.ResultInteger = response.ResultInteger;
                                break;
                            case ExecuteDynamicTypeObject.SQLText:
                                responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                break;
                            case ExecuteDynamicTypeObject.SchemeOnly:
                                responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                break;
                            case ExecuteDynamicTypeObject.CodeHelp:
                                responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                break;
                            case ExecuteDynamicTypeObject.Xml:
                                responseObject.ResultObject = response.ResultObject as string;
                                break;
                            case ExecuteDynamicTypeObject.DynamicJson:
                                responseObject.ResultJson = response.ResultJson == null ? "[]" : response.ResultJson.ToString();
                                break;
                        }
                    }
                    else
                    {
                        if (string.IsNullOrEmpty(response.ExceptionText) == true)
                        {
                            responseObject.ExceptionText = $"GlobalID: {dynamicRequest.GlobalID} 거래 확인 필요";
                        }
                        else
                        {
                            responseObject.ExceptionText = response.ExceptionText;
                        }
                    }
                }
                else
                {
                    responseObject.ExceptionText = $"AP X-Requested {messageServerUrl} 확인 필요";
                }
            }
            catch (Exception exception)
            {
                responseObject.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.Transaction.GlobalID, "N", responseObject.ExceptionText, "Transaction/RequestDataTransaction", (string error) =>
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + responseObject.ExceptionText, "Transaction/RequestDataTransaction", request.Transaction.GlobalID);
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + responseObject.ExceptionText, "Transaction/RequestDataTransaction", request.Transaction.GlobalID);
                }
            }

            return responseObject;
        }

        public JArray ToJson(string? val)
        {
            var result = new JArray();

            if (val != null)
            {
                var delimeter = '｜';
                var newline = '↵';
                var lines = val.Split(newline);
                var headers = lines[0].Split(delimeter);

                for (var i = 0; i < headers.Length; i++)
                {
                    headers[i] = headers[i].Replace(@"(^[\s""]+|[\s""]+$)", "");
                }

                var lineLength = lines.Length;
                for (var i = 1; i < lineLength; i++)
                {
                    var row = lines[i].Split(delimeter);
                    var item = new JObject();
                    for (var j = 0; j < headers.Length; j++)
                    {
                        item[headers[j]] = ToDynamic(row[j]);
                    }
                    result.Add(item);
                }
            }

            return result;
        }

        public dynamic ToDynamic(string val)
        {
            dynamic result;

            if (val == "true" || val == "True" || val == "TRUE")
            {
                result = true;
            }
            else if (val == "false" || val == "False" || val == "FALSE")
            {
                result = false;
            }
            else if (val.Length > 1 && val.IndexOf('.') == -1 && val.StartsWith('0') == true)
            {
                result = val;
            }
            else if (Regex.IsMatch(val, @"^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$") == true)
            {
                var intValue = 0;
                var isParsable = int.TryParse(val, out intValue);
                if (isParsable == true)
                {
                    result = intValue;
                }
                else
                {
                    float floatValue = 0;
                    isParsable = float.TryParse(val, out floatValue);
                    if (isParsable == true)
                    {
                        result = floatValue;
                    }
                    else
                    {
                        result = 0;
                    }
                }
            }
            else if (Regex.IsMatch(val, @"(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))") == true)
            {
                result = DateTime.Parse(val);
            }
            else
            {
                result = val;
            }

            return result;
        }

        public void DefaultResponseHeaderConfiguration(TransactionRequest request, TransactionResponse response, int transactionRouteCount)
        {
            request.AcceptDateTime = DateTime.Now;
            response.AcceptDateTime = request.AcceptDateTime;

            response.CorrelationID = request.RequestID;
            response.Environment = request.Environment;
            response.Version = request.Version;
            response.System.ProgramID = request.System.ProgramID;
            response.System.LocaleID = request.System.LocaleID;
            response.System.HostName = GlobalConfiguration.HostName;
            response.System.PathName = "event";
            response.Transaction.GlobalID = request.Transaction.GlobalID;
            response.Transaction.BusinessID = request.Transaction.BusinessID;
            response.Transaction.TransactionID = request.Transaction.TransactionID;
            response.Transaction.FunctionID = request.Transaction.FunctionID;
            response.Transaction.CommandType = request.Transaction.CommandType;
            response.Transaction.SimulationType = request.Transaction.SimulationType;
            response.Transaction.TerminalGroupID = request.Transaction.TerminalGroupID;
            response.Transaction.OperatorID = request.Transaction.OperatorID;
            response.Transaction.ScreenID = request.Transaction.ScreenID;
            response.Transaction.StartTraceID = request.Transaction.StartTraceID;
            response.Transaction.CompressionYN = request.Transaction.CompressionYN;
            response.Transaction.DataFormat = request.Transaction.DataFormat;
            response.System.Routes = request.System.Routes;

            if (transactionRouteCount >= 0 && response.System.Routes.Count >= transactionRouteCount)
            {
                var route = response.System.Routes[transactionRouteCount];
                route.SystemID = GlobalConfiguration.SystemID;
                route.HostName = GlobalConfiguration.HostName;
                route.Environment = request.Environment;
                route.AcceptTick = DateTime.UtcNow.GetJavascriptTime();
            }
        }
    }
}
