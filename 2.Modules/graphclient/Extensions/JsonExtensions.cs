using System.Collections.Generic;
using System.Data;
using System.Linq;

using HandStack.Web.MessageContract.DataObject;

namespace graphclient.Extensions
{
    public static class JsonExtensions
    {
        public static List<DatabaseColumn> GetDbColumns(this DataTable table)
        {
            return table.Columns
                .Cast<DataColumn>()
                .Select(column => new DatabaseColumn()
                {
                    Name = column.ColumnName,
                    Comment = column.ColumnName,
                    Length = column.MaxLength < 0 ? 0 : column.MaxLength,
                    DataType = column.DataType.Name,
                    Require = false,
                    Default = ""
                })
                .ToList();
        }

        public static string BuildMeta(this DataTable table)
        {
            return string.Join(
                ";",
                table.Columns.Cast<DataColumn>().Select(column =>
                {
                    var metaType = ToMetaDataType(column.DataType.Name);
                    if (metaType == "string" && column.MaxLength > 0)
                    {
                        return $"{column.ColumnName}:{metaType}|{column.MaxLength}";
                    }

                    return $"{column.ColumnName}:{metaType}";
                }));
        }

        public static string ToMetaDataType(string dataType)
        {
            return dataType switch
            {
                "Boolean" => "bool",
                "DateTime" => "date",
                "DateTimeOffset" => "date",
                "Decimal" or "Double" or "Single" => "numeric",
                "Int16" or "Int32" or "Int64" or "UInt16" or "UInt32" or "UInt64" => "number",
                "Byte[]" => "binary",
                _ => "string"
            };
        }
    }
}
