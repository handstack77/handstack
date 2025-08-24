using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

using function.Entity;
using function.Extensions;

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

namespace function.Areas.function.Controllers
{
    [Area("function")]
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

        // http://localhost:8421/function/api/managed/reset-contract
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
                    lock (FunctionMapper.ScriptMappings)
                    {
                        FunctionMapper.FunctionSourceMappings.Clear();
                        FunctionMapper.ScriptMappings.Clear();
                        FunctionMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);
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

        // http://localhost:8421/function/api/managed/reset-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    lock (FunctionMapper.ScriptMappings)
                    {
                        try
                        {
                            var functionSourceMappings = FunctionMapper.FunctionSourceMappings.Where(x => x.Key.IndexOf($"{applicationID}|") > -1).ToList();
                            for (var i = functionSourceMappings.Count(); i > 0; i--)
                            {
                                var item = functionSourceMappings[i - 1].Key;
                                FunctionMapper.FunctionSourceMappings.Remove(item);
                            }

                            var statementMappings = FunctionMapper.ScriptMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (var i = statementMappings.Count(); i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                FunctionMapper.ScriptMappings.Remove(item);
                            }

                            var basePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "function");

                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            var scriptMapFiles = Directory.GetFiles(basePath, "featureMeta.json", SearchOption.AllDirectories);

                            foreach (var scriptMapFile in scriptMapFiles)
                            {
                                string functionScriptFile;
                                try
                                {
                                    if (System.IO.File.Exists(scriptMapFile) == false)
                                    {
                                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "ManagedController/ResetAppContract");
                                        continue;
                                    }

                                    var configData = System.IO.File.ReadAllText(scriptMapFile);

                                    JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                                    {
                                        CommentHandling = JsonCommentHandling.Skip,
                                        AllowTrailingCommas = true
                                    });
                                    if (root is JsonObject rootNode)
                                    {
                                        var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                                        var hasEncrypt = rootNode.TryGetPropertyValue("EncryptCommands", out var encryptNode) && encryptNode is JsonValue;
                                        if (hasSignatureKey == true && hasEncrypt == true)
                                        {
                                            var signatureKey = signatureKeyNode!.GetValue<string>();
                                            var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                            if (licenseItem == null)
                                            {
                                                logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - 서명 키 불일치", "ManagedController/ResetAppContract");
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
                                                    logger.Error("[{LogCategory}] " + $"Decrypted Services는 {scriptMapFile} 내의 JSON 배열이 아닙니다.", "ManagedController/ResetAppContract");
                                                    continue;
                                                }

                                                rootNode["Services"] = restoredArr;
                                            }
                                            catch (Exception exception)
                                            {
                                                logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {scriptMapFile}", "ManagedController/ResetAppContract");
                                                continue;
                                            }

                                            rootNode.Remove("SignatureKey");
                                            rootNode.Remove("EncryptCommands");

                                            configData = rootNode.ToJsonString();
                                        }
                                    }

                                    var functionScriptContract = FunctionScriptContract.FromJson(configData);
                                    if (functionScriptContract == null)
                                    {
                                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "ManagedController/ResetAppContract");
                                        continue;
                                    }

                                    string? fileExtension = null;
                                    switch (functionScriptContract.Header.LanguageType)
                                    {
                                        case "javascript":
                                            fileExtension = "js";
                                            break;
                                        case "csharp":
                                            fileExtension = "cs";
                                            break;
                                        case "python":
                                            fileExtension = "py";
                                            break;
                                    }

                                    if (string.IsNullOrEmpty(fileExtension) == true)
                                    {
                                        Log.Logger.Error("[{LogCategory}] " + $"{scriptMapFile} 언어 타입 확인 필요", "ManagedController/ResetAppContract");
                                        continue;
                                    }

                                    functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                                    if (System.IO.File.Exists(functionScriptFile) == true)
                                    {
                                        var fileInfo = new FileInfo(scriptMapFile);
                                        var header = functionScriptContract.Header;
                                        if (scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                        {
                                            header.ApplicationID = string.IsNullOrEmpty(header.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                                            header.ProjectID = string.IsNullOrEmpty(header.ProjectID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                                            header.TransactionID = string.IsNullOrEmpty(header.TransactionID) == true ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                                        }
                                        else
                                        {
                                            header.ApplicationID = string.IsNullOrEmpty(header.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                                            header.ProjectID = string.IsNullOrEmpty(header.ProjectID) == true ? (fileInfo.Directory?.Name).ToStringSafe() : header.ProjectID;
                                            header.TransactionID = string.IsNullOrEmpty(header.TransactionID) == true ? fileInfo.Name.Replace(fileInfo.Extension, "") : header.TransactionID;
                                        }

                                        var items = functionScriptContract.Commands;
                                        foreach (var item in items)
                                        {
                                            if (header.Use == true)
                                            {
                                                var moduleScriptMap = new ModuleScriptMap();
                                                moduleScriptMap.ApplicationID = header.ApplicationID;
                                                moduleScriptMap.ProjectID = header.ProjectID;
                                                moduleScriptMap.TransactionID = header.TransactionID;
                                                moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                                                moduleScriptMap.ExportName = item.ID;
                                                moduleScriptMap.Seq = item.Seq;
                                                moduleScriptMap.IsHttpContext = header.IsHttpContext;
                                                moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                                                if (string.IsNullOrEmpty(item.EntryType) == true)
                                                {
                                                    moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                                                }
                                                else
                                                {
                                                    moduleScriptMap.EntryType = item.EntryType;
                                                }

                                                if (string.IsNullOrEmpty(item.EntryType) == true)
                                                {
                                                    moduleScriptMap.EntryMethod = item.ID;
                                                }
                                                else
                                                {
                                                    moduleScriptMap.EntryMethod = item.EntryMethod;
                                                }

                                                moduleScriptMap.DataSourceID = string.IsNullOrEmpty(header.DataSourceID) == false ? header.DataSourceID : ModuleConfiguration.DefaultDataSourceID;
                                                moduleScriptMap.LanguageType = header.LanguageType;
                                                moduleScriptMap.ProgramPath = functionScriptFile;
                                                moduleScriptMap.Timeout = item.Timeout;
                                                moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                                moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                                moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                                moduleScriptMap.Comment = item.Comment;

                                                moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                                var functionParams = item.Params;
                                                if (functionParams != null && functionParams.Count > 0)
                                                {
                                                    foreach (var functionParam in functionParams)
                                                    {
                                                        moduleScriptMap.ModuleParameters.Add(new ModuleParameterMap()
                                                        {
                                                            Name = functionParam.ID,
                                                            DbType = functionParam.Type,
                                                            Length = functionParam.Length,
                                                            DefaultValue = functionParam.Value,
                                                        });
                                                    }
                                                }

                                                var queryID = string.Concat(
                                                    moduleScriptMap.ApplicationID, "|",
                                                    moduleScriptMap.ProjectID, "|",
                                                    moduleScriptMap.TransactionID, "|",
                                                    moduleScriptMap.ScriptID
                                                );

                                                lock (FunctionMapper.ScriptMappings)
                                                {
                                                    if (FunctionMapper.ScriptMappings.ContainsKey(queryID) == false)
                                                    {
                                                        FunctionMapper.ScriptMappings.Add(queryID, moduleScriptMap);
                                                    }
                                                    else
                                                    {
                                                        Log.Logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {scriptMapFile}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "ManagedController/ResetAppContract");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "ManagedController/ResetAppContract");
                                    }
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - {exception.ToMessage()}", "ManagedController/ResetAppContract");
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

        // http://localhost:8421/function/api/managed/delete-app-contract?userWorkID=userWorkID&applicationID=helloworld
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
                    lock (ModuleConfiguration.FunctionFileSyncManager)
                    {
                        var tenants = ModuleConfiguration.FunctionFileSyncManager.Where(pair => pair.Key.IndexOf($"{userWorkID}/{applicationID}") > -1);
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
                                ModuleConfiguration.FunctionFileSyncManager.Remove(tenantsPath[i]);
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
    }
}
