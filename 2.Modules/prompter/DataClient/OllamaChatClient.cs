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
    public class OllamaChatClient : HttpLLMChatClient
    {
        public OllamaChatClient(IHttpClientFactory httpClientFactory) : base(httpClientFactory)
        {
        }

        public override async Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default)
        {
            Require(request.Endpoint, "Ollama Endpoint 설정 필요");
            Require(request.ModelID, "Ollama ModelID 설정 필요");

            var endpoint = ResolveOllamaEndpoint(request.Endpoint);
            var payload = new JObject
            {
                ["model"] = request.ModelID,
                ["messages"] = BuildOpenAICompatibleMessages(request.ChatHistory, request.Prompt),
                ["think"] = false,
                ["stream"] = false,
                ["options"] = new JObject
                {
                    ["num_predict"] = request.MaxTokens,
                    ["temperature"] = request.Temperature,
                    ["top_p"] = request.TopP,
                    ["presence_penalty"] = request.PresencePenalty,
                    ["frequency_penalty"] = request.FrequencyPenalty
                }
            };

            ApplyOpenAITools(payload, request);
            var headers = new Dictionary<string, string>();
            if (string.IsNullOrWhiteSpace(request.ApiKey) == false)
            {
                headers["Authorization"] = "Bearer " + request.ApiKey;
            }

            var json = await SendAsync(endpoint, payload, request, headers, cancellationToken);
            var response = new LLMChatResponse { Raw = json };
            var message = json["message"];
            response.Content = message?["content"]?.ToStringSafe() ?? "";
            var toolCalls = message?["tool_calls"] as JArray;
            if (toolCalls != null)
            {
                foreach (var item in toolCalls)
                {
                    response.ToolCalls.Add(new LLMToolCall
                    {
                        ID = item["id"]?.ToStringSafe() ?? Guid.NewGuid().ToString("N"),
                        FunctionName = item["function"]?["name"]?.ToStringSafe() ?? "",
                        Arguments = item["function"]?["arguments"]?.ToString(Formatting.None) ?? "{}"
                    });
                }
            }

            return response;
        }

        private static string ResolveOllamaEndpoint(string endpoint)
        {
            var normalized = endpoint.TrimEnd('/');
            if (normalized.EndsWith("/api/chat", StringComparison.OrdinalIgnoreCase) == true)
            {
                return normalized;
            }

            return normalized + "/api/chat";
        }
    }
}
