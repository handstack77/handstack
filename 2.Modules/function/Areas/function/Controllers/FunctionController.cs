using System;
using System.Collections.Generic;
using System.Data;
using System.IO;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace function.Areas.function.Controllers
{
    [Area("handsup")]
    [Route("[area]/api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [ApiController]
    public class FunctionController : ControllerBase
    {
        // http://localhost:8000/handsup/api/function/execute?accessToken=test&loadOptions[option1]=value1&featureMeta.Timeout=0
        [Route("[action]")]
        // public async Task<DataSet?> Execute([FromBody] List<DynamicParameter> dynamicParameters, [FromQuery] DataContext dataContext)
        public DataSet? Execute([FromBody] List<DynamicParameter>? dynamicParameters, [FromQuery] DataContext? dataContext)
        {
            string moduleID = (httpContext?.Request.Query["moduleID"]).ToStringSafe();

            if (dynamicParameters == null)
            {
                dynamicParameters = new List<DynamicParameter>();
                dynamicParameters.Add(new DynamicParameter()
                {
                    ParameterName = "ApplicationNo",
                    Value = "HDS",
                    DbType = "String",
                    Length = 0,
                });
            }

            if (dataContext == null)
            {
                DateTime now = DateTime.Now;
                dataContext = new DataContext();
                dataContext.accessToken = null;
                dataContext.loadOptions = null;
                dataContext.globalID = $"OD00000HDSTST{moduleID}AF01F{now.ToString("HHmmss").ToSHA256().Substring(0, 6) + now.ToString("HHmmss")}";
                dataContext.environment = "D";
                dataContext.platform = "Windows"; // Windows, Linux, MacOS
                dataContext.dataProvider = null; // SQLite, SqlServer, MySql, Oracle, PostgreSql, MariaDB
                dataContext.connectionString = null;
                dataContext.workingDirectoryPath = "../tmp/HDS/function/HDS_FN00";
                dataContext.featureMeta = new ModuleScriptMap();
            }

            var headerFilePath = Path.Combine(ModuleConfiguration.ModuleBasePath, "featureTest.json");
            if (System.IO.File.Exists(headerFilePath) == true)
            {
                var data = System.IO.File.ReadAllText(headerFilePath);
                dataContext.featureMeta = JsonConvert.DeserializeObject<ModuleScriptMap>(data)!;
            }
            else
            {
                using DataSet? result = new DataSet();
                result.BuildExceptionData("Y", "Warning", $"Function 헤더 파일이 존재하지 않습니다. 파일경로: {headerFilePath}");
                result.Tables.Add(new DataTable());
                return result;
            }

            return GF01(dynamicParameters!, dataContext!);
        }

        [NonAction]
        public DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "TST.CSF010.GF01";

            string serverDate = dynamicParameters.Value("ServerDate").ToStringSafe();
            string serverName = dynamicParameters.Value("ServerName").ToStringSafe();

            DataTableHelper dataTableBuilder = new DataTableHelper();
            dataTableBuilder.AddColumn("FunctionResult", typeof(string));

            dataTableBuilder.NewRow();
            dataTableBuilder.SetValue(0, 0, $"typeMember: {typeMember}, serverDate: {serverDate}, serverName: {serverName}");

            using DataSet result = new DataSet();
            using (DataTable table = dataTableBuilder.GetDataTable())
            {
                result.Tables.Add(table);
            }

            return result;
        }

        private readonly IHttpContextAccessor httpContextAccessor;

        private readonly HttpContext? httpContext;

        public FunctionController(IHttpContextAccessor httpContextAccessor)
        {
            this.httpContextAccessor = httpContextAccessor;
            httpContext = httpContextAccessor.HttpContext;
        }

        [HttpGet]
        public string Get()
        {
            return "handsup FunctionController";
        }
    }
}
