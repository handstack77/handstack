using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using HtmlAgilityPack;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
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
    public class ManagedController : ControllerBase
    {
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, IConfiguration configuration)
        {
            this.configuration = configuration;
            this.environment = environment;
        }

        // http://localhost:8000/dbclient/api/managed/reset-contract
        [HttpGet("[action]")]
        public ActionResult ResetContract()
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
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
                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8000/dbclient/api/managed/reset-app-contract?applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult ResetAppContract(string userWorkID, string applicationID)
        {
            ActionResult result = BadRequest();
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
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
                            for (int i = dataSourceMappings.Count(); i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                DatabaseMapper.DataSourceMappings.Remove(item);
                            }

                            var statementMappings = DatabaseMapper.StatementMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (int i = statementMappings.Count(); i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                DatabaseMapper.StatementMappings.Remove(item);
                            }

                            var basePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "dbclient");
                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            string[] sqlMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                            foreach (string sqlMapFile in sqlMapFiles)
                            {
                                try
                                {
                                    FileInfo fileInfo = new FileInfo(sqlMapFile);
                                    var htmlDocument = new HtmlDocument();
                                    htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                                    htmlDocument.LoadHtml(ReplaceCData(System.IO.File.ReadAllText(sqlMapFile)));
                                    HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                    applicationID = (header.Element("application")?.InnerText).ToStringSafe();
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

                                                lock (DatabaseMapper.StatementMappings)
                                                {
                                                    if (DatabaseMapper.StatementMappings.ContainsKey(queryID) == false)
                                                    {
                                                        DatabaseMapper.StatementMappings.Add(queryID, statementMap);
                                                    }
                                                    else
                                                    {
                                                        Log.Logger.Warning("[{LogCategory}] " + $"SqlMap 정보 중복 오류 - {sqlMapFile}, ApplicationID - {statementMap.ApplicationID}, ProjectID - {statementMap.ProjectID}, TransactionID - {statementMap.TransactionID}, StatementID - {statementMap.StatementID}", "ManagedController/ResetAppContract");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"{sqlMapFile} 업무 계약 파일 오류 - " + exception.ToMessage(), "ManagedController/ResetAppContract");
                                }
                            }

                            string tenantID = $"{userWorkID}|{applicationID}";
                            string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = System.IO.File.ReadAllText(settingFilePath);
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

                                            if (DatabaseMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                            {
                                                DataSourceMap dataSourceMap = new DataSourceMap();
                                                dataSourceMap.ApplicationID = item.ApplicationID;
                                                dataSourceMap.ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList();
                                                dataSourceMap.DataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), item.DataProvider);
                                                dataSourceMap.ConnectionString = item.ConnectionString;

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
                    result = StatusCode(500, exception.ToMessage());
                }
            }

            return result;
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
    }
}
