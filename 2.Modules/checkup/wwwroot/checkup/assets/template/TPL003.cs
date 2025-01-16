using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;

using HandStack.Web.Extensions;
using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.Helper;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace {{applicationID}}.Function.{{projectID}}
{
    public class {{transactionID}}
    {
        {{#commands}}
        public DataSet? {{featureID}}(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "{{projectID}}.{{transactionID}}.{{featureID}}";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();
                string parameter = dynamicParameters.Value("Parameter").ToStringSafe("default");
                {{#params}}
                string {{variableID}} = dynamicParameters.Value("{{id}}").ToStringSafe();
                {{/params}}

                if (string.IsNullOrEmpty(parameter) == true
                    {{#params}}
                    || string.IsNullOrEmpty({{variableID}}) == true
                    {{/params}}
                )
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
                        // 여기에서 업무 로직 시작합니다

                        DataTableHelper dataTableBuilder = new DataTableHelper();
                        dataTableBuilder.AddColumn("Column1", typeof(string));
                        dataTableBuilder.AddColumn("Column2", typeof(string));
                        dataTableBuilder.AddColumn("Column3", typeof(string));

                        dataTableBuilder.NewRow();
                        dataTableBuilder.SetValue(0, 0, "Value1");
                        dataTableBuilder.SetValue(0, 1, "Value2");
                        dataTableBuilder.SetValue(0, 2, "Value3");

                        using (DataTable table = dataTableBuilder.GetDataTable())
                        {
                            result.Tables.Add(table);
                        }

                        logger?.Information($"Function: {typeMember} 작업 완료");
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
        {{/commands}}

    }
}
