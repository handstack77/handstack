using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SQLite;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;

using HtmlAgilityPack;

using Microsoft.Data.SqlClient;

using MySql.Data.MySqlClient;

using Newtonsoft.Json.Linq;

using Npgsql;

using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

using Serilog;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class DatabaseExtensions
    {
        public static string RecursiveParameters(string convertString, JObject? parameters, string keyString = "", bool commaReplace = true)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    if (parameter.Value != null)
                    {
                        if (parameter.Value.Type.ToString() == "Object")
                        {
                            var nextKeyString = keyString + parameter.Key + "\\.";
                            convertString = RecursiveParameters(convertString, parameter.Value?.ToObject<JObject>(), nextKeyString);
                        }
                        else
                        {
                            var name = parameter.Key;
                            var value = parameter.Value.ToStringSafe();

                            name = name.StartsWith("$") == true ? "\\" + name : name;
                            if (name.StartsWith("\\$") == false)
                            {
                                value = value.Replace("\"", "\\\"").Replace("'", "''");
                            }

                            convertString = Regex.Replace(convertString, "\\#{" + name + "}", "'" + value + "'");
                            convertString = Regex.Replace(convertString, "\\${" + name + "}", value);
                        }
                    }
                }
            }

            if (commaReplace == true)
            {
                return convertString.Replace("''", "'");
            }
            else
            {
                return convertString;
            }
        }

        public static DataSet? ExecuteDataSet(this DbCommand @this, DatabaseFactory databaseFactory)
        {
            var result = new DataSet();
            if (databaseFactory.SqlFactory == null)
            {
                result = null;
            }
            else
            {
                var dataAdapter = databaseFactory.SqlFactory.CreateDataAdapter();
                if (dataAdapter != null)
                {
                    dataAdapter.SelectCommand = @this;
                    dataAdapter.Fill(result);
                }
            }

            return result;
        }

        public static DataTable? ExecuteDataTable(this DbCommand @this, DatabaseFactory databaseFactory)
        {
            var result = new DataTable();
            if (databaseFactory.SqlFactory == null)
            {
                result = null;
            }
            else
            {
                var dataAdapter = databaseFactory.SqlFactory.CreateDataAdapter();
                if (dataAdapter != null)
                {
                    dataAdapter.SelectCommand = @this;
                    dataAdapter.Fill(result);
                }
            }

            return result;
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction = null)
        {
            var result = new DataSet();
            if (@this.Connection != null)
            {
                using var command = @this.Connection.CreateCommand();
                command.CommandText = cmdText;
                command.CommandType = commandType;

                if (transaction != null)
                {
                    command.Transaction = transaction;
                }

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                var dataAdapter = @this.SqlFactory.CreateDataAdapter();
                if (dataAdapter != null)
                {
                    dataAdapter.SelectCommand = command;
                    dataAdapter.Fill(result);
                }
            }
            else
            {
                result = null;
            }

            return result;
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, Action<DbCommand> commandFactory)
        {
            var result = new DataSet();
            if (@this.Connection != null)
            {
                using var command = @this.Connection.CreateCommand();
                commandFactory(command);

                var dataAdapter = @this.SqlFactory.CreateDataAdapter();
                if (dataAdapter != null)
                {
                    dataAdapter.SelectCommand = command;
                    dataAdapter.Fill(result);
                }
            }
            else
            {
                result = null;
            }

            return result;
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, null);
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, DbTransaction? transaction = null)
        {
            return @this.ExecuteDataSet(cmdText, null, CommandType.Text, transaction);
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, null);
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, CommandType commandType, DbTransaction? transaction = null)
        {
            return @this.ExecuteDataSet(cmdText, null, commandType, transaction);
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, null);
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters, DbTransaction? transaction = null)
        {
            return @this.ExecuteDataSet(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataSet? ExecuteDataSet(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataSet(cmdText, parameters, commandType, null);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction = null)
        {
            DataTable? result = null;
            if (@this.Connection != null)
            {
                using var command = @this.Connection.CreateCommand();
                command.CommandText = cmdText;
                command.CommandType = commandType;

                if (transaction != null)
                {
                    command.Transaction = transaction;
                }

                if (parameters != null)
                {
                    command.Parameters.AddRange(parameters);
                }

                var ds = new DataSet();
                var dataAdapter = @this.SqlFactory.CreateDataAdapter();
                if (dataAdapter != null)
                {
                    dataAdapter.SelectCommand = command;
                    dataAdapter.Fill(ds);
                }

                return ds.Tables.Count == 0 ? null : ds.Tables[0];
            }

            return result;
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, Action<DbCommand> commandFactory)
        {
            DataTable? result = null;
            if (@this.Connection != null)
            {
                using var command = @this.Connection.CreateCommand();
                commandFactory(command);

                var ds = new DataSet();
                var dataAdapter = @this.SqlFactory.CreateDataAdapter();
                if (dataAdapter != null)
                {
                    dataAdapter.SelectCommand = command;
                    dataAdapter.Fill(ds);
                }

                return ds.Tables.Count == 0 ? null : ds.Tables[0];
            }

            return result;
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, null);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, DbTransaction? transaction = null)
        {
            return @this.ExecuteDataTable(cmdText, null, CommandType.Text, transaction);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, null);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, CommandType commandType, DbTransaction? transaction = null)
        {
            return @this.ExecuteDataTable(cmdText, null, commandType, transaction);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, null);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters, DbTransaction? transaction = null)
        {
            return @this.ExecuteDataTable(cmdText, parameters, CommandType.Text, transaction);
        }

        public static DataTable? ExecuteDataTable(this DatabaseFactory @this, string cmdText, DbParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteDataTable(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction = null) where T : new()
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

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, Action<DbCommand> commandFactory) where T : new()
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            return reader.ToEntities<T>();
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, DbTransaction? transaction = null) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, CommandType commandType, DbTransaction? transaction = null) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters, DbTransaction? transaction = null) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<T> ExecuteEntities<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntities<T>(cmdText, parameters, commandType, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction = null) where T : new()
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

        public static T ExecuteEntity<T>(this DbConnection @this, Action<DbCommand> commandFactory) where T : new()
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            reader.Read();
            return reader.ToEntity<T>();
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, DbTransaction? transaction = null) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, CommandType commandType, DbTransaction? transaction = null) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, null, commandType, transaction);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, null);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters, DbTransaction? transaction = null) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, CommandType.Text, transaction);
        }

        public static T ExecuteEntity<T>(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType) where T : new()
        {
            return @this.ExecuteEntity<T>(cmdText, parameters, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction = null)
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

        public static dynamic ExecuteExpandoObject(this DbConnection @this, Action<DbCommand> commandFactory)
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            reader.Read();
            return reader.ToExpandoObject();
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, DbTransaction? transaction = null)
        {
            return @this.ExecuteExpandoObject(cmdText, null, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, CommandType commandType, DbTransaction? transaction = null)
        {
            return @this.ExecuteExpandoObject(cmdText, null, commandType, transaction);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, DbParameter[]? parameters)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, null);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, DbParameter[]? parameters, DbTransaction? transaction = null)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, CommandType.Text, transaction);
        }

        public static dynamic ExecuteExpandoObject(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObject(cmdText, parameters, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType, DbTransaction? transaction = null)
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

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, Action<DbCommand> commandFactory)
        {
            using var command = @this.CreateCommand();
            commandFactory(command);

            using IDataReader reader = command.ExecuteReader();
            return reader.ToExpandoObjects();
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, DbTransaction? transaction = null)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, CommandType commandType, DbTransaction? transaction = null)
        {
            return @this.ExecuteExpandoObjects(cmdText, null, commandType, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, DbParameter[]? parameters)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, null);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, DbParameter[]? parameters, DbTransaction? transaction = null)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, CommandType.Text, transaction);
        }

        public static IEnumerable<dynamic> ExecuteExpandoObjects(this DbConnection @this, string cmdText, DbParameter[]? parameters, CommandType commandType)
        {
            return @this.ExecuteExpandoObjects(cmdText, parameters, commandType, null);
        }

        public static string ParameterValueForSQL(this DbParameter @this)
        {
            var paramValue = @this.Value;

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

        public static string CommandAsSQL(this DbCommand @this, string providerName = "")
        {
            var sql = new StringBuilder();

            switch (@this.CommandType)
            {
                case CommandType.Text:
                    @this.CommandAsSQL_Text(sql, providerName);
                    break;

                case CommandType.StoredProcedure:
                    @this.CommandAsSQL_StoredProcedure(sql, providerName);
                    break;
            }

            return sql.ToString();
        }

        private static void CommandAsSQL_Text(this DbCommand @this, StringBuilder sql, string providerName)
        {
            var query = @this.CommandText;
            var parameterFlag = "";

            if (providerName.IndexOf("MySql") > -1 || providerName.IndexOf("Oracle") > -1)
            {
                parameterFlag = ":";
            }
            else
            {
                // case "SqlClient":
                // case "Npgsql":
                // case "OleDb":
                // case "Odbc":
                // case "SQLite":
                parameterFlag = "@";
            }

            foreach (DbParameter p in @this.Parameters)
            {
                var parameterName = p.ParameterName.StartsWith("$") == true ? "\\" + p.ParameterName : p.ParameterName;
                query = Regex.Replace(query, "\\B" + parameterFlag + parameterName + "\\b", p.ParameterValueForSQL()); //the first one is \B, the 2nd one is \b, since ParameterName starts with @ which is a non-word character in RegEx (see https://stackoverflow.com/a/2544661)
            }

            sql.AppendLine(query);
        }

        private static void CommandAsSQL_StoredProcedure(this DbCommand @this, StringBuilder sql, string providerName)
        {
            if (providerName.IndexOf("SqlClient") > -1)
            {
                sql.AppendLine("declare @return_value int;");

                foreach (DbParameter sp in @this.Parameters)
                {
                    if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                    {
                        sql.Append("declare ").Append(sp.ParameterName).Append("\t").Append(sp.DbType.ToString()).Append("\t= ");

                        sql.Append((sp.Direction == ParameterDirection.Output) ? "null" : sp.ParameterValueForSQL()).AppendLine(";");
                    }
                }

                sql.Append("exec [").Append(@this.CommandText).AppendLine("]");

                var FirstParam = true;
                foreach (DbParameter param in @this.Parameters)
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

                foreach (DbParameter sp in @this.Parameters)
                {
                    if ((sp.Direction == ParameterDirection.InputOutput) || (sp.Direction == ParameterDirection.Output))
                    {
                        sql.Append("select '").Append(sp.ParameterName).Append("' = convert(varchar, ").Append(sp.ParameterName).AppendLine(");");
                    }
                }
            }
            else
            {
                // 데이터 제공자에 적절한 스토어드 프로시져 작성
            }
        }
        public static string ReplaceCData(string rawText)
        {
            var cdataRegex = new Regex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)");
            var matches = cdataRegex.Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var matchSplit = Regex.Split(match.Value, "(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)");
                    var cdataText = matchSplit[2];
                    cdataText = Regex.Replace(cdataText, "&", "&amp;");
                    cdataText = Regex.Replace(cdataText, "<", "&lt;");
                    cdataText = Regex.Replace(cdataText, ">", "&gt;");
                    cdataText = Regex.Replace(cdataText, "\"", "&quot;");

                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        /*
            var sqlServerMeta = DatabaseExtensions.GetSqlClientMetaSQL(ModuleConfiguration.ModuleBasePath, paths[0], paths[1], paths[2], parseParameters);
            if (sqlServerMeta != null)
            {
                JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                string commandText = sqlServerMeta.Item1;
                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                using (SqlServerClient sqlServerClient = new SqlServerClient(connectionString))
                {
                    switch (returnType)
                    {
                        case ReturnType.NonQuery:
                            result = sqlServerClient.ExecuteNonQuery(commandText, sqlServerMeta.Item2);
                            break;
                        case ReturnType.Scalar:
                            result = sqlServerClient.ExecuteScalar(commandText, sqlServerMeta.Item2);
                            break;
                        case ReturnType.DataSet:
                            result = sqlServerClient.ExecuteDataSet(commandText, sqlServerMeta.Item2);
                            break;
                        case ReturnType.DataReader:
                            result = sqlServerClient.ExecuteReader(commandText, sqlServerMeta.Item2);
                            break;
                        case ReturnType.Dynamic:
                            result = sqlServerClient.ExecuteDynamic(commandText, sqlServerMeta.Item2);
                            break;
                    }
                }
            }
         */
        public static Tuple<string, List<SqlParameter>>? GetSqlClientMetaSQL(string baseDirectoryPath, string applicationID, string projectID, string fileID, string queryID, string? parameters)
        {
            Tuple<string, List<SqlParameter>>? result = null;

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(projectID) == true || string.IsNullOrEmpty(fileID) == true || string.IsNullOrEmpty(queryID) == true)
            {
                return result;
            }

            var filePath = string.Empty;
            if (string.IsNullOrEmpty(baseDirectoryPath) == false)
            {
                filePath = PathExtensions.Combine(baseDirectoryPath, applicationID, projectID, fileID + ".xml");
            }

            if (File.Exists(filePath) == false)
            {
                return result;
            }

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;

            try
            {
                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                var statement = htmlDocument.DocumentNode.SelectSingleNode($"//commands/statement[@id='{queryID}']");

                if (statement != null)
                {
                    var sqlParameters = new List<SqlParameter>();
                    var htmlNodes = statement.SelectNodes("param");
                    if (htmlNodes != null && htmlNodes.Count > 0 && string.IsNullOrEmpty(parameters) == false)
                    {
                        var keyValueParameters = JObject.Parse(parameters);

                        foreach (var paramNode in statement.SelectNodes("param"))
                        {
                            var sqlParameter = new SqlParameter();
                            sqlParameter.ParameterName = paramNode.Attributes["id"].Value.ToString();
                            sqlParameter.Direction = paramNode.Attributes["direction"] == null ? ParameterDirection.Input : ((ParameterDirection)Enum.Parse(typeof(ParameterDirection), paramNode.Attributes["direction"].Value.ToString()));
                            if (paramNode.Attributes["length"] == null)
                            {
                                if (int.TryParse(paramNode.Attributes["length"].Value.ToString(), out var size) == true)
                                {
                                    if (size > 0)
                                    {
                                        sqlParameter.Size = size;
                                    }
                                }
                            }

                            var jValue = keyValueParameters[sqlParameter.ParameterName.Replace("@", "")] as JValue;
                            if (jValue != null)
                            {
                                var parameterValue = jValue.Value;
                                sqlParameter.Value = parameterValue == null ? DBNull.Value : parameterValue.ToString();
                                var parameterType = paramNode.Attributes["type"].Value.ToString();
                                if (statement.Attributes["native"]?.Value.ParseBool() == true)
                                {
                                    sqlParameter.SqlDbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), string.IsNullOrEmpty(parameterType) == true ? "NVarChar" : parameterType);
                                }
                                else
                                {
                                    sqlParameter.DbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(parameterType) == true ? "String" : parameterType);
                                }
                                sqlParameters.Add(sqlParameter);
                            }
                        }
                    }

                    var convertString = statement.InnerText;
                    convertString = Regex.Replace(convertString, "&amp;", "&");
                    convertString = Regex.Replace(convertString, "&lt;", "<");
                    convertString = Regex.Replace(convertString, "&gt;", ">");
                    convertString = Regex.Replace(convertString, "&quot;", "\"");
                    result = new Tuple<string, List<SqlParameter>>(convertString, sqlParameters);
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"filePath: {filePath}, queryID: {queryID} 확인 필요", "DatabaseExtensions/GetDsqlClientTuple");
                throw;
            }

            return result;
        }

        public static Tuple<string, List<SqlParameter>>? GetSqlClientTuple(string filePath, string queryID, string? parameters)
        {
            Tuple<string, List<SqlParameter>>? result = null;

            if (File.Exists(filePath) == false)
            {
                Log.Error("[{LogCategory}] " + $"filePath: {filePath}, queryID: {queryID} 확인 필요", "DatabaseExtensions/GetDsqlClientTuple");
                return result;
            }

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;

            try
            {
                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                var statement = htmlDocument.DocumentNode.SelectSingleNode($"//commands/statement[@id='{queryID}']");

                if (statement != null)
                {
                    var sqlParameters = new List<SqlParameter>();
                    var htmlNodes = statement.SelectNodes("param");
                    if (htmlNodes != null && htmlNodes.Count > 0 && string.IsNullOrEmpty(parameters) == false)
                    {
                        var keyValueParameters = JObject.Parse(parameters);

                        foreach (var paramNode in statement.SelectNodes("param"))
                        {
                            var sqlParameter = new SqlParameter();
                            sqlParameter.ParameterName = paramNode.Attributes["id"].Value.ToString();
                            sqlParameter.Direction = paramNode.Attributes["direction"] == null ? ParameterDirection.Input : ((ParameterDirection)Enum.Parse(typeof(ParameterDirection), paramNode.Attributes["direction"].Value.ToString()));
                            if (paramNode.Attributes["length"] == null)
                            {
                                if (int.TryParse(paramNode.Attributes["length"].Value.ToString(), out var size) == true)
                                {
                                    if (size > 0)
                                    {
                                        sqlParameter.Size = size;
                                    }
                                }
                            }

                            var jValue = keyValueParameters[sqlParameter.ParameterName.Replace("@", "")] as JValue;
                            if (jValue != null)
                            {
                                var parameterValue = jValue.Value;
                                sqlParameter.Value = parameterValue == null ? DBNull.Value : parameterValue.ToString();
                                var parameterType = paramNode.Attributes["type"].Value.ToString();
                                sqlParameter.SqlDbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), string.IsNullOrEmpty(parameterType) == true ? "NVarChar" : parameterType);
                                sqlParameters.Add(sqlParameter);
                            }
                        }
                    }

                    var convertString = statement.InnerText;
                    convertString = Regex.Replace(convertString, "&amp;", "&");
                    convertString = Regex.Replace(convertString, "&lt;", "<");
                    convertString = Regex.Replace(convertString, "&gt;", ">");
                    convertString = Regex.Replace(convertString, "&quot;", "\"");
                    result = new Tuple<string, List<SqlParameter>>(convertString, sqlParameters);
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"filePath: {filePath}, queryID: {queryID} 확인 필요", "DatabaseExtensions/GetDsqlClientTuple");
                throw;
            }

            return result;
        }

        /*
            var mySqlMeta = DatabaseExtensions.GetMySqlMetaSQL(ModuleConfiguration.ModuleBasePath, paths[0], paths[1], paths[2], parseParameters);
            if (mySqlMeta != null)
            {
                JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                string commandText = mySqlMeta.Item1;
                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                using (MySqlClient mySqlClient = new MySqlClient(connectionString))
                {
                    switch (returnType)
                    {
                        case ReturnType.NonQuery:
                            result = mySqlClient.ExecuteNonQuery(commandText, mySqlMeta.Item2);
                            break;
                        case ReturnType.Scalar:
                            result = mySqlClient.ExecuteScalar(commandText, mySqlMeta.Item2);
                            break;
                        case ReturnType.DataSet:
                            result = mySqlClient.ExecuteDataSet(commandText, mySqlMeta.Item2);
                            break;
                        case ReturnType.DataReader:
                            result = mySqlClient.ExecuteReader(commandText, mySqlMeta.Item2);
                            break;
                        case ReturnType.Dynamic:
                            result = mySqlClient.ExecuteDynamic(commandText, mySqlMeta.Item2);
                            break;
                    }
                }
            }
        */
        public static Tuple<string, List<MySqlParameter>>? GetMySqlMetaSQL(string baseDirectoryPath, string applicationID, string projectID, string fileID, string queryID, string? parameters)
        {
            Tuple<string, List<MySqlParameter>>? result = null;

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(projectID) == true || string.IsNullOrEmpty(fileID) == true || string.IsNullOrEmpty(queryID) == true)
            {
                return result;
            }

            var filePath = string.Empty;
            if (string.IsNullOrEmpty(baseDirectoryPath) == false)
            {
                filePath = PathExtensions.Combine(baseDirectoryPath, applicationID, projectID, fileID + ".xml");
            }

            if (File.Exists(filePath) == false)
            {
                return result;
            }

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;

            try
            {
                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                var statement = htmlDocument.DocumentNode.SelectSingleNode($"//commands/statement[@id='{queryID}']");

                if (statement != null)
                {
                    var sqlParameters = new List<MySqlParameter>();
                    var htmlNodes = statement.SelectNodes("param");
                    if (htmlNodes != null && htmlNodes.Count > 0 && string.IsNullOrEmpty(parameters) == false)
                    {
                        var keyValueParameters = JObject.Parse(parameters);

                        foreach (var paramNode in statement.SelectNodes("param"))
                        {
                            var sqlParameter = new MySqlParameter();
                            sqlParameter.ParameterName = paramNode.Attributes["id"].Value.ToString();
                            sqlParameter.Direction = paramNode.Attributes["direction"] == null ? ParameterDirection.Input : ((ParameterDirection)Enum.Parse(typeof(ParameterDirection), paramNode.Attributes["direction"].Value.ToString()));
                            if (paramNode.Attributes["length"] == null)
                            {
                                if (int.TryParse(paramNode.Attributes["length"].Value.ToString(), out var size) == true)
                                {
                                    if (size > 0)
                                    {
                                        sqlParameter.Size = size;
                                    }
                                }
                            }

                            var jValue = keyValueParameters[sqlParameter.ParameterName.Replace("@", "")] as JValue;
                            if (jValue != null)
                            {
                                var parameterValue = jValue.Value;
                                sqlParameter.Value = parameterValue == null ? DBNull.Value : parameterValue.ToString();
                                var parameterType = paramNode.Attributes["type"].Value.ToString();
                                if (statement.Attributes["native"]?.Value.ParseBool() == true)
                                {
                                    sqlParameter.MySqlDbType = (MySqlDbType)Enum.Parse(typeof(MySqlDbType), string.IsNullOrEmpty(parameterType) == true ? "VarChar" : parameterType);
                                }
                                else
                                {
                                    sqlParameter.DbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(parameterType) == true ? "String" : parameterType);
                                }
                                sqlParameters.Add(sqlParameter);
                            }
                        }
                    }

                    var convertString = statement.InnerText;
                    convertString = Regex.Replace(convertString, "&amp;", "&");
                    convertString = Regex.Replace(convertString, "&lt;", "<");
                    convertString = Regex.Replace(convertString, "&gt;", ">");
                    convertString = Regex.Replace(convertString, "&quot;", "\"");
                    result = new Tuple<string, List<MySqlParameter>>(convertString, sqlParameters);
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"fileID: {fileID}, queryID: {queryID} 데이터 확인 필요", "DatabaseExtensions/GetJObject");
                throw;
            }

            return result;
        }

        /*
            var oracleMeta = DatabaseExtensions.GetOracleMetaSQL(ModuleConfiguration.ModuleBasePath, paths[0], paths[1], paths[2], parseParameters);
            if (oracleMeta != null)
            {
                JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                string commandText = oracleMeta.Item1;
                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                using (OracleClient oracleClient = new OracleClient(connectionString))
                {
                    switch (returnType)
                    {
                        case ReturnType.NonQuery:
                            result = oracleClient.ExecuteNonQuery(commandText, oracleMeta.Item2);
                            break;
                        case ReturnType.Scalar:
                            result = oracleClient.ExecuteScalar(commandText, oracleMeta.Item2);
                            break;
                        case ReturnType.DataSet:
                            result = oracleClient.ExecuteDataSet(commandText, oracleMeta.Item2);
                            break;
                        case ReturnType.DataReader:
                            result = oracleClient.ExecuteReader(commandText, oracleMeta.Item2);
                            break;
                        case ReturnType.Dynamic:
                            result = oracleClient.ExecuteDynamic(commandText, oracleMeta.Item2);
                            break;
                    }
                }
            }
        */
        public static Tuple<string, List<OracleParameter>>? GetOracleMetaSQL(string baseDirectoryPath, string applicationID, string projectID, string fileID, string queryID, string? parameters)
        {
            Tuple<string, List<OracleParameter>>? result = null;

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(projectID) == true || string.IsNullOrEmpty(fileID) == true || string.IsNullOrEmpty(queryID) == true)
            {
                return result;
            }

            var filePath = string.Empty;
            if (string.IsNullOrEmpty(baseDirectoryPath) == false)
            {
                filePath = PathExtensions.Combine(baseDirectoryPath, applicationID, projectID, fileID + ".xml");
            }

            if (File.Exists(filePath) == false)
            {
                return result;
            }

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;

            try
            {
                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                var statement = htmlDocument.DocumentNode.SelectSingleNode($"//commands/statement[@id='{queryID}']");

                if (statement != null)
                {
                    var sqlParameters = new List<OracleParameter>();
                    var htmlNodes = statement.SelectNodes("param");
                    if (htmlNodes != null && htmlNodes.Count > 0 && string.IsNullOrEmpty(parameters) == false)
                    {
                        var keyValueParameters = JObject.Parse(parameters);

                        foreach (var paramNode in statement.SelectNodes("param"))
                        {
                            var sqlParameter = new OracleParameter();
                            sqlParameter.ParameterName = paramNode.Attributes["id"].Value.ToString();
                            sqlParameter.Direction = paramNode.Attributes["direction"] == null ? ParameterDirection.Input : ((ParameterDirection)Enum.Parse(typeof(ParameterDirection), paramNode.Attributes["direction"].Value.ToString()));
                            if (paramNode.Attributes["length"] == null)
                            {
                                if (int.TryParse(paramNode.Attributes["length"].Value.ToString(), out var size) == true)
                                {
                                    if (size > 0)
                                    {
                                        sqlParameter.Size = size;
                                    }
                                }
                            }

                            var jValue = keyValueParameters[sqlParameter.ParameterName.Replace("@", "")] as JValue;
                            if (jValue != null)
                            {
                                var parameterValue = jValue.Value;
                                sqlParameter.Value = parameterValue == null ? DBNull.Value : parameterValue.ToString();
                                var parameterType = paramNode.Attributes["type"].Value.ToString();
                                if (statement.Attributes["native"]?.Value.ParseBool() == true)
                                {
                                    sqlParameter.OracleDbType = (OracleDbType)Enum.Parse(typeof(OracleDbType), string.IsNullOrEmpty(parameterType) == true ? "NVarchar2" : parameterType);
                                }
                                else
                                {
                                    sqlParameter.DbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(parameterType) == true ? "String" : parameterType);
                                }
                                sqlParameters.Add(sqlParameter);
                            }
                        }
                    }

                    var convertString = statement.InnerText;
                    convertString = Regex.Replace(convertString, "&amp;", "&");
                    convertString = Regex.Replace(convertString, "&lt;", "<");
                    convertString = Regex.Replace(convertString, "&gt;", ">");
                    convertString = Regex.Replace(convertString, "&quot;", "\"");
                    result = new Tuple<string, List<OracleParameter>>(convertString, sqlParameters);
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"fileID: {fileID}, queryID: {queryID} 데이터 확인 필요", "DatabaseExtensions/GetJObject");
                throw;
            }

            return result;
        }

        /*
            var postgreSqlMeta = DatabaseExtensions.GetPostreSqlMetaSQL(ModuleConfiguration.ModuleBasePath, paths[0], paths[1], paths[2], parseParameters);
            if (postgreSqlMeta != null)
            {
                JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                string commandText = postgreSqlMeta.Item1;
                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                using (PostgreSqlClient postgreSqlClient = new PostgreSqlClient(connectionString))
                {
                    switch (returnType)
                    {
                        case ReturnType.NonQuery:
                            result = postgreSqlClient.ExecuteNonQuery(commandText, postgreSqlMeta.Item2);
                            break;
                        case ReturnType.Scalar:
                            result = postgreSqlClient.ExecuteScalar(commandText, postgreSqlMeta.Item2);
                            break;
                        case ReturnType.DataSet:
                            result = postgreSqlClient.ExecuteDataSet(commandText, postgreSqlMeta.Item2);
                            break;
                        case ReturnType.DataReader:
                            result = postgreSqlClient.ExecuteReader(commandText, postgreSqlMeta.Item2);
                            break;
                        case ReturnType.Dynamic:
                            result = postgreSqlClient.ExecuteDynamic(commandText, postgreSqlMeta.Item2);
                            break;
                    }
                }
            }
        */
        public static Tuple<string, List<NpgsqlParameter>>? GetPostreSqlMetaSQL(string baseDirectoryPath, string applicationID, string projectID, string fileID, string queryID, string? parameters)
        {
            Tuple<string, List<NpgsqlParameter>>? result = null;

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(projectID) == true || string.IsNullOrEmpty(fileID) == true || string.IsNullOrEmpty(queryID) == true)
            {
                return result;
            }

            var filePath = string.Empty;
            if (string.IsNullOrEmpty(baseDirectoryPath) == false)
            {
                filePath = PathExtensions.Combine(baseDirectoryPath, applicationID, projectID, fileID + ".xml");
            }

            if (File.Exists(filePath) == false)
            {
                return result;
            }

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;

            try
            {
                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                var statement = htmlDocument.DocumentNode.SelectSingleNode($"//commands/statement[@id='{queryID}']");

                if (statement != null)
                {
                    var sqlParameters = new List<NpgsqlParameter>();
                    var htmlNodes = statement.SelectNodes("param");
                    if (htmlNodes != null && htmlNodes.Count > 0 && string.IsNullOrEmpty(parameters) == false)
                    {
                        var keyValueParameters = JObject.Parse(parameters);

                        foreach (var paramNode in statement.SelectNodes("param"))
                        {
                            var sqlParameter = new NpgsqlParameter();
                            sqlParameter.ParameterName = paramNode.Attributes["id"].Value.ToString();
                            sqlParameter.Direction = paramNode.Attributes["direction"] == null ? ParameterDirection.Input : ((ParameterDirection)Enum.Parse(typeof(ParameterDirection), paramNode.Attributes["direction"].Value.ToString()));
                            if (paramNode.Attributes["length"] == null)
                            {
                                if (int.TryParse(paramNode.Attributes["length"].Value.ToString(), out var size) == true)
                                {
                                    if (size > 0)
                                    {
                                        sqlParameter.Size = size;
                                    }
                                }
                            }

                            var jValue = keyValueParameters[sqlParameter.ParameterName.Replace("@", "")] as JValue;
                            if (jValue != null)
                            {
                                var parameterValue = jValue.Value;
                                sqlParameter.Value = parameterValue == null ? DBNull.Value : parameterValue.ToString();
                                var parameterType = paramNode.Attributes["type"].Value.ToString();
                                if (statement.Attributes["native"]?.Value.ParseBool() == true)
                                {
                                    sqlParameter.NpgsqlDbType = (NpgsqlDbType)Enum.Parse(typeof(NpgsqlDbType), string.IsNullOrEmpty(parameterType) == true ? "Char" : parameterType);
                                }
                                else
                                {
                                    sqlParameter.DbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(parameterType) == true ? "String" : parameterType);
                                }
                                sqlParameters.Add(sqlParameter);
                            }
                        }
                    }

                    var convertString = statement.InnerText;
                    convertString = Regex.Replace(convertString, "&amp;", "&");
                    convertString = Regex.Replace(convertString, "&lt;", "<");
                    convertString = Regex.Replace(convertString, "&gt;", ">");
                    convertString = Regex.Replace(convertString, "&quot;", "\"");
                    result = new Tuple<string, List<NpgsqlParameter>>(convertString, sqlParameters);
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"fileID: {fileID}, queryID: {queryID} 데이터 확인 필요", "DatabaseExtensions/GetJObject");
                throw;
            }

            return result;
        }

        /*
            var sqliteMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.ModuleBasePath, paths[0], paths[1], paths[2], parseParameters);
            if (sqliteMeta != null)
            {
                JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                string commandText = sqliteMeta.Item1;
                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                using (SQLiteClient sqlLiteClient = new SQLiteClient(connectionString))
                {
                    switch (returnType)
                    {
                        case ReturnType.NonQuery:
                            result = sqlLiteClient.ExecuteNonQuery(commandText, sqliteMeta.Item2);
                            break;
                        case ReturnType.Scalar:
                            result = sqlLiteClient.ExecuteScalar(commandText, sqliteMeta.Item2);
                            break;
                        case ReturnType.DataSet:
                            result = sqlLiteClient.ExecuteDataSet(commandText, sqliteMeta.Item2);
                            break;
                        case ReturnType.DataReader:
                            result = sqlLiteClient.ExecuteReader(commandText, sqliteMeta.Item2);
                            break;
                        case ReturnType.Dynamic:
                            result = sqlLiteClient.ExecuteDynamic(commandText, sqliteMeta.Item2);
                            break;
                    }
                }
            }
        */
        public static Tuple<string, List<SQLiteParameter>>? GetSQLiteMetaSQL(string baseDirectoryPath, string applicationID, string projectID, string fileID, string queryID, string? parameters)
        {
            Tuple<string, List<SQLiteParameter>>? result = null;

            if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(projectID) == true || string.IsNullOrEmpty(fileID) == true || string.IsNullOrEmpty(queryID) == true)
            {
                return result;
            }

            var filePath = string.Empty;
            if (string.IsNullOrEmpty(baseDirectoryPath) == false)
            {
                filePath = PathExtensions.Combine(baseDirectoryPath, applicationID, projectID, fileID + ".xml");
            }

            if (File.Exists(filePath) == false)
            {
                return result;
            }

            result = GetSQLiteMetaSQL(filePath, queryID, parameters);

            return result;
        }

        public static Tuple<string, List<SQLiteParameter>>? GetSQLiteMetaSQL(string filePath, string queryID, string? parameters)
        {
            Tuple<string, List<SQLiteParameter>>? result = null;

            if (File.Exists(filePath) == false || string.IsNullOrEmpty(queryID) == true)
            {
                return result;
            }

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;

            try
            {
                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                var statement = htmlDocument.DocumentNode.SelectSingleNode($"//commands/statement[@id='{queryID}']");

                if (statement != null)
                {
                    var sqlParameters = new List<SQLiteParameter>();
                    var htmlNodes = statement.SelectNodes("param");
                    if (htmlNodes != null && htmlNodes.Count > 0 && string.IsNullOrEmpty(parameters) == false)
                    {
                        var keyValueParameters = JObject.Parse(parameters);

                        foreach (var paramNode in statement.SelectNodes("param"))
                        {
                            var sqlParameter = new SQLiteParameter();
                            sqlParameter.ParameterName = paramNode.Attributes["id"].Value.ToString();
                            sqlParameter.Direction = paramNode.Attributes["direction"] == null ? ParameterDirection.Input : ((ParameterDirection)Enum.Parse(typeof(ParameterDirection), paramNode.Attributes["direction"].Value.ToString()));
                            if (paramNode.Attributes["length"] == null)
                            {
                                if (int.TryParse(paramNode.Attributes["length"].Value.ToString(), out var size) == true)
                                {
                                    if (size > 0)
                                    {
                                        sqlParameter.Size = size;
                                    }
                                }
                            }

                            var jValue = keyValueParameters[sqlParameter.ParameterName.Replace("@", "")] as JValue;
                            if (jValue != null)
                            {
                                var parameterValue = jValue.Value;
                                sqlParameter.Value = parameterValue == null ? DBNull.Value : parameterValue.ToString();
                                var parameterType = paramNode.Attributes["type"].Value.ToString();
                                sqlParameter.DbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(parameterType) == true ? "String" : parameterType);
                                sqlParameters.Add(sqlParameter);
                            }
                        }
                    }

                    var convertString = statement.InnerText;
                    convertString = Regex.Replace(convertString, "&amp;", "&");
                    convertString = Regex.Replace(convertString, "&lt;", "<");
                    convertString = Regex.Replace(convertString, "&gt;", ">");
                    convertString = Regex.Replace(convertString, "&quot;", "\"");
                    result = new Tuple<string, List<SQLiteParameter>>(convertString, sqlParameters);
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"filePath: {filePath}, queryID: {queryID} 데이터 확인 필요", "DatabaseExtensions/GetJObject");
                throw;
            }

            return result;
        }
    }
}
