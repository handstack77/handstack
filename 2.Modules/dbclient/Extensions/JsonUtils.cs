using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace dbclient.Extensions
{
    internal static class JsonUtils
    {
        public static Type CreateTypeFromJObject(JObject instance, string? fullName = null)
        {
            static Type ConvertType(JToken value, string? propertyName = null)
            {
                var type = value.Type;
                return type switch
                {
                    JTokenType.Array => value.HasValues ? ConvertType(value.First!, propertyName).MakeArrayType() : typeof(object).MakeArrayType(),
                    JTokenType.Boolean => typeof(bool),
                    JTokenType.Bytes => typeof(byte[]),
                    JTokenType.Date => typeof(DateTime),
                    JTokenType.Guid => typeof(Guid),
                    JTokenType.Float => typeof(float),
                    JTokenType.Integer => typeof(long),
                    JTokenType.Null => typeof(object),
                    JTokenType.Object => CreateTypeFromJObject((JObject)value, propertyName),
                    JTokenType.String => typeof(string),
                    JTokenType.TimeSpan => typeof(TimeSpan),
                    JTokenType.Uri => typeof(string),
                    _ => typeof(object)
                };
            }

            var properties = new Dictionary<string, Type>();
            foreach (var item in instance.Properties())
            {
                properties.Add(item.Name, ConvertType(item.Value, item.Name));
            }

            return TypeBuilderUtils.BuildType(properties, fullName) ?? throw new InvalidOperationException();
        }

        public static bool TryParseAsJObject(string? strInput, [NotNullWhen(true)] out JObject? value)
        {
            value = null;

            if (strInput == null || string.IsNullOrWhiteSpace(strInput))
            {
                return false;
            }

            strInput = strInput.Trim();
            if ((!strInput.StartsWith("{") || !strInput.EndsWith("}")) && (!strInput.StartsWith("[") || !strInput.EndsWith("]")))
            {
                return false;
            }

            try
            {
                value = JObject.Parse(strInput);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public static string Serialize(object value)
        {
            return JsonConvert.SerializeObject(value, JsonSerialization.IncludeNullValues);
        }

        public static byte[] SerializeAsPactFile(object value)
        {
            var json = JsonConvert.SerializeObject(value, JsonSerialization.Pact);
            return Encoding.UTF8.GetBytes(json);
        }

        public static JToken Parse(string json)
        {
            return JsonConvert.DeserializeObject<JToken>(json, JsonSerialization.WithDateParsingNone)!;
        }

        public static object DeserializeObject(string json)
        {
            return JsonConvert.DeserializeObject(json, JsonSerialization.WithDateParsingNone)!;
        }

        public static T DeserializeObject<T>(string json)
        {
            return JsonConvert.DeserializeObject<T>(json, JsonSerialization.WithDateParsingNone)!;
        }

        public static T? TryDeserializeObject<T>(string json)
        {
            try
            {
                return JsonConvert.DeserializeObject<T>(json);
            }
            catch
            {
                return default;
            }
        }

        public static T ParseJTokenToObject<T>(object? value)
        {
            if (value != null && value.GetType() == typeof(T))
            {
                return (T)value;
            }

            return value switch
            {
                JToken tokenValue => tokenValue.ToObject<T>()!,

                _ => throw new NotSupportedException($"'{typeof(T)}' 값을 다음으로 변환할 수 없습니다")
            };
        }

        public static string GenerateDynamicLinqStatement(JToken jsonObject)
        {
            var lines = new List<string>();
            WalkNode(jsonObject, null, null, lines);

            return lines.First();
        }

        private static void WalkNode(JToken node, string? path, string? propertyName, List<string> lines)
        {
            switch (node.Type)
            {
                case JTokenType.Object:
                    ProcessObject(node, propertyName, lines);
                    break;

                case JTokenType.Array:
                    ProcessArray(node, propertyName, lines);
                    break;

                default:
                    ProcessItem(node, path ?? "it", propertyName, lines);
                    break;
            }
        }

        private static void ProcessObject(JToken node, string? propertyName, List<string> lines)
        {
            var items = new List<string>();
            var text = new StringBuilder("new (");

            foreach (var child in node.Children<JProperty>().ToArray())
            {
                WalkNode(child.Value, child.Path, child.Name, items);
            }

            text.Append(string.Join(", ", items));
            text.Append(")");

            if (!string.IsNullOrEmpty(propertyName))
            {
                text.AppendFormat(" as {0}", propertyName);
            }

            lines.Add(text.ToString());
        }

        private static void ProcessArray(JToken node, string? propertyName, List<string> lines)
        {
            var items = new List<string>();
            var text = new StringBuilder("(new [] { ");

            var idx = 0;
            foreach (var child in node.Children().ToArray())
            {
                WalkNode(child, $"{node.Path}[{idx}]", null, items);
                idx++;
            }

            text.Append(string.Join(", ", items));
            text.Append("})");

            if (!string.IsNullOrEmpty(propertyName))
            {
                text.AppendFormat(" as {0}", propertyName);
            }

            lines.Add(text.ToString());
        }

        private static void ProcessItem(JToken node, string path, string? propertyName, List<string> lines)
        {
            var castText = node.Type switch
            {
                JTokenType.Boolean => $"bool({path})",
                JTokenType.Date => $"DateTime({path})",
                JTokenType.Float => $"double({path})",
                JTokenType.Guid => $"Guid({path})",
                JTokenType.Integer => $"long({path})",
                JTokenType.Null => "null",
                JTokenType.String => $"string({path})",
                JTokenType.TimeSpan => $"TimeSpan({path})",
                JTokenType.Uri => $"Uri({path})",
                _ => throw new NotSupportedException($"'{node.Type}' JTokenType은 Dynamic Linq 캐스트 연산자로 변환할 수 없습니다")
            };

            if (!string.IsNullOrEmpty(propertyName))
            {
                castText += $" as {propertyName}";
            }

            lines.Add(castText);
        }
    }
}
