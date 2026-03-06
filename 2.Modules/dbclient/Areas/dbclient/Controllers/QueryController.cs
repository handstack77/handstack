using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using dbclient.Encapsulation;
using dbclient.Entity;
using dbclient.Events;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

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
        private readonly IMediator mediator;

        public QueryController(Serilog.ILogger logger, IQueryDataClient dataClient, DbClientLoggerClient loggerClient, IMediator mediator)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.dataClient = dataClient;
            this.mediator = mediator;
        }

        // http://localhost:8421/dbclient/api/query/has
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
                    logger.Error(exception, "[{LogCategory}] SQL 매핑 확인 오류", "Query/Has");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "SQL 매핑 확인 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/query/refresh?changeType=Created&filePath=HDS/ZZD/TST010.xml
        [HttpGet("[action]")]
        public async Task<ActionResult> Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
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
                    var actionResult = await mediator.Send(new QueryRefreshRequest(changeType, filePath, userWorkID, applicationID));
                    result = Content(JsonConvert.SerializeObject(actionResult), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] SQL 계약 리프레시 오류", "Query/Refresh");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "SQL 계약 리프레시 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/query/retrieve?
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

                    if (model == null || string.IsNullOrWhiteSpace(model.ApplicationID) || string.IsNullOrWhiteSpace(model.ProjectID))
                    {
                        return Content("필수 항목 확인", "text/html");
                    }

                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Value).Where(p =>
                            p.ApplicationID == model.ApplicationID);

                    if (!string.IsNullOrWhiteSpace(model.ProjectID))
                    {
                        queryResults = queryResults.Where(p =>
                            p.ProjectID == model.ProjectID);
                    }

                    if (!string.IsNullOrWhiteSpace(model.TransactionID))
                    {
                        queryResults = queryResults.Where(p =>
                            p.TransactionID == model.TransactionID);
                    }

                    if (!string.IsNullOrWhiteSpace(model.FunctionID))
                    {
                        if (!TryGetFunctionIDPrefix(model.FunctionID, out var queryFunctionID))
                        {
                            return BadRequest("functionID 형식 확인 필요");
                        }

                        queryResults = queryResults.Where(p => TryGetFunctionIDPrefix(p.StatementID, out var statementID) && statementID == queryFunctionID);
                    }

                    var statementMaps = queryResults.ToList();
                    result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] SQL 계약 조회 오류", "Query/Retrieve");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "SQL 계약 조회 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/query/meta
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
                    var queryResults = DatabaseMapper.StatementMappings.Select(p => p.Key);
                    var statementMaps = queryResults.ToList();
                    if (statementMaps != null)
                    {
                        result = Content(JsonConvert.SerializeObject(statementMaps), "application/json");
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] SQL 메타 조회 오류", "Query/Meta");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "SQL 메타 조회 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/query/reports
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
                    logger.Error(exception, "[{LogCategory}] SQL 리포트 조회 오류", "Query/Reports");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "SQL 리포트 조회 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/query/execute
        [HttpPost()]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            ActionResult result = BadRequest();
            var response = new DynamicResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "빈 요청. 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }

            if (HttpContext.IsAllowAuthorization() == false)
            {
                response.ExceptionText = "필수 접근 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
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

                if (!string.IsNullOrWhiteSpace(response.ExceptionText))
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
                response.ExceptionText = "SQL 실행 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] SQL 실행 오류", "Query/QueryDataClient Execute", request.GlobalID);
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
                    if (string.IsNullOrWhiteSpace(responseData))
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
                response.ExceptionText = "응답 생성 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] SQL 응답 생성 오류", "Query/DynamicResponse Execute", request.GlobalID);
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
                    var responseData = "치명적인 응답 처리 오류가 발생했습니다.";
                    logger.Error(fatalException, "[{LogCategory}] [{GlobalID}] 치명적인 SQL 응답 처리 오류", "Query/QueryDataClient Execute", request.GlobalID);
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

        private static bool TryGetFunctionIDPrefix(string? functionID, out string functionIDPrefix)
        {
            functionIDPrefix = string.Empty;
            if (string.IsNullOrWhiteSpace(functionID) || functionID.Length < 3)
            {
                return false;
            }

            functionIDPrefix = functionID.Substring(0, functionID.Length - 2);
            return !string.IsNullOrWhiteSpace(functionIDPrefix);
        }
    }
}

