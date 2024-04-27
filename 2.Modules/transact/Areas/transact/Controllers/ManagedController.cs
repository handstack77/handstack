using System;
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
        private Serilog.ILogger logger { get; }
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, IConfiguration configuration, Serilog.ILogger logger, TransactLoggerClient loggerClient)
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
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
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

        // http://localhost:8000/transact/api/managed/reset-app-contract?applicationID=helloworld
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
                    var businessContracts = TransactionMapper.GetBusinessContracts();
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

                            logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "TransactionMapper/LoadContract");

                            string[] configFiles = Directory.GetFiles(basePath, "*.json", SearchOption.AllDirectories);
                            foreach (string configFile in configFiles)
                            {
                                try
                                {
                                    string configData = System.IO.File.ReadAllText(configFile);
                                    BusinessContract? businessContract = BusinessContract.FromJson(configData);
                                    if (businessContract == null)
                                    {
                                        logger.Error("[{LogCategory}] " + $"업무 계약 파일 역직렬화 오류 - {configFile}", "LoadContract");
                                    }
                                    else
                                    {
                                        if (configFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
                                        {
                                            FileInfo fileInfo = new FileInfo(configFile);
                                            businessContract.ApplicationID = string.IsNullOrEmpty(businessContract.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                            businessContract.ProjectID = string.IsNullOrEmpty(businessContract.ProjectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                            businessContract.TransactionID = string.IsNullOrEmpty(businessContract.TransactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                        }

                                        businessContract.TransactionProjectID = string.IsNullOrEmpty(businessContract.TransactionProjectID) == true ? businessContract.ProjectID : businessContract.TransactionProjectID;
                                        if (businessContracts.ContainsKey(configFile) == false && TransactionMapper.HasCount(businessContract.ApplicationID, businessContract.ProjectID, businessContract.TransactionID) == 0)
                                        {
                                            businessContracts.Add(configFile, businessContract);
                                        }
                                        else
                                        {
                                            logger.Warning("[{LogCategory}] " + $"업무 계약 파일 또는 거래 정보 중복 오류 - {configFile}, ProjectID - {businessContract.ApplicationID}, BusinessID - {businessContract.ProjectID}, TransactionID - {businessContract.TransactionID}", "LoadContract");
                                        }
                                    }
                                }
                                catch (Exception exception)
                                {
                                    logger.Error("[{LogCategory}] " + $"업무 계약 파일 역직렬화 오류 - {configFile}, {exception.ToMessage()}", "LoadContract");
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

        // http://localhost:8000/transact/api/managed/string-encrypt?value=helloworld
        [HttpGet("[action]")]
        public ActionResult StringEncrypt(string value)
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
            string? authorizationKey = Request.GetContainValue("AuthorizationKey");
            if (string.IsNullOrEmpty(authorizationKey) == true || ModuleConfiguration.AuthorizationKey != authorizationKey)
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
