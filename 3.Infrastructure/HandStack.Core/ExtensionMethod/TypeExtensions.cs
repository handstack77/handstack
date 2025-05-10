using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Reflection;

namespace HandStack.Core.ExtensionMethod
{
    public static class TypeExtensions
    {
        public static string GetFriendlyName(this Type @this)
        {
            if (@this == null)
            {
                throw new ArgumentNullException("@this", "@this은 null일 수 없습니다");
            }

            if (@this.IsGenericType == false || @this.IsGenericParameter == false)
            {
                return @this.Name;
            }

            const StringComparison sc = StringComparison.Ordinal;
            var name = @this.Name.Substring(0, @this.Name.IndexOf("`", sc));
            var arguments = @this.GetGenericArguments()
                .Select(arg => arg.GetFriendlyName())
                .ToArray();

            return string.Concat(name, '<', string.Join(", ", arguments), '>');
        }

        public static DataTable ToDataTable<T>(this T[] @this)
        {
            var typeOf = typeof(T);

            var properties = typeOf.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            var fields = typeOf.GetFields(BindingFlags.Public | BindingFlags.Instance);

            var result = new DataTable();

            foreach (var property in properties)
            {
                result.Columns.Add(property.Name, property.PropertyType);
            }

            foreach (var field in fields)
            {
                result.Columns.Add(field.Name, field.FieldType);
            }

            foreach (var item in @this)
            {
                var dr = result.NewRow();

                foreach (var property in properties)
                {
                    dr[property.Name] = property.GetValue(item, null);
                }

                foreach (var field in fields)
                {
                    dr[field.Name] = field.GetValue(item);
                }

                result.Rows.Add(dr);
            }

            return result;
        }

        public static DataTable ToDataTable<T>(this IList<T> data)
        {
            var props = TypeDescriptor.GetProperties(typeof(T));
            var result = new DataTable();
            for (var i = 0; i < props.Count; i++)
            {
                var prop = props[i];
                result.Columns.Add(prop.Name, prop.PropertyType);
            }

            object?[] values = new object[props.Count];
            foreach (var item in data)
            {
                for (var i = 0; i < values.Length; i++)
                {
                    values[i] = props[i].GetValue(item);
                }
                result.Rows.Add(values);
            }

            return result;
        }

        public static T? CreateInstance<T>(this Type @this, BindingFlags bindingAttr, Binder binder, object[] args, CultureInfo culture)
        {
            return (T?)Activator.CreateInstance(@this, bindingAttr, binder, args, culture);
        }

        public static T? CreateInstance<T>(this Type @this, BindingFlags bindingAttr, Binder binder, object[] args, CultureInfo culture, object[] activationAttributes)
        {
            return (T?)Activator.CreateInstance(@this, bindingAttr, binder, args, culture, activationAttributes);
        }

        public static T? CreateInstance<T>(this Type @this, object[] args)
        {
            return (T?)Activator.CreateInstance(@this, args);
        }

        public static T? CreateInstance<T>(this Type @this, object[] args, object[] activationAttributes)
        {
            return (T?)Activator.CreateInstance(@this, args, activationAttributes);
        }

        public static T? CreateInstance<T>(this Type @this)
        {
            return (T?)Activator.CreateInstance(@this);
        }

        public static T? CreateInstance<T>(this Type @this, bool nonPublic)
        {
            return (T?)Activator.CreateInstance(@this, nonPublic);
        }

        public static MethodInfo? GetPublicInstanceMethod(this Type @this, string name, Type[] types)
        {
            return @this.GetMethod(name, BindingFlags.Instance | BindingFlags.Public, null, types, null);
        }

        public static TypeCode GetTypeCode(Type @this)
        {
            return Type.GetTypeCode(@this);
        }

        public static bool IsEnum(this Type @this)
        {
            return @this.IsEnum;
        }

        public static bool IsGenericType(this Type @this)
        {
            return @this.IsGenericType;
        }

        public static bool IsInterface(this Type @this)
        {
            return @this.IsInterface;
        }

        public static bool IsValueType(this Type @this)
        {
            return @this.IsValueType;
        }

        public static string Name(this Type @this)
        {
            return @this.Name;
        }

        public static List<T> GetEnumList<T>(this Type type) where T : Enum
        {
            return Enum.GetValues(typeof(T)).Cast<T>().ToList();
        }

        public static IEnumerable<string?> GetEnumDescriptionEnumerable<T>(this Type type) where T : Enum
        {
            foreach (T value in Enum.GetValues(typeof(T)))
            {
                yield return value.GetDescriptionFromValue();
            }
        }

        public static List<string?> GetEnumDescriptionList<T>(this Type type) where T : Enum
        {
            var descriptionList = new List<string?>();
            foreach (T value in Enum.GetValues(typeof(T)))
            {
                descriptionList.Add(value.GetDescriptionFromValue());
            }

            return descriptionList;
        }
    }
}
