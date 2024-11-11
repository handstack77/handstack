using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Serilog;

using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : ControllerBase
    {
        private TransactLoggerClient loggerClient { get; }
        private ILogger logger { get; }
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, IConfiguration configuration, ILogger logger, TransactLoggerClient loggerClient)
        {
            this.configuration = configuration;
            this.environment = environment;
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // http://localhost:8000/transact/api/managed/reset-contract
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
                    TransactionMapper.LoadContract(GlobalConfiguration.EnvironmentName, Log.Logger, configuration);

                    result = Ok();
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/ResetContract");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/transact/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    var businessContracts = TransactionMapper.BusinessMappings;
                    lock (businessContracts)
                    {
                        try
                        {
                            var statementMappings = businessContracts.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (int i = statementMappings.Count(); i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                businessContracts.Remove(item);
                            }

                            var basePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "transact");

                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "ManagedController/ResetAppContract");

                            string[] businessFiles = Directory.GetFiles(basePath, "*.json", SearchOption.AllDirectories);
                            foreach (string businessFile in businessFiles)
                            {
                                try
                                {
                                    string configData = System.IO.File.ReadAllText(businessFile);
                                    BusinessContract? businessContract = BusinessContract.FromJson(configData);
                                    if (businessContract == null)
                                    {
                                        logger.Error("[{LogCategory}] " + $"업무 계약 파일 역직렬화 오류 - {businessFile}", "LoadContract");
                                    }
                                    else
                                    {
                                        if (businessFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                        {
                                            FileInfo fileInfo = new FileInfo(businessFile);
                                            businessContract.ApplicationID = string.IsNullOrEmpty(businessContract.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                            businessContract.ProjectID = string.IsNullOrEmpty(businessContract.ProjectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                            businessContract.TransactionID = string.IsNullOrEmpty(businessContract.TransactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                        }

                                        businessContract.TransactionProjectID = string.IsNullOrEmpty(businessContract.TransactionProjectID) == true ? businessContract.ProjectID : businessContract.TransactionProjectID;
                                        if (businessContracts.ContainsKey(businessFile) == false && TransactionMapper.HasCount(businessContract.ApplicationID, businessContract.ProjectID, businessContract.TransactionID) == 0)
                                        {
                                            businessContracts.Add(businessFile, businessContract);
                                        }
                                        else
                                        {
                                            logger.Warning("[{LogCategory}] " + $"업무 계약 파일 또는 거래 정보 중복 오류 - {businessFile}, ProjectID - {businessContract.ApplicationID}, BusinessID - {businessContract.ProjectID}, TransactionID - {businessContract.TransactionID}", "LoadContract");
                                        }
                                    }
                                }
                                catch (Exception exception)
                                {
                                    logger.Error("[{LogCategory}] " + $"업무 계약 파일 역직렬화 오류 - {businessFile}, {exception.ToMessage()}", "LoadContract");
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

        // http://localhost:8000/transact/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    lock (ModuleConfiguration.BusinessFileSyncManager)
                    {
                        var tenants = ModuleConfiguration.BusinessFileSyncManager.Where(pair => pair.Key.Contains($"{userWorkID}{Path.DirectorySeparatorChar}{applicationID}"));
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
                                ModuleConfiguration.BusinessFileSyncManager.Remove(tenantsPath[i]);
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

        // http://localhost:8000/transact/api/managed/string-encrypt?value=helloworld
        [HttpGet("[action]")]
        public ActionResult StringEncrypt(string value)
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
                    result = Content(SynCryptoHelper.Encrypt(value));
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/StringEncrypt");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8000/transact/api/managed/string-decrypt?value=WzE2MSwxNTIsMTYyLDIwNSwxNjAsMTc1LDE2OCwxNjUsMTYyLDE5N10uOTM2YTE4
        [HttpGet("[action]")]
        public ActionResult StringDecrypt(string value)
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
                    result = Content(SynCryptoHelper.Decrypt(value));
                }
                catch (Exception exception)
                {
                    string exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/StringDecrypt");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }
    }
}
