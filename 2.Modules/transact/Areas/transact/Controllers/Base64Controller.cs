using System;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Common;
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
    public class Base64Controller(Serilog.ILogger logger, TransactLoggerClient loggerClient) : BaseController
    {
        private TransactLoggerClient loggerClient { get; } = loggerClient;
        private Serilog.ILogger logger { get; } = logger;

        // http://localhost:8421/transact/api/base64/encode?value={"ProjectID":"SYN","BusinessID":"DSO","TransactionID":"0001","FunctionID":"R01"}
        [HttpGet("[action]")]
        public string Encode(string value)
        {
            string? result;
            try
            {
                value = WebUtility.UrlDecode(value);
                result = value.EncodeBase64();
            }
            catch (Exception exception)
            {
                result = "인코딩 값 확인 필요";
                logger.Warning(exception, "[{LogCategory}] Base64 인코딩 오류", "Base64/Encode");
            }

            // throw new Exception("hello world");
            return result;
        }

        // http://localhost:8421/transact/api/base64/decode?value=eyJQcm9qZWN0SUQiOiJRQUYiLCJCdXNpbmVzc0lEIjoiRFNPIiwiVHJhbnNhY3Rpb25JRCI6IjAwMDEiLCJGdW5jdGlvbklEIjoiUjAxIn0=
        [HttpGet("[action]")]
        public string Decode(string value)
        {
            string? result;
            try
            {
                result = value.DecodeBase64();
            }
            catch (Exception exception)
            {
                result = "Base64 문자열 확인 필요";
                logger.Warning(exception, "[{LogCategory}] Base64 디코딩 오류", "Base64/Decode");
            }

            return result;
        }
    }
}
