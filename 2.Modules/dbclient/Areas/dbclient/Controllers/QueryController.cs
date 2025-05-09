using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using dbclient.Encapsulation;
using dbclient.Entity;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

namespace dbclient.Areas.dbclient.Controllers
{
    [Area("dbclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class QueryController : BaseController
    {
        private DbClientLoggerClient loggerClient { get; }

        private Serilog.ILogger logger { get; }

        private IQueryDataClient dataClient { get; }

        public QueryController(Serilog.ILogger logger, IQueryDataClient dataClient, DbClientLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.dataClient = dataClient;
        }

        // http://localhost:8000/dbclient/api/query/has
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

            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var value = DatabaseMapper.HasStatement(model.ApplicationID, model.ProjectID, model.TransactionID, model.FunctionID);
                    result = Content(JsonConvert.SerializeObject(value), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Has");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/refresh?changeType=Created&filePath=HDS/ZZD/TST010.xml
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

                    var businessContracts = DatabaseMapper.StatementMappings;
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
                                    if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && fileInfo.Extension == ".xml" == true)
                                    {
                                        logger.Information("[{LogCategory}] " + $"Add TenantApp StatementMap FilePath: {filePath}", "Query/Refresh");
                                        actionResult = DatabaseMapper.AddStatementMap(filePath, true, logger);
                                    }
                                }
                                else
                                {
                                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                                    {
                                        var itemPath = PathExtensions.Join(basePath, filePath);
                                        var directoryInfo = new DirectoryInfo(basePath);
                                        if (directoryInfo.Exists == true && System.IO.File.Exists(itemPath) == true && fileInfo.Extension == ".xml" == true)
                                        {
                                            logger.Information("[{LogCategory}] " + $"Add StatementMap FilePath: {filePath}", "Query/Refresh");
                                            actionResult = DatabaseMapper.AddStatementMap(filePath, true, logger);
                                            break;
                                        }
                                    }
                                }
                                break;
                            case WatcherChangeTypes.Deleted:
                                var existStatementMaps = new List<StatementMap>();
                                if (string.IsNullOrEmpty(userWorkID) == false && string.IsNullOrEmpty(applicationID) == false)
                                {
                                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                                    var directoryInfo = new DirectoryInfo(appBasePath);
                                    if (directoryInfo.Exists == true)
                                    {
                                        existStatementMaps = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                                            p.ApplicationID == applicationID &&
                                            p.ProjectID == fileInfo.Directory?.Name &&
                                            p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();
                                    }
                                }
                                else
                                {
                                    existStatementMaps = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                                        p.ApplicationID == fileInfo.Directory?.Parent?.Name &&
                                        p.ProjectID == fileInfo.Directory?.Name &&
                                        p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();
                                }

                                if (existStatementMaps.Count > 0)
                                {
                                    var mapStrings = new List<string>();
                                    for (var i = 0; i < existStatementMaps.Count; i++)
                                    {
                                        var item = existStatementMaps[i];
                                        mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.StatementID}");
                                    }

                                    for (var i = 0; i < mapStrings.Count; i++)
                                    {
                                        var item = existStatementMaps[i];
                                        var items = mapStrings[i].SplitAndTrim('|');
                                        logger.Information("[{LogCategory}] " + $"Delete StatementMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.StatementID}", "Query/Refresh");
                                        DatabaseMapper.Remove(items[0], items[1], items[2], items[3]);
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

        // http://localhost:8000/dbclient/api/query/retrieve?
        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID, string? functionID)
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
                    var model = new
                    {
                        ApplicationID = applicationID,
                        ProjectID = projectID,
                        TransactionID = transactionID,
                        FunctionID = functionID
                    };

                    if (model == null || string.IsNullOrEmpty(model.ApplicationID) == true || string.IsNullOrEmpty(model.ProjectID) == true)
                    {
                        return Content("필수 항목 확인", "text/html");
                    }

                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
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

                    if (string.IsNullOrEmpty(model.FunctionID) == false)
                    {
                        var queryFunctionID = model.FunctionID.Substring(0, model.FunctionID.Length - 2);
                        queryResults = queryResults.Where(p => p.StatementID.Substring(0, p.StatementID.Length - 2) == queryFunctionID);
                    }

                    var statementMaps = queryResults.ToList();
                    result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Retrieve");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/meta
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
                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Value);
                    var statementMaps = queryResults.ToList();
                    if (statementMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Meta");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/reports
        [HttpGet("[action]")]
        public ActionResult Reports()
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
                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Value);
                    var statementMaps = queryResults.ToList();
                    if (statementMaps != null)
                    {
                        var reports = statementMaps.Select(p => new
                        {
                            ApplicationID = p.ApplicationID,
                            ProjectID = p.ProjectID,
                            TransactionID = p.TransactionID,
                            DataSourceID = p.DataSourceID,
                            StatementID = p.StatementID,
                            Seq = p.Seq,
                            NativeDataClient = p.NativeDataClient,
                            Timeout = p.Timeout,
                            Comment = p.Comment,
                            ModifiedAt = p.ModifiedAt
                        });

                        var value = JsonConvert.SerializeObject(reports);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Reports");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/execute
        [HttpPost()]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            ActionResult result = BadRequest();
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
            if (string.IsNullOrEmpty(request.RequestID) == true)
            {
                request.RequestID = $"SELF_{GlobalConfiguration.SystemID}{GlobalConfiguration.HostName}{GlobalConfiguration.RunningEnvironment}{DateTime.Now:yyyyMMddHHmmssfff}";
            }

            if (string.IsNullOrEmpty(request.GlobalID) == true)
            {
                request.GlobalID = request.RequestID;
            }

            try
            {
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {JsonConvert.SerializeObject(request)}", "Query/Execute", request.GlobalID);
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
                        await dataClient.ExecuteDynamicSQLMap(request, response);
                        break;
                    case ExecuteDynamicTypeObject.Scalar:
                        await dataClient.ExecuteDynamicSQLMapToScalar(request, response);
                        break;
                    case ExecuteDynamicTypeObject.NonQuery:
                        await dataClient.ExecuteDynamicSQLMapToNonQuery(request, response);
                        break;
                    case ExecuteDynamicTypeObject.SQLText:
                        await dataClient.ExecuteDynamicSQLText(request, response);
                        break;
                    case ExecuteDynamicTypeObject.SchemeOnly:
                        await dataClient.ExecuteSchemeOnlySQLMap(request, response);
                        break;
                    case ExecuteDynamicTypeObject.CodeHelp:
                        await dataClient.ExecuteCodeHelpSQLMap(request, response);
                        break;
                    case ExecuteDynamicTypeObject.Xml:
                        await dataClient.ExecuteDynamicSQLMapToXml(request, response);
                        break;
                    case ExecuteDynamicTypeObject.DynamicJson:
                        response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요";
                        break;
                }

                if (string.IsNullOrEmpty(response.ExceptionText) == false)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/Execute", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Query/Execute");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Query/Execute", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/QueryDataClient Execute", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Query/QueryDataClient Execute");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Query/QueryDataClient Execute", request.GlobalID);
                }
            }

            try
            {
                var acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                if (request.ReturnType == ExecuteDynamicTypeObject.Xml)
                {
                    var responseData = response.ResultObject as string;
                    if (string.IsNullOrEmpty(responseData) == true)
                    {
                        responseData = "<?xml version=\"1.0\" standalone=\"yes\"?><NewDataSet></NewDataSet>";
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                        {
                            logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                        });
                    }

                    result = Content(responseData, "text/xml");
                }
                else
                {
                    var responseData = JsonConvert.SerializeObject(response);
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                        {
                            logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                        });
                    }

                    result = Content(responseData, "application/json");
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/DynamicResponse Execute", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Query/DynamicResponse Execute");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Query/DynamicResponse Execute", request.GlobalID);
                }

                try
                {
                    if (request.ReturnType == ExecuteDynamicTypeObject.Json)
                    {
                        var responseData = JsonConvert.SerializeObject(response);

                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                            {
                                logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                            });
                        }

                        result = Content(responseData, "application/json");
                    }
                    else if (request.ReturnType == ExecuteDynamicTypeObject.Xml)
                    {
                        var responseData = response.ExceptionText;

                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                            {
                                logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                            });
                        }

                        result = Content(responseData, "text/xml");
                    }
                    else
                    {
                        result = NoContent();
                    }
                }
                catch (Exception fatalException)
                {
                    var responseData = fatalException.ToMessage();
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/QueryDataClient Execute", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + responseData, "Query/QueryDataClient Execute");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + responseData, "Query/QueryDataClient Execute", request.GlobalID);
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                        {
                            logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                        });
                    }

                    result = Content(responseData, "text/xml");
                }
            }

            return result;
        }
    }
}
