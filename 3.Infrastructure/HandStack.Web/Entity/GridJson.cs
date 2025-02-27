using System.Collections.Generic;
using System.Data;

namespace HandStack.Web.Entity
{
    public sealed record GridJson
    {
        public static GridJsonData ToJsonObject(string fieldID, DataTable source)
        {
            var result = new GridJsonData();
            result.ID = fieldID;

            Dictionary<string, object> childRow;
            foreach (DataRow dataRow in source.Rows)
            {
                childRow = new Dictionary<string, object>();
                foreach (DataColumn col in source.Columns)
                {
                    childRow.Add(col.ColumnName, dataRow[col]);
                }
                result.Value.Add(childRow);
            }

            return result;
        }
    }

    public record GridJsonData
    {
        public GridJsonData()
        {
            ID = "";
            Value = new List<Dictionary<string, object>>();
        }

        public string ID { get; set; }

        public List<Dictionary<string, object>> Value { get; set; }
    }
}
