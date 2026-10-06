using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

using dbclient.Entity;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using HtmlAgilityPack;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using Serilog;

namespace dbclient.Areas.dbclient.Controllers
{
    [Area("dbclient")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public partial class ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration) : BaseController
    {
        private static readonly Regex cdataRegex = MyRegex();
        private ILogger logger { get; } = logger;
        private IConfiguration configuration { get; } = configuration;
        private IWebHostEnvironment environment { get; } = environment;

        // http://localhost:8421/dbclient/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
        {
            _ = BadRequest();
            ActionResult result;
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    lock (DatabaseMapper.StatementMappings)
                    {
                        DatabaseMapper.DataSourceMappings.Clear();
                        DatabaseMapper.StatementMappings.Clear();
                        DatabaseMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] 계약 초기화 오류", "ManagedController/ResetContract");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "DB 계약 초기화 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult ResetAppContract(string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    lock (DatabaseMapper.StatementMappings)
                    {
                        try
                        {
                            var dataSourceMappings = DatabaseMapper.DataSourceMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (var i = dataSourceMappings.Count; i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                DatabaseMapper.DataSourceMappings.Remove(item);
                            }

                            var statementMappings = DatabaseMapper.StatementMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (var i = statementMappings.Count; i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                DatabaseMapper.StatementMappings.Remove(item);
                            }

                            var basePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "dbclient");
                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            var sqlMapFiles = ModuleConfiguration.ContractFileExtensions
                                .SelectMany(extension => Directory.GetFiles(basePath, "*" + extension, SearchOption.AllDirectories));
                            foreach (var filePath in sqlMapFiles)
                            {
                                try
                                {
                                    var fileInfo = new FileInfo(filePath);
                                    var htmlDocument = new HtmlDocument
                                    {
                                        OptionDefaultStreamEncoding = Encoding.UTF8
                                    };
                                    htmlDocument.LoadHtml(ReplaceCData(System.IO.File.ReadAllText(filePath)));
                                    var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                    applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                                    var projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                                    var transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
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
                                                statementMap.StatementID = DatabaseMapper.GetAttributeValue(item, "id") + DatabaseMapper.GetAttributeValue(item, "seq").PadLeft(2, '0');
                                                statementMap.Seq = DatabaseMapper.GetAttributeValue(item, "seq").ParseInt(0);
                                                statementMap.Description = DatabaseMapper.GetAttributeValue(item, "desc");
                                                statementMap.NativeDataClient = DatabaseMapper.GetAttributeValue(item, "native").ParseBool();
                                                statementMap.Timeout = DatabaseMapper.GetAttributeValue(item, "timeout").ParseInt(0);
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
                                                            Name = DatabaseMapper.GetAttributeValue(paramNode, "id"),
                                                            DbType = DatabaseMapper.GetAttributeValue(paramNode, "type"),
                                                            Length = DatabaseMapper.GetAttributeValue(paramNode, "length", "-1").ParseInt(-1),
                                                            DefaultValue = DatabaseMapper.GetAttributeValue(paramNode, "value"),
                                                            TestValue = DatabaseMapper.GetAttributeValue(paramNode, "test"),
                                                            Direction = DatabaseMapper.GetAttributeValue(paramNode, "direction", "Input"),
                                                            Transform = DatabaseMapper.GetAttributeValue(paramNode, "transform"),
                                                        });
                                                    }
                                                }

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

                                                lock (DatabaseMapper.StatementMappings)
                                                {
                                                    if (DatabaseMapper.StatementMappings.ContainsKey(queryID) == false)
                                                    {
                                                        DatabaseMapper.StatementMappings.Add(queryID, statementMap);
                                                    }
                                                    else
                                                    {
                                                        Log.Logger.Warning("[{LogCategory}] " + $"SqlMap 정보 중복 오류 - {filePath}, ApplicationID - {statementMap.ApplicationID}, ProjectID - {statementMap.ProjectID}, TransactionID - {statementMap.TransactionID}, StatementID - {statementMap.StatementID}", "ManagedController/ResetAppContract");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"{filePath} 업무 계약 파일 오류 - " + exception.ToMessage(), "ManagedController/ResetAppContract");
                                }
                            }

                            var tenantID = $"{userWorkID}|{applicationID}";
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                var appSetting = TryReadTenantAppSettings(settingFilePath, "ManagedController/ResetAppContract");
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

                                            var tanantMap = new DataSourceTanantKey
                                            {
                                                ApplicationID = item.ApplicationID,
                                                DataSourceID = item.DataSourceID,
                                                TanantPattern = item.TanantPattern,
                                                TanantValue = item.TanantValue
                                            };

                                            if (DatabaseMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
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
                                                    item.ConnectionString = DatabaseMapper.DecryptConnectionString(item);
                                                }

                                                if (DatabaseMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                                {
                                                    DatabaseMapper.DataSourceMappings.Add(tanantMap, dataSourceMap);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Logger.Error("[{LogCategory}] " + $"LoadContract 오류 - " + exception.ToMessage(), "ManagedController/ResetAppContract");
                        }
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] 앱 계약 초기화 오류. UserWorkID: {UserWorkID}, ApplicationID: {ApplicationID}", "ManagedController/ResetAppContract", userWorkID, applicationID);
                    result = StatusCode(StatusCodes.Status500InternalServerError, "앱 DB 계약 초기화 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/dbclient/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult DeleteAppContract(string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    lock (ModuleConfiguration.SQLFileSyncManager)
                    {
                        var tenants = ModuleConfiguration.SQLFileSyncManager.Where(pair => pair.Key.Contains($"{userWorkID}{Path.DirectorySeparatorChar}{applicationID}"));
                        if (tenants.Any() == true)
                        {
                            var tenantsPath = new List<string>();
                            foreach (var tenant in tenants)
                            {
                                tenantsPath.Add(tenant.Key);
                                tenant.Value?.Stop();
                            }

                            for (var i = 0; i < tenantsPath.Count; i++)
                            {
                                ModuleConfiguration.SQLFileSyncManager.Remove(tenantsPath[i]);
                            }

                            logger.Information("[{LogCategory}] " + string.Join(",", tenantsPath), "Managed/DeleteAppContract");
                        }
                    }
                    result = Ok();
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] 앱 계약 삭제 오류. UserWorkID: {UserWorkID}, ApplicationID: {ApplicationID}", "ManagedController/DeleteAppContract", userWorkID, applicationID);
                    result = StatusCode(StatusCodes.Status500InternalServerError, "앱 DB 계약 삭제 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        private AppSettings? TryReadTenantAppSettings(string settingFilePath, string logCategory)
        {
            try
            {
                var appSettingText = System.IO.File.ReadAllText(settingFilePath);
                return JsonConvert.DeserializeObject<AppSettings>(appSettingText);
            }
            catch (Exception exception)
            {
                logger.Warning(exception, "[{LogCategory}] settings.json 역직렬화 오류 - {SettingFilePath}", logCategory, settingFilePath);
                return null;
            }
        }

        public static string ReplaceCData(string rawText)
        {
            var matches = cdataRegex.Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var cdataText = match.Groups[2].Value;
                    cdataText = cdataText.Replace("&", "&amp;")
                                         .Replace("<", "&lt;")
                                         .Replace(">", "&gt;")
                                         .Replace("\"", "&quot;");

                    ArgumentNullException.ThrowIfNull(rawText);
                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        [GeneratedRegex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)", RegexOptions.Compiled)]
        private static partial Regex MyRegex();
    }
}


