using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

using prompter.Entity;
using prompter.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
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
using prompter.Enumeration;

namespace prompter.Areas.prompter.Controllers
{
    [Area("prompter")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : ControllerBase
    {
        private ILogger logger { get; }
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, ILogger logger, IConfiguration configuration)
        {
            this.configuration = configuration;
            this.environment = environment;
            this.logger = logger;
        }

        // http://localhost:8000/prompter/api/managed/reset-contract
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
                    lock (PromptMapper.PromptMappings)
                    {
                        PromptMapper.DataSourceMappings.Clear();
                        PromptMapper.PromptMappings.Clear();
                        PromptMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
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

        // http://localhost:8000/prompter/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    lock (PromptMapper.PromptMappings)
                    {
                        try
                        {
                            var dataSourceMappings = PromptMapper.DataSourceMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (int i = dataSourceMappings.Count(); i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                PromptMapper.DataSourceMappings.Remove(item);
                            }

                            var promptMappings = PromptMapper.PromptMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (int i = promptMappings.Count(); i > 0; i--)
                            {
                                var item = promptMappings[i - 1].Key;
                                PromptMapper.PromptMappings.Remove(item);
                            }

                            var basePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "prompter");
                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            string[] promptMapFiles = Directory.GetFiles(basePath, "*.xml", SearchOption.AllDirectories);
                            foreach (string promptMapFile in promptMapFiles)
                            {
                                try
                                {
                                    FileInfo fileInfo = new FileInfo(promptMapFile);
                                    var htmlDocument = new HtmlDocument();
                                    htmlDocument.OptionDefaultStreamEncoding = Encoding.UTF8;
                                    htmlDocument.LoadHtml(ReplaceCData(System.IO.File.ReadAllText(promptMapFile)));
                                    HtmlNode header = htmlDocument.DocumentNode.SelectSingleNode("//mapper/header");

                                    applicationID = (header.Element("application")?.InnerText).ToStringSafe();
                                    string projectID = (header.Element("project")?.InnerText).ToStringSafe();
                                    string transactionID = (header.Element("transaction")?.InnerText).ToStringSafe();
                                    if (promptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
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

                                                lock (PromptMapper.PromptMappings)
                                                {
                                                    if (PromptMapper.PromptMappings.ContainsKey(queryID) == false)
                                                    {
                                                        PromptMapper.PromptMappings.Add(queryID, promptMap);
                                                    }
                                                    else
                                                    {
                                                        Log.Logger.Warning("[{LogCategory}] " + $"PromptMap 정보 중복 오류 - {promptMapFile}, ApplicationID - {promptMap.ApplicationID}, ProjectID - {promptMap.ProjectID}, TransactionID - {promptMap.TransactionID}, StatementID - {promptMap.StatementID}", "ManagedController/ResetAppContract");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"{promptMapFile} 업무 계약 파일 오류 - " + exception.ToMessage(), "ManagedController/ResetAppContract");
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
                                            if (ModuleConfiguration.LLMSource.Contains(item) == false)
                                            {
                                                item.ConnectionString = item.ConnectionString.Replace("{appBasePath}", appBasePath);
                                                ModuleConfiguration.LLMSource.Add(item);
                                            }

                                            DataSourceTanantKey tanantMap = new DataSourceTanantKey();
                                            tanantMap.DataSourceID = item.DataSourceID;
                                            tanantMap.TanantPattern = item.TanantPattern;
                                            tanantMap.TanantValue = item.TanantValue;

                                            if (PromptMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
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
                                                    item.ApiKey = PromptMapper.DecryptApiKey(item);
                                                }

                                                if (PromptMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                                {
                                                    PromptMapper.DataSourceMappings.Add(tanantMap, dataSourceMap);
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

        // http://localhost:8000/prompter/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
        [HttpGet("[action]")]
        public ActionResult DeleteAppContract(string userWorkID, string applicationID)
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
                    lock (ModuleConfiguration.PromptFileSyncManager)
                    {
                        var tenants = ModuleConfiguration.PromptFileSyncManager.Where(pair => pair.Key.Contains($"{userWorkID}{Path.DirectorySeparatorChar}{applicationID}"));
                        if (tenants.Any() == true)
                        {
                            List<string> tenantsPath = new List<string>();
                            foreach (var tenant in tenants)
                            {
                                tenantsPath.Add(tenant.Key);
                                tenant.Value?.Stop();
                            }

                            for (int i = 0; i < tenantsPath.Count; i++)
                            {
                                ModuleConfiguration.PromptFileSyncManager.Remove(tenantsPath[i]);
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
