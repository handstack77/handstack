using System;

using HandStack.Web.MessageContract.DataObject;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HandStack.Web.MessageContract.Converter
{
    public sealed class FunctionParamConverter : JsonConverter<HandStack.Web.MessageContract.DataObject.FunctionParam>
    {
        public override FunctionParam ReadJson(JsonReader reader, Type objectType, FunctionParam? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            var jo = JObject.Load(reader);

            return new FunctionParam
            {
                ID = GetValue<string>(jo, "id", "ID", "Id") ?? "",
                Type = GetValue<string>(jo, "type", "Type") ?? "String",
                Length = GetValue<int?>(jo, "length", "Length") ?? -1,
                Value = GetValue<string?>(jo, "value", "Value")
            };
        }

        public override void WriteJson(JsonWriter writer, FunctionParam? value, JsonSerializer serializer)
        {
            var jo = new JObject
            {
                ["ID"] = value?.ID,
                ["Type"] = value?.Type,
                ["Length"] = value?.Length,
                ["Value"] = value?.Value
            };

            jo.WriteTo(writer);
        }

        private static T? GetValue<T>(JObject jo, params string[] names)
        {
            foreach (var name in names)
            {
                if (jo.TryGetValue(name, StringComparison.OrdinalIgnoreCase, out var token))
                {
                    if (token.Type == JTokenType.Null)
                        return default;

                    return token.ToObject<T>();
                }
            }
            return default;
        }
    }
}
