using System;
using System.Collections.Generic;
using System.Data;
using System.Reflection;

namespace HandStack.Core.ExtensionMethod
{
    public static class DataTableExtensions
    {
        public static void AddColumn(this DataTable @this, string columnName, Type columnType)
        {
            ArgumentNullException.ThrowIfNull(@this);

            @this.Columns.Add(new DataColumn() { DataType = columnType, ColumnName = columnName });
        }

        public static void RemoveColumn(this DataTable @this, string columnName)
        {
            ArgumentNullException.ThrowIfNull(@this);

            @this.Columns.Remove(columnName);
        }

        public static void NewRow(this DataTable @this)
        {
            ArgumentNullException.ThrowIfNull(@this);

            @this.Rows.Add(@this.NewRow());
        }

        public static void SetValue(this DataTable @this, int rowIndex, string columnName, object value)
        {
            ArgumentNullException.ThrowIfNull(@this);

            @this.Rows[rowIndex][columnName] = value;
        }

        public static void SetValue(this DataTable @this, int rowIndex, int columnIndex, object value)
        {
            ArgumentNullException.ThrowIfNull(@this);

            @this.Rows[rowIndex][columnIndex] = value;
        }

        public static object GetValue(this DataTable @this, int rowIndex, string columnName)
        {
            ArgumentNullException.ThrowIfNull(@this);

            return @this.Rows[rowIndex][columnName];
        }

        public static object GetValue(this DataTable @this, int rowIndex, int columnIndex)
        {
            ArgumentNullException.ThrowIfNull(@this);

            return @this.Rows[rowIndex][columnIndex];
        }

        public static DataTable CopyToDataTable<T>(this IEnumerable<T> source)
        {
            ArgumentNullException.ThrowIfNull(source);

            return new ObjectShredder<T>().Shred(source, null, null);
        }

        public static DataTable CopyToDataTable<T>(this IEnumerable<T> source, DataTable table, LoadOption? options)
        {
            ArgumentNullException.ThrowIfNull(source);

            return new ObjectShredder<T>().Shred(source, table, options);
        }
    }

    internal class ObjectShredder<T>
    {
        private readonly PropertyInfo[] properties;
        private readonly FieldInfo[] fields;
        private readonly Dictionary<string, int> dictionary;
        private readonly Type type;
        private Dictionary<Type, (FieldInfo[] Fields, PropertyInfo[] Properties)>? derivedMembers;

        public ObjectShredder()
        {
            type = typeof(T);
            fields = type.GetFields();
            properties = type.GetProperties();
            dictionary = [];
        }

        public DataTable Shred(IEnumerable<T> source, DataTable? table, LoadOption? options)
        {
            if (typeof(T).IsPrimitive)
            {
                return ShredPrimitive(source, table, options);
            }

            table ??= new DataTable(typeof(T).Name);
            table = ExtendTable(table, typeof(T));
            table.BeginLoadData();
            using (var e = source.GetEnumerator())
            {
                while (e.MoveNext())
                {
                    if (options != null)
                    {
                        table.LoadDataRow(ShredObject(table, e.Current), (LoadOption)options);
                    }
                    else
                    {
                        table.LoadDataRow(ShredObject(table, e.Current), true);
                    }
                }
            }
            table.EndLoadData();
            return table;
        }

        public DataTable ShredPrimitive(IEnumerable<T> source, DataTable? table, LoadOption? options)
        {
            table ??= new DataTable(typeof(T).Name);

            if (!table.Columns.Contains("Value"))
            {
                table.Columns.Add("Value", typeof(T));
            }

            table.BeginLoadData();
            using (var enumerator = source.GetEnumerator())
            {
                object?[] values = new object[table.Columns.Count];
                while (enumerator.MoveNext())
                {
                    var column = table.Columns["Value"];
                    if (column != null)
                    {
                        values[column.Ordinal] = enumerator.Current;

                        if (options != null)
                        {
                            table.LoadDataRow(values, (LoadOption)options);
                        }
                        else
                        {
                            table.LoadDataRow(values, true);
                        }
                    }
                }
            }
            table.EndLoadData();
            return table;
        }

        public object?[] ShredObject(DataTable table, T instance)
        {
            object?[] values = new object[table.Columns.Count];
            if (instance != null)
            {
                var fieldInfos = fields;
                var ropertyInfos = properties;

                if (instance.GetType() != typeof(T))
                {
                    ExtendTable(table, instance.GetType());
                    (fieldInfos, ropertyInfos) = GetMembers(instance.GetType());
                }

                foreach (var f in fieldInfos)
                {
                    values[dictionary[f.Name]] = f.GetValue(instance);
                }

                foreach (var p in ropertyInfos)
                {
                    values[dictionary[p.Name]] = p.GetValue(instance, null);
                }
            }

            return values;
        }

        private (FieldInfo[] Fields, PropertyInfo[] Properties) GetMembers(Type objectType)
        {
            if (objectType == type)
            {
                return (fields, properties);
            }

            derivedMembers ??= [];
            if (!derivedMembers.TryGetValue(objectType, out var members))
            {
                members = (objectType.GetFields(), objectType.GetProperties());
                derivedMembers.Add(objectType, members);
            }
            return members;
        }

        public DataTable ExtendTable(DataTable table, Type type)
        {
            var (typeFields, typeProperties) = GetMembers(type);
            foreach (var f in typeFields)
            {
                if (dictionary.ContainsKey(f.Name) == false)
                {
                    DataColumn? dc;
                    if (table.Columns.Contains(f.Name) == true)
                    {
                        dc = table.Columns[f.Name];
                    }
                    else
                    {
                        dc = table.Columns.Add(f.Name, f.FieldType);
                    }

                    if (dc != null)
                    {
                        dictionary.Add(f.Name, dc.Ordinal);
                    }
                }
            }
            foreach (var p in typeProperties)
            {
                if (dictionary.ContainsKey(p.Name) == false)
                {
                    DataColumn? dc;
                    if (table.Columns.Contains(p.Name) == true)
                    {
                        dc = table.Columns[p.Name];
                    }
                    else
                    {
                        dc = table.Columns.Add(p.Name, p.PropertyType);
                    }

                    if (dc != null)
                    {
                        dictionary.Add(p.Name, dc.Ordinal);
                    }
                }
            }

            return table;
        }
    }
}
