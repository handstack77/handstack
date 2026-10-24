using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Entity;
using prompter.Enumeration;
using prompter.Extensions;

namespace prompter.DataClient
{
    // 판단 계약을 바탕으로 TypeSafe 또는 로컬 Ollama의 판단 API를 호출합니다.
    public sealed class SystemOneClient(IHttpClientFactory httpClientFactory)
    {
        // TypeSafe 이미지 제한(파일당 16 MiB)과 두 제공자 공통의 요청 전체 제한(32 MiB)입니다.
        private const int MaxImageBytes = 16 * 1024 * 1024;
        private const int MaxRequestBytes = 32 * 1024 * 1024;

        public async Task<string> EvaluateAsync(TransactionDynamicObjects connection, string state, IReadOnlyList<LLMChatMedia>? images = null, CancellationToken cancellationToken = default)
        {
            images ??= [];
            var contract = connection.Statement.Decision ?? throw new InvalidOperationException("[decision_contract_required] 실행할 판단 계약이 필요합니다.");
            if (string.IsNullOrWhiteSpace(state) == true)
            {
                throw new InvalidOperationException("[decision_state_required] 판단할 입력 내용이 필요합니다.");
            }

            var ollama = connection.LLMProvider == LLMProviders.Ollama;
            if (ollama == false && connection.LLMProvider != LLMProviders.TypeSafe)
            {
                throw new InvalidOperationException("[decision_provider_unsupported] 판단 계약은 TypeSafe와 Ollama 제공자만 지원합니다.");
            }

            if (connection.Stream == true || connection.Think == true)
            {
                throw new InvalidOperationException("[decision_stream_think_unsupported] 판단 계약에서는 스트리밍과 추론 출력 옵션을 사용할 수 없습니다. Stream과 Think를 false로 설정하세요.");
            }

            if (string.IsNullOrWhiteSpace(connection.ModelID) == true)
            {
                throw new InvalidOperationException("[decision_model_required] 판단에 사용할 모델 식별자(ModelID)가 필요합니다.");
            }

            if (ollama == true && IsLocalModel(connection.ModelID) == false)
            {
                throw new InvalidOperationException("[decision_ollama_model_unsupported] 허용 목록에 없는 Ollama 판단 모델입니다. module.json의 AllowedOllamaDecisionModels에 모델 이름과 태그를 등록하세요.");
            }

            var endpoint = ResolveEndpoint(connection.Endpoint, ollama);
            // 데이터 소스에 키가 없으면 호스트 프로세스의 환경변수에서 읽습니다.
            var apiKey = string.IsNullOrWhiteSpace(connection.ApiKey) ? Environment.GetEnvironmentVariable("TYPESAFE_API_KEY") : connection.ApiKey;
            if (ollama == false && string.IsNullOrWhiteSpace(apiKey) == true)
            {
                throw new InvalidOperationException("[decision_missing_api_key] TypeSafe API 키가 필요합니다. 데이터 소스의 ApiKey 또는 TYPESAFE_API_KEY 환경변수를 설정하세요.");
            }

            if (images.Count > 0 && ollama == true && IsLocalImageModel(connection.ModelID) == false)
            {
                // 이미지를 읽지 못하는 모델이 이미지를 무시한 채 판단하지 않도록 호출 전에 차단합니다.
                throw new InvalidOperationException("[decision_image_model_unsupported] 이미지 판단을 지원하는 Ollama 모델이 아닙니다. module.json의 AllowedOllamaImageDecisionModels에 모델 이름과 태그를 등록하세요.");
            }

            DecisionContract.ValidateQuestions(contract.Questions);
            // 입력을 별도 JSON 값으로 직렬화하여 계약의 질문 기준과 분리합니다.
            var payload = new JObject
            {
                ["model"] = connection.ModelID,
                ["state"] = state,
                ["questions"] = contract.Questions.DeepClone()
            };

            if (images.Count > 0)
            {
                AttachImages(payload, ollama, state, images);
            }

            var body = payload.ToString(Formatting.None);
            if (images.Count > 0 && Encoding.UTF8.GetByteCount(body) > MaxRequestBytes)
            {
                throw new InvalidOperationException("[decision_image_too_large] 이미지를 포함한 판단 요청 전체가 32 MiB를 초과했습니다.");
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
            // TypeSafe 요청에만 인증 키를 첨부합니다.
            if (ollama == false)
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                if (images.Count > 0)
                {
                    // TypeSafe는 이미지 입력을 이 헤더가 있는 요청에서만 받습니다.
                    request.Headers.TryAddWithoutValidation("TypeSafe-Danger-Zone-Images", "true");
                }
            }

            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            var seconds = connection.Statement.Timeout == 0 ? 30 : connection.Statement.Timeout;
            if (seconds is < 1 or > 300)
            {
                throw new InvalidOperationException("[decision_timeout_invalid] 판단 요청의 제한 시간은 0(기본 30초) 또는 1~300초여야 합니다.");
            }

            timeout.CancelAfter(TimeSpan.FromSeconds(seconds));

            try
            {
                using var client = httpClientFactory.CreateClient("prompter.decision");
                using var response = await client.SendAsync(request, timeout.Token);
                if (response.IsSuccessStatusCode == false)
                {
                    throw new InvalidOperationException($"[decision_upstream_{(int)response.StatusCode}] 판단 API 호출에 실패했습니다. HTTP 상태 코드: {(int)response.StatusCode}");
                }

                var json = JObject.Parse(await response.Content.ReadAsStringAsync(timeout.Token), new JsonLoadSettings
                {
                    DuplicatePropertyNameHandling = DuplicatePropertyNameHandling.Error
                });
                DecisionContract.ValidateResponse(json, contract.Questions);

                if (json["model"] == null)
                {
                    json["model"] = connection.ModelID;
                }

                if (json["model"]?.Type != JTokenType.String || string.IsNullOrWhiteSpace((string?)json["model"]) == true)
                {
                    throw new InvalidDataException("[decision_invalid_response] 판단 응답의 모델 식별자는 비어 있지 않은 문자열이어야 합니다.");
                }

                return json.ToString(Formatting.None);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested == false)
            {
                throw new InvalidOperationException("[decision_upstream_timeout] 판단 API 요청의 제한 시간을 초과했습니다.");
            }
            catch (HttpRequestException)
            {
                throw new InvalidOperationException("[decision_upstream_unreachable] 판단 API와 통신하지 못했습니다. 서버 실행 상태와 연결 주소를 확인하세요.");
            }
            catch (Exception ex) when (ex is JsonException or InvalidDataException or FormatException or OverflowException or ArgumentException or InvalidCastException)
            {
                // 외부 응답 원문 대신 고정된 오류 코드와 설명을 반환합니다.
                throw new InvalidOperationException("[decision_invalid_response] 판단 API 응답의 형식이나 값이 계약과 일치하지 않습니다.");
            }
        }

        public static bool IsLocalModel(string model)
        {
            // 설정에 등록된 모델명과 태그를 대소문자까지 정확히 비교합니다.
            return ModuleConfiguration.AllowedOllamaDecisionModels.Contains(model, StringComparer.Ordinal);
        }

        public static bool IsLocalImageModel(string model)
        {
            return ModuleConfiguration.AllowedOllamaImageDecisionModels.Contains(model, StringComparer.Ordinal);
        }

        // 이미지를 제공자 형식에 맞춰 요청 본문에 추가합니다. Ollama는 images 배열, TypeSafe는 assets 맵과 state 참조를 사용합니다.
        private static void AttachImages(JObject payload, bool ollama, string state, IReadOnlyList<LLMChatMedia> images)
        {
            var ollamaImages = new JArray();
            var assets = new JObject();
            var references = new List<string>();
            foreach (var image in images)
            {
                byte[] data;
                DecisionImageInspector.ImageInfo info;
                try
                {
                    data = Convert.FromBase64String(image.Base64);
                    info = DecisionImageInspector.Inspect(data);
                }
                catch (Exception ex) when (ex is FormatException or InvalidDataException)
                {
                    throw new InvalidOperationException("[decision_image_invalid] 이미지가 올바른 PNG, JPEG 또는 WebP 파일이 아닙니다.");
                }

                var mimeType = image.MimeType == "image/jpg" ? "image/jpeg" : image.MimeType;
                if (DecisionImageInspector.ToMimeType(info.Format) != mimeType)
                {
                    throw new InvalidOperationException("[decision_image_invalid] 이미지의 실제 형식이 계약에 선언된 mimeType과 다릅니다.");
                }

                // 공백이나 줄바꿈이 섞인 입력도 표준 Base64 한 줄로 정규화합니다.
                var base64 = Convert.ToBase64String(data);
                if (ollama == true)
                {
                    ollamaImages.Add(base64);
                    continue;
                }

                if (info.Format == "webp" || info.Animated == true)
                {
                    throw new InvalidOperationException("[decision_image_format_unsupported] TypeSafe는 애니메이션이 아닌 PNG와 JPEG 이미지만 지원합니다.");
                }

                // TypeSafe는 범위를 벗어난 이미지를 조정하지 않고 요청 전체를 거부합니다.
                var pixels = (long)info.Width * info.Height;
                if (data.Length > MaxImageBytes || info.Width is < 280 or > 1568 || info.Height is < 280 or > 1568 || pixels is < 78400 or > 2458624)
                {
                    throw new InvalidOperationException("[decision_image_size_unsupported] TypeSafe 이미지는 파일 16 MiB 이하, 가로·세로 280~1568px, 전체 78,400~2,458,624px 범위여야 합니다.");
                }

                var reference = Guid.NewGuid().ToString();
                assets[reference] = new JObject
                {
                    ["type"] = "image",
                    ["format"] = info.Format,
                    ["data_base64"] = base64
                };
                references.Add(reference);
            }

            if (ollama == true)
            {
                payload["images"] = ollamaImages;
            }
            else
            {
                // 참조되지 않은 asset은 거부되므로 state 끝에 참조 키를 덧붙입니다.
                payload["state"] = state + "\n" + string.Join("\n", references);
                payload["assets"] = assets;
            }
        }

        public static Uri ResolveEndpoint(string endpoint, bool ollama)
        {
            var value = string.IsNullOrWhiteSpace(endpoint) ? (ollama ? "http://127.0.0.1:11434" : "https://api.typesafe.ai") : endpoint;
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri) == false || uri.Scheme is not ("http" or "https")
                || uri.UserInfo.Length > 0 || uri.Query.Length > 0 || uri.Fragment.Length > 0
                || (ollama == true && uri.IsLoopback == false) || (ollama == false && uri.Scheme != "https" && uri.IsLoopback == false))
            {
                throw new InvalidOperationException("[decision_endpoint_invalid] 판단 API 연결 주소가 올바르지 않습니다. HTTP 또는 HTTPS 주소에 사용자 정보, 쿼리 문자열, 프래그먼트를 포함할 수 없습니다. Ollama는 루프백 주소만, TypeSafe는 HTTPS 또는 루프백 HTTP 주소만 허용합니다.");
            }

            var path = uri.AbsoluteUri.TrimEnd('/');
            // 서버 기본 주소, 버전 경로, 전체 호출 경로를 동일한 판단 API 주소로 맞춥니다.
            return new Uri(path.EndsWith("/v1/systemone", StringComparison.Ordinal) ? path : path.EndsWith("/v1", StringComparison.Ordinal) ? path + "/systemone" : path + "/v1/systemone");
        }
    }
}
