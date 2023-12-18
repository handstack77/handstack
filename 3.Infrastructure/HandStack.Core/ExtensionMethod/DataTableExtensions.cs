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
            @this.Columns.Add(new DataColumn() { DataType = columnType, ColumnName = columnName });
        }

        public static void RemoveColumn(this DataTable @this, string columnName)
        {
            @this.Columns.Remove(columnName);
        }

        public static void NewRow(this DataTable @this)
        {
            @this.Rows.Add(@this.NewRow());
        }

        public static void SetValue(this DataTable @this, int rowIndex, string columnName, object value)
        {
            @this.Rows[rowIndex][columnName] = value;
        }

        public static void SetValue(this DataTable @this, int rowIndex, int columnIndex, object value)
        {
            @this.Rows[rowIndex][columnIndex] = value;
        }

        public static object GetValue(this DataTable @this, int rowIndex, string columnName)
        {
            return @this.Rows[rowIndex][columnName];
        }

        public static object GetValue(this DataTable @this, int rowIndex, int columnIndex)
        {
            return @this.Rows[rowIndex][columnIndex];
        }

        public static DataTable CopyToDataTable<T>(this IEnumerable<T> source)
        {
            return new ObjectShredder<T>().Shred(source, null, null);
        }

        public static DataTable CopyToDataTable<T>(this IEnumerable<T> source, DataTable table, LoadOption? options)
        {
            return new ObjectShredder<T>().Shred(source, table, options);
        }
    }

    internal class ObjectShredder<T>
    {
        private PropertyInfo[] properties;
        private FieldInfo[] fields;
        private Dictionary<string, int> dictionary;
        private Type type;

        public ObjectShredder()
        {
            type = typeof(T);
            fields = type.GetFields();
            properties = type.GetProperties();
            dictionary = new Dictionary<string, int>();
        }

        public DataTable Shred(IEnumerable<T> source, DataTable? table, LoadOption? options)
        {
            if (typeof(T).IsPrimitive)
            {
                return ShredPrimitive(source, table, options);
            }

            table = table == null ? new DataTable(typeof(T).Name) : table;
            table = ExtendTable(table, typeof(T));
            table.BeginLoadData();
            using (IEnumerator<T> e = source.GetEnumerator())
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
            table = table == null ? new DataTable(typeof(T).Name) : table;

            if (!table.Columns.Contains("Value"))
            {
                table.Columns.Add("Value", typeof(T));
            }

            table.BeginLoadData();
            using (IEnumerator<T> enumerator = source.GetEnumerator())
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
                FieldInfo[] fieldInfos = fields;
                PropertyInfo[] ropertyInfos = properties;

                if (instance.GetType() != typeof(T))
                {
                    ExtendTable(table, instance.GetType());
                    fieldInfos = instance.GetType().GetFields();
                    ropertyInfos = instance.GetType().GetProperties();
                }

                foreach (FieldInfo f in fieldInfos)
                {
                    values[dictionary[f.Name]] = f.GetValue(instance);
                }

                foreach (PropertyInfo p in ropertyInfos)
                {
                    values[dictionary[p.Name]] = p.GetValue(instance, null);
                }
            }

            return values;
        }

        public DataTable ExtendTable(DataTable table, Type type)
        {
            foreach (FieldInfo f in type.GetFields())
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
            foreach (PropertyInfo p in type.GetProperties())
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
