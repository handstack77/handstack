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

        public DataTableHelper() : this(string.Empty)
        {
        }

        public DataTableHelper(string tableName)
        {
            resultTable = new DataTable(tableName);
        }

        public void AddColumn(string columnName, Type columnType)
        {
            var Column = new DataColumn();
            Column.DataType = columnType;
            Column.ColumnName = columnName;

            resultTable.Columns.Add(Column);
        }

        public void NewRow()
        {
            var rowItem = resultTable.NewRow();
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
                var ds = new DataSet();
                try
                {
                    do
                    {
                        using (var schemaTable = reader.GetSchemaTable())
                        {
                            if (schemaTable == null)
                            {
                                continue;
                            }

                            var dataTable = new DataTable();
                            dataTable.TableName = prefix + dataTableIndex.ToString();
                            ds.Tables.Add(dataTable);

                            DataRow row;

                            string columnName;
                            DataColumn column;
                            var count = schemaTable.Rows.Count;

                            for (var i = 0; i < count; i++)
                            {
                                row = schemaTable.Rows[i];
                                columnName = (string)row["ColumnName"];

                                column = new DataColumn(columnName, (Type)row["DataType"]);
                                if (row["ColumnSize"] != DBNull.Value && row["ColumnSize"] is int columnSize && columnSize > 0)
                                {
                                    if (column.DataType == typeof(string))
                                    {
                                        column.MaxLength = columnSize;
                                    }
                                }
                                dataTable.Columns.Add(column);
                            }

                            var values = new object[count];

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
                catch
                {
                    ds.Dispose();
                    throw;
                }
            }

            return null;
        }

        /// <summary>
        /// 현재 결과 집합을 끝까지 읽고 검증하되 첫 행 또는 마지막 행만 보관합니다.
        /// 다음 결과 집합으로 이동하거나 Reader를 닫지 않으며, 반환한 테이블은 호출자가 해제합니다.
        /// </summary>
        /// <param name="beforeRead">스키마 구성 후 첫 Read 직전에 실행할 작업입니다.</param>
        public static DataTable? DataReaderToSingleRowTable(IDataReader reader, bool retainFirstRow = false, Action? beforeRead = null)
        {
            using var schemaTable = reader.GetSchemaTable();
            if (schemaTable == null)
            {
                return null;
            }

            var table = new DataTable();
            try
            {
                foreach (DataRow schemaRow in schemaTable.Rows)
                {
                    table.Columns.Add((string)schemaRow["ColumnName"], (Type)schemaRow["DataType"]);
                }

                var values = new object[schemaTable.Rows.Count];
                try
                {
                    beforeRead?.Invoke();
                    table.BeginLoadData();
                    while (reader.Read())
                    {
                        reader.GetValues(values);
                        if (table.Rows.Count == 0 || (retainFirstRow && table.Rows.Count == 1))
                        {
                            table.LoadDataRow(values, true);
                        }
                        else
                        {
                            // 모든 행의 형식 검증은 유지하고, 보관할 행과 검증용 행만 재사용합니다.
                            for (var i = 0; i < values.Length; i++)
                            {
                                values[i] ??= DBNull.Value;
                            }
                            var row = table.Rows[retainFirstRow ? 1 : 0];
                            row.ItemArray = values;
                            row.AcceptChanges();
                        }
                    }
                }
                finally
                {
                    table.EndLoadData();
                }

                if (retainFirstRow && table.Rows.Count > 1)
                {
                    table.Rows.RemoveAt(1);
                }
                return table;
            }
            catch
            {
                table.Dispose();
                throw;
            }
        }

        public static DataSet DataReaderToSchemeOnly(IDataReader reader, string prefix = "dataTable", int dataTableIndex = 0)
        {
            using var ds = new DataSet();
            do
            {
                using (var schemaTable = reader.GetSchemaTable())
                {
                    if (schemaTable == null)
                    {
                        continue;
                    }

                    var addTable = schemaTable.Copy();
                    addTable.TableName = prefix + dataTableIndex.ToString();
                    ds.Tables.Add(addTable);
                }
                dataTableIndex = dataTableIndex + 1;
            } while (reader.NextResult() == true);

            return ds;
        }
    }
}
