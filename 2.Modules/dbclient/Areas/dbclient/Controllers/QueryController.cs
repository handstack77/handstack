using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using dbclient.Encapsulation;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

namespace dbclient.Areas.dbclient.Controllers
{
    [Area("dbclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class QueryController : ControllerBase
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

        // http://localhost:8000/dbclient/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/dbclient/api/query/has?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
        [HttpGet("[action]")]
        public ActionResult Has(string base64Json)
        {
            var definition = new
            {
                ApplicationID = "",
                ProjectID = "",
                TransactionID = "",
                FunctionID = ""
            };

            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string json = base64Json.DecodeBase64();
                    var model = JsonConvert.DeserializeAnonymousType(json, definition);
                    if (model != null)
                    {
                        var value = DatabaseMapper.HasStatement(model.ApplicationID, model.ProjectID, model.TransactionID, model.FunctionID);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Has");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/base64/encode?value={"SqlFilePath":"SYN\DSO\SYNDSO0001.xml","ForceUpdate":true}
        // http://localhost:8000/dbclient/api/query/upsert?base64Json=eyJTcWxGaWxlUGF0aCI6IlFBRlxEU09cUUFGRFNPMDAwMS54bWwiLCJGb3JjZVVwZGF0ZSI6dHJ1ZX0=
        [HttpGet("[action]")]
        public ActionResult Upsert(string base64Json)
        {
            var definition = new
            {
                SqlFilePath = "",
                ForceUpdate = false
            };

            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string json = base64Json.DecodeBase64();
                    var model = JsonConvert.DeserializeAnonymousType(json, definition);
                    if (model != null)
                    {
                        var value = DatabaseMapper.AddStatementMap(model.SqlFilePath, model.ForceUpdate, logger);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Upsert");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/refresh?changeType=Created&filePath=HDS/ZZD/TST010.xml
        [HttpGet("[action]")]
        public ActionResult Refresh(string changeType, string filePath)
        {
            ActionResult result = NotFound();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
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

                    logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {changeType}, FilePath: {filePath}", "Query/Refresh");

                    List<StatementMap> existStatementMaps = new List<StatementMap>();
                    FileInfo fileInfo = new FileInfo(filePath);

                    if (filePath.StartsWith(GlobalConfiguration.ApplicationID) == false)
                    {
                        lock (DatabaseMapper.DataSourceMappings)
                        {
                            var dataSourceMappings = DatabaseMapper.DataSourceMappings.Where(x => x.Value.ApplicationID == fileInfo.Directory?.Parent?.Name).ToList();
                            for (int i = dataSourceMappings.Count(); i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                DatabaseMapper.DataSourceMappings.Remove(item);
                            }
                        }
                    }

                    lock (DatabaseMapper.StatementMappings)
                    {
                        existStatementMaps = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == fileInfo.Directory?.Parent?.Name &&
                            p.ProjectID == fileInfo.Directory?.Name &&
                            p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();

                        if (existStatementMaps.Count > 0)
                        {
                            List<string> mapStrings = new List<string>();
                            for (int i = 0; i < existStatementMaps.Count; i++)
                            {
                                var item = existStatementMaps[i];
                                mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.StatementID}");
                            }

                            for (int i = 0; i < mapStrings.Count; i++)
                            {
                                var item = existStatementMaps[i];
                                var items = mapStrings[i].SplitAndTrim('|');
                                logger.Information("[{LogCategory}] " + $"Delete StatementMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.StatementID}", "Query/Refresh");
                                DatabaseMapper.Remove(items[0], items[1], items[2], items[3]);
                            }
                        }
                    }

                    WatcherChangeTypes watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), changeType);
                    bool actionResult = false;
                    switch (watcherChangeTypes)
                    {
                        case WatcherChangeTypes.Created:
                        case WatcherChangeTypes.Changed:
                            if (DatabaseMapper.HasContractFile(filePath) == true && fileInfo.Extension == ".xml" == true)
                            {
                                logger.Information("[{LogCategory}] " + $"Add StatementMap FilePath: {filePath}", "Query/Refresh");
                                actionResult = DatabaseMapper.AddStatementMap(filePath, true, logger);
                            }
                            break;
                    }

                    result = Content(JsonConvert.SerializeObject(actionResult), "application/json");
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Refresh");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/dbclient/api/query/delete?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
        [HttpGet("Delete")]
        public ActionResult Delete(string base64Json)
        {
            var definition = new
            {
                ApplicationID = "",
                ProjectID = "",
                TransactionID = "",
                FunctionID = ""
            };

            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string json = base64Json.DecodeBase64();
                    var model = JsonConvert.DeserializeAnonymousType(json, definition);
                    if (model != null)
                    {
                        var value = DatabaseMapper.Remove(model.ApplicationID, model.ProjectID, model.TransactionID, model.FunctionID);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Delete");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/dbclient/api/query/get?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
        [HttpGet("[action]")]
        public ActionResult Get(string base64Json)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string json = base64Json.DecodeBase64();

                    var model = JsonConvert.DeserializeAnonymousType(json, new
                    {
                        ApplicationID = "",
                        ProjectID = "",
                        TransactionID = "",
                        FunctionID = ""
                    });

                    if (model != null)
                    {
                        StatementMap? statementMap = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID &&
                            p.ProjectID == model.ProjectID &&
                            p.TransactionID == model.TransactionID &&
                            p.StatementID == model.FunctionID).FirstOrDefault();

                        if (statementMap != null)
                        {
                            var value = JsonConvert.SerializeObject(statementMap);
                            result = Content(JsonConvert.SerializeObject(value), "application/json");
                        }
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Get");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/dbclient/api/query/retrieve?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiIiwiVHJhbnNhY3Rpb25JRCI6IiIsIkZ1bmN0aW9uSUQiOiIifQ==
        [HttpGet("[action]")]
        public ActionResult Retrieve(string base64Json)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string json = base64Json.DecodeBase64();
                    var model = JsonConvert.DeserializeAnonymousType(json, new
                    {
                        ApplicationID = "",
                        ProjectID = "",
                        TransactionID = "",
                        FunctionID = ""
                    });

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
                        string functionID = model.FunctionID.Substring(0, model.FunctionID.Length - 2);
                        queryResults = queryResults.Where(p => p.StatementID.Substring(0, p.StatementID.Length - 2) == functionID);
                    }

                    List<StatementMap> statementMaps = queryResults.ToList();
                    result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Retrieve");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100","TransactionLog":true}
        // http://localhost:8000/dbclient/api/query/log?base64Json=eyJQcm9qZWN0SUQiOiJTVlUiLCJCdXNpbmVzc0lEIjoiWlpEIiwiVHJhbnNhY3Rpb25JRCI6IlRTVDAxMCIsIkZ1bmN0aW9uSUQiOiJHMDEwMCIsIlRyYW5zYWN0aW9uTG9nIjp0cnVlfQ==
        [HttpGet("[action]")]
        public ActionResult Log(string base64Json)
        {
            var definition = new
            {
                ApplicationID = "",
                ProjectID = "",
                TransactionID = "",
                FunctionID = "",
                TransactionLog = false
            };

            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    string json = base64Json.DecodeBase64();
                    var model = JsonConvert.DeserializeAnonymousType(json, definition);

                    if (model != null)
                    {
                        StatementMap? statementMap = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID &&
                            p.ProjectID == model.ProjectID &&
                            p.TransactionID == model.TransactionID &&
                            p.StatementID == model.FunctionID).FirstOrDefault();

                        if (statementMap != null)
                        {
                            statementMap.TransactionLog = model.TransactionLog;
                            result = Content(JsonConvert.SerializeObject(model.TransactionLog), "application/json");
                        }
                        else
                        {
                            result = Ok();
                        }
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Log");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Value);
                    List<StatementMap> statementMaps = queryResults.ToList();
                    if (statementMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Meta");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/reports
        [HttpGet("[action]")]
        public ActionResult Reports()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Value);
                    List<StatementMap> statementMaps = queryResults.ToList();
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
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Reports");

                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/query/execute
        [HttpPost()]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            ActionResult result = BadRequest();
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
                    Dictionary<string, string> loadOptions = request.LoadOptions;
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
                string acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
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
                    string responseData = JsonConvert.SerializeObject(response);
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
                        string responseData = JsonConvert.SerializeObject(response);

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
