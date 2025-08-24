using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Serilog;

using transact.Entity;
using transact.Extensions;

namespace transact.Areas.transact.Controllers
{
    [Area("transact")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ManagedController : BaseController
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

        // http://localhost:8421/transact/api/managed/reset-contract
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
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/ResetContract");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                            for (var i = statementMappings.Count(); i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                businessContracts.Remove(item);
                            }

                            var basePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "transact");

                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            logger.Information("[{LogCategory}] ContractBasePath: " + basePath, "ManagedController/ResetAppContract");

                            var businessFiles = Directory.GetFiles(basePath, "*.json", SearchOption.AllDirectories);
                            foreach (var businessFile in businessFiles)
                            {
                                try
                                {
                                    var configData = System.IO.File.ReadAllText(businessFile);

                                    JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                                    {
                                        CommentHandling = JsonCommentHandling.Skip,
                                        AllowTrailingCommas = true
                                    });
                                    if (root is JsonObject rootNode)
                                    {
                                        var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                                        var hasEncrypt = rootNode.TryGetPropertyValue("EncryptServices", out var encryptNode) && encryptNode is JsonValue;
                                        if (hasSignatureKey == true && hasEncrypt == true)
                                        {
                                            var signatureKey = signatureKeyNode!.GetValue<string>();
                                            var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                            if (licenseItem == null)
                                            {
                                                logger.Error("[{LogCategory}] " + $"{businessFile} 업무 계약 파일 오류 - 서명 키 불일치", "ManagedController/ResetAppContract");
                                                continue;
                                            }

                                            var cipher = encryptNode!.GetValue<string>();
                                            var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey)) ?? string.Empty;

                                            JsonNode? restored;
                                            try
                                            {
                                                restored = JsonNode.Parse(plain);

                                                if (restored is not JsonArray restoredArr)
                                                {
                                                    logger.Error("[{LogCategory}] " + $"Decrypted Services는 {businessFile} 내의 JSON 배열이 아닙니다.", "ManagedController/ResetAppContract");
                                                    continue;
                                                }

                                                rootNode["Services"] = restoredArr;
                                            }
                                            catch (Exception exception)
                                            {
                                                logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "ManagedController/ResetAppContract");
                                                continue;
                                            }

                                            rootNode.Remove("SignatureKey");
                                            rootNode.Remove("EncryptServices");

                                            configData = rootNode.ToJsonString();
                                        }
                                    }

                                    var businessContract = BusinessContract.FromJson(configData);
                                    if (businessContract == null)
                                    {
                                        logger.Error("[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "ManagedController/ResetAppContract");
                                    }
                                    else
                                    {
                                        if (businessFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                        {
                                            var fileInfo = new FileInfo(businessFile);
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
                                            logger.Warning("[{LogCategory}] " + $"업무 계약 파일 또는 거래 정보 중복 오류 - {businessFile}, ProjectID - {businessContract.ApplicationID}, BusinessID - {businessContract.ProjectID}, TransactionID - {businessContract.TransactionID}", "ManagedController/LoadContract");
                                        }
                                    }
                                }
                                catch (Exception exception)
                                {
                                    logger.Error("[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}, {exception.ToMessage()}", "ManagedController/LoadContract");
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

        // http://localhost:8421/transact/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                            var tenantsPath = new List<string>();
                            foreach (var tenant in tenants)
                            {
                                tenantsPath.Add(tenant.Key);
                                tenant.Value?.Stop();
                            }

                            for (var i = 0; i < tenantsPath.Count; i++)
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

        // http://localhost:8421/transact/api/managed/string-encrypt?value=helloworld
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
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/StringEncrypt");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }

        // http://localhost:8421/transact/api/managed/string-decrypt?value=WzE2MSwxNTIsMTYyLDIwNSwxNjAsMTc1LDE2OCwxNjUsMTYyLDE5N10uOTM2YTE4
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
                    var exceptionText = exception.ToMessage();
                    logger.Error("[{LogCategory}] " + exceptionText, "Managed/StringDecrypt");

                    result = StatusCode(StatusCodes.Status500InternalServerError, exceptionText);
                }
            }

            return result;
        }
    }
}
