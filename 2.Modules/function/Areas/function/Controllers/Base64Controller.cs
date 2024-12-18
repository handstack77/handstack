using System;
using System.Net;

using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Common;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace function.Areas.function.Controllers
{
    [Area("function")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class Base64Controller : BaseController
    {
        private FunctionLoggerClient loggerClient { get; }
        
        private Serilog.ILogger logger { get; }

        public Base64Controller(Serilog.ILogger logger, FunctionLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // http://localhost:8000/function/api/base64/encode?value={"ProjectID":"SYN","BusinessID":"DSO","TransactionID":"0001","FunctionID":"R01"}
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
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Base64/Encode");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/function/api/base64/decode?value=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxIn0=
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
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Base64/Decode");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }
    }
}
