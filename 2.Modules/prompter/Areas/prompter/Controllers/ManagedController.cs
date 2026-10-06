using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using prompter.DataClient;
using prompter.Entity;
using prompter.Extensions;

using Serilog;

namespace prompter.Areas.prompter.Controllers
{
    [Area("prompter")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public partial class ManagedController(ILogger logger, PromptBuiltinToolService builtinToolService) : BaseController
    {
        private ILogger logger { get; } = logger;
        private PromptBuiltinToolService builtinToolService { get; } = builtinToolService;

        // http://localhost:8421/prompter/api/managed/reset-contract
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
                    lock (PromptMapper.PromptMappings)
                    {
                        PromptMapper.DataSourceMappings.Clear();
                        PromptMapper.PromptMappings.Clear();
                        PromptMapper.LoadContract(Log.Logger);
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

        // http://localhost:8421/prompter/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    lock (PromptMapper.PromptMappings)
                    {
                        try
                        {
                            var dataSourceMappings = PromptMapper.DataSourceMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (var i = dataSourceMappings.Count; i > 0; i--)
                            {
                                var item = dataSourceMappings[i - 1].Key;
                                PromptMapper.DataSourceMappings.Remove(item);
                            }

                            var promptMappings = PromptMapper.PromptMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (var i = promptMappings.Count; i > 0; i--)
                            {
                                var item = promptMappings[i - 1].Key;
                                PromptMapper.PromptMappings.Remove(item);
                            }

                            var basePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "prompter");
                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            var promptMapFiles = ModuleConfiguration.ContractFileExtensions
                                .SelectMany(extension => Directory.GetFiles(basePath, "*" + extension, SearchOption.AllDirectories));
                            foreach (var promptMapFile in promptMapFiles)
                            {
                                try
                                {
                                    var promptMaps = PromptMapper.LoadPromptMapsFromFile(promptMapFile, true);
                                    PromptMapper.AddPromptMapsToCache(promptMaps, false, true, promptMapFile, Log.Logger);
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"{promptMapFile} 업무 계약 파일 오류 - " + exception.ToMessage(), "ManagedController/ResetAppContract");
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
                                            var tanantMap = new DataSourceTanantKey
                                            {
                                                ApplicationID = item.ApplicationID,
                                                DataSourceID = item.DataSourceID,
                                                TanantPattern = item.TanantPattern,
                                                TanantValue = item.TanantValue
                                            };

                                            if (PromptMapper.DataSourceMappings.ContainsKey(tanantMap) == false)
                                            {
                                                var dataSourceMap = new DataSourceMap
                                                {
                                                    ApplicationID = item.ApplicationID,
                                                    ProjectListID = item.ProjectID.Split(",").Where(s => string.IsNullOrWhiteSpace(s) == false).Distinct().ToList(),
                                                    LLMProvider = PromptMapper.ParseLLMProvider(string.IsNullOrWhiteSpace(item.LLMProvider) == true ? item.DataProvider : item.LLMProvider),
                                                    ApiKey = item.IsEncryption.ParseBool() == true ? PromptMapper.DecryptApiKey(item) : item.ApiKey,
                                                    ModelID = item.ModelID,
                                                    Endpoint = item.Endpoint
                                                };

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

        // http://localhost:8421/prompter/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    lock (ModuleConfiguration.PromptFileSyncManager)
                    {
                        var tenants = ModuleConfiguration.PromptFileSyncManager.Where(pair => pair.Key.Contains($"{userWorkID}{Path.DirectorySeparatorChar}{applicationID}"));
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

        // http://localhost:8421/prompter/api/managed/skill-search?query=excel&limit=5
        [HttpGet("skill-search")]
        public async Task<ActionResult> SkillSearch(string query, int limit = 5)
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
                    var response = await builtinToolService.SearchSkillsAsync(query, limit, HttpContext.RequestAborted);
                    result = Content(response, "application/json");
                }
                catch (Exception exception)
                {
                    result = StatusCode(StatusCodes.Status500InternalServerError, exception.ToMessage());
                }
            }

            return result;
        }

        // http://localhost:8421/prompter/api/managed/skill-install
        [HttpPost("skill-install")]
        public async Task<ActionResult> SkillInstall([FromBody] SkillInstallRequest request)
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
                    var response = await builtinToolService.InstallSkillAsync(request?.ID.ToStringSafe() ?? "", HttpContext.RequestAborted);
                    result = Content(response, "application/json");
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
            var matches = MyRegex().Matches(rawText);

            if (matches != null && matches.Count > 0)
            {
                foreach (Match match in matches)
                {
                    var cdataText = match.Groups[2].Value;
                    cdataText = cdataText.Replace("&", "&amp;");
                    cdataText = cdataText.Replace("<", "&lt;");
                    cdataText = cdataText.Replace(">", "&gt;");
                    cdataText = cdataText.Replace("\"", "&quot;");

                    ArgumentNullException.ThrowIfNull(rawText);
                    rawText = rawText.Replace(match.Value, cdataText);
                }
            }
            return rawText;
        }

        [GeneratedRegex("(<!\\[CDATA\\[)([\\s\\S]*?)(\\]\\]>)")]
        private static partial Regex MyRegex();
    }

    public record SkillInstallRequest
    {
        public string ID { get; set; } = "";
    }
}
