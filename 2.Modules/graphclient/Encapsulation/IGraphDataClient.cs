using System;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.Message;

namespace graphclient.Encapsulation
{
    public interface IGraphDataClient : IDisposable
    {
        Task ExecuteJsonAsync(DynamicRequest request, DynamicResponse response);

        Task ExecuteScalarAsync(DynamicRequest request, DynamicResponse response);

        Task ExecuteNonQueryAsync(DynamicRequest request, DynamicResponse response);

        Task ExecuteSchemeOnlyAsync(DynamicRequest request, DynamicResponse response);

        Task ExecuteCodeHelpAsync(DynamicRequest request, DynamicResponse response);

        Task ExecuteSqlTextAsync(DynamicRequest request, DynamicResponse response);

        Task ExecuteXmlAsync(DynamicRequest request, DynamicResponse response);
    }
}
