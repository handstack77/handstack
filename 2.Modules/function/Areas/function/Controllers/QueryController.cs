using System;
using System.ComponentModel.Design;
using System.Linq;
using System.Threading.Tasks;

using function.Encapsulation;
using function.Entity;
using function.Events;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

namespace function.Areas.function.Controllers
{
    [Area("function")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class QueryController : BaseController
    {
        private readonly FunctionLoggerClient loggerClient;
        private readonly Serilog.ILogger logger;
        private readonly IFunctionClient dataClient;
        private readonly IMediator mediator;

        public QueryController(Serilog.ILogger logger, FunctionLoggerClient loggerClient, IFunctionClient dataClient, IMediator mediator)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.dataClient = dataClient;
            this.mediator = mediator;
        }

        // http://localhost:8421/function/api/query/has
        [HttpGet("[action]")]
        public ActionResult Has(string applicationID, string projectID, string transactionID, string functionID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var value = FunctionMapper.HasScript(applicationID, projectID, transactionID, functionID);
                return Content(JsonConvert.SerializeObject(value), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 함수 매핑 확인 오류", "Query/Has");
                return StatusCode(StatusCodes.Status500InternalServerError, "함수 매핑 확인 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/function/api/query/refresh?changeType=Created&filePath=EWP/ZZD/TST010/featureMain.js
        [HttpGet("[action]")]
        public async Task<ActionResult> Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var actionResult = await mediator.Send(new ExecutionRefreshRequest(changeType, filePath, userWorkID, applicationID));
                return Content(JsonConvert.SerializeObject(actionResult), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 함수 계약 리프레시 오류", "Query/Refresh");
                return StatusCode(StatusCodes.Status500InternalServerError, "함수 계약 리프레시 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/function/api/query/retrieve
        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID, string? functionID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                if (string.IsNullOrWhiteSpace(applicationID) || string.IsNullOrWhiteSpace(projectID))
                {
                    return Content("필수 항목 확인", "text/html");
                }

                var queryResults = FunctionMapper.ScriptMappings.Select(item => item.Value).Where(item => item.ApplicationID == applicationID);
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

                    queryResults = queryResults.Where(item => TryGetFunctionIDPrefix(item.ScriptID, out var scriptIDPrefix) && scriptIDPrefix == queryFunctionID);
                }

                return Content(JsonConvert.SerializeObject(queryResults.ToList()), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 함수 계약 조회 오류", "Query/Retrieve");
                return StatusCode(StatusCodes.Status500InternalServerError, "함수 계약 조회 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/function/api/query/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                return Content(JsonConvert.SerializeObject(FunctionMapper.ScriptMappings.Select(item => item.Key).ToList()), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 함수 메타 조회 오류", "Query/Meta");
                return StatusCode(StatusCodes.Status500InternalServerError, "함수 메타 조회 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/function/api/query/reports
        [HttpGet("[action]")]
        public ActionResult Reports(string? queryIDs)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var queryResults = FunctionMapper.ScriptMappings.Select(item => item.Value);
                if (string.IsNullOrWhiteSpace(queryIDs) == false)
                {
                    queryResults = queryResults.Where(item => IsQueryIDMatch(queryIDs, item.ApplicationID, item.ProjectID, item.TransactionID, item.ScriptID));
                }

                var reports = queryResults.Select(item => new QueryReport
                {
                    CommandType = "F",
                    ApplicationID = item.ApplicationID,
                    ProjectID = item.ProjectID,
                    TransactionID = item.TransactionID,
                    ServiceID = item.ExportName,
                    Seq = item.Seq,
                    Description = item.Description,
                    Parameters = item.ModuleParameters.Select(moduleParameterMap => new QueryReportParameter
                    {
                        Name = NormalizeParameterName(moduleParameterMap.Name),
                        DefaultValue = moduleParameterMap.DefaultValue,
                        DbType = moduleParameterMap.DbType,
                        Length = moduleParameterMap.Length,
                        IsRequired = moduleParameterMap.IsRequired
                    }).ToList(),
                    OutputMetas = item.OutputMetas
                }).ToList();

                return Content(JsonConvert.SerializeObject(reports), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 함수 리포트 조회 오류", "Query/Reports");
                return StatusCode(StatusCodes.Status500InternalServerError, "함수 리포트 조회 중 오류가 발생했습니다.");
            }
        }

        private static string NormalizeParameterName(string parameterName)
        {
            return string.IsNullOrEmpty(parameterName) == true
                ? parameterName
                : parameterName[0] switch
                {
                    '@' or ':' or '$' or '#' => parameterName.Substring(1),
                    _ => parameterName
                };
        }

        // http://localhost:8421/function/api/query/execute
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
                response.CorrelationID = request.GlobalID;
            }

            string? responseData = null;
            try
            {
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Request JSON: {RequestJson}", "Query/Execute", request.GlobalID, SerializeForLog(request));
                    });
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

                responseData = JsonConvert.SerializeObject(response);
                if (string.IsNullOrWhiteSpace(response.ExceptionText) == false)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/Execute", error =>
                        {
                            logger.Error("[{LogCategory}] fallback error: {Error}, {ExceptionText}", "Query/Execute", error, response.ExceptionText);
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] {ExceptionText}", "Query/Execute", request.GlobalID, response.ExceptionText);
                    }
                }

                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    var acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                    loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Response JSON: {ResponseJson}", "Query/Execute", response.CorrelationID, TruncateForLog(responseData));
                    });
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = "스크립트 실행 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] 스크립트 실행 오류", "Query/Execute", request.GlobalID);

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/Execute", error =>
                    {
                        logger.Error("[{LogCategory}] fallback error: {Error}, {ExceptionText}", "Query/Execute", error, response.ExceptionText);
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] {ExceptionText}", "Query/Execute", request.GlobalID, response.ExceptionText);
                }

                responseData = JsonConvert.SerializeObject(response);
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Response JSON: {ResponseJson}", "Query/Execute", response.CorrelationID, TruncateForLog(responseData));
                    });
                }
            }

            return Content(responseData, "application/json");
        }

        private static bool IsQueryIDMatch(string queryIDs, string applicationID, string projectID, string transactionID, string scriptID)
        {
            var filters = queryIDs.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var filter in filters)
            {
                var parts = filter.Split('|', StringSplitOptions.TrimEntries);
                bool isMatch =
                    (parts.Length < 1 || string.Equals(parts[0], applicationID, StringComparison.OrdinalIgnoreCase)) &&
                    (parts.Length < 2 || string.Equals(parts[1], projectID, StringComparison.OrdinalIgnoreCase)) &&
                    (parts.Length < 3 || string.Equals(parts[2], transactionID, StringComparison.OrdinalIgnoreCase)) &&
                    (parts.Length < 4 || scriptID.StartsWith(parts[3], StringComparison.OrdinalIgnoreCase));

                if (isMatch)
                {
                    return true;
                }
            }

            return false;
        }

        private static bool TryGetFunctionIDPrefix(string? functionID, out string functionIDPrefix)
        {
            functionIDPrefix = string.Empty;
            if (string.IsNullOrWhiteSpace(functionID) || functionID.Length < 3)
            {
                return false;
            }

            functionIDPrefix = functionID.SubstringSafe(0, functionID.Length - 2);
            return string.IsNullOrWhiteSpace(functionIDPrefix) == false;
        }

        private static string SerializeForLog(object? value)
        {
            try
            {
                return TruncateForLog(JsonConvert.SerializeObject(value));
            }
            catch (Exception exception)
            {
                return TruncateForLog($"<serialization failed: {exception.Message}>");
            }
        }

        private static string TruncateForLog(string? value, int maxLength = 32768)
        {
            if (string.IsNullOrEmpty(value) == true)
            {
                return string.Empty;
            }

            return value.Length <= maxLength ? value : value.SubstringSafe(0, maxLength) + "...(truncated)";
        }
    }
}
