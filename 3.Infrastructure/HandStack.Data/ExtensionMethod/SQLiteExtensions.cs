using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class SQLiteExtensions
    {
        public static DataSet ExecuteDataSet(this SQLiteCommand @this)
        {
            var ds = new DataSet();
            using (var dataAdapter = new SQLiteDataAdapter(@this))
            {
                dataAdapter.Fill(ds);
            }

            return ds;
        }

        public static DataTable ExecuteDataTable(this SQLiteCommand @this)
        {
            var dt = new DataTable();
            using (var dataAdapter = new SQLiteDataAdapter(@this))
            {
                dataAdapter.Fill(dt);
            }

            return dt;
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType, SQLiteTransaction? transaction)
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
                using (var dataAdapter = new SQLiteDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds;
            }
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, Action<SQLiteCommand> commandFactory)
        {
            using (var command = @this.CreateCommand())
            {
                commandFactory(command);

                var ds = new DataSet();
                using (var dataAdapter = new SQLiteDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds;
            }
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, SQLiteTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, null);
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, CommandType commandType, SQLiteTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, transaction);
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, SQLiteParameter[] parameters)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, SQLiteTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, parameters, commandType, null);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType, SQLiteTransaction? transaction)
        {
            using (SQLiteCommand command = @this.CreateCommand())
            {
                command.CommandText = cmdText;
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                var ds = new DataSet();
                using (var dataAdapter = new SQLiteDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds.Tables[0];
            }
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, Action<SQLiteCommand> commandFactory)
        {
            using (SQLiteCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                var ds = new DataSet();
                using (var dataAdapter = new SQLiteDataAdapter(command))
                {
                    dataAdapter.Fill(ds);
                }

                return ds.Tables[0];
            }
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, SQLiteTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, null);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, CommandType commandType, SQLiteTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, transaction);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, SQLiteParameter[] parameters)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, SQLiteTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType, SQLiteTransaction? transaction) where T : new()
        {
            using (SQLiteCommand command = @this.CreateCommand())
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

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, Action<SQLiteCommand> commandFactory) where T : new()
        {
            using (SQLiteCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToEntities<T>();
                }
            }
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, SQLiteTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, CommandType commandType, SQLiteTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, SQLiteTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType, SQLiteTransaction? transaction) where T : new()
        {
            using (SQLiteCommand command = @this.CreateCommand())
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

        public static T ExecuteEntity<T>(this SQLiteConnection @this, Action<SQLiteCommand> commandFactory) where T : new()
        {
            using (SQLiteCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToEntity<T>();
                }
            }
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, SQLiteTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, CommandType commandType, SQLiteTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, SQLiteTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType, SQLiteTransaction? transaction)
        {
            using (SQLiteCommand command = @this.CreateCommand())
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

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, Action<SQLiteCommand> commandFactory)
        {
            using (SQLiteCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    reader.Read();
                    return reader.ToExpandoObject();
                }
            }
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, SQLiteTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, CommandType commandType, SQLiteTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, SQLiteParameter[] parameters)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, SQLiteTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType, SQLiteTransaction? transaction)
        {
            using (SQLiteCommand command = @this.CreateCommand())
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

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, Action<SQLiteCommand> commandFactory)
        {
            using (SQLiteCommand command = @this.CreateCommand())
            {
                commandFactory(command);

                using (IDataReader reader = command.ExecuteReader())
                {
                    return reader.ToExpandoObjects();
                }
            }
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, SQLiteTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, CommandType commandType, SQLiteTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, SQLiteParameter[] parameters)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, SQLiteTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this SQLiteConnection @this, string cmdText, SQLiteParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, commandType, null);
        }

        public static void AddRangeWithValue(this SQLiteParameterCollection @this, Dictionary<string, object> values)
        {
            foreach (var keyValuePair in values)
            {
                @this.AddWithValue(keyValuePair.Key, keyValuePair.Value);
            }
        }

        public static string ParameterValueForSQL(this SQLiteParameter @this)
        {
            object? paramValue = @this.Value;

            if (paramValue == null)
            {
                return "NULL";
            }

            switch (@this.DbType)
            {
                case DbType.String:
                case DbType.StringFixedLength:
                case DbType.AnsiString:
                case DbType.AnsiStringFixedLength:
                case DbType.Time:
                case DbType.Xml:
                case DbType.Date:
                case DbType.DateTime:
                case DbType.DateTime2:
                case DbType.DateTimeOffset:
                    return $"'{paramValue.ToStringSafe().Replace("'", "''")}'";
                case DbType.Boolean:
                    return (paramValue.ToBoolean(false)) ? "1" : "0";
                case DbType.Decimal:
                    return ((decimal)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                case DbType.Double:
                    return ((double)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                default:
                    return paramValue.ToStringSafe().Replace("'", "''");
            }
        }

        public static string CommandAsSQLite(this SQLiteCommand @this)
        {
            var sql = new StringBuilder();

            switch (@this.CommandType)
            {
                case CommandType.Text:
                    @this.CommandAsSQLite_Text(sql);
                    break;

                case CommandType.StoredProcedure:
                    @this.CommandAsSQLite_StoredProcedure(sql);
                    break;
            }

            return sql.ToString();
        }

        private static void CommandAsSQLite_Text(this SQLiteCommand @this, StringBuilder sql)
        {
            string query = @this.CommandText;

            foreach (SQLiteParameter p in @this.Parameters)
            {
                query = Regex.Replace(query, "\\B" + p.ParameterName + "\\b", p.ParameterValueForSQL()); //the first one is \B, the 2nd one is \b, since ParameterName starts with @ which is a non-word character in RegEx (see https://stackoverflow.com/a/2544661)
            }

            sql.AppendLine(query);
        }

        private static void CommandAsSQLite_StoredProcedure(this SQLiteCommand @this, StringBuilder sql)
        {
            sql.AppendLine("declare @return_value int;");

            foreach (SQLiteParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("declare ").Append(sp.ParameterName).Append("\t").Append(sp.DbType.ToString()).Append("\t= ");

                    sql.Append((sp.Direction == ParameterDirection.Output) ? "null" : sp.ParameterValueForSQL()).AppendLine(";");
                }
            }

            sql.Append("exec [").Append(@this.CommandText).AppendLine("]");

            bool FirstParam = true;
            foreach (SQLiteParameter param in @this.Parameters)
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

            foreach (SQLiteParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("select '").Append(sp.ParameterName).Append("' = convert(varchar, ").Append(sp.ParameterName).AppendLine(");");
                }
            }
        }
    }
}
