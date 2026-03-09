using System;
using System.Net;

using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Common;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace dbclient.Areas.dbclient.Controllers
{
    [Area("dbclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class Base64Controller : BaseController
    {
        private DbClientLoggerClient loggerClient { get; }

        private Serilog.ILogger logger { get; }

        public Base64Controller(Serilog.ILogger logger, DbClientLoggerClient loggerClient)
        {

            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // http://localhost:8421/dbclient/api/base64/encode?value={"ProjectID":"SYN","BusinessID":"DSO","TransactionID":"0001","FunctionID":"R01"}
        [HttpGet("[action]")]
        public ActionResult Encode(string value)
        {
            ActionResult result;
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    value = WebUtility.UrlDecode(value);
                    result = Content(value.EncodeBase64(), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Warning(exception, "[{LogCategory}] Base64 인코딩 오류", "Base64/Encode");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "인코딩 값 확인 필요");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/base64/decode?value=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxIn0=
        [HttpGet("[action]")]
        public ActionResult Decode(string value)
        {
            ActionResult result;
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    result = Content(value.DecodeBase64(), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Warning(exception, "[{LogCategory}] Base64 디코딩 오류", "Base64/Decode");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "Base64 문자열 확인 필요");
                }
            }

            return result;
        }
    }
}
