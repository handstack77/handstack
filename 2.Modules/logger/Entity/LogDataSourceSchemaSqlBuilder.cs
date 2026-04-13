using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

using Dapper;

using HandStack.Data;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace logger.Entity
{
    public class DynamicLogValidationException : Exception
    {
        public DynamicLogValidationException(string message)
            : base(message)
        {
        }
    }

    internal sealed class LogSchemaCommand
    {
        public LogSchemaCommand(string commandText, DynamicParameters parameters)
        {
            CommandText = commandText;
            Parameters = parameters;
        }

        public string CommandText { get; }

        public DynamicParameters Parameters { get; }
    }

    internal static class LogDataSourceSchemaSqlBuilder
    {
        private static readonly Dictionary<string, PropertyInfo> LogMessageProperties = typeof(LogMessage)
            .GetProperties(BindingFlags.Instance | BindingFlags.Public)
            .ToDictionary(property => property.Name, property => property, StringComparer.OrdinalIgnoreCase);

        private static readonly Regex SafeNameRegex = new Regex("[^A-Za-z0-9_]+", RegexOptions.Compiled);

        public static LogSchemaCommand BuildInsert(DataSource dataSource, DataProviders dataProvider, LogMessage request, IReadOnlyDictionary<string, object?>? extraPayload)
        {
            var columns = GetColumns(dataSource).Where(column => IsIdentityColumn(dataSource, column) == false).ToList();
            if (columns.Count == 0)
            {
                throw new DynamicLogValidationException($"ApplicationID: {dataSource.ApplicationID} Schema.Columns 확인 필요");
            }

            var parameters = new DynamicParameters();
            var parameterPrefix = GetParameterPrefix(dataProvider);
            var insertColumns = new List<string>();
            var insertParameters = new List<string>();

            for (var i = 0; i < columns.Count; i++)
            {
                var column = columns[i];
                var parameterName = $"p{i}";
                var value = ResolveColumnValue(dataSource, column, request, extraPayload);

                insertColumns.Add(QuoteIdentifier(column.ColumnName, dataProvider));
                insertParameters.Add($"{parameterPrefix}{parameterName}");
                parameters.Add(parameterName, value, GetDbType(column), ParameterDirection.Input);
            }

            var commandText = $@"INSERT INTO {QuoteTableName(dataSource.TableName, dataProvider)}
(
    {string.Join($",{Environment.NewLine}    ", insertColumns)}
)
VALUES
(
    {string.Join($",{Environment.NewLine}    ", insertParameters)}
);";

            return new LogSchemaCommand(commandText, parameters);
        }

        public static LogSchemaCommand BuildList(DataSource dataSource, DataProviders dataProvider, string? serverID, string? globalID, string? environment, string? projectID, string? serviceID, string? transactionID, string? startedAt, string? endedAt)
        {
            var columns = GetColumns(dataSource).ToList();
            if (columns.Count == 0)
            {
                throw new DynamicLogValidationException($"ApplicationID: {dataSource.ApplicationID} Schema.Columns 확인 필요");
            }

            var parameters = new DynamicParameters();
            var selectColumns = columns
                .Select(column => $"TL.{QuoteIdentifier(column.ColumnName, dataProvider)} AS {QuoteIdentifier(column.ColumnName, dataProvider)}")
                .ToList();
            var where = new List<string>();

            AddEqualsFilter(dataSource, dataProvider, parameters, where, dataSource.Schema?.Roles.ServerID, "ServerID", serverID);
            AddEqualsFilter(dataSource, dataProvider, parameters, where, dataSource.Schema?.Roles.GlobalID, "GlobalID", globalID);
            AddEqualsFilter(dataSource, dataProvider, parameters, where, dataSource.Schema?.Roles.Environment, "Environment", environment);
            AddEqualsFilter(dataSource, dataProvider, parameters, where, dataSource.Schema?.Roles.ProjectID, "ProjectID", projectID);
            AddEqualsFilter(dataSource, dataProvider, parameters, where, dataSource.Schema?.Roles.ServiceID, "ServiceID", serviceID);
            AddEqualsFilter(dataSource, dataProvider, parameters, where, dataSource.Schema?.Roles.TransactionID, "TransactionID", transactionID);
            AddDateFilter(dataSource, dataProvider, parameters, where, startedAt, endedAt);

            var orderColumn = FindRoleColumn(dataSource, dataSource.Schema?.Roles.PrimaryKey)
                ?? FindRoleColumn(dataSource, dataSource.Schema?.Roles.CreatedAt)
                ?? columns[0];
            var topClause = dataProvider == DataProviders.SqlServer ? " TOP 500" : string.Empty;
            var limitClause = GetLimitClause(dataProvider);
            var whereClause = where.Count > 0 ? $"{Environment.NewLine}WHERE {string.Join($"{Environment.NewLine}    AND ", where)}" : string.Empty;
            var commandText = $@"SELECT{topClause}
    {string.Join($",{Environment.NewLine}    ", selectColumns)}
FROM
    {QuoteTableName(dataSource.TableName, dataProvider)} TL{whereClause}
ORDER BY TL.{QuoteIdentifier(orderColumn.ColumnName, dataProvider)} DESC{limitClause};";

            return new LogSchemaCommand(commandText, parameters);
        }

        public static LogSchemaCommand BuildDetail(DataSource dataSource, DataProviders dataProvider, string logNo)
        {
            var primaryKeyColumn = FindRoleColumn(dataSource, dataSource.Schema?.Roles.PrimaryKey);
            if (primaryKeyColumn == null)
            {
                throw new DynamicLogValidationException($"ApplicationID: {dataSource.ApplicationID} Schema.Roles.PrimaryKey 확인 필요");
            }

            var parameters = new DynamicParameters();
            var parameterPrefix = GetParameterPrefix(dataProvider);
            var selectColumns = GetColumns(dataSource)
                .Select(column => $"TL.{QuoteIdentifier(column.ColumnName, dataProvider)} AS {QuoteIdentifier(column.ColumnName, dataProvider)}")
                .ToList();
            var value = ConvertValue(logNo, primaryKeyColumn);

            parameters.Add("LogNo", value, GetDbType(primaryKeyColumn), ParameterDirection.Input);

            var commandText = $@"SELECT
    {string.Join($",{Environment.NewLine}    ", selectColumns)}
FROM
    {QuoteTableName(dataSource.TableName, dataProvider)} TL
WHERE
    TL.{QuoteIdentifier(primaryKeyColumn.ColumnName, dataProvider)} = {parameterPrefix}LogNo;";

            return new LogSchemaCommand(commandText, parameters);
        }

        public static string? BuildDelete(DataSource dataSource, DataProviders dataProvider)
        {
            var createdAtColumn = FindRoleColumn(dataSource, dataSource.Schema?.Roles.CreatedAt);
            if (createdAtColumn == null)
            {
                return null;
            }

            var tableName = QuoteTableName(dataSource.TableName, dataProvider);
            var createdAt = QuoteIdentifier(createdAtColumn.ColumnName, dataProvider);
            var removePeriod = dataSource.RemovePeriod.ToString(CultureInfo.InvariantCulture);

            return dataProvider switch
            {
                DataProviders.SqlServer => $"DELETE FROM {tableName} WHERE DATEADD(d, {removePeriod}, GETDATE()) > {createdAt};",
                DataProviders.Oracle => $"DELETE FROM {tableName} WHERE (SYSDATE + ({removePeriod})) > {createdAt}",
                DataProviders.MySQL => $"DELETE FROM {tableName} WHERE DATE_ADD(NOW(), INTERVAL {removePeriod} DAY) > {createdAt};",
                DataProviders.PostgreSQL => $"DELETE FROM {tableName} WHERE (NOW() + INTERVAL '{removePeriod} days') > {createdAt};",
                DataProviders.SQLite => $"DELETE FROM {tableName} WHERE DATETIME(DATETIME('now', 'localtime'), '{removePeriod} days') > DATETIME({createdAt});",
                _ => null
            };
        }

        public static string BuildCreateTable(DataSource dataSource, DataProviders dataProvider)
        {
            var columns = GetColumns(dataSource).ToList();
            if (columns.Count == 0)
            {
                throw new DynamicLogValidationException($"ApplicationID: {dataSource.ApplicationID} Schema.Columns 확인 필요");
            }

            var primaryKeyColumn = FindRoleColumn(dataSource, dataSource.Schema?.Roles.PrimaryKey);
            var primaryKeyIsSqliteIdentity = primaryKeyColumn != null &&
                dataProvider == DataProviders.SQLite &&
                IsIdentityColumn(dataSource, primaryKeyColumn) == true &&
                IsIntegerType(primaryKeyColumn) == true;
            var definitions = new List<string>();

            foreach (var column in columns)
            {
                var isPrimaryKey = primaryKeyColumn != null && string.Equals(column.ColumnName, primaryKeyColumn.ColumnName, StringComparison.OrdinalIgnoreCase);
                var isIdentity = IsIdentityColumn(dataSource, column);
                definitions.Add(BuildColumnDefinition(dataProvider, column, isPrimaryKey, isIdentity));
            }

            if (primaryKeyColumn != null && primaryKeyIsSqliteIdentity == false)
            {
                definitions.Add($"CONSTRAINT {QuoteIdentifier(BuildObjectName("PK", dataSource.TableName, string.Empty), dataProvider)} PRIMARY KEY ({QuoteIdentifier(primaryKeyColumn.ColumnName, dataProvider)})");
            }

            var tableName = QuoteTableName(dataSource.TableName, dataProvider);
            var createTable = $@"CREATE TABLE {tableName} (
    {string.Join($",{Environment.NewLine}    ", definitions)}
)";
            var statements = new List<string>
            {
                createTable
            };

            AddIndexStatement(statements, dataSource, dataProvider, dataSource.Schema?.Roles.GlobalID, "GlobalID");
            AddIndexStatement(statements, dataSource, dataProvider, dataSource.Schema?.Roles.CreatedAt, "CreatedAt");

            if (dataProvider == DataProviders.Oracle)
            {
                return BuildOracleBlock(statements);
            }

            return string.Join($";{Environment.NewLine}{Environment.NewLine}", statements) + ";";
        }

        private static void AddEqualsFilter(DataSource dataSource, DataProviders dataProvider, DynamicParameters parameters, List<string> where, string? roleColumnName, string parameterName, string? value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return;
            }

            var column = FindRoleColumn(dataSource, roleColumnName);
            if (column == null)
            {
                return;
            }

            parameters.Add(parameterName, ConvertValue(value, column), GetDbType(column), ParameterDirection.Input);
            where.Add($"TL.{QuoteIdentifier(column.ColumnName, dataProvider)} = {GetParameterPrefix(dataProvider)}{parameterName}");
        }

        private static void AddDateFilter(DataSource dataSource, DataProviders dataProvider, DynamicParameters parameters, List<string> where, string? startedAt, string? endedAt)
        {
            var column = FindRoleColumn(dataSource, dataSource.Schema?.Roles.CreatedAt);
            if (column == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(startedAt) == false)
            {
                parameters.Add("StartedAt", ConvertValue(startedAt, column), GetDbType(column), ParameterDirection.Input);
                where.Add($"TL.{QuoteIdentifier(column.ColumnName, dataProvider)} >= {GetParameterPrefix(dataProvider)}StartedAt");
            }

            if (string.IsNullOrWhiteSpace(endedAt) == false)
            {
                parameters.Add("EndedAt", ConvertValue(endedAt, column), GetDbType(column), ParameterDirection.Input);
                where.Add($"TL.{QuoteIdentifier(column.ColumnName, dataProvider)} <= {GetParameterPrefix(dataProvider)}EndedAt");
            }
        }

        private static object? ResolveColumnValue(DataSource dataSource, LogDataSourceColumn column, LogMessage request, IReadOnlyDictionary<string, object?>? extraPayload)
        {
            var sourceKey = string.IsNullOrWhiteSpace(column.SourceKey) == true ? column.ColumnName : column.SourceKey;
            var sourceType = column.SourceType.Trim();
            object? value;

            if (string.IsNullOrWhiteSpace(sourceType) == true)
            {
                sourceType = LogMessageProperties.ContainsKey(sourceKey) == true ? "LogMessage" : "Payload";
            }

            switch (sourceType.ToUpperInvariant())
            {
                case "LOGMESSAGE":
                    value = GetLogMessageValue(request, sourceKey);
                    break;
                case "PAYLOAD":
                    value = GetPayloadValue(extraPayload, sourceKey);
                    break;
                case "SYSTEM":
                    value = GetSystemValue(sourceKey);
                    break;
                case "CONSTANT":
                    value = column.DefaultValue ?? sourceKey;
                    break;
                default:
                    throw new DynamicLogValidationException($"컬럼 '{column.ColumnName}' SourceType '{column.SourceType}' 확인 필요");
            }

            if (IsMissing(value) == true && column.DefaultValue != null && sourceType.Equals("CONSTANT", StringComparison.OrdinalIgnoreCase) == false)
            {
                value = column.DefaultValue;
            }

            if (IsMissing(value) == true && IsCreatedAtColumn(dataSource, column, sourceKey) == true)
            {
                value = DateTime.Now;
            }

            if ((column.Required == true || column.Nullable == false) && IsMissing(value) == true)
            {
                throw new DynamicLogValidationException($"필수 로그 컬럼 누락: {column.ColumnName}");
            }

            if (IsMissing(value) == true)
            {
                return null;
            }

            return ConvertValue(value, column);
        }

        private static object? GetLogMessageValue(LogMessage request, string sourceKey)
        {
            if (LogMessageProperties.TryGetValue(sourceKey, out var property) == false)
            {
                return null;
            }

            return property.GetValue(request);
        }

        private static object? GetPayloadValue(IReadOnlyDictionary<string, object?>? extraPayload, string sourceKey)
        {
            if (extraPayload == null)
            {
                return null;
            }

            return extraPayload.TryGetValue(sourceKey, out var value) == true ? value : null;
        }

        private static object? GetSystemValue(string sourceKey)
        {
            return sourceKey.ToUpperInvariant() switch
            {
                "NOWUTC" => DateTime.UtcNow,
                "UTCNOW" => DateTime.UtcNow,
                "NOWLOCAL" => DateTime.Now,
                "LOCALNOW" => DateTime.Now,
                "NOW" => DateTime.Now,
                "MACHINENAME" => Environment.MachineName,
                _ => null
            };
        }

        private static object? ConvertValue(object? value, LogDataSourceColumn column)
        {
            if (value == null || value == DBNull.Value)
            {
                return null;
            }

            if (value is JValue jsonValue)
            {
                value = jsonValue.Value;
            }
            else if (value is JToken token)
            {
                return token.Type == JTokenType.Null ? null : token.ToString(Formatting.None);
            }

            if (value == null)
            {
                return null;
            }

            var logicalType = NormalizeLogicalType(column.LogicalType);
            var text = Convert.ToString(value, CultureInfo.InvariantCulture);

            try
            {
                return logicalType switch
                {
                    "string" or "text" or "json" => value is DateTime dateTime
                        ? dateTime.ToString("yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture)
                        : text,
                    "int" => value is int intValue ? intValue : int.Parse(text ?? string.Empty, NumberStyles.Integer, CultureInfo.InvariantCulture),
                    "long" => value is long longValue ? longValue : long.Parse(text ?? string.Empty, NumberStyles.Integer, CultureInfo.InvariantCulture),
                    "decimal" => value is decimal decimalValue ? decimalValue : decimal.Parse(text ?? string.Empty, NumberStyles.Number, CultureInfo.InvariantCulture),
                    "double" => value is double doubleValue ? doubleValue : double.Parse(text ?? string.Empty, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture),
                    "bool" => ConvertBoolean(value, text),
                    "datetime" => value is DateTime dateTimeValue ? dateTimeValue : DateTime.Parse(text ?? string.Empty, CultureInfo.InvariantCulture),
                    "date" => value is DateTime dateValue ? dateValue.Date : DateTime.Parse(text ?? string.Empty, CultureInfo.InvariantCulture).Date,
                    "guid" => value is Guid guidValue ? guidValue.ToString() : Guid.Parse(text ?? string.Empty).ToString(),
                    "binary" => value is byte[] byteValue ? byteValue : Convert.FromBase64String(text ?? string.Empty),
                    _ => text
                };
            }
            catch (Exception exception) when (exception is FormatException || exception is InvalidCastException || exception is OverflowException || exception is ArgumentException)
            {
                throw new DynamicLogValidationException($"컬럼 '{column.ColumnName}' 값 변환 오류: {text}");
            }
        }

        private static object ConvertBoolean(object value, string? text)
        {
            if (value is bool boolValue)
            {
                return boolValue;
            }

            if (string.Equals(text, "1", StringComparison.OrdinalIgnoreCase) == true || string.Equals(text, "Y", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }

            if (string.Equals(text, "0", StringComparison.OrdinalIgnoreCase) == true || string.Equals(text, "N", StringComparison.OrdinalIgnoreCase) == true)
            {
                return false;
            }

            return bool.Parse(text ?? string.Empty);
        }

        private static bool IsMissing(object? value)
        {
            return value == null || value == DBNull.Value || (value is string text && string.IsNullOrWhiteSpace(text) == true);
        }

        private static bool IsCreatedAtColumn(DataSource dataSource, LogDataSourceColumn column, string sourceKey)
        {
            return string.Equals(column.ColumnName, dataSource.Schema?.Roles.CreatedAt, StringComparison.OrdinalIgnoreCase) == true ||
                string.Equals(sourceKey, "CreatedAt", StringComparison.OrdinalIgnoreCase) == true;
        }

        private static DbType GetDbType(LogDataSourceColumn column)
        {
            return NormalizeLogicalType(column.LogicalType) switch
            {
                "int" => DbType.Int32,
                "long" => DbType.Int64,
                "decimal" => DbType.Decimal,
                "double" => DbType.Double,
                "bool" => DbType.Boolean,
                "datetime" => DbType.DateTime,
                "date" => DbType.Date,
                "binary" => DbType.Binary,
                _ => DbType.String
            };
        }

        private static string BuildColumnDefinition(DataProviders dataProvider, LogDataSourceColumn column, bool isPrimaryKey, bool isIdentity)
        {
            var columnName = QuoteIdentifier(column.ColumnName, dataProvider);
            if (dataProvider == DataProviders.SQLite && isPrimaryKey == true && isIdentity == true && IsIntegerType(column) == true)
            {
                return $"{columnName} INTEGER PRIMARY KEY AUTOINCREMENT";
            }

            var nullable = (isPrimaryKey == true || isIdentity == true || column.Nullable == false || column.Required == true) ? " NOT NULL" : " NULL";
            return $"{columnName} {MapColumnType(dataProvider, column, isIdentity)}{nullable}";
        }

        private static string MapColumnType(DataProviders dataProvider, LogDataSourceColumn column, bool isIdentity)
        {
            var logicalType = NormalizeLogicalType(column.LogicalType);
            return dataProvider switch
            {
                DataProviders.SqlServer => MapSqlServerType(column, logicalType, isIdentity),
                DataProviders.Oracle => MapOracleType(column, logicalType, isIdentity),
                DataProviders.MySQL => MapMySqlType(column, logicalType, isIdentity),
                DataProviders.PostgreSQL => MapPostgreSqlType(column, logicalType, isIdentity),
                DataProviders.SQLite => MapSqliteType(column, logicalType),
                _ => "nvarchar(255)"
            };
        }

        private static string MapSqlServerType(LogDataSourceColumn column, string logicalType, bool isIdentity)
        {
            return logicalType switch
            {
                "int" => isIdentity ? "int IDENTITY(1,1)" : "int",
                "long" => isIdentity ? "bigint IDENTITY(1,1)" : "bigint",
                "decimal" => $"decimal({column.Precision ?? 18},{column.Scale ?? 4})",
                "double" => "float",
                "bool" => "bit",
                "datetime" => "datetime2",
                "date" => "date",
                "text" or "json" => "nvarchar(max)",
                "binary" => "varbinary(max)",
                "guid" => "uniqueidentifier",
                _ => BuildStringType("nvarchar", column.Length, 4000, "nvarchar(max)")
            };
        }

        private static string MapOracleType(LogDataSourceColumn column, string logicalType, bool isIdentity)
        {
            return logicalType switch
            {
                "int" => isIdentity ? "NUMBER(10,0) GENERATED BY DEFAULT ON NULL AS IDENTITY" : "NUMBER(10,0)",
                "long" => isIdentity ? "NUMBER(19,0) GENERATED BY DEFAULT ON NULL AS IDENTITY" : "NUMBER(19,0)",
                "decimal" => $"NUMBER({column.Precision ?? 18},{column.Scale ?? 4})",
                "double" => "BINARY_DOUBLE",
                "bool" => "NUMBER(1,0)",
                "datetime" => "TIMESTAMP",
                "date" => "DATE",
                "text" or "json" => "NCLOB",
                "binary" => "BLOB",
                "guid" => "NVARCHAR2(36)",
                _ => BuildStringType("NVARCHAR2", column.Length, 2000, "NCLOB")
            };
        }

        private static string MapMySqlType(LogDataSourceColumn column, string logicalType, bool isIdentity)
        {
            return logicalType switch
            {
                "int" => isIdentity ? "int AUTO_INCREMENT" : "int",
                "long" => isIdentity ? "bigint AUTO_INCREMENT" : "bigint",
                "decimal" => $"decimal({column.Precision ?? 18},{column.Scale ?? 4})",
                "double" => "double",
                "bool" => "tinyint(1)",
                "datetime" => "datetime(6)",
                "date" => "date",
                "text" or "json" => "longtext",
                "binary" => "longblob",
                "guid" => "char(36)",
                _ => BuildStringType("varchar", column.Length, 16383, "longtext")
            };
        }

        private static string MapPostgreSqlType(LogDataSourceColumn column, string logicalType, bool isIdentity)
        {
            return logicalType switch
            {
                "int" => isIdentity ? "integer GENERATED BY DEFAULT AS IDENTITY" : "integer",
                "long" => isIdentity ? "bigint GENERATED BY DEFAULT AS IDENTITY" : "bigint",
                "decimal" => $"numeric({column.Precision ?? 18},{column.Scale ?? 4})",
                "double" => "double precision",
                "bool" => "boolean",
                "datetime" => "timestamp without time zone",
                "date" => "date",
                "text" or "json" => "text",
                "binary" => "bytea",
                "guid" => "uuid",
                _ => BuildStringType("character varying", column.Length, 10485760, "text")
            };
        }

        private static string MapSqliteType(LogDataSourceColumn column, string logicalType)
        {
            return logicalType switch
            {
                "int" or "long" or "bool" => "INTEGER",
                "decimal" or "double" => "REAL",
                "datetime" => "DATETIME",
                "date" => "DATE",
                "binary" => "BLOB",
                _ => "TEXT"
            };
        }

        private static string BuildStringType(string dbType, int? length, int maxLength, string fallback)
        {
            if (length.HasValue == false)
            {
                return $"{dbType}(255)";
            }

            if (length.Value <= 0 || length.Value > maxLength)
            {
                return fallback;
            }

            return $"{dbType}({length.Value.ToString(CultureInfo.InvariantCulture)})";
        }

        private static void AddIndexStatement(List<string> statements, DataSource dataSource, DataProviders dataProvider, string? roleColumnName, string roleName)
        {
            var column = FindRoleColumn(dataSource, roleColumnName);
            var primaryKeyColumn = FindRoleColumn(dataSource, dataSource.Schema?.Roles.PrimaryKey);
            if (column == null || (primaryKeyColumn != null && string.Equals(column.ColumnName, primaryKeyColumn.ColumnName, StringComparison.OrdinalIgnoreCase) == true))
            {
                return;
            }

            var indexName = QuoteIdentifier(BuildObjectName("IX", dataSource.TableName, roleName), dataProvider);
            statements.Add($"CREATE INDEX {indexName} ON {QuoteTableName(dataSource.TableName, dataProvider)} ({QuoteIdentifier(column.ColumnName, dataProvider)})");
        }

        private static string BuildOracleBlock(IEnumerable<string> statements)
        {
            var builder = new StringBuilder();
            builder.AppendLine("BEGIN");
            foreach (var statement in statements)
            {
                builder.Append("    EXECUTE IMMEDIATE '");
                builder.Append(statement.Replace("'", "''"));
                builder.AppendLine("';");
            }
            builder.Append("END;");
            return builder.ToString();
        }

        private static IEnumerable<LogDataSourceColumn> GetColumns(DataSource dataSource)
        {
            return dataSource.Schema?.Columns?
                .Where(column => column != null && string.IsNullOrWhiteSpace(column.ColumnName) == false)
                ?? Enumerable.Empty<LogDataSourceColumn>();
        }

        private static LogDataSourceColumn? FindRoleColumn(DataSource dataSource, string? roleColumnName)
        {
            if (string.IsNullOrWhiteSpace(roleColumnName) == true)
            {
                return null;
            }

            return GetColumns(dataSource).FirstOrDefault(column => string.Equals(column.ColumnName, roleColumnName, StringComparison.OrdinalIgnoreCase));
        }

        private static bool IsIdentityColumn(DataSource dataSource, LogDataSourceColumn column)
        {
            if (column.IsIdentity.HasValue == true)
            {
                return column.IsIdentity.Value;
            }

            return string.Equals(dataSource.Schema?.Roles.PrimaryKey, column.ColumnName, StringComparison.OrdinalIgnoreCase) == true &&
                IsIntegerType(column) == true &&
                string.IsNullOrWhiteSpace(column.SourceType) == true &&
                string.IsNullOrWhiteSpace(column.SourceKey) == true &&
                column.DefaultValue == null;
        }

        private static bool IsIntegerType(LogDataSourceColumn column)
        {
            var logicalType = NormalizeLogicalType(column.LogicalType);
            return logicalType == "int" || logicalType == "long";
        }

        private static string NormalizeLogicalType(string? logicalType)
        {
            return (logicalType ?? string.Empty).Trim().ToUpperInvariant() switch
            {
                "INTEGER" => "int",
                "INT32" => "int",
                "INT" => "int",
                "LONG" => "long",
                "INT64" => "long",
                "BIGINT" => "long",
                "DECIMAL" => "decimal",
                "NUMERIC" => "decimal",
                "NUMBER" => "decimal",
                "DOUBLE" => "double",
                "FLOAT" => "double",
                "REAL" => "double",
                "BOOLEAN" => "bool",
                "BOOL" => "bool",
                "DATETIME" => "datetime",
                "TIMESTAMP" => "datetime",
                "DATE" => "date",
                "TEXT" => "text",
                "LONGTEXT" => "text",
                "JSON" => "json",
                "GUID" => "guid",
                "UUID" => "guid",
                "BINARY" => "binary",
                "BYTES" => "binary",
                _ => "string"
            };
        }

        private static string QuoteTableName(string tableName, DataProviders dataProvider)
        {
            return string.Join(".", tableName.Split('.', StringSplitOptions.RemoveEmptyEntries).Select(part => QuoteIdentifier(part, dataProvider)));
        }

        private static string QuoteIdentifier(string identifier, DataProviders dataProvider)
        {
            return dataProvider switch
            {
                DataProviders.SqlServer => $"[{identifier.Replace("]", "]]")}]",
                DataProviders.MySQL => $"`{identifier.Replace("`", "``")}`",
                _ => $"\"{identifier.Replace("\"", "\"\"")}\""
            };
        }

        private static string BuildObjectName(string prefix, string tableName, string suffix)
        {
            var rawName = string.IsNullOrWhiteSpace(suffix) == true ? $"{prefix}_{tableName}" : $"{prefix}_{tableName}_{suffix}";
            var name = SafeNameRegex.Replace(rawName.Replace(".", "_"), "_").Trim('_');
            return string.IsNullOrWhiteSpace(name) == true ? prefix : name;
        }

        private static string GetParameterPrefix(DataProviders dataProvider)
        {
            return dataProvider == DataProviders.Oracle ? ":" : "@";
        }

        private static string GetLimitClause(DataProviders dataProvider)
        {
            return dataProvider switch
            {
                DataProviders.SqlServer => string.Empty,
                DataProviders.Oracle => $"{Environment.NewLine}FETCH FIRST 500 ROWS ONLY",
                _ => $"{Environment.NewLine}LIMIT 500"
            };
        }
    }
}
