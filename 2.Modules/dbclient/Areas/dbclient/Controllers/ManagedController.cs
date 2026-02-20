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
    public class ManagedController : BaseController
    {
        private ILogger logger { get; }
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration)
        {
            this.configuration = configuration;
            this.logger = logger;
            this.environment = environment;
        }

        // http://localhost:8421/dbclient/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
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
                        DatabaseMapper.DataSourceMappings.Clear();
                        DatabaseMapper.StatementMappings.Clear();
                        DatabaseMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
                    }

                    result = Ok();
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
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
                            for (var i = dataSourceMappings.Count(); i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                DatabaseMapper.DataSourceMappings.Remove(item);
                            }

                            var statementMappings = DatabaseMapper.StatementMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (var i = statementMappings.Count(); i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                DatabaseMapper.StatementMappings.Remove(item);
                            }

                            var basePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "dbclient");
                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            var sqlMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                            foreach (var filePath in sqlMapFiles)
                            {
                                try
                                {
                                    var fileInfo = new FileInfo(filePath);
                                    var htmlDocument = new HtmlDocument();
                                    htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                                    htmlDocument.LoadHtml(ReplaceCData(System.IO.File.ReadAllText(filePath)));
                                    var header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                    applicationID = (header?.Element("application")?.InnerText).ToStringSafe();
                                    var projectID = (header?.Element("project")?.InnerText).ToStringSafe();
                                    var transactionID = (header?.Element("transaction")?.InnerText).ToStringSafe();
                                    if (filePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                    {
                                        applicationID = string.IsNullOrEmpty(applicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : applicationID;
                                        projectID = string.IsNullOrEmpty(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                        transactionID = string.IsNullOrEmpty(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
                                    }
                                    else
                                    {
                                        applicationID = string.IsNullOrEmpty(applicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : applicationID;
                                        projectID = string.IsNullOrEmpty(projectID) ? (fileInfo.Directory?.Name).ToStringSafe() : projectID;
                                        transactionID = string.IsNullOrEmpty(transactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : transactionID;
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
                                                if (string.IsNullOrEmpty(statementMap.DataSourceID))
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
                                                if (!string.IsNullOrEmpty(beforetransaction))
                                                {
                                                    statementMap.BeforeTransactionCommand = beforetransaction;
                                                }

                                                var aftertransaction = item.Attributes["after"]?.Value;
                                                if (!string.IsNullOrEmpty(aftertransaction))
                                                {
                                                    statementMap.AfterTransactionCommand = aftertransaction;
                                                }

                                                var fallbacktransaction = item.Attributes["fallback"]?.Value;
                                                if (!string.IsNullOrEmpty(fallbacktransaction))
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
                                var appSettingText = System.IO.File.ReadAllText(settingFilePath);
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

                                            var tanantMap = new DataSourceTanantKey();
                                            tanantMap.ApplicationID = item.ApplicationID;
                                            tanantMap.DataSourceID = item.DataSourceID;
                                            tanantMap.TanantPattern = item.TanantPattern;
                                            tanantMap.TanantValue = item.TanantValue;

                                            if (DatabaseMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                            {
                                                var dataSourceMap = new DataSourceMap();
                                                dataSourceMap.ApplicationID = item.ApplicationID;
                                                dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();
                                                dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                                                dataSourceMap.ConnectionString = item.ConnectionString;
                                                dataSourceMap.TransactionIsolationLevel = string.IsNullOrEmpty(item.TransactionIsolationLevel) ? "ReadCommitted" : item.TransactionIsolationLevel;

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
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
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
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
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
    }
}

