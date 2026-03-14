using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Data.ExtensionMethod;
using HandStack.Web;

using Newtonsoft.Json;

using Serilog;

using transact.Entity;

namespace transact.Extensions
{
    public static class ModuleExtensions
    {
        public static bool IsLogDbFile(string userWorkID, string applicationID, string? rollingID = "")
        {
            var logDbFilePath = ResolveLogDbFilePath(userWorkID, applicationID, rollingID);
            var fileInfo = new FileInfo(logDbFilePath);
            return fileInfo.Exists;
        }

        public static string? GetLogDbConnectionString(string userWorkID, string applicationID, string? rollingID = "")
        {
            string? result = null;
            var transactionLogBasePath = PathExtensions.Combine(ModuleConfiguration.TransactionLogBasePath, userWorkID, applicationID);
            if (Directory.Exists(transactionLogBasePath) == false)
            {
                Directory.CreateDirectory(transactionLogBasePath);
            }

            var logDbFilePath = ResolveLogDbFilePath(userWorkID, applicationID, rollingID);
            result = $"URI=file:{logDbFilePath};Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;";

            var fileInfo = new FileInfo(logDbFilePath);
            if (fileInfo.Directory != null && fileInfo.Directory.Exists == false)
            {
                Directory.CreateDirectory(fileInfo.Directory.FullName.Replace("\\", "/"));
            }

            if (fileInfo.Exists == false)
            {
                ExecuteMetaSQL(ReturnType.NonQuery, result, "TAG.TAG010.ZD01");
            }

            EnsureAggregateBackupSchema(result);

            return result;
        }

        private static string ResolveLogDbFilePath(string userWorkID, string applicationID, string? rollingID = "")
        {
            var transactionLogBasePath = PathExtensions.Combine(ModuleConfiguration.TransactionLogBasePath, userWorkID, applicationID);
            if (ModuleConfiguration.IsTransactAggregateRolling == true)
            {
                // IsTransactAggregateRolling=true 인 경우에만 주간 롤오버 파일을 사용합니다.
                var resolvedRollingID = ResolveRollingID(rollingID);
                return PathExtensions.Combine(transactionLogBasePath, $"{resolvedRollingID}-{applicationID}.db");
            }

            return PathExtensions.Combine(transactionLogBasePath, $"{applicationID}.db");
        }

        private static string ResolveRollingID(string? rollingID = "")
        {
            if (string.IsNullOrWhiteSpace(rollingID) == false)
            {
                return rollingID;
            }

            var dateTime = DateTime.Now;
            var day = CultureInfo.InvariantCulture.Calendar.GetDayOfWeek(dateTime);
            if (day >= DayOfWeek.Monday && day <= DayOfWeek.Wednesday)
            {
                dateTime = dateTime.AddDays(3);
            }

            return dateTime.Year.ToString() + CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(dateTime, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday).ToString().PadLeft(2, '0');
        }

        private static void EnsureAggregateBackupSchema(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return;
            }

            try
            {
                ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.ZD02");

                using var sqliteClient = new SQLiteClient(connectionString);
                EnsureAggregateTableSchema(sqliteClient);
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"connectionString: {connectionString}", "ModuleExtensions/EnsureAggregateBackupSchema");
            }
        }

        private static void EnsureAggregateTableSchema(SQLiteClient sqliteClient)
        {
            if (HasTable(sqliteClient, "Aggregate") == false)
            {
                return;
            }

            var hasAggregateIDColumn = HasColumn(sqliteClient, "Aggregate", "AggregateID");
            var isAggregateIDPrimaryKey = IsPrimaryKeyColumn(sqliteClient, "Aggregate", "AggregateID");
            var hasIsMovedColumn = HasColumn(sqliteClient, "Aggregate", "IsMoved");

            if (hasAggregateIDColumn == true && isAggregateIDPrimaryKey == true)
            {
                if (hasIsMovedColumn == false)
                {
                    sqliteClient.ExecuteNonQuery("ALTER TABLE Aggregate ADD COLUMN IsMoved INTEGER NOT NULL DEFAULT 0;", CommandType.Text);
                }

                return;
            }

            RebuildAggregateTable(sqliteClient, hasIsMovedColumn);
        }

        private static void RebuildAggregateTable(SQLiteClient sqliteClient, bool hasIsMovedColumn)
        {
            var movedColumnSQL = hasIsMovedColumn == true ? "IFNULL(IsMoved, 0)" : "0";

            try
            {
                sqliteClient.ExecuteNonQuery("BEGIN IMMEDIATE;", CommandType.Text);

                sqliteClient.ExecuteNonQuery("DROP TABLE IF EXISTS Aggregate_New;", CommandType.Text);
                sqliteClient.ExecuteNonQuery(@"
CREATE TABLE Aggregate_New (
    AggregateID INTEGER NOT NULL CONSTRAINT PK_Aggregate PRIMARY KEY AUTOINCREMENT,
    CreateDate INTEGER NOT NULL,
    CreateHour INTEGER NOT NULL,
    ProjectID TEXT NOT NULL,
    TransactionID TEXT NOT NULL,
    FeatureID TEXT NOT NULL,
    RequestCount INTEGER NULL,
    ResponseCount INTEGER NULL,
    ErrorCount INTEGER NULL,
    LatelyRequestAt TEXT NULL,
    LatelyResponseAt TEXT NULL,
    Acknowledge TEXT NULL,
    IsMoved INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT UK_Aggregate UNIQUE (CreateDate, CreateHour, ProjectID, TransactionID, FeatureID)
);", CommandType.Text);

                sqliteClient.ExecuteNonQuery($@"
INSERT INTO Aggregate_New
(
    CreateDate
    , CreateHour
    , ProjectID
    , TransactionID
    , FeatureID
    , RequestCount
    , ResponseCount
    , ErrorCount
    , LatelyRequestAt
    , LatelyResponseAt
    , Acknowledge
    , IsMoved
)
SELECT
    CreateDate
    , CreateHour
    , ProjectID
    , TransactionID
    , FeatureID
    , IFNULL(RequestCount, 0)
    , IFNULL(ResponseCount, 0)
    , IFNULL(ErrorCount, 0)
    , LatelyRequestAt
    , LatelyResponseAt
    , Acknowledge
    , {movedColumnSQL}
FROM Aggregate
ORDER BY CreateDate, CreateHour, ProjectID, TransactionID, FeatureID;", CommandType.Text);

                sqliteClient.ExecuteNonQuery("DROP TABLE Aggregate;", CommandType.Text);
                sqliteClient.ExecuteNonQuery("ALTER TABLE Aggregate_New RENAME TO Aggregate;", CommandType.Text);

                sqliteClient.ExecuteNonQuery(@"
UPDATE AggregateBackupStatus
SET LastMovedId = IFNULL((SELECT MAX(AggregateID) FROM Aggregate WHERE IsMoved = 1), 0)
    , UpdatedAt = strftime('%Y-%m-%d %H:%M:%S', 'NOW', 'localtime')
WHERE StatusID = 1;", CommandType.Text);

                sqliteClient.ExecuteNonQuery("COMMIT;", CommandType.Text);
            }
            catch
            {
                try
                {
                    sqliteClient.ExecuteNonQuery("ROLLBACK;", CommandType.Text);
                }
                catch
                {
                }

                throw;
            }
        }

        private static bool HasTable(SQLiteClient sqliteClient, string tableName)
        {
            using var dataSet = sqliteClient.ExecuteDataSet($"SELECT name FROM sqlite_master WHERE type = 'table' AND name = '{tableName}'", CommandType.Text);
            if (dataSet != null && dataSet.Tables.Count > 0)
            {
                return dataSet.Tables[0].Rows.Count > 0;
            }

            return false;
        }

        private static bool HasColumn(SQLiteClient sqliteClient, string tableName, string columnName)
        {
            using var dataSet = sqliteClient.ExecuteDataSet($"PRAGMA table_info('{tableName}')", CommandType.Text);
            if (dataSet != null && dataSet.Tables.Count > 0)
            {
                foreach (DataRow row in dataSet.Tables[0].Rows)
                {
                    if (string.Equals(row["name"]?.ToString(), columnName, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private static bool IsPrimaryKeyColumn(SQLiteClient sqliteClient, string tableName, string columnName)
        {
            using var dataSet = sqliteClient.ExecuteDataSet($"PRAGMA table_info('{tableName}')", CommandType.Text);
            if (dataSet != null && dataSet.Tables.Count > 0)
            {
                foreach (DataRow row in dataSet.Tables[0].Rows)
                {
                    if (string.Equals(row["name"]?.ToString(), columnName, StringComparison.OrdinalIgnoreCase))
                    {
                        var pkValue = row["pk"]?.ToString();
                        return int.TryParse(pkValue, out var pkOrder) && pkOrder > 0;
                    }
                }
            }

            return false;
        }

        /*
        var dynamicFiles = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, connectionString, "STR.SLT010.LD02", new
        {
            ApplicationID = applicationID,
            RepositoryNo = repositoryID,
            DependencyID = dependencyID
        });

        if (dynamicFiles != null)
        {
            foreach (var item in dynamicFiles)
            {
            }
        }
         */
        public static dynamic? ExecuteMetaSQL(ReturnType returnType, string connectionString, string queryID, object? parameters = null)
        {
            dynamic? result = null;

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                Log.Warning("[{LogCategory}] " + $"SQLite 연결문자열 확인 필요", "ModuleExtensions/ExecuteMetaSQL");
            }
            else
            {
                var paths = queryID.Split(".");
                if (paths.Length == 3)
                {
                    try
                    {
                        var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                        var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, GlobalConfiguration.ApplicationID, paths[0], paths[1], paths[2], parseParameters);
                        if (sqlMeta != null)
                        {
                            using var sqliteClient = new SQLiteClient(connectionString);
                            switch (returnType)
                            {
                                case ReturnType.NonQuery:
                                    result = sqliteClient.ExecuteNonQuery(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.Scalar:
                                    result = sqliteClient.ExecuteScalar(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataSet:
                                    result = sqliteClient.ExecuteDataSet(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataReader:
                                    result = sqliteClient.ExecuteReader(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.Dynamic:
                                    result = sqliteClient.ExecuteDynamic(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                    }
                }
            }

            return result;
        }

        public static List<T>? ExecuteMetaSQL<T>(string connectionString, string queryID, object? parameters = null)
        {
            List<T>? result = null;

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                Log.Warning("[{LogCategory}] " + $"SQLite 연결문자열 확인 필요", "ModuleExtensions/ExecuteMetaSQL");
            }
            else
            {
                var paths = queryID.Split(".");
                if (paths.Length == 3)
                {
                    try
                    {
                        var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                        var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, GlobalConfiguration.ApplicationID, paths[0], paths[1], paths[2], parseParameters);
                        if (sqlMeta != null)
                        {
                            using var sqliteClient = new SQLiteClient(connectionString);
                            result = sqliteClient.ExecutePocoMappings<T>(sqlMeta.Item1, sqlMeta.Item2);
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] " + $"queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                    }
                }
            }

            return result;
        }
    }
}

