using System;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.Message;

namespace command.Encapsulation
{
    public interface ICommandDataClient : IDisposable
    {
        Task ExecuteDynamicCommandMap(DynamicRequest request, DynamicResponse response);
    }
}

