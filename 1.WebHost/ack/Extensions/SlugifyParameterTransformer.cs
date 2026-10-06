using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;

using Microsoft.AspNetCore.Routing;

namespace ack.Extensions
{
    public partial class SlugifyParameterTransformer : IOutboundParameterTransformer
    {
#pragma warning disable CS8767
        public string? TransformOutbound(object value)
#pragma warning restore CS8767
        {
            return value == null ? null : MyRegex().Replace(value.ToStringSafe(), "$1-$2").ToLower();
        }

        [GeneratedRegex("([a-z])([A-Z])")]
        private static partial Regex MyRegex();
    }
}
