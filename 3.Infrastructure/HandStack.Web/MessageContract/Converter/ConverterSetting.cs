using System.Globalization;

using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace HandStack.Web.MessageContract.Converter
{
    public static class ConverterSetting
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters = {
                TestValueConverter.Singleton,
                DefaultValueConverter.Singleton,
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal
                }
            },
        };
    }
}
