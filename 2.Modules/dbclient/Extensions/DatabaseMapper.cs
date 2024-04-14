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

using dbclient.NativeParameters;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
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
        public static Dictionary<DataSourceTanantKey, DataSourceMap> DataSourceMappings = new Dictionary<DataSourceTanantKey, DataSourceMap>();
        public static Dictionary<string, StatementMap> StatementMappings = new Dictionary<string, StatementMap>();

        static DatabaseMapper()
        {
        }

        public static DataSourceMap? GetDataSourceMap(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;
            if (DataSourceMappings != null)
            {
                var dataSourceMaps = DataSourceMappings.Where(item =>
                    item.Value.ApplicationID == applicationID
                    && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)
                    && item.Key.DataSourceID == dataSourceID
                    && string.IsNullOrEmpty(item.Key.TanantPattern) == false
                ).ToList();

                for (int i = 0; i < dataSourceMaps.Count; i++)
                {
                    var dataSourceMap = dataSourceMaps[i];

                    string tanantPattern = dataSourceMap.Key.TanantPattern;
                    string tanantValue = dataSourceMap.Key.TanantValue;
                    for (int j = 0; j < queryObject.Parameters.Count; j++)
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

                    if (result == null && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
                    {
                        string userWorkID = string.Empty;
                        string appBasePath = string.Empty;
                        DirectoryInfo baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                        var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                        foreach (string directory in directories)
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(directory);
                            if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                            {
                                appBasePath = directoryInfo.FullName;
                                userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                                break;
                            }
                        }

                        string tenantID = $"{userWorkID}|{applicationID}";
                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (string.IsNullOrEmpty(appBasePath) == false && File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                        {
                            string appSettingText = File.ReadAllText(settingFilePath);
                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                            if (appSetting != null)
                            {
                                var dataSourceJson = appSetting.DataSource;
                                if (dataSourceJson != null)
                                {
                                    foreach (var item in dataSourceJson)
                                    {
                                        if (ModuleConfiguration.DataSource.Contains(item) == false)
                                        {
                                            item.ConnectionString = item.ConnectionString.Replace("{appBasePath}", appBasePath);
                                            ModuleConfiguration.DataSource.Add(item);
                                        }

                                        DataSourceTanantKey tanantMap = new DataSourceTanantKey();
                                        tanantMap.DataSourceID = item.DataSourceID;
                                        tanantMap.TanantPattern = item.TanantPattern;
                                        tanantMap.TanantValue = item.TanantValue;

                                        if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                        {
                                            DataSourceMap dataSourceMap = new DataSourceMap();
                                            dataSourceMap.ApplicationID = item.ApplicationID;
                                            dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();
                                            dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                                            dataSourceMap.ConnectionString = item.ConnectionString;

                                            if (item.IsEncryption.ParseBool() == true)
                                            {
                                                dataSourceMap.ConnectionString = DatabaseMapper.DecryptConnectionString(item);
                                            }

                                            if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                            {
                                                DataSourceMappings.Add(tanantMap, dataSourceMap);
                                            }
                                        }

                                        result = DataSourceMappings.FirstOrDefault(item =>
                                            item.Value.ApplicationID == applicationID
                                            && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)
                                            && item.Key.DataSourceID == dataSourceID
                                            && string.IsNullOrEmpty(item.Key.TanantPattern) == true
                                        ).Value;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        public static StatementMap? GetStatementMap(string queryID)
        {
            StatementMap? result = null;
            if (StatementMappings != null)
            {
                result = StatementMappings.FirstOrDefault(item => item.Key == queryID).Value;

                if (result == null && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
                {
                    var itemKeys = queryID.Split("|");
                    string applicationID = itemKeys[0];
                    string projectID = itemKeys[1];
                    string transactionID = itemKeys[2];

                    string userWorkID = string.Empty;
                    string appBasePath = string.Empty;
                    DirectoryInfo baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (string directory in directories)
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName;
                            userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                            break;
                        }
                    }

                    string tenantID = $"{userWorkID}|{applicationID}";
                    if (string.IsNullOrEmpty(appBasePath) == false && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(appBasePath) == true)
                    {
                        var sqlMapFile = Path.Combine(appBasePath, "dbclient", projectID, transactionID + ".xml");
                        try
                        {
                            if (File.Exists(sqlMapFile) == true)
                            {
                                FileInfo fileInfo = new FileInfo(sqlMapFile);
                                var htmlDocument = new HtmlDocument();
                                htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(sqlMapFile)));
                                HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                applicationID = (header.Element("application")?.InnerText).ToStringSafe();
                                projectID = (header.Element("project")?.InnerText).ToStringSafe();
                                transactionID = (header.Element("transaction")?.InnerText).ToStringSafe();
                                if (sqlMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
                                {
                                    applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                    projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                    transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                                }

                                var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                                if (items != null)
                                {
                                    foreach (var item in items)
                                    {
                                        if (header.Element("use").InnerText == "Y")
                                        {
                                            StatementMap statementMap = new StatementMap();
                                            statementMap.ApplicationID = applicationID;
                                            statementMap.ProjectID = projectID;
                                            statementMap.TransactionID = transactionID;
                                            statementMap.DataSourceID = item.Attributes["datasource"] == null ? header.Element("datasource").InnerText : item.Attributes["datasource"].Value;
                                            statementMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                            statementMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                            statementMap.Comment = item.Attributes["desc"].Value;
                                            statementMap.NativeDataClient = item.Attributes["native"] == null ? false : item.Attributes["native"].Value.ParseBool();
                                            statementMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                            statementMap.SQL = item.InnerHtml;

                                            string? beforetransaction = item.Attributes["before"]?.Value;
                                            if (string.IsNullOrEmpty(beforetransaction) == false)
                                            {
                                                statementMap.BeforeTransactionCommand = beforetransaction;
                                            }

                                            string? aftertransaction = item.Attributes["after"]?.Value;
                                            if (string.IsNullOrEmpty(aftertransaction) == false)
                                            {
                                                statementMap.AfterTransactionCommand = aftertransaction;
                                            }

                                            string? fallbacktransaction = item.Attributes["fallback"]?.Value;
                                            if (string.IsNullOrEmpty(fallbacktransaction) == false)
                                            {
                                                statementMap.FallbackTransactionCommand = fallbacktransaction;
                                            }

                                            statementMap.DbParameters = new List<DbParameterMap>();
                                            HtmlNodeCollection htmlNodes = item.SelectNodes("param");
                                            if (htmlNodes != null && htmlNodes.Count > 0)
                                            {
                                                foreach (HtmlNode paramNode in item.SelectNodes("param"))
                                                {
                                                    statementMap.DbParameters.Add(new DbParameterMap()
                                                    {
                                                        Name = paramNode.Attributes["id"].Value.ToString(),
                                                        DbType = paramNode.Attributes["type"].Value.ToString(),
                                                        Length = int.Parse(paramNode.Attributes["length"].Value.ToString()),
                                                        DefaultValue = paramNode.Attributes["value"].Value.ToString(),
                                                        TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                        Direction = paramNode.Attributes["direction"] == null ? "Input" : paramNode.Attributes["direction"].Value.ToString()
                                                    });
                                                }
                                            }

                                            var children = new HtmlDocument();
                                            children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                            children.LoadHtml(statementMap.SQL);
                                            statementMap.Chidren = children;

                                            string mappingQueryID = string.Concat(
                                                statementMap.ApplicationID, "|",
                                                statementMap.ProjectID, "|",
                                                statementMap.TransactionID, "|",
                                                statementMap.StatementID
                                            );

                                            lock (StatementMappings)
                                            {
                                                if (StatementMappings.ContainsKey(mappingQueryID) == true)
                                                {
                                                    StatementMappings.Remove(mappingQueryID);
                                                }

                                                StatementMappings.Add(mappingQueryID, statementMap);
                                            }

                                            result = statementMap;
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error(exception, "[{LogCategory}] " + $"{sqlMapFile} 업무 계약 파일 오류 - " + exception.ToMessage(), "DatabaseMapper/GetStatementMap");
                        }
                    }
                }
            }

            return result;
        }

        public static string DecryptConnectionString(DataSource? dataSource)
        {
            string result = "";
            if (dataSource != null)
            {
                try
                {
                    var values = dataSource.ConnectionString.SplitAndTrim('.');

                    string encrypt = values[0];
                    string decryptKey = values[1];
                    string hostName = values[2];
                    string hash = values[3];

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
            bool result = false;
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                string filePath = Path.Combine(basePath, fileRelativePath);
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
            bool result = false;
            lock (StatementMappings)
            {
                string queryID = string.Concat(
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
            bool result = false;
            string queryID = string.Concat(
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
            bool result = false;
            lock (StatementMappings)
            {
                try
                {
                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                    {
                        string filePath = Path.Combine(basePath, fileRelativePath);

                        if (File.Exists(filePath) == true)
                        {
                            var htmlDocument = new HtmlDocument();
                            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                            HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                            string applicationID = (header.Element("application")?.InnerText).ToStringSafe();
                            string projectID = (header.Element("project")?.InnerText).ToStringSafe();
                            string transactionID = (header.Element("transaction")?.InnerText).ToStringSafe();
                            if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
                            {
                                FileInfo fileInfo = new FileInfo(filePath);
                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if (header.Element("use").InnerText == "Y")
                                    {
                                        StatementMap statementMap = new StatementMap();
                                        statementMap.ApplicationID = applicationID;
                                        statementMap.ProjectID = projectID;
                                        statementMap.TransactionID = transactionID;
                                        statementMap.DataSourceID = item.Attributes["datasource"] == null ? header.Element("datasource").InnerText : item.Attributes["datasource"].Value;
                                        statementMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                        statementMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                        statementMap.Comment = item.Attributes["desc"].Value;
                                        statementMap.NativeDataClient = item.Attributes["native"] == null ? false : item.Attributes["native"].Value.ParseBool();
                                        statementMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                        statementMap.SQL = item.InnerHtml;

                                        string? beforetransaction = item.Attributes["before"]?.Value;
                                        if (string.IsNullOrEmpty(beforetransaction) == false)
                                        {
                                            statementMap.BeforeTransactionCommand = beforetransaction;
                                        }

                                        string? aftertransaction = item.Attributes["after"]?.Value;
                                        if (string.IsNullOrEmpty(aftertransaction) == false)
                                        {
                                            statementMap.AfterTransactionCommand = aftertransaction;
                                        }

                                        string? fallbacktransaction = item.Attributes["fallback"]?.Value;
                                        if (string.IsNullOrEmpty(fallbacktransaction) == false)
                                        {
                                            statementMap.FallbackTransactionCommand = fallbacktransaction;
                                        }

                                        statementMap.DbParameters = new List<DbParameterMap>();
                                        HtmlNodeCollection htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (HtmlNode paramNode in item.SelectNodes("param"))
                                            {
                                                statementMap.DbParameters.Add(new DbParameterMap()
                                                {
                                                    Name = paramNode.Attributes["id"].Value.ToString(),
                                                    DbType = paramNode.Attributes["type"].Value.ToString(),
                                                    Length = int.Parse(paramNode.Attributes["length"].Value.ToString()),
                                                    DefaultValue = paramNode.Attributes["value"].Value.ToString(),
                                                    TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                    Direction = paramNode.Attributes["direction"] == null ? "Input" : paramNode.Attributes["direction"].Value.ToString()
                                                });
                                            }
                                        }

                                        var children = new HtmlDocument();
                                        children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                        children.LoadHtml(statementMap.SQL);
                                        statementMap.Chidren = children;

                                        string queryID = string.Concat(
                                            statementMap.ApplicationID, "|",
                                            statementMap.ProjectID, "|",
                                            statementMap.TransactionID, "|",
                                            statementMap.StatementID
                                        );

                                        lock (StatementMappings)
                                        {
                                            if (StatementMappings.ContainsKey(queryID) == false)
                                            {
                                                StatementMappings.Add(queryID, statementMap);
                                            }
                                            else
                                            {
                                                if (forceUpdate == true)
                                                {
                                                    StatementMappings.Remove(queryID);
                                                    StatementMappings.Add(queryID, statementMap);
                                                }
                                                else
                                                {
                                                    logger.Error("[{LogCategory}] " + $"SqlMap 정보 중복 오류 - {filePath}, ProjectID - {statementMap.ApplicationID}, BusinessID - {statementMap.ProjectID}, TransactionID - {statementMap.TransactionID}, StatementID - {statementMap.StatementID}", "DatabaseMapper/AddStatementMap");
                                                }
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

        public static DynamicParameters GetSqlParameters(StatementMap statementMap, QueryObject queryObject)
        {
            DynamicParameters dynamicParameters = new DynamicParameters();
            if (queryObject.Parameters.Count() > 0)
            {
                List<DbParameterMap> dbParameterMaps = statementMap.DbParameters;
                foreach (DbParameterMap dbParameterMap in dbParameterMaps)
                {
                    DynamicParameter? dynamicParameter = GetDbParameterMap(dbParameterMap.Name, queryObject.Parameters);

                    if (dynamicParameter != null)
                    {
                        dynamicParameters.Add(
                            dynamicParameter.ParameterName,
                            dynamicParameter.Value,
                            (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType),
                            (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                            dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                        );
                    }
                }
            }

            return dynamicParameters;
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
            string resultType = "";

            JObject parameters = extractParameters(queryObject);

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
            htmlDocument.LoadHtml(statementMap.SQL);
            HtmlNode pretreatment = htmlDocument.DocumentNode.SelectSingleNode("//pretreatment");
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
            string result = string.Empty;

            JObject parameters = extractParameters(queryObject);

            HtmlDocument children = statementMap.Chidren;

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
            JObject parameters = new JObject();
            if (queryObject != null)
            {
                foreach (DynamicParameter item in queryObject.Parameters)
                {
                    object? value = null;
                    if (item.DbType == "String")
                    {
                        value = item.Value == null ? "" : item.Value.ToString();
                    }
                    else if (item.DbType == "Number")
                    {
                        string numberValue = item.Value.ToStringSafe();
                        bool isParse = int.TryParse(numberValue, out int intValue);
                        if (isParse == true)
                        {
                            value = intValue;
                        }
                        else
                        {
                            isParse = long.TryParse(numberValue, out long longValue);
                            if (isParse == true)
                            {
                                value = longValue;
                            }
                            else
                            {
                                isParse = decimal.TryParse(numberValue, out decimal decimalValue);
                                if (isParse == true)
                                {
                                    value = decimalValue;
                                }
                                else
                                {
                                    isParse = float.TryParse(numberValue, out float floatValue);
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
                            bool isParse = DateTime.TryParse(item.Value.ToString(), out dateTime);
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
            string result = "";
            string nodeType = htmlNode.NodeType.ToString();
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
            string result = "";
            // JArray list = Eval.Execute<JArray>(htmlNode.Attributes["collection"].Value, parameters);
            JArray? list = parameters[htmlNode.Attributes["collection"].Value] as JArray;
            if (list != null)
            {
                string item = htmlNode.Attributes["item"].Value;
                string open = htmlNode.Attributes["open"] == null ? "" : htmlNode.Attributes["open"].Value;
                string close = htmlNode.Attributes["close"] == null ? "" : htmlNode.Attributes["close"].Value;
                string separator = htmlNode.Attributes["separator"] == null ? "" : htmlNode.Attributes["separator"].Value;

                List<string> foreachTexts = new List<string>();
                foreach (var coll in list)
                {
                    var foreachParam = parameters;
                    foreachParam[item] = coll.Value<string>();

                    string foreachText = "";
                    foreach (var childNode in htmlNode.ChildNodes)
                    {
                        string childrenText = ConvertChildren(childNode, foreachParam);
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

            return result;
        }

        public static string ConvertIf(HtmlNode htmlNode, JObject parameters)
        {
            string evalString = htmlNode.Attributes["test"].Value;
            evalString = ReplaceEvalString(evalString, parameters);
            evalString = evalString.Replace(" and ", " && ");
            evalString = evalString.Replace(" or ", " || ");
            string evalText = evalString.Replace("'", "\"");

            // bool evalResult = Eval.Execute<bool>(evalText, parameters);
            string line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line.Replace("#", "$"));
            bool evalResult = queryable.Any(evalText);

            string convertString = "";
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
            string bindID = htmlNode.Attributes["name"].Value;
            string evalString = htmlNode.Attributes["value"].Value;
            evalString = ReplaceEvalString(evalString, parameters);
            string evalText = evalString.Replace("'", "\"");

            // string evalResult = Eval.Execute<string>(evalText, parameters);
            string evalResult = evalText;
            string line = JsonUtils.GenerateDynamicLinqStatement(parameters);
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
            string convertString = htmlNode.InnerText;
            if (parameters != null && parameters.Count > 0)
            {
                string keyString = "";
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
                            string name = parameter.Key;
                            string value = parameter.Value.ToStringSafe();

                            name = name.StartsWith("$") == true ? "\\" + name : name;
                            value = value.Replace("\"", "\\\"").Replace("'", "''");
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
                    string replacePrefix = "";
                    string replacePostfix = "";
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
            Regex cdataRegex = new Regex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)");
            var matches = cdataRegex.Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    string[] matchSplit = Regex.Split(match.Value, "(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)");
                    string cdataText = matchSplit[2];
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
                    if (Directory.Exists(basePath) == false)
                    {
                        continue;
                    }

                    logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "DatabaseMapper/LoadContract");

                    string[] sqlMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                    foreach (string sqlMapFile in sqlMapFiles)
                    {
                        try
                        {
                            FileInfo fileInfo = new FileInfo(sqlMapFile);
                            var htmlDocument = new HtmlDocument();
                            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(sqlMapFile)));
                            HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                            string applicationID = (header.Element("application")?.InnerText).ToStringSafe();
                            string projectID = (header.Element("project")?.InnerText).ToStringSafe();
                            string transactionID = (header.Element("transaction")?.InnerText).ToStringSafe();
                            if (sqlMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
                            {
                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if (header.Element("use").InnerText == "Y")
                                    {
                                        StatementMap statementMap = new StatementMap();
                                        statementMap.ApplicationID = applicationID;
                                        statementMap.ProjectID = projectID;
                                        statementMap.TransactionID = transactionID;
                                        statementMap.DataSourceID = item.Attributes["datasource"] == null ? header.Element("datasource").InnerText : item.Attributes["datasource"].Value;
                                        statementMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                        statementMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                        statementMap.Comment = item.Attributes["desc"].Value;
                                        statementMap.NativeDataClient = item.Attributes["native"] == null ? false : item.Attributes["native"].Value.ParseBool();
                                        statementMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                        statementMap.SQL = item.InnerHtml;

                                        string? beforetransaction = item.Attributes["before"]?.Value;
                                        if (string.IsNullOrEmpty(beforetransaction) == false)
                                        {
                                            statementMap.BeforeTransactionCommand = beforetransaction;
                                        }

                                        string? aftertransaction = item.Attributes["after"]?.Value;
                                        if (string.IsNullOrEmpty(aftertransaction) == false)
                                        {
                                            statementMap.AfterTransactionCommand = aftertransaction;
                                        }

                                        string? fallbacktransaction = item.Attributes["fallback"]?.Value;
                                        if (string.IsNullOrEmpty(fallbacktransaction) == false)
                                        {
                                            statementMap.FallbackTransactionCommand = fallbacktransaction;
                                        }

                                        statementMap.DbParameters = new List<DbParameterMap>();
                                        HtmlNodeCollection htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (HtmlNode paramNode in item.SelectNodes("param"))
                                            {
                                                statementMap.DbParameters.Add(new DbParameterMap()
                                                {
                                                    Name = paramNode.Attributes["id"].Value.ToString(),
                                                    DbType = paramNode.Attributes["type"].Value.ToString(),
                                                    Length = int.Parse(paramNode.Attributes["length"].Value.ToString()),
                                                    DefaultValue = paramNode.Attributes["value"].Value.ToString(),
                                                    TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                    Direction = paramNode.Attributes["direction"] == null ? "Input" : paramNode.Attributes["direction"].Value.ToString()
                                                });
                                            }
                                        }

                                        var children = new HtmlDocument();
                                        children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                        children.LoadHtml(statementMap.SQL);
                                        statementMap.Chidren = children;

                                        string queryID = string.Concat(
                                            statementMap.ApplicationID, "|",
                                            statementMap.ProjectID, "|",
                                            statementMap.TransactionID, "|",
                                            statementMap.StatementID
                                        );

                                        lock (StatementMappings)
                                        {
                                            if (StatementMappings.ContainsKey(queryID) == false)
                                            {
                                                StatementMappings.Add(queryID, statementMap);
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
                    DataSourceTanantKey tanantMap = new DataSourceTanantKey();
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
                        DataSourceMap dataSourceMap = new DataSourceMap();
                        dataSourceMap.ApplicationID = item.ApplicationID;
                        dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();
                        dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                        dataSourceMap.ConnectionString = item.ConnectionString;

                        if (item.IsEncryption.ParseBool() == true)
                        {
                            dataSourceMap.ConnectionString = DatabaseMapper.DecryptConnectionString(item);
                        }

                        DataSourceMappings.Add(tanantMap, dataSourceMap);
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

    [JsonObject(MemberSerialization.OptIn)]
    public class StatementMap
    {
        [JsonProperty]
        public string ApplicationID { get; set; }

        [JsonProperty]
        public string ProjectID { get; set; }

        [JsonProperty]
        public string TransactionID { get; set; }

        [JsonProperty]
        public string DataSourceID { get; set; }

        [JsonProperty]
        public string StatementID { get; set; }

        [JsonProperty]
        public int Seq { get; set; }

        [JsonProperty]
        public string Comment { get; set; }

        [JsonProperty]
        public bool NativeDataClient { get; set; }

        [JsonProperty]
        public string SQL { get; set; }

        [JsonProperty]
        public bool TransactionLog { get; set; }

        [JsonProperty]
        public int Timeout { get; set; }

        [JsonProperty]
        public string BeforeTransactionCommand { get; set; }

        [JsonProperty]
        public string AfterTransactionCommand { get; set; }

        [JsonProperty]
        public string FallbackTransactionCommand { get; set; }

        [JsonProperty]
        public List<DbParameterMap> DbParameters { get; set; }

        public HtmlDocument Chidren { get; set; }

        [JsonProperty]
        public DateTime ModifiedAt { get; set; }

        public StatementMap()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            DataSourceID = "";
            StatementID = "";
            Seq = 0;
            Comment = "";
            NativeDataClient = false;
            SQL = "";
            TransactionLog = false;
            Timeout = 0;
            BeforeTransactionCommand = "";
            AfterTransactionCommand = "";
            FallbackTransactionCommand = "";
            DbParameters = new List<DbParameterMap>();
            Chidren = new HtmlDocument();
            ModifiedAt = DateTime.MinValue;
        }
    }

    public class DataSourceMap
    {
        public string ApplicationID { get; set; }

        public List<string> ProjectListID { get; set; }

        public DataProviders DataProvider { get; set; }

        public string ConnectionString { get; set; }

        public DataSourceMap()
        {
            ApplicationID = "";
            ProjectListID = new List<string>();
            DataProvider = DataProviders.SqlServer;
            ConnectionString = "";
        }
    }

    public class DataSourceTanantKey
    {
        public string DataSourceID { get; set; }

        public string TanantPattern { get; set; }

        public string TanantValue { get; set; }

        public DataSourceTanantKey()
        {
            DataSourceID = "";
            TanantPattern = "";
            TanantValue = "";
        }
    }

    public class DbParameterMap
    {
        public string Name { get; set; }

        public string DefaultValue { get; set; }

        public string TestValue { get; set; }

        public string DbType { get; set; }

        public int Length { get; set; }

        public string Direction { get; set; }

        public DbParameterMap()
        {
            Name = "";
            DefaultValue = "";
            TestValue = "";
            DbType = "";
            Length = 0;
            Direction = "";
        }
    }
}
