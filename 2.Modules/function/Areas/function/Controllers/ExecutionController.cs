using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using function.Encapsulation;
using function.Entity;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
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
    public class ExecutionController : BaseController
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

        /// http://localhost:8421/api/execution/has
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
            if (HttpContext.IsAllowAuthorization() == false)
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
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Execution/has");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/function/api/execution/refresh?changeType=Created&filePath=EWP/ZZD/TST010/featureMain.js
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

                    logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {changeType}, FilePath: {filePath}", "Query/Refresh");

                    var fileInfo = new FileInfo(filePath);

                    var businessContracts = FunctionMapper.ScriptMappings;
                    lock (businessContracts)
                    {
                        var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), changeType);
                        switch (watcherChangeTypes)
                        {
                            case WatcherChangeTypes.Created:
                            case WatcherChangeTypes.Changed:
                                if (!string.IsNullOrWhiteSpace(userWorkID) && !string.IsNullOrWhiteSpace(applicationID))
                                {
                                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                                    var itemPath = PathExtensions.Join(appBasePath, filePath);
                                    var directoryInfo = new DirectoryInfo(appBasePath);
                                    if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && (fileInfo.Name.StartsWith("featureMain.") == true || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                                    {
                                        if (fileInfo.Extension != ".json")
                                        {
                                            filePath = filePath.Replace(fileInfo.Name, "featureMeta.json");
                                        }

                                        logger.Information("[{LogCategory}] " + $"Add TenantApp ModuleScriptMap FilePath: {filePath}", "Query/Refresh");
                                        actionResult = FunctionMapper.AddScriptMap(filePath, true, logger);
                                    }
                                }
                                else
                                {
                                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                                    {
                                        var itemPath = PathExtensions.Join(basePath, filePath);
                                        var directoryInfo = new DirectoryInfo(basePath);
                                        if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && (fileInfo.Name.StartsWith("featureMain.") == true || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                                        {
                                            if (fileInfo.Extension != ".json")
                                            {
                                                filePath = filePath.Replace(fileInfo.Name, "featureMeta.json");
                                            }

                                            logger.Information("[{LogCategory}] " + $"Add ModuleScriptMap FilePath: {filePath}", "Query/Refresh");
                                            actionResult = FunctionMapper.AddScriptMap(filePath, true, logger);
                                            break;
                                        }
                                    }
                                }
                                break;
                            case WatcherChangeTypes.Deleted:
                                var existStatementMaps = new List<ModuleScriptMap>();
                                if (!string.IsNullOrWhiteSpace(userWorkID) && !string.IsNullOrWhiteSpace(applicationID))
                                {
                                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                                    var directoryInfo = new DirectoryInfo(appBasePath);
                                    if (directoryInfo.Exists == true)
                                    {
                                        existStatementMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                                            p.ApplicationID == applicationID &&
                                            p.ProjectID == fileInfo.Directory?.Parent?.Name &&
                                            p.TransactionID == fileInfo.Directory?.Name).ToList();
                                    }
                                }
                                else
                                {
                                    existStatementMaps = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                                        p.ApplicationID == GlobalConfiguration.ApplicationID &&
                                        p.ProjectID == fileInfo.Directory?.Parent?.Name &&
                                        p.TransactionID == fileInfo.Directory?.Name).ToList();
                                }

                                if (existStatementMaps.Count > 0)
                                {
                                    var mapStrings = new List<string>();
                                    for (var i = 0; i < existStatementMaps.Count; i++)
                                    {
                                        var item = existStatementMaps[i];
                                        mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.ScriptID}");
                                    }

                                    for (var i = 0; i < mapStrings.Count; i++)
                                    {
                                        var item = existStatementMaps[i];
                                        var items = mapStrings[i].SplitAndTrim('|');
                                        logger.Information("[{LogCategory}] " + $"Delete ModuleScriptMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.ScriptID}", "Query/Refresh");
                                        FunctionMapper.Remove(items[0], items[1], items[2], items[3]);
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
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Refresh");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8421/function/api/execution/retrieve?
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
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(model.ApplicationID) || string.IsNullOrWhiteSpace(model.ProjectID))
                    {
                        return Content("필수 항목 확인", "text/html");
                    }

                    var queryResults = FunctionMapper.ScriptMappings.Select(p => p.Value).Where(p =>
                            p.ProjectID == model.ProjectID);

                    if (!string.IsNullOrWhiteSpace(model.ApplicationID))
                    {
                        queryResults = queryResults.Where(p =>
                            p.ApplicationID == model.ApplicationID);
                    }

                    if (!string.IsNullOrWhiteSpace(model.TransactionID))
                    {
                        queryResults = queryResults.Where(p =>
                            p.TransactionID == model.TransactionID);
                    }

                    if (!string.IsNullOrWhiteSpace(model.FunctionID))
                    {
                        var queryFunctionID = model.FunctionID.Substring(0, model.FunctionID.Length - 2);
                        queryResults = queryResults.Where(p => p.ScriptID.Substring(0, p.ScriptID.Length - 2) == queryFunctionID);
                    }

                    var scriptMaps = queryResults.ToList();
                    if (scriptMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(scriptMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Execution/Retrieve");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/function/api/execution/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            ActionResult result = NotFound();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var queryResults = FunctionMapper.ScriptMappings.Select(p => p.Key);
                    var statementMaps = queryResults.ToList();
                    if (statementMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
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
            var response = new DynamicResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "빈 요청. 요청 정보 확인 필요";
                return result;
            }

            if (HttpContext.IsAllowAuthorization() == false)
            {
                response.ExceptionText = "필수 접근 정보 확인 필요";
                return result;
            }

            response.CorrelationID = request.GlobalID;
            if (string.IsNullOrWhiteSpace(request.RequestID))
            {
                request.RequestID = $"SELF_{GlobalConfiguration.SystemID}{GlobalConfiguration.HostName}{GlobalConfiguration.RunningEnvironment}{DateTime.Now:yyyyMMddHHmmssfff}";
            }

            if (string.IsNullOrWhiteSpace(request.GlobalID))
            {
                request.GlobalID = request.RequestID;
            }

            string? responseData = null;
            var acknowledge = "N";
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
                    var loadOptions = request.LoadOptions;
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

                if (!string.IsNullOrWhiteSpace(response.ExceptionText))
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

