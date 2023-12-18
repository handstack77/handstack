using System;

using Newtonsoft.Json;

namespace HandStack.Web.Helper
{
    internal class DecimalJsonConverter : JsonConverter<decimal>
    {
        public override decimal ReadJson(JsonReader reader, Type objectType, decimal existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override void WriteJson(JsonWriter writer, decimal value, JsonSerializer serializer)
        {
            writer.WriteRawValue(value.ToString());
        }
    }
}
