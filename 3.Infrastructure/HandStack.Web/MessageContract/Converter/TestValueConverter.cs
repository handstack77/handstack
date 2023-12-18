using System;

using HandStack.Web.MessageContract.DataObject;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Converter
{
    public class TestValueConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(TestValue) || t == typeof(TestValue?);

        public override object ReadJson(JsonReader reader, Type t, object? existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.Integer:
                    int integerValue = serializer.Deserialize<int>(reader);
                    return new TestValue { Integer = integerValue };
                case JsonToken.Boolean:
                    bool boolValue = serializer.Deserialize<bool>(reader);
                    return new TestValue { Boolean = boolValue };
                case JsonToken.String:
                case JsonToken.Date:
                    var stringValue = serializer.Deserialize<string>(reader);
                    return new TestValue { String = stringValue };
            }
            throw new Exception("Cannot unmarshal type TestValue");
        }

        public override void WriteJson(JsonWriter writer, object? untypedValue, JsonSerializer serializer)
        {
            if (untypedValue != null)
            {
                var value = (TestValue)untypedValue;
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
                throw new Exception("Cannot marshal type TestValue");
            }
        }

        public static readonly TestValueConverter Singleton = new TestValueConverter();
    }
}
