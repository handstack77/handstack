using System;
using System.IO;
using System.Linq;
using System.Text;

using HandStack.Web.Enumeration;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HandStack.Web.Helper
{
    public static class JsonHelper
    {
        public static bool IsValid(string? input)
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

        public static string Format(string? input, Indentation indentationMode, bool sortProperties)
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

        private static void SortJsonPropertiesAlphabetically(JObject jObject)
        {
            var properties = jObject.Properties().ToList();
            foreach (var property in properties)
            {
                property.Remove();
            }

            foreach (var property in properties.OrderBy(p => p.Name))
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
            foreach (var arrayItem in jArray)
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
