using System;
using System.Data;
using System.Reflection;

using HandStack.Core.ExpandObjects.DataObject;

namespace HandStack.Core.ExtensionMethod
{
    public static class DataRowExtensions
    {
        public static void Initialize(this DataRow @this)
        {
            if (@this.Table == null)
            {
                return;
            }

            DataColumnCollection dataColumns = @this.Table.Columns;

            for (int i = 0; i < dataColumns.Count; i++)
            {
                if (@this.IsNull(i) == false)
                {
                    continue;
                }

                string rowType = dataColumns[i].DataType.Name;

                if (rowType.IndexOf("Int") > -1)
                {
                    @this[i] = 0;
                }
                else
                {
                    switch (rowType)
                    {
                        case "String":
                            @this[i] = "";
                            break;
                        case "Byte":
                        case "Decimal":
                        case "Single":
                        case "Double":
                            @this[i] = 0;
                            break;
                        case "Boolean":
                            @this[i] = false;
                            break;
                        case "DateTime":
                            @this[i] = DateTime.MinValue;
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        public static void Copy(this DataRow @this, DataRow target)
        {
            if (@this.Table == null || target.Table == null)
            {
                return;
            }

            DataColumnCollection dataColumns = target.Table.Columns;

            for (int i = 0; i < dataColumns.Count; i++)
            {
                string columnName = dataColumns[i].ColumnName;
                target[columnName] = @this[columnName];
            }
        }

        public static void CopyObjectFromDataRow(this DataRow @this, object target)
        {
            if (@this.Table == null)
            {
                return;
            }

            MemberInfo[] memberInfos = target.GetType().FindMembers(MemberTypes.Field | MemberTypes.Property, Reflector.memberAccess, null, null);

            foreach (MemberInfo memberInfo in memberInfos)
            {
                string propertyName = memberInfo.Name;

                if (@this.Table.Columns.Contains(propertyName) == false)
                {
                    continue;
                }

                switch (memberInfo.MemberType)
                {
                    case MemberTypes.All:
                        break;
                    case MemberTypes.Constructor:
                        break;
                    case MemberTypes.Custom:
                        break;
                    case MemberTypes.Event:
                        break;
                    case MemberTypes.Field:
                        Reflector.SetField(target, propertyName, @this[propertyName]);
                        break;
                    case MemberTypes.Method:
                        break;
                    case MemberTypes.NestedType:
                        break;
                    case MemberTypes.Property:
                        Reflector.SetProperty(target, propertyName, @this[propertyName]);
                        break;
                    case MemberTypes.TypeInfo:
                        break;
                    default:
                        break;
                }
            }
        }

        public static byte[]? GetBytes(this DataRow @this, string fieldName)
        {
            return (@this[fieldName] as byte[]);
        }

        public static string GetStringEmpty(this DataRow @this, string fieldName)
        {
            return @this.GetStringEmpty(fieldName, "");
        }

        public static string GetStringEmpty(this DataRow @this, string fieldName, string defaultValue)
        {
            var value = @this[fieldName];
            return (value is string ? (string)value : defaultValue);
        }

        public static string? GetString(this DataRow @this, string fieldName)
        {
            return @this.GetString(fieldName, null);
        }

        public static string? GetString(this DataRow @this, string fieldName, string? defaultValue)
        {
            var value = @this[fieldName];
            return (value is string ? (string)value : defaultValue);
        }

        public static Guid GetGuid(this DataRow @this, string fieldName)
        {
            var value = @this[fieldName];
            return (value is Guid ? (Guid)value : Guid.Empty);
        }

        public static DateTime GetDateTime(this DataRow @this, string fieldName)
        {
            return @this.GetDateTime(fieldName, DateTime.MinValue);
        }

        public static DateTime GetDateTime(this DataRow @this, string fieldName, DateTime defaultValue)
        {
            var value = @this[fieldName];
            return (value is DateTime ? (DateTime)value : defaultValue);
        }

        public static DateTimeOffset GetDateTimeOffset(this DataRow @this, string fieldName)
        {
            return new DateTimeOffset(@this.GetDateTime(fieldName), TimeSpan.Zero);
        }

        public static DateTimeOffset GetDateTimeOffset(this DataRow @this, string fieldName, DateTimeOffset defaultValue)
        {
            var dt = @this.GetDateTime(fieldName);
            return (dt != DateTime.MinValue ? new DateTimeOffset(dt, TimeSpan.Zero) : defaultValue);
        }

        public static short GetInt16(this DataRow @this, string fieldName)
        {
            return @this.GetInt16(fieldName, 0);
        }

        public static short GetInt16(this DataRow @this, string fieldName, short defaultValue)
        {
            var value = @this[fieldName];
            return (value is short ? (short)value : defaultValue);
        }

        public static ushort GetUInt16(this DataRow @this, string fieldName)
        {
            return @this.GetUInt16(fieldName, 0);
        }

        public static ushort GetUInt16(this DataRow @this, string fieldName, ushort defaultValue)
        {
            var value = @this[fieldName];
            return (value is ushort ? (ushort)value : defaultValue);
        }

        public static int GetInt32(this DataRow @this, string fieldName)
        {
            return @this.GetInt32(fieldName, 0);
        }

        public static int GetInt32(this DataRow @this, string fieldName, int defaultValue)
        {
            var value = @this[fieldName];
            return (value is int ? (int)value : defaultValue);
        }

        public static uint GetUInt32(this DataRow @this, string fieldName)
        {
            return @this.GetUInt32(fieldName, 0);
        }

        public static uint GetUInt32(this DataRow @this, string fieldName, uint defaultValue)
        {
            var value = @this[fieldName];
            return (value is uint ? (uint)value : defaultValue);
        }

        public static long GetInt64(this DataRow @this, string fieldName)
        {
            return @this.GetInt64(fieldName, 0);
        }

        public static long GetInt64(this DataRow @this, string fieldName, long defaultValue)
        {
            var value = @this[fieldName];
            return (value is long ? (long)value : defaultValue);
        }

        public static ulong GetUInt64(this DataRow @this, string fieldName)
        {
            return @this.GetUInt64(fieldName, 0);
        }

        public static ulong GetUInt64(this DataRow @this, string fieldName, ulong defaultValue)
        {
            var value = @this[fieldName];
            return (value is ulong ? (ulong)value : defaultValue);
        }

        public static decimal GetDecimal(this DataRow @this, string fieldName)
        {
            return @this.GetDecimal(fieldName, 0);
        }

        public static decimal GetDecimal(this DataRow @this, string fieldName, decimal defaultValue)
        {
            var value = @this[fieldName];
            return (value is decimal ? (decimal)value : defaultValue);
        }

        public static double GetDouble(this DataRow @this, string fieldName)
        {
            return @this.GetDouble(fieldName, 0);
        }

        public static double GetDouble(this DataRow @this, string fieldName, double defaultValue)
        {
            var value = @this[fieldName];
            return (value is double ? (double)value : defaultValue);
        }

        public static float GetSingle(this DataRow @this, string fieldName)
        {
            return @this.GetSingle(fieldName, 0);
        }

        public static float GetSingle(this DataRow @this, string fieldName, float defaultValue)
        {
            var value = @this[fieldName];
            return (value is float ? (float)value : defaultValue);
        }

        public static bool GetBoolean(this DataRow @this, string fieldName)
        {
            return @this.GetBoolean(fieldName, false);
        }

        public static bool GetBoolean(this DataRow @this, string fieldName, bool defaultValue)
        {
            var value = @this[fieldName];
            return (value is bool ? (bool)value : defaultValue);
        }

        public static bool IsDBNull(this DataRow @this, string fieldName)
        {
            var value = @this[fieldName];
            return (value == DBNull.Value);
        }

        public static DataRow AddDataRow(this DataRow @this, params string[] values)
        {
            int i = 0;
            foreach (string value in values)
            {
                @this[i] = value;
                i++;
            }

            return @this;
        }

        public static dynamic AsDynamic(this DataRow @this)
        {
            return new DynamicDataRow(@this);
        }
    }
}
