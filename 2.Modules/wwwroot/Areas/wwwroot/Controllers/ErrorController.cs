using System;
using System.Collections.Generic;
using System.Globalization;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Serilog;

namespace wwwroot.Areas.wwwroot.Controllers
{
    [Area("wwwroot")]
    [Route("[controller]")]
    [ApiController]
    public class ErrorController : ControllerBase
    {
        private readonly IConfiguration configuration;
        private readonly ILogger logger;

        public ErrorController(IConfiguration configuration, ILogger logger)
        {
            this.configuration = configuration;
            this.logger = logger;
        }

        //[Route("{statusCode:int}")]
        //public IActionResult Error(int statusCode)
        //{
        //    var statusCodeFeature = HttpContext.Features.Get<IStatusCodeReExecuteFeature>();
        //    var exceptionDataFeature = HttpContext.Features.Get<IExceptionHandlerPathFeature>();

        //    string logString = $"Status Code: {statusCode}";
        //    if (statusCodeFeature != null)
        //    {
        //        logString += $"Status Code: {statusCode}, Original PathBase: [{statusCodeFeature.OriginalPathBase}], Status Code Path: [{statusCodeFeature.OriginalPath}], Original QueryString: [{statusCodeFeature.OriginalQueryString}]";
        //    }

        //    if (exceptionDataFeature != null)
        //    {
        //        if (logString != null)
        //        {
        //            logString += Environment.NewLine;
        //        }

        //        logString += $"Status Code: {statusCode} Exception Path: [{exceptionDataFeature.Path}], Exception: [{exceptionDataFeature.Error}], Exception Message: [{exceptionDataFeature.Error.Message}], Exception Stack Trace: [{exceptionDataFeature.Error.StackTrace}]";
        //    }

        //    if (statusCodeFeature == null && exceptionDataFeature == null)
        //    {
        //        logString += $"Status Code: {statusCode}. Both {nameof(statusCodeFeature)} and {nameof(exceptionDataFeature)} were null in {nameof(ErrorController)} {nameof(Error)}";
        //    }

        //    if (statusCode >= 400 && statusCode <= 499)
        //    {
        //        logger.Warning(logString);
        //    }
        //    else
        //    {
        //        logger.Warning(logString);
        //    }

        //    IActionResult actionResult;

        //    bool isApiPath = (statusCodeFeature?.OriginalPath != null && statusCodeFeature.OriginalPath.StartsWith("/api", StringComparison.InvariantCultureIgnoreCase)) ||
        //                     (exceptionDataFeature?.Path != null && exceptionDataFeature.Path.StartsWith("/api", StringComparison.InvariantCultureIgnoreCase));

        //    if (isApiPath)
        //    {
        //        actionResult = Content($"The request could not be processed ({statusCode.ToString(CultureInfo.InvariantCulture)})");
        //    }
        //    else
        //    {
        //        actionResult = StatusCode(statusCode);
        //    }

        //    return actionResult;
        //}

        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        [HttpGet("test-throw-404")]
        public IActionResult Throw404() => StatusCode(404);

        [HttpGet("test-throw-422")]
        public IActionResult Throw422() => StatusCode(422);

        [HttpGet("test-throw-500")]
        public IActionResult Throw500() => StatusCode(500);

        [HttpGet("test-throw-exception")]
        public IActionResult ThrowException()
        {
            throw new InvalidOperationException("Test exception");
        }
    }
}
