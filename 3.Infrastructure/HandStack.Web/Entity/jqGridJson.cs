using System.Collections.Generic;
using System.Data;

namespace HandStack.Web.Entity
{
    public sealed class jqGridJson
    {
        public static List<jqGridJsonData> ToJsonObject(string fieldID, DataSet source)
        {
            var jqGrids = new List<jqGridJsonData>();

            var iRow = 0;

            foreach (DataTable dataTable in source.Tables)
            {
                var jqGrid = new jqGridJsonData();

                foreach (DataRow dataRow in dataTable.Rows)
                {
                    var row = new jqGridJsonData.Row();
                    row.id = fieldID + iRow.ToString();

                    foreach (var item in dataRow.ItemArray)
                    {
                        row.cell.Add(item?.ToString());
                    }

                    jqGrid.rows.Add(row);
                    iRow++;
                }

                jqGrid.name = dataTable.TableName;
                jqGrid.page = 1;
                jqGrid.records = jqGrid.rows.Count;
                jqGrid.total = jqGrid.rows.Count;

                jqGrids.Add(jqGrid);
                iRow = 0;
            }

            return jqGrids;
        }

        public static jqGridJsonData ToJsonObject(string fieldID, DataTable source)
        {
            var iRow = 0;

            var jqGrid = new jqGridJsonData();

            foreach (DataRow dataRow in source.Rows)
            {
                var row = new jqGridJsonData.Row();
                row.id = fieldID + iRow.ToString();

                foreach (var item in dataRow.ItemArray)
                {
                    row.cell.Add(item?.ToString());
                }

                jqGrid.rows.Add(row);
                iRow++;
            }

            jqGrid.name = source.TableName;
            jqGrid.page = 1;
            jqGrid.records = jqGrid.rows.Count;
            jqGrid.total = jqGrid.rows.Count;

            return jqGrid;
        }

        public static List<jqGridJsonData> ToJsonObject(string fieldID, IDataReader source)
        {
            var jqGrids = new List<jqGridJsonData>();

            var NextResult = false;
            var results = 0;
            var iRow = 0;
            var jqGrid = new jqGridJsonData();

            do
            {
                if (NextResult == true)
                {
                    jqGrids.Add(jqGrid);
                    jqGrid = new jqGridJsonData();
                    iRow = 0;
                    NextResult = false;
                }

                while (source.Read())
                {
                    var row = new jqGridJsonData.Row();
                    row.id = fieldID + iRow.ToString();

                    for (var i = 0; i < source.FieldCount; i++)
                    {
                        row.cell.Add(source[i].ToString());
                    }

                    jqGrid.rows.Add(row);
                    iRow++;
                }

                jqGrid.name = "source" + results.ToString();
                jqGrid.page = 1;
                jqGrid.records = jqGrid.rows.Count;
                jqGrid.total = jqGrid.rows.Count;

                jqGrids.Add(jqGrid);
                iRow = 0;
            } while (source.NextResult());

            return jqGrids;
        }
    }

    public class jqGridJsonData
    {
        public class Row
        {
            public string id { get; set; }

            public List<string?> cell { get; set; }

            public Row()
            {
                id = "";
                cell = new List<string?>();
            }
        }

        public jqGridJsonData()
        {
            name = "";
            page = 0;
            total = 0;
            records = 0;
            rows = new List<Row>();
        }

        public string name { get; set; }

        public int page { get; set; }

        public int total { get; set; }

        public int records { get; set; }

        public List<Row> rows { get; set; }
    }
}
