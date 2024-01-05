using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json.Linq;

using System.Collections.Generic;
using System.Data;

namespace HDS.Function.TST
{
    public class CSF010
    {
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
    }
}
