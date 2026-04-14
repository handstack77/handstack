using System.Threading;
using System.Threading.Tasks;

namespace prompter.DataClient
{
    public interface ILLMChatClient
    {
        Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default);
    }
}
