using System.Collections.Generic;
using System.Data;

namespace HandStack.Web.Entity
{
    public sealed record FormJson
    {
        public static List<FormJsonData> ToJsonObject(string fieldID, DataSet source)
        {
            var formControls = new List<FormJsonData>();

            int colIndex;
            foreach (DataTable dataTable in source.Tables)
            {
                var formData = new FormJsonData();
                foreach (DataRow dataRow in dataTable.Rows)
                {
                    colIndex = 0;
                    foreach (var item in dataRow.ItemArray)
                    {
                        if (formData.Value.ContainsKey(dataTable.Columns[colIndex].ColumnName) == false)
                        {
                            formData.Value.Add(dataTable.Columns[colIndex].ColumnName, item);
                        }
                        colIndex++;
                    }
                }

                formData.ID = dataTable.TableName;

                formControls.Add(formData);
            }

            return formControls;
        }

        public static FormJsonData ToJsonObject(string fieldID, DataTable source)
        {
            int colIndex;
            var formData = new FormJsonData();
            foreach (DataRow dataRow in source.Rows)
            {
                colIndex = 0;
                foreach (var item in dataRow.ItemArray)
                {
                    if (formData.Value.ContainsKey(source.Columns[colIndex].ColumnName) == false)
                    {
                        formData.Value.Add(source.Columns[colIndex].ColumnName, item);
                    }
                    colIndex++;
                }
            }

            formData.ID = fieldID;

            return formData;
        }

        public static List<FormJsonData> ToJsonObject(string fieldID, IDataReader source)
        {
            var formControls = new List<FormJsonData>();

            var NextResult = false;
            var results = 0;
            var formData = new FormJsonData();

            do
            {
                if (NextResult == true)
                {
                    formControls.Add(formData);
                    formData = new FormJsonData();
                    NextResult = false;
                }

                while (source.Read())
                {
                    for (var i = 0; i < source.FieldCount; i++)
                    {
                        if (formData.Value.ContainsKey(source.GetName(i)) == false)
                        {
                            formData.Value.Add(source.GetName(i), source[i]);
                        }
                    }
                }

                formData.ID = "source" + results.ToString();

                formControls.Add(formData);
            } while (source.NextResult());

            return formControls;
        }
    }

    public record FormJsonData
    {
        public string ID { get; set; }

        public Dictionary<string, object?> Value { get; set; }

        public FormJsonData()
        {
            ID = "";
            Value = new Dictionary<string, object?>();
        }
    }
}
