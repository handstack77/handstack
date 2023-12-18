using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace dbclient.Extensions
{
    internal static class JsonSerialization
    {
        public static readonly JsonSerializerSettings Default = new()
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore
        };

        public static readonly JsonSerializerSettings IncludeNullValues = new()
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Include
        };

        public static readonly JsonSerializerSettings WithDateParsingNone = new()
        {
            DateParseHandling = DateParseHandling.None
        };

        public static readonly JsonSerializerSettings Pact = new()
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore,
            ContractResolver = new DefaultContractResolver
            {
                NamingStrategy = new CamelCaseNamingStrategy()
            }
        };
    }
}
