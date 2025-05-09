using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Dapper;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Encapsulation;
using prompter.Entity;
using prompter.Enumeration;
using prompter.Extensions;
using prompter.KernelPlugin;

using Serilog;


namespace prompter.DataClient
{
    public class PromptClient : IPromptClient
    {
        private ILogger logger { get; }

        private PromptLoggerClient loggerClient { get; }

        private TransactionClient businessApiClient { get; }

        private ModuleApiClient moduleApiClient { get; }

        private DataProviders dataProvider { get; }

        public PromptClient(ILogger logger, TransactionClient businessApiClient, ModuleApiClient moduleApiClient, PromptLoggerClient loggerClient)
        {
            this.logger = logger;
            this.businessApiClient = businessApiClient;
            this.moduleApiClient = moduleApiClient;
            this.loggerClient = loggerClient;
        }

        public async Task ExecuteDynamicPromptMap(DynamicRequest request, DynamicResponse response)
        {
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    var promptMap = PromptMapper.GetPromptMap(queryObject.QueryID);
                    if (promptMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, promptMap.ApplicationID, promptMap.ProjectID, promptMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = promptMap,
                        ApiKey = connectionInfo == null ? "" : connectionInfo.Item1,
                        ModelID = connectionInfo == null ? "" : connectionInfo.Item2,
                        Endpoint = connectionInfo == null ? "" : connectionInfo.Item3,
                        ServiceID = connectionInfo == null ? "" : connectionInfo.Item4,
                        LLMProvider = connectionInfo == null ? LLMProviders.OpenAI : connectionInfo.Item5
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "PromptClient/ExecuteDynamicPromptMap", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ApiKey) == true || string.IsNullOrEmpty(item.Value.ModelID) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 Prompt DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;

                ChatHistory chatHistory = [];
                var dataRows = new Dictionary<int, DataRow?>();
                var additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                var mergeMetaDatas = new List<string>();
                var mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var promptMap = transactionDynamicObject.Value.Statement;

                    var llmProvider = transactionDynamicObject.Value.LLMProvider;
                    transactionDynamicObject.Value.PromptExecution = GetKernel(transactionDynamicObject.Value);

                    var dynamicParameters = new DynamicParameters();

                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            var baseSequence = promptMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && promptMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    var baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
                                    if (baseSequence != baseSequenceMapping)
                                    {
                                        baseSequence = baseSequenceMapping;
                                        dataRow = dataRows.GetValueOrDefault(baseSequence);
                                    }
                                }

                                if (dataRow == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 매핑 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDynamicParameterMapping(dynamicObject, promptMap, dynamicParameters);
                    }
                    else
                    {
                        SetDynamicParameterMapping(dynamicObject, promptMap, dynamicParameters);
                    }

                    var executePromptID = dynamicObject.QueryID + "_" + i.ToString();

                    DataSet? dsTransactionResult = null;
                    var transaction = PromptMapper.FindTransaction(promptMap, dynamicObject);
                    if (transaction.Command != null && transaction.ResultType != null)
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                        {
                            var logData = $"ExecutePromptID: {executePromptID + "_transaction"}, Parameters: {transaction.Parameters}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap");
                            });
                        }

                        var serviceParameters = new List<ServiceParameter>();

                        foreach (var parameterName in dynamicParameters.ParameterNames)
                        {
                            var value = dynamicParameters.Get<object?>(parameterName);
                            serviceParameters.Add(parameterName, value.ToStringSafe());
                        }

                        if (string.IsNullOrEmpty(transaction.Parameters) == false)
                        {
                            var input = transaction.Parameters.Trim();
                            if (input.StartsWith("{") == true && input.EndsWith("}") == true)
                            {
                                var jToken = JToken.Parse(input);
                                if (jToken is JObject)
                                {
                                    using var dtParameters = JsonConvert.DeserializeObject<DataTable>($"[{jToken}]");
                                    if (dtParameters != null && dtParameters.Columns.Count > 0 && dtParameters.Rows.Count > 0)
                                    {
                                        var rowItem = dtParameters.Rows[0];
                                        var colItems = dtParameters.Columns;
                                        foreach (DataColumn item in colItems)
                                        {
                                            var parameter = serviceParameters.FirstOrDefault(p => p.prop == item.ColumnName);
                                            if (parameter == null)
                                            {
                                                serviceParameters.Add(item.ColumnName, rowItem[item.ColumnName].ToStringSafe());
                                            }
                                            else
                                            {
                                                parameter.val = rowItem[item.ColumnName].ToStringSafe();
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        var transactionResult = await moduleApiClient.TransactionDirect(transaction.Command, serviceParameters);
                        if (transactionResult?.ContainsKey("HasException") == true)
                        {
                            var message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                            logger.Error("[{LogCategory}] " + $"ExecutePromptID: {executePromptID}, Command: {transaction.Command}, parameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {message}", "PromptClient/ExecuteDynamicPromptMap");

                            response.ExceptionText = $"ExecutePromptID: {executePromptID}, Command: {transaction.Command} 거래 확인 필요 - {message}";
                            return;
                        }
                        else
                        {
                            try
                            {
                                dsTransactionResult = transactionResult.ToDataSet();
                                var resultTypes = transaction.ResultType.Split(",");
                                var argumentMaps = transaction.ArgumentMap.Split(",");
                                var resultCount = (dsTransactionResult == null ? 0 : dsTransactionResult.Tables.Count);
                                if (resultTypes.Count() != argumentMaps.Count() || resultTypes.Count() != resultCount)
                                {
                                    response.ExceptionText = $"Pretransaction - 전처리 거래 설정 및 실행 결과 확인 필요, argumentMaps: {argumentMaps.Length}, resultTypes: {resultTypes.Length}, resultCount: {resultCount}";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (dsTransactionResult != null)
                                {
                                    for (var j = 0; j < dsTransactionResult.Tables.Count; j++)
                                    {
                                        var resultType = resultTypes[j].Trim();
                                        var argumentMap = argumentMaps[j].Trim();
                                        var table = dsTransactionResult.Tables[j];
                                        if (argumentMap.ToBoolean() == false || table.Columns.Count == 0)
                                        {
                                            continue;
                                        }

                                        if (resultType == "Row")
                                        {
                                            var rowItem = table.Rows[0];
                                            var colItems = table.Columns;
                                            foreach (DataColumn item in colItems)
                                            {
                                                PretransactionAddParameter(dynamicParameters, rowItem, item);

                                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                if (dynamicParameter == null)
                                                {
                                                    dynamicParameter = new DynamicParameter();
                                                    dynamicParameter.ParameterName = item.ColumnName;
                                                    dynamicParameter.Length = item.MaxLength;
                                                    dynamicParameter.DbType = GetProviderDbType(item);
                                                    dynamicParameter.Value = rowItem[item.ColumnName];
                                                    dynamicObject.Parameters.Add(dynamicParameter);
                                                }
                                                else
                                                {
                                                    dynamicParameter.Value = rowItem[item.ColumnName];
                                                }
                                            }
                                        }
                                        else if (resultType == "List")
                                        {
                                            var parameters = new List<object>();
                                            var colItems = table.Columns;
                                            foreach (DataColumn item in colItems)
                                            {
                                                var dataView = new DataView(table);
                                                var dataTable = dataView.ToTable(true, item.ColumnName);
                                                foreach (DataRow row in dataTable.Rows)
                                                {
                                                    parameters.Add(row[0]);
                                                }

                                                if (parameters.Count > 0)
                                                {
                                                    dynamicParameters?.Add(item.ColumnName, parameters);

                                                    var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item);
                                                        dynamicParameter.Value = parameters;
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = parameters;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                var logData = $"ExecutePromptID: {executePromptID}, Command: {transaction.Command}";
                                if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                                {
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = $"ExecutePromptID: {executePromptID}, ExceptionText: {exception.ToMessage()}, Command: {transaction.Command}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap");
                                });

                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                        {
                            var logData = $"ExecutePromptID: {executePromptID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap");
                            });
                        }

                        var parsePrompt = PromptMapper.Find(promptMap, dynamicObject);
                        if (string.IsNullOrEmpty(parsePrompt) == true || parsePrompt.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                            {
                                var logData = $"ExecutePromptID: {executePromptID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty Prompt passing" + logData, "PromptClient/ExecuteDynamicPromptMap");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                        {
                            var logData = $"ExecutePromptID: {executePromptID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap");
                            });
                        }

                        var promptConfig = new PromptTemplateConfig(parsePrompt);
                        promptConfig.InputVariables = new List<InputVariable>();

                        var promptExecutionSettings = new OpenAIPromptExecutionSettings();
                        promptExecutionSettings.MaxTokens = promptMap.MaxTokens;
                        promptExecutionSettings.Temperature = promptMap.Temperature;
                        promptExecutionSettings.TopP = promptMap.TopP;
                        promptExecutionSettings.PresencePenalty = promptMap.PresencePenalty;
                        promptExecutionSettings.FrequencyPenalty = promptMap.FrequencyPenalty;

                        var kernelArguments = new KernelArguments(promptExecutionSettings);

                        SetInputVariableMapping(dynamicObject, promptMap, kernelArguments);

                        var userMessage = string.Empty;
                        foreach (var item in kernelArguments)
                        {
                            if (item.Key.ToUpper() == "USERMESSAGE")
                            {
                                userMessage = item.Value.ToStringSafe();
                            }
                        }

                        kernelArguments.Add("ChatHistory", string.Join("\n", chatHistory.Select(x => x.Role + ": " + x.Content)));

                        var kernelFunction = KernelFunctionFactory.CreateFromPrompt(promptConfig);
                        var promptResult = await transactionDynamicObject.Value.PromptExecution.InvokeAsync(
                             kernelFunction,
                             kernelArguments
                         );

                        var assistantMessage = promptResult.ToString();

                        chatHistory.AddUserMessage(userMessage);
                        chatHistory.AddAssistantMessage(assistantMessage);

                        if (dsTransactionResult == null)
                        {
                            dsTransactionResult = new DataSet();
                            var dataTableBuilder = new DataTableHelper("FormData0");
                            dataTableBuilder.AddColumn("PromptResult", typeof(string));
                            dataTableBuilder.NewRow();
                            dataTableBuilder.SetValue(0, 0, assistantMessage);

                            dsTransactionResult.Tables.Add(dataTableBuilder.GetDataTable());
                        }
                        else if (dsTransactionResult != null && dsTransactionResult.Tables["FormData0"] == null)
                        {
                            var dataTableBuilder = new DataTableHelper("FormData0");
                            dataTableBuilder.AddColumn("PromptResult", typeof(string));
                            dataTableBuilder.NewRow();
                            dataTableBuilder.SetValue(0, 0, assistantMessage);

                            dsTransactionResult.Tables.Add(dataTableBuilder.GetDataTable());
                        }
                        else if (dsTransactionResult != null && dsTransactionResult.Tables["FormData0"] != null)
                        {
                            var dataTableBuilder = new DataTableHelper("FormData0");
                            var dataTable = dsTransactionResult.Tables["FormData0"];
                            if (dataTable != null)
                            {
                                if (dataTable.Columns.Contains("PromptResult") == false)
                                {
                                    dataTable.Columns.Add("PromptResult", typeof(string));
                                }

                                if (dataTable.Rows.Count > 0)
                                {
                                    dataTable.Rows[0]["PromptResult"] = assistantMessage;
                                }
                                else
                                {
                                    var row = dataTable.NewRow();
                                    row["PromptResult"] = assistantMessage;
                                    dataTable.Rows.Add(row);
                                }
                            }
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || promptMap.TransactionLog == true)
                        {
                            var logData = $"ExecutePromptID: {executePromptID}, Prompt: \n\n{promptMap.Prompt}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap");
                            });
                        }

                        if (dynamicObject.IgnoreResult == true)
                        {
                            using var dataTable = dsTransactionResult?.Tables["FormData0"];
                            if (dataTable?.Rows.Count > 0)
                            {
                                dataRows[promptMap.Seq] = dataTable.Rows[dataTable.Rows.Count - 1];
                            }
                            else
                            {
                                dataRows[promptMap.Seq] = null;
                            }
                        }
                        else
                        {
                            using var ds = dsTransactionResult;
                            var jsonObjectType = JsonObjectType.FormJson;

                            if (ds != null)
                            {
                                for (var j = 0; j < ds.Tables.Count; j++)
                                {
                                    var table = ds.Tables[j];
                                    if (table.Columns.Count == 0)
                                    {
                                        continue;
                                    }

                                    if (dynamicObject.BaseFieldRelations != null && dynamicObject.BaseFieldRelations.Count() > 0)
                                    {
                                        var baseFieldRelation = dynamicObject.BaseFieldRelations[j];
                                        if (baseFieldRelation != null && baseFieldRelation.BaseSequence >= 0 && ((ds.Tables.Count - 1) >= baseFieldRelation.BaseSequence))
                                        {
                                            var baseTable = ds.Tables[baseFieldRelation.BaseSequence];
                                            if (baseTable != null)
                                            {
                                                var baseColumnID = string.IsNullOrEmpty(baseFieldRelation.RelationFieldID) == true ? "_Children" : baseFieldRelation.RelationFieldID;
                                                if (baseTable.Columns.Contains(baseColumnID) == false && baseFieldRelation.RelationMappings.Count > 0)
                                                {
                                                    baseTable.Columns.Add(baseColumnID, typeof(object));

                                                    var dvChildren = table.AsDataView();
                                                    foreach (DataRow row in baseTable.Rows)
                                                    {
                                                        var rowFilters = new List<string>() { "1<2" };
                                                        foreach (var item in baseFieldRelation.RelationMappings)
                                                        {
                                                            if (baseTable.Columns.Contains(item.BaseFieldID) == true && table.Columns.Contains(item.ChildrenFieldID) == true)
                                                            {
                                                                rowFilters.Add($" AND {item.BaseFieldID} = '{row[item.ChildrenFieldID]}'");
                                                            }
                                                        }

                                                        if (rowFilters.Count > 1)
                                                        {
                                                            dvChildren.RowFilter = string.Join("", rowFilters);

                                                            DataTable? dtChildren = null;
                                                            if (baseFieldRelation.ColumnNames.Count > 0)
                                                            {
                                                                dtChildren = dvChildren.ToTable(false, baseFieldRelation.ColumnNames.ToArray());
                                                            }
                                                            else
                                                            {
                                                                dtChildren = dvChildren.ToTable();
                                                                foreach (var item in baseFieldRelation.RelationMappings)
                                                                {
                                                                    dtChildren.Columns.Remove(item.ChildrenFieldID);
                                                                }
                                                            }

                                                            row[baseColumnID] = dtChildren;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                for (var j = 0; j < ds.Tables.Count; j++)
                                {
                                    var table = ds.Tables[j];
                                    if (table.Columns.Count == 0)
                                    {
                                        continue;
                                    }

                                    if (dynamicObject.BaseFieldRelations != null && dynamicObject.BaseFieldRelations.Count() > 0)
                                    {
                                        var baseFieldRelation = dynamicObject.BaseFieldRelations[j];
                                        if (baseFieldRelation != null)
                                        {
                                            if (baseFieldRelation.DisposeResult == true)
                                            {
                                                ds.Tables.Remove(table);
                                            }
                                        }
                                    }
                                }

                                for (var j = 0; j < ds.Tables.Count; j++)
                                {
                                    var table = ds.Tables[j];
                                    if (table.Columns.Count == 0)
                                    {
                                        continue;
                                    }

                                    if (dynamicObject.JsonObjects == null || dynamicObject.JsonObjects.Count == 0)
                                    {
                                        jsonObjectType = dynamicObject.JsonObject;
                                    }
                                    else
                                    {
                                        try
                                        {
                                            jsonObjectType = dynamicObject.JsonObjects[i];
                                        }
                                        catch
                                        {
                                            jsonObjectType = dynamicObject.JsonObject;
                                        }
                                    }

                                    var sb = new StringBuilder(256);
                                    for (var k = 0; k < table.Columns.Count; k++)
                                    {
                                        var column = table.Columns[k];
                                        sb.Append($"{column.ColumnName}:{JsonExtensions.toMetaDataType(column.DataType.Name)};");
                                    }

                                    switch (jsonObjectType)
                                    {
                                        case JsonObjectType.FormJson:
                                            mergeMetaDatas.Add(sb.ToString());
                                            mergeDatas.Add(FormJson.ToJsonObject("FormData" + i.ToString(), table));
                                            break;
                                        case JsonObjectType.jqGridJson:
                                            mergeMetaDatas.Add(sb.ToString());
                                            mergeDatas.Add(jqGridJson.ToJsonObject("jqGridData" + i.ToString(), table));
                                            break;
                                        case JsonObjectType.GridJson:
                                            mergeMetaDatas.Add(sb.ToString());
                                            mergeDatas.Add(GridJson.ToJsonObject("GridData" + i.ToString(), table));
                                            break;
                                        case JsonObjectType.ChartJson:
                                            mergeMetaDatas.Add(sb.ToString());
                                            mergeDatas.Add(ChartGridJson.ToJsonObject("ChartData" + i.ToString(), table));
                                            break;
                                        case JsonObjectType.DataSetJson:
                                            mergeMetaDatas.Add(sb.ToString());
                                            mergeDatas.Add(DataTableJson.ToJsonObject("DataSetData" + i.ToString(), table));
                                            break;
                                        case JsonObjectType.AdditionJson:
                                            additionalData.Merge(table);
                                            break;
                                    }

                                    if (table.Rows.Count > 0)
                                    {
                                        dataRows[promptMap.Seq] = table.Rows[table.Rows.Count - 1];
                                    }
                                    else
                                    {
                                        dataRows[promptMap.Seq] = null;
                                    }

                                    i++;
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        var logData = $"ExecutePromptID: {executePromptID}, Command: {transaction.Command}, ExceptionText: {response.ExceptionText}";

                        loggerClient.TransactionMessageLogging(request.GlobalID, "N", promptMap.ApplicationID, promptMap.ProjectID, promptMap.TransactionID, promptMap.StatementID, logData, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "PromptClient/ExecuteDynamicPromptMap");
                        });
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == false)
                    {
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (additionalData.Rows.Count > 0)
                {
                    mergeDatas.Add(GridJson.ToJsonObject("AdditionalData", additionalData));
                }

                response.ResultMeta = mergeMetaDatas;
                response.ResultJson = mergeDatas;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "PromptClient/ExecuteDynamicPromptMap", request.GlobalID);
                }
            }
        }

        private static Kernel GetKernel(TransactionDynamicObjects transactionDynamicObjects)
        {
            var builder = Kernel.CreateBuilder();

            switch (transactionDynamicObjects.LLMProvider)
            {
                case LLMProviders.OpenAI:
                    builder.AddOpenAIChatCompletion(
                        modelId: transactionDynamicObjects.ModelID,
                        apiKey: transactionDynamicObjects.ApiKey);
                    break;
                case LLMProviders.AzureOpenAI:
                    builder.AddAzureOpenAIChatCompletion(
                        deploymentName: transactionDynamicObjects.ServiceID,
                        modelId: transactionDynamicObjects.ModelID,
                        endpoint: transactionDynamicObjects.Endpoint,
                        apiKey: transactionDynamicObjects.ApiKey);
                    break;
            }

            builder.Plugins.AddFromType<MathPlugin>("math");
            builder.Plugins.AddFromType<TimePlugin>("time");
            builder.Plugins.AddFromType<TextPlugin>("text");

            return builder.Build();
        }

        private void SetInputVariableMapping(QueryObject queryObject, PromptMap promptMap, KernelArguments dynamicParameters)
        {
            if (dynamicParameters == null)
            {
                return;
            }

            var inputVariableMaps = promptMap.InputVariables;
            foreach (var inputVariableMap in inputVariableMaps)
            {
                var dynamicParameter = GetInputVariableMap(inputVariableMap.Name, queryObject.Parameters);

                if (dynamicParameter == null)
                {
                    continue;
                }

                var dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(inputVariableMap.DbType) == true ? dynamicParameter.DbType : inputVariableMap.DbType);

                if (dynamicDbType == DbType.String)
                {
                    if (dynamicParameter.Value == null)
                    {
                        if (inputVariableMap.DefaultValue == "NULL")
                        {
                            dynamicParameter.Value = DBNull.Value;
                        }
                        else if (string.IsNullOrEmpty(inputVariableMap.DefaultValue) == false)
                        {
                            dynamicParameter.Value = inputVariableMap.DefaultValue;
                        }
                        else
                        {
                            dynamicParameter.Value = "";
                        }
                    }
                }
                else
                {
                    if (dynamicParameter.Value == null || dynamicParameter.Value.ToStringSafe() == "")
                    {
                        if (inputVariableMap.DefaultValue == "NULL")
                        {
                            dynamicParameter.Value = DBNull.Value;
                        }
                        else if (string.IsNullOrEmpty(inputVariableMap.DefaultValue) == false)
                        {
                            dynamicParameter.Value = inputVariableMap.DefaultValue;
                        }
                    }
                }

                dynamicParameters.Add(
                    GetParameterName(inputVariableMap.Name),
                    dynamicParameter.Value
                );
            }
        }


        private void SetDynamicParameterMapping(QueryObject queryObject, PromptMap promptMap, DynamicParameters? dynamicParameters)
        {
            if (dynamicParameters == null)
            {
                return;
            }

            var inputVariableMaps = promptMap.InputVariables;
            foreach (var inputVariableMap in inputVariableMaps)
            {
                var dynamicParameter = GetInputVariableMap(inputVariableMap.Name, queryObject.Parameters);

                if (dynamicParameter == null)
                {
                    continue;
                }

                var dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(inputVariableMap.DbType) == true ? dynamicParameter.DbType : inputVariableMap.DbType);

                if (dynamicDbType == DbType.String)
                {
                    if (dynamicParameter.Value == null)
                    {
                        if (inputVariableMap.DefaultValue == "NULL")
                        {
                            dynamicParameter.Value = DBNull.Value;
                        }
                        else if (string.IsNullOrEmpty(inputVariableMap.DefaultValue) == false)
                        {
                            dynamicParameter.Value = inputVariableMap.DefaultValue;
                        }
                        else
                        {
                            dynamicParameter.Value = "";
                        }
                    }
                }
                else
                {
                    if (dynamicParameter.Value == null || dynamicParameter.Value.ToStringSafe() == "")
                    {
                        if (inputVariableMap.DefaultValue == "NULL")
                        {
                            dynamicParameter.Value = DBNull.Value;
                        }
                        else if (string.IsNullOrEmpty(inputVariableMap.DefaultValue) == false)
                        {
                            dynamicParameter.Value = inputVariableMap.DefaultValue;
                        }
                    }
                }

                dynamicParameters.Add(
                    dynamicParameter.ParameterName,
                    dynamicParameter.Value,
                    dynamicDbType,
                    ParameterDirection.Input,
                    -1
                );
            }
        }

        private DynamicParameter? GetInputVariableMap(string parameterName, List<DynamicParameter>? dynamicParameters)
        {
            DynamicParameter? result = null;

            if (dynamicParameters != null)
            {
                var maps = from p in dynamicParameters
                           where p.ParameterName == GetParameterName(parameterName)
                           select p;

                if (maps.Count() > 0)
                {
                    foreach (var item in maps)
                    {
                        result = item;
                        break;
                    }
                }
            }

            return result;
        }

        private string GetParameterName(string parameterName)
        {
            return parameterName.Replace("@", "").Replace("#", "").Replace(":", "");
        }

        private void PretransactionAddParameter(dynamic? dynamicParameters, DataRow rowItem, DataColumn item)
        {
            if (dynamicParameters == null)
            {
                return;
            }

            var dynamicDbType = (DbType)Enum.Parse(typeof(DbType), GetProviderDbType(item));

            dynamicParameters.Add(
                item.ColumnName,
                rowItem[item.ColumnName],
                dynamicDbType,
                ParameterDirection.Input,
                item.MaxLength
            );
        }

        private string GetProviderDbType(DataColumn column)
        {
            var result = "String";
            switch (column.DataType.Name)
            {
                case "Int16":
                case "Int32":
                case "Int64":
                case "Decimal":
                case "Double":
                case "Single":
                case "Boolean":
                case "DateTime":
                case "DateTimeOffset":
                case "Byte":
                    result = column.DataType.Name;
                    break;
                case "TimeSpan":
                    result = "Time";
                    break;
                case "Byte[]":
                    result = "Binary";
                    break;
                case "Guid":
                    result = "Guid";
                    break;
            }

            return result;
        }

        private static Tuple<string, string, string, string, LLMProviders>? GetConnectionInfomation(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            Tuple<string, string, string, string, LLMProviders>? result = null;
            if (string.IsNullOrEmpty(dataSourceID) == false)
            {
                var dataSourceMap = PromptMapper.GetDataSourceMap(queryObject, applicationID, projectID, dataSourceID);
                if (dataSourceMap != null)
                {
                    result = new Tuple<string, string, string, string, LLMProviders>(dataSourceMap.ApiKey, dataSourceMap.ModelID, dataSourceMap.Endpoint.ToStringSafe(), dataSourceMap.ServiceID.ToStringSafe(), dataSourceMap.LLMProvider);
                }
            }

            return result;
        }
    }
}
