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

        public static List<PromptMap> LoadPromptMapsFromFile(string filePath, bool isTenantContractFile)
        {
            var result = new List<PromptMap>();
            if (File.Exists(filePath) == false)
            {
                return result;
            }

            var fileInfo = new FileInfo(filePath);
            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
            result = CreatePromptMaps(htmlDocument, fileInfo, isTenantContractFile);

            return result;
        }

        public static string BuildQueryID(PromptMap promptMap)
        {
            return string.Concat(
                promptMap.ApplicationID, "|",
                promptMap.ProjectID, "|",
                promptMap.TransactionID, "|",
                promptMap.StatementID
            );
        }

        public static bool AddPromptMapsToCache(List<PromptMap> promptMaps, bool forceUpdate, bool isTenantContractFile, string sourcePath, ILogger logger)
        {
            var result = false;
            foreach (var promptMap in promptMaps)
            {
                var queryID = BuildQueryID(promptMap);
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

                    result = true;
                }
                else if (forceUpdate == true)
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

                    result = true;
                }
                else
                {
                    logger.Warning("[{LogCategory}] " + $"PromptMap 정보 중복 오류 - {sourcePath}, ApplicationID - {promptMap.ApplicationID}, ProjectID - {promptMap.ProjectID}, TransactionID - {promptMap.TransactionID}, StatementID - {promptMap.StatementID}", "PromptMapper/AddPromptMapsToCache");
                }
            }

            return result;
        }

        private static List<PromptMap> CreatePromptMaps(HtmlDocument htmlDocument, FileInfo fileInfo, bool isTenantContractFile)
        {
            var result = new List<PromptMap>();
            var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");
            if (header == null || $"{header.Element("use")?.InnerText}".ToBoolean() == false)
            {
                return result;
            }

            var applicationID = (header.Element("application")?.InnerText).ToStringSafe();
            var projectID = (header.Element("project")?.InnerText).ToStringSafe();
            var transactionID = (header.Element("transaction")?.InnerText).ToStringSafe();

            if (isTenantContractFile == true)
            {
                applicationID = string.IsNullOrEmpty(applicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                projectID = string.IsNullOrEmpty(projectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                transactionID = string.IsNullOrEmpty(transactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
            }

            var items = htmlDocument.DocumentNode.SelectNodes("//prompts/statement");
            if (items == null)
            {
                return result;
            }

            foreach (var item in items)
            {
                var promptMap = new PromptMap();
                promptMap.ApplicationID = applicationID;
                promptMap.ProjectID = projectID;
                promptMap.TransactionID = transactionID;
                promptMap.DataSourceID = item.Attributes["datasource"] == null ? (header.Element("datasource")?.InnerText).ToStringSafe() : item.Attributes["datasource"].Value;
                promptMap.StatementID = GetAttributeValue(item, "id") + GetAttributeValue(item, "seq").PadLeft(2, '0');
                promptMap.Seq = GetAttributeValue(item, "seq").ParseInt(0);
                promptMap.Comment = GetAttributeValue(item, "desc");
                promptMap.Timeout = GetAttributeValue(item, "timeout").ParseInt(0);
                promptMap.MaxTokens = GetAttributeValue(item, "maxtokens", "maxtoken").ParseInt(4000);
                promptMap.Temperature = GetAttributeValue(item, "temperature").ParseDouble(1.0);
                promptMap.TopP = GetAttributeValue(item, "topp").ParseDouble(1.0);
                promptMap.PresencePenalty = GetAttributeValue(item, "presence").ParseDouble(0.0);
                promptMap.FrequencyPenalty = GetAttributeValue(item, "frequency").ParseDouble(0.0);
                promptMap.TransactionLog = GetAttributeValue(item, "transactionlog", "log").ToBoolean();
                promptMap.Prompt = item.InnerHtml;
                promptMap.InputVariables = ParseInputVariables(item);
                promptMap.Tools = ParseTools(item);
                promptMap.Authorization = ParseAuthorization(item);
                promptMap.Headers = ParseHeaders(item);
                promptMap.Body = ParseBody(item);

                var children = new HtmlDocument();
                children.OptionDefaultStreamEncoding = Encoding.UTF8;
                children.LoadHtml(promptMap.Prompt);
                promptMap.Chidren = children;
                promptMap.ModifiedAt = fileInfo.Exists == true ? fileInfo.LastWriteTime : DateTime.Now;

                result.Add(promptMap);
            }

            return result;
        }

        private static List<InputVariableMap> ParseInputVariables(HtmlNode statementNode)
        {
            var result = new List<InputVariableMap>();
            var htmlNodes = statementNode.SelectNodes("param");
            if (htmlNodes != null && htmlNodes.Count > 0)
            {
                foreach (var paramNode in htmlNodes)
                {
                    result.Add(new InputVariableMap()
                    {
                        Name = GetAttributeValue(paramNode, "id"),
                        IsRequired = GetAttributeValue(paramNode, "required").ToBoolean(),
                        DefaultValue = GetAttributeValue(paramNode, "value"),
                        TestValue = GetAttributeValue(paramNode, "test"),
                        Description = GetAttributeValue(paramNode, "desc")
                    });
                }
            }

            return result;
        }

        private static PromptToolSettings ParseTools(HtmlNode statementNode)
        {
            var result = new PromptToolSettings();
            var toolsNode = statementNode.SelectSingleNode("tools");
            if (toolsNode == null)
            {
                return result;
            }

            var mode = GetAttributeValue(toolsNode, "mode").ToLowerInvariant();
            result.Mode = mode == "auto" || mode == "required" ? mode : "none";
            result.MaxRounds = GetAttributeValue(toolsNode, "maxrounds").ParseInt(3);

            foreach (var childNode in toolsNode.ChildNodes.Where(item => item.NodeType == HtmlNodeType.Element))
            {
                var kind = childNode.Name.ToLowerInvariant();
                if (kind != "kernel" && kind != "mcp" && kind != "cli")
                {
                    continue;
                }

                result.Items.Add(new PromptToolDeclaration
                {
                    Kind = kind,
                    Name = GetAttributeValue(childNode, "name"),
                    Functions = GetAttributeValue(childNode, "functions"),
                    Command = GetAttributeValue(childNode, "command"),
                    Args = GetAttributeValue(childNode, "args"),
                    Timeout = GetAttributeValue(childNode, "timeout").ParseInt(0)
                });
            }

            return result;
        }

        private static PromptAuthorization ParseAuthorization(HtmlNode statementNode)
        {
            var result = new PromptAuthorization();
            var node = statementNode.SelectSingleNode("authorization");
            if (node == null)
            {
                return result;
            }

            result.Type = GetAttributeValue(node, "type");
            result.Value = GetAttributeValue(node, "value");
            result.Username = GetAttributeValue(node, "username");
            result.Password = GetAttributeValue(node, "password");
            result.Name = GetAttributeValue(node, "name");
            result.Location = string.IsNullOrWhiteSpace(GetAttributeValue(node, "location")) == true ? "header" : GetAttributeValue(node, "location").ToLowerInvariant();

            return result;
        }

        private static List<PromptHeader> ParseHeaders(HtmlNode statementNode)
        {
            var result = new List<PromptHeader>();
            var headerNodes = statementNode.SelectNodes("headers/header");
            if (headerNodes == null)
            {
                return result;
            }

            foreach (var item in headerNodes)
            {
                result.Add(new PromptHeader
                {
                    Name = GetAttributeValue(item, "name"),
                    Value = GetAttributeValue(item, "value")
                });
            }

            return result;
        }

        private static PromptBody ParseBody(HtmlNode statementNode)
        {
            var result = new PromptBody();
            var node = statementNode.SelectSingleNode("body");
            if (node == null)
            {
                return result;
            }

            result.Type = GetAttributeValue(node, "type");
            result.RawText = node.InnerText.ToStringSafe().Trim();
            foreach (var childNode in node.ChildNodes.Where(item => item.NodeType == HtmlNodeType.Element))
            {
                if (childNode.Name != "field" && childNode.Name != "part" && childNode.Name != "file")
                {
                    continue;
                }

                var type = GetAttributeValue(childNode, "type");
                if (string.IsNullOrWhiteSpace(type) == true)
                {
                    type = childNode.Name == "file" ? "file" : "field";
                }

                result.Parts.Add(new PromptBodyPart
                {
                    Type = type.ToLowerInvariant(),
                    Name = GetAttributeValue(childNode, "name"),
                    Value = string.IsNullOrWhiteSpace(GetAttributeValue(childNode, "value")) == true ? childNode.InnerText.ToStringSafe() : GetAttributeValue(childNode, "value"),
                    Path = GetAttributeValue(childNode, "path"),
                    Base64 = GetAttributeValue(childNode, "base64"),
                    FileName = GetAttributeValue(childNode, "filename", "fileName"),
                    ContentType = string.IsNullOrWhiteSpace(GetAttributeValue(childNode, "contenttype", "contentType")) == true ? "application/octet-stream" : GetAttributeValue(childNode, "contenttype", "contentType")
                });
            }

            return result;
        }

        private static string GetAttributeValue(HtmlNode node, params string[] names)
        {
            foreach (var name in names)
            {
                var attribute = node.Attributes[name];
                if (attribute != null)
                {
                    return attribute.Value.ToStringSafe();
                }
            }

            return "";
        }

        public static LLMProviders ParseLLMProvider(string provider)
        {
            if (Enum.TryParse(provider, true, out LLMProviders result) == true)
            {
                return result;
            }

            return LLMProviders.OpenAI;
        }

        public static DataSourceMap? GetDataSourceMap(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;
            lock (DataSourceMappings)
            {
                result = FindDataSourceMap(queryObject, applicationID, projectID, dataSourceID);

                if (result == null)
                {
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
                                        dataSourceMap.LLMProvider = ParseLLMProvider(string.IsNullOrWhiteSpace(item.LLMProvider) == true ? item.DataProvider : item.LLMProvider);
                                        dataSourceMap.ApiKey = item.IsEncryption.ParseBool() == true ? DecryptApiKey(item) : item.ApiKey;
                                        dataSourceMap.ModelID = item.ModelID;
                                        dataSourceMap.Endpoint = item.Endpoint;

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

        public static PromptMap? GetPromptMap(string queryID)
        {
            PromptMap? result = null;
            lock (PromptMappings)
            {
                result = PromptMappings.FirstOrDefault(item => item.Key == queryID).Value;

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
                        var filePath = PathExtensions.Combine(appBasePath, "prompter", projectID, transactionID + ".xml");
                        try
                        {
                            if (File.Exists(filePath) == true)
                            {
                                var promptMaps = LoadPromptMapsFromFile(filePath, true);
                                AddPromptMapsToCache(promptMaps, true, true, filePath, Log.Logger);
                                result = PromptMappings.FirstOrDefault(item => item.Key == queryID).Value;
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
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(dataSource)} 확인 필요: " + exception.ToMessage(), "PromptMapper/DecryptConnectionString");
                }
            }

            return result;
        }

        public static string DecryptApiKey(DataSource? dataSource)
        {
            var result = "";
            if (dataSource != null)
            {
                try
                {
                    var values = dataSource.ApiKey.SplitAndTrim('.');

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
                    Log.Logger.Error("[{LogCategory}] " + $"{JsonConvert.SerializeObject(dataSource)} 확인 필요: " + exception.ToMessage(), "DatabaseMapper/DecryptApiKey");
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
            lock (PromptMappings)
            {
                var queryID = string.Concat(
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
            var result = false;
            var queryID = string.Concat(
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
            var result = false;
            lock (PromptMappings)
            {
                try
                {
                    foreach (var basePath in ModuleConfiguration.ContractBasePath)
                    {
                        var filePath = PathExtensions.Join(basePath, fileRelativePath);

                        if (File.Exists(filePath) == true)
                        {
                            var isTenantContractFile = false;
                            if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                isTenantContractFile = true;
                            }

                            var promptMaps = LoadPromptMapsFromFile(filePath, isTenantContractFile);
                            result = AddPromptMapsToCache(promptMaps, forceUpdate, isTenantContractFile, filePath, logger);
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
            var resultType = "Form";
            var argumentMap = "N";

            var parameters = extractParameters(queryObject);

            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
            htmlDocument.LoadHtml(promptMap.Prompt);
            var htmlNode = htmlDocument.DocumentNode.SelectSingleNode("//transaction");
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
            var result = string.Empty;

            var parameters = extractParameters(queryObject);

            var children = promptMap.Chidren;

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

        public static JObject ExtractParameters(QueryObject? queryObject)
        {
            return extractParameters(queryObject);
        }

        public static string ConvertParameterText(string text, JObject parameters)
        {
            var htmlDocument = new HtmlDocument();
            htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
            htmlDocument.LoadHtml(text);

            if (htmlDocument.DocumentNode.ChildNodes.Count == 0)
            {
                return RecursiveParameters(text, parameters, "");
            }

            var result = "";
            foreach (var childNode in htmlDocument.DocumentNode.ChildNodes)
            {
                result += ConvertChildren(childNode, parameters);
            }

            if (string.IsNullOrEmpty(result) == true)
            {
                result = RecursiveParameters(text, parameters, "");
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
            // JArray list = Eval.Execute<JArray>(htmlNode.Attributes["collection"].Value, parameters);
            var list = parameters[htmlNode.Attributes["collection"].Value] as JArray;
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
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                    {
                        continue;
                    }

                    logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "PromptMapper/LoadContract");

                    var promptMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                    foreach (var promptMapFile in promptMapFiles)
                    {
                        try
                        {
                            var promptMaps = LoadPromptMapsFromFile(promptMapFile, false);
                            lock (PromptMappings)
                            {
                                AddPromptMapsToCache(promptMaps, false, false, promptMapFile, logger);
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
                        dataSourceMap.LLMProvider = ParseLLMProvider(item.LLMProvider);
                        dataSourceMap.ApiKey = item.IsEncryption.ParseBool() == true ? DecryptApiKey(item) : item.ApiKey;
                        dataSourceMap.ModelID = item.ModelID;
                        dataSourceMap.Endpoint = item.Endpoint;

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
