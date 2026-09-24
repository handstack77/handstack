using System.Collections.Generic;
using System.Data;

namespace HandStack.Web.Entity
{
    public sealed record ChartGridJson
    {
        public static ChartJsonData ToJsonObject(string fieldID, DataTable source)
        {
            var result = new ChartJsonData();
            result.ID = fieldID;
            result.Value.EnsureCapacity(source.Rows.Count);

            foreach (DataRow dataRow in source.Rows)
            {
                var row = new Dictionary<string, object>(2);
                object? name = dataRow[0].ToString();
                row["name"] = name == null ? "" : name;
                var count = source.Columns.Count;
                var values = new List<object>(count - 1);
                row["data"] = values;
                for (var i = 1; i < count; i++)
                {
                    values.Add(dataRow[i]);
                }

                result.Value.Add(row);
            }

            return result;
        }
    }

    public record ChartJsonData
    {
        public string ID { get; set; }

        public List<object> Value { get; set; }

        public ChartJsonData()
        {
            ID = "";
            Value = new List<object>();
        }
    }
}
