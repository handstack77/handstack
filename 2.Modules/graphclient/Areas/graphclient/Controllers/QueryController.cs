using System;
using System.Linq;
using System.Threading.Tasks;

using graphclient.Encapsulation;
using graphclient.Entity;
using graphclient.Events;
using graphclient.Extensions;

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

namespace graphclient.Areas.graphclient.Controllers
{
    [Area("graphclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class QueryController : BaseController
    {
        private readonly GraphClientLoggerClient loggerClient;
        private readonly Serilog.ILogger logger;
        private readonly IGraphDataClient dataClient;
        private readonly IMediator mediator;

        public QueryController(Serilog.ILogger logger, IGraphDataClient dataClient, GraphClientLoggerClient loggerClient, IMediator mediator)
        {
            this.logger = logger;
            this.dataClient = dataClient;
            this.loggerClient = loggerClient;
            this.mediator = mediator;
        }

        [HttpGet("[action]")]
        public ActionResult Has(string applicationID, string projectID, string transactionID, string functionID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var value = GraphMapper.HasStatement(applicationID, projectID, transactionID, functionID);
                return Content(JsonConvert.SerializeObject(value), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] graph 계약 매핑 확인 오류", "Query/Has");
                return StatusCode(StatusCodes.Status500InternalServerError, "graph 계약 매핑 확인 중 오류가 발생했습니다.");
            }
        }

        [HttpGet("[action]")]
        public async Task<ActionResult> Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var actionResult = await mediator.Send(new QueryRefreshRequest(changeType, filePath, userWorkID, applicationID));
                return Content(JsonConvert.SerializeObject(actionResult), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] graph 계약 리프레시 오류", "Query/Refresh");
                return StatusCode(StatusCodes.Status500InternalServerError, "graph 계약 리프레시 중 오류가 발생했습니다.");
            }
        }

        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID, string? functionID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var queryResults = GraphMapper.StatementMappings.Select(item => item.Value).Where(item => item.ApplicationID == applicationID);
                if (string.IsNullOrWhiteSpace(projectID) == false)
                {
                    queryResults = queryResults.Where(item => item.ProjectID == projectID);
                }

                if (string.IsNullOrWhiteSpace(transactionID) == false)
                {
                    queryResults = queryResults.Where(item => item.TransactionID == transactionID);
                }

                if (string.IsNullOrWhiteSpace(functionID) == false)
                {
                    if (TryGetFunctionIDPrefix(functionID, out var queryFunctionID) == false)
                    {
                        return BadRequest("functionID 형식 확인 필요");
                    }

                    queryResults = queryResults.Where(item => TryGetFunctionIDPrefix(item.StatementID, out var statementIDPrefix) && statementIDPrefix == queryFunctionID);
                }

                return Content(JsonConvert.SerializeObject(queryResults.ToList()), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] graph 계약 조회 오류", "Query/Retrieve");
                return StatusCode(StatusCodes.Status500InternalServerError, "graph 계약 조회 중 오류가 발생했습니다.");
            }
        }

        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                return Content(JsonConvert.SerializeObject(GraphMapper.StatementMappings.Select(item => item.Key).ToList()), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] graph 메타 조회 오류", "Query/Meta");
                return StatusCode(StatusCodes.Status500InternalServerError, "graph 메타 조회 중 오류가 발생했습니다.");
            }
        }

        [HttpGet("[action]")]
        public ActionResult Reports()
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var reports = GraphMapper.StatementMappings.Select(item => item.Value).Select(item => new
                {
                    item.ApplicationID,
                    item.ProjectID,
                    item.TransactionID,
                    item.DataSourceID,
                    item.StatementID,
                    item.Seq,
                    item.Timeout,
                    item.Comment,
                    item.TransactionLog,
                    item.ModifiedAt,
                    item.SourceFilePath
                }).ToList();

                return Content(JsonConvert.SerializeObject(reports), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] graph 리포트 조회 오류", "Query/Reports");
                return StatusCode(StatusCodes.Status500InternalServerError, "graph 리포트 조회 중 오류가 발생했습니다.");
            }
        }

        [HttpPost("[action]")]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            var response = new DynamicResponse()
            {
                Acknowledge = AcknowledgeType.Failure
            };

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
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {JsonConvert.SerializeObject(request)}", "Query/Execute", request.GlobalID);
                    });
                }

                await ExecuteAsync(request, response);
            }
            catch (Exception exception)
            {
                response.ExceptionText = "graph 실행 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] graph 실행 오류", "Query/Execute", request.GlobalID);
            }

            var responseData = JsonConvert.SerializeObject(response);
            if (ModuleConfiguration.IsTransactionLogging == true)
            {
                var acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, $"Query/Execute ReturnType: {request.ReturnType}", error =>
                {
                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                });
            }

            return Content(responseData, "application/json");
        }

        private Task ExecuteAsync(DynamicRequest request, DynamicResponse response)
        {
            return request.ReturnType switch
            {
                ExecuteDynamicTypeObject.Json => dataClient.ExecuteJsonAsync(request, response),
                ExecuteDynamicTypeObject.Scalar => dataClient.ExecuteScalarAsync(request, response),
                ExecuteDynamicTypeObject.NonQuery => dataClient.ExecuteNonQueryAsync(request, response),
                ExecuteDynamicTypeObject.SchemeOnly => dataClient.ExecuteSchemeOnlyAsync(request, response),
                ExecuteDynamicTypeObject.CodeHelp => dataClient.ExecuteCodeHelpAsync(request, response),
                ExecuteDynamicTypeObject.SQLText => dataClient.ExecuteSqlTextAsync(request, response),
                ExecuteDynamicTypeObject.Xml => dataClient.ExecuteXmlAsync(request, response),
                _ => Task.Run(() => response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요")
            };
        }

        private static bool TryGetFunctionIDPrefix(string? functionID, out string functionIDPrefix)
        {
            functionIDPrefix = string.Empty;
            if (string.IsNullOrWhiteSpace(functionID) || functionID.Length < 3)
            {
                return false;
            }

            functionIDPrefix = functionID.Substring(0, functionID.Length - 2);
            return string.IsNullOrWhiteSpace(functionIDPrefix) == false;
        }
    }
}

