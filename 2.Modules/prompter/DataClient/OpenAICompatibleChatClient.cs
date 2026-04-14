using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace prompter.DataClient
{
    public class OpenAICompatibleChatClient : HttpLLMChatClient
    {
        public OpenAICompatibleChatClient(IHttpClientFactory httpClientFactory) : base(httpClientFactory)
        {
        }

        public override async Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default)
        {
            Require(request.ModelID, "OpenAI ModelID 설정 필요");
            Require(request.ApiKey, "OpenAI ApiKey 설정 필요");

            var endpoint = ResolveOpenAICompatibleEndpoint(request.Endpoint, "https://api.openai.com/v1/chat/completions");
            var payload = new JObject
            {
                ["model"] = request.ModelID,
                ["messages"] = BuildOpenAICompatibleMessages(request.ChatHistory, request.Prompt),
                ["max_tokens"] = request.MaxTokens,
                ["temperature"] = request.Temperature,
                ["top_p"] = request.TopP,
                ["presence_penalty"] = request.PresencePenalty,
                ["frequency_penalty"] = request.FrequencyPenalty
            };

            ApplyOpenAITools(payload, request);
            var json = await SendAsync(endpoint, payload, request, new Dictionary<string, string>
            {
                ["Authorization"] = "Bearer " + request.ApiKey
            }, cancellationToken);

            return ParseOpenAICompatibleResponse(json);
        }
    }
}
