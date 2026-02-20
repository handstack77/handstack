using System;
using System.IO;
using System.Threading.Tasks;

using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using logger.Entity;

using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Net.Http.Headers;

using Newtonsoft.Json;

using Serilog;

namespace logger.Extensions
{
    /*
    [HttpPost("process")]
    public async Task<IActionResult> Process()
    {
        var formatter = new RawRequestBodyFormatter(logger);
        var context = new InputFormatterContext(
            HttpContext,
            nameof(TransactionRequest),
            new ModelStateDictionary(),
            new EmptyModelMetadataProvider().GetMetadataForType(typeof(TransactionRequest)),
            (stream, encoding) => new StreamReader(stream, encoding)
        );

        var result = await formatter.ReadRequestBodyAsync(context);

        if (result.HasError)
        {
            return BadRequest("Invalid request body");
        }

        var transactionRequest = result.Model as TransactionRequest;
        return Ok(transactionRequest);
    }
    */
    public class RawRequestBodyFormatter : InputFormatter
    {
        private ILogger logger { get; }

        public RawRequestBodyFormatter(ILogger logger)
        {
            this.logger = logger;

            SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/json"));
        }

        public override bool CanRead(InputFormatterContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            var request = context.HttpContext.Request;
            var contentType = request.ContentType;
            var path = request.Path.Value;
            if (!string.IsNullOrEmpty(contentType) && !string.IsNullOrEmpty(path) && contentType.IndexOf("application/json") > -1 && path.StartsWith($"/{ModuleConfiguration.ModuleID}/api"))
            {
                return true;
            }

            return false;
        }

        public override async Task<InputFormatterResult> ReadRequestBodyAsync(InputFormatterContext context)
        {
            var request = context.HttpContext.Request;
            var contentType = request.ContentType;
            var pathBase = request.PathBase;

            if (!string.IsNullOrEmpty(contentType))
            {
                LogMessage? logMessage;

                try
                {
                    if (contentType.IndexOf("application/json") > -1)
                    {
                        using var reader = new StreamReader(request.Body);
                        var content = await reader.ReadToEndAsync();
                        logMessage = JsonConvert.DeserializeObject<LogMessage>(content);
                        return await InputFormatterResult.SuccessAsync(logMessage);
                    }
                }
                catch (Exception exception)
                {
                    logger.Error("[{LogCategory}] " + exception.ToMessage(), "ReadRequestBodyAsync");
                }
            }

            return await InputFormatterResult.FailureAsync();
        }
    }
}

