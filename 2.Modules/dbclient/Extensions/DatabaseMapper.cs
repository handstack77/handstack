using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

using Dapper;

using dbclient.Entity;
using dbclient.NativeParameters;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
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
    public static partial class DatabaseMapper
    {
        private static readonly Regex cdataRegex = MyRegex();
        private static readonly Random random = new();
        public static ExpiringDictionary<DataSourceTanantKey, DataSourceMap> DataSourceMappings = [];
        public static ExpiringDictionary<string, StatementMap> StatementMappings = [];

        static DatabaseMapper()
        {
        }

        private static string EncodeXmlEntities(string value)
        {
            return value
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;");
        }

        private static string DecodeXmlEntities(string value)
        {
            return value
                .Replace("&amp;", "&")
                .Replace("&lt;", "<")
                .Replace("&gt;", ">")
                .Replace("&quot;", "\"");
        }

        public static DataSourceMap? GetDataSourceMap(QueryObject queryObject, string requestApplicationID, string projectID, string dataSourceID)
        {
            lock (DataSourceMappings)
            {
                DataSourceMap? result = null;
                var applicationID = requestApplicationID;
                ArgumentNullException.ThrowIfNull(queryObject);
                result = FindDataSourceMap(queryObject, applicationID, projectID, dataSourceID);

                if (result == null)
                {
                    var userWorkID = string.Empty;
                    var appBasePath = string.Empty;
                    if (!string.IsNullOrWhiteSpace(queryObject.TenantID))
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
                    if (!string.IsNullOrWhiteSpace(appBasePath) && File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
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

                                    var tanantMap = new DataSourceTanantKey
                                    {
                                        ApplicationID = item.ApplicationID,
                                        DataSourceID = item.DataSourceID,
                                        TanantPattern = item.TanantPattern,
                                        TanantValue = item.TanantValue
                                    };

                                    if (DataSourceMappings.ContainsKey(tanantMap) == false)
                                    {
                                        var dataSourceMap = new DataSourceMap
                                        {
                                            ApplicationID = item.ApplicationID,
                                            ProjectListID = item.ProjectID.Split(",").Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList(),
                                            DataProvider = Enum.Parse<DataProviders>(item.DataProvider),
                                            ConnectionString = item.ConnectionString,
                                            TransactionIsolationLevel = string.IsNullOrWhiteSpace(item.TransactionIsolationLevel) ? "ReadCommitted" : item.TransactionIsolationLevel
                                        };

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

                return result;
            }
        }

        private static DataSourceMap FindDataSourceMap(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            DataSourceMap? result = null;

            var dataSourceMaps = DataSourceMappings.Where(item =>
                item.Value.ApplicationID == applicationID
                && (item.Value.ProjectListID.IndexOf(projectID) > -1 || item.Value.ProjectListID.IndexOf("*") > -1)
                && item.Key.DataSourceID == dataSourceID
                && !string.IsNullOrWhiteSpace(item.Key.TanantPattern)
            ).ToList();

            for (var i = 0; i < dataSourceMaps.Count; i++)
            {
                var dataSourceMap = dataSourceMaps[i];

                var tanantPattern = dataSourceMap.Key.TanantPattern;
                var tanantValue = dataSourceMap.Key.TanantValue;
                for (var j = 0; j < queryObject.Parameters.Count; j++)
                {
                    var parameter = queryObject.Parameters[j];
                    if (parameter.ParameterName.StartsWith('$') == true && parameter.Value != null)
                    {
                        tanantPattern = Regex.Replace(tanantPattern, "\\${" + parameter.ParameterName.SubstringSafe(1) + "}", parameter.Value.ToStringSafe());
                    }
                    else if (parameter.ParameterName.StartsWith('#') == true && parameter.Value != null)
                    {
                        tanantPattern = Regex.Replace(tanantPattern, "\\#{" + parameter.ParameterName.SubstringSafe(1) + "}", parameter.Value.ToStringSafe());
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
                    && string.IsNullOrWhiteSpace(item.Key.TanantPattern)
                ).Value;
            }

            return result;
        }

        public static StatementMap? GetStatementMap(string queryID)
        {
            StatementMap? result = null;
            lock (StatementMappings)
            {
                StatementMappings.TryGetValue(queryID, out result);

                if (result == null)
                {
                    ArgumentNullException.ThrowIfNull(queryID);

                    var itemKeys = queryID.Split("|");
                    var applicationID = itemKeys[0];
                    var projectID = itemKeys[1];
                    var transactionID = itemKeys[2];

                    var appBasePath = string.Empty;
                    var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (var directory in directories)
                    {
                        var directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName.Replace("\\", "/");
                            break;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(appBasePath) && Directory.Exists(appBasePath) == true)
                    {
                        var filePath = string.Empty;
                        foreach (var extension in ModuleConfiguration.ContractFileExtensions)
                        {
                            var candidatePath = PathExtensions.Combine(appBasePath, "dbclient", projectID, transactionID + extension);
                            if (File.Exists(candidatePath) == true)
                            {
                                filePath = candidatePath;
                                break;
                            }
                        }
                        try
                        {
                            if (string.IsNullOrWhiteSpace(filePath) == false && File.Exists(filePath) == true)
                            {
                                var fileInfo = new FileInfo(filePath);
                                var htmlDocument = new HtmlDocument
                                {
                                    OptionDefaultStreamEncoding = Encoding.UTF8
                                };
                                htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                                var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");
                                var signatureKey = (header?.Element("signaturekey")?.InnerText).ToStringSafe();
                                var encryptCommands = (header?.Element("encryptcommands")?.InnerText).ToStringSafe();

                                if (!string.IsNullOrWhiteSpace(signatureKey) && !string.IsNullOrWhiteSpace(encryptCommands))
                                {
                                    var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                    if (licenseItem == null)
                                    {
                                        Log.Logger.Error("[{LogCategory}] " + $"{filePath} 업무 계약 파일 오류 - 서명키 불일치", "DatabaseMapper/GetStatementMap");
                                        return null;
                                    }

                                    var plain = LZStringHelper.DecompressFromUint8Array(encryptCommands.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                    var commands = htmlDocument.DocumentNode.SelectSingleNode("//mapper/commands");
                                    commands?.InnerHtml = plain;
                                }

                                applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                                projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                                transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                                if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                {
                                    applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                    projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                    transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                                }
                                else
                                {
                                    applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                    projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                    transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                                }

                                var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                                if (items != null)
                                {
                                    foreach (var item in items)
                                    {
                                        if (header == null || $"{header?.Element("use")?.InnerText}".ToBoolean() == true)
                                        {
                                            var statementMap = new StatementMap
                                            {
                                                ApplicationID = applicationID,
                                                ProjectID = projectID,
                                                TransactionID = transactionID,
                                                DataSourceID = item.Attributes["datasource"]?.Value ?? (header?.Element("datasource")?.InnerText).ToStringSafe()
                                            };
                                            if (string.IsNullOrWhiteSpace(statementMap.DataSourceID))
                                            {
                                                statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                                            }

                                            statementMap.TransactionIsolationLevel = (header?.Element("isolation")?.InnerText).ToStringSafe();
                                            statementMap.StatementID = GetAttributeValue(item, "id") + GetAttributeValue(item, "seq").PadLeft(2, '0');
                                            statementMap.Seq = GetAttributeValue(item, "seq").ParseInt(0);
                                            statementMap.Description = GetAttributeValue(item, "desc");
                                            statementMap.NativeDataClient = GetAttributeValue(item, "native").ParseBool();
                                            statementMap.Timeout = GetAttributeValue(item, "timeout").ParseInt(0);
                                            statementMap.SQL = item.InnerHtml;

                                            var beforetransaction = item.Attributes["before"]?.Value;
                                            if (!string.IsNullOrWhiteSpace(beforetransaction))
                                            {
                                                statementMap.BeforeTransactionCommand = beforetransaction;
                                            }

                                            var aftertransaction = item.Attributes["after"]?.Value;
                                            if (!string.IsNullOrWhiteSpace(aftertransaction))
                                            {
                                                statementMap.AfterTransactionCommand = aftertransaction;
                                            }

                                            var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                            if (!string.IsNullOrWhiteSpace(fallbacktransaction))
                                            {
                                                statementMap.FallbackTransactionCommand = fallbacktransaction;
                                            }

                                            statementMap.DbParameters = [];
                                            var htmlNodes = item.SelectNodes("param");
                                            if (htmlNodes != null && htmlNodes.Count > 0)
                                            {
                                                foreach (var paramNode in htmlNodes)
                                                {
                                                    statementMap.DbParameters.Add(new DbParameterMap()
                                                    {
                                                        Name = GetAttributeValue(paramNode, "id"),
                                                        DbType = GetAttributeValue(paramNode, "type"),
                                                        Length = GetAttributeValue(paramNode, "length", "-1").ParseInt(-1),
                                                        DefaultValue = GetAttributeValue(paramNode, "value"),
                                                        TestValue = GetAttributeValue(paramNode, "test"),
                                                        IsRequired = GetAttributeValue(paramNode, "required").ToBoolean(),
                                                        Direction = GetAttributeValue(paramNode, "direction", "Input"),
                                                        Transform = GetAttributeValue(paramNode, "transform"),
                                                    });
                                                }
                                            }

                                            statementMap.OutputMetas = ReadOutputMetas(item);

                                            var children = new HtmlDocument
                                            {
                                                OptionDefaultStreamEncoding = Encoding.UTF8
                                            };
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

                                    StatementMappings.TryGetValue(queryID, out result);
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
                        decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').SubstringSafe(0, 32);
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
            var queryID = string.Concat(
                projectID, "|",
                businessID, "|",
                transactionID, "|",
                statementID
            );

            var result = StatementMappings.ContainsKey(queryID);

            return result;
        }

        public static bool AddStatementMap(string fileRelativePath, bool forceUpdate, ILogger logger)
        {
            ArgumentNullException.ThrowIfNull(logger);

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
                            var htmlDocument = new HtmlDocument
                            {
                                OptionDefaultStreamEncoding = Encoding.UTF8
                            };
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(filePath)));
                            var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");
                            var signatureKey = (header?.Element("signaturekey")?.InnerText).ToStringSafe();
                            var encryptCommands = (header?.Element("encryptcommands")?.InnerText).ToStringSafe();

                            if (!string.IsNullOrWhiteSpace(signatureKey) && !string.IsNullOrWhiteSpace(encryptCommands))
                            {
                                var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                if (licenseItem == null)
                                {
                                    logger.Error("[{LogCategory}] " + $"{filePath} 업무 계약 파일 오류 - 서명 키 불일치", "DatabaseMapper/AddStatementMap");
                                    continue;
                                }

                                var plain = LZStringHelper.DecompressFromUint8Array(encryptCommands.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                var commands = htmlDocument.DocumentNode.SelectSingleNode("//mapper/commands");
                                commands?.InnerHtml = plain;
                            }

                            var isTenantContractFile = false;
                            var applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                            var projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                            var transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                            if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                isTenantContractFile = true;
                                applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }
                            else
                            {
                                applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if (header == null || $"{header?.Element("use")?.InnerText}".ToBoolean() == true)
                                    {
                                        var statementMap = new StatementMap
                                        {
                                            ApplicationID = applicationID,
                                            ProjectID = projectID,
                                            TransactionID = transactionID,
                                            DataSourceID = item.Attributes["datasource"]?.Value ?? (header?.Element("datasource")?.InnerText).ToStringSafe()
                                        };
                                        if (string.IsNullOrWhiteSpace(statementMap.DataSourceID))
                                        {
                                            statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                                        }

                                        statementMap.TransactionIsolationLevel = (header?.Element("isolation")?.InnerText).ToStringSafe();
                                        statementMap.StatementID = GetAttributeValue(item, "id") + GetAttributeValue(item, "seq").PadLeft(2, '0');
                                        statementMap.Seq = GetAttributeValue(item, "seq").ParseInt(0);
                                        statementMap.Description = GetAttributeValue(item, "desc");
                                        statementMap.NativeDataClient = GetAttributeValue(item, "native").ParseBool();
                                        statementMap.Timeout = GetAttributeValue(item, "timeout").ParseInt(0);
                                        statementMap.SQL = item.InnerHtml;

                                        var beforetransaction = item.Attributes["before"]?.Value;
                                        if (!string.IsNullOrWhiteSpace(beforetransaction))
                                        {
                                            statementMap.BeforeTransactionCommand = beforetransaction;
                                        }

                                        var aftertransaction = item.Attributes["after"]?.Value;
                                        if (!string.IsNullOrWhiteSpace(aftertransaction))
                                        {
                                            statementMap.AfterTransactionCommand = aftertransaction;
                                        }

                                        var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                        if (!string.IsNullOrWhiteSpace(fallbacktransaction))
                                        {
                                            statementMap.FallbackTransactionCommand = fallbacktransaction;
                                        }

                                        statementMap.DbParameters = [];
                                        var htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (var paramNode in htmlNodes)
                                            {
                                                statementMap.DbParameters.Add(new DbParameterMap()
                                                {
                                                    Name = GetAttributeValue(paramNode, "id"),
                                                    DbType = GetAttributeValue(paramNode, "type"),
                                                    Length = GetAttributeValue(paramNode, "length", "-1").ParseInt(-1),
                                                    DefaultValue = GetAttributeValue(paramNode, "value"),
                                                    TestValue = GetAttributeValue(paramNode, "test"),
                                                    IsRequired = GetAttributeValue(paramNode, "required").ToBoolean(),
                                                    Direction = GetAttributeValue(paramNode, "direction", "Input"),
                                                    Transform = GetAttributeValue(paramNode, "transform"),
                                                });
                                            }
                                        }

                                        statementMap.OutputMetas = ReadOutputMetas(item);

                                        var children = new HtmlDocument
                                        {
                                            OptionDefaultStreamEncoding = Encoding.UTF8
                                        };
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

        private static List<string> ReadOutputMetas(HtmlNode statementNode)
        {
            var result = new List<string>();
            var htmlNodes = statementNode.SelectNodes("outputmeta");
            if (htmlNodes == null || htmlNodes.Count == 0)
            {
                return result;
            }

            foreach (var outputMetaNode in htmlNodes)
            {
                var value = outputMetaNode.Attributes["value"]?.Value.ToStringSafe();
                if (string.IsNullOrWhiteSpace(value) == false)
                {
                    result.Add(value);
                }
            }

            return result;
        }

        public static string GetAttributeValue(HtmlNode node, string name, string defaultValue = "")
        {
            ArgumentNullException.ThrowIfNull(node);

            return node.Attributes[name]?.Value ?? defaultValue;
        }

        public static (string? SQL, string ResultType) FindPretreatment(StatementMap statementMap, QueryObject? queryObject)
        {
            string? pretreatmentSQL = null;
            var resultType = "";

            var parameters = extractParameters(queryObject);

            var htmlDocument = new HtmlDocument
            {
                OptionDefaultStreamEncoding = Encoding.UTF8
            };
            ArgumentNullException.ThrowIfNull(statementMap);
            htmlDocument.LoadHtml(statementMap.SQL);
            var pretreatment = htmlDocument.DocumentNode.SelectSingleNode("//pretreatment");
            if (pretreatment != null)
            {
                var htmlResultType = pretreatment.Attributes["resultType"];
                if (htmlResultType != null)
                {
                    resultType = htmlResultType.Value ?? "";
                }
                var children = new HtmlDocument
                {
                    OptionDefaultStreamEncoding = Encoding.UTF8
                };
                children.LoadHtml(pretreatment.InnerHtml);

                var childNodes = children.DocumentNode.ChildNodes;
                foreach (var childNode in childNodes)
                {
                    pretreatmentSQL += ConvertChildren(childNode, parameters);
                }
            }

            if (pretreatmentSQL != null)
            {
                pretreatmentSQL += new string(' ', random.Next(1, 10));
            }

            return (pretreatmentSQL, resultType);
        }

        public static string Find(StatementMap statementMap, QueryObject? queryObject)
        {
            var result = string.Empty;

            var parameters = extractParameters(queryObject);

            ArgumentNullException.ThrowIfNull(statementMap);
            var children = statementMap.Chidren;

            var childNodes = children.DocumentNode.ChildNodes;
            foreach (var childNode in childNodes)
            {
                result += ConvertChildren(childNode, parameters);
            }

            if (string.IsNullOrWhiteSpace(result))
            {
                result = "";
            }
            else
            {
                result += new string(' ', random.Next(1, 10));
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
                    object? value;
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
                            var isParse = DateTime.TryParse(item.Value.ToString(), out var dateTime);
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
            ArgumentNullException.ThrowIfNull(htmlNode);
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
                        _ = ConvertBind(htmlNode, parameters);
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
            ArgumentNullException.ThrowIfNull(htmlNode);
            var collectionName = htmlNode.Attributes["collection"]?.Value;
            if (string.IsNullOrWhiteSpace(collectionName))
            {
                return "";
            }

            ArgumentNullException.ThrowIfNull(parameters);
            if (parameters[collectionName] is JValue value)
            {
                var list = JArray.Parse(value.ToString());
                if (list != null)
                {
                    var item = GetAttributeValue(htmlNode, "item");
                    var open = GetAttributeValue(htmlNode, "open");
                    var close = GetAttributeValue(htmlNode, "close");
                    var separator = GetAttributeValue(htmlNode, "separator");

                    var foreachTexts = new List<string>();
                    foreach (var coll in list)
                    {
                        var foreachParam = parameters;
                        foreachParam[item] = coll.Value<string>();

                        var foreachText = "";
                        foreach (var childNode in htmlNode.ChildNodes)
                        {
                            var childrenText = ConvertChildren(childNode, foreachParam);
                            childrenText = MyRegex1().Replace(childrenText, "");

                            if (!string.IsNullOrWhiteSpace(childrenText))
                            {
                                foreachText += childrenText;
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(foreachText))
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
            var evalString = GetAttributeValue(htmlNode, "test");
            evalString = ReplaceEvalString(evalString, parameters);
            evalString = evalString.Replace(" and ", " && ");
            evalString = evalString.Replace(" or ", " || ");
            var evalText = evalString.Replace("'", "\"").Replace("#", "$");

            var line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line);
            var evalResult = queryable.Any(evalText);

            var convertString = "";
            if (evalResult == true)
            {
                ArgumentNullException.ThrowIfNull(htmlNode);

                foreach (var childNode in htmlNode.ChildNodes)
                {
                    convertString += ConvertChildren(childNode, parameters);
                }
            }

            return convertString;
        }

        public static JObject ConvertBind(HtmlNode htmlNode, JObject parameters)
        {
            var bindID = GetAttributeValue(htmlNode, "name");
            var evalString = GetAttributeValue(htmlNode, "value");
            evalString = ReplaceEvalString(evalString, parameters);
            var evalText = evalString.Replace("'", "\"").Replace("#", "$");

            var evalResult = evalText;
            var line = JsonUtils.GenerateDynamicLinqStatement(parameters);
            var queryable = new[] { parameters }.AsQueryable().Select(line);
            var queryResult = queryable.Select<string>(evalText);
            if (queryResult.Any() == true)
            {
                evalResult = queryResult.First();
            }

            ArgumentNullException.ThrowIfNull(parameters);
            parameters[bindID] = evalResult;

            return parameters;
        }

        public static string ConvertParameter(HtmlNode htmlNode, JObject parameters)
        {
            ArgumentNullException.ThrowIfNull(htmlNode);

            var convertString = htmlNode.InnerText;
            if (parameters != null && parameters.Count > 0)
            {
                var keyString = "";
                convertString = RecursiveParameters(convertString, parameters, keyString);
            }

            try
            {
                convertString = DecodeXmlEntities(convertString);
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

                            if (name.StartsWith('$') == false)
                            {
                                value = value.Replace("\"", "\\\"").Replace("'", "''");
                            }

                            convertString = (convertString ?? throw new ArgumentNullException(nameof(convertString))).Replace("#{" + name + "}", "'" + value + "'");
                            convertString = convertString.Replace("${" + name + "}", value);
                        }
                    }
                }
            }

            return convertString;
        }

        public static string ReplaceEvalString(string evalString, JObject parameters)
        {
            ArgumentNullException.ThrowIfNull(parameters);

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
            var matches = cdataRegex.Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var cdataText = EncodeXmlEntities(match.Groups[2].Value);

                    ArgumentNullException.ThrowIfNull(rawText);
                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            ArgumentNullException.ThrowIfNull(logger);

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

                    var sqlMapFiles = ModuleConfiguration.ContractFileExtensions
                        .SelectMany(extension => Directory.GetFiles(basePath, "*" + extension, SearchOption.AllDirectories));
                    foreach (var sqlMapFile in sqlMapFiles)
                    {
                        try
                        {
                            var fileInfo = new FileInfo(sqlMapFile);
                            var htmlDocument = new HtmlDocument
                            {
                                OptionDefaultStreamEncoding = Encoding.UTF8
                            };
                            htmlDocument.LoadHtml(ReplaceCData(File.ReadAllText(sqlMapFile)));
                            var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");
                            var signatureKey = (header?.Element("signaturekey")?.InnerText).ToStringSafe();
                            var encryptCommands = (header?.Element("encryptcommands")?.InnerText).ToStringSafe();

                            if (!string.IsNullOrWhiteSpace(signatureKey) && !string.IsNullOrWhiteSpace(encryptCommands))
                            {
                                var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                if (licenseItem == null)
                                {
                                    logger.Error("[{LogCategory}] " + $"{sqlMapFile} 업무 계약 파일 오류 - 서명키 불일치", "DatabaseMapper/LoadContract");
                                    continue;
                                }

                                var plain = LZStringHelper.DecompressFromUint8Array(encryptCommands.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                var commands = htmlDocument.DocumentNode.SelectSingleNode("//mapper/commands");
                                commands?.InnerHtml = plain;
                            }

                            var applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                            var projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                            var transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                            if (sqlMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                            {
                                applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }
                            else
                            {
                                applicationID = string.IsNullOrWhiteSpace(applicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                projectID = string.IsNullOrWhiteSpace(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                transactionID = string.IsNullOrWhiteSpace(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                            }

                            var items = htmlDocument.DocumentNode.SelectNodes("//commands/statement");
                            if (items != null)
                            {
                                foreach (var item in items)
                                {
                                    if (header == null || $"{header?.Element("use")?.InnerText}".ToBoolean() == true)
                                    {
                                        var statementMap = new StatementMap
                                        {
                                            ApplicationID = applicationID,
                                            ProjectID = projectID,
                                            TransactionID = transactionID,
                                            DataSourceID = item.Attributes["datasource"]?.Value ?? (header?.Element("datasource")?.InnerText).ToStringSafe()
                                        };
                                        if (string.IsNullOrWhiteSpace(statementMap.DataSourceID))
                                        {
                                            statementMap.DataSourceID = ModuleConfiguration.DefaultDataSourceID;
                                        }

                                        statementMap.TransactionIsolationLevel = (header?.Element("isolation")?.InnerText).ToStringSafe();
                                        statementMap.StatementID = GetAttributeValue(item, "id") + GetAttributeValue(item, "seq").PadLeft(2, '0');
                                        statementMap.Seq = GetAttributeValue(item, "seq").ParseInt(0);
                                        statementMap.Description = GetAttributeValue(item, "desc");
                                        statementMap.NativeDataClient = GetAttributeValue(item, "native").ParseBool();
                                        statementMap.Timeout = GetAttributeValue(item, "timeout").ParseInt(0);
                                        statementMap.SQL = item.InnerHtml;

                                        var beforetransaction = item.Attributes["before"]?.Value;
                                        if (!string.IsNullOrWhiteSpace(beforetransaction))
                                        {
                                            statementMap.BeforeTransactionCommand = beforetransaction;
                                        }

                                        var aftertransaction = item.Attributes["after"]?.Value;
                                        if (!string.IsNullOrWhiteSpace(aftertransaction))
                                        {
                                            statementMap.AfterTransactionCommand = aftertransaction;
                                        }

                                        var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                        if (!string.IsNullOrWhiteSpace(fallbacktransaction))
                                        {
                                            statementMap.FallbackTransactionCommand = fallbacktransaction;
                                        }

                                        statementMap.DbParameters = [];
                                        var htmlNodes = item.SelectNodes("param");
                                        if (htmlNodes != null && htmlNodes.Count > 0)
                                        {
                                            foreach (var paramNode in htmlNodes)
                                            {
                                                statementMap.DbParameters.Add(new DbParameterMap()
                                                {
                                                    Name = GetAttributeValue(paramNode, "id"),
                                                    DbType = GetAttributeValue(paramNode, "type"),
                                                    Length = GetAttributeValue(paramNode, "length", "-1").ParseInt(-1),
                                                    DefaultValue = GetAttributeValue(paramNode, "value"),
                                                    TestValue = GetAttributeValue(paramNode, "test"),
                                                    IsRequired = GetAttributeValue(paramNode, "required").ToBoolean(),
                                                    Direction = GetAttributeValue(paramNode, "direction", "Input"),
                                                    Transform = GetAttributeValue(paramNode, "transform"),
                                                });
                                            }
                                        }

                                        statementMap.OutputMetas = ReadOutputMetas(item);

                                        var children = new HtmlDocument
                                        {
                                            OptionDefaultStreamEncoding = Encoding.UTF8
                                        };
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

                ReloadDataSourceMappings(ModuleConfiguration.DataSource, logger);
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"LoadContract 오류 - " + exception.ToMessage(), "DatabaseMapper/LoadContract");
            }
        }

        public static int ReloadDataSourceMappings(IEnumerable<DataSource> dataSources, ILogger logger)
        {
            var candidates = new Dictionary<DataSourceTanantKey, DataSourceMap>();
            foreach (var item in dataSources ?? Enumerable.Empty<DataSource>())
            {
                var dataProvider = Enum.Parse<DataProviders>(item.DataProvider, true);
                var connectionString = item.IsEncryption.ParseBool() == true ? DecryptConnectionString(item) : item.ConnectionString;
                if (item.IsEncryption.ParseBool() == true && string.IsNullOrWhiteSpace(item.ConnectionString) == false && string.IsNullOrWhiteSpace(connectionString) == true)
                {
                    throw new InvalidOperationException($"DataSourceID '{item.DataSourceID}' 연결 문자열 복호화 실패");
                }

                var tenantKey = new DataSourceTanantKey()
                {
                    ApplicationID = item.ApplicationID,
                    DataSourceID = item.DataSourceID,
                    TanantPattern = item.TanantPattern,
                    TanantValue = item.TanantValue
                };
                if (candidates.ContainsKey(tenantKey) == true)
                {
                    ArgumentNullException.ThrowIfNull(logger);

                    logger.Warning("[{LogCategory}] " + $"DataSourceMap 정보 중복 확인 필요 - ApplicationID - {item.ApplicationID}, ProjectID - {item.ProjectID}, DataSourceID - {item.DataSourceID}, DataProvider - {item.DataProvider}, TanantPattern - {item.TanantPattern}, TanantValue - {item.TanantValue}", "DatabaseMapper/ReloadDataSourceMappings");
                }

                candidates[tenantKey] = new DataSourceMap()
                {
                    ApplicationID = item.ApplicationID,
                    ProjectListID = item.ProjectID.Split(",").Where(value => string.IsNullOrWhiteSpace(value) == false).Distinct().ToList(),
                    DataProvider = dataProvider,
                    ConnectionString = connectionString,
                    TransactionIsolationLevel = string.IsNullOrWhiteSpace(item.TransactionIsolationLevel) ? "ReadCommitted" : item.TransactionIsolationLevel
                };
            }

            lock (DataSourceMappings)
            {
                DataSourceMappings.Clear();
                foreach (var candidate in candidates)
                {
                    DataSourceMappings.Add(candidate.Key, candidate.Value, TimeSpan.FromDays(36500));
                }
            }

            return candidates.Count;
        }

        public static Dictionary<string, object?> ToParametersDictionary(this DynamicParameters dynamicParams)
        {
            var result = new Dictionary<string, object?>();
            var iLookup = (SqlMapper.IParameterLookup)dynamicParams;

            ArgumentNullException.ThrowIfNull(dynamicParams);
            foreach (var paramName in dynamicParams.ParameterNames)
            {
                var value = iLookup[paramName];
                result.Add(paramName, value);
            }

            var templates = dynamicParams.GetType().GetField("templates", BindingFlags.NonPublic | BindingFlags.Instance);
            if (templates != null)
            {
                if (templates.GetValue(dynamicParams) is List<Object> list)
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
            ArgumentNullException.ThrowIfNull(dynamicParams);
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
            ArgumentNullException.ThrowIfNull(dynamicParams);
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
            ArgumentNullException.ThrowIfNull(dynamicParams);
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
            ArgumentNullException.ThrowIfNull(dynamicParams);
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
            ArgumentNullException.ThrowIfNull(dynamicParams);
            var parameters = dynamicParams.sqlliteParameters;
            foreach (var item in parameters)
            {
                result.Add(item.ParameterName, item.Value);
            }
            return result;
        }

        [GeneratedRegex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)", RegexOptions.Compiled)]
        private static partial Regex MyRegex();
        [GeneratedRegex("^\\s*$")]
        private static partial Regex MyRegex1();
    }
}



