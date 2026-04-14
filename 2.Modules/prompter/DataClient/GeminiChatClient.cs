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
    public class GeminiChatClient : HttpLLMChatClient
    {
        public GeminiChatClient(IHttpClientFactory httpClientFactory) : base(httpClientFactory)
        {
        }

        public override async Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default)
        {
            Require(request.ApiKey, "Gemini ApiKey 설정 필요");
            Require(request.ModelID, "Gemini ModelID 설정 필요");

            var endpoint = string.IsNullOrWhiteSpace(request.Endpoint) == true
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(request.ModelID)}:generateContent"
                : request.Endpoint.Replace("{model}", Uri.EscapeDataString(request.ModelID), StringComparison.OrdinalIgnoreCase);

            if (endpoint.IndexOf("key=", StringComparison.OrdinalIgnoreCase) < 0)
            {
                request.QueryParameters["key"] = request.ApiKey;
            }

            var payload = new JObject
            {
                ["contents"] = BuildGeminiContents(request.ChatHistory, request.Prompt),
                ["generationConfig"] = new JObject
                {
                    ["maxOutputTokens"] = request.MaxTokens,
                    ["temperature"] = request.Temperature,
                    ["topP"] = request.TopP
                }
            };

            if (request.Tools.Count > 0 && request.ToolMode != "none")
            {
                payload["tools"] = new JArray(new JObject
                {
                    ["functionDeclarations"] = new JArray(request.Tools.Select(tool => new JObject
                    {
                        ["name"] = tool.FunctionName,
                        ["description"] = tool.Description,
                        ["parameters"] = tool.Parameters
                    }))
                });
            }

            var json = await SendAsync(endpoint, payload, request, new Dictionary<string, string>(), cancellationToken);
            var response = new LLMChatResponse { Raw = json };
            var parts = json["candidates"]?[0]?["content"]?["parts"] as JArray;
            if (parts != null)
            {
                var texts = new List<string>();
                foreach (var part in parts)
                {
                    if (part["text"] != null)
                    {
                        texts.Add(part["text"]?.ToStringSafe() ?? "");
                    }
                    else if (part["functionCall"] != null)
                    {
                        var functionCall = part["functionCall"];
                        response.ToolCalls.Add(new LLMToolCall
                        {
                            ID = Guid.NewGuid().ToString("N"),
                            FunctionName = functionCall?["name"]?.ToStringSafe() ?? "",
                            Arguments = functionCall?["args"]?.ToString(Formatting.None) ?? "{}"
                        });
                    }
                }

                response.Content = string.Join("", texts);
            }

            return response;
        }

        private static JArray BuildGeminiContents(IReadOnlyList<LLMChatMessage> messages, string prompt)
        {
            var result = new JArray();
            foreach (var message in messages)
            {
                var role = message.Role == "assistant" ? "model" : "user";
                var content = message.Role == "tool"
                    ? $"Tool result ({message.Name}): {message.Content}"
                    : message.Content.ToStringSafe();

                result.Add(new JObject
                {
                    ["role"] = role,
                    ["parts"] = new JArray(new JObject { ["text"] = content })
                });
            }

            if (string.IsNullOrWhiteSpace(prompt) == false)
            {
                result.Add(new JObject
                {
                    ["role"] = "user",
                    ["parts"] = new JArray(new JObject { ["text"] = prompt })
                });
            }

            return result;
        }
    }
}
