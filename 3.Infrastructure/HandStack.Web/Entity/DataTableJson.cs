using System.Data;

namespace HandStack.Web.Entity
{
    public sealed record DataTableJson
    {
        public static DataTableJsonData ToJsonObject(string fieldID, DataTable source)
        {
            return new DataTableJsonData(fieldID, source);
        }
    }

    public record DataTableJsonData
    {
        public DataTableJsonData()
        {
            ID = "";
            Value = new DataTable();
        }

        public DataTableJsonData(string id, DataTable value)
        {
            ID = id;
            Value = value;
        }

        public string ID { get; set; }

        public DataTable Value { get; set; }
    }
}
