using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

using Serilog;

namespace HandStack.Core.Extensions
{
    public class ErrorHandleMiddleware
    {
        private readonly ILogger logger;
        private readonly RequestDelegate next;

        public ErrorHandleMiddleware(RequestDelegate next, ILogger logger)
        {
            this.logger = logger;
            this.next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await next(httpContext);

                var httpRequest = httpContext.Request;
                var httpResponse = httpContext.Response;

                int statusCode = httpResponse.StatusCode;
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

                int statusCode = httpResponse.StatusCode;
                if (string.IsNullOrEmpty(httpRequest.ContentType) == false && httpRequest.ContentType.ToLower().IndexOf("application/json") > -1)
                {
                    httpResponse.ContentType = "application/json";

                    switch (exception)
                    {
                        case KeyNotFoundException e:
                            httpResponse.StatusCode = (int)HttpStatusCode.BadRequest;
                            break;
                        default:
                            httpResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                            break;
                    }

                    var result = JsonConvert.SerializeObject(new
                    {
                        StatusCode = statusCode,
                        Message = exception.Message
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
