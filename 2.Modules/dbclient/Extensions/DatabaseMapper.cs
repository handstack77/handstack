using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

using Dapper;

using dbclient.Entity;
using dbclient.NativeParameters;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using HtmlAgilityPack;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace dbclient.Extensions
{
    public static class DatabaseMapper
    {
        private static Random random = new Random();
        public static ExpiringDictionary<DataSourceTanantKey, DataSourceMap> DataSourceMappings = new ExpiringDictionary<DataSourceTanantKey, DataSourceMap>();
        public static ExpiringDictionary<string, StatementMap> StatementMappings = new ExpiringDictionary<string, StatementMap>();

        static DatabaseMapper()
        {
        }

        public static DataSourceMap? GetDataSourceMap(QueryObject queryObject, string requestApplicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;
            if (DataSourceMappings != null)
            {
                var applicationID = requestApplicationID;
                result = FindDataSourceMap(queryObject, applicationID, projectID, dataSourceID);

                if (result == null)
                {
                    var userWorkID = string.Empty;
                    var appBasePath = string.Empty;
                    if (string.IsNullOrEmpty(queryObject.TenantID) == false)
                    {
                        var items = queryObject.TenantID.SplitAndTrim('|');
                        userWorkID = items[0];
                        applicationID = items[1];
                        appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    }
                    else
                    {
                        var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                        var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                        foreach (var directory in directories)
                        {
                            var directoryInfo = new DirectoryInfo(directory);
                            if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                            {
                                appBasePath = directoryInfo.FullName.Replace("\\", "/");
                                userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                                break;
                            }
                        }
                    }

                    var tenantID = $"{userWorkID}|{applicationID}";
                    var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                    if (string.IsNullOrEmpty(appBasePath) == false && File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                    {
                        var appSettingText = File.ReadAllText(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            var dataSourceJson = appSetting.DataSource;
                            if (dataSourceJson != null)
                            {
                                foreach (var item in dataSourceJson)
                                {
                                    if (ModuleConfiguration.DataSource.FindIndex(p =>
                                        p.ApplicationID == item.ApplicationID
                                        && p.ProjectID == item.ProjectID
                                        && p.DataSourceID == item.DataSourceID
                                    ) == -1)
                                    {
                                        item.ConnectionString = item.ConnectionString.Replace("{appBasePath}", appBasePath);
                                        ModuleConfiguration.DataSource.Add(item);
                                    }

                                    var tanantMap = new DataSourceTanantKey();
                                    tanantMap.ApplicationID = item.ApplicationID;
                                    tanantMap.DataSourceID = item.DataSourceID;
                                    tanantMap.TanantPattern = item.TanantPattern;
                                    tanantMap.TanantValue = item.TanantValue;

                                    if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                    {
                                        var dataSourceMap = new DataSourceMap();
                                        dataSourceMap.ApplicationID = item.ApplicationID;
                                        dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();
                                        dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                                        dataSourceMap.ConnectionString = item.ConnectionString;
                                        dataSourceMap.TransactionIsolationLevel = string.IsNullOrEmpty(item.TransactionIsolationLevel) == true ? "ReadCommitted" : item.TransactionIsolationLevel;

                                        if (item.IsEncryption.ParseBool() == true)
                                        {
                                            dataSourceMap.ConnectionString = DecryptConnectionString(item);
                                        }

                                        if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                        {
                                            DataSourceMappings.Add(tanantMap, dataSourceMap);
                                        }
                                    }
                                }

                                result = FindDataSourceMap(queryObject, applicationID, projectID, dataSourceID);
                                if (result == null && applicationID != requestApplicationID)
                                {
                                    result = FindDataSourceMap(queryObject, requestApplicationID, projectID, dataSourceID);
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        private static DataSourceMap FindDataSourceMap(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;

            var dataSourceMaps = DataSourceMappings.Where(item =>
                item.Value.ApplicationID == applicationID
                && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)
                && item.Key.DataSourceID == dataSourceID
                && string.IsNullOrEmpty(item.Key.TanantPattern) == false
            ).ToList();

            for (var i = 0; i < dataSourceMaps.Count; i++)
            {
                var dataSourceMap = dataSourceMaps[i];

                var tanantPattern = dataSourceMap.Key.TanantPattern;
                var tanantValue = dataSourceMap.Key.TanantValue;
                for (var j = 0; j < queryObject.Parameters.Count; j++)
                {
                    var parameter = queryObject.Parameters[j];
                    if (parameter.ParameterName.StartsWith("$") == true && parameter.Value != null)
                    {
                        tanantPattern = Regex.Replace(tanantPattern, "\\${" + parameter.ParameterName.Substring(1) + "}", parameter.Value.ToStringSafe());
                    }
                    else if (parameter.ParameterName.StartsWith("#") == true && parameter.Value != null)
                    {
                        tanantPattern = Regex.Replace(tanantPattern, "\\#{" + parameter.ParameterName.Substring(1) + "}", parameter.Value.ToStringSafe());
                    }
                }

                if (tanantPattern == tanantValue)
                {
                    result = dataSourceMap.Value;
                    break;
                }
            }

            if (result == null)
            {
                result = DataSourceMappings.FirstOrDefault(item =>
                    item.Value.ApplicationID == applicationID
                    && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)
                    && item.Key.DataSourceID == dataSourceID
                    && string.IsNullOrEmpty(item.Key.TanantPattern) == true
                ).Value;
            }

            return result;
        }

        public static StatementMap? GetStatementMap(string queryID)
        {
            StatementMap? result = null;
            lock (StatementMappings)
            {
                result = StatementMappings.FirstOrDefault(item => item.Key == queryID).Value;

                if (result == null)
                {
                    var itemKeys = queryID.Split("|");
                    var applicationID = itemKeys[0];
                    var projectID = itemKeys[1];
                    var transactionID = itemKeys[2];

                    var userWorkID = string.Empty;
                    var appBasePath = string.Empty;
                    var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (var directory in directories)
                    {
                        var directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName.Replace("\\", "/");
                            userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                            break;
                        }
                    }

                    if (string.IsNullOrEmpty(appBasePath) == false && Directory.Exists(appBasePath) == true)
                    {
                        var filePath = PathExtensions.Combine(appBasePath, "dbclient", projectID, transactionID + ".xml");
                        try
                        {
                            if (File.Exists(filePath) == true)
                            {
                                var fileInfo = new FileInfo(filePath);
                                var htmlDocument = new HtmlDocument();
                                htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                                var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                                projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                                transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                                if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                {
                                    applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                    projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                    transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                                }
                                else
                                {
                                    applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                    projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                    transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                                }

                                var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                                if (items != null)
                                {
                                    foreach (var item in items)
                                    {
                                        if (header == null || $"{header?.Element("use")?.InnerText}".ToBoolean() == true)
                                        {
                                            var statementMap = new StatementMap();
                                            statementMap.ApplicationID = applicationID;
                                            statementMap.ProjectID = projectID;
                                            statementMap.TransactionID = transactionID;
                                            statementMap.DataSourceID = item.Attributes["datasource"] == null ? (header?.Element("datasource")?.InnerText).ToStringSafe() : item.Attributes["datasource"].Value;
                                            if (string.IsNullOrEmpty(statementMap.DataSourceID) == true)
                                            {
                                                statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                                            }

                                            statementMap.TransactionIsolationLevel = (header?.Element("isolation")?.InnerText).ToStringSafe();
                                            statementMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                            statementMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                            statementMap.Comment = item.Attributes["desc"].Value;
                                            statementMap.NativeDataClient = item.Attributes["native"] == null ? false : item.Attributes["native"].Value.ParseBool();
                                            statementMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                            statementMap.SQL = item.InnerHtml;

                                            var beforetransaction = item.Attributes["before"]?.Value;
                                            if (string.IsNullOrEmpty(beforetransaction) == false)
                                            {
                                                statementMap.BeforeTransactionCommand = beforetransaction;
                                            }

                                            var aftertransaction = item.Attributes["after"]?.Value;
                                            if (string.IsNullOrEmpty(aftertransaction) == false)
                                            {
                                                statementMap.AfterTransactionCommand = aftertransaction;
                                            }

                                            var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                            if (string.IsNullOrEmpty(fallbacktransaction) == false)
                                            {
                                                statementMap.FallbackTransactionCommand = fallbacktransaction;
                                            }

                                            statementMap.DbParameters = new List<DbParameterMap>();
                                            var htmlNodes = item.SelectNodes("param");
                                            if (htmlNodes != null && htmlNodes.Count > 0)
                                            {
                                                foreach (var paramNode in item.SelectNodes("param"))
                                                {
                                                    statementMap.DbParameters.Add(new DbParameterMap()
                                                    {
                                                        Name = paramNode.Attributes["id"].Value.ToString(),
                                                        DbType = paramNode.Attributes["type"].Value.ToString(),
                                                        Length = (paramNode.Attributes["length"] == null ? "-1" : paramNode.Attributes["length"].Value.ToString()).ParseInt(-1),
                                                        DefaultValue = paramNode.Attributes["value"] == null ? "" : paramNode.Attributes["value"].Value.ToString(),
                                                        TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                        Direction = paramNode.Attributes["direction"] == null ? "Input" : paramNode.Attributes["direction"].Value.ToString(),
                                                        Transform = paramNode.Attributes["transform"] == null ? "" : paramNode.Attributes["transform"].Value.ToString(),
                                                    });
                                                }
                                            }

                                            var children = new HtmlDocument();
                                            children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                            children.LoadHtml(statementMap.SQL);
                                            statementMap.Chidren = children;

                                            var mappingQueryID = string.Concat(
                                                statementMap.ApplicationID, "|",
                                                statementMap.ProjectID, "|",
                                                statementMap.TransactionID, "|",
                                                statementMap.StatementID
                                            );

                                            if (StatementMappings.ContainsKey(mappingQueryID) == true)
                                            {
                                                StatementMappings.Remove(mappingQueryID);
                                            }

                                            StatementMappings.Add(mappingQueryID, statementMap);
                                        }
                                    }

                                    result = StatementMappings.FirstOrDefault(item => item.Key == queryID).Value;
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error(exception, "[{LogCategory}] " + $"{filePath} 업무 계약 파일 오류 - " + exception.ToMessage(), "DatabaseMapper/GetStatementMap");
                        }
                    }
                }
            }

            return result;
        }

        public static string DecryptConnectionString(DataSource? dataSource)
        {
            var result = "";
            if (dataSource != null)
            {
                try
                {
                    var values = dataSource.ConnectionString.SplitAndTrim('.');

                    var encrypt = values[0];
                    var decryptKey = values[1];
                    var hostName = values[2];
                    var hash = values[3];

                    if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() == hash)
                    {
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                        result = encrypt.DecryptAES(decryptKey);
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(dataSource)} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptConnectionString");
                }
            }

            return result;
        }

        public static bool HasContractFile(string fileRelativePath)
        {
            var result = false;
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                var filePath = PathExtensions.Join(basePath, fileRelativePath);
                result = File.Exists(filePath);
                if (result == true)
                {
                    break;
                }
            }

            return result;
        }

        public static bool Remove(string projectID, string businessID, string transactionID, string statementID)
        {
            var result = false;
            lock (StatementMappings)
            {
                var queryID = string.Concat(
                    projectID, "|",
                    businessID, "|",
                    transactionID, "|",
                    statementID
                );

                if (StatementMappings.ContainsKey(queryID) == true)
                {
                    result = StatementMappings.Remove(queryID);
                }
            }

            return result;
        }

        public static bool HasStatement(string projectID, string businessID, string transactionID, string statementID)
        {
            var result = false;
            var queryID = string.Concat(
                projectID, "|",
                businessID, "|",
                transactionID, "|",
                statementID
            );

            result = StatementMappings.ContainsKey(queryID);

            return result;
        }

        public static bool AddStatementMap(string fileRelativePath, bool forceUpdate, ILogger logger)
        {
            var result = false;
            lock (StatementMappings)
            {
                try
                {
                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                    {
                        var filePath = PathExtensions.Join(basePath, fileRelativePath);

                        if (File.Exists(filePath) == true)
                        {
                            var fileInfo = new FileInfo(filePath);
                            var htmlDocument = new HtmlDocument();
                            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                            var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                            var isTenantContractFile = false;
                            var applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                            var projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                            var transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                            if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                isTenantContractFile = true;
                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }
                            else
                            {
                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if (header == null || $"{header?.Element("use")?.InnerText}".ToBoolean() == true)
                                    {
                                        var statementMap = new StatementMap();
                                        statementMap.ApplicationID = applicationID;
                                        statementMap.ProjectID = projectID;
                                        statementMap.TransactionID = transactionID;
                                        statementMap.DataSourceID = item.Attributes["datasource"] == null ? (header?.Element("datasource")?.InnerText).ToStringSafe() : item.Attributes["datasource"].Value;
                                        if (string.IsNullOrEmpty(statementMap.DataSourceID) == true)
                                        {
                                            statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                                        }

                                        statementMap.TransactionIsolationLevel = (header?.Element("isolation")?.InnerText).ToStringSafe();
                                        statementMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                        statementMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                        statementMap.Comment = item.Attributes["desc"].Value;
                                        statementMap.NativeDataClient = item.Attributes["native"] == null ? false : item.Attributes["native"].Value.ParseBool();
                                        statementMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                        statementMap.SQL = item.InnerHtml;

                                        var beforetransaction = item.Attributes["before"]?.Value;
                                        if (string.IsNullOrEmpty(beforetransaction) == false)
                                        {
                                            statementMap.BeforeTransactionCommand = beforetransaction;
                                        }

                                        var aftertransaction = item.Attributes["after"]?.Value;
                                        if (string.IsNullOrEmpty(aftertransaction) == false)
                                        {
                                            statementMap.AfterTransactionCommand = aftertransaction;
                                        }

                                        var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                        if (string.IsNullOrEmpty(fallbacktransaction) == false)
                                        {
                                            statementMap.FallbackTransactionCommand = fallbacktransaction;
                                        }

                                        statementMap.DbParameters = new List<DbParameterMap>();
                                        var htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (var paramNode in item.SelectNodes("param"))
                                            {
                                                statementMap.DbParameters.Add(new DbParameterMap()
                                                {
                                                    Name = paramNode.Attributes["id"].Value.ToString(),
                                                    DbType = paramNode.Attributes["type"].Value.ToString(),
                                                    Length = (paramNode.Attributes["length"] == null ? "-1" : paramNode.Attributes["length"].Value.ToString()).ParseInt(-1),
                                                    DefaultValue = paramNode.Attributes["value"] == null ? "" : paramNode.Attributes["value"].Value.ToString(),
                                                    TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                    Direction = paramNode.Attributes["direction"] == null ? "Input" : paramNode.Attributes["direction"].Value.ToString(),
                                                    Transform = paramNode.Attributes["transform"] == null ? "" : paramNode.Attributes["transform"].Value.ToString(),
                                                });
                                            }
                                        }

                                        var children = new HtmlDocument();
                                        children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                        children.LoadHtml(statementMap.SQL);
                                        statementMap.Chidren = children;

                                        var queryID = string.Concat(
                                            statementMap.ApplicationID, "|",
                                            statementMap.ProjectID, "|",
                                            statementMap.TransactionID, "|",
                                            statementMap.StatementID
                                        );

                                        if (StatementMappings.ContainsKey(queryID) == false)
                                        {
                                            if (isTenantContractFile == true)
                                            {
                                                StatementMappings.Add(queryID, statementMap);
                                            }
                                            else
                                            {
                                                StatementMappings.Add(queryID, statementMap, TimeSpan.FromDays(36500));
                                            }
                                        }
                                        else
                                        {
                                            if (forceUpdate == true)
                                            {
                                                StatementMappings.Remove(queryID);
                                                if (isTenantContractFile == true)
                                                {
                                                    StatementMappings.Add(queryID, statementMap);
                                                }
                                                else
                                                {
                                                    StatementMappings.Add(queryID, statementMap, TimeSpan.FromDays(36500));
                                                }
                                            }
                                            else
                                            {
                                                logger.Warning("[{LogCategory}] " + $"SqlMap 정보 중복 오류 - {filePath}, ProjectID - {statementMap.ApplicationID}, BusinessID - {statementMap.ProjectID}, TransactionID - {statementMap.TransactionID}, StatementID - {statementMap.StatementID}", "DatabaseMapper/AddStatementMap");
                                            }
                                        }
                                    }
                                }
                            }

                            result = true;
                            break;
                        }
                    }
                }
                catch (Exception exception)
                {
                    logger.Error("[{LogCategory}] " + $"{fileRelativePath} 업무 계약 파일 오류 - " + exception.ToMessage(), "DatabaseMapper/AddStatementMap");
                }
            }

            return result;
        }

        private static DynamicParameter? GetDbParameterMap(string parameterName, List<DynamicParameter> dynamicParameters)
        {
            DynamicParameter? result = null;

            var maps = from p in dynamicParameters
                       where p.ParameterName == parameterName.Replace("@", "").Replace(":", "")
                       select p;

            if (maps.Count() > 0)
            {
                foreach (var item in maps)
                {
                    result = item;
                    break;
                }
            }

            return result;
        }

        public static (string? SQL, string ResultType) FindPretreatment(StatementMap statementMap, QueryObject? queryObject)
        {
            string? pretreatmentSQL = null;
            var resultType = "";

            var parameters = extractParameters(queryObject);

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
            htmlDocument.LoadHtml(statementMap.SQL);
            var pretreatment = htmlDocument.DocumentNode.SelectSingleNode("//pretreatment");
            if (pretreatment != null)
            {
                var htmlResultType = pretreatment.Attributes["resultType"];
                if (htmlResultType != null)
                {
                    resultType = htmlResultType.Value;
                }
                var children = new HtmlDocument();
                children.OptionDefaultStreamEncoding = Encoding.UTF8;
                children.LoadHtml(pretreatment.InnerHtml);

                var childNodes = children.DocumentNode.ChildNodes;
                foreach (var childNode in childNodes)
                {
                    pretreatmentSQL = pretreatmentSQL + ConvertChildren(childNode, parameters);
                }
            }

            if (pretreatmentSQL != null)
            {
                pretreatmentSQL = pretreatmentSQL + new string(' ', random.Next(1, 10));
            }

            return (pretreatmentSQL, resultType);
        }

        public static string Find(StatementMap statementMap, QueryObject? queryObject)
        {
            var result = string.Empty;

            var parameters = extractParameters(queryObject);

            var children = statementMap.Chidren;

            var childNodes = children.DocumentNode.ChildNodes;
            foreach (var childNode in childNodes)
            {
                result = result + ConvertChildren(childNode, parameters);
            }

            if (string.IsNullOrEmpty(result) == true)
            {
                result = "";
            }
            else
            {
                result = result + new string(' ', random.Next(1, 10));
            }

            return result;
        }


        private static JObject extractParameters(QueryObject? queryObject)
        {
            var parameters = new JObject();
            if (queryObject != null)
            {
                foreach (var item in queryObject.Parameters)
                {
                    object? value = null;
                    if (item.DbType == "String")
                    {
                        value = item.Value == null ? "" : item.Value.ToString();
                    }
                    else if (item.DbType == "Number")
                    {
                        var numberValue = item.Value.ToStringSafe();
                        var isParse = int.TryParse(numberValue, out var intValue);
                        if (isParse == true)
                        {
                            value = intValue;
                        }
                        else
                        {
                            isParse = long.TryParse(numberValue, out var longValue);
                            if (isParse == true)
                            {
                                value = longValue;
                            }
                            else
                            {
                                isParse = decimal.TryParse(numberValue, out var decimalValue);
                                if (isParse == true)
                                {
                                    value = decimalValue;
                                }
                                else
                                {
                                    isParse = float.TryParse(numberValue, out var floatValue);
                                    if (isParse == true)
                                    {
                                        value = floatValue;
                                    }
                                    else
                                    {
                                        value = null;
                                    }
                                }
                            }
                        }
                    }
                    else if (item.DbType == "Boolean")
                    {
                        value = item.Value?.ToStringSafe().ParseBool();
                    }
                    else if (item.DbType == "DateTime")
                    {
                        value = item.Value as DateTime?;
                        if (value == null && item.Value != null)
                        {
                            DateTime dateTime;
                            var isParse = DateTime.TryParse(item.Value.ToString(), out dateTime);
                            if (isParse == true)
                            {
                                value = dateTime;
                            }
                        }
                    }
                    else
                    {
                        value = item.Value?.ToString();
                    }

                    parameters.Add(item.ParameterName, value == null ? null : JToken.FromObject(value));
                }
            }

            return parameters;
        }

        public static string ConvertChildren(HtmlNode htmlNode, JObject parameters)
        {
            var result = "";
            var nodeType = htmlNode.NodeType.ToString();
            if (nodeType == "Text")
            {
                result = ConvertParameter(htmlNode, parameters);
            }
            else if (nodeType == "Element")
            {
                switch (htmlNode.Name.ToString().ToLower())
                {
                    case "if":
                        return ConvertIf(htmlNode, parameters);
                    case "foreach":
                        return ConvertForeach(htmlNode, parameters);
                    case "bind":
                        parameters = ConvertBind(htmlNode, parameters);
                        result = "";
                        break;
                    case "param":
                        return "";
                    default:
                        result = "";
                        break;
                }
            }

            return result;
        }

        public static string ConvertForeach(HtmlNode htmlNode, JObject parameters)
        {
            var result = "";
            var collectionName = htmlNode.Attributes["collection"]?.Value;
            if (string.IsNullOrEmpty(collectionName))
            {
                return "";
            }

            var value = parameters[collectionName] as JValue;
            if (value != null)
            {
                var list = JArray.Parse(value.ToString());
                if (list != null)
                {
                    var item = htmlNode.Attributes["item"].Value;
                    var open = htmlNode.Attributes["open"] == null ? "" : htmlNode.Attributes["open"].Value;
                    var close = htmlNode.Attributes["close"] == null ? "" : htmlNode.Attributes["close"].Value;
                    var separator = htmlNode.Attributes["separator"] == null ? "" : htmlNode.Attributes["separator"].Value;

                    var foreachTexts = new List<string>();
                    foreach (var coll in list)
                    {
                        var foreachParam = parameters;
                        foreachParam[item] = coll.Value<string>();

                        var foreachText = "";
                        foreach (var childNode in htmlNode.ChildNodes)
                        {
                            var childrenText = ConvertChildren(childNode, foreachParam);
                            childrenText = Regex.Replace(childrenText, "^\\s*$", "");

                            if (string.IsNullOrEmpty(childrenText) == false)
                            {
                                foreachText = foreachText + childrenText;
                            }
                        }

                        if (string.IsNullOrEmpty(foreachText) == false)
                        {
                            foreachTexts.Add(foreachText);
                        }
                    }

                    result = (open + string.Join(separator, foreachTexts.ToArray()) + close);
                }

                parameters.Remove(collectionName);
            }

            return result;
        }

        public static string ConvertIf(HtmlNode htmlNode, JObject parameters)
        {
            var evalString = htmlNode.Attributes["test"].Value;
            evalString = ReplaceEvalString(evalString, parameters);
            evalString = evalString.Replace(" and ", " && ");
            evalString = evalString.Replace(" or ", " || ");
            var evalText = evalString.Replace("'", "\"");

            var line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line.Replace("#", "$"));
            var evalResult = queryable.Any(evalText);

            var convertString = "";
            if (evalResult == true)
            {
                foreach (var childNode in htmlNode.ChildNodes)
                {
                    convertString = convertString + ConvertChildren(childNode, parameters);
                }
            }

            return convertString;
        }

        public static JObject ConvertBind(HtmlNode htmlNode, JObject parameters)
        {
            var bindID = htmlNode.Attributes["name"].Value;
            var evalString = htmlNode.Attributes["value"].Value;
            evalString = ReplaceEvalString(evalString, parameters);
            var evalText = evalString.Replace("'", "\"");

            var evalResult = evalText;
            var line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line.Replace("#", "$"));
            var queryResult = queryable.Select<string>(evalText);
            if (queryResult.Any() == true)
            {
                evalResult = queryResult.First();
            }

            parameters[bindID] = evalResult;

            return parameters;
        }

        public static string ConvertParameter(HtmlNode htmlNode, JObject parameters)
        {
            var convertString = htmlNode.InnerText;
            if (parameters != null && parameters.Count > 0)
            {
                var keyString = "";
                convertString = RecursiveParameters(convertString, parameters, keyString);
            }

            try
            {
                convertString = Regex.Replace(convertString, "&amp;", "&");
                convertString = Regex.Replace(convertString, "&lt;", "<");
                convertString = Regex.Replace(convertString, "&gt;", ">");
                convertString = Regex.Replace(convertString, "&quot;", "\"");
            }
            catch (Exception exception)
            {
                Log.Error("[{LogCategory}] " + exception.ToMessage(), "DatabaseMapper/ConvertParameter");
            }

            return convertString;
        }

        public static string RecursiveParameters(string convertString, JObject? parameters, string keyString)
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
                            // 문자값 변환
                            convertString = Regex.Replace(convertString, "\\#{" + name + "}", "'" + value + "'");

                            // 숫자값 변환
                            convertString = Regex.Replace(convertString, "\\${" + name + "}", value);
                        }
                    }
                }
            }

            return convertString;
        }

        public static string ReplaceEvalString(string evalString, JObject parameters)
        {
            foreach (var parameter in parameters)
            {
                if (parameter.Value != null)
                {
                    var replacePrefix = "";
                    var replacePostfix = "";
                    Regex paramRegex;

                    if (parameter.Value.Type.ToString() == "Object")
                    {
                        replacePostfix = "";
                        paramRegex = new Regex("(^|[^a-zA-Z0-9])(" + parameter.Key + "\\.)([a-zA-Z0-9]+)");
                    }
                    else
                    {
                        replacePostfix = " ";
                        paramRegex = new Regex("(^|[^a-zA-Z0-9])(" + parameter.Key + ")($|[^a-zA-Z0-9])");
                    }

                    if (paramRegex.IsMatch(evalString) == true)
                    {
                        evalString = paramRegex.Replace(evalString, "$1" + replacePrefix + "$2" + replacePostfix + "$3");
                    }
                }
            }

            return evalString;
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

        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                    {
                        continue;
                    }

                    var sqlMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                    foreach (var sqlMapFile in sqlMapFiles)
                    {
                        try
                        {
                            var fileInfo = new FileInfo(sqlMapFile);
                            var htmlDocument = new HtmlDocument();
                            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(sqlMapFile)));
                            var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                            var applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                            var projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                            var transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                            if (sqlMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }
                            else
                            {
                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if (header == null || $"{header?.Element("use")?.InnerText}".ToBoolean() == true)
                                    {
                                        var statementMap = new StatementMap();
                                        statementMap.ApplicationID = applicationID;
                                        statementMap.ProjectID = projectID;
                                        statementMap.TransactionID = transactionID;
                                        statementMap.DataSourceID = item.Attributes["datasource"] == null ? (header?.Element("datasource")?.InnerText).ToStringSafe() : item.Attributes["datasource"].Value;
                                        if (string.IsNullOrEmpty(statementMap.DataSourceID) == true)
                                        {
                                            statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                                        }

                                        statementMap.TransactionIsolationLevel = (header?.Element("isolation")?.InnerText).ToStringSafe();
                                        statementMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                        statementMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                        statementMap.Comment = item.Attributes["desc"].Value;
                                        statementMap.NativeDataClient = item.Attributes["native"] == null ? false : item.Attributes["native"].Value.ParseBool();
                                        statementMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                        statementMap.SQL = item.InnerHtml;

                                        var beforetransaction = item.Attributes["before"]?.Value;
                                        if (string.IsNullOrEmpty(beforetransaction) == false)
                                        {
                                            statementMap.BeforeTransactionCommand = beforetransaction;
                                        }

                                        var aftertransaction = item.Attributes["after"]?.Value;
                                        if (string.IsNullOrEmpty(aftertransaction) == false)
                                        {
                                            statementMap.AfterTransactionCommand = aftertransaction;
                                        }

                                        var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                        if (string.IsNullOrEmpty(fallbacktransaction) == false)
                                        {
                                            statementMap.FallbackTransactionCommand = fallbacktransaction;
                                        }

                                        statementMap.DbParameters = new List<DbParameterMap>();
                                        var htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (var paramNode in item.SelectNodes("param"))
                                            {
                                                statementMap.DbParameters.Add(new DbParameterMap()
                                                {
                                                    Name = paramNode.Attributes["id"].Value.ToString(),
                                                    DbType = paramNode.Attributes["type"].Value.ToString(),
                                                    Length = (paramNode.Attributes["length"] == null ? "-1" : paramNode.Attributes["length"].Value.ToString()).ParseInt(-1),
                                                    DefaultValue = paramNode.Attributes["value"] == null ? "" : paramNode.Attributes["value"].Value.ToString(),
                                                    TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                    Direction = paramNode.Attributes["direction"] == null ? "Input" : paramNode.Attributes["direction"].Value.ToString(),
                                                    Transform = paramNode.Attributes["transform"] == null ? "" : paramNode.Attributes["transform"].Value.ToString(),
                                                });
                                            }
                                        }

                                        var children = new HtmlDocument();
                                        children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                        children.LoadHtml(statementMap.SQL);
                                        statementMap.Chidren = children;

                                        var queryID = string.Concat(
                                            statementMap.ApplicationID, "|",
                                            statementMap.ProjectID, "|",
                                            statementMap.TransactionID, "|",
                                            statementMap.StatementID
                                        );

                                        lock (StatementMappings)
                                        {
                                            if (StatementMappings.ContainsKey(queryID) == false)
                                            {
                                                StatementMappings.Add(queryID, statementMap, TimeSpan.FromDays(36500));
                                            }
                                            else
                                            {
                                                logger.Warning("[{LogCategory}] " + $"SqlMap 정보 중복 오류 - {sqlMapFile}, ApplicationID - {statementMap.ApplicationID}, ProjectID - {statementMap.ProjectID}, TransactionID - {statementMap.TransactionID}, StatementID - {statementMap.StatementID}", "DatabaseMapper/LoadContract");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            logger.Error("[{LogCategory}] " + $"{sqlMapFile} 업무 계약 파일 오류 - " + exception.ToMessage(), "DatabaseMapper/LoadContract");
                        }
                    }
                }

                foreach (var item in ModuleConfiguration.DataSource)
                {
                    var tanantMap = new DataSourceTanantKey();
                    tanantMap.ApplicationID = item.ApplicationID;
                    tanantMap.DataSourceID = item.DataSourceID;
                    tanantMap.TanantPattern = item.TanantPattern;
                    tanantMap.TanantValue = item.TanantValue;

                    var dataSourceMaps = DataSourceMappings.Where(p =>
                        p.Value.ApplicationID == item.ApplicationID
                        && p.Value.ProjectListID.SequenceEqual(item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList())
                        && p.Key.DataSourceID == item.DataSourceID
                        && (string.IsNullOrEmpty(p.Key.TanantPattern) == false && p.Key.TanantPattern == item.TanantPattern && p.Key.TanantValue == item.TanantValue)
                    ).ToList();

                    if (dataSourceMaps.Count == 0)
                    {
                        var dataSourceMap = new DataSourceMap();
                        dataSourceMap.ApplicationID = item.ApplicationID;
                        dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();
                        dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                        dataSourceMap.ConnectionString = item.ConnectionString;
                        dataSourceMap.TransactionIsolationLevel = string.IsNullOrEmpty(item.TransactionIsolationLevel) == true ? "ReadCommitted" : item.TransactionIsolationLevel;

                        if (item.IsEncryption.ParseBool() == true)
                        {
                            dataSourceMap.ConnectionString = DecryptConnectionString(item);
                        }

                        DataSourceMappings.Add(tanantMap, dataSourceMap, TimeSpan.FromDays(36500));
                    }
                    else
                    {
                        Log.Logger.Warning("[{LogCategory}] " + $"DataSourceMap 정보 중복 확인 필요 - ApplicationID - {item.ApplicationID}, ProjectID - {item.ProjectID}, DataSourceID - {item.DataSourceID}, DataProvider - {item.DataProvider}, TanantPattern - {item.TanantPattern}, TanantValue - {item.TanantValue}", "DatabaseMapper/LoadContract");
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"LoadContract 오류 - " + exception.ToMessage(), "DatabaseMapper/LoadContract");
            }
        }

        public static Dictionary<string, object?> ToParametersDictionary(this DynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var iLookup = (SqlMapper.IParameterLookup)dynamicParams;

            foreach (var paramName in dynamicParams.ParameterNames)
            {
                var value = iLookup[paramName];
                result.Add(paramName, value);
            }

            var templates = dynamicParams.GetType().GetField("templates", BindingFlags.NonPublic | BindingFlags.Instance);
            if (templates != null)
            {
                var list = templates.GetValue(dynamicParams) as List<Object>;
                if (list != null)
                {
                    foreach (var props in list.Select(obj => obj.GetPropertyValuePairs().ToList()))
                    {
                        props.ForEach(p => result.Add(p.Key, p.Value));
                    }
                }
            }
            return result;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this SqlServerDynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var parameters = dynamicParams.sqlParameters;
            foreach (var item in parameters)
            {
                result.Add(item.ParameterName, item.Value);
            }
            return result;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this OracleDynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var parameters = dynamicParams.oracleParameters;
            foreach (var item in parameters)
            {
                result.Add(item.ParameterName, item.Value);
            }
            return result;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this MySqlDynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var parameters = dynamicParams.mysqlParameters;
            foreach (var item in parameters)
            {
                result.Add(item.ParameterName, item.Value);
            }
            return result;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this NpgsqlDynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var parameters = dynamicParams.npgsqlParameters;
            foreach (var item in parameters)
            {
                result.Add(item.ParameterName, item.Value);
            }
            return result;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this SQLiteDynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var parameters = dynamicParams.sqlliteParameters;
            foreach (var item in parameters)
            {
                result.Add(item.ParameterName, item.Value);
            }
            return result;
        }
    }
}
