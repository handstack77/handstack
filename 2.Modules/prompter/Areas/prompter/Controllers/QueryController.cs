using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using prompter.Encapsulation;
using prompter.Entity;
using prompter.Extensions;

namespace prompter.Areas.prompter.Controllers
{
    [Area("prompter")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class QueryController : ControllerBase
    {
        private PromptLoggerClient loggerClient { get; }

        private Serilog.ILogger logger { get; }

        private IPromptClient dataClient { get; }

        public QueryController(Serilog.ILogger logger, IPromptClient dataClient, PromptLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.dataClient = dataClient;
        }

        // http://localhost:8000/prompter/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/prompter/api/query/has?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
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
            string? authorizationKey = Request.Headers["AuthorizationKey"];
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
                        var value = PromptMapper.HasPrompt(model.ApplicationID, model.ProjectID, model.TransactionID, model.FunctionID);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Has");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/base64/encode?value={"PromptFilePath":"SYN\DSO\SYNDSO0001.xml","ForceUpdate":true}
        // http://localhost:8000/prompter/api/query/upsert?base64Json=eyJTcWxGaWxlUGF0aCI6IlFBRlxEU09cUUFGRFNPMDAwMS54bWwiLCJGb3JjZVVwZGF0ZSI6dHJ1ZX0=
        [HttpGet("[action]")]
        public ActionResult Upsert(string base64Json)
        {
            var definition = new
            {
                PromptFilePath = "",
                ForceUpdate = false
            };

            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
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
                        var value = PromptMapper.AddPromptMap(model.PromptFilePath, model.ForceUpdate, logger);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Upsert");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/query/refresh?changeType=Created&filePath=HDS/ZZD/TST010.xml
        [HttpGet("[action]")]
        public ActionResult Refresh(string changeType, string filePath)
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

                    logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {changeType}, FilePath: {filePath}", "Query/Refresh");

                    List<PromptMap> existPromptMaps = new List<PromptMap>();
                    FileInfo fileInfo = new FileInfo(filePath);

                    if (filePath.StartsWith(GlobalConfiguration.ApplicationID) == false)
                    {
                        lock (PromptMapper.DataSourceMappings)
                        {
                            var dataSourceMappings = PromptMapper.DataSourceMappings.Where(x => x.Value.ApplicationID == fileInfo.Directory?.Parent?.Name).ToList();
                            for (int i = dataSourceMappings.Count(); i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                PromptMapper.DataSourceMappings.Remove(item);
                            }
                        }
                    }

                    lock (PromptMapper.PromptMappings)
                    {
                        existPromptMaps = PromptMapper.PromptMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == fileInfo.Directory?.Parent?.Name &&
                            p.ProjectID == fileInfo.Directory?.Name &&
                            p.TransactionID == fileInfo.Name.Replace(fileInfo.Extension, "")).ToList();

                        if (existPromptMaps.Count > 0)
                        {
                            List<string> mapStrings = new List<string>();
                            for (int i = 0; i < existPromptMaps.Count; i++)
                            {
                                var item = existPromptMaps[i];
                                mapStrings.Add($"{item.ApplicationID}|{item.ProjectID}|{item.TransactionID}|{item.StatementID}");
                            }

                            for (int i = 0; i < mapStrings.Count; i++)
                            {
                                var item = existPromptMaps[i];
                                var items = mapStrings[i].SplitAndTrim('|');
                                logger.Information("[{LogCategory}] " + $"Delete PromptMap ApplicationID: {item.ApplicationID}, ProjectID: {item.ProjectID}, TransactionID: {item.TransactionID}, FunctionID: {item.StatementID}", "Query/Refresh");
                                PromptMapper.Remove(items[0], items[1], items[2], items[3]);
                            }
                        }
                    }

                    WatcherChangeTypes watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), changeType);
                    bool actionResult = false;
                    switch (watcherChangeTypes)
                    {
                        case WatcherChangeTypes.Created:
                        case WatcherChangeTypes.Changed:
                            if (PromptMapper.HasContractFile(filePath) == true && fileInfo.Extension == ".xml" == true)
                            {
                                logger.Information("[{LogCategory}] " + $"Add PromptMap FilePath: {filePath}", "Query/Refresh");
                                actionResult = PromptMapper.AddPromptMap(filePath, true, logger);
                            }
                            break;
                    }

                    result = Content(JsonConvert.SerializeObject(actionResult), "application/json");
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Refresh");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/prompter/api/query/delete?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
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
            string? authorizationKey = Request.Headers["AuthorizationKey"];
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
                        var value = PromptMapper.Remove(model.ApplicationID, model.ProjectID, model.TransactionID, model.FunctionID);
                        result = Content(JsonConvert.SerializeObject(value), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Delete");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/prompter/api/query/get?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxMDAifQ==
        [HttpGet("[action]")]
        public ActionResult Get(string base64Json)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
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
                        PromptMap? promptMap = PromptMapper.PromptMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID &&
                            p.ProjectID == model.ProjectID &&
                            p.TransactionID == model.TransactionID &&
                            p.StatementID == model.FunctionID).FirstOrDefault();

                        if (promptMap != null)
                        {
                            var value = JsonConvert.SerializeObject(promptMap);
                            result = Content(JsonConvert.SerializeObject(value), "application/json");
                        }
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Get");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100"}
        // http://localhost:8000/prompter/api/query/retrieve?base64Json=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiIiwiVHJhbnNhY3Rpb25JRCI6IiIsIkZ1bmN0aW9uSUQiOiIifQ==
        [HttpGet("[action]")]
        public ActionResult Retrieve(string base64Json)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
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

                    var queryResults = PromptMapper.PromptMappings.Select(p => p.Value).Where(p =>
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

                    List<PromptMap> promptMaps = queryResults.ToList();
                    result = Content(JsonConvert.SerializeObject(promptMaps), "application/json");
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Retrieve");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/base64/encode?value={"ApplicationID":"SYN","ProjectID":"ZZD","TransactionID":"TST010","FunctionID":"G0100","TransactionLog":true}
        // http://localhost:8000/prompter/api/query/log?base64Json=eyJQcm9qZWN0SUQiOiJTVlUiLCJCdXNpbmVzc0lEIjoiWlpEIiwiVHJhbnNhY3Rpb25JRCI6IlRTVDAxMCIsIkZ1bmN0aW9uSUQiOiJHMDEwMCIsIlRyYW5zYWN0aW9uTG9nIjp0cnVlfQ==
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
            string? authorizationKey = Request.Headers["AuthorizationKey"];
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
                        PromptMap? promptMap = PromptMapper.PromptMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID &&
                            p.ProjectID == model.ProjectID &&
                            p.TransactionID == model.TransactionID &&
                            p.StatementID == model.FunctionID).FirstOrDefault();

                        if (promptMap != null)
                        {
                            promptMap.TransactionLog = model.TransactionLog;
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

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/query/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var queryResults = PromptMapper.PromptMappings.Select(p => p.Value);
                    List<PromptMap> promptMaps = queryResults.ToList();
                    if (promptMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(promptMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Query/Meta");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/query/reports
        [HttpGet("[action]")]
        public ActionResult Reports()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.Headers["AuthorizationKey"];
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var queryResults = PromptMapper.PromptMappings.Select(p => p.Value);
                    List<PromptMap> promptMaps = queryResults.ToList();
                    if (promptMaps != null)
                    {
                        var reports = promptMaps.Select(p => new
                        {
                            ApplicationID = p.ApplicationID,
                            ProjectID = p.ProjectID,
                            TransactionID = p.TransactionID,
                            DataSourceID = p.DataSourceID,
                            StatementID = p.StatementID,
                            Seq = p.Seq,
                            MaxTokens = p.MaxTokens,
                            Temperature = p.Temperature,
                            TopP = p.TopP,
                            PresencePenalty = p.PresencePenalty,
                            FrequencyPenalty = p.FrequencyPenalty,
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

                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/prompter/api/query/execute
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
                        await dataClient.ExecuteDynamicPromptMap(request, response);
                        break;
                    default:
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
