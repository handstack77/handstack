using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

using openapi.Entity;

namespace openapi.Encapsulation
{
    public interface IOpenAPIClient
    {
        Task<Tuple<string, DataSet?>> ExecuteSQL(string commandText, ApiDataSource apiDataSource, List<ApiParameter> apiParameters, Dictionary<string, object?> parameters);

        void UsageAPIAggregate(string apiServiceID, string accessID, string format);

        ApiService? GetApiService(string interfaceID);

        AccessMemberApi? GetAccessMemberApi(string apiServiceID, string accessID);

        ApiDataSource? GetApiDataSource(string dataSourceID);

        List<ApiParameter>? GetApiParameters(string apiServiceID);
    }
}
