using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;

using Oracle.ManagedDataAccess.Client;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class OracleExtensions
    {
        public static DataSet ExecuteDataSet(this OracleCommand @this)
        {
            var ds = new DataSet();
            using (var dataAdapter = new OracleDataAdapter(@this))
            {
                dataAdapter.Fill(ds);
            }

            return ds;
        }

        public static DataTable ExecuteDataTable(this OracleCommand @this)
        {
            var dt = new DataTable();
            using (var dataAdapter = new OracleDataAdapter(@this))
            {
                dataAdapter.Fill(dt);
            }

            return dt;
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType, OracleTransaction? transaction)
        {
            using (var command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                var ds = new DataSet();
                using (var dataAdapter = new OracleDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds;
            }
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, Action<OracleCommand> commandFactory)
        {
            using (var command = @this.CreateCommand())
            {
                commandFactory(command);

                var ds = new DataSet();
                using (var dataAdapter = new OracleDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds;
            }
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, OracleTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, null);
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, CommandType commandType, OracleTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, transaction);
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, OracleParameter[] parameters)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, OracleTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, parameters, commandType, null);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType, OracleTransaction? transaction)
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                var ds = new DataSet();
                using (var dataAdapter = new OracleDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds.Tables[0];
            }
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, Action<OracleCommand> commandFactory)
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                var ds = new DataSet();
                using (var dataAdapter = new OracleDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds.Tables[0];
            }
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, OracleTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, null);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, CommandType commandType, OracleTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, transaction);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, OracleParameter[] parameters)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, OracleTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType, OracleTransaction? transaction) where T : new()
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, Action<OracleCommand> commandFactory) where T : new()
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, OracleTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, CommandType commandType, OracleTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, OracleParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, OracleTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType, OracleTransaction? transaction) where T : new()
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, Action<OracleCommand> commandFactory) where T : new()
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, OracleTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, CommandType commandType, OracleTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, OracleParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, OracleTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType, OracleTransaction? transaction)
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, Action<OracleCommand> commandFactory)
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, OracleTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, CommandType commandType, OracleTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, OracleParameter[] parameters)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, OracleTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType, OracleTransaction? transaction)
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, Action<OracleCommand> commandFactory)
        {
            using (OracleCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, OracleTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, CommandType commandType, OracleTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, OracleParameter[] parameters)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, OracleTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this OracleConnection @this, string cmdText, OracleParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, commandType, null);
        }

        public static void AddRangeWithValue(this OracleParameterCollection @this, Dictionary<string, object> values)
        {
            @this.AddRangeWithValue(values);
        }

        public static string ParameterValueForSQL(this OracleParameter @this)
        {
            object? paramValue = @this.Value;

            if (paramValue == null)
            {
                return "NULL";
            }

            switch (@this.OracleDbType)
            {
                case OracleDbType.Char:
                case OracleDbType.NChar:
                case OracleDbType.NVarchar2:
                case OracleDbType.Varchar2:
                case OracleDbType.XmlType:
                case OracleDbType.TimeStamp:
                case OracleDbType.TimeStampLTZ:
                case OracleDbType.TimeStampTZ:
                case OracleDbType.Date:
                    return $"'{paramValue.ToStringSafe().Replace("'", "''")}'";
                case OracleDbType.Boolean:
                    return (paramValue.ToBoolean(false)) ? "1" : "0";
                case OracleDbType.Decimal:
                case OracleDbType.Double:
                    return ((double)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                default:
                    return paramValue.ToStringSafe().Replace("'", "''");
            }
        }

        public static string CommandAsOracle(this OracleCommand @this)
        {
            var sql = new StringBuilder();

            switch (@this.CommandType)
            {
                case CommandType.Text:
                    @this.CommandAsOracle_Text(sql);
                    break;

                case CommandType.StoredProcedure:
                    @this.CommandAsOracle_StoredProcedure(sql);
                    break;
            }

            return sql.ToString();
        }

        private static void CommandAsOracle_Text(this OracleCommand @this, StringBuilder sql)
        {
            string query = @this.CommandText;

            foreach (OracleParameter p in @this.Parameters)
            {
                query = Regex.Replace(query, "\\B" + p.ParameterName + "\\b", p.ParameterValueForSQL()); //the first one is \B, the 2nd one is \b, since ParameterName starts with @ which is a non-word character in RegEx (see https://stackoverflow.com/a/2544661)
            }

            sql.AppendLine(query);
        }

        private static void CommandAsOracle_StoredProcedure(this OracleCommand @this, StringBuilder sql)
        {
            sql.AppendLine("declare @return_value int;");

            foreach (OracleParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("declare ").Append(sp.ParameterName).Append("\t").Append(sp.OracleDbType.ToString()).Append("\t= ");

                    sql.Append((sp.Direction == ParameterDirection.Output) ? "null" : sp.ParameterValueForSQL()).AppendLine(";");
                }
            }

            sql.Append("exec [").Append(@this.CommandText).AppendLine("]");

            bool FirstParam = true;
            foreach (OracleParameter param in @this.Parameters)
            {
                if (param.Direction != ParameterDirection.ReturnValue)
                {
                    sql.Append((FirstParam) ? "\t" : "\t, ");

                    if (FirstParam)
                        FirstParam = false;

                    if (param.Direction == ParameterDirection.Input)
                    {
                        sql.Append(param.ParameterName).Append(" = ").AppendLine(param.ParameterValueForSQL());
                    }
                    else
                    {
                        sql.Append(param.ParameterName).Append(" = ").Append(param.ParameterName).AppendLine(" output");
                    }
                }
            }
            sql.AppendLine(";");

            sql.AppendLine("select 'Return Value' = convert(varchar, @return_value);");

            foreach (OracleParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("select '").Append(sp.ParameterName).Append("' = convert(varchar, ").Append(sp.ParameterName).AppendLine(");");
                }
            }
        }
    }
}
