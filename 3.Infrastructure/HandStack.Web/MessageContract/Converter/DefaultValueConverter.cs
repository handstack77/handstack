using System;

using HandStack.Web.MessageContract.DataObject;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Converter
{
    public class DefaultValueConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(DefaultValue) || t == typeof(DefaultValue?);

        public override object ReadJson(JsonReader reader, Type t, object? existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.Integer:
                    int integerValue = serializer.Deserialize<int>(reader);
                    return new DefaultValue { Integer = integerValue };
                case JsonToken.Boolean:
                    bool boolValue = serializer.Deserialize<bool>(reader);
                    return new DefaultValue { Boolean = boolValue };
                case JsonToken.String:
                case JsonToken.Date:
                    var stringValue = serializer.Deserialize<string>(reader);
                    return new DefaultValue { String = stringValue };
            }
            throw new Exception("Cannot unmarshal type DefaultValue");
        }

        public override void WriteJson(JsonWriter writer, object? untypedValue, JsonSerializer serializer)
        {
            if (untypedValue != null)
            {
                var value = (DefaultValue)untypedValue;
                if (value.Integer != null)
                {
                    serializer.Serialize(writer, value.Integer.Value);
                    return;
                }
                if (value.String != null)
                {
                    serializer.Serialize(writer, value.String);
                    return;
                }
                if (value.Boolean != null)
                {
                    serializer.Serialize(writer, value.Boolean.Value);
                    return;
                }
                throw new Exception("Cannot marshal type DefaultValue");
            }
        }

        public static readonly DefaultValueConverter Singleton = new DefaultValueConverter();
    }
}
