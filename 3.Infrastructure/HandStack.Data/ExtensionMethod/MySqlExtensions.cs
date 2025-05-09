﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;

using MySql.Data.MySqlClient;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class MySqlExtensions
    {
        public static DataSet ExecuteDataSet(this MySqlCommand @this)
        {
            var ds = new DataSet();
            using (var dataAdapter = new MySqlDataAdapter(@this))
            {
                dataAdapter.Fill(ds);
            }

            return ds;
        }

        public static DataTable ExecuteDataTable(this MySqlCommand @this)
        {
            var dt = new DataTable();
            using (var dataAdapter = new MySqlDataAdapter(@this))
            {
                dataAdapter.Fill(dt);
            }

            return dt;
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType, MySqlTransaction? transaction)
        {
            using var command = @this.CreateCommand();
            command.CommandText = cmdText;
            command.CommandType = commandType;
            command.Transaction = transaction;

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            var ds = new DataSet();
            using (var dataAdapter = new MySqlDataAdapter(command))
            {
                dataAdapter.Fill(ds);
            }

            return ds;
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, Action<MySqlCommand> commandFactory)
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            var ds = new DataSet();
            using (var dataAdapter = new MySqlDataAdapter(command))
            {
                dataAdapter.Fill(ds);
            }

            return ds;
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, MySqlTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, null);
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, CommandType commandType, MySqlTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, transaction);
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, MySqlParameter[] parameters)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, null);
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, MySqlTransaction? transaction)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataSet ExecuteDataSet(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, parameters, commandType, null);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType, MySqlTransaction? transaction)
        {
            using var command = @this.CreateCommand();
            command.CommandText = cmdText;
            command.CommandType = commandType;
            command.Transaction = transaction;

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            var ds = new DataSet();
            using (var dataAdapter = new MySqlDataAdapter(command))
            {
                dataAdapter.Fill(ds);
            }

            return ds.Tables[0];
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, Action<MySqlCommand> commandFactory)
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            var ds = new DataSet();
            using (var dataAdapter = new MySqlDataAdapter(command))
            {
                dataAdapter.Fill(ds);
            }

            return ds.Tables[0];
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, MySqlTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, null);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, CommandType commandType, MySqlTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, transaction);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, MySqlParameter[] parameters)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, null);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, MySqlTransaction? transaction)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataTable ExecuteDataTable(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType, MySqlTransaction? transaction) where T : new()
        {
            using var command = @this.CreateCommand();
            command.CommandText = cmdText;
            command.CommandType = commandType;
            command.Transaction = transaction;

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            using IDataReader reader = command.ExecuteReader();
            return reader.ToEntities<T>();
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, Action<MySqlCommand> commandFactory) where T : new()
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            return reader.ToEntities<T>();
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, MySqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, CommandType commandType, MySqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, MySqlParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, MySqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType, MySqlTransaction? transaction) where T : new()
        {
            using var command = @this.CreateCommand();
            command.CommandText = cmdText;
            command.CommandType = commandType;
            command.Transaction = transaction;

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            using IDataReader reader = command.ExecuteReader();
            reader.Read();
            return reader.ToEntity<T>();
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, Action<MySqlCommand> commandFactory) where T : new()
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            reader.Read();
            return reader.ToEntity<T>();
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, MySqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, CommandType commandType, MySqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, MySqlParameter[] parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, MySqlTransaction? transaction) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType, MySqlTransaction? transaction)
        {
            using var command = @this.CreateCommand();
            command.CommandText = cmdText;
            command.CommandType = commandType;
            command.Transaction = transaction;

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            using IDataReader reader = command.ExecuteReader();
            reader.Read();
            return reader.ToExpandoObject();
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, Action<MySqlCommand> commandFactory)
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            reader.Read();
            return reader.ToExpandoObject();
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, MySqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, CommandType commandType, MySqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, MySqlParameter[] parameters)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, MySqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType, MySqlTransaction? transaction)
        {
            using var command = @this.CreateCommand();
            command.CommandText = cmdText;
            command.CommandType = commandType;
            command.Transaction = transaction;

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            using IDataReader reader = command.ExecuteReader();
            return reader.ToExpandoObjects();
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, Action<MySqlCommand> commandFactory)
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            return reader.ToExpandoObjects();
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, MySqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, CommandType commandType, MySqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, MySqlParameter[] parameters)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, MySqlTransaction? transaction)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this MySqlConnection @this, string cmdText, MySqlParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, commandType, null);
        }

        public static void AddRangeWithValue(this MySqlParameterCollection @this, Dictionary<string, object> values)
        {
            foreach (var keyValuePair in values)
            {
                @this.AddWithValue(keyValuePair.Key, keyValuePair.Value);
            }
        }

        public static string ParameterValueForSQL(this MySqlParameter @this)
        {
            var paramValue = @this.Value;

            if (paramValue == null)
            {
                return "NULL";
            }

            switch (@this.MySqlDbType)
            {
                case MySqlDbType.VarChar:
                case MySqlDbType.MediumText:
                case MySqlDbType.LongText:
                case MySqlDbType.String:
                case MySqlDbType.Text:
                case MySqlDbType.Time:
                case MySqlDbType.VarString:
                case MySqlDbType.JSON:
                case MySqlDbType.Date:
                case MySqlDbType.DateTime:
                    return $"'{paramValue.ToStringSafe().Replace("'", "''")}'";
                case MySqlDbType.Bit:
                    return (paramValue.ToBoolean(false)) ? "1" : "0";
                case MySqlDbType.Decimal:
                    return ((decimal)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                case MySqlDbType.Float:
                    return ((float)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                case MySqlDbType.Double:
                    return ((double)paramValue).ToString(CultureInfo.InvariantCulture).Replace("'", "''");
                default:
                    return paramValue.ToStringSafe().Replace("'", "''");
            }
        }

        public static string CommandAsMySql(this MySqlCommand @this)
        {
            var sql = new StringBuilder();

            switch (@this.CommandType)
            {
                case CommandType.Text:
                    @this.CommandAsMySql_Text(sql);
                    break;

                case CommandType.StoredProcedure:
                    @this.CommandAsMySql_StoredProcedure(sql);
                    break;
            }

            return sql.ToString();
        }

        private static void CommandAsMySql_Text(this MySqlCommand @this, StringBuilder sql)
        {
            var query = @this.CommandText;

            foreach (MySqlParameter p in @this.Parameters)
            {
                query = Regex.Replace(query, "\\B" + p.ParameterName + "\\b", p.ParameterValueForSQL()); //the first one is \B, the 2nd one is \b, since ParameterName starts with @ which is a non-word character in RegEx (see https://stackoverflow.com/a/2544661)
            }

            sql.AppendLine(query);
        }

        private static void CommandAsMySql_StoredProcedure(this MySqlCommand @this, StringBuilder sql)
        {
            sql.AppendLine("declare @return_value int;");

            foreach (MySqlParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("declare ").Append(sp.ParameterName).Append("\t").Append(sp.MySqlDbType.ToString()).Append("\t= ");

                    sql.Append((sp.Direction == ParameterDirection.Output) ? "null" : sp.ParameterValueForSQL()).AppendLine(";");
                }
            }

            sql.Append("exec [").Append(@this.CommandText).AppendLine("]");

            var FirstParam = true;
            foreach (MySqlParameter param in @this.Parameters)
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

            foreach (MySqlParameter sp in @this.Parameters)
            {
                if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                {
                    sql.Append("select '").Append(sp.ParameterName).Append("' = convert(varchar, ").Append(sp.ParameterName).AppendLine(");");
                }
            }
        }
    }
}
