using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class SqlClientExtensions
    {
        public static DataSet ExecuteDataSet(this SqlCommand @this)
        {
            var ds = new DataSet();
            using (var dataAdapter = new SqlDataAdapter(@this))
            {
                dataAdapter.Fill(ds);
            }

            return ds;
        }

        public static DataTable ExecuteDataTable(this SqlCommand @this)
        {
            var dt = new DataTable();
            using (var dataAdapter = new SqlDataAdapter(@this))
            {
                dataAdapter.Fill(dt);
            }

            return dt;
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction)
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
                using (var dataAdapter = new SqlDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds;
            }
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, Action<SqlCommand> commandFactory)
        {
            using (var command = @this.CreateCommand())
            {
                commandFactory(command);

                var ds = new DataSet();
                using (var dataAdapter = new SqlDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds;
            }
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, SqlTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, null);
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, transaction);
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, SqlParameter[] parameters)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, parameters, commandType, null);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction)
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                var ds = new DataSet();
                using (var dataAdapter = new SqlDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds.Tables[0];
            }
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, Action<SqlCommand> commandFactory)
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                var ds = new DataSet();
                using (var dataAdapter = new SqlDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds.Tables[0];
            }
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, SqlTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, null);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, transaction);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, SqlParameter[] parameters)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction) where T : new()
        {
            using (SqlCommand command = @this.CreateCommand())
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

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, Action<SqlCommand> commandFactory) where T : new()
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, SqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, SqlParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction) where T : new()
        {
            using (SqlCommand command = @this.CreateCommand())
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

        public static T ExecuteEntity<T>(this SqlConnection @this, Action<SqlCommand> commandFactory) where T : new()
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, SqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, SqlParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction)
        {
            using (SqlCommand command = @this.CreateCommand())
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

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, Action<SqlCommand> commandFactory)
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, SqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, SqlParameter[] parameters)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction)
        {
            using (SqlCommand command = @this.CreateCommand())
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

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, Action<SqlCommand> commandFactory)
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, SqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, SqlParameter[] parameters)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, commandType, null);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType, SqlTransaction? transaction)
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                return command.ExecuteXmlReader();
            }
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, Action<SqlCommand> commandFactory)
        {
            using (SqlCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                return command.ExecuteXmlReader();
            }
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText)
        {
            return @this.ExecuteXmlReader(cmdText, null, CommandType.Text, null);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, SqlTransaction? transaction)
        {
            return @this.ExecuteXmlReader(cmdText, null, CommandType.Text, transaction);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteXmlReader(cmdText, null, commandType, null);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, CommandType commandType, SqlTransaction? transaction)
        {
            return @this.ExecuteXmlReader(cmdText, null, commandType, transaction);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, SqlParameter[] parameters)
        {
            return @this.ExecuteXmlReader(cmdText, parameters, CommandType.Text, null);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, SqlTransaction? transaction)
        {
            return @this.ExecuteXmlReader(cmdText, parameters, CommandType.Text, transaction);
        }

        public static XmlReader ExecuteXmlReader(this SqlConnection @this, string cmdText, SqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteXmlReader(cmdText, parameters, commandType, null);
        }

        public static void AddRangeWithValue(this SqlParameterCollection @this, Dictionary<string, object> values)
        {
            foreach (var keyValuePair in values)
            {
                @this.AddWithValue(keyValuePair.Key, keyValuePair.Value);
            }
        }

        public static string ParameterValueForSQL(this SqlParameter @this)
        {
            object? paramValue = @this.Value;

            if (paramValue == null)
            {
                return "NULL";
            }

            switch (@this.SqlDbType)
            {
                case SqlDbType.Char:
                case SqlDbType.NChar:
                case SqlDbType.NText:
                case SqlDbType.NVarChar:
                case SqlDbType.Text:
                case SqlDbType.Time:
                case SqlDbType.VarChar:
                case SqlDbType.Xml:
                case SqlDbType.Date:
                case SqlDbType.DateTime:
                case SqlDbType.DateTime2:
                case SqlDbType.DateTimeOffset:
                    return $"'{paramValue.ToStringSafe().Replace("'", "''")}'";
                case SqlDbType.Bit:
                    return (paramValue.ToBoolean(false)) ? "1" : "0";
                case SqlDbType.Decimal:
                case SqlDbType.Float:
                    return ((double)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                default:
                    return paramValue.ToStringSafe().Replace("'", "''");
            }
        }

        public static string CommandAsTSql(this SqlCommand @this)
        {
            var sql = new StringBuilder();

            switch (@this.CommandType)
            {
                case CommandType.Text:
                    @this.CommandAsTSql_Text(sql);
                    break;

                case CommandType.StoredProcedure:
                    @this.CommandAsTSql_StoredProcedure(sql);
                    break;
            }

            return sql.ToString();
        }

        private static void CommandAsTSql_Text(this SqlCommand @this, StringBuilder sql)
        {
            string query = @this.CommandText;

            foreach (SqlParameter p in @this.Parameters)
            {
                query = Regex.Replace(query, "\\B@" + p.ParameterName + "\\b", p.ParameterValueForSQL()); //the first one is \B, the 2nd one is \b, since ParameterName starts with @ which is a non-word character in RegEx (see https://stackoverflow.com/a/2544661)
            }

            sql.AppendLine(query);
        }

        private static void CommandAsTSql_StoredProcedure(this SqlCommand @this, StringBuilder sql)
        {
            sql.AppendLine("declare @return_value int;");

            foreach (SqlParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("declare ").Append(sp.ParameterName).Append("\t").Append(sp.SqlDbType.ToString()).Append("\t= ");

                    sql.Append((sp.Direction == ParameterDirection.Output) ? "null" : sp.ParameterValueForSQL()).AppendLine(";");
                }
            }

            sql.Append("exec [").Append(@this.CommandText).AppendLine("]");

            bool FirstParam = true;
            foreach (SqlParameter param in @this.Parameters)
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

            foreach (SqlParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("select '").Append(sp.ParameterName).Append("' = convert(varchar, ").Append(sp.ParameterName).AppendLine(");");
                }
            }
        }
    }
}
