using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
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
    public class ManagedController : ControllerBase
    {
        private IConfiguration configuration { get; }
        private IWebHostEnvironment environment { get; }

        public ManagedController(IWebHostEnvironment environment, IConfiguration configuration)
        {
            this.configuration = configuration;
            this.environment = environment;
        }

        // http://localhost:8000/function/api/managed/reset-contract
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

        // http://localhost:8000/function/api/managed/reset-app-contract?applicationID=helloworld
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
                    lock (FunctionMapper.ScriptMappings)
                    {
                        try
                        {
                            var functionSourceMappings = FunctionMapper.FunctionSourceMappings.Where(x => x.Key.IndexOf($"{applicationID}|") > -1).ToList();
                            for (int i = functionSourceMappings.Count(); i > 0; i--)
                            {
                                var item = functionSourceMappings[i - 1].Key;
                                FunctionMapper.FunctionSourceMappings.Remove(item);
                            }

                            var statementMappings = FunctionMapper.ScriptMappings.Where(x => x.Value.ApplicationID == applicationID).ToList();
                            for (int i = statementMappings.Count(); i > 0; i--)
                            {
                                var item = statementMappings[i - 1].Key;
                                FunctionMapper.ScriptMappings.Remove(item);
                            }

                            var basePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID, "function");

                            if (Directory.Exists(basePath) == false)
                            {
                                return Ok();
                            }

                            string[] scriptMapFiles = Directory.GetFiles(basePath, "featureMeta.json", SearchOption.AllDirectories);

                            foreach (string scriptMapFile in scriptMapFiles)
                            {
                                string functionScriptFile;
                                try
                                {
                                    if (System.IO.File.Exists(scriptMapFile) == false)
                                    {
                                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
                                        continue;
                                    }

                                    FunctionScriptContract? functionScriptContract = FunctionScriptContract.FromJson(System.IO.File.ReadAllText(scriptMapFile));

                                    if (functionScriptContract == null)
                                    {
                                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
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
                                    }

                                    if (string.IsNullOrEmpty(fileExtension) == true)
                                    {
                                        Log.Logger.Error("[{LogCategory}] " + $"{functionScriptContract.Header.LanguageType} 언어 타입 확인 필요", "FunctionMapper/LoadContract");
                                        continue;
                                    }

                                    functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                                    if (System.IO.File.Exists(functionScriptFile) == true)
                                    {
                                        FunctionHeader header = functionScriptContract.Header;
                                        if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && scriptMapFile.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                        {
                                            FileInfo fileInfo = new FileInfo(scriptMapFile);
                                            header.ApplicationID = string.IsNullOrEmpty(header.ApplicationID) == true ? (fileInfo.Directory?.Parent?.Parent?.Parent?.Parent?.Name).ToStringSafe() : header.ApplicationID;
                                            header.ProjectID = string.IsNullOrEmpty(header.ProjectID) == true ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : header.ProjectID;
                                            header.TransactionID = string.IsNullOrEmpty(header.TransactionID) == true ? (fileInfo.Directory?.Name).ToStringSafe().Replace(fileInfo.Extension, "") : header.TransactionID;
                                        }

                                        var items = functionScriptContract.Commands;
                                        foreach (var item in items)
                                        {
                                            if (header.Use == true)
                                            {
                                                ModuleScriptMap moduleScriptMap = new ModuleScriptMap();
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

                                                moduleScriptMap.DataSourceID = header.DataSourceID;
                                                moduleScriptMap.LanguageType = header.LanguageType;
                                                moduleScriptMap.ProgramPath = functionScriptFile;
                                                moduleScriptMap.Timeout = item.Timeout;
                                                moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
                                                moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
                                                moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
                                                moduleScriptMap.Comment = item.Comment;

                                                moduleScriptMap.ModuleParameters = new List<ModuleParameterMap>();
                                                List<FunctionParam> functionParams = item.Params;
                                                if (functionParams != null && functionParams.Count > 0)
                                                {
                                                    foreach (FunctionParam functionParam in functionParams)
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

                                                string queryID = string.Concat(
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
                                                        Log.Logger.Warning("[{LogCategory}] " + $"ScriptMap 정보 중복 확인 필요 - {scriptMapFile}, ApplicationID - {moduleScriptMap.ApplicationID}, ProjectID - {moduleScriptMap.ProjectID}, TransactionID - {moduleScriptMap.TransactionID}, ScriptID - {moduleScriptMap.ScriptID}", "FunctionMapper/LoadContract");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        Log.Logger.Information("[{LogCategory}] " + $"{scriptMapFile} 대응 functionFilePath 파일 없음", "FunctionMapper/LoadContract");
                                    }
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - {exception.ToMessage()}", "FunctionMapper/LoadContract");
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
    }
}
