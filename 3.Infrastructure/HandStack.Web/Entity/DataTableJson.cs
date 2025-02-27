using System.Data;

namespace HandStack.Web.Entity
{
    public sealed record DataTableJson
    {
        public static DataTableJsonData ToJsonObject(string fieldID, DataTable source)
        {
            var result = new DataTableJsonData();
            result.ID = fieldID;
            result.Value = source;

            return result;
        }
    }

    public record DataTableJsonData
    {
        public DataTableJsonData()
        {
            ID = "";
            Value = new DataTable();
        }

        public string ID { get; set; }

        public DataTable Value { get; set; }
    }
}
