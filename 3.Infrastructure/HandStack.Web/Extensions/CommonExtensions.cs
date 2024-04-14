using System;
using System.Collections.Generic;
using System.Linq;

using HandStack.Web;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.Model;

namespace HandStack.Web.Extensions
{
    public static class CommonExtensions
    {
        public static void Add(this List<DynamicParameter> parameters, string parameterName, object value, string dbType = "String")
        {
            DynamicParameter dynamicParameter = new DynamicParameter() { ParameterName = parameterName, Value = value, DbType = dbType };
            parameters.Add(dynamicParameter);
        }

        public static object? Value(this List<DynamicParameter> parameters, string parameterName)
        {
            object? result = null;
            foreach (DynamicParameter item in parameters)
            {
                if (item.ParameterName == parameterName)
                {
                    result = item.Value;
                    break;
                }
            }

            return result;
        }

        public static ApplicationCodeSetting? Find(this Dictionary<string, ApplicationCodeSetting> appSettings, string settingID)
        {
            ApplicationCodeSetting? result = null;

            if (appSettings != null && appSettings.ContainsKey(settingID) == true)
            {
                result = appSettings.Find(settingID);
            }

            return result;
        }

        public static List<ApplicationCodeSetting> FindAll(this Dictionary<string, ApplicationCodeSetting> appSettings, string moduleID)
        {
            return appSettings.Where(x => x.Value.Area == moduleID).Select(x => x.Value).ToList();
        }

        public static string? GetValue(this Dictionary<string, ApplicationCodeSetting?> appSettings, string settingID, string? defaultValue = null)
        {
            string? result = null;

            if (appSettings != null && appSettings.ContainsKey(settingID) == true)
            {
                ApplicationCodeSetting? appSetting;
                if (appSettings.TryGetValue(settingID, out appSetting) == true)
                {
                    if (appSetting == null)
                    {
                        result = defaultValue;
                    }
                    else
                    {
                        result = appSetting.Value;
                    }
                }
            }
            else
            {
                result = defaultValue;
            }

            return result;
        }

        public static List<string>? SplitCsv(this string csvList, bool nullOrWhitespaceInputReturnsNull = false)
        {
            if (string.IsNullOrWhiteSpace(csvList) == true)
            {
                return nullOrWhitespaceInputReturnsNull ? null : new List<string>();
            }

            return csvList
                .TrimEnd(',')
                .Split(',')
                .AsEnumerable<string>()
                .Select(s => s.Trim())
                .ToList();
        }

        public static dynamic GetDynamicObject(this Dictionary<string, object?> properties)
        {
            return new MyDynObject(properties);
        }

        public static bool IsNullOrWhitespace(this string s)
        {
            return string.IsNullOrWhiteSpace(s);
        }

        public static Dictionary<string, object?> GetPropertyValuePairs(this object obj, string[]? hidden = null)
        {
            var type = obj.GetType();
            var pairs = hidden == null
                ? type.GetProperties()
                    .DistinctBy(propertyInfo => propertyInfo.Name)
                    .ToDictionary(
                        propertyInfo => propertyInfo.Name,
                        propertyInfo => propertyInfo.GetValue(obj, null))
                : type.GetProperties()
                    .Where(it => !hidden.Contains(it.Name))
                    .DistinctBy(propertyInfo => propertyInfo.Name)
                    .ToDictionary(
                        propertyInfo => propertyInfo.Name,
                        propertyInfo => propertyInfo.GetValue(obj, null));
            return pairs;
        }

        public static IEnumerable<TSource> DistinctBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)
        {
            var seenKeys = new HashSet<TKey>();
            return source.Where(element => seenKeys.Add(keySelector(element)));
        }

        public static string ToMessage(this Exception source)
        {
            return GlobalConfiguration.IsExceptionDetailText == true ? source.ToString() : source.Message;
        }
    }
}
