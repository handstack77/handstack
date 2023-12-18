using System;
using System.Data;

namespace HandStack.Core.Helpers
{
    /// <code>
	/// DataTableBuilder dataTableBuilder = new DataTableBuilder();
	/// dataTableBuilder.AddColumn("GlobalID", typeof(string));
	/// dataTableBuilder.NewRow();
	/// dataTableBuilder.SetValue(0, 0, request.GlobalID);
	/// using (DataTable table = dataTableBuilder.GetDataTable())
	/// {
	/// }
    /// </code>
    public class DataTableHelper
    {
        private DataTable resultTable;

        public DataTableHelper() : this(Guid.NewGuid().ToString("N"))
        {
            resultTable = new DataTable();
        }

        public DataTableHelper(string tableName)
        {
            resultTable = new DataTable(tableName);
        }

        public void AddColumn(string columnName, Type columnType)
        {
            DataColumn Column = new DataColumn();
            Column.DataType = columnType;
            Column.ColumnName = columnName;

            resultTable.Columns.Add(Column);
        }

        public void NewRow()
        {
            DataRow rowItem = resultTable.NewRow();
            resultTable.Rows.Add(rowItem);
        }

        public void SetValue(int rowIndex, string columnName, object? value)
        {
            resultTable.Rows[rowIndex][columnName] = value;
        }

        public void SetValue(int rowIndex, int columnIndex, object? value)
        {
            resultTable.Rows[rowIndex][columnIndex] = value;
        }

        public object GetValue(int rowIndex, string columnName)
        {
            return resultTable.Rows[rowIndex][columnName];
        }

        public object GetValue(int rowIndex, int columnIndex)
        {
            return resultTable.Rows[rowIndex][columnIndex];
        }

        public DataTable GetDataTable()
        {
            return resultTable;
        }

        public void Clear()
        {
            if (resultTable != null)
            {
                resultTable.Dispose();
            }
        }

        public static DataSet? DataReaderToDataSet(IDataReader? reader, string prefix = "dataTable", int dataTableIndex = 0)
        {
            if (reader != null)
            {
                using (DataSet ds = new DataSet())
                {
                    do
                    {
                        using (DataTable dataTable = new DataTable())
                        using (DataTable? schemaTable = reader.GetSchemaTable())
                        {
                            if (schemaTable == null)
                            {
                                continue;
                            }

                            DataRow row;

                            string columnName;
                            DataColumn column;
                            int count = schemaTable.Rows.Count;

                            for (int i = 0; i < count; i++)
                            {
                                row = schemaTable.Rows[i];
                                columnName = (string)row["ColumnName"];

                                column = new DataColumn(columnName, (Type)row["DataType"]);
                                dataTable.Columns.Add(column);
                            }

                            dataTable.TableName = prefix + dataTableIndex.ToString();
                            ds.Tables.Add(dataTable);

                            object[] values = new object[count];

                            try
                            {
                                dataTable.BeginLoadData();
                                while (reader.Read())
                                {
                                    reader.GetValues(values);
                                    dataTable.LoadDataRow(values, true);
                                }
                            }
                            finally
                            {
                                dataTable.EndLoadData();
                            }
                        }
                        dataTableIndex = dataTableIndex + 1;
                    } while (reader.NextResult() == true);

                    return ds;
                }
            }

            return null;
        }

        public static DataSet DataReaderToSchemeOnly(IDataReader reader, string prefix = "dataTable", int dataTableIndex = 0)
        {
            using (DataSet ds = new DataSet())
            {
                do
                {
                    using (DataTable? schemaTable = reader.GetSchemaTable())
                    {
                        if (schemaTable == null)
                        {
                            continue;
                        }

                        DataTable addTable = schemaTable.Copy();
                        addTable.TableName = prefix + dataTableIndex.ToString();
                        ds.Tables.Add(addTable);
                    }
                    dataTableIndex = dataTableIndex + 1;
                } while (reader.NextResult() == true);

                return ds;
            }
        }
    }
}
