using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Xml.Linq;

using graphclient.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json.Linq;

using Serilog;

namespace graphclient.Extensions
{
    public static class GraphMapper
    {
        private static readonly Regex cdataRegex = new Regex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)", RegexOptions.Compiled);

        public static ExpiringDictionary<string, GraphDataSourceMap> DataSourceMappings { get; } = new();

        public static ExpiringDictionary<string, GraphStatementMap> StatementMappings { get; } = new();

        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath("../contracts/graphclient"));
                }

                lock (StatementMappings)
                {
                    StatementMappings.Clear();
                }

                lock (DataSourceMappings)
                {
                    DataSourceMappings.Clear();
                }

                foreach (var graphDataSource in ModuleConfiguration.GraphDataSource)
                {
                    AddGraphDataSource(graphDataSource, logger, true);
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    foreach (var contractFile in Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories))
                    {
                        AddStatementMap(contractFile, true, logger);
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"LoadContract 오류 - {exception.ToMessage()}", "GraphMapper/LoadContract");
            }
        }

        public static bool HasStatement(string applicationID, string projectID, string transactionID, string functionID)
        {
            if (string.IsNullOrWhiteSpace(functionID))
            {
                return false;
            }

            return GetStatementMap($"{applicationID}|{projectID}|{transactionID}|{functionID}") != null;
        }

        public static GraphStatementMap? GetStatementMap(string queryID)
        {
            lock (StatementMappings)
            {
                if (StatementMappings.TryGetValue(queryID, out var statementMap))
                {
                    return statementMap;
                }
            }

            var queryParts = queryID.SplitAndTrim('|');
            if (queryParts.Count < 4)
            {
                return null;
            }

            var applicationID = queryParts[0];
            var projectID = queryParts[1];
            var transactionID = queryParts[2];
            TryLoadTenantContract(applicationID, projectID, transactionID, Log.Logger);

            lock (StatementMappings)
            {
                StatementMappings.TryGetValue(queryID, out var statementMap);
                return statementMap;
            }
        }

        public static GraphDataSourceMap? GetDataSourceMap(QueryObject queryObject, string requestApplicationID, string projectID, string dataSourceID)
        {
            var result = FindDataSourceMap(requestApplicationID, projectID, dataSourceID);
            if (result != null)
            {
                return result;
            }

            TryLoadTenantGraphDataSources(queryObject, requestApplicationID, Log.Logger);
            return FindDataSourceMap(requestApplicationID, projectID, dataSourceID);
        }

        public static bool AddGraphDataSource(GraphDataSource graphDataSource, ILogger logger, bool overwrite)
        {
            if (string.IsNullOrWhiteSpace(graphDataSource.ApplicationID)
                || string.IsNullOrWhiteSpace(graphDataSource.ProjectID)
                || string.IsNullOrWhiteSpace(graphDataSource.DataSourceID))
            {
                logger.Warning("[{LogCategory}] " + $"GraphDataSource 필수 항목 확인 필요 - {graphDataSource.DataSourceID}", "GraphMapper/AddGraphDataSource");
                return false;
            }

            var provider = graphDataSource.GraphProvider.ToStringSafe().Trim();
            if (provider.Equals("Neo4j", StringComparison.OrdinalIgnoreCase) == false
                && provider.Equals("Memgraph", StringComparison.OrdinalIgnoreCase) == false)
            {
                logger.Warning("[{LogCategory}] " + $"지원하지 않는 GraphProvider - {provider}", "GraphMapper/AddGraphDataSource");
                return false;
            }

            var map = new GraphDataSourceMap()
            {
                ApplicationID = graphDataSource.ApplicationID,
                ProjectListID = graphDataSource.ProjectID.Split(',').Where(item => string.IsNullOrWhiteSpace(item) == false).Select(item => item.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
                DataSourceID = graphDataSource.DataSourceID,
                GraphProvider = provider,
                ConnectionString = graphDataSource.IsEncryption.ParseBool() ? DecryptValue(graphDataSource.ConnectionString) : graphDataSource.ConnectionString,
                UserName = graphDataSource.IsEncryption.ParseBool() ? DecryptValue(graphDataSource.UserName) : graphDataSource.UserName,
                Password = graphDataSource.IsEncryption.ParseBool() ? DecryptValue(graphDataSource.Password) : graphDataSource.Password,
                Database = graphDataSource.IsEncryption.ParseBool() ? DecryptValue(graphDataSource.Database) : graphDataSource.Database,
                Comment = graphDataSource.Comment
            };

            var cacheKey = CreateDataSourceKey(graphDataSource.ApplicationID, graphDataSource.ProjectID, graphDataSource.DataSourceID);
            lock (DataSourceMappings)
            {
                if (overwrite == true)
                {
                    var removeKeys = DataSourceMappings.Keys.Where(key => key.StartsWith($"{graphDataSource.ApplicationID}|", StringComparison.OrdinalIgnoreCase)
                        && key.EndsWith($"|{graphDataSource.DataSourceID}", StringComparison.OrdinalIgnoreCase)).ToList();
                    foreach (var removeKey in removeKeys)
                    {
                        DataSourceMappings.Remove(removeKey);
                    }
                }

                DataSourceMappings[cacheKey] = map;
            }

            return true;
        }

        public static bool AddStatementMap(string filePath, bool forceUpdate, ILogger logger)
        {
            var resolvedPath = ResolveContractFilePath(filePath);
            if (string.IsNullOrWhiteSpace(resolvedPath) || File.Exists(resolvedPath) == false)
            {
                return false;
            }

            try
            {
                var graphStatementMaps = LoadStatementMapsFromFile(resolvedPath, logger);
                if (graphStatementMaps.Count == 0)
                {
                    return false;
                }

                if (forceUpdate == true)
                {
                    var firstItem = graphStatementMaps[0];
                    RemoveByTransaction(firstItem.ApplicationID, firstItem.ProjectID, firstItem.TransactionID);
                }

                lock (StatementMappings)
                {
                    foreach (var statementMap in graphStatementMaps)
                    {
                        var queryID = CreateQueryID(statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID);
                        StatementMappings[queryID] = statementMap;
                    }
                }

                return true;
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"{resolvedPath} 그래프 계약 파일 오류 - {exception.ToMessage()}", "GraphMapper/AddStatementMap");
                return false;
            }
        }

        public static bool Remove(string applicationID, string projectID, string transactionID, string statementID)
        {
            lock (StatementMappings)
            {
                return StatementMappings.Remove(CreateQueryID(applicationID, projectID, transactionID, statementID));
            }
        }

        public static void RemoveByTransaction(string applicationID, string projectID, string transactionID)
        {
            lock (StatementMappings)
            {
                var removeKeys = StatementMappings.Keys
                    .Where(key => key.StartsWith($"{applicationID}|{projectID}|{transactionID}|", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (var removeKey in removeKeys)
                {
                    StatementMappings.Remove(removeKey);
                }
            }
        }

        private static List<GraphStatementMap> LoadStatementMapsFromFile(string filePath, ILogger logger)
        {
            var fileInfo = new FileInfo(filePath);
            var document = XDocument.Parse(ReplaceCData(File.ReadAllText(filePath)));
            var mapperElement = document.Root ?? throw new InvalidOperationException("mapper 루트 노드 확인 필요");
            var headerElement = mapperElement.Elements().FirstOrDefault(item => item.Name.LocalName == "header");
            if (headerElement == null)
            {
                throw new InvalidOperationException("header 노드 확인 필요");
            }

            var commandsElement = mapperElement.Elements().FirstOrDefault(item => item.Name.LocalName == "commands");
            var signatureKey = GetElementValue(headerElement, "signaturekey");
            var encryptCommands = GetElementValue(headerElement, "encryptcommands");
            if (string.IsNullOrWhiteSpace(signatureKey) == false && string.IsNullOrWhiteSpace(encryptCommands) == false)
            {
                var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(item => item.AssemblyToken == signatureKey);
                if (licenseItem == null)
                {
                    throw new InvalidOperationException($"{filePath} 서명키 불일치");
                }

                var plain = LZStringHelper.DecompressFromUint8Array(encryptCommands.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;
                commandsElement = XElement.Parse($"<commands>{plain}</commands>");
            }

            if (commandsElement == null)
            {
                throw new InvalidOperationException("commands 노드 확인 필요");
            }

            var applicationID = GetResolvedApplicationID(headerElement, fileInfo);
            var projectID = GetResolvedProjectID(headerElement, fileInfo);
            var transactionID = GetResolvedTransactionID(headerElement, fileInfo);
            var useContract = GetElementValue(headerElement, "use").ToBoolean(true);
            if (useContract == false)
            {
                return new List<GraphStatementMap>();
            }

            var statementMaps = new List<GraphStatementMap>();
            foreach (var statementElement in commandsElement.Elements().Where(item => item.Name.LocalName == "statement"))
            {
                if (GetAttributeValue(statementElement, "use").ToBoolean(true) == false)
                {
                    continue;
                }

                var id = GetAttributeValue(statementElement, "id");
                var seqText = GetAttributeValue(statementElement, "seq");
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(seqText))
                {
                    continue;
                }

                var seq = seqText.ParseInt(0);
                var statementMap = new GraphStatementMap()
                {
                    ApplicationID = applicationID,
                    ProjectID = projectID,
                    TransactionID = transactionID,
                    DataSourceID = GetAttributeValue(statementElement, "datasource"),
                    StatementID = id + seq.ToString().PadLeft(2, '0'),
                    Seq = seq,
                    Comment = GetAttributeValue(statementElement, "desc"),
                    Timeout = GetAttributeValue(statementElement, "timeout").ParseInt(ModuleConfiguration.DefaultCommandTimeout),
                    TransactionLog = GetAttributeValue(statementElement, "transactionlog").ToBoolean(),
                    Cypher = GetStatementBody(statementElement),
                    ModifiedAt = fileInfo.LastWriteTime,
                    SourceFilePath = fileInfo.FullName.Replace("\\", "/")
                };

                if (string.IsNullOrWhiteSpace(statementMap.DataSourceID))
                {
                    statementMap.DataSourceID = GetElementValue(headerElement, "datasource");
                }

                if (string.IsNullOrWhiteSpace(statementMap.DataSourceID))
                {
                    statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                }

                foreach (var parameterElement in statementElement.Elements().Where(item => item.Name.LocalName == "param"))
                {
                    var parameterName = GetAttributeValue(parameterElement, "id");
                    if (string.IsNullOrWhiteSpace(parameterName))
                    {
                        continue;
                    }

                    statementMap.Parameters.Add(new GraphStatementParameter()
                    {
                        Name = parameterName,
                        DefaultValue = GetAttributeValue(parameterElement, "value"),
                        TestValue = GetAttributeValue(parameterElement, "test")
                    });
                }

                statementMaps.Add(statementMap);
            }

            if (statementMaps.Count == 0)
            {
                logger.Warning("[{LogCategory}] " + $"{filePath} statement 노드 확인 필요", "GraphMapper/LoadStatementMapsFromFile");
            }

            return statementMaps;
        }

        private static void TryLoadTenantContract(string applicationID, string projectID, string transactionID, ILogger logger)
        {
            var baseDirectory = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
            if (baseDirectory.Exists == false)
            {
                return;
            }

            var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
            foreach (var directory in directories)
            {
                var directoryInfo = new DirectoryInfo(directory);
                if (baseDirectory.Name != directoryInfo.Parent?.Parent?.Name)
                {
                    continue;
                }

                var contractFilePath = PathExtensions.Combine(directoryInfo.FullName.Replace("\\", "/"), "graphclient", projectID, $"{transactionID}.xml");
                if (File.Exists(contractFilePath) == true)
                {
                    AddStatementMap(contractFilePath, true, logger);
                    break;
                }
            }
        }

        private static void TryLoadTenantGraphDataSources(QueryObject queryObject, string applicationID, ILogger logger)
        {
            var appBasePath = ResolveTenantAppBasePath(queryObject, applicationID);
            if (string.IsNullOrWhiteSpace(appBasePath))
            {
                return;
            }

            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
            if (File.Exists(settingFilePath) == false)
            {
                return;
            }

            var appSetting = JObject.Parse(File.ReadAllText(settingFilePath));
            var graphDataSourceToken = appSetting["GraphDataSource"];
            if (graphDataSourceToken is not JArray graphDataSourceArray)
            {
                return;
            }

            foreach (var item in graphDataSourceArray)
            {
                var graphDataSource = item.ToObject<GraphDataSource>();
                if (graphDataSource == null)
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(graphDataSource.ConnectionString) == false)
                {
                    graphDataSource.ConnectionString = graphDataSource.ConnectionString.Replace("{appBasePath}", appBasePath);
                }

                AddGraphDataSource(graphDataSource, logger, false);
            }
        }

        private static GraphDataSourceMap? FindDataSourceMap(string applicationID, string projectID, string dataSourceID)
        {
            lock (DataSourceMappings)
            {
                return DataSourceMappings.Values.FirstOrDefault(item =>
                    item.ApplicationID.Equals(applicationID, StringComparison.OrdinalIgnoreCase)
                    && item.DataSourceID.Equals(dataSourceID, StringComparison.OrdinalIgnoreCase)
                    && (item.ProjectListID.Contains(projectID, StringComparer.OrdinalIgnoreCase)
                        || item.ProjectListID.Contains("*", StringComparer.OrdinalIgnoreCase)));
            }
        }

        private static string ResolveTenantAppBasePath(QueryObject queryObject, string applicationID)
        {
            if (string.IsNullOrWhiteSpace(queryObject.TenantID) == false)
            {
                var tenantItems = queryObject.TenantID.SplitAndTrim('|');
                if (tenantItems.Count >= 2)
                {
                    return PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, tenantItems[0], tenantItems[1]);
                }
            }

            var baseDirectory = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
            if (baseDirectory.Exists == false)
            {
                return string.Empty;
            }

            var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
            foreach (var directory in directories)
            {
                var directoryInfo = new DirectoryInfo(directory);
                if (baseDirectory.Name == directoryInfo.Parent?.Parent?.Name)
                {
                    return directoryInfo.FullName.Replace("\\", "/");
                }
            }

            return string.Empty;
        }

        private static string ResolveContractFilePath(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return string.Empty;
            }

            if (Path.IsPathRooted(filePath) == true && File.Exists(filePath))
            {
                return new FileInfo(filePath).FullName.Replace("\\", "/");
            }

            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                var candidate = PathExtensions.Join(basePath, filePath);
                if (File.Exists(candidate))
                {
                    return new FileInfo(candidate).FullName.Replace("\\", "/");
                }
            }

            return string.Empty;
        }

        private static string CreateDataSourceKey(string applicationID, string projectID, string dataSourceID)
        {
            return $"{applicationID}|{projectID}|{dataSourceID}";
        }

        private static string CreateQueryID(string applicationID, string projectID, string transactionID, string statementID)
        {
            return $"{applicationID}|{projectID}|{transactionID}|{statementID}";
        }

        private static string GetResolvedApplicationID(XElement headerElement, FileInfo fileInfo)
        {
            string applicationID = GetElementValue(headerElement, "application");
            if (string.IsNullOrWhiteSpace(applicationID))
            {
                if (fileInfo.FullName.Replace("\\", "/").StartsWith(GlobalConfiguration.TenantAppBasePath, StringComparison.OrdinalIgnoreCase))
                {
                    applicationID = fileInfo.Directory?.Parent?.Parent?.Name ?? string.Empty;
                }
                else
                {
                    applicationID = fileInfo.Directory?.Parent?.Name ?? string.Empty;
                }
            }

            return applicationID;
        }

        private static string GetResolvedProjectID(XElement headerElement, FileInfo fileInfo)
        {
            string projectID = GetElementValue(headerElement, "project");
            if (string.IsNullOrWhiteSpace(projectID))
            {
                projectID = fileInfo.Directory?.Name ?? string.Empty;
            }

            return projectID;
        }

        private static string GetResolvedTransactionID(XElement headerElement, FileInfo fileInfo)
        {
            var transactionID = GetElementValue(headerElement, "transaction");
            if (string.IsNullOrWhiteSpace(transactionID))
            {
                transactionID = Path.GetFileNameWithoutExtension(fileInfo.Name);
            }

            return transactionID;
        }

        private static string GetStatementBody(XElement statementElement)
        {
            var value = string.Concat(statementElement.Nodes().Select(node =>
            {
                if (node is XElement element && element.Name.LocalName == "param")
                {
                    return string.Empty;
                }

                return node.ToString();
            }));

            return value.Trim();
        }

        private static string GetElementValue(XElement? element, string localName)
        {
            return element?.Elements().FirstOrDefault(item => item.Name.LocalName == localName)?.Value.ToStringSafe() ?? string.Empty;
        }

        private static string GetAttributeValue(XElement element, string localName)
        {
            return element.Attributes().FirstOrDefault(item => item.Name.LocalName == localName)?.Value.ToStringSafe() ?? string.Empty;
        }

        private static string ReplaceCData(string rawText)
        {
            return cdataRegex.Replace(rawText, m =>
                new XText(m.Groups[2].Value).ToString()
            );
        }

        private static string DecryptValue(string encryptedValue)
        {
            if (string.IsNullOrWhiteSpace(encryptedValue))
            {
                return encryptedValue;
            }

            var values = encryptedValue.SplitAndTrim('.');
            if (values.Count != 4)
            {
                return encryptedValue;
            }

            var encrypt = values[0];
            var decryptKey = values[1];
            var hostName = values[2];
            var hash = values[3];

            if ($"{encrypt}.{decryptKey}.{hostName}".ToSHA256() != hash)
            {
                return encryptedValue;
            }

            decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
            return encrypt.DecryptAES(decryptKey);
        }
    }
}
