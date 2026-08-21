using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
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

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Encapsulation;
using prompter.Entity;
using prompter.Enumeration;
using prompter.Extensions;

using Serilog;


namespace prompter.DataClient
{
    public class PromptClient : IPromptClient
    {
        private const string FallbackPromptResultFieldID = "PromptResult";

        private ILogger logger { get; }

        private PromptLoggerClient loggerClient { get; }

        private TransactionClient businessApiClient { get; }

        private ModuleApiClient moduleApiClient { get; }

        private LLMChatClientFactory llmChatClientFactory { get; }

        private PromptToolExecutor promptToolExecutor { get; }

        private DataProviders dataProvider { get; }

        public PromptClient(ILogger logger, TransactionClient businessApiClient, ModuleApiClient moduleApiClient, PromptLoggerClient loggerClient, LLMChatClientFactory llmChatClientFactory, PromptToolExecutor promptToolExecutor)
        {
            this.logger = logger;
            this.businessApiClient = businessApiClient;
            this.moduleApiClient = moduleApiClient;
            this.loggerClient = loggerClient;
            this.llmChatClientFactory = llmChatClientFactory;
            this.promptToolExecutor = promptToolExecutor;
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
                        ApiKey = connectionInfo == null ? "" : connectionInfo.ApiKey,
                        ModelID = connectionInfo == null ? "" : connectionInfo.ModelID,
                        Endpoint = connectionInfo == null ? "" : connectionInfo.Endpoint.ToStringSafe(),
                        ServiceID = connectionInfo == null ? "" : connectionInfo.ServiceID.ToStringSafe(),
                        LLMProvider = connectionInfo == null ? LLMProviders.OpenAI : connectionInfo.LLMProvider,
                        Think = connectionInfo != null && connectionInfo.Think,
                        Stream = connectionInfo != null && connectionInfo.Stream,
                        Temperature = connectionInfo?.Temperature,
                        TopP = connectionInfo?.TopP,
                        MaxOutputTokens = connectionInfo?.MaxOutputTokens,
                        ContextTokens = connectionInfo?.ContextTokens
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
                    var validationError = ValidateLLMConnection(item.Value);
                    if (string.IsNullOrEmpty(validationError) == false)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 Prompt DataSourceID 데이터 원본 확인 필요 - {validationError}";
                        return;
                    }
                }

                i = 0;

                var chatHistory = new List<LLMChatMessage>();
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
                                    var baseSequenceMapping = baseFieldMapping.BaseSequence.ParseInt(0);
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

                                var dynamicParameter = dynamicObject.Parameters.FirstOrDefault(p => p.ParameterName == baseFieldMapping.TargetFieldID);

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

                                                var dynamicParameter = dynamicObject.Parameters.FirstOrDefault(p => p.ParameterName == item.ColumnName);

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

                                                    var dynamicParameter = dynamicObject.Parameters.FirstOrDefault(p => p.ParameterName == item.ColumnName);

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

                        AddOrUpdateRuntimeParameter(dynamicObject, "ChatHistory", string.Join("\n", chatHistory.Select(x => x.Role + ": " + x.Content)));
                        var promptMessages = await CreatePromptMessagesAsync(promptMap, dynamicObject, chatHistory);
                        var parsePrompt = string.Join(Environment.NewLine, promptMessages.Skip(chatHistory.Count).Select(item => item.Content));
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

                        var userMessage = GetUserMessage(dynamicObject, parsePrompt);
                        var tools = promptToolExecutor.BuildTools(promptMap, dynamicObject, logger);

                        var llmRequest = CreateLLMChatRequest(transactionDynamicObject.Value, promptMap, dynamicObject, promptMessages, tools);
                        var assistantMessage = await ExecuteLLMChatAsync(llmRequest, promptMap.Tools.MaxRounds, tools);
                        var promptResultFieldIDs = GetPromptResultFieldIDs(promptMap);

                        chatHistory.Add(new LLMChatMessage("user", userMessage));
                        chatHistory.Add(new LLMChatMessage("assistant", assistantMessage));

                        if (ModuleConfiguration.IsChatHistoryConsoleShow == true)
                        {
                            Console.WriteLine();
                            Console.WriteLine("".PadLeft(20, '-') + " ChatHistory " + "".PadLeft(20, '-'));
                            Console.WriteLine(string.Join(Environment.NewLine, $"prompt: {parsePrompt}"));
                            Console.WriteLine(string.Join(Environment.NewLine, chatHistory.Select(item => $"{item.Role}: {item.Content}")));
                        }

                        if (dsTransactionResult == null)
                        {
                            dsTransactionResult = new DataSet();
                            dsTransactionResult.Tables.Add(CreatePromptResultDataTable(promptResultFieldIDs, assistantMessage));
                        }
                        else if (dsTransactionResult != null && dsTransactionResult.Tables["FormData0"] == null)
                        {
                            dsTransactionResult.Tables.Add(CreatePromptResultDataTable(promptResultFieldIDs, assistantMessage));
                        }
                        else if (dsTransactionResult != null && dsTransactionResult.Tables["FormData0"] != null)
                        {
                            var dataTable = dsTransactionResult.Tables["FormData0"];
                            if (dataTable != null)
                            {
                                SetPromptResultValues(dataTable, promptResultFieldIDs, assistantMessage);
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

        private static DataTable CreatePromptResultDataTable(IReadOnlyList<string> fieldIDs, string assistantMessage)
        {
            var dataTable = new DataTable("FormData0");
            foreach (var fieldID in fieldIDs)
            {
                dataTable.Columns.Add(fieldID, typeof(string));
            }

            var row = dataTable.NewRow();
            foreach (var fieldID in fieldIDs)
            {
                row[fieldID] = assistantMessage;
            }

            dataTable.Rows.Add(row);
            return dataTable;
        }

        private static void SetPromptResultValues(DataTable dataTable, IReadOnlyList<string> fieldIDs, string assistantMessage)
        {
            foreach (var fieldID in fieldIDs)
            {
                if (dataTable.Columns.Contains(fieldID) == false)
                {
                    dataTable.Columns.Add(fieldID, typeof(string));
                }
            }

            var row = dataTable.Rows.Count > 0 ? dataTable.Rows[0] : dataTable.NewRow();
            foreach (var fieldID in fieldIDs)
            {
                row[fieldID] = assistantMessage;
            }

            if (dataTable.Rows.Count == 0)
            {
                dataTable.Rows.Add(row);
            }
        }

        private static List<string> GetPromptResultFieldIDs(PromptMap promptMap)
        {
            var result = new List<string>();
            var outputMetas = promptMap.OutputMetas ?? new List<string>();
            foreach (var outputMeta in outputMetas)
            {
                foreach (var outputMetaPart in outputMeta.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    var fieldID = GetOutputMetaFieldID(outputMetaPart);
                    if (string.IsNullOrWhiteSpace(fieldID) == false && result.Contains(fieldID, StringComparer.OrdinalIgnoreCase) == false)
                    {
                        result.Add(fieldID);
                    }
                }
            }

            if (result.Count == 0)
            {
                result.Add(GetDefaultPromptResultFieldID());
            }

            return result;
        }

        private static string GetOutputMetaFieldID(string outputMeta)
        {
            if (string.IsNullOrWhiteSpace(outputMeta) == true)
            {
                return "";
            }

            var separatorIndex = outputMeta.IndexOf(':');
            var fieldID = separatorIndex < 0 ? outputMeta : outputMeta.Substring(0, separatorIndex);
            return fieldID.Trim();
        }

        private static string GetDefaultPromptResultFieldID()
        {
            return string.IsNullOrWhiteSpace(ModuleConfiguration.DefaultPromptResultFieldID) == true
                ? FallbackPromptResultFieldID
                : ModuleConfiguration.DefaultPromptResultFieldID.Trim();
        }

        private async Task<string> ExecuteLLMChatAsync(LLMChatRequest llmRequest, int maxRounds, IReadOnlyList<LLMToolDefinition> tools)
        {
            var client = llmChatClientFactory.Create(llmRequest.Provider);
            var rounds = maxRounds <= 0 ? 10 : maxRounds;
            for (var round = 0; round <= rounds; round++)
            {
                var llmResponse = await client.ChatAsync(llmRequest, CancellationToken.None);
                if (llmResponse.ToolCalls.Count == 0)
                {
                    return llmResponse.Content;
                }

                if (llmRequest.ToolMode == "none")
                {
                    logger.Information("[{LogCategory}] " + $"LLM tool 호출이 반환되었으나 statement tools mode가 none입니다. content: {llmResponse.Content}, toolCalls: {JsonConvert.SerializeObject(llmResponse.ToolCalls)}", "PromptClient/ExecuteLLMChatAsync");
                    return "";
                }

                llmRequest.ChatHistory.Add(new LLMChatMessage("assistant", llmResponse.Content)
                {
                    ToolCalls = llmResponse.ToolCalls
                });

                foreach (var toolCall in llmResponse.ToolCalls)
                {
                    var toolResult = await promptToolExecutor.ExecuteAsync(toolCall, tools, logger, CancellationToken.None);
                    llmRequest.ChatHistory.Add(new LLMChatMessage("tool", toolResult)
                    {
                        Name = toolCall.FunctionName,
                        ToolCallID = toolCall.ID
                    });
                }
            }

            logger.Information("[{LogCategory}] " + $"LLM tool 호출 반복 한도 초과: maxrounds={rounds}", "PromptClient/ExecuteLLMChatAsync");
            return "";
        }

        private LLMChatRequest CreateLLMChatRequest(TransactionDynamicObjects transactionDynamicObject, PromptMap promptMap, QueryObject queryObject, List<LLMChatMessage> promptMessages, List<LLMToolDefinition> tools)
        {
            var parameters = PromptMapper.ExtractParameters(queryObject);
            var queryParameters = new Dictionary<string, string>();
            var body = CreateRequestBody(promptMap.Body, parameters);
            var headers = CreateStatementHeaders(promptMap, parameters, queryParameters, body);

            return new LLMChatRequest
            {
                Provider = transactionDynamicObject.LLMProvider,
                ModelID = transactionDynamicObject.ModelID,
                ApiKey = transactionDynamicObject.ApiKey,
                Endpoint = transactionDynamicObject.Endpoint,
                MaxTokens = transactionDynamicObject.MaxOutputTokens ?? promptMap.MaxTokens,
                ContextTokens = transactionDynamicObject.ContextTokens,
                Temperature = transactionDynamicObject.Temperature ?? promptMap.Temperature,
                TopP = transactionDynamicObject.TopP ?? promptMap.TopP,
                PresencePenalty = promptMap.PresencePenalty,
                FrequencyPenalty = promptMap.FrequencyPenalty,
                Think = transactionDynamicObject.Think,
                Stream = transactionDynamicObject.Stream,
                ChatHistory = promptMessages,
                Tools = tools,
                Headers = headers,
                QueryParameters = queryParameters,
                Body = body,
                ToolMode = promptMap.Tools.Mode
            };
        }

        private Dictionary<string, string> CreateStatementHeaders(PromptMap promptMap, JObject parameters, Dictionary<string, string> queryParameters, LLMRequestBody body)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in promptMap.Headers)
            {
                var name = ReplaceStatementValue(item.Name, parameters);
                if (string.IsNullOrWhiteSpace(name) == true)
                {
                    continue;
                }

                result[name] = ReplaceStatementValue(item.Value, parameters);
            }

            var authorization = promptMap.Authorization;
            if (string.IsNullOrWhiteSpace(authorization.Type) == true)
            {
                return result;
            }

            var type = authorization.Type.ToLowerInvariant();
            var value = ReplaceStatementValue(authorization.Value, parameters);
            switch (type)
            {
                case "basic":
                    if (string.IsNullOrWhiteSpace(value) == true)
                    {
                        var username = ReplaceStatementValue(authorization.Username, parameters);
                        var password = ReplaceStatementValue(authorization.Password, parameters);
                        value = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
                    }

                    result["Authorization"] = value.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase) == true ? value : "Basic " + value;
                    break;
                case "bearer":
                case "jwtbearer":
                    result["Authorization"] = value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true ? value : "Bearer " + value;
                    break;
                case "apikey":
                    var name = string.IsNullOrWhiteSpace(authorization.Name) == true ? "X-API-Key" : ReplaceStatementValue(authorization.Name, parameters);
                    var location = string.IsNullOrWhiteSpace(authorization.Location) == true ? "header" : authorization.Location.ToLowerInvariant();
                    if (location == "query")
                    {
                        queryParameters[name] = value;
                    }
                    else if (location == "body")
                    {
                        MergeBodyValue(body, name, value);
                    }
                    else
                    {
                        result[name] = value;
                    }
                    break;
            }

            return result;
        }

        private LLMRequestBody CreateRequestBody(PromptBody promptBody, JObject parameters)
        {
            var result = new LLMRequestBody
            {
                Type = promptBody.Type.ToLowerInvariant(),
                RawText = ReplaceStatementValue(promptBody.RawText, parameters)
            };

            if (promptBody.Parts.Count > 0)
            {
                result.Type = "form-data";
            }

            foreach (var item in promptBody.Parts)
            {
                var part = new LLMRequestBodyPart
                {
                    Type = item.Type,
                    Name = ReplaceStatementValue(item.Name, parameters),
                    Value = ReplaceStatementValue(item.Value, parameters),
                    FileName = ReplaceStatementValue(item.FileName, parameters),
                    ContentType = ReplaceStatementValue(item.ContentType, parameters)
                };

                if (part.Type == "file")
                {
                    var filePath = ReplaceStatementValue(item.Path, parameters);
                    var base64 = ReplaceStatementValue(item.Base64, parameters);
                    if (string.IsNullOrWhiteSpace(filePath) == false)
                    {
                        part.Content = ReadAllowedBodyFile(filePath);
                        if (string.IsNullOrWhiteSpace(part.FileName) == true)
                        {
                            part.FileName = Path.GetFileName(filePath);
                        }
                    }
                    else if (string.IsNullOrWhiteSpace(base64) == false)
                    {
                        part.Content = Convert.FromBase64String(base64);
                    }
                }

                result.Parts.Add(part);
            }

            return result;
        }

        private static void MergeBodyValue(LLMRequestBody body, string name, string value)
        {
            JObject bodyObject;
            if (string.IsNullOrWhiteSpace(body.RawText) == true)
            {
                bodyObject = new JObject();
            }
            else
            {
                try
                {
                    bodyObject = JObject.Parse(body.RawText);
                }
                catch
                {
                    bodyObject = new JObject
                    {
                        ["body"] = body.RawText
                    };
                }
            }

            bodyObject[name] = value;
            body.RawText = bodyObject.ToString(Formatting.None);
            if (string.IsNullOrWhiteSpace(body.Type) == true)
            {
                body.Type = "json";
            }
        }

        private static byte[] ReadAllowedBodyFile(string filePath)
        {
            var fullPath = Path.GetFullPath(filePath);
            var allowed = ModuleConfiguration.AllowedBodyFileBasePaths.Any(basePath =>
            {
                if (string.IsNullOrWhiteSpace(basePath) == true)
                {
                    return false;
                }

                var fullBasePath = Path.GetFullPath(basePath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                return string.Equals(fullPath, fullBasePath, StringComparison.OrdinalIgnoreCase) == true
                    || fullPath.StartsWith(fullBasePath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
                    || fullPath.StartsWith(fullBasePath + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
            });

            if (allowed == false)
            {
                throw new InvalidOperationException($"허용되지 않은 body file path: {filePath}");
            }

            if (File.Exists(fullPath) == false)
            {
                throw new FileNotFoundException($"body file path 확인 필요: {filePath}", fullPath);
            }

            return File.ReadAllBytes(fullPath);
        }

        private async Task<string> ReplaceCodeHelpTemplatesAsync(string value, QueryObject queryObject)
        {
            if (string.IsNullOrEmpty(value) == true)
            {
                return "";
            }

            var matches = ExtractCodeHelpTemplateExpressions(value);
            if (matches.Count == 0)
            {
                return value;
            }

            var parameters = PromptMapper.ExtractParameters(queryObject);
            var result = new StringBuilder();
            var currentIndex = 0;
            foreach (var match in matches)
            {
                result.Append(value, currentIndex, match.StartIndex - currentIndex);

                var items = match.Expression.Split(new[] { '|' }, 7).Select(item => item.Trim()).ToArray();
                var replacement = "";

                if (items.Length == 6 || items.Length == 7)
                {
                    var codeHelpID = items[0];
                    var applicationID = items[1];
                    var businessID = items[2];
                    var transactionID = items[3];
                    var functionID = items[4];
                    var parametersText = items[5];
                    var templateID = items.Length == 7 ? items[6] : null;

                    parametersText = ReplaceStatementValue(parametersText, parameters);
                    var parameterName = GetParameterName(parametersText);
                    if (TryGetParameterValue(parameters, parameterName, out var parameterValue) == true)
                    {
                        parametersText = parameterValue;
                    }

                    var transactionCommandID = $"{applicationID}|{businessID}|{transactionID}|{functionID}";

                    replacement = await moduleApiClient.GetCodeHelp(codeHelpID, applicationID, transactionCommandID, parametersText, templateID: templateID);
                }
                else
                {
                    logger.Warning("[{LogCategory}] " + $"코드도움 치환식 확인 필요: {match.Text}", "PromptClient/ReplaceCodeHelpTemplatesAsync");
                }

                result.Append(replacement);
                currentIndex = match.StartIndex + match.Length;
            }

            result.Append(value, currentIndex, value.Length - currentIndex);
            return result.ToString();
        }

        private async Task<List<LLMChatMessage>> CreatePromptMessagesAsync(PromptMap promptMap, QueryObject queryObject, List<LLMChatMessage> chatHistory)
        {
            var result = new List<LLMChatMessage>(chatHistory);
            var messageNodes = promptMap.Chidren.DocumentNode.SelectNodes("message");

            if (messageNodes == null || messageNodes.Count == 0)
            {
                var parsePrompt = PromptMapper.Find(promptMap, queryObject);
                parsePrompt = await ReplaceCodeHelpTemplatesAsync(parsePrompt, queryObject);
                var promptRole = string.IsNullOrWhiteSpace(promptMap.Role) == true ? "system" : promptMap.Role;
                result.Add(new LLMChatMessage(promptRole, parsePrompt));

                return result;
            }

            var parameters = PromptMapper.ExtractParameters(queryObject);
            var statementPrompt = await ReplaceCodeHelpTemplatesAsync(PromptMapper.Find(promptMap, queryObject), queryObject);
            if (string.IsNullOrWhiteSpace(statementPrompt) == false)
            {
                var statementRole = string.IsNullOrWhiteSpace(promptMap.Role) == true ? "system" : promptMap.Role;
                result.Add(new LLMChatMessage(statementRole, statementPrompt));
            }

            foreach (var messageNode in messageNodes)
            {
                var role = messageNode.Attributes["role"]?.Value.ToStringSafe();
                if (string.IsNullOrWhiteSpace(role) == true)
                {
                    role = string.IsNullOrWhiteSpace(promptMap.Role) == true ? "system" : promptMap.Role;
                }

                var content = ReplaceStatementValue(messageNode.InnerText.ToStringSafe(), parameters);
                content = await ReplaceCodeHelpTemplatesAsync(content, queryObject);
                if (string.IsNullOrWhiteSpace(content) == true)
                {
                    continue;
                }

                result.Add(new LLMChatMessage(role, content));
            }

            return result;
        }

        private static List<(int StartIndex, int Length, string Expression, string Text)> ExtractCodeHelpTemplateExpressions(string value)
        {
            var result = new List<(int StartIndex, int Length, string Expression, string Text)>();
            var searchIndex = 0;

            while (searchIndex < value.Length)
            {
                var startIndex = value.IndexOf("@{", searchIndex, StringComparison.Ordinal);
                if (startIndex < 0)
                {
                    break;
                }

                var expressionStartIndex = startIndex + 2;
                var endIndex = FindCodeHelpTemplateEndIndex(value, expressionStartIndex);
                if (endIndex < 0)
                {
                    searchIndex = expressionStartIndex;
                    continue;
                }

                var length = endIndex - startIndex + 1;
                var expression = value.Substring(expressionStartIndex, endIndex - expressionStartIndex);
                var text = value.Substring(startIndex, length);
                result.Add((startIndex, length, expression, text));
                searchIndex = endIndex + 1;
            }

            return result;
        }

        private static int FindCodeHelpTemplateEndIndex(string value, int startIndex)
        {
            var index = startIndex;
            while (index < value.Length)
            {
                if (value.IndexOf("{{{", index, StringComparison.Ordinal) == index)
                {
                    var mustacheEndIndex = value.IndexOf("}}}", index + 3, StringComparison.Ordinal);
                    if (mustacheEndIndex < 0)
                    {
                        return -1;
                    }

                    index = mustacheEndIndex + 3;
                    continue;
                }

                if (value.IndexOf("${", index, StringComparison.Ordinal) == index
                    || value.IndexOf("#{", index, StringComparison.Ordinal) == index)
                {
                    var parameterEndIndex = value.IndexOf("}", index + 2, StringComparison.Ordinal);
                    if (parameterEndIndex < 0)
                    {
                        return -1;
                    }

                    index = parameterEndIndex + 1;
                    continue;
                }

                if (value.IndexOf("{{", index, StringComparison.Ordinal) == index)
                {
                    var mustacheEndIndex = value.IndexOf("}}", index + 2, StringComparison.Ordinal);
                    if (mustacheEndIndex < 0)
                    {
                        return -1;
                    }

                    index = mustacheEndIndex + 2;
                    continue;
                }

                if (value[index] == '}')
                {
                    return index;
                }

                index++;
            }

            return -1;
        }

        private static bool TryGetParameterValue(JObject parameters, string parameterName, out string value)
        {
            value = "";
            foreach (var parameter in parameters)
            {
                if (string.Equals(parameter.Key, parameterName, StringComparison.OrdinalIgnoreCase) == true)
                {
                    value = parameter.Value?.ToStringSafe() ?? "";
                    return true;
                }
            }

            return false;
        }

        private static string ReplaceStatementValue(string value, JObject parameters)
        {
            if (string.IsNullOrEmpty(value) == true)
            {
                return "";
            }

            var result = PromptMapper.ConvertParameterText(value, parameters);
            result = Regex.Replace(result, "\\{@([^}]+)\\}", match =>
            {
                var key = match.Groups[1].Value;
                return parameters[key]?.ToStringSafe() ?? "";
            });

            if (result.StartsWith("@") == true && result.IndexOf(" ", StringComparison.Ordinal) < 0)
            {
                var key = result.SubstringSafe(1);
                result = parameters[key]?.ToStringSafe() ?? result;
            }

            return result;
        }

        private static string GetUserMessage(QueryObject queryObject, string parsePrompt)
        {
            var userMessage = queryObject.Parameters.FirstOrDefault(item =>
                string.Equals(item.ParameterName, "UserMessage", StringComparison.OrdinalIgnoreCase))?.Value.ToStringSafe();

            return string.IsNullOrWhiteSpace(userMessage) == true ? parsePrompt : userMessage;
        }

        private static void AddOrUpdateRuntimeParameter(QueryObject queryObject, string name, object? value)
        {
            var parameter = queryObject.Parameters.FirstOrDefault(item => string.Equals(item.ParameterName, name, StringComparison.OrdinalIgnoreCase));
            if (parameter == null)
            {
                queryObject.Parameters.Add(new DynamicParameter
                {
                    ParameterName = name,
                    DbType = "String",
                    Length = -1,
                    Value = value
                });
            }
            else
            {
                parameter.Value = value;
            }
        }

        private static string ValidateLLMConnection(TransactionDynamicObjects transactionDynamicObject)
        {
            switch (transactionDynamicObject.LLMProvider)
            {
                case LLMProviders.OpenAI:
                case LLMProviders.AzureOpenAI:
                    if (string.IsNullOrWhiteSpace(transactionDynamicObject.ApiKey) == true)
                    {
                        return "ApiKey 설정 필요";
                    }

                    if (string.IsNullOrWhiteSpace(transactionDynamicObject.ModelID) == true)
                    {
                        return "ModelID 설정 필요";
                    }
                    break;
                case LLMProviders.Claude:
                case LLMProviders.Gemini:
                    if (string.IsNullOrWhiteSpace(transactionDynamicObject.ApiKey) == true)
                    {
                        return "ApiKey 설정 필요";
                    }

                    if (string.IsNullOrWhiteSpace(transactionDynamicObject.ModelID) == true)
                    {
                        return "ModelID 설정 필요";
                    }
                    break;
                case LLMProviders.Ollama:
                case LLMProviders.LMStudio:
                    if (string.IsNullOrWhiteSpace(transactionDynamicObject.Endpoint) == true)
                    {
                        return "Endpoint 설정 필요";
                    }

                    if (string.IsNullOrWhiteSpace(transactionDynamicObject.ModelID) == true)
                    {
                        return "ModelID 설정 필요";
                    }
                    break;
            }

            return "";
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
            if (string.IsNullOrEmpty(parameterName))
            {
                return parameterName;
            }

            return parameterName[0] switch
            {
                '@' or '#' or ':' => parameterName.Substring(1),
                _ => parameterName
            };
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

        private static DataSourceMap? GetConnectionInfomation(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;
            if (string.IsNullOrEmpty(dataSourceID) == false)
            {
                var dataSourceMap = PromptMapper.GetDataSourceMap(queryObject, applicationID, projectID, dataSourceID);
                if (dataSourceMap != null)
                {
                    result = dataSourceMap;
                }
            }

            return result;
        }
    }
}


