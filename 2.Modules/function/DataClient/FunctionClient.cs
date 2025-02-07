﻿using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using function.Builder;
using function.Encapsulation;
using function.Entity;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Jering.Javascript.NodeJS;

using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

using Python.Runtime;

using Serilog;

namespace function.DataClient
{
    public class FunctionClient : IFunctionClient
    {
        private readonly IHttpContextAccessor httpContextAccessor;

        private INodeJSService nodeJSService { get; }

        private FunctionLoggerClient loggerClient { get; }

        private Serilog.ILogger logger { get; }

        private TransactionClient businessApiClient { get; }

        public FunctionClient(IHttpContextAccessor httpContextAccessor, INodeJSService nodeJSService, Serilog.ILogger logger, FunctionLoggerClient loggerClient, TransactionClient businessApiClient)
        {
            this.httpContextAccessor = httpContextAccessor;
            this.nodeJSService = nodeJSService;
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.businessApiClient = businessApiClient;
        }

        public async Task ExecuteScriptMap(DynamicRequest request, DynamicResponse response)
        {
            Dictionary<string, TransactionScriptObjects> transactionDynamicObjects = new Dictionary<string, TransactionScriptObjects>();
            try
            {
                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var moduleScriptMap = FunctionMapper.GetScriptMap(queryObject.QueryID);
                    if (moduleScriptMap == null)
                    {
                        response.ExceptionText = $"FunctionID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionScriptObjects()
                    {
                        DynamicObject = queryObject,
                        ModuleScriptMap = moduleScriptMap
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    string logData = $"FunctionID: {string.Join(", ", logQuerys.ToArray())}";
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "FunctionClient/ExecuteScriptMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "FunctionClient/ExecuteScriptMap", request.GlobalID);
                        });
                    }
                    else
                    {
                        logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "FunctionClient/ExecuteScriptMap", request.GlobalID);
                    }
                }

                // TCC (Try-Confirm/Cancel) 패턴 구현 처리
                if (request.IsTransaction == true)
                {
                }

                i = 0;
                DataRow? dataRow = null;
                DataTable additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                List<string> mergeMetaDatas = new List<string>();
                List<object> mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject queryObject = transactionDynamicObject.Value.DynamicObject;
                    ModuleScriptMap moduleScriptMap = transactionDynamicObject.Value.ModuleScriptMap;

                    List<DynamicParameter> dynamicParameters = new List<DynamicParameter>();
                    if (queryObject.Parameters.Count() > 0)
                    {
                        // 이전 실행 결과값으로 현재 요청 매개변수로 적용
                        if (queryObject.BaseFieldMappings != null && queryObject.BaseFieldMappings.Count() > 0)
                        {
                            if (dataRow == null)
                            {
                                response.ExceptionText = $"BaseFieldMappings - {queryObject.QueryID}에 대한 매핑 정보 필요";
                                return;
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < queryObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = queryObject.BaseFieldMappings[baseFieldIndex];

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {queryObject.QueryID}에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    return;
                                }

                                DynamicParameter? dynamicParameter = queryObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();
                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {queryObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    return;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        List<ModuleParameterMap> moduleParameterMaps = moduleScriptMap.ModuleParameters;
                        foreach (ModuleParameterMap moduleParameterMap in moduleParameterMaps)
                        {
                            DynamicParameter? dynamicParameter = GetDbParameterMap(moduleParameterMap.Name, queryObject.Parameters);

                            if (dynamicParameter == null)
                            {
                                response.ExceptionText = $"ParameterMap - {moduleParameterMap.Name}에 대한 매핑 정보 필요";
                                return;
                            }

                            dynamicParameter.Value = dynamicParameter.Value == null && moduleParameterMap.DefaultValue != "NULL" ? moduleParameterMap.DefaultValue : dynamicParameter.Value;
                            dynamicParameter.DbType = string.IsNullOrEmpty(moduleParameterMap.DbType) == true ? dynamicParameter.DbType : moduleParameterMap.DbType;
                            dynamicParameter.Length = moduleParameterMap.Length <= 0 ? -1 : moduleParameterMap.Length;
                            dynamicParameters.Add(dynamicParameter);
                        }

                        DynamicParameter lastParameter = new DynamicParameter();
                        lastParameter.ParameterName = "GlobalID";
                        lastParameter.Value = request.GlobalID;
                        lastParameter.DbType = "String";
                        lastParameter.Length = -1;
                        dynamicParameters.Add(lastParameter);
                    }

                    string programPath = moduleScriptMap.ProgramPath;
                    if (File.Exists(programPath) == false)
                    {
                        response.ExceptionText = $"'{moduleScriptMap.DataSourceID}'에 대한 프로그램 경로 확인 필요";
                        return;
                    }

                    if (string.IsNullOrEmpty(moduleScriptMap.BeforeTransactionCommand) == false)
                    {
                        string logData = "";
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            logData = $"programPath={programPath}, queryID={queryObject.QueryID}, BeforeTransactionCommand: {moduleScriptMap.BeforeTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, $"FunctionClient/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "FunctionClient/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "FunctionClient/BeforeTransactionCommand", request.GlobalID);
                            }
                        }

                        var transactionCommands = moduleScriptMap.BeforeTransactionCommand.Split("|");
                        List<ServiceParameter> serviceParameters = new List<ServiceParameter>();
                        serviceParameters.Add(new ServiceParameter() { prop = "ProgramPath", val = programPath });
                        string? beforeCommandResult = await businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, queryObject.QueryID, dynamicParameters, serviceParameters);
                        if (string.IsNullOrEmpty(beforeCommandResult) == false)
                        {
                            response.ExceptionText = $"ExecuteScriptMap.BeforeTransactionCommand Error: {beforeCommandResult}";

                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, $"FunctionClient/BeforeTransactionCommand: {logData}", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + $"fallback error: {error}, {response.ExceptionText}, {logData}", "FunctionClient/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "FunctionClient/BeforeTransactionCommand", request.GlobalID);
                            }

                            return;
                        }
                    }

                    string jsonArguments = JsonConvert.SerializeObject(dynamicParameters);

                    List<object> listParams = new List<object>();
                    listParams.Add(dynamicParameters);

                    DataContext dataContext = new DataContext();

                    FileInfo fileInfo = new FileInfo(programPath);
                    var directoryInfo = fileInfo.Directory;
                    if (directoryInfo != null && fileInfo.Exists)
                    {
                        string fileDirectory = directoryInfo.FullName.Replace("\\", "/");
                        string fileDirectoryName = directoryInfo.Name;
                        string scriptMapFile = PathExtensions.Combine(fileDirectory, "featureMeta.json");

                        var functionScriptContract = File.Exists(scriptMapFile) == true ? FunctionScriptContract.FromJson(File.ReadAllText(scriptMapFile)) : null;

                        if (functionScriptContract != null)
                        {
                            var moduleConfig = functionScriptContract.Header;
                            var featureSQLPath = PathExtensions.Combine(fileDirectory, "featureSQL.xml");
                            var functionLogDirectory = PathExtensions.Combine(ModuleConfiguration.CSharpFunctionLogBasePath, moduleConfig.ApplicationID, moduleConfig.ProjectID, fileDirectoryName);

                            if (!Directory.Exists(functionLogDirectory))
                            {
                                Directory.CreateDirectory(functionLogDirectory);
                            }

                            if (moduleScriptMap.LanguageType == "csharp")
                            {
                                Serilog.ILogger logger = new LoggerConfiguration()
                                    .WriteTo.Console()
                                    .WriteTo.File(PathExtensions.Combine(functionLogDirectory, "function.log"), rollingInterval: RollingInterval.Day)
                                    .CreateLogger();

                                dataContext.logger = logger;
                            }

                            dataContext.fileDirectory = fileDirectory;
                            dataContext.functionHeader = moduleConfig;
                            dataContext.featureSQLPath = File.Exists(featureSQLPath) == true ? featureSQLPath : "";
                        }
                        else
                        {
                            response.ExceptionText = $"'{queryObject.QueryID}'에 대한 featureMeta.json 확인 필요";
                            return;
                        }
                    }

                    dataContext.accessToken = request.AccessToken;
                    dataContext.loadOptions = request.LoadOptions;
                    dataContext.globalID = request.GlobalID;
                    dataContext.environment = GlobalConfiguration.RunningEnvironment;
                    dataContext.platform = GlobalConfiguration.OSPlatform;
                    dataContext.featureMeta = moduleScriptMap;

                    string dataProvider = "";
                    string connectionString = "";
                    string workingDirectoryPath = "";
                    var dataSourceIDs = moduleScriptMap.DataSourceID.SplitComma();
                    for (int j = 0; j < dataSourceIDs.Count; j++)
                    {
                        string dataSourceID = dataSourceIDs[j];
                        var dataSourceMap = FunctionMapper.GetDataSourceMap(moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, dataSourceID);

                        if (dataSourceMap != null)
                        {
                            dataProvider = dataProvider + "|" + dataSourceMap.DataProvider.ToString();
                            connectionString = connectionString + "|" + dataSourceMap.ConnectionString;
                            workingDirectoryPath = workingDirectoryPath + "|" + dataSourceMap.WorkingDirectoryPath;
                        }
                    }

                    if (string.IsNullOrEmpty(dataProvider) == false)
                    {
                        dataContext.dataProvider = dataProvider.Substring(1);
                        dataContext.connectionString = connectionString.Substring(1);
                        dataContext.workingDirectoryPath = workingDirectoryPath.Substring(1);
                    }

                    listParams.Add(dataContext);

                    object[]? arguments = null;

                    string? executeResult = null;
                    if (moduleScriptMap.LanguageType == "python")
                    {
                        try
                        {
                            arguments = listParams.ToArray();

                            if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                            {
                                string requestData = $"ProgramPath: {programPath}, Arguments: {jsonArguments}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, moduleScriptMap.ScriptID, requestData, "FunctionClient/InvokeFromFileAsync ReturnType: " + request.ReturnType.ToString(), (string error) =>
                                {
                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {requestData}", "FunctionClient/InvokeFromFileAsync", response.CorrelationID);
                                });
                            }

                            if (moduleScriptMap.Timeout <= 0)
                            {
                                executeResult = InvokePythonScriptFile(moduleScriptMap, programPath, dynamicParameters, dataContext);
                            }
                            else
                            {
                                int timeout = moduleScriptMap.Timeout * 1000;
                                var task = HandStack.Core.ExtensionMethod.TaskExtensions.ExecuteWithTimeout(() => InvokePythonScriptFile(moduleScriptMap, programPath, dynamicParameters, dataContext), TimeSpan.FromMilliseconds(timeout));
                                if (task.Wait(timeout) == true)
                                {
                                    executeResult = task.Result;
                                }
                                else
                                {
                                    response.ExceptionText = $"TimeoutException - '{timeout.ToString()}' 실행 시간 초과";

                                    if (ModuleConfiguration.IsLogServer == true)
                                    {
                                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, $"FunctionClient/InvokeFromFileAsync: dynamicParameters={JsonConvert.SerializeObject(arguments)}", (string error) =>
                                        {
                                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "FunctionClient/InvokeFromFileAsync");
                                        });
                                    }
                                    else
                                    {
                                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "FunctionClient/InvokeFromFileAsync", request.GlobalID);
                                    }
                                    return;
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            response.ExceptionText = $"GlobalID: {request.GlobalID}, QueryID: {queryObject.QueryID}, Exception: '{exception.ToMessage()}'";

                            if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                            {
                                string requestData = $"ProgramPath: {programPath}, Arguments: {jsonArguments}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, moduleScriptMap.ScriptID, requestData, "FunctionClient/InvokeFromFileAsync ReturnType: " + request.ReturnType.ToString(), (string error) =>
                                {
                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {requestData}, ExceptionText: {response.ExceptionText}", "FunctionClient/InvokeFromFileAsync", response.CorrelationID);
                                });
                            }
                        }
                    }
                    else if (moduleScriptMap.LanguageType == "javascript")
                    {
                        try
                        {
                            string functionID = queryObject.QueryID;
                            string module = "var syn=require('syn');module.exports=async(functionID,moduleFileName)=>{return syn.initializeModuleScript(functionID,moduleFileName);}";
                            var moduleID = await nodeJSService.InvokeFromStringAsync<string>(module, args: new[] { functionID, programPath });

                            listParams.Insert(0, moduleID.ToStringSafe());
                            arguments = listParams.ToArray();

                            if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                            {
                                string requestData = $"ProgramPath: {programPath}, Arguments: {jsonArguments}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, moduleScriptMap.ScriptID, requestData, "FunctionClient/InvokeFromFileAsync ReturnType: " + request.ReturnType.ToString(), (string error) =>
                                {
                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {requestData}", "FunctionClient/InvokeFromFileAsync", response.CorrelationID);
                                });
                            }

                            if (moduleScriptMap.Timeout <= 0)
                            {
                                executeResult = await nodeJSService.InvokeFromFileAsync<string>(programPath, moduleScriptMap.ExportName, arguments);
                            }
                            else
                            {
                                var task = nodeJSService.InvokeFromFileAsync<string>(programPath, moduleScriptMap.ExportName, arguments);
                                int timeout = moduleScriptMap.Timeout * 1000;
                                if (task.Wait(timeout) == true)
                                {
                                    executeResult = task.Result;
                                }
                                else
                                {
                                    response.ExceptionText = $"TimeoutException - '{timeout.ToString()}' 실행 시간 초과";

                                    if (ModuleConfiguration.IsLogServer == true)
                                    {
                                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, $"FunctionClient/InvokeFromFileAsync: dynamicParameters={JsonConvert.SerializeObject(arguments)}", (string error) =>
                                        {
                                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "FunctionClient/InvokeFromFileAsync");
                                        });
                                    }
                                    else
                                    {
                                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "FunctionClient/InvokeFromFileAsync", request.GlobalID);
                                    }

                                    return;
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            response.ExceptionText = $"GlobalID: {request.GlobalID}, QueryID: {queryObject.QueryID}, Exception: '{exception.ToMessage()}'";

                            if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                            {
                                string requestData = $"ProgramPath: {programPath}, Arguments: {jsonArguments}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, moduleScriptMap.ScriptID, requestData, "FunctionClient/InvokeFromFileAsync ReturnType: " + request.ReturnType.ToString(), (string error) =>
                                {
                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {requestData}, ExceptionText: {response.ExceptionText}", "FunctionClient/InvokeFromFileAsync", response.CorrelationID);
                                });
                            }
                        }
                    }
                    else if (moduleScriptMap.LanguageType == "csharp")
                    {
                        try
                        {
                            arguments = listParams.ToArray();

                            if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                            {
                                string requestData = $"ProgramPath: {programPath}, Arguments: {jsonArguments}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, moduleScriptMap.ScriptID, requestData, "FunctionClient/InvokeFromFileAsync ReturnType: " + request.ReturnType.ToString(), (string error) =>
                                {
                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {requestData}", "FunctionClient/InvokeFromFileAsync", response.CorrelationID);
                                });
                            }

                            if (string.IsNullOrEmpty(moduleScriptMap.EntryType) == true || string.IsNullOrEmpty(moduleScriptMap.EntryMethod) == true)
                            {
                                response.ExceptionText = $"GlobalID: {request.GlobalID}, QueryID: {queryObject.QueryID}, Exception: EntryType, EntryMethod 확인 필요";
                            }
                            else
                            {
                                object? result;
                                var runner = Runner.Instance;
                                if (moduleScriptMap.IsHttpContext == true)
                                {
                                    result = runner.ExecuteDynamicFile(httpContextAccessor.HttpContext, programPath, queryObject.QueryID, moduleScriptMap, arguments);
                                }
                                else
                                {
                                    result = runner.ExecuteDynamicFile(null, programPath, queryObject.QueryID, moduleScriptMap, arguments);
                                }

                                if (result is Task<DataSet?>)
                                {
                                    var task = result as Task<DataSet?>;
                                    if (task != null)
                                    {
                                        if (task.IsCompleted == false)
                                        {
                                            if (moduleScriptMap.Timeout <= 0)
                                            {
                                                task.Wait();
                                            }
                                            else
                                            {
                                                int timeout = moduleScriptMap.Timeout * 1000;
                                                if (task.Wait(timeout) == false)
                                                {
                                                    response.ExceptionText = $"TimeoutException - '{timeout.ToString()}' 실행 시간 초과";
                                                    if (ModuleConfiguration.IsLogServer == true)
                                                    {
                                                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, $"FunctionClient/InvokeFromFileAsync: dynamicParameters={JsonConvert.SerializeObject(arguments)}", (string error) =>
                                                        {
                                                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "FunctionClient/InvokeFromFileAsync");
                                                        });
                                                    }
                                                    else
                                                    {
                                                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "FunctionClient/InvokeFromFileAsync", request.GlobalID);
                                                    }
                                                    return;
                                                }
                                            }
                                            executeResult = JsonConvert.SerializeObject(task.Result);
                                        }
                                        else
                                        {
                                            executeResult = JsonConvert.SerializeObject(null);
                                        }
                                    }
                                }
                                else if (result is DataSet)
                                {
                                    executeResult = JsonConvert.SerializeObject(result);
                                }
                                else
                                {
                                    response.ExceptionText = $"GlobalID: {request.GlobalID}, QueryID: {queryObject.QueryID}, Exception: EntryType, EntryMethod 반환 결과 확인 필요";
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            response.ExceptionText = $"GlobalID: {request.GlobalID}, QueryID: {queryObject.QueryID}, Exception: '{exception.ToMessage()}'";

                            if (ModuleConfiguration.IsTransactionLogging == true || moduleScriptMap.TransactionLog == true)
                            {
                                string requestData = $"ProgramPath: {programPath}, Arguments: {jsonArguments}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", moduleScriptMap.ApplicationID, moduleScriptMap.ProjectID, moduleScriptMap.TransactionID, moduleScriptMap.ScriptID, requestData, "FunctionClient/InvokeFromFileAsync ReturnType: " + request.ReturnType.ToString(), (string error) =>
                                {
                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {requestData}, ExceptionText: {response.ExceptionText}", "FunctionClient/InvokeFromFileAsync", response.CorrelationID);
                                });
                            }
                        }
                    }
                    else
                    {
                        response.ExceptionText = $"GlobalID: {request.GlobalID}, QueryID: {queryObject.QueryID}, LanguageType 확인 필요: {moduleScriptMap.LanguageType}";
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == false)
                    {
                        if (string.IsNullOrEmpty(moduleScriptMap.FallbackTransactionCommand) == false)
                        {
                            string logData = $"GlobalID={request.GlobalID}, QueryID={queryObject.QueryID}, FallbackTransactionCommand: {moduleScriptMap.FallbackTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "FunctionClient/FallbackTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "FunctionClient/FallbackTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "FunctionClient/FallbackTransactionCommand", request.GlobalID);
                            }

                            var transactionCommands = moduleScriptMap.FallbackTransactionCommand.Split("|");
                            string? fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, queryObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(fallbackCommandResult) == false)
                            {
                                response.ExceptionText = response.ExceptionText + $", ExecuteScriptMap.FallbackTransactionCommand Error: GlobalID={request.GlobalID}, QueryID={queryObject.QueryID}, CommandID={moduleScriptMap.FallbackTransactionCommand}, CommandResult={fallbackCommandResult}";

                                if (ModuleConfiguration.IsLogServer == true)
                                {
                                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"FunctionClient/FallbackTransactionCommand", (string error) =>
                                    {
                                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "FunctionClient/FallbackTransactionCommand");
                                    });
                                }
                                else
                                {
                                    logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "FunctionClient/FallbackTransactionCommand", request.GlobalID);
                                }
                            }
                        }

                        return;
                    }

                    if (string.IsNullOrEmpty(moduleScriptMap.AfterTransactionCommand) == false)
                    {
                        string logData = $"executeResult: {executeResult}, AfterTransactionCommand: {moduleScriptMap.AfterTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, $"FunctionClient/AfterTransactionCommand", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "FunctionClient/AfterTransactionCommand");
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "FunctionClient/AfterTransactionCommand", request.GlobalID);
                        }

                        var transactionCommands = moduleScriptMap.AfterTransactionCommand.Split("|");
                        List<ServiceParameter> serviceParameters = new List<ServiceParameter>();
                        serviceParameters.Add(new ServiceParameter() { prop = "CommandResult", val = executeResult });
                        string? afterCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, queryObject.QueryID, dynamicParameters, serviceParameters);
                        if (string.IsNullOrEmpty(afterCommandResult) == false)
                        {
                            response.ExceptionText = $"ExecuteScriptMap.AfterTransactionCommand Error: {afterCommandResult}";

                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"FunctionClient/AfterTransactionCommand", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "FunctionClient/AfterTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "FunctionClient/AfterTransactionCommand", request.GlobalID);
                            }

                            return;
                        }
                    }

                    if (queryObject.IgnoreResult == true)
                    {
                        if (executeResult != null && executeResult.Length > 0)
                        {
                            using (DataSet? ds = JsonConvert.DeserializeObject<DataSet>(executeResult))
                            {
                                if (ds != null && ds.Tables.Count > 0)
                                {
                                    using (DataTable dataTable = ds.Tables[0])
                                    {
                                        if (dataTable.Rows.Count > 0)
                                        {
                                            dataRow = dataTable.Rows[0];
                                        }
                                        else
                                        {
                                            dataRow = null;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        if (executeResult != null && executeResult.Length > 0)
                        {
                            switch (request.ReturnType)
                            {
                                case ExecuteDynamicTypeObject.Json:
                                    using (DataSet? ds = JsonConvert.DeserializeObject<DataSet>(executeResult))
                                    {
                                        if (ds != null)
                                        {
                                            JsonObjectType jsonObjectType = JsonObjectType.FormJson;

                                            for (int j = 0; j < ds.Tables.Count; j++)
                                            {
                                                DataTable table = ds.Tables[j];

                                                if (queryObject.JsonObjects == null || queryObject.JsonObjects.Count == 0)
                                                {
                                                    jsonObjectType = queryObject.JsonObject;
                                                }
                                                else
                                                {
                                                    try
                                                    {
                                                        jsonObjectType = queryObject.JsonObjects[i];
                                                    }
                                                    catch
                                                    {
                                                        jsonObjectType = queryObject.JsonObject;
                                                    }
                                                }

                                                StringBuilder sb = new StringBuilder(256);
                                                for (int k = 0; k < table.Columns.Count; k++)
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
                                                    dataRow = table.Rows[0];
                                                }
                                                else
                                                {
                                                    dataRow = null;
                                                }

                                                i++;
                                            }
                                        }
                                    }

                                    if (additionalData.Rows.Count > 0)
                                    {
                                        mergeDatas.Add(GridJson.ToJsonObject("AdditionalData", additionalData));
                                    }

                                    response.ResultMeta = mergeMetaDatas;
                                    response.ResultJson = mergeDatas;
                                    break;
                                case ExecuteDynamicTypeObject.DynamicJson:
                                    response.ResultJson = executeResult;
                                    break;
                                default:
                                    response.ExceptionText = $"{response.ResultJson} 지원하지 않는 응답 타입";
                                    break;
                            }
                        }
                    }

                    // TCC (Try-Confirm/Cancel) 패턴 구현 처리
                    if (request.IsTransaction == true)
                    {
                    }

                    response.Acknowledge = AcknowledgeType.Success;
                }
            }
            catch (Exception exception)
            {
                // TCC (Try-Confirm/Cancel) 패턴 구현 처리
                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                    }
                }

                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "FunctionClient/ExecuteScriptMap", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "FunctionClient/ExecuteScriptMap");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "FunctionClient/ExecuteScriptMap", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                }
            }
        }

        private string? InvokePythonScriptFile(ModuleScriptMap moduleScriptMap, string programPath, List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string? result = null;
            string moduleName = "";
            Exception? invokeException = null;
            try
            {
                if (PythonEngine.IsInitialized == false)
                {
                    if (Runtime.PythonDLL == null)
                    {
                        result = "{\"DataTable1\": [{\"Message\": \"Python DLL이 없습니다.\"}]}";
                        return result;
                    }

                    PythonEngine.Initialize();
                }

                string transactionID = new DirectoryInfo(Path.GetDirectoryName(programPath)!).Name;
                moduleName = $"{moduleScriptMap.ApplicationID}_{moduleScriptMap.ProjectID}_{moduleScriptMap.TransactionID}";
                string mainFilePath = programPath.Replace("featureMain.py", $"{moduleName}.py");
                if (File.Exists(mainFilePath) == false)
                {
                    File.Copy(programPath, mainFilePath, true);
                }

                using (Py.GIL())
                {
                    dynamic sys = Py.Import("sys");
                    sys.path.append(Path.GetDirectoryName(mainFilePath));

                    var scriptModule = Py.Import(moduleName).GetAttr(transactionID);

                    var pythonParameters = new List<PyObject>();

                    var args = new Dictionary<string, object?>();
                    foreach (var dynamicParameter in dynamicParameters)
                    {
                        args.Add(dynamicParameter.ParameterName, dynamicParameter.Value);
                    }

                    pythonParameters.Add(args.ToPython());
                    pythonParameters.Add(JsonConvert.SerializeObject(dataContext).ToPython());

                    var pythonResult = scriptModule.InvokeMethod(moduleScriptMap.ExportName, pythonParameters.ToArray());

                    object? moduleResult = pythonResult.AsManagedObject(typeof(object));
                    if (moduleResult != null)
                    {
                        var resultType = moduleResult.GetType().Name;

                        result = pythonResult.As<string>();
                    }
                }
            }
            catch (PythonException exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"PythonException moduleName: {moduleName}", "FunctionClient/InvokePythonScriptFile");
                invokeException = new Exception($"PythonException moduleName: {moduleName}, exception: {exception.Message}");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"moduleName: {moduleName}", "FunctionClient/InvokePythonScriptFile");
                invokeException = exception;
            }
            finally
            {
                PythonEngine.Shutdown();
            }

            if (invokeException != null)
            {
                throw invokeException;
            }

            return result;
        }

        private DynamicParameter? GetDbParameterMap(string parameterName, List<DynamicParameter> dynamicParameters)
        {
            DynamicParameter? result = null;

            var maps = from p in dynamicParameters
                       where p.ParameterName == parameterName.Replace("@", "").Replace(":", "")
                       select p;

            if (maps.Count() > 0)
            {
                foreach (var item in maps)
                {
                    result = item;
                    break;
                }
            }

            return result;
        }

        public void Dispose()
        {
        }
    }
}
