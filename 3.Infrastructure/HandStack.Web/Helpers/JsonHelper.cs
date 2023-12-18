using System;
using System.IO;
using System.Linq;
using System.Text;

using HandStack.Web.Enumeration;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using YamlDotNet.Core;
using YamlDotNet.Serialization;

namespace HandStack.Web.Helper
{
    internal static class JsonHelper
    {
        internal static bool IsValid(string? input)
        {
            input = input?.Trim();

            if (input == null)
            {
                return true;
            }

            if (long.TryParse(input, out _))
            {
                return false;
            }

            try
            {
                var jtoken = JToken.Parse(input);
                return jtoken is not null;
            }
            catch (JsonReaderException)
            {
                return false;
            }
            catch
            {
                return false;
            }
        }

        internal static string Format(string? input, Indentation indentationMode, bool sortProperties)
        {
            if (input == null || !IsValid(input))
            {
                return string.Empty;
            }

            try
            {
                var jsonLoadSettings = new JsonLoadSettings()
                {
                    CommentHandling = CommentHandling.Ignore,
                    DuplicatePropertyNameHandling = DuplicatePropertyNameHandling.Ignore,
                    LineInfoHandling = LineInfoHandling.Load
                };

                JToken jToken;
                using (var jsonReader = new JsonTextReader(new StringReader(input)))
                {
                    jsonReader.DateParseHandling = DateParseHandling.None;
                    jsonReader.DateTimeZoneHandling = DateTimeZoneHandling.RoundtripKind;

                    jToken = JToken.Load(jsonReader, jsonLoadSettings);
                }

                if (sortProperties)
                {
                    if (jToken is JObject obj)
                    {
                        SortJsonPropertiesAlphabetically(obj);
                    }
                    else if (jToken is JArray array)
                    {
                        SortJsonPropertiesAlphabetically(array);
                    }
                }

                var stringBuilder = new StringBuilder();
                using (var stringWriter = new StringWriter(stringBuilder))
                using (var jsonTextWriter = new JsonTextWriter(stringWriter))
                {
                    switch (indentationMode)
                    {
                        case Indentation.TwoSpaces:
                            jsonTextWriter.Formatting = Formatting.Indented;
                            jsonTextWriter.IndentChar = ' ';
                            jsonTextWriter.Indentation = 2;
                            break;
                        case Indentation.FourSpaces:
                            jsonTextWriter.Formatting = Formatting.Indented;
                            jsonTextWriter.IndentChar = ' ';
                            jsonTextWriter.Indentation = 4;
                            break;
                        case Indentation.OneTab:
                            jsonTextWriter.Formatting = Formatting.Indented;
                            jsonTextWriter.IndentChar = '\t';
                            jsonTextWriter.Indentation = 1;
                            break;
                        case Indentation.Minified:
                            jsonTextWriter.Formatting = Formatting.None;
                            break;
                        default:
                            throw new NotSupportedException();
                    }

                    jsonTextWriter.DateFormatHandling = DateFormatHandling.IsoDateFormat;
                    jsonTextWriter.DateTimeZoneHandling = DateTimeZoneHandling.RoundtripKind;

                    jToken.WriteTo(jsonTextWriter);
                }

                return stringBuilder.ToString();
            }
            catch (JsonReaderException exception)
            {
                return exception.Message;
            }
            catch (Exception exception)
            {
                return exception.Message;
            }
        }

        internal static string? ConvertFromYaml(string? input, Indentation indentationMode)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return string.Empty;
            }

            try
            {
                using var stringReader = new StringReader(input);

                IDeserializer deserializer = new DeserializerBuilder()
                    .WithNodeTypeResolver(new DecimalYamlTypeResolver())
                    .WithNodeTypeResolver(new BooleanYamlTypeResolver())
                    .Build();

                object? yamlObject = deserializer.Deserialize(stringReader);

                if (yamlObject is null or string)
                {
                    return null;
                }

                var stringBuilder = new StringBuilder();
                using (var stringWriter = new StringWriter(stringBuilder))
                using (var jsonTextWriter = new JsonTextWriter(stringWriter))
                {
                    switch (indentationMode)
                    {
                        case Indentation.TwoSpaces:
                            jsonTextWriter.Formatting = Formatting.Indented;
                            jsonTextWriter.IndentChar = ' ';
                            jsonTextWriter.Indentation = 2;
                            break;

                        case Indentation.FourSpaces:
                            jsonTextWriter.Formatting = Formatting.Indented;
                            jsonTextWriter.IndentChar = ' ';
                            jsonTextWriter.Indentation = 4;
                            break;

                        default:
                            throw new NotSupportedException();
                    }

                    var jsonSerializer = JsonSerializer.CreateDefault(new JsonSerializerSettings()
                    {
                        Converters = { new DecimalJsonConverter() }
                    });
                    jsonSerializer.Serialize(jsonTextWriter, yamlObject);
                }

                return stringBuilder.ToString();
            }
            catch (SemanticErrorException exception)
            {
                return exception.Message;
            }
            catch
            {
                return string.Empty;
            }
        }

        private static void SortJsonPropertiesAlphabetically(JObject jObject)
        {
            var properties = jObject.Properties().ToList();
            foreach (JProperty? property in properties)
            {
                property.Remove();
            }

            foreach (JProperty? property in properties.OrderBy(p => p.Name))
            {
                jObject.Add(property);
                if (property.Value is JObject obj)
                {
                    SortJsonPropertiesAlphabetically(obj);
                }
                else if (property.Value is JArray array)
                {
                    SortJsonPropertiesAlphabetically(array);
                }
            }
        }

        private static void SortJsonPropertiesAlphabetically(JArray jArray)
        {
            foreach (JToken? arrayItem in jArray)
            {
                if (arrayItem is JObject arrayObj)
                {
                    SortJsonPropertiesAlphabetically(arrayObj);
                }
                else if (arrayItem is JArray array)
                {
                    SortJsonPropertiesAlphabetically(array);
                }
            }
        }
    }
}
