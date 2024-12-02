using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Text;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using HtmlAgilityPack;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Entity;
using prompter.Enumeration;

using Serilog;

namespace prompter.Extensions
{
    public static class PromptMapper
    {
        private static Random random = new Random();
        public static ExpiringDictionary<DataSourceTanantKey, DataSourceMap> DataSourceMappings = new ExpiringDictionary<DataSourceTanantKey, DataSourceMap>();
        public static ExpiringDictionary<string, PromptMap> PromptMappings = new ExpiringDictionary<string, PromptMap>();

        static PromptMapper()
        {
        }

        public static DataSourceMap? GetDataSourceMap(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;
            lock (DataSourceMappings)
            {
                result = FindDataSourceMap(queryObject, applicationID, projectID, dataSourceID);

                if (result == null)
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
                                    DataSourceTanantKey tanantMap = new DataSourceTanantKey();
                                    tanantMap.DataSourceID = item.DataSourceID;
                                    tanantMap.TanantPattern = item.TanantPattern;
                                    tanantMap.TanantValue = item.TanantValue;

                                    if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                    {
                                        DataSourceMap dataSourceMap = new DataSourceMap();
                                        dataSourceMap.ApplicationID = item.ApplicationID;
                                        dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();
                                        dataSourceMap.LLMProvider = (LLMProviders)Enum.Parse(typeof(LLMProviders), item.DataProvider);
                                        dataSourceMap.ApiKey = item.ApiKey;
                                        dataSourceMap.ModelID = item.ModelID;
                                        dataSourceMap.Endpoint = item.Endpoint;

                                        if (item.IsEncryption.ParseBool() == true)
                                        {
                                            item.ApiKey = DecryptApiKey(item);
                                        }

                                        if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                        {
                                            DataSourceMappings.Add(tanantMap, dataSourceMap);
                                        }
                                    }
                                }

                                result = FindDataSourceMap(queryObject, applicationID, projectID, dataSourceID);
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
            }

            return result;
        }

        public static PromptMap? GetPromptMap(string queryID)
        {
            PromptMap? result = null;
            lock (PromptMappings)
            {
                result = PromptMappings.FirstOrDefault(item => item.Key == queryID).Value;

                if (result == null)
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

                    if (string.IsNullOrEmpty(appBasePath) == false && Directory.Exists(appBasePath) == true)
                    {
                        var filePath = Path.Combine(appBasePath, "prompter", projectID, transactionID + ".xml");
                        try
                        {
                            if (File.Exists(filePath) == true)
                            {
                                FileInfo fileInfo = new FileInfo(filePath);
                                var htmlDocument = new HtmlDocument();
                                htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                                HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;

                                var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                                if (items != null)
                                {
                                    foreach (var item in items)
                                    {
                                        if ($"{header.Element("use")?.InnerText}".ToBoolean() == true)
                                        {
                                            PromptMap promptMap = new PromptMap();
                                            promptMap.ApplicationID = applicationID;
                                            promptMap.ProjectID = projectID;
                                            promptMap.TransactionID = transactionID;
                                            promptMap.DataSourceID = item.Attributes["datasource"] == null ? header.Element("datasource").InnerText : item.Attributes["datasource"].Value;
                                            promptMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                            promptMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                            promptMap.Comment = item.Attributes["desc"].Value;
                                            promptMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                            promptMap.MaxTokens = item.Attributes["maxtoken"] == null ? 4000 : item.Attributes["maxtoken"].Value.ParseInt(4000);
                                            promptMap.Temperature = item.Attributes["temperature"] == null ? 1.0 : item.Attributes["temperature"].Value.ParseDouble(1.0);
                                            promptMap.TopP = item.Attributes["topp"] == null ? 1.0 : item.Attributes["topp"].Value.ParseDouble(1.0);
                                            promptMap.PresencePenalty = item.Attributes["presence"] == null ? 1.0 : item.Attributes["presence"].Value.ParseDouble(0.0);
                                            promptMap.FrequencyPenalty = item.Attributes["frequency"] == null ? 1.0 : item.Attributes["frequency"].Value.ParseDouble(0.0);
                                            promptMap.Prompt = item.InnerHtml;

                                            promptMap.InputVariables = new List<InputVariableMap>();
                                            HtmlNodeCollection htmlNodes = item.SelectNodes("param");
                                            if (htmlNodes != null && htmlNodes.Count > 0)
                                            {
                                                foreach (HtmlNode paramNode in item.SelectNodes("param"))
                                                {
                                                    promptMap.InputVariables.Add(new InputVariableMap()
                                                    {
                                                        Name = paramNode.Attributes["id"].Value.ToString(),
                                                        IsRequired = paramNode.Attributes["required"] == null ? false : paramNode.Attributes["required"].Value.ToBoolean(),
                                                        DefaultValue = paramNode.Attributes["value"].Value.ToString(),
                                                        TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                        Description = paramNode.Attributes["desc"] == null ? "" : paramNode.Attributes["desc"].Value.ToString()
                                                    });
                                                }
                                            }

                                            var children = new HtmlDocument();
                                            children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                            children.LoadHtml(promptMap.Prompt);
                                            promptMap.Chidren = children;

                                            string mappingQueryID = string.Concat(
                                                promptMap.ApplicationID, "|",
                                                promptMap.ProjectID, "|",
                                                promptMap.TransactionID, "|",
                                                promptMap.StatementID
                                            );

                                            if (PromptMappings.ContainsKey(mappingQueryID) == true)
                                            {
                                                PromptMappings.Remove(mappingQueryID);
                                            }

                                            PromptMappings.Add(mappingQueryID, promptMap);
                                        }
                                    }

                                    result = PromptMappings.FirstOrDefault(item => item.Key == queryID).Value;
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error(exception, "[{LogCategory}] " + $"{filePath} 업무 계약 파일 오류 - " + exception.ToMessage(), "PromptMapper/GetPromptMap");
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
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(dataSource)} 확인 필요: " + exception.ToMessage(), "PromptMapper/DecryptConnectionString");
                }
            }

            return result;
        }

        public static string DecryptApiKey(DataSource? dataSource)
        {
            string result = "";
            if (dataSource != null)
            {
                try
                {
                    var values = dataSource.ApiKey.SplitAndTrim('.');

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
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(dataSource)} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptApiKey");
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
            lock (PromptMappings)
            {
                string queryID = string.Concat(
                    projectID, "|",
                    businessID, "|",
                    transactionID, "|",
                    statementID
                );

                if (PromptMappings.ContainsKey(queryID) == true)
                {
                    result = PromptMappings.Remove(queryID);
                }
            }

            return result;
        }

        public static bool HasPrompt(string projectID, string businessID, string transactionID, string statementID)
        {
            bool result = false;
            string queryID = string.Concat(
                projectID, "|",
                businessID, "|",
                transactionID, "|",
                statementID
            );

            result = PromptMappings.ContainsKey(queryID);

            return result;
        }

        public static bool AddPromptMap(string fileRelativePath, bool forceUpdate, ILogger logger)
        {
            bool result = false;
            lock (PromptMappings)
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
                            bool isTenantContractFile = false;
                            if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                isTenantContractFile = true;
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
                                    if ($"{header.Element("use")?.InnerText}".ToBoolean() == true)
                                    {
                                        PromptMap promptMap = new PromptMap();
                                        promptMap.ApplicationID = applicationID;
                                        promptMap.ProjectID = projectID;
                                        promptMap.TransactionID = transactionID;
                                        promptMap.DataSourceID = item.Attributes["datasource"] == null ? header.Element("datasource").InnerText : item.Attributes["datasource"].Value;
                                        promptMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                        promptMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                        promptMap.Comment = item.Attributes["desc"].Value;
                                        promptMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                        promptMap.MaxTokens = item.Attributes["maxtoken"] == null ? 4000 : item.Attributes["maxtoken"].Value.ParseInt(4000);
                                        promptMap.Temperature = item.Attributes["temperature"] == null ? 1.0 : item.Attributes["temperature"].Value.ParseDouble(1.0);
                                        promptMap.TopP = item.Attributes["topp"] == null ? 1.0 : item.Attributes["topp"].Value.ParseDouble(1.0);
                                        promptMap.PresencePenalty = item.Attributes["presence"] == null ? 1.0 : item.Attributes["presence"].Value.ParseDouble(0.0);
                                        promptMap.FrequencyPenalty = item.Attributes["frequency"] == null ? 1.0 : item.Attributes["frequency"].Value.ParseDouble(0.0);
                                        promptMap.Prompt = item.InnerHtml;

                                        promptMap.InputVariables = new List<InputVariableMap>();
                                        HtmlNodeCollection htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (HtmlNode paramNode in item.SelectNodes("param"))
                                            {
                                                promptMap.InputVariables.Add(new InputVariableMap()
                                                {
                                                    Name = paramNode.Attributes["id"].Value.ToString(),
                                                    IsRequired = paramNode.Attributes["required"] == null ? false : paramNode.Attributes["required"].Value.ToBoolean(),
                                                    DefaultValue = paramNode.Attributes["value"].Value.ToString(),
                                                    TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                    Description = paramNode.Attributes["desc"] == null ? "" : paramNode.Attributes["desc"].Value.ToString()
                                                });
                                            }
                                        }

                                        var children = new HtmlDocument();
                                        children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                        children.LoadHtml(promptMap.Prompt);
                                        promptMap.Chidren = children;

                                        string queryID = string.Concat(
                                            promptMap.ApplicationID, "|",
                                            promptMap.ProjectID, "|",
                                            promptMap.TransactionID, "|",
                                            promptMap.StatementID
                                        );

                                        lock (PromptMappings)
                                        {
                                            if (PromptMappings.ContainsKey(queryID) == false)
                                            {
                                                if (isTenantContractFile == true)
                                                {
                                                    PromptMappings.Add(queryID, promptMap);
                                                }
                                                else
                                                {
                                                    PromptMappings.Add(queryID, promptMap, TimeSpan.FromDays(36500));
                                                }
                                            }
                                            else
                                            {
                                                if (forceUpdate == true)
                                                {
                                                    PromptMappings.Remove(queryID);
                                                    if (isTenantContractFile == true)
                                                    {
                                                        PromptMappings.Add(queryID, promptMap);
                                                    }
                                                    else
                                                    {
                                                        PromptMappings.Add(queryID, promptMap, TimeSpan.FromDays(36500));
                                                    }
                                                }
                                                else
                                                {
                                                    logger.Error("[{LogCategory}] " + $"PromptMap 정보 중복 오류 - {filePath}, ProjectID - {promptMap.ApplicationID}, BusinessID - {promptMap.ProjectID}, TransactionID - {promptMap.TransactionID}, StatementID - {promptMap.StatementID}", "PromptMapper/AddPromptMap");
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
                    logger.Error("[{LogCategory}] " + $"{fileRelativePath} 업무 계약 파일 오류 - " + exception.ToMessage(), "PromptMapper/AddPromptMap");
                }
            }

            return result;
        }

        public static (string? Command, string? Parameters, string ResultType, string ArgumentMap) FindTransaction(PromptMap promptMap, QueryObject? queryObject)
        {
            string? command = null;
            string? arguments = null;
            string resultType = "Form";
            string argumentMap = "N";

            JObject parameters = extractParameters(queryObject);

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
            htmlDocument.LoadHtml(promptMap.Prompt);
            HtmlNode htmlNode = htmlDocument.DocumentNode.SelectSingleNode("//transaction");
            if (htmlNode != null)
            {
                var attrCommand = htmlNode.Attributes["command"];
                if (attrCommand != null && string.IsNullOrEmpty(attrCommand.Value) == false)
                {
                    command = attrCommand.Value;
                }

                var attrInterface = htmlNode.Attributes["resultType"];
                if (attrInterface != null && string.IsNullOrEmpty(attrInterface.Value) == false)
                {
                    resultType = attrInterface.Value;
                }

                var attrArgumentMap = htmlNode.Attributes["argumentMap"];
                if (attrArgumentMap != null && string.IsNullOrEmpty(attrArgumentMap.Value) == false)
                {
                    argumentMap = attrArgumentMap.Value;
                }

                var children = new HtmlDocument();
                children.OptionDefaultStreamEncoding = Encoding.UTF8;
                children.LoadHtml(htmlNode.InnerHtml);

                var childNodes = children.DocumentNode.ChildNodes;
                foreach (var childNode in childNodes)
                {
                    arguments = arguments + ConvertChildren(childNode, parameters);
                }
            }

            if (arguments != null)
            {
                arguments = arguments + new string(' ', random.Next(1, 10));
            }

            return (command, arguments, resultType, argumentMap);
        }

        public static string Find(PromptMap promptMap, QueryObject? queryObject)
        {
            string result = string.Empty;

            JObject parameters = extractParameters(queryObject);

            HtmlDocument children = promptMap.Chidren;

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
                Log.Error("[{LogCategory}] " + exception.ToMessage(), "PromptMapper/ConvertParameter");
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
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                    {
                        continue;
                    }

                    logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "PromptMapper/LoadContract");

                    string[] promptMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                    foreach (string promptMapFile in promptMapFiles)
                    {
                        try
                        {
                            FileInfo fileInfo = new FileInfo(promptMapFile);
                            var htmlDocument = new HtmlDocument();
                            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(promptMapFile)));
                            HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                            string applicationID = (header.Element("application")?.InnerText).ToStringSafe();
                            string projectID = (header.Element("project")?.InnerText).ToStringSafe();
                            string transactionID = (header.Element("transaction")?.InnerText).ToStringSafe();

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if ($"{header.Element("use")?.InnerText}".ToBoolean() == true)
                                    {
                                        PromptMap promptMap = new PromptMap();
                                        promptMap.ApplicationID = applicationID;
                                        promptMap.ProjectID = projectID;
                                        promptMap.TransactionID = transactionID;
                                        promptMap.DataSourceID = item.Attributes["datasource"] == null ? header.Element("datasource").InnerText : item.Attributes["datasource"].Value;
                                        promptMap.StatementID = item.Attributes["id"].Value + item.Attributes["seq"].Value.PadLeft(2, '0');
                                        promptMap.Seq = int.Parse(item.Attributes["seq"].Value);
                                        promptMap.Comment = item.Attributes["desc"].Value;
                                        promptMap.Timeout = int.Parse(item.Attributes["timeout"].Value);
                                        promptMap.MaxTokens = item.Attributes["maxtoken"] == null ? 4000 : item.Attributes["maxtoken"].Value.ParseInt(4000);
                                        promptMap.Temperature = item.Attributes["temperature"] == null ? 1.0 : item.Attributes["temperature"].Value.ParseDouble(1.0);
                                        promptMap.TopP = item.Attributes["topp"] == null ? 1.0 : item.Attributes["topp"].Value.ParseDouble(1.0);
                                        promptMap.PresencePenalty = item.Attributes["presence"] == null ? 1.0 : item.Attributes["presence"].Value.ParseDouble(0.0);
                                        promptMap.FrequencyPenalty = item.Attributes["frequency"] == null ? 1.0 : item.Attributes["frequency"].Value.ParseDouble(0.0);
                                        promptMap.Prompt = item.InnerHtml;

                                        promptMap.InputVariables = new List<InputVariableMap>();
                                        HtmlNodeCollection htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (HtmlNode paramNode in item.SelectNodes("param"))
                                            {
                                                promptMap.InputVariables.Add(new InputVariableMap()
                                                {
                                                    Name = paramNode.Attributes["id"].Value.ToString(),
                                                    IsRequired = paramNode.Attributes["required"] == null ? false : paramNode.Attributes["required"].Value.ToBoolean(),
                                                    DefaultValue = paramNode.Attributes["value"].Value.ToString(),
                                                    TestValue = paramNode.Attributes["test"] == null ? "" : paramNode.Attributes["test"].Value.ToString(),
                                                    Description = paramNode.Attributes["desc"] == null ? "" : paramNode.Attributes["desc"].Value.ToString()
                                                });
                                            }
                                        }

                                        var children = new HtmlDocument();
                                        children.OptionDefaultStreamEncoding = Encoding.UTF8;
                                        children.LoadHtml(promptMap.Prompt);
                                        promptMap.Chidren = children;

                                        string queryID = string.Concat(
                                            promptMap.ApplicationID, "|",
                                            promptMap.ProjectID, "|",
                                            promptMap.TransactionID, "|",
                                            promptMap.StatementID
                                        );

                                        lock (PromptMappings)
                                        {
                                            if (PromptMappings.ContainsKey(queryID) == false)
                                            {
                                                PromptMappings.Add(queryID, promptMap, TimeSpan.FromDays(36500));
                                            }
                                            else
                                            {
                                                logger.Warning("[{LogCategory}] " + $"PromptMap 정보 중복 오류 - {promptMapFile}, ApplicationID - {promptMap.ApplicationID}, ProjectID - {promptMap.ProjectID}, TransactionID - {promptMap.TransactionID}, StatementID - {promptMap.StatementID}", "PromptMapper/LoadContract");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            logger.Error("[{LogCategory}] " + $"{promptMapFile} 업무 계약 파일 오류 - " + exception.ToMessage(), "PromptMapper/LoadContract");
                        }
                    }
                }

                foreach (var item in ModuleConfiguration.LLMSource)
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
                        dataSourceMap.LLMProvider = (LLMProviders)Enum.Parse(typeof(LLMProviders), item.LLMProvider);
                        dataSourceMap.ApiKey = item.ApiKey;
                        dataSourceMap.ModelID = item.ModelID;
                        dataSourceMap.Endpoint = item.Endpoint;

                        if (item.IsEncryption.ParseBool() == true)
                        {
                            item.ApiKey = DecryptApiKey(item);
                        }

                        DataSourceMappings.Add(tanantMap, dataSourceMap, TimeSpan.FromDays(36500));
                    }
                    else
                    {
                        Log.Logger.Warning("[{LogCategory}] " + $"DataSourceMap 정보 중복 확인 필요 - ApplicationID - {item.ApplicationID}, ProjectID - {item.ProjectID}, DataSourceID - {item.DataSourceID}, DataProvider - {item.DataProvider}, TanantPattern - {item.TanantPattern}, TanantValue - {item.TanantValue}", "PromptMapper/LoadContract");
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"LoadContract 오류 - " + exception.ToMessage(), "PromptMapper/LoadContract");
            }
        }
    }
}
