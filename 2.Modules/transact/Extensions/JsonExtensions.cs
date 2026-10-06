using System;
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
            var result = new List<MetaColumn>();

            ArgumentNullException.ThrowIfNull(schemaTable);
            foreach (DataRow dataRow in schemaTable.Rows)
            {
                var metaColumn = new MetaColumn
                {
                    ColumnName = dataRow.GetStringSafe("ColumnName"),
                    BaseColumnName = dataRow.GetStringSafe("BaseColumnName"),
                    ColumnOrdinal = dataRow.GetInt32("ColumnOrdinal"),
                    ColumnSize = dataRow.GetInt32("ColumnSize"),
                    NumericPrecision = dataRow.GetInt32("NumericPrecision"),
                    NumericScale = dataRow.GetInt32("NumericScale"),
                    DataType = dataRow.GetStringSafe("ColumnName").Replace("System.", ""),
                    DataTypeName = dataRow.GetStringSafe("DataTypeName"),
                    AllowDBNull = dataRow.GetBoolean("AllowDBNull"),
                    IsReadOnly = dataRow.GetBoolean("IsReadOnly"),
                    IsAutoIncrement = dataRow.GetBoolean("IsAutoIncrement")
                };
                metaColumn.IsReadOnly = dataRow.GetBoolean("IsReadOnly");

                result.Add(metaColumn);
            }

            return result;
        }

        public static List<DatabaseColumn> GetDbColumns(this DataTable schemaTable)
        {
            var result = new List<DatabaseColumn>();

            ArgumentNullException.ThrowIfNull(schemaTable);
            foreach (DataRow dataRow in schemaTable.Rows)
            {
                var dbColumn = new DatabaseColumn
                {
                    Name = dataRow.GetStringSafe("ColumnName"),
                    Comment = dataRow.GetStringSafe("BaseColumnName"),
                    Length = dataRow.GetInt32("ColumnSize"),
                    DataType = dataRow.GetStringSafe("DataType").Replace("System.", ""),
                    Require = false,
                    Default = ""
                };

                result.Add(dbColumn);
            }

            return result;
        }

        public static string toMetaDataType(string dataType)
        {
            var result = dataType switch
            {
                "Boolean" => "bool",
                "DateTime" => "date",
                "Byte" or "Guid" or "Char" or "String" or "TimeSpan" or "SByte" => "string",
                "Decimal" or "Double" or "Single" => "numeric",
                "Int16" or "Int32" or "Int64" or "UInt16" or "UInt32" or "UInt64" => "number",
                _ => "string",
            };
            return result;
        }
    }
}
