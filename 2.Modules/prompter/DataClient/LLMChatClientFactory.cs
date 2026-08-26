using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Microsoft.Extensions.DependencyInjection;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Enumeration;

namespace prompter.DataClient
{
    public class LLMChatClientFactory
    {
        private readonly IHttpClientFactory httpClientFactory;
        private readonly IServiceProvider serviceProvider;

        public LLMChatClientFactory(IHttpClientFactory httpClientFactory, IServiceProvider serviceProvider)
        {
            this.httpClientFactory = httpClientFactory;
            this.serviceProvider = serviceProvider;
        }

        public ILLMChatClient Create(LLMProviders provider)
        {
            return provider switch
            {
                LLMProviders.OpenAI => serviceProvider.GetRequiredService<OpenAICompatibleChatClient>(),
                LLMProviders.LMStudio => serviceProvider.GetRequiredService<LMStudioChatClient>(),
                LLMProviders.Claude => serviceProvider.GetRequiredService<ClaudeChatClient>(),
                LLMProviders.Gemini => serviceProvider.GetRequiredService<GeminiChatClient>(),
                LLMProviders.Ollama => serviceProvider.GetRequiredService<OllamaChatClient>(),
                LLMProviders.AzureOpenAI => serviceProvider.GetRequiredService<OpenAICompatibleChatClient>(),
                _ => new OpenAICompatibleChatClient(httpClientFactory)
            };
        }
    }

    public abstract class HttpLLMChatClient : ILLMChatClient
    {
        protected readonly IHttpClientFactory httpClientFactory;

        protected HttpLLMChatClient(IHttpClientFactory httpClientFactory)
        {
            this.httpClientFactory = httpClientFactory;
        }

        public abstract Task<LLMChatResponse> ChatAsync(LLMChatRequest request, CancellationToken cancellationToken = default);

        protected HttpClient CreateClient()
        {
            return httpClientFactory.CreateClient("prompter.llm");
        }

        protected static void Require(string value, string message)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                throw new InvalidOperationException(message);
            }
        }

        protected static void AddHeaders(HttpRequestMessage message, Dictionary<string, string> headers)
        {
            foreach (var item in headers)
            {
                if (string.IsNullOrWhiteSpace(item.Key) == true || item.Value == null)
                {
                    continue;
                }

                message.Headers.Remove(item.Key);
                message.Headers.TryAddWithoutValidation(item.Key, item.Value);
            }
        }

        protected static string AppendQueryParameters(string url, Dictionary<string, string> queryParameters)
        {
            var result = url;
            foreach (var item in queryParameters)
            {
                if (string.IsNullOrWhiteSpace(item.Key) == true || item.Value == null)
                {
                    continue;
                }

                var separator = result.IndexOf("?", StringComparison.Ordinal) > -1 ? "&" : "?";
                result = result + separator + Uri.EscapeDataString(item.Key) + "=" + Uri.EscapeDataString(item.Value);
            }

            return result;
        }

        protected static string ResolveOpenAICompatibleEndpoint(string endpoint, string defaultEndpoint)
        {
            if (string.IsNullOrWhiteSpace(endpoint) == true)
            {
                return defaultEndpoint;
            }

            var normalized = endpoint.TrimEnd('/');
            if (normalized.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase) == true)
            {
                return normalized;
            }

            if (normalized.EndsWith("/v1", StringComparison.OrdinalIgnoreCase) == true)
            {
                return normalized + "/chat/completions";
            }

            return normalized + "/v1/chat/completions";
        }

        protected static JArray BuildOpenAICompatibleMessages(IReadOnlyList<LLMChatMessage> messages, string prompt)
        {
            var result = new JArray();
            foreach (var message in messages)
            {
                var role = string.IsNullOrWhiteSpace(message.Role) == true ? "user" : message.Role;
                var item = new JObject
                {
                    ["role"] = role
                };

                if (string.IsNullOrEmpty(message.Name) == false)
                {
                    item["name"] = message.Name;
                }

                if (role == "tool")
                {
                    item["tool_call_id"] = message.ToolCallID;
                }

                if (message.Media.Count == 0)
                {
                    item["content"] = message.Content.ToStringSafe();
                }
                else
                {
                    var content = new JArray();
                    if (string.IsNullOrWhiteSpace(message.Content) == false)
                    {
                        content.Add(new JObject
                        {
                            ["type"] = "text",
                            ["text"] = message.Content
                        });
                    }

                    foreach (var media in message.Media)
                    {
                        if (string.Equals(media.Type, "Image", StringComparison.OrdinalIgnoreCase) == true)
                        {
                            content.Add(new JObject
                            {
                                ["type"] = "image_url",
                                ["image_url"] = new JObject
                                {
                                    ["url"] = $"data:{media.MimeType};base64,{media.Base64}"
                                }
                            });
                        }
                        else
                        {
                            content.Add(new JObject
                            {
                                ["type"] = "input_audio",
                                ["input_audio"] = new JObject
                                {
                                    ["data"] = media.Base64,
                                    ["format"] = GetOpenAIAudioFormat(media.MimeType)
                                }
                            });
                        }
                    }

                    item["content"] = content;
                }

                if (message.ToolCalls.Count > 0)
                {
                    item["tool_calls"] = BuildOpenAIToolCalls(message.ToolCalls);
                }

                result.Add(item);
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

        protected static JArray BuildOllamaMessages(IReadOnlyList<LLMChatMessage> messages, string prompt)
        {
            var result = new JArray();
            foreach (var message in messages)
            {
                var role = string.IsNullOrWhiteSpace(message.Role) == true ? "user" : message.Role;
                var item = new JObject
                {
                    ["role"] = role,
                    ["content"] = message.Content.ToStringSafe()
                };

                if (string.IsNullOrEmpty(message.Name) == false)
                {
                    item["name"] = message.Name;
                }

                if (role == "tool")
                {
                    item["tool_call_id"] = message.ToolCallID;
                }

                if (message.Media.Count > 0)
                {
                    item["images"] = new JArray(message.Media.ConvertAll(media => media.Base64));
                }

                if (message.ToolCalls.Count > 0)
                {
                    item["tool_calls"] = BuildOpenAIToolCalls(message.ToolCalls);
                }

                result.Add(item);
            }

            if (string.IsNullOrWhiteSpace(prompt) == false)
            {
                result.Add(new JObject
                {
                    ["role"] = "user",
                    ["content"] = prompt
                });
            }

            EnsureOllamaUserQuery(result);
            return result;
        }

        private static void EnsureOllamaUserQuery(JArray messages)
        {
            var hasUserQuery = messages
                .OfType<JObject>()
                .Any(item => string.Equals(item["role"]?.ToStringSafe(), "user", StringComparison.OrdinalIgnoreCase) == true
                    && (string.IsNullOrWhiteSpace(item["content"]?.ToStringSafe()) == false
                        || item["images"] is JArray images && images.Count > 0));
            if (hasUserQuery == true)
            {
                return;
            }

            var fallbackMessage = messages
                .OfType<JObject>()
                .LastOrDefault(item => string.Equals(item["role"]?.ToStringSafe(), "system", StringComparison.OrdinalIgnoreCase) == true
                    && (string.IsNullOrWhiteSpace(item["content"]?.ToStringSafe()) == false
                        || item["images"] is JArray images && images.Count > 0));
            if (fallbackMessage == null)
            {
                throw new InvalidOperationException("Ollama 요청에 비어 있지 않은 user 메시지가 필요합니다.");
            }

            // qwen3 계열 Ollama 템플릿은 user role이 없는 legacy 단일 system 프롬프트를 거부합니다.
            fallbackMessage["role"] = "user";
        }

        protected static void ValidateMediaSupport(LLMChatRequest request, string provider, bool supportsImage, bool supportsAudio)
        {
            foreach (var message in request.ChatHistory)
            {
                foreach (var media in message.Media)
                {
                    var isImage = string.Equals(media.Type, "Image", StringComparison.OrdinalIgnoreCase);
                    var isAudio = string.Equals(media.Type, "Audio", StringComparison.OrdinalIgnoreCase);
                    if ((isImage == true && supportsImage == false) || (isAudio == true && supportsAudio == false))
                    {
                        throw new NotSupportedException($"{provider} 제공자는 {media.Type} media 입력을 지원하지 않습니다: mimeType={media.MimeType}");
                    }
                }
            }
        }

        private static string GetOpenAIAudioFormat(string mimeType)
        {
            if (string.Equals(mimeType, "audio/wav", StringComparison.OrdinalIgnoreCase) == true
                || string.Equals(mimeType, "audio/x-wav", StringComparison.OrdinalIgnoreCase) == true)
            {
                return "wav";
            }

            if (string.Equals(mimeType, "audio/mpeg", StringComparison.OrdinalIgnoreCase) == true
                || string.Equals(mimeType, "audio/mp3", StringComparison.OrdinalIgnoreCase) == true)
            {
                return "mp3";
            }

            throw new NotSupportedException($"OpenAI input_audio에서 지원하지 않는 mimeType입니다: {mimeType}. audio/wav 또는 audio/mpeg를 사용하세요.");
        }

        protected static JArray BuildOpenAIToolCalls(IReadOnlyList<LLMToolCall> toolCalls)
        {
            var result = new JArray();
            foreach (var toolCall in toolCalls)
            {
                result.Add(new JObject
                {
                    ["id"] = toolCall.ID,
                    ["type"] = "function",
                    ["function"] = new JObject
                    {
                        ["name"] = toolCall.FunctionName,
                        ["arguments"] = string.IsNullOrWhiteSpace(toolCall.Arguments) == true ? "{}" : toolCall.Arguments
                    }
                });
            }

            return result;
        }

        protected static JArray BuildOpenAITools(IReadOnlyList<LLMToolDefinition> tools)
        {
            var result = new JArray();
            foreach (var tool in tools)
            {
                result.Add(new JObject
                {
                    ["type"] = "function",
                    ["function"] = new JObject
                    {
                        ["name"] = tool.FunctionName,
                        ["description"] = tool.Description,
                        ["parameters"] = tool.Parameters
                    }
                });
            }

            return result;
        }

        protected static void ApplyOpenAITools(JObject payload, LLMChatRequest request)
        {
            if (request.Tools.Count == 0 || request.ToolMode == "none")
            {
                return;
            }

            payload["tools"] = BuildOpenAITools(request.Tools);
            if (request.ToolMode == "required")
            {
                payload["tool_choice"] = "required";
            }
            else
            {
                payload["tool_choice"] = "auto";
            }
        }

        protected static HttpContent CreateHttpContent(JObject payload, LLMRequestBody requestBody)
        {
            if (string.Equals(requestBody.Type, "form-data", StringComparison.OrdinalIgnoreCase) == true)
            {
                var multipart = new MultipartFormDataContent();
                multipart.Add(new StringContent(payload.ToString(Formatting.None), Encoding.UTF8, "application/json"), "payload");
                foreach (var part in requestBody.Parts)
                {
                    if (part.Type == "file")
                    {
                        var fileContent = new ByteArrayContent(part.Content ?? Array.Empty<byte>());
                        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(string.IsNullOrWhiteSpace(part.ContentType) == true ? "application/octet-stream" : part.ContentType);
                        multipart.Add(fileContent, part.Name, string.IsNullOrWhiteSpace(part.FileName) == true ? part.Name : part.FileName);
                    }
                    else
                    {
                        multipart.Add(new StringContent(part.Value.ToStringSafe(), Encoding.UTF8), part.Name);
                    }
                }

                return multipart;
            }

            if (string.IsNullOrWhiteSpace(requestBody.RawText) == false)
            {
                try
                {
                    var bodyToken = JToken.Parse(requestBody.RawText);
                    if (bodyToken is JObject bodyObject)
                    {
                        foreach (var item in bodyObject)
                        {
                            payload[item.Key] = item.Value;
                        }
                    }
                }
                catch
                {
                    payload["body"] = requestBody.RawText;
                }
            }

            return new StringContent(payload.ToString(Formatting.None), Encoding.UTF8, "application/json");
        }

        protected async Task<JObject> SendAsync(string endpoint, JObject payload, LLMChatRequest request, Dictionary<string, string> providerHeaders, CancellationToken cancellationToken)
        {
            var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in providerHeaders)
            {
                headers[item.Key] = item.Value;
            }

            foreach (var item in request.Headers)
            {
                headers[item.Key] = item.Value;
            }

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, AppendQueryParameters(endpoint, request.QueryParameters));
            AddHeaders(requestMessage, headers);
            requestMessage.Content = CreateHttpContent(payload, request.Body);

            var client = CreateClient();
            var response = await client.SendAsync(requestMessage, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            if (response.IsSuccessStatusCode == false)
            {
                throw new InvalidOperationException($"LLM provider HTTP {(int)response.StatusCode} {response.ReasonPhrase}: {responseText}");
            }

            if (string.IsNullOrWhiteSpace(responseText) == true)
            {
                return new JObject();
            }

            var token = JToken.Parse(responseText);
            return token as JObject ?? new JObject { ["value"] = token };
        }

        protected static LLMChatResponse ParseOpenAICompatibleResponse(JObject json)
        {
            var response = new LLMChatResponse { Raw = json };
            var message = json["choices"]?[0]?["message"];
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
                        Arguments = item["function"]?["arguments"]?.ToStringSafe() ?? "{}"
                    });
                }
            }

            return response;
        }
    }
}
