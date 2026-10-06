using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

using Serilog;

namespace HandStack.Web.Extensions
{
    public class ErrorHandleMiddleware(RequestDelegate next, ILogger logger)
    {
        private readonly ILogger logger = logger;
        private readonly RequestDelegate next = next;

        public async Task InvokeAsync(HttpContext httpContext)
        {
            ArgumentNullException.ThrowIfNull(httpContext);

            try
            {
                await next(httpContext);

                var httpRequest = httpContext.Request;
                var httpResponse = httpContext.Response;

                var statusCode = httpResponse.StatusCode;
                if (statusCode == 400 || statusCode == 404)
                {
                    logger.Information("[{LogCategory}] " + $"ContentType: {httpResponse.ContentType}, Path: {httpRequest.Path}, StatusCode: {statusCode}", "ErrorHandleMiddleware/InvokeAsync");
                    httpResponse.Redirect($"/Core/StatusCode/{statusCode}");
                }
            }
            catch (Exception exception)
            {
                var httpRequest = httpContext.Request;
                var httpResponse = httpContext.Response;

                var statusCode = httpResponse.StatusCode;
                if (!string.IsNullOrWhiteSpace(httpRequest.ContentType) && httpRequest.ContentType.IndexOf("application/json", StringComparison.CurrentCultureIgnoreCase) > -1)
                {
                    httpResponse.ContentType = "application/json";

                    httpResponse.StatusCode = exception switch
                    {
                        KeyNotFoundException => StatusCodes.Status400BadRequest,
                        _ => (int)HttpStatusCode.InternalServerError,
                    };
                    var result = JsonConvert.SerializeObject(new
                    {
                        StatusCode = statusCode,
                        exception.Message
                    });

                    logger.Error(exception, "[{LogCategory}] " + $"ContentType: {httpResponse.ContentType}, Path: {httpRequest.Path}, StatusCode: {statusCode}", "ErrorHandleMiddleware/InvokeAsync");

                    await httpResponse.WriteAsync(result);
                }
                else
                {
                    if (statusCode == 400 || statusCode == 404)
                    {
                    }
                    else
                    {
                        statusCode = 500;
                    }

                    logger.Error(exception, "[{LogCategory}] " + $"ContentType: {httpResponse.ContentType}, Path: {httpRequest.Path}, StatusCode: {statusCode}", "ErrorHandleMiddleware/InvokeAsync");
                    httpResponse.Redirect($"/Core/StatusCode/{statusCode}");
                }
            }
        }
    }
}

