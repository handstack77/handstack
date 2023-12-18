using System.Data;

namespace HandStack.Web.Entity
{
    public sealed class DataTableJson
    {
        public static DataTableJsonData ToJsonObject(string fieldID, DataTable source)
        {
            var result = new DataTableJsonData();
            result.ID = fieldID;
            result.Value = source;

            return result;
        }
    }

    public class DataTableJsonData
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
