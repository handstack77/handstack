using System;
using System.IO;
using System.Threading.Tasks;

using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Net.Http.Headers;

using Newtonsoft.Json;

using Serilog;

namespace logger.Extensions
{
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

            var contentType = context.HttpContext.Request.ContentType;
            if (string.IsNullOrEmpty(contentType) == false && contentType.IndexOf("application/json") > -1)
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

            if (string.IsNullOrEmpty(contentType) == false)
            {
                LogMessage? logMessage;

                try
                {
                    if (contentType.IndexOf("application/json") > -1)
                    {
                        using (var reader = new StreamReader(request.Body))
                        {
                            var content = await reader.ReadToEndAsync();
                            logMessage = JsonConvert.DeserializeObject<LogMessage>(content);
                            return await InputFormatterResult.SuccessAsync(logMessage);
                        }
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
