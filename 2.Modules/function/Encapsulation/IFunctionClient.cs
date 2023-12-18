using System;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.Message;

namespace function.Encapsulation
{
    public interface IFunctionClient : IDisposable
    {
        Task ExecuteScriptMap(DynamicRequest request, DynamicResponse response);
    }
}
