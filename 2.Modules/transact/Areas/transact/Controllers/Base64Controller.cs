using System;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class Base64Controller : ControllerBase
    {
        private TransactLoggerClient loggerClient { get; }
        private Serilog.ILogger logger { get; }

        public Base64Controller(Serilog.ILogger logger, TransactLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // http://localhost:8000/transact/api/base64/encode?value={"ProjectID":"SYN","BusinessID":"DSO","TransactionID":"0001","FunctionID":"R01"}
        [HttpGet("[action]")]
        public string Encode(string value)
        {
            string result = "";

            try
            {
                value = WebUtility.UrlDecode(value);
                result = value.EncodeBase64();
            }
            catch (Exception exception)
            {
                result = exception.ToMessage();

                string exceptionText = result;
                logger.Error("[{LogCategory}] " + exceptionText, "Base64/Encode");
            }

            // throw new Exception("hello world");
            return result;
        }

        // http://localhost:8000/transact/api/base64/decode?value=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxIn0=
        [HttpGet("[action]")]
        public string Decode(string value)
        {
            string result = "";

            try
            {
                result = value.DecodeBase64();
            }
            catch (Exception exception)
            {
                result = exception.ToMessage();

                string exceptionText = result;
                logger.Error("[{LogCategory}] " + exceptionText, "Base64/Decode");
            }

            return result;
        }
    }
}
