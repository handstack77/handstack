using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Message;

namespace dbclient.Encapsulation
{
    public interface IQueryDataClient : IDisposable
    {
        DbConnection? DbConnection { get; }

        DynamicResult ExecuteDirectSQLMap(string queryID, List<DynamicParameter> parameters, bool paddingParameter = false);

        Task ExecuteDynamicSQLMap(DynamicRequest request, DynamicResponse response);

        Task ExecuteDynamicSQLMapToScalar(DynamicRequest request, DynamicResponse response);

        Task ExecuteDynamicSQLMapToNonQuery(DynamicRequest request, DynamicResponse response);

        Task ExecuteDynamicSQLMapToXml(DynamicRequest request, DynamicResponse response);

        Task ExecuteCodeHelpSQLMap(DynamicRequest request, DynamicResponse response);

        Task ExecuteSchemeOnlySQLMap(DynamicRequest request, DynamicResponse response);

        Task ExecuteDynamicSQLText(DynamicRequest request, DynamicResponse response);
    }
}
