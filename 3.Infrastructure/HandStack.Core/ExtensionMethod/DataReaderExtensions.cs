using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Reflection;

namespace HandStack.Core.ExtensionMethod
{
    public static class DataReaderExtensions
    {
        public static T Get<T>(this IDataReader @this, string fieldName)
        {
            return (T)@this.GetValue(@this.GetOrdinal(fieldName));
        }

        public static T Get<T>(this IDataReader @this, int index)
        {
            return (T)@this.GetValue(index);
        }

        public static T GetValueAsOrDefault<T>(this IDataReader @this, string columnName, T defaultValue)
        {
            try
            {
                return (T)@this.GetValue(@this.GetOrdinal(columnName));
            }
            catch
            {
                return defaultValue;
            }
        }

        public static T? GetValueAsOrDefault<T>(this IDataReader @this, string columnName)
        {
            try
            {
                return (T)@this.GetValue(@this.GetOrdinal(columnName));
            }
            catch
            {
                return default(T);
            }
        }

        public static T GetValueAsOrDefault<T>(this IDataReader @this, int index, T defaultValue)
        {
            try
            {
                return (T)@this.GetValue(index);
            }
            catch
            {
                return defaultValue;
            }
        }

        public static T? GetValueAsOrDefault<T>(this IDataReader @this, int index)
        {
            try
            {
                return (T)@this.GetValue(index);
            }
            catch
            {
                return default(T);
            }
        }


        public static byte[]? GetBytes(this IDataReader @this, string fieldName)
        {
            return (@this[fieldName] as byte[]);
        }

        public static string? GetString(this IDataReader @this, string fieldName)
        {
            return @this.GetString(fieldName, null);
        }

        public static string? GetString(this IDataReader @this, string fieldName, string? defaultValue)
        {
            var value = @this[fieldName];
            return (value is string ? (string)value : defaultValue);
        }

        public static Guid GetGuid(this IDataReader @this, string fieldName)
        {
            var value = @this[fieldName];
            return (value is Guid ? (Guid)value : Guid.Empty);
        }

        public static DateTime GetDateTime(this IDataReader @this, string fieldName)
        {
            return @this.GetDateTime(fieldName, DateTime.MinValue);
        }

        public static DateTime GetDateTime(this IDataReader @this, string fieldName, DateTime defaultValue)
        {
            var value = @this[fieldName];
            return (value is DateTime ? (DateTime)value : defaultValue);
        }

        public static DateTimeOffset GetDateTimeOffset(this IDataReader @this, string fieldName)
        {
            return new DateTimeOffset(@this.GetDateTime(fieldName), TimeSpan.Zero);
        }

        public static DateTimeOffset GetDateTimeOffset(this IDataReader @this, string fieldName, DateTimeOffset defaultValue)
        {
            var dt = @this.GetDateTime(fieldName);
            return (dt != DateTime.MinValue ? new DateTimeOffset(dt, TimeSpan.Zero) : defaultValue);
        }

        public static short GetInt16(this IDataReader @this, string fieldName)
        {
            return @this.GetInt16(fieldName, 0);
        }

        public static short GetInt16(this IDataReader @this, string fieldName, short defaultValue)
        {
            var value = @this[fieldName];
            return (value is short ? (short)value : defaultValue);
        }

        public static ushort GetUInt16(this IDataReader @this, string fieldName)
        {
            return @this.GetUInt16(fieldName, 0);
        }

        public static ushort GetUInt16(this IDataReader @this, string fieldName, ushort defaultValue)
        {
            var value = @this[fieldName];
            return (value is ushort ? (ushort)value : defaultValue);
        }

        public static int GetInt32(this IDataReader @this, string fieldName)
        {
            return @this.GetInt32(fieldName, 0);
        }

        public static int GetInt32(this IDataReader @this, string fieldName, int defaultValue)
        {
            var value = @this[fieldName];
            return (value is int ? (int)value : defaultValue);
        }

        public static uint GetUInt32(this IDataReader @this, string fieldName)
        {
            return @this.GetUInt32(fieldName, 0);
        }

        public static uint GetUInt32(this IDataReader @this, string fieldName, uint defaultValue)
        {
            var value = @this[fieldName];
            return (value is uint ? (uint)value : defaultValue);
        }

        public static long GetInt64(this IDataReader @this, string fieldName)
        {
            return @this.GetInt64(fieldName, 0);
        }

        public static long GetInt64(this IDataReader @this, string fieldName, long defaultValue)
        {
            var value = @this[fieldName];
            return (value is long ? (long)value : defaultValue);
        }

        public static ulong GetUInt64(this IDataReader @this, string fieldName)
        {
            return @this.GetUInt64(fieldName, 0);
        }

        public static ulong GetUInt64(this IDataReader @this, string fieldName, ulong defaultValue)
        {
            var value = @this[fieldName];
            return (value is ulong ? (ulong)value : defaultValue);
        }

        public static decimal GetDecimal(this IDataReader @this, string fieldName)
        {
            return @this.GetDecimal(fieldName, 0);
        }

        public static decimal GetDecimal(this IDataReader @this, string fieldName, decimal defaultValue)
        {
            var value = @this[fieldName];
            return (value is decimal ? (decimal)value : defaultValue);
        }

        public static double GetDouble(this IDataReader @this, string fieldName)
        {
            return @this.GetDouble(fieldName, 0);
        }

        public static double GetDouble(this IDataReader @this, string fieldName, double defaultValue)
        {
            var value = @this[fieldName];
            return (value is double ? (double)value : defaultValue);
        }

        public static float GetSingle(this IDataReader @this, string fieldName)
        {
            return @this.GetSingle(fieldName, 0);
        }

        public static float GetSingle(this IDataReader @this, string fieldName, float defaultValue)
        {
            var value = @this[fieldName];
            return (value is float ? (float)value : defaultValue);
        }

        public static bool GetBoolean(this IDataReader @this, string fieldName)
        {
            return @this.GetBoolean(fieldName, false);
        }

        public static bool GetBoolean(this IDataReader @this, string fieldName, bool defaultValue)
        {
            var value = @this[fieldName];
            return (value is bool ? (bool)value : defaultValue);
        }

        public static Type? GetType(this IDataReader @this, string fieldName)
        {
            return @this.GetType(fieldName, null);
        }

        public static Type? GetType(this IDataReader @this, string fieldName, Type? defaultValue)
        {
            string? classType = @this.GetString(fieldName);

            if (classType != null && classType.Length > 0)
            {
                Type? type = Type.GetType(classType);

                if (type != null)
                {
                    return type;
                }
            }

            return defaultValue;
        }

        public static object? GetTypeInstance(this IDataReader @this, string fieldName)
        {
            return @this.GetTypeInstance(fieldName, null);
        }

        public static object? GetTypeInstance(this IDataReader @this, string fieldName, Type? defaultValue)
        {
            var type = @this.GetType(fieldName, defaultValue);
            return (type != null ? Activator.CreateInstance(type) : null);
        }

        public static T? GetTypeInstance<T>(this IDataReader @this, string fieldName) where T : class
        {
            return (@this.GetTypeInstance(fieldName, null) as T);
        }

        public static T? GetTypeInstanceSafe<T>(this IDataReader @this, string fieldName, Type? type) where T : class
        {
            if (type == null)
            {
                return null;
            }

            var instance = (@this.GetTypeInstance(fieldName, null) as T);
            return (instance ?? Activator.CreateInstance(type) as T);
        }

        public static T GetTypeInstanceSafe<T>(this IDataReader @this, string fieldName) where T : class, new()
        {
            var instance = (@this.GetTypeInstance(fieldName, null) as T);
            return (instance ?? new T());
        }

        public static bool IsDBNull(this IDataReader @this, string fieldName)
        {
            return @this.IsDBNull(@this.GetOrdinal(fieldName));
        }

        public static int ReadAll(this IDataReader @this, Action<IDataReader> action)
        {
            var count = 0;
            while (@this.Read())
            {
                action(@this);
                count++;
            }
            return count;
        }

        public static void ToObject(this IDataReader @this, List<string> columnNames, object instance)
        {
            for (int i = 0; i < columnNames.Count; i++)
            {
                PropertyInfo? propertyInfo = instance.GetType().GetProperty(columnNames[i]);

                if (propertyInfo != null)
                {
                    object? value = @this.GetValue(i);
                    if (value == DBNull.Value)
                    {
                        value = null;
                    }

                    if (value is string && propertyInfo.PropertyType == typeof(DateTime?))
                    {
                        if (value == null || string.IsNullOrEmpty(value.ToStringSafe()) == true)
                        {
                            propertyInfo.SetValue(instance, value, null);
                        }
                        else
                        {
                            propertyInfo.SetValue(instance, DateTime.Parse(value.ToStringSafe()), null);
                        }
                    }
                    else
                    {
                        propertyInfo.SetValue(instance, value, null);
                    }
                }
            }
        }

        public static bool ColumnExists(this IDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals(columnName, StringComparison.InvariantCultureIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        public static void ToObject(this IDataReader @this, object instance, params string[] fieldsToSkip)
        {
            PropertyInfo[] properties = instance.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public);
            foreach (PropertyInfo property in properties)
            {
                if (!property.CanRead || !property.CanWrite)
                {
                    continue;
                }

                if (fieldsToSkip.Contains(property.Name))
                {
                    continue;
                }

                object? value = @this[property.Name];
                if (value is DBNull)
                {
                    value = null;
                }

                property.SetValue(instance, value, null);
            }
        }

        public static List<T> ToObjectList<T>(this IDataReader @this)
        {
            List<T> result = new List<T>();
            List<string> columnNames = new List<string>();
            for (int i = 0; i < @this.FieldCount; i++)
            {
                columnNames.Add(@this.GetName(i));
            }

            while (@this.Read())
            {
                var instance = Activator.CreateInstance<T>();
                if (instance != null)
                {
                    ToObject(@this, columnNames, instance);
                }

                result.Add(instance);
            }

            return result;
        }

        public static List<T> ToObjectList<T>(this IDataReader @this, params string[] fieldsToSkip)
        {
            List<T> result = new List<T>();
            while (@this.Read())
            {
                var instance = Activator.CreateInstance<T>();
                if (instance != null)
                {
                    ToObject(@this, instance, fieldsToSkip);

                    result.Add(instance);
                }
            }

            return result;
        }

        public static bool ContainsColumn(this IDataReader @this, int columnIndex)
        {
            try
            {
                return @this.FieldCount > columnIndex;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public static bool ContainsColumn(this IDataReader @this, string columnName)
        {
            try
            {
                return @this.GetOrdinal(columnName) != -1;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public static IDataReader ForEach(this IDataReader @this, Action<IDataReader> action)
        {
            while (@this.Read())
            {
                action(@this);
            }

            return @this;
        }

        public static IEnumerable<string> GetColumnNames(this IDataRecord @this)
        {
            return Enumerable.Range(0, @this.FieldCount)
                .Select(@this.GetName)
                .ToList();
        }

        public static DataTable ToDataTable(this IDataReader @this)
        {
            var dt = new DataTable();
            dt.Load(@this);
            return dt;
        }

        public static IEnumerable<T> ToEntities<T>(this IDataReader @this) where T : new()
        {
            Type type = typeof(T);
            PropertyInfo[] properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.Instance);

            var list = new List<T>();

            var hash = new HashSet<string>(Enumerable.Range(0, @this.FieldCount)
                .Select(@this.GetName));

            while (@this.Read())
            {
                var entity = new T();

                foreach (PropertyInfo property in properties)
                {
                    if (hash.Contains(property.Name))
                    {
                        Type valueType = property.PropertyType;
                        property.SetValue(entity, @this[property.Name].To(valueType), null);
                    }
                }

                foreach (FieldInfo field in fields)
                {
                    if (hash.Contains(field.Name))
                    {
                        Type valueType = field.FieldType;
                        field.SetValue(entity, @this[field.Name].To(valueType));
                    }
                }

                list.Add(entity);
            }

            return list;
        }

        public static T ToEntity<T>(this IDataReader @this) where T : new()
        {
            Type type = typeof(T);
            PropertyInfo[] properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.Instance);

            var entity = new T();

            var hash = new HashSet<string>(Enumerable.Range(0, @this.FieldCount)
                .Select(@this.GetName));

            foreach (PropertyInfo property in properties)
            {
                if (hash.Contains(property.Name))
                {
                    Type valueType = property.PropertyType;
                    property.SetValue(entity, @this[property.Name].To(valueType), null);
                }
            }

            foreach (FieldInfo field in fields)
            {
                if (hash.Contains(field.Name))
                {
                    Type valueType = field.FieldType;
                    field.SetValue(entity, @this[field.Name].To(valueType));
                }
            }

            return entity;
        }

        public static dynamic ToExpandoObject(this IDataReader @this)
        {
            Dictionary<int, KeyValuePair<int, string>> columnNames = Enumerable.Range(0, @this.FieldCount)
                .Select(x => new KeyValuePair<int, string>(x, @this.GetName(x)))
                .ToDictionary(pair => pair.Key);

            dynamic entity = new ExpandoObject();
            var expandoDict = (IDictionary<string, object>)entity;

            Enumerable.Range(0, @this.FieldCount)
                .ToList()
                .ForEach(x => expandoDict.Add(columnNames[x].Value, @this[x]));

            return entity;
        }

        public static IEnumerable<dynamic> ToExpandoObjects(this IDataReader @this)
        {
            Dictionary<int, KeyValuePair<int, string>> columnNames = Enumerable.Range(0, @this.FieldCount)
                .Select(x => new KeyValuePair<int, string>(x, @this.GetName(x)))
                .ToDictionary(pair => pair.Key);

            var list = new List<dynamic>();

            while (@this.Read())
            {
                dynamic entity = new ExpandoObject();
                var expandoDict = (IDictionary<string, object>)entity;

                Enumerable.Range(0, @this.FieldCount)
                    .ToList()
                    .ForEach(x => expandoDict.Add(columnNames[x].Value, @this[x]));

                list.Add(entity);
            }

            return list;
        }
    }
}
