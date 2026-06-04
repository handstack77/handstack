using System.Collections;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Text;

namespace HandStack.Core.ExtensionMethod
{
    public static class DictionaryExtensions
    {
        public static bool Contains(this IDictionary @this, string sectionName, string key)
        {
            var result = false;
            var newDictionary = @this.Section(sectionName);
            if (newDictionary == null)
            {
                return result;
            }
            else
            {
                result = newDictionary.Contains(key);
            }
            return result;
        }

        public static T? Get<T>(this IDictionary @this, string key)
        {
            var input = @this[key];
            if (input == null)
            {
                return default(T);
            }
            return input.ConvertTo<T>();
        }

        public static T? Get<T>(this IDictionary @this, string section, string key)
        {
            var input = @this.Get(section, key);
            if (input == null)
            {
                return default(T);
            }
            return input.ConvertTo<T>();
        }

        public static object? Get(this IDictionary @this, string sectionName, string key)
        {
            object? result = null;
            if (!@this.Contains(sectionName))
            {
                return result;
            }

            var newDictionary = @this[sectionName] as IDictionary;
            if (newDictionary != null && newDictionary.Contains(key) == true)
            {
                result = newDictionary[key];
            }

            return result;
        }

        public static T? Get<T>(this IDictionary @this, string section, string key, T defaultValue)
        {
            if (!@this.Contains(section, key))
            {
                return defaultValue;
            }
            return @this.Get<T>(section, key);
        }

        public static T? GetOrDefault<T>(this IDictionary @this, string key, T defaultValue)
        {
            if (!@this.Contains(key))
            {
                return defaultValue;
            }
            return @this.Get<T>(key);
        }

        public static IDictionary? Section(this IDictionary @this, string section)
        {
            IDictionary? result = null;
            if (@this.Contains(section))
            {
                result = (@this[section] as IDictionary);
            }
            return result;
        }

        public static Hashtable ToHashTable<T, V>(this IDictionary<T, V> @this)
        {
            var result = new Hashtable();

            foreach (var item in @this)
            {
                if (item.Key != null)
                {
                    result.Add(item.Key, item.Value);
                }
            }

            return result;
        }

        public static DbParameter[] ToDbParameters(this IDictionary<string, object> @this, DbCommand command)
        {
            return @this.Select(x =>
            {
                var parameter = command.CreateParameter();
                parameter.ParameterName = x.Key;
                parameter.Value = x.Value;
                return parameter;
            }).ToArray();
        }

        public static DbParameter[] ToDbParameters(this IDictionary<string, object> @this, DbConnection connection)
        {
            var command = connection.CreateCommand();

            return @this.Select(x =>
            {
                var parameter = command.CreateParameter();
                parameter.ParameterName = x.Key;
                parameter.Value = x.Value;
                return parameter;
            }).ToArray();
        }

        public static string ToQueryString(this Dictionary<string, string?> @this, bool isQuestion)
        {
            if (@this == null || @this.Count == 0)
            {
                return "";
            }

            var result = new StringBuilder();
            foreach (var item in @this)
            {
                result.Append('&');
                result.Append(item.Key);
                result.Append('=');
                result.Append(item.Value ?? "");
            }

            return isQuestion == true && result.Length > 0 ? "?" + result.ToString(1, result.Length - 1) : result.ToString();
        }

        public static Dictionary<string, string?> ToUrlObject(this string? url)
        {
            var result = new Dictionary<string, string?>();
            if (string.IsNullOrWhiteSpace(url) == true)
            {
                return result;
            }

            var queryStartIndex = url.IndexOf('?');
            var queryString = queryStartIndex > -1 ? url.Substring(queryStartIndex + 1) : url;
            if (string.IsNullOrWhiteSpace(queryString) == true)
            {
                return result;
            }

            foreach (var item in queryString.Split('&', System.StringSplitOptions.RemoveEmptyEntries))
            {
                var separatorIndex = item.IndexOf('=');
                if (separatorIndex <= 0)
                {
                    continue;
                }

                result[item.Substring(0, separatorIndex)] = item.Substring(separatorIndex + 1);
            }

            return result;
        }
    }
}
