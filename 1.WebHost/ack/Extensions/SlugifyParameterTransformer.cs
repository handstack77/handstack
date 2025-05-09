using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;

using Microsoft.AspNetCore.Routing;

namespace ack.Extensions
{
    public class SlugifyParameterTransformer : IOutboundParameterTransformer
    {
#pragma warning disable CS8767
        public string? TransformOutbound(object value)
#pragma warning restore CS8767
        {
            return value == null ? null : Regex.Replace(value.ToStringSafe(), "([a-z])([A-Z])", "$1-$2").ToLower();
        }
    }
}
