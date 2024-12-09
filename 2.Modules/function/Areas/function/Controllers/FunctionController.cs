using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json.Linq;

using Serilog;

namespace function.Areas.function.Controllers
{
    [Area("function")]
    [Route("[area]/api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [ApiController]
    public class FunctionController : ControllerBase
    {
        private ILogger? logger { get; }
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly HttpContext? httpContext;

        public FunctionController(ILogger logger, IHttpContextAccessor httpContextAccessor)
        {
            this.logger = logger;
            this.httpContextAccessor = httpContextAccessor;
            httpContext = httpContextAccessor.HttpContext;
        }

        // http://localhost:8000/function/api/function/execute?accessToken=test&loadOptions[option1]=value1&featureMeta.Timeout=0
        [Route("[action]")]
        // public async Task<DataSet?> Execute([FromBody] List<DynamicParameter> dynamicParameters, [FromQuery] DataContext dataContext)
        public async Task<DataSet?> Execute([FromBody] List<DynamicParameter>? dynamicParameters, [FromQuery] DataContext? dataContext)
        {
            string functionID = (httpContext?.Request.Query["functionID"]).ToStringSafe();
            if (string.IsNullOrEmpty(functionID) == true)
            {
                using DataSet? result = new DataSet();
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

            dataContext.globalID = string.IsNullOrEmpty(dataContext.globalID) == false ? dataContext.globalID : $"OD00000{GlobalConfiguration.ApplicationID}{functionID.Replace(".", "")}F{now.ToString("HHmmss").ToSHA256().Substring(0, 6) + now.ToString("HHmmss")}";
            dataContext.environment = string.IsNullOrEmpty(dataContext.environment) == false ? dataContext.environment : "D";
            dataContext.platform = string.IsNullOrEmpty(dataContext.platform) == false ? dataContext.platform : "Windows"; // Windows, Linux, MacOS
            dataContext.workingDirectoryPath = string.IsNullOrEmpty(dataContext.workingDirectoryPath) == false ? dataContext.workingDirectoryPath : "../tmp/HDS/function/HDS_FN00";

            var scriptMapFile = string.IsNullOrEmpty(ModuleConfiguration.ModuleBasePath) == true ? Path.Combine(GlobalConfiguration.GetBasePath($"../modules/{ModuleConfiguration.ModuleID}"), "featureTest.json"): Path.Combine(ModuleConfiguration.ModuleBasePath, "featureTest.json");
            if (System.IO.File.Exists(scriptMapFile) == true)
            {
                var scriptMapData = System.IO.File.ReadAllText(scriptMapFile);

                FunctionScriptContract? functionScriptContract = FunctionScriptContract.FromJson(scriptMapData);

                if (functionScriptContract == null)
                {
                    using DataSet? result = new DataSet();
                    result.BuildExceptionData("Y", "Warning", $"{scriptMapFile} 대응 functionFilePath 파일 없음");
                    result.Tables.Add(new DataTable());
                    return result;
                }

                string? fileExtension = functionScriptContract.Header.LanguageType == "csharp" ? "cs" : null;
                if (string.IsNullOrEmpty(fileExtension) == true)
                {
                    using DataSet? result = new DataSet();
                    result.BuildExceptionData("Y", "Warning", $"{scriptMapFile} 언어 타입 확인 필요");
                    result.Tables.Add(new DataTable());
                    return result;
                }

                var functionScriptFile = scriptMapFile.Replace("featureMeta.json", $"featureMain.{fileExtension}");
                FunctionHeader header = functionScriptContract.Header;
                dataContext.functionHeader = header;

                var item = functionScriptContract.Commands.FirstOrDefault(p => p.ID == (functionID.Split('.').ElementAtOrDefault(2) ?? ""));
                if (item == null)
                {
                    using DataSet? result = new DataSet();
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
                using DataSet? result = new DataSet();
                result.BuildExceptionData("Y", "Warning", $"Function 헤더 파일이 존재하지 않습니다. 파일경로: {scriptMapFile}");
                result.Tables.Add(new DataTable());
                return result;
            }

            if (string.IsNullOrEmpty(dataContext.featureMeta.ApplicationID) == true)
            {
                using DataSet? result = new DataSet();
                result.BuildExceptionData("Y", "Warning", $"Function 정보 확인 필요: {functionID}");
                result.Tables.Add(new DataTable());
                return result;
            }

            #endregion

            return await GF01(dynamicParameters!, dataContext!);
        }

        [NonAction]
        public async Task<DataSet?> GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "TST.CSF010.GF01";
            string serverDate = dynamicParameters.Value("ServerDate").ToStringSafe();
            string serverName = dynamicParameters.Value("ServerName").ToStringSafe();

            DataTableHelper dataTableBuilder = new DataTableHelper();
            dataTableBuilder.AddColumn("FunctionResult", typeof(string));

            dataTableBuilder.NewRow();
            dataTableBuilder.SetValue(0, 0, $"typeMember: {typeMember}, serverDate: {DateTime.Now}, serverName: {serverName}");

            using DataSet result = new DataSet();
            using (DataTable table = dataTableBuilder.GetDataTable())
            {
                result.Tables.Add(table);
            }

            await Task.Delay(1);
            return result;
        }

        [HttpGet]
        public string Get()
        {
            return "function FunctionController";
        }
    }
}
