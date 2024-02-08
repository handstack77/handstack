using System.Collections.Generic;
using System.Data;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Entitie;

using Newtonsoft.Json;

namespace transact.Extensions
{
    public static class JsonExtensions
    {
        public static T? DeepCopy<T>(this T self)
        {
            var serialized = JsonConvert.SerializeObject(self);
            return JsonConvert.DeserializeObject<T>(serialized);
        }

        public static List<MetaColumn> GetMetaColumns(this DataTable schemaTable)
        {
            List<MetaColumn> result = new List<MetaColumn>();

            foreach (DataRow dataRow in schemaTable.Rows)
            {
                MetaColumn metaColumn = new MetaColumn();
                metaColumn.ColumnName = dataRow.GetStringSafe("ColumnName");
                metaColumn.BaseColumnName = dataRow.GetStringSafe("BaseColumnName");
                metaColumn.ColumnOrdinal = dataRow.GetInt32("ColumnOrdinal");
                metaColumn.ColumnSize = dataRow.GetInt32("ColumnSize");
                metaColumn.NumericPrecision = dataRow.GetInt32("NumericPrecision");
                metaColumn.NumericScale = dataRow.GetInt32("NumericScale");
                metaColumn.DataType = dataRow.GetStringSafe("ColumnName").Replace("System.", "");
                metaColumn.DataTypeName = dataRow.GetStringSafe("DataTypeName");
                metaColumn.AllowDBNull = dataRow.GetBoolean("AllowDBNull");
                metaColumn.IsReadOnly = dataRow.GetBoolean("IsReadOnly");
                metaColumn.IsAutoIncrement = dataRow.GetBoolean("IsAutoIncrement");
                metaColumn.IsReadOnly = dataRow.GetBoolean("IsReadOnly");

                result.Add(metaColumn);
            }

            return result;
        }

        public static List<DatabaseColumn> GetDbColumns(this DataTable schemaTable)
        {
            List<DatabaseColumn> result = new List<DatabaseColumn>();

            foreach (DataRow dataRow in schemaTable.Rows)
            {
                DatabaseColumn dbColumn = new DatabaseColumn();
                dbColumn.Name = dataRow.GetStringSafe("ColumnName");
                dbColumn.Comment = dataRow.GetStringSafe("BaseColumnName");
                dbColumn.Length = dataRow.GetInt32("ColumnSize");
                dbColumn.DataType = dataRow.GetStringSafe("DataType").Replace("System.", "");
                dbColumn.Require = false;
                dbColumn.Default = "";

                result.Add(dbColumn);
            }

            return result;
        }

        public static string toMetaDataType(string dataType)
        {
            string result = "string";

            switch (dataType)
            {
                case "Boolean":
                    result = "bool";
                    break;
                case "DateTime":
                    result = "date";
                    break;
                case "Byte":
                case "Guid":
                case "Char":
                case "String":
                case "TimeSpan":
                case "SByte":
                    result = "string";
                    break;
                case "Decimal":
                case "Double":
                case "Single":
                    result = "number";
                    break;
                case "Int16":
                case "Int32":
                case "Int64":
                case "UInt16":
                case "UInt32":
                case "UInt64":
                    result = "int";
                    break;
                default:
                    result = "string";
                    break;
            }

            return result;
        }
    }
}
