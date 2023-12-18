using System;
using System.Data;

namespace HandStack.Core.ExtensionMethod
{
    public static class DataRowViewExtensions
    {
        public static byte[]? GetBytes(this DataRowView @this, string fieldName)
        {
            return (@this[fieldName] as byte[]);
        }

        public static string? GetString(this DataRowView @this, string fieldName)
        {
            return @this.GetString(fieldName, null);
        }

        public static string? GetString(this DataRowView @this, string fieldName, string? defaultValue)
        {
            var value = @this[fieldName];
            return (value is string ? (string)value : defaultValue);
        }

        public static Guid GetGuid(this DataRowView @this, string fieldName)
        {
            var value = @this[fieldName];
            return (value is Guid ? (Guid)value : Guid.Empty);
        }

        public static DateTime GetDateTime(this DataRowView @this, string fieldName)
        {
            return @this.GetDateTime(fieldName, DateTime.MinValue);
        }

        public static DateTime GetDateTime(this DataRowView @this, string fieldName, DateTime defaultValue)
        {
            var value = @this[fieldName];
            return (value is DateTime ? (DateTime)value : defaultValue);
        }

        public static DateTimeOffset GetDateTimeOffset(this DataRowView @this, string fieldName)
        {
            return new DateTimeOffset(@this.GetDateTime(fieldName), TimeSpan.Zero);
        }

        public static DateTimeOffset GetDateTimeOffset(this DataRowView @this, string fieldName, DateTimeOffset defaultValue)
        {
            var dt = @this.GetDateTime(fieldName);
            return (dt != DateTime.MinValue ? new DateTimeOffset(dt, TimeSpan.Zero) : defaultValue);
        }

        public static short GetInt16(this DataRowView @this, string fieldName)
        {
            return @this.GetInt16(fieldName, 0);
        }

        public static short GetInt16(this DataRowView @this, string fieldName, short defaultValue)
        {
            var value = @this[fieldName];
            return (value is short ? (short)value : defaultValue);
        }

        public static ushort GetUInt16(this DataRowView @this, string fieldName)
        {
            return @this.GetUInt16(fieldName, 0);
        }

        public static ushort GetUInt16(this DataRowView @this, string fieldName, ushort defaultValue)
        {
            var value = @this[fieldName];
            return (value is ushort ? (ushort)value : defaultValue);
        }

        public static int GetInt32(this DataRowView @this, string fieldName)
        {
            return @this.GetInt32(fieldName, 0);
        }

        public static int GetInt32(this DataRowView @this, string fieldName, int defaultValue)
        {
            var value = @this[fieldName];
            return (value is int ? (int)value : defaultValue);
        }

        public static uint GetUInt32(this DataRowView @this, string fieldName)
        {
            return @this.GetUInt32(fieldName, 0);
        }

        public static uint GetUInt32(this DataRowView @this, string fieldName, uint defaultValue)
        {
            var value = @this[fieldName];
            return (value is uint ? (uint)value : defaultValue);
        }

        public static long GetInt64(this DataRowView @this, string fieldName)
        {
            return @this.GetInt64(fieldName, 0);
        }

        public static long GetInt64(this DataRowView @this, string fieldName, long defaultValue)
        {
            var value = @this[fieldName];
            return (value is long ? (long)value : defaultValue);
        }

        public static ulong GetUInt64(this DataRowView @this, string fieldName)
        {
            return @this.GetUInt64(fieldName, 0);
        }

        public static ulong GetUInt64(this DataRowView @this, string fieldName, ulong defaultValue)
        {
            var value = @this[fieldName];
            return (value is ulong ? (ulong)value : defaultValue);
        }

        public static decimal GetDecimal(this DataRowView @this, string fieldName)
        {
            return @this.GetDecimal(fieldName, 0);
        }

        public static decimal GetDecimal(this DataRowView @this, string fieldName, decimal defaultValue)
        {
            var value = @this[fieldName];
            return (value is decimal ? (decimal)value : defaultValue);
        }

        public static double GetDouble(this DataRowView @this, string fieldName)
        {
            return @this.GetDouble(fieldName, 0);
        }

        public static double GetDouble(this DataRowView @this, string fieldName, double defaultValue)
        {
            var value = @this[fieldName];
            return (value is double ? (double)value : defaultValue);
        }

        public static float GetSingle(this DataRowView @this, string fieldName)
        {
            return @this.GetSingle(fieldName, 0);
        }

        public static float GetSingle(this DataRowView @this, string fieldName, float defaultValue)
        {
            var value = @this[fieldName];
            return (value is float ? (float)value : defaultValue);
        }

        public static bool GetBoolean(this DataRowView @this, string fieldName)
        {
            return @this.GetBoolean(fieldName, false);
        }

        public static bool GetBoolean(this DataRowView @this, string fieldName, bool defaultValue)
        {
            var value = @this[fieldName];
            return (value is bool ? (bool)value : defaultValue);
        }

        public static bool IsDBNull(this DataRowView @this, string fieldName)
        {
            var value = @this[fieldName];
            return (value == DBNull.Value);
        }

        public static Type? GetType(this DataRowView @this, string fieldName)
        {
            return @this.GetType(fieldName, null);
        }

        public static Type? GetType(this DataRowView @this, string? fieldName, Type? defaultValue)
        {
            if (string.IsNullOrEmpty(fieldName) == false)
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
            }

            return defaultValue;
        }

        public static object? GetTypeInstance(this DataRowView @this, string? fieldName)
        {
            return @this.GetTypeInstance(fieldName, null);
        }

        public static object? GetTypeInstance(this DataRowView @this, string? fieldName, Type? defaultValue)
        {
            var type = @this.GetType(fieldName, defaultValue);
            return (type != null ? Activator.CreateInstance(type) : null);
        }

        public static T? GetTypeInstance<T>(this DataRowView @this, string? fieldName) where T : class
        {
            return (@this.GetTypeInstance(fieldName, null) as T);
        }

        public static T? GetTypeInstanceSafe<T>(this DataRowView @this, string? fieldName, Type? type) where T : class
        {
            if (type == null)
            {
                return null;
            }

            var instance = (@this.GetTypeInstance(fieldName, null) as T);
            return (instance ?? Activator.CreateInstance(type) as T);
        }

        public static T GetTypeInstanceSafe<T>(this DataRowView @this, string? fieldName) where T : class, new()
        {
            var instance = (@this.GetTypeInstance(fieldName, null) as T);
            return (instance ?? new T());
        }
    }
}
