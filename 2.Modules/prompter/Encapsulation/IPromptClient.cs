using System.Threading.Tasks;

using HandStack.Web.MessageContract.Message;

namespace prompter.Encapsulation
{
    public interface IPromptClient
    {
        Task ExecuteDynamicPromptMap(DynamicRequest request, DynamicResponse response);
    }
}
