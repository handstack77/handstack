using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;

namespace HandStack.Core.Helpers
{
    public static class EnumHelper
    {
        public static string? GetEnumDescriptionFromValue<T>(object value)
        {
            var type = typeof(T);
            if (type.IsEnum == false)
            {
                return null;
            }

            string? result = null;
            if (value != null)
            {
                result = value.ToString();
                if (result != null && result.Length > 0)
                {
                    FieldInfo? fieldInfo = type.GetField(result);
                    if (fieldInfo != null)
                    {
                        Attribute? attribute = Attribute.GetCustomAttribute(fieldInfo, typeof(DescriptionAttribute));
                        if (attribute != null)
                        {
                            DescriptionAttribute descriptionAttribute = (DescriptionAttribute)attribute;
                            result = descriptionAttribute.Description;
                        }
                    }
                }
            }

            return result;
        }

        public static T? GetEnumValueFromDescription<T>(string description)
        {
            var type = typeof(T?);
            if (type.IsEnum == false)
            {
                return default(T);
            }

            FieldInfo[] fields = type.GetFields();
            var field = fields.SelectMany(f => f.GetCustomAttributes(typeof(DescriptionAttribute), false), (f, a) => new { Field = f, Att = a })
                .Where(a => ((DescriptionAttribute)a.Att)
                .Description == description).SingleOrDefault();

            return field == null ? default(T) : (T?)field.Field.GetRawConstantValue();
        }

        public static string? GetEnumDescriptionFromInt<T>(int value)
        {
            var type = typeof(T);
            if (type.IsEnum == false)
            {
                return null;
            }

            var enumValue = (T)Enum.ToObject(type, value);
            return GetEnumDescriptionFromValue<T>(enumValue);
        }

        public static T? GetEnumValueFromInt<T>(int value)
        {
            var type = typeof(T);
            if (type.IsEnum == false)
            {
                return default(T);
            }

            return (T)Enum.ToObject(type, value);
        }

        public static List<T> GetEnumList<T>()
        {
            var type = typeof(T);
            if (type.IsEnum == false)
            {
                return new List<T>();
            }

            List<T> values = new List<T>();
            foreach (T value in Enum.GetValues(type))
            {
                values.Add(value);
            }

            return values;
        }

        public static List<string> GetEnumDescriptionList<T>()
        {
            var type = typeof(T);
            if (type.IsEnum == false)
            {
                return new List<string>();
            }

            List<string> descriptions = new List<string>();
            foreach (T value in Enum.GetValues(type))
            {
                var description = GetEnumDescriptionFromValue<T>(value);
                if (description != null)
                {
                    descriptions.Add(description);
                }
            }
            return descriptions;
        }
    }
}
