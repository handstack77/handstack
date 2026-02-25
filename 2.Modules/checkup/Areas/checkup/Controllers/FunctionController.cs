using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;

using checkup.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json.Linq;

using Serilog;

namespace checkup.Areas.checkup.Controllers
{
    [Area("checkup")]
    [Route("[area]/api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [ApiController]
    public class FunctionController : BaseController
    {
        protected ILogger logger { get; }
        protected Extensions.ModuleApiClient moduleApiClient { get; }
        protected readonly IHttpContextAccessor httpContextAccessor;

        public FunctionController(ILogger logger, Extensions.ModuleApiClient moduleApiClient, IHttpContextAccessor httpContextAccessor)
        {
            this.logger = logger;
            this.moduleApiClient = moduleApiClient;
            this.httpContextAccessor = httpContextAccessor;
        }

        // http://localhost:8421/checkup/api/function/execute?functionID=HAC.HAC040.UF01&accessToken=test&loadOptions[option1]=value1&featureMeta.Timeout=0
        [Route("[action]")]
        // public async Task<DataSet?> Execute([FromBody] List<DynamicParameter> dynamicParameters, [FromQuery] DataContext dataContext)
        public async Task<DataSet?> Execute([FromBody] List<DynamicParameter>? dynamicParameters, [FromQuery] DataContext? dataContext)
        {
            using DataSet? result = new DataSet();
            var httpContext = httpContextAccessor.HttpContext;
            string functionID = (httpContext?.Request.Query["functionID"]).ToStringSafe();
            if (string.IsNullOrWhiteSpace(functionID))
            {
                result.BuildExceptionData("Y", "Warning", $"functionID 확인 필요");
                result.Tables.Add(new DataTable());
                return result;
            }

            if (dynamicParameters == null)
            {
                dynamicParameters = new List<DynamicParameter>();
                dynamicParameters.Add(new DynamicParameter()
                {
                    ParameterName = "ApplicationID",
                    Value = "9ysztou4",
                    DbType = "String",
                    Length = 0,
                });

                dynamicParameters.Add(new DynamicParameter()
                {
                    ParameterName = "UserWorkID",
                    Value = "3qmbxyhc",
                    DbType = "String",
                    Length = 0,
                });

                dynamicParameters.Add(new DynamicParameter()
                {
                    ParameterName = "Prompt",
                    Value = "아빠가 방에 들어가셨다.",
                    DbType = "String",
                    Length = 0,
                });
            }

            #region DataContext

            DateTime now = DateTime.Now;
            if (dataContext == null)
            {
                dataContext = new DataContext();
                dataContext.accessToken = null;
                dataContext.loadOptions = null;
                dataContext.dataProvider = null; // SQLite, SqlServer, MySql, Oracle, PostgreSql, MariaDB
                dataContext.connectionString = null;
            }

            dataContext.globalID = !string.IsNullOrWhiteSpace(dataContext.globalID) ? dataContext.globalID : $"OD00000{GlobalConfiguration.ApplicationID}{functionID.Replace(".", "")}F{now.ToString("HHmmss").ToSHA256().Substring(0, 6) + now.ToString("HHmmss")}";
            dataContext.environment = !string.IsNullOrWhiteSpace(dataContext.environment) ? dataContext.environment : "D";
            dataContext.platform = !string.IsNullOrWhiteSpace(dataContext.platform) ? dataContext.platform : "Windows"; // Windows, Linux, MacOS
            dataContext.workingDirectoryPath = !string.IsNullOrWhiteSpace(dataContext.workingDirectoryPath) ? dataContext.workingDirectoryPath : "../tmp/HDS/function/HDS_FN00";

            string commandID = string.Empty;
            var scriptMapFile = string.IsNullOrWhiteSpace(ModuleConfiguration.ModuleBasePath) ? PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "featureTest.json") : PathExtensions.Combine(GlobalConfiguration.GetBaseDirectoryPath($"../modules/{ModuleConfiguration.ModuleID}"), "featureTest.json");
            if (System.IO.File.Exists(scriptMapFile) == true)
            {
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
                            logger.Error("[{LogCategory}] " + $"{scriptMapFile} 업무 계약 파일 오류 - 서명 키 불일치", "FunctionController/Execute");
                            return result;
                        }

                        var cipher = encryptNode!.GetValue<string>();
                        var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                        JsonNode? restored;
                        try
                        {
                            restored = JsonNode.Parse(plain);

                            if (restored is not JsonArray restoredArr)
                            {
                                logger.Error("[{LogCategory}] " + $"Decrypted Services는 {scriptMapFile} 내의 JSON 배열이 아닙니다.", "FunctionController/Execute");
                                return result;
                            }

                            rootNode["Services"] = restoredArr;
                        }
                        catch (Exception exception)
                        {
                            logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {scriptMapFile}", "FunctionController/Execute");
                            return result;
                        }

                        rootNode.Remove("SignatureKey");
                        rootNode.Remove("EncryptCommands");

                        configData = rootNode.ToJsonString();
                    }
                }

                var functionScriptContract = FunctionScriptContract.FromJson(configData);
                if (functionScriptContract == null)
                {
                    result.BuildExceptionData("Y", "Warning", $"{scriptMapFile} 대응 functionFilePath 파일 없음");
                    result.Tables.Add(new DataTable());
                    return result;
                }

                string? fileExtension = functionScriptContract.Header.LanguageType == "csharp" ? "cs" : null;
                if (string.IsNullOrWhiteSpace(fileExtension))
                {
                    result.BuildExceptionData("Y", "Warning", $"{functionScriptContract.Header.LanguageType} 언어 타입 확인 필요");
                    result.Tables.Add(new DataTable());
                    return result;
                }

                var functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                FunctionHeader header = functionScriptContract.Header;
                dataContext.functionHeader = header;

                var item = functionScriptContract.Commands.FirstOrDefault(p => p.ID == (functionID.Split('.').ElementAtOrDefault(2) ?? ""));
                if (item == null)
                {
                    result.BuildExceptionData("Y", "Warning", $"{functionID} Commands 확인 필요");
                    result.Tables.Add(new DataTable());
                    return result;
                }

                ModuleScriptMap moduleScriptMap = new ModuleScriptMap();
                moduleScriptMap.ApplicationID = header.ApplicationID;
                moduleScriptMap.ProjectID = header.ProjectID;
                moduleScriptMap.TransactionID = header.TransactionID;
                moduleScriptMap.ScriptID = item.ID + item.Seq.ToString().PadLeft(2, '0');
                moduleScriptMap.ExportName = item.ID;
                moduleScriptMap.Seq = item.Seq;
                moduleScriptMap.IsHttpContext = header.IsHttpContext;
                moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

                if (string.IsNullOrWhiteSpace(item.EntryType))
                {
                    moduleScriptMap.EntryType = $"{header.ApplicationID}.Function.{header.ProjectID}.{header.TransactionID}";
                }
                else
                {
                    moduleScriptMap.EntryType = item.EntryType;
                }

                if (string.IsNullOrWhiteSpace(item.EntryType))
                {
                    moduleScriptMap.EntryMethod = item.ID;
                }
                else
                {
                    moduleScriptMap.EntryMethod = item.EntryMethod;
                }

                commandID = moduleScriptMap.EntryMethod.ToStringSafe();

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

                dataContext.featureMeta = moduleScriptMap;
            }
            else
            {
                result.BuildExceptionData("Y", "Warning", $"Function 헤더 파일이 존재하지 않습니다. 파일경로: {scriptMapFile}");
                result.Tables.Add(new DataTable());
                return result;
            }

            if (string.IsNullOrWhiteSpace(dataContext.featureMeta.ApplicationID))
            {
                result.BuildExceptionData("Y", "Warning", $"Function 정보 확인 필요: {functionID}");
                result.Tables.Add(new DataTable());
                return result;
            }

            #endregion

            var method = this.GetType().GetMethod(commandID, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static);
            if (method != null)
            {
                var returnType = method.ReturnType;
                object[] parameters = { dynamicParameters, dataContext };
                if (typeof(Task).IsAssignableFrom(returnType))
                {
                    var task = method.Invoke(this, parameters) as Task;
                    if (task != null)
                    {
                        await task.ConfigureAwait(false);
                    }

                    if (returnType.IsGenericType && returnType.GetGenericTypeDefinition() == typeof(Task<>))
                    {
                        var resultProperty = returnType.GetProperty("Result");
                        return resultProperty?.GetValue(task) as DataSet;
                    }

                    return null;
                }
                else
                {
                    return method.Invoke(this, parameters) as DataSet;
                }
            }
            else
            {
                return null;
            }
        }

        [HttpGet]
        public string Get()
        {
            return "checkup FunctionController";
        }

        protected DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HUM.HUM040.LF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string applicationName = dynamicParameters.Value("ApplicationName").ToStringSafe();
                string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

                if (string.IsNullOrWhiteSpace(userWorkID)
                    || string.IsNullOrWhiteSpace(applicationID)
                    || string.IsNullOrWhiteSpace(applicationName)
                    || string.IsNullOrWhiteSpace(userNo))
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logger = dataContext.logger;
                    logger?.Information($"Function: {typeMember} 작업 시작");

                    string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    if (Directory.Exists(appBasePath) == true)
                    {
                        string searchPattern = "*.*";
                        string? sourceDirectoryPath = appBasePath;

                        List<Menu> menus = new List<Menu>();
                        if (!string.IsNullOrWhiteSpace(sourceDirectoryPath) && Directory.Exists(sourceDirectoryPath) == true)
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                            if (directoryInfo.Exists == true)
                            {
                                Menu rootDirectory = new Menu();
                                rootDirectory.menuID = applicationID;
                                rootDirectory.menuName = string.IsNullOrWhiteSpace(applicationName) ? applicationID : applicationName;

                                string projectType = string.Empty;

                                projectType = "R";
                                searchPattern = "*.html|*.js|*.css|*.json";
                                sourceDirectoryPath = PathExtensions.Combine(appBasePath, "wwwroot");
                                directoryInfo = new DirectoryInfo(sourceDirectoryPath);
                                WWWRootFileMenu(userWorkID, applicationID, projectType, searchPattern, menus, directoryInfo, rootDirectory, 2);
                            }

                            menus = menus.OrderBy(p => p.menuID).ToList();
                            DataTableHelper dataTableBuilder = new DataTableHelper();
                            dataTableBuilder.AddColumn("FileID", typeof(string));
                            dataTableBuilder.AddColumn("FileName", typeof(string));
                            dataTableBuilder.AddColumn("Extension", typeof(string));
                            dataTableBuilder.AddColumn("MD5", typeof(string));
                            dataTableBuilder.AddColumn("Length", typeof(string));
                            dataTableBuilder.AddColumn("LastWriteTime", typeof(string));

                            for (int i = 0; i < menus.Count; i++)
                            {
                                dataTableBuilder.NewRow();

                                var menu = menus[i];
                                dataTableBuilder.SetValue(i, 0, menu.menuID);
                                dataTableBuilder.SetValue(i, 1, menu.menuName);
                                dataTableBuilder.SetValue(i, 2, menu.extension);
                                dataTableBuilder.SetValue(i, 3, menu.md5);
                                dataTableBuilder.SetValue(i, 4, menu.length);
                                dataTableBuilder.SetValue(i, 5, menu.lastWriteTime);
                            }

                            using (DataTable table = dataTableBuilder.GetDataTable())
                            {
                                result.Tables.Add(table);
                            }
                        }
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                catch (Exception exception)
                {
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                    goto TransactionException;
                }

TransactionException:
                if (result.Tables.Count == 1)
                {
                    result.Tables.Add(new DataTable());
                }

                return result;
            }
        }

        protected DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HUM.HUM040.GF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();
            string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

            if (string.IsNullOrWhiteSpace(userWorkID)
                || string.IsNullOrWhiteSpace(applicationID)
                || string.IsNullOrWhiteSpace(itemPath)
                || string.IsNullOrWhiteSpace(userNo))
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var logger = dataContext.logger;
                logger?.Information($"Function: {typeMember} 작업 시작");

                string sourceText = string.Empty;
                string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceItemPath = PathExtensions.Combine(appBasePath, itemPath);

                    if (!string.IsNullOrWhiteSpace(sourceItemPath) && System.IO.File.Exists(sourceItemPath) == true)
                    {
                        sourceText = LZStringHelper.CompressToBase64(System.IO.File.ReadAllText(sourceItemPath));
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "파일 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                DataTableHelper dataTableBuilder = new DataTableHelper();
                dataTableBuilder.AddColumn("CompressBase64", typeof(string));

                dataTableBuilder.NewRow();
                dataTableBuilder.SetValue(0, 0, sourceText);

                using (DataTable table = dataTableBuilder.GetDataTable())
                {
                    result.Tables.Add(table);
                }
            }
            catch (Exception exception)
            {
                result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                goto TransactionException;
            }

TransactionException:
            if (result.Tables.Count == 1)
            {
                result.Tables.Add(new DataTable());
            }

            return result;
        }

        protected DataSet? MF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HUM.HUM040.MF01";
            using DataSet? result = new DataSet();
            result.BuildExceptionData();

            string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
            string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
            string compressBase64 = dynamicParameters.Value("CompressBase64").ToStringSafe();
            string itemPath = dynamicParameters.Value("ItemPath").ToStringSafe();
            string userNo = dynamicParameters.Value("UserNo").ToStringSafe();

            if (string.IsNullOrWhiteSpace(userWorkID)
                || string.IsNullOrWhiteSpace(applicationID)
                || string.IsNullOrWhiteSpace(compressBase64)
                || string.IsNullOrWhiteSpace(itemPath)
                || string.IsNullOrWhiteSpace(userNo))
            {
                result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                goto TransactionException;
            }

            try
            {
                var logger = dataContext.logger;
                logger?.Information($"Function: {typeMember} 작업 시작");

                FileInfo fileInfo = new FileInfo(itemPath);
                string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                if (Directory.Exists(appBasePath) == true)
                {
                    string? sourceItemPath = PathExtensions.Combine(appBasePath, itemPath);

                    if (!string.IsNullOrWhiteSpace(sourceItemPath) && System.IO.File.Exists(sourceItemPath) == true)
                    {
                        string? sourceText = LZStringHelper.DecompressFromBase64(compressBase64);
                        System.IO.File.WriteAllText(sourceItemPath, sourceText);
                    }
                    else
                    {
                        result.BuildExceptionData("Y", "Warning", "파일 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                }
                else
                {
                    result.BuildExceptionData("Y", "Warning", "앱 정보 확인 필요", typeMember);
                    goto TransactionException;
                }
            }
            catch (Exception exception)
            {
                result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                goto TransactionException;
            }

TransactionException:
            return result;
        }

        private void WWWRootFileMenu(string userWorkID, string applicationID, string projectType, string searchPattern, List<Menu> menus, DirectoryInfo directory, Menu rootDirectory, int level)
        {
            string appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID) + "/";
            var searchPatterns = searchPattern.Split('|').Where(x => !string.IsNullOrWhiteSpace(x)).ToArray();
            foreach (var file in directory.GetFileInfos(SearchOption.TopDirectoryOnly, searchPatterns))
            {
                Menu menuItem = new Menu();
                menuItem.menuID = file.FullName.Replace("\\", "/").Replace(appBasePath, "");
                menuItem.menuName = file.Name;
                menuItem.parentMenuID = rootDirectory.menuID;
                menuItem.parentMenuName = rootDirectory.menuName;
                menuItem.showYN = "Y";
                menuItem.projectType = projectType;
                menuItem.menuType = "F";
                menuItem.directoryYN = "N";
                menuItem.functions = "";
                menuItem.projectID = "";
                menuItem.fileID = "";
                menuItem.sortingNo = 2;
                menuItem.level = level;
                menuItem.icon = "";
                menuItem.badge = "";
                menuItem.extension = file.Extension;
                menuItem.lastWriteTime = file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                menuItem.length = file.Length.ToString();
                menuItem.md5 = file.ToMD5Hash();

                if (menuItem.fileID.StartsWith("/") == true)
                {
                    menuItem.fileID = menuItem.fileID.Substring(1);
                }

                menus.Add(menuItem);
            }
        }
    }
}

