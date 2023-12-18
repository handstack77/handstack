using System;

using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Logging;

namespace HandStack.Web.Extensions
{
    public class InvariantDecimalModelBinderProvider : IModelBinderProvider
    {
        public IModelBinder? GetBinder(ModelBinderProviderContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            if (!context.Metadata.IsComplexType && (context.Metadata.ModelType == typeof(decimal) || context.Metadata.ModelType == typeof(decimal?)))
            {
                object? logger = context.Services.GetService(typeof(ILoggerFactory));
                if (logger != null)
                {
                    var loggerFactory = (ILoggerFactory)logger;
                    return new InvariantDecimalModelBinder(context.Metadata.ModelType, loggerFactory);
                }
            }

            return null;
        }
    }
}
