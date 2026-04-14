using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace prompter.DataClient
{
    public class ClaudeChatClient : HttpLLMChatClient
    {
        public ClaudeChatClient(IHttpClientFactory httpClientFactory) : base(httpClientFactory)
        {
        }

        public override async Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default)
        {
            Require(request.ApiKey, "Claude ApiKey 설정 필요");
            Require(request.ModelID, "Claude ModelID 설정 필요");

            var endpoint = string.IsNullOrWhiteSpace(request.Endpoint) == true ? "https://api.anthropic.com/v1/messages" : request.Endpoint;
            var payload = new JObject
            {
                ["model"] = request.ModelID,
                ["max_tokens"] = request.MaxTokens,
                ["temperature"] = request.Temperature,
                ["top_p"] = request.TopP,
                ["messages"] = BuildClaudeMessages(request.ChatHistory, request.Prompt)
            };

            if (request.Tools.Count > 0 && request.ToolMode != "none")
            {
                payload["tools"] = new JArray(request.Tools.Select(tool => new JObject
                {
                    ["name"] = tool.FunctionName,
                    ["description"] = tool.Description,
                    ["input_schema"] = tool.Parameters
                }));

                payload["tool_choice"] = request.ToolMode == "required"
                    ? new JObject { ["type"] = "any" }
                    : new JObject { ["type"] = "auto" };
            }

            var json = await SendAsync(endpoint, payload, request, new Dictionary<string, string>
            {
                ["x-api-key"] = request.ApiKey,
                ["anthropic-version"] = "2023-06-01"
            }, cancellationToken);

            var response = new LLMChatResponse { Raw = json };
            var content = json["content"] as JArray;
            if (content != null)
            {
                var texts = new List<string>();
                foreach (var item in content)
                {
                    var type = item["type"]?.ToStringSafe();
                    if (type == "text")
                    {
                        texts.Add(item["text"]?.ToStringSafe() ?? "");
                    }
                    else if (type == "tool_use")
                    {
                        response.ToolCalls.Add(new LLMToolCall
                        {
                            ID = item["id"]?.ToStringSafe() ?? Guid.NewGuid().ToString("N"),
                            FunctionName = item["name"]?.ToStringSafe() ?? "",
                            Arguments = item["input"]?.ToString(Formatting.None) ?? "{}"
                        });
                    }
                }

                response.Content = string.Join("", texts);
            }

            return response;
        }

        private static JArray BuildClaudeMessages(IReadOnlyList<LLMChatMessage> messages, string prompt)
        {
            var result = new JArray();
            foreach (var message in messages)
            {
                var role = message.Role == "assistant" ? "assistant" : "user";
                var content = message.Role == "tool"
                    ? $"Tool result ({message.Name}): {message.Content}"
                    : message.Content.ToStringSafe();

                result.Add(new JObject
                {
                    ["role"] = role,
                    ["content"] = content
                });
            }

            if (string.IsNullOrWhiteSpace(prompt) == false)
            {
                result.Add(new JObject
                {
                    ["role"] = "user",
                    ["content"] = prompt
                });
            }

            return result;
        }
    }
}
