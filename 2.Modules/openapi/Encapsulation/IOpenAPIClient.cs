using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

using openapi.Entity;

namespace openapi.Encapsulation
{
    public interface IOpenAPIClient
    {
        Task<Tuple<string, DataSet?>> ExecuteSQL(ApiService apiService, ApiDataSource apiDataSource, AccessMemberApi accessMemberApi, List<ApiParameter> apiParameters, Dictionary<string, object?> parameters);

        void UpdateUsageAPIAggregate(string apiServiceID, string accessID, string format);
    }
}
