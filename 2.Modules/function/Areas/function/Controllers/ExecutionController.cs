using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using function.Encapsulation;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

namespace function.Areas.function.Controllers
{
    [Area("function")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors()]
    public class ExecutionController : ControllerBase
    {
        private FunctionLoggerClient loggerClient { get; }

        private Serilog.ILogger logger { get; }

        private IFunctionClient dataClient { get; }

        public ExecutionController(Serilog.ILogger logger, FunctionLoggerClient loggerClient, IFunctionClient dataClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.dataClient = dataClient;
        }

        /// http://localhost:8000/api/execution/has
        [HttpGet("[action]")]
        public ActionResult Has(string applicationID, string projectID, string transactionID, string functionID)
        {
            var model = new
            {
                ApplicationID = applicationID,
                ProjectID = projectID,
                TransactionID = transactionID,
                FunctionID = functionID
            };

            ActionResult result = NotFound();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var value = FunctionMapper.HasScript(model.ApplicationID, model.ProjectID, model.TransactionID, model.FunctionID);
                    result = Content(JsonConvert.SerializeObject(value), "application/json");
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Execution/has");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/function/api/execution/refresh?changeType=Created&filePath=EWP/ZZD/TST010/featureMain.js
        [HttpGet("[action]")]
        public ActionResult Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ActionResult result = NotFound();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
                    {
                        filePath = filePath.Substring(1);
                    }

                    logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {changeType}, FilePath: {filePath}", "Execution/Refresh");

                    FileInfo fileInfo = new FileInfo(filePath);

                    if (filePath.StartsWith(GlobalConfiguration.ApplicationID) == false)
                    {
                        lock (FunctionMapper.FunctionSourceMappings)
                        {
                            var functionSourceMappings = FunctionMapper.FunctionSourceMappings.Where(x => x.Key.IndexOf($"{fileInfo.Directory?.Parent?.Parent?.Name}|") > -1).ToList();
                            for (int i = functionSourceMappings.Count(); i > 0; i--)
                            {
                                var item = functionSourceMappings[i - 1].Key;
                                FunctionMapper.FunctionSourceMappings.Remove(item);
                            }
                        }
                    }

                    lock (FunctionMapper.ScriptMappings)
                    {
                        var existScriptMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                        p.ApplicationID == fileInfo.Directory?.Parent?.Parent?.Name &&
                        p.ProjectID == fileInfo.Directory?.Parent?.Name &&
                        p.TransactionID == fileInfo.Directory?.Name).ToList();

                        if (existScriptMaps.Count > 0)
                        {
                            List<string> mapStrings = new List<string>();
                            for (int i = 0; i < existScriptMaps.Count; i++)
                            {
                                var item = existScriptMaps[i];
                                mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.ScriptID}");
                            }

                            for (int i = 0; i < mapStrings.Count; i++)
                            {
                                var item = existScriptMaps[i];
                                var items = mapStrings[i].SplitAndTrim('|');
                                logger.Information("[{LogCategory}] " + $"Delete ScriptMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.ScriptID}", "Execution/Refresh");
                                FunctionMapper.Remove(items[0], items[1], items[2], items[3]);
                            }
                        }
                    }

                    WatcherChangeTypes watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), changeType);
                    bool actionResult = false;
                    switch (watcherChangeTypes)
                    {
                        case WatcherChangeTypes.Created:
                        case WatcherChangeTypes.Changed:
                            if (FunctionMapper.HasContractFile(filePath) == true && (fileInfo.Name == "featureMain.cs" || fileInfo.Name == "featureMain.js" || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                            {
                                if (fileInfo.Extension != ".json")
                                {
                                    filePath = filePath.Replace(fileInfo.Name, "featureMeta.json");
                                }

                                logger.Information("[{LogCategory}] " + $"Add ScriptMap FilePath: {filePath}", "Execution/Refresh");
                                actionResult = FunctionMapper.AddScriptMap(filePath, true, logger);
                            }
                            break;
                        case WatcherChangeTypes.Deleted:
                            if (FunctionMapper.HasContractFile(filePath) == true && fileInfo.Name != "publicTransactions.json")
                            {
                                FunctionScriptContract? functionScriptContract = FunctionScriptContract.FromJson(System.IO.File.ReadAllText(filePath));
                                if (functionScriptContract != null)
                                {
                                    FunctionHeader header = functionScriptContract.Header;
                                    if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                    {
                                        header.ApplicationID = string.IsNullOrEmpty(header.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                                        header.ProjectID = string.IsNullOrEmpty(header.ProjectID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                                        header.TransactionID = string.IsNullOrEmpty(header.TransactionID) == true ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                                    }

                                    var items = functionScriptContract.Commands;
                                    foreach (var item in items)
                                    {
                                        FunctionMapper.Remove(header.ApplicationID, header.ProjectID, header.TransactionID, (item.ID + item.Seq.ToString().PadLeft(2, '0')));
                                    }
                                    logger.Information("[{LogCategory}] " + $"Delete ScriptMap FilePath: {filePath}", "Execution/Refresh");
                                }
                            }
                            break;
                    }

                    result = Content(JsonConvert.SerializeObject(actionResult), "application/json");
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Execution/Refresh");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/function/api/execution/retrieve?
        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID, string? functionID)
        {
            var model = new
            {
                ApplicationID = applicationID,
                ProjectID = projectID,
                TransactionID = transactionID,
                FunctionID = functionID
            };

            ActionResult result = NotFound();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    if (string.IsNullOrEmpty(model.ApplicationID) == true || string.IsNullOrEmpty(model.ProjectID) == true)
                    {
                        return Content("필수 항목 확인", "text/html");
                    }

                    var queryResults = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                            p.ProjectID == model.ProjectID);

                    if (string.IsNullOrEmpty(model.ApplicationID) == false)
                    {
                        queryResults = queryResults.Where(p =>
                            p.ApplicationID == model.ApplicationID);
                    }

                    if (string.IsNullOrEmpty(model.TransactionID) == false)
                    {
                        queryResults = queryResults.Where(p =>
                            p.TransactionID == model.TransactionID);
                    }

                    if (string.IsNullOrEmpty(model.FunctionID) == false)
                    {
                        string queryFunctionID = model.FunctionID.Substring(0, model.FunctionID.Length - 2);
                        queryResults = queryResults.Where(p => p.ScriptID.Substring(0, p.ScriptID.Length - 2) == queryFunctionID);
                    }

                    List<ModuleScriptMap>? scriptMaps = queryResults.ToList();
                    if (scriptMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(scriptMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Execution/Retrieve");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/function/api/execution/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            ActionResult result = NotFound();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    List<ModuleScriptMap>? statementMaps = null;

                    var queryResults = FunctionMapper.ScriptMappings.Select(p => p.Value);
                    statementMaps = queryResults.ToList();
                    if (statementMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Execution/Meta");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        [HttpPost]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            ActionResult result = NotFound();
            DynamicResponse response = new DynamicResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "빈 요청. 요청 정보 확인 필요";
                return result;
            }

            response.CorrelationID = request.GlobalID;
            if (string.IsNullOrEmpty(request.RequestID) == true)
            {
                request.RequestID = $"SELF_{GlobalConfiguration.SystemID}{GlobalConfiguration.HostName}{GlobalConfiguration.RunningEnvironment}{DateTime.Now.ToString("yyyyMMddHHmmssfff")}";
            }

            if (string.IsNullOrEmpty(request.GlobalID) == true)
            {
                request.GlobalID = request.RequestID;
            }

            string? responseData = null;
            string acknowledge = "N";
            try
            {
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {JsonConvert.SerializeObject(request)}", "Execution/Execute", request.GlobalID);

                    });
                }

                if (request.LoadOptions != null)
                {
                    Dictionary<string, string> loadOptions = request.LoadOptions;
                    if (loadOptions.Count > 0)
                    {
                    }
                }

                switch (request.ReturnType)
                {
                    case ExecuteDynamicTypeObject.Json:
                    case ExecuteDynamicTypeObject.DynamicJson:
                        await dataClient.ExecuteScriptMap(request, response);
                        break;
                    case ExecuteDynamicTypeObject.Scalar:
                    case ExecuteDynamicTypeObject.NonQuery:
                    case ExecuteDynamicTypeObject.SQLText:
                    case ExecuteDynamicTypeObject.SchemeOnly:
                    case ExecuteDynamicTypeObject.CodeHelp:
                    case ExecuteDynamicTypeObject.Xml:
                        response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요";
                        break;
                }

                acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                responseData = JsonConvert.SerializeObject(response);

                if (string.IsNullOrEmpty(response.ExceptionText) == false)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Execution/Execute", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Execution/Execute");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Execution/Execute", request.GlobalID);
                    }
                }

                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Execution/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Execution/Execute", response.CorrelationID);
                    });
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Execution/Execute", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Execution/Execute");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Execution/Execute", request.GlobalID);
                }

                responseData = JsonConvert.SerializeObject(response);

                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Execution/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Execution/Execute", response.CorrelationID);
                    });
                }
            }

            return Content(responseData, "application/json");
        }
    }
}
