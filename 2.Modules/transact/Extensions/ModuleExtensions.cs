using System;
using System.Collections.Generic;
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
        public static bool IsLogDbFile(string userWorkID, string applicationID, string rollingID)
        {
            var transactionLogBasePath = PathExtensions.Combine(ModuleConfiguration.TransactionLogBasePath, userWorkID, applicationID);
            var logDbFilePath = PathExtensions.Combine(transactionLogBasePath, $"{rollingID}-{applicationID}.db");
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

            if (string.IsNullOrWhiteSpace(rollingID))
            {
                var dateTime = DateTime.Now;
                var day = CultureInfo.InvariantCulture.Calendar.GetDayOfWeek(dateTime);
                if (day >= DayOfWeek.Monday && day <= DayOfWeek.Wednesday)
                {
                    dateTime = dateTime.AddDays(3);
                }

                rollingID = dateTime.Year.ToString() + CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(dateTime, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday).ToString().PadLeft(2, '0');
            }

            // 주간별 SQLite 데이터베이스 파일 생성: {년도}{주2자리}-{애플리케이션 ID}.db
            var logDbFilePath = PathExtensions.Combine(transactionLogBasePath, $"{rollingID}-{applicationID}.db");
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

            return result;
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

