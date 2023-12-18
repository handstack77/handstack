using System;
using System.Collections;
using System.Data;
using System.Reflection;

namespace HandStack.Core.ExtensionMethod
{
    public static class ArrayExtensions
    {
        public static void Clear<T>(this T[] @this)
        {
            Array.Clear(@this, 0, @this.Length);
        }

        public static void ClearAt<T>(this T[] @this, int at)
        {
            Array.Clear(@this, at, 1);
        }

        public static bool WithinIndex(this Array @this, int index)
        {
            return index >= 0 && index < @this.Length;
        }

        public static bool WithinIndex(this Array @this, int index, int dimension = 0)
        {
            return index >= @this.GetLowerBound(dimension) && index <= @this.GetUpperBound(dimension);
        }

        public static void ClearAll(this Array @this)
        {
            Array.Clear(@this, 0, @this.Length);
        }

        public static void BlockCopy(this Array src, int srcOffset, Array dst, int dstOffset, int count)
        {
            Buffer.BlockCopy(src, srcOffset, dst, dstOffset, count);
        }

        public static int ByteLength(this Array @this)
        {
            return Buffer.ByteLength(@this);
        }

        public static Byte GetByte(this Array @this, int index)
        {
            return Buffer.GetByte(@this, index);
        }

        public static void SetByte(this Array @this, int index, Byte value)
        {
            Buffer.SetByte(@this, index, value);
        }

        public static int BinarySearch(this Array @this, Object value)
        {
            return Array.BinarySearch(@this, value);
        }

        public static int BinarySearch(this Array @this, int index, int length, Object value)
        {
            return Array.BinarySearch(@this, index, length, value);
        }

        public static int BinarySearch(this Array @this, Object value, IComparer comparer)
        {
            return Array.BinarySearch(@this, value, comparer);
        }

        public static int BinarySearch(this Array @this, int index, int length, Object value, IComparer comparer)
        {
            return Array.BinarySearch(@this, index, length, value, comparer);
        }

        public static DataTable ToDataTable<T>(this T[] @this)
        {
            Type type = typeof(T);

            PropertyInfo[] properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.Instance);

            var dt = new DataTable();

            foreach (PropertyInfo property in properties)
            {
                dt.Columns.Add(property.Name, property.PropertyType);
            }

            foreach (FieldInfo field in fields)
            {
                dt.Columns.Add(field.Name, field.FieldType);
            }

            foreach (T item in @this)
            {
                DataRow dr = dt.NewRow();

                foreach (PropertyInfo property in properties)
                {
                    dr[property.Name] = property.GetValue(item, null);
                }

                foreach (FieldInfo field in fields)
                {
                    dr[field.Name] = field.GetValue(item);
                }

                dt.Rows.Add(dr);
            }

            return dt;
        }
    }
}
