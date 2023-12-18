using System.Collections;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public static class DictionaryExtensions
    {
        public static bool Contains(this IDictionary @this, string sectionName, string key)
        {
            bool result = false;
            IDictionary? newDictionary = @this.Section(sectionName);
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
            object? input = @this[key];
            if (input == null)
            {
                return default(T);
            }
            return input.ConvertTo<T>();
        }

        public static T? Get<T>(this IDictionary @this, string section, string key)
        {
            object? input = @this.Get(section, key);
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

            IDictionary? newDictionary = @this[sectionName] as IDictionary;
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
                DbParameter parameter = command.CreateParameter();
                parameter.ParameterName = x.Key;
                parameter.Value = x.Value;
                return parameter;
            }).ToArray();
        }

        public static DbParameter[] ToDbParameters(this IDictionary<string, object> @this, DbConnection connection)
        {
            DbCommand command = connection.CreateCommand();

            return @this.Select(x =>
            {
                DbParameter parameter = command.CreateParameter();
                parameter.ParameterName = x.Key;
                parameter.Value = x.Value;
                return parameter;
            }).ToArray();
        }
    }
}
