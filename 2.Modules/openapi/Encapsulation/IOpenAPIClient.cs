using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

using Dapper;

using openapi.Entity;

namespace openapi.Encapsulation
{
    public interface IOpenAPIClient
    {
        Task<DataSet?> ExecuteSQL(ApiService apiService, ApiDataSource apiDataSource, Dictionary<string, object?>? parameters);
    }
}
