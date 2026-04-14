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
    public class LMStudioChatClient : HttpLLMChatClient
    {
        public LMStudioChatClient(IHttpClientFactory httpClientFactory) : base(httpClientFactory)
        {
        }

        public override async Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default)
        {
            Require(request.Endpoint, "LMStudio Endpoint 설정 필요");
            Require(request.ModelID, "LMStudio ModelID 설정 필요");

            var endpoint = ResolveOpenAICompatibleEndpoint(request.Endpoint, "");
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
            var headers = new Dictionary<string, string>();
            if (string.IsNullOrWhiteSpace(request.ApiKey) == false)
            {
                headers["Authorization"] = "Bearer " + request.ApiKey;
            }

            var json = await SendAsync(endpoint, payload, request, headers, cancellationToken);
            return ParseOpenAICompatibleResponse(json);
        }
    }
}
