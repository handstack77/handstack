using System;
using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Runtime.Serialization.Formatters.Binary;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;
using System.Xml.Serialization;

namespace HandStack.Core.ExtensionMethod
{
    public static class ObjectExtensions
    {
        public static T Chain<T>(this T @this, Action<T> action)
        {
            action(@this);

            return @this;
        }

        public static T? ConvertTo<T>(this object @this)
        {
            object? result = default(T);
            if (typeof(T) == typeof(bool))
            {
                result = Convert.ToBoolean(@this);
            }
            else if (typeof(T) == typeof(byte))
            {
                result = Convert.ToByte(@this);
            }
            else if (typeof(T) == typeof(sbyte))
            {
                result = Convert.ToSByte(@this);
            }
            else if (typeof(T) == typeof(char))
            {
                result = Convert.ToChar(@this);
            }
            else if (typeof(T) == typeof(decimal))
            {
                result = Convert.ToDecimal(@this);
            }
            else if (typeof(T) == typeof(double))
            {
                result = Convert.ToDouble(@this);
            }
            else if (typeof(T) == typeof(float))
            {
                result = Convert.ToSingle(@this);
            }
            else if (typeof(T) == typeof(short))
            {
                result = Convert.ToInt16(@this);
            }
            else if (typeof(T) == typeof(ushort))
            {
                result = Convert.ToUInt16(@this);
            }
            else if (typeof(T) == typeof(int))
            {
                result = Convert.ToInt32(@this);
            }
            else if (typeof(T) == typeof(uint))
            {
                result = Convert.ToUInt32(@this);
            }
            else if (typeof(T) == typeof(long))
            {
                result = Convert.ToInt64(@this);
            }
            else if (typeof(T) == typeof(ulong))
            {
                result = Convert.ToUInt64(@this);
            }
            else if (typeof(T) == typeof(string))
            {
                result = Convert.ToString(@this);
            }
            else if (typeof(T) == typeof(DateTime))
            {
                result = Convert.ToDateTime(@this);
            }
            else if (typeof(T) == typeof(DateTimeOffset))
            {
                result = new DateTimeOffset(Convert.ToDateTime(@this), TimeSpan.Zero);
            }
            else
            {
                result = @this;
            }
            return (T?)result;
        }

        public static T? ShallowCopy<T>(this T @this)
        {
            MethodInfo? method = @this?.GetType().GetMethod("MemberwiseClone", BindingFlags.NonPublic | BindingFlags.Instance);
            return (T?)method?.Invoke(@this, null);
        }

        public static string ToStringSafe(this object? @this)
        {
            return @this?.ToString() ?? "";
        }

        public static string ToStringSafe(this object? @this, string defaultValue)
        {
            return @this?.ToString() ?? defaultValue;
        }

        public static object? To(this object @this, Type type)
        {
            if (@this != null)
            {
                Type targetType = type;

                if (@this.GetType() == targetType)
                {
                    return @this;
                }

                TypeConverter converter = TypeDescriptor.GetConverter(@this);
                if (converter != null)
                {
                    if (converter.CanConvertTo(targetType))
                    {
                        return converter.ConvertTo(@this, targetType);
                    }
                }

                converter = TypeDescriptor.GetConverter(targetType);
                if (converter != null)
                {
                    if (converter.CanConvertFrom(@this.GetType()))
                    {
                        return converter.ConvertFrom(@this);
                    }
                }

                if (@this == DBNull.Value)
                {
                    return null;
                }
            }

            return @this;
        }

        public static bool IsAssignableFrom<T>(this object @this)
        {
            Type type = @this.GetType();
            return type.IsAssignableFrom(typeof(T));
        }

        public static bool IsAssignableFrom(this object @this, Type targetType)
        {
            Type type = @this.GetType();
            return type.IsAssignableFrom(targetType);
        }

        public static T As<T>(this object @this)
        {
            return (T)@this;
        }

        public static T AsOrDefault<T>(this object @this, T defaultValue)
        {
            try
            {
                return (T)@this;
            }
            catch (Exception)
            {
                return defaultValue;
            }
        }

        public static T AsOrDefault<T>(this object @this, Func<T> defaultValueFactory)
        {
            try
            {
                return (T)@this;
            }
            catch (Exception)
            {
                return defaultValueFactory();
            }
        }

        public static T AsOrDefault<T>(this object @this, Func<object, T> defaultValueFactory)
        {
            try
            {
                return (T)@this;
            }
            catch (Exception)
            {
                return defaultValueFactory(@this);
            }
        }

        public static string SerializeJson<T>(this T @this)
        {
            var serializer = new DataContractJsonSerializer(typeof(T));

            using (var memoryStream = new MemoryStream())
            {
                serializer.WriteObject(memoryStream, @this);
                return Encoding.UTF8.GetString(memoryStream.ToArray());
            }
        }

        public static string SerializeJson<T>(this T @this, Encoding encoding)
        {
            encoding = (encoding ?? Encoding.UTF8);
            var serializer = new DataContractJsonSerializer(typeof(T));

            using (var memoryStream = new MemoryStream())
            {
                serializer.WriteObject(memoryStream, @this);
                return encoding.GetString(memoryStream.ToArray());
            }
        }

        public static string SerializeXml(this object @this)
        {
            var xmlSerializer = new XmlSerializer(@this.GetType());

            using (var stringWriter = new StringWriter())
            {
                xmlSerializer.Serialize(stringWriter, @this);
                using (var streamReader = new StringReader(stringWriter.GetStringBuilder().ToString()))
                {
                    return streamReader.ReadToEnd();
                }
            }
        }
    }
}
