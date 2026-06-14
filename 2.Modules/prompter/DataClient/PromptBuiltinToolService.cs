using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.DataObject;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using prompter.Entity;
using prompter.Enumeration;
using prompter.Extensions;

using UglyToad.PdfPig;

namespace prompter.DataClient
{
    public class PromptBuiltinToolService
    {
        private static readonly HashSet<string> SupportedToolNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "corpus_rag_search",
            "generate_image",
            "skill_search",
            "skill_install"
        };

        private static readonly HashSet<string> CorpusExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".docx",
            ".pptx",
            ".xlsx",
            ".pdf",
            ".txt",
            ".md"
        };

        private readonly IHttpClientFactory httpClientFactory;
        private readonly ConcurrentDictionary<string, CorpusDocumentCache> corpusCache = new ConcurrentDictionary<string, CorpusDocumentCache>(StringComparer.OrdinalIgnoreCase);

        public PromptBuiltinToolService(IHttpClientFactory httpClientFactory)
        {
            this.httpClientFactory = httpClientFactory;
        }

        public static bool IsSupported(string name)
        {
            return SupportedToolNames.Contains(name);
        }

        public static string GetDescription(string name)
        {
            return name switch
            {
                "corpus_rag_search" => "Search uploaded drive documents and return the most relevant snippets for a question.",
                "generate_image" => "Generate a new image from a text prompt using the configured OpenAI image source.",
                "skill_search" => "Search skills.sh for skills that can extend the agent capability.",
                "skill_install" => "Install an explicitly selected skills.sh skill into the configured server skills directory.",
                _ => name
            };
        }

        public static JObject BuildParameterSchema(string name)
        {
            return name switch
            {
                "corpus_rag_search" => new JObject
                {
                    ["type"] = "object",
                    ["properties"] = new JObject
                    {
                        ["query"] = new JObject
                        {
                            ["type"] = "string",
                            ["description"] = "Question or search text."
                        },
                        ["topK"] = new JObject
                        {
                            ["type"] = "integer",
                            ["description"] = "Maximum number of snippets to return."
                        }
                    },
                    ["required"] = new JArray("query")
                },
                "generate_image" => new JObject
                {
                    ["type"] = "object",
                    ["properties"] = new JObject
                    {
                        ["prompt"] = new JObject
                        {
                            ["type"] = "string",
                            ["description"] = "Image generation prompt."
                        },
                        ["size"] = new JObject
                        {
                            ["type"] = "string",
                            ["description"] = "Image size such as 1024x1024."
                        }
                    },
                    ["required"] = new JArray("prompt")
                },
                "skill_search" => new JObject
                {
                    ["type"] = "object",
                    ["properties"] = new JObject
                    {
                        ["query"] = new JObject
                        {
                            ["type"] = "string",
                            ["description"] = "Capability or skill search query."
                        },
                        ["limit"] = new JObject
                        {
                            ["type"] = "integer",
                            ["description"] = "Maximum number of skills."
                        }
                    },
                    ["required"] = new JArray("query")
                },
                "skill_install" => new JObject
                {
                    ["type"] = "object",
                    ["properties"] = new JObject
                    {
                        ["id"] = new JObject
                        {
                            ["type"] = "string",
                            ["description"] = "skills.sh skill id, for example owner/repo/skill."
                        }
                    },
                    ["required"] = new JArray("id")
                },
                _ => new JObject
                {
                    ["type"] = "object",
                    ["properties"] = new JObject()
                }
            };
        }

        public async Task<string> ExecuteAsync(string name, string arguments, PromptAgentOptions agentOptions, CancellationToken cancellationToken)
        {
            var args = ParseArguments(arguments);
            var result = name switch
            {
                "corpus_rag_search" => await SearchCorpusAsync(args, agentOptions, cancellationToken),
                "generate_image" => await GenerateImageAsync(args, cancellationToken),
                "skill_search" => await SearchSkillsAsync(args.Value<string>("query").ToStringSafe(), args.Value<int?>("limit") ?? 5, cancellationToken),
                "skill_install" => await InstallSkillAsync(args.Value<string>("id").ToStringSafe(), cancellationToken),
                _ => JsonError($"지원하지 않는 built-in tool 입니다: {name}")
            };

            return result;
        }

        public async Task<string> SearchSkillsAsync(string query, int limit, CancellationToken cancellationToken)
        {
            if (ModuleConfiguration.EnableSkillSearch == false)
            {
                return JsonError("Skill search 기능이 module 설정에서 비활성화되어 있습니다.");
            }

            if (string.IsNullOrWhiteSpace(query) == true || query.Trim().Length < 2)
            {
                return JsonError("skill_search query는 2자 이상이어야 합니다.");
            }

            limit = Math.Clamp(limit <= 0 ? 5 : limit, 1, 20);
            var endpoint = $"{GetSkillsBaseUrl()}/api/v1/skills/search?q={Uri.EscapeDataString(query.Trim())}&limit={limit}";
            var response = await SendSkillsGetAsync(endpoint, cancellationToken);
            if (response.IsSuccessStatusCode == false)
            {
                return await JsonHttpErrorAsync("skills.sh search", response, cancellationToken);
            }

            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            return LimitText(responseText, 24000);
        }

        public async Task<string> InstallSkillAsync(string id, CancellationToken cancellationToken)
        {
            if (ModuleConfiguration.EnableSkillInstall == false)
            {
                return JsonError("Skill install 기능이 module 설정에서 비활성화되어 있습니다.");
            }

            if (string.IsNullOrWhiteSpace(id) == true)
            {
                return JsonError("설치할 skills.sh skill id가 필요합니다.");
            }

            if (string.IsNullOrWhiteSpace(ModuleConfiguration.SkillBasePath) == true)
            {
                return JsonError("SkillBasePath 설정이 필요합니다.");
            }

            var audit = await GetSkillAuditAsync(id, cancellationToken);
            if (audit.Blocked == true)
            {
                return JsonError($"Skill audit 차단: {audit.Message}", audit.Raw);
            }

            var detailEndpoint = $"{GetSkillsBaseUrl()}/api/v1/skills/{Uri.EscapeDataString(id).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";
            var detailResponse = await SendSkillsGetAsync(detailEndpoint, cancellationToken);
            if (detailResponse.IsSuccessStatusCode == false)
            {
                return await JsonHttpErrorAsync("skills.sh detail", detailResponse, cancellationToken);
            }

            var detailText = await detailResponse.Content.ReadAsStringAsync(cancellationToken);
            var detail = JObject.Parse(detailText);
            var files = detail["files"] as JArray;
            if (files == null || files.Count == 0)
            {
                return JsonError("skills.sh detail 응답에 설치 가능한 files 정보가 없습니다.", detail);
            }

            var skillRoot = Path.GetFullPath(Path.Combine(ModuleConfiguration.SkillBasePath, SanitizeSkillPath(id)));
            var skillBase = Path.GetFullPath(ModuleConfiguration.SkillBasePath);
            EnsureUnderBasePath(skillRoot, skillBase, "SkillBasePath");

            var fileCount = 0;
            foreach (var file in files.OfType<JObject>())
            {
                var relativePath = file.Value<string>("path").ToStringSafe();
                if (IsSafeRelativePath(relativePath) == false)
                {
                    return JsonError($"허용되지 않은 skill file path: {relativePath}");
                }

                var targetPath = Path.GetFullPath(Path.Combine(skillRoot, relativePath.Replace('/', Path.DirectorySeparatorChar)));
                EnsureUnderBasePath(targetPath, skillRoot, "skill install path");
                Directory.CreateDirectory(Path.GetDirectoryName(targetPath).ToStringSafe());
                await File.WriteAllTextAsync(targetPath, file.Value<string>("contents").ToStringSafe(), Encoding.UTF8, cancellationToken);
                fileCount++;
            }

            return new JObject
            {
                ["id"] = id,
                ["installedPath"] = skillRoot,
                ["fileCount"] = fileCount,
                ["audit"] = audit.Raw ?? new JObject { ["message"] = audit.Message }
            }.ToString(Formatting.None);
        }

        private async Task<string> SearchCorpusAsync(JObject args, PromptAgentOptions agentOptions, CancellationToken cancellationToken)
        {
            var query = args.Value<string>("query").ToStringSafe();
            if (string.IsNullOrWhiteSpace(query) == true)
            {
                return JsonError("corpus_rag_search query가 필요합니다.");
            }

            if (ModuleConfiguration.DriveBasePaths.Count == 0)
            {
                return JsonError("DriveBasePaths 설정이 필요합니다.");
            }

            var topK = args.Value<int?>("topK") ?? agentOptions.DriveTopK;
            topK = Math.Clamp(topK <= 0 ? 5 : topK, 1, 20);
            var queryTerms = Tokenize(query).ToArray();
            if (queryTerms.Length == 0)
            {
                return JsonError("검색 가능한 query token이 없습니다.");
            }

            var matches = new List<CorpusMatch>();
            foreach (var basePath in ModuleConfiguration.DriveBasePaths)
            {
                if (Directory.Exists(basePath) == false)
                {
                    continue;
                }

                var fullBasePath = Path.GetFullPath(basePath);
                var files = Directory.EnumerateFiles(fullBasePath, "*.*", SearchOption.AllDirectories)
                    .Where(item => CorpusExtensions.Contains(Path.GetExtension(item)));

                foreach (var file in files)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var fullPath = Path.GetFullPath(file);
                    EnsureUnderBasePath(fullPath, fullBasePath, "DriveBasePaths");
                    foreach (var chunk in GetDocumentChunks(fullPath))
                    {
                        var score = ScoreChunk(chunk.Text, query, queryTerms);
                        if (score <= 0)
                        {
                            continue;
                        }

                        matches.Add(new CorpusMatch(fullPath, chunk.Index, score, BuildSnippet(chunk.Text, queryTerms)));
                    }
                }
            }

            var results = matches
                .OrderByDescending(item => item.Score)
                .ThenBy(item => item.FilePath)
                .Take(topK)
                .Select(item => new JObject
                {
                    ["fileName"] = Path.GetFileName(item.FilePath),
                    ["path"] = item.FilePath,
                    ["extension"] = Path.GetExtension(item.FilePath),
                    ["chunkIndex"] = item.ChunkIndex,
                    ["score"] = Math.Round(item.Score, 4),
                    ["snippet"] = item.Snippet
                });

            return new JObject
            {
                ["query"] = query,
                ["count"] = matches.Count,
                ["results"] = new JArray(results)
            }.ToString(Formatting.None);
        }

        private async Task<string> GenerateImageAsync(JObject args, CancellationToken cancellationToken)
        {
            var prompt = args.Value<string>("prompt").ToStringSafe();
            if (string.IsNullOrWhiteSpace(prompt) == true)
            {
                return JsonError("generate_image prompt가 필요합니다.");
            }

            var source = ResolveImageSource();
            if (source == null)
            {
                return JsonError("OpenAI 이미지 생성을 위한 LLMSource 설정이 필요합니다.");
            }

            var apiKey = source.IsEncryption.ParseBool() == true ? PromptMapper.DecryptApiKey(source) : source.ApiKey;
            if (string.IsNullOrWhiteSpace(apiKey) == true)
            {
                return JsonError("OpenAI 이미지 생성을 위한 ApiKey 설정이 필요합니다.");
            }

            var provider = PromptMapper.ParseLLMProvider(string.IsNullOrWhiteSpace(source.LLMProvider) == true ? source.DataProvider : source.LLMProvider);
            if (provider != LLMProviders.OpenAI && provider != LLMProviders.AzureOpenAI)
            {
                return JsonError("generate_image는 OpenAI 또는 AzureOpenAI LLMSource만 지원합니다.");
            }

            var modelID = string.IsNullOrWhiteSpace(ModuleConfiguration.ImageGenerationModelID) == true
                ? (string.IsNullOrWhiteSpace(source.ModelID) == true ? "gpt-image-1" : source.ModelID)
                : ModuleConfiguration.ImageGenerationModelID;
            var size = string.IsNullOrWhiteSpace(args.Value<string>("size")) == true ? "1024x1024" : args.Value<string>("size").ToStringSafe();
            var endpoint = ResolveOpenAIImageEndpoint(source.Endpoint.ToStringSafe());
            var payload = new JObject
            {
                ["model"] = modelID,
                ["prompt"] = prompt,
                ["size"] = size,
                ["n"] = 1
            };

            var message = new HttpRequestMessage(HttpMethod.Post, endpoint);
            message.Headers.TryAddWithoutValidation("Authorization", "Bearer " + apiKey);
            message.Content = new StringContent(payload.ToString(Formatting.None), Encoding.UTF8, "application/json");

            var client = httpClientFactory.CreateClient("prompter.llm");
            using var response = await client.SendAsync(message, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            if (response.IsSuccessStatusCode == false)
            {
                return JsonError($"OpenAI image HTTP {(int)response.StatusCode} {response.ReasonPhrase}", TryParseJson(responseText));
            }

            var json = JObject.Parse(responseText);
            var first = json["data"]?[0] as JObject;
            var b64 = first?.Value<string>("b64_json").ToStringSafe();
            var url = first?.Value<string>("url").ToStringSafe();
            if (string.IsNullOrWhiteSpace(b64) == false)
            {
                var imagePath = await SaveGeneratedImageAsync(b64, cancellationToken);
                return new JObject
                {
                    ["model"] = modelID,
                    ["filePath"] = imagePath,
                    ["fileName"] = Path.GetFileName(imagePath),
                    ["mimeType"] = "image/png"
                }.ToString(Formatting.None);
            }

            if (string.IsNullOrWhiteSpace(url) == false)
            {
                return new JObject
                {
                    ["model"] = modelID,
                    ["url"] = url
                }.ToString(Formatting.None);
            }

            return JsonError("OpenAI image 응답에서 b64_json 또는 url을 확인하지 못했습니다.", json);
        }

        private IEnumerable<CorpusChunk> GetDocumentChunks(string filePath)
        {
            var fileInfo = new FileInfo(filePath);
            var cacheKey = fileInfo.FullName;
            if (corpusCache.TryGetValue(cacheKey, out var cached) == true &&
                cached.Length == fileInfo.Length &&
                cached.LastWriteTimeUtc == fileInfo.LastWriteTimeUtc)
            {
                return cached.Chunks;
            }

            var text = ExtractDocumentText(fileInfo.FullName);
            var chunks = SplitChunks(NormalizeWhitespace(text)).ToList();
            corpusCache[cacheKey] = new CorpusDocumentCache(fileInfo.LastWriteTimeUtc, fileInfo.Length, chunks);
            return chunks;
        }

        private static string ExtractDocumentText(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".txt" or ".md" => File.ReadAllText(filePath, Encoding.UTF8),
                ".docx" => ExtractZipXmlText(filePath, entry => entry.FullName.StartsWith("word/", StringComparison.OrdinalIgnoreCase) && entry.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase)),
                ".pptx" => ExtractZipXmlText(filePath, entry => entry.FullName.StartsWith("ppt/slides/", StringComparison.OrdinalIgnoreCase) && entry.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase)),
                ".xlsx" => ExtractZipXmlText(filePath, entry =>
                    entry.FullName.Equals("xl/sharedStrings.xml", StringComparison.OrdinalIgnoreCase) ||
                    (entry.FullName.StartsWith("xl/worksheets/", StringComparison.OrdinalIgnoreCase) && entry.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))),
                ".pdf" => ExtractPdfText(filePath),
                _ => ""
            };
        }

        private static string ExtractZipXmlText(string filePath, Func<ZipArchiveEntry, bool> filter)
        {
            var builder = new StringBuilder();
            using var archive = ZipFile.OpenRead(filePath);
            foreach (var entry in archive.Entries.Where(filter))
            {
                using var stream = entry.Open();
                var document = XDocument.Load(stream);
                var values = document.Descendants()
                    .Where(item => item.Name.LocalName == "t" || item.Name.LocalName == "v")
                    .Select(item => item.Value)
                    .Where(item => string.IsNullOrWhiteSpace(item) == false);
                foreach (var value in values)
                {
                    builder.AppendLine(value);
                }
            }

            return builder.ToString();
        }

        private static string ExtractPdfText(string filePath)
        {
            var builder = new StringBuilder();
            using var document = PdfDocument.Open(filePath);
            foreach (var page in document.GetPages())
            {
                builder.AppendLine(page.Text);
            }

            return builder.ToString();
        }

        private static IEnumerable<CorpusChunk> SplitChunks(string text)
        {
            const int chunkSize = 1200;
            const int overlap = 160;
            if (string.IsNullOrWhiteSpace(text) == true)
            {
                yield break;
            }

            var index = 0;
            var position = 0;
            while (position < text.Length)
            {
                var length = Math.Min(chunkSize, text.Length - position);
                yield return new CorpusChunk(index, text.Substring(position, length));
                index++;
                if (position + length >= text.Length)
                {
                    break;
                }

                position += chunkSize - overlap;
            }
        }

        private static double ScoreChunk(string text, string query, string[] terms)
        {
            var normalizedText = text.ToLowerInvariant();
            var score = 0.0;
            foreach (var term in terms)
            {
                score += CountOccurrences(normalizedText, term) * (term.Length > 3 ? 1.4 : 1.0);
            }

            if (normalizedText.Contains(query.ToLowerInvariant(), StringComparison.OrdinalIgnoreCase) == true)
            {
                score += 5.0;
            }

            return score;
        }

        private static int CountOccurrences(string text, string term)
        {
            if (string.IsNullOrWhiteSpace(term) == true)
            {
                return 0;
            }

            var count = 0;
            var index = 0;
            while ((index = text.IndexOf(term, index, StringComparison.OrdinalIgnoreCase)) >= 0)
            {
                count++;
                index += term.Length;
            }

            return count;
        }

        private static string BuildSnippet(string text, string[] terms)
        {
            var lowerText = text.ToLowerInvariant();
            var firstIndex = terms
                .Select(term => lowerText.IndexOf(term, StringComparison.OrdinalIgnoreCase))
                .Where(index => index >= 0)
                .DefaultIfEmpty(0)
                .Min();
            var start = Math.Max(0, firstIndex - 160);
            var length = Math.Min(520, text.Length - start);
            return text.Substring(start, length).Trim();
        }

        private static IEnumerable<string> Tokenize(string value)
        {
            return Regex.Split(value.ToLowerInvariant(), @"[^\p{L}\p{Nd}]+")
                .Where(item => item.Length >= 2)
                .Distinct();
        }

        private static string NormalizeWhitespace(string value)
        {
            return Regex.Replace(value.ToStringSafe(), @"\s+", " ").Trim();
        }

        private static JObject ParseArguments(string arguments)
        {
            if (string.IsNullOrWhiteSpace(arguments) == true)
            {
                return new JObject();
            }

            try
            {
                return JObject.Parse(arguments);
            }
            catch
            {
                return new JObject();
            }
        }

        private LLMSource? ResolveImageSource()
        {
            if (string.IsNullOrWhiteSpace(ModuleConfiguration.ImageGenerationDataSourceID) == false)
            {
                var configured = ModuleConfiguration.LLMSource.FirstOrDefault(item =>
                    string.Equals(item.DataSourceID, ModuleConfiguration.ImageGenerationDataSourceID, StringComparison.OrdinalIgnoreCase));
                if (configured != null)
                {
                    return configured;
                }
            }

            return ModuleConfiguration.LLMSource.FirstOrDefault(item =>
            {
                var provider = PromptMapper.ParseLLMProvider(string.IsNullOrWhiteSpace(item.LLMProvider) == true ? item.DataProvider : item.LLMProvider);
                return provider == LLMProviders.OpenAI || provider == LLMProviders.AzureOpenAI;
            });
        }

        private static string ResolveOpenAIImageEndpoint(string endpoint)
        {
            if (string.IsNullOrWhiteSpace(endpoint) == true)
            {
                return "https://api.openai.com/v1/images/generations";
            }

            var normalized = endpoint.TrimEnd('/');
            if (normalized.EndsWith("/images/generations", StringComparison.OrdinalIgnoreCase) == true)
            {
                return normalized;
            }

            if (normalized.EndsWith("/v1", StringComparison.OrdinalIgnoreCase) == true)
            {
                return normalized + "/images/generations";
            }

            return normalized + "/v1/images/generations";
        }

        private static async Task<string> SaveGeneratedImageAsync(string b64, CancellationToken cancellationToken)
        {
            var basePath = string.IsNullOrWhiteSpace(ModuleConfiguration.GeneratedImageBasePath) == true
                ? Path.Combine(ModuleConfiguration.ModuleBasePath, "generated-images")
                : ModuleConfiguration.GeneratedImageBasePath;
            Directory.CreateDirectory(basePath);
            var filePath = Path.Combine(basePath, $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}.png");
            await File.WriteAllBytesAsync(filePath, Convert.FromBase64String(b64), cancellationToken);
            return Path.GetFullPath(filePath);
        }

        private async Task<HttpResponseMessage> SendSkillsGetAsync(string endpoint, CancellationToken cancellationToken)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            var token = string.IsNullOrWhiteSpace(ModuleConfiguration.SkillsApiBearerToken) == true
                ? Environment.GetEnvironmentVariable("VERCEL_OIDC_TOKEN").ToStringSafe()
                : ModuleConfiguration.SkillsApiBearerToken;
            if (string.IsNullOrWhiteSpace(token) == false)
            {
                request.Headers.TryAddWithoutValidation("Authorization", token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true ? token : "Bearer " + token);
            }

            var client = httpClientFactory.CreateClient("prompter.llm");
            return await client.SendAsync(request, cancellationToken);
        }

        private async Task<SkillAuditResult> GetSkillAuditAsync(string id, CancellationToken cancellationToken)
        {
            var endpoint = $"{GetSkillsBaseUrl()}/api/v1/skills/audit/{Uri.EscapeDataString(id).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";
            using var response = await SendSkillsGetAsync(endpoint, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new SkillAuditResult(false, "audit 정보가 없어 사용자 명시 설치만 허용합니다.", TryParseJson(responseText));
            }

            if (response.IsSuccessStatusCode == false)
            {
                return new SkillAuditResult(true, $"audit 확인 실패 HTTP {(int)response.StatusCode}", TryParseJson(responseText));
            }

            var audit = JObject.Parse(responseText);
            var audits = audit["audits"] as JArray ?? new JArray();
            foreach (var item in audits.OfType<JObject>())
            {
                var status = item.Value<string>("status").ToStringSafe();
                var riskLevel = item.Value<string>("riskLevel").ToStringSafe();
                if (string.Equals(status, "fail", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(riskLevel, "HIGH", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(riskLevel, "CRITICAL", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return new SkillAuditResult(true, item.Value<string>("summary").ToStringSafe(), audit);
                }
            }

            return new SkillAuditResult(false, "audit 통과", audit);
        }

        private static string GetSkillsBaseUrl()
        {
            return string.IsNullOrWhiteSpace(ModuleConfiguration.SkillsBaseUrl) == true
                ? "https://skills.sh"
                : ModuleConfiguration.SkillsBaseUrl.TrimEnd('/');
        }

        private static async Task<string> JsonHttpErrorAsync(string name, HttpResponseMessage response, CancellationToken cancellationToken)
        {
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonError($"{name} HTTP {(int)response.StatusCode} {response.ReasonPhrase}", TryParseJson(responseText));
        }

        private static string JsonError(string message, JToken? detail = null)
        {
            var result = new JObject
            {
                ["error"] = message
            };

            if (detail != null)
            {
                result["detail"] = detail;
            }

            return result.ToString(Formatting.None);
        }

        private static JToken TryParseJson(string value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return new JObject();
            }

            try
            {
                return JToken.Parse(value);
            }
            catch
            {
                return new JValue(LimitText(value, 4000));
            }
        }

        private static string LimitText(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value) == true || value.Length <= maxLength)
            {
                return value;
            }

            return value.Substring(0, maxLength) + "\n...[truncated]";
        }

        private static string SanitizeSkillPath(string id)
        {
            var segments = id.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(SanitizePathSegment)
                .Where(item => string.IsNullOrWhiteSpace(item) == false);
            return Path.Combine(segments.ToArray());
        }

        private static string SanitizePathSegment(string value)
        {
            var invalid = Path.GetInvalidFileNameChars();
            var builder = new StringBuilder(value.Length);
            foreach (var ch in value)
            {
                builder.Append(invalid.Contains(ch) == true ? '_' : ch);
            }

            return builder.ToString();
        }

        private static bool IsSafeRelativePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path) == true || Path.IsPathRooted(path) == true)
            {
                return false;
            }

            var segments = path.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return segments.Any(item => item == "..") == false;
        }

        private static void EnsureUnderBasePath(string path, string basePath, string label)
        {
            var fullPath = Path.GetFullPath(path);
            var fullBasePath = Path.GetFullPath(basePath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (string.Equals(fullPath, fullBasePath, StringComparison.OrdinalIgnoreCase) == true)
            {
                return;
            }

            if (fullPath.StartsWith(fullBasePath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) == false &&
                fullPath.StartsWith(fullBasePath + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) == false)
            {
                throw new InvalidOperationException($"허용되지 않은 {label} 경로: {path}");
            }
        }
    }

    public record PromptAgentOptions
    {
        public bool UseDrive { get; set; }

        public bool UseImageGeneration { get; set; }

        public bool UseSkills { get; set; }

        public bool AllowSkillInstall { get; set; }

        public int DriveTopK { get; set; } = 5;

        public static PromptAgentOptions FromQueryObject(QueryObject? queryObject)
        {
            var result = new PromptAgentOptions();
            var raw = queryObject?.Parameters.FirstOrDefault(item =>
                string.Equals(item.ParameterName, "AgentOptions", StringComparison.OrdinalIgnoreCase))?.Value.ToStringSafe();
            if (string.IsNullOrWhiteSpace(raw) == true)
            {
                return result;
            }

            JObject options;
            try
            {
                options = JObject.Parse(raw);
            }
            catch
            {
                return result;
            }

            result.UseDrive = ReadBool(options, "drive.enabled") || ReadBool(options, "tools.corpus_rag_search");
            result.UseImageGeneration = ReadBool(options, "tools.generate_image");
            result.UseSkills = ReadBool(options, "skills.enabled") || ReadBool(options, "tools.skill_search");
            result.AllowSkillInstall = ReadBool(options, "skills.installEnabled") || ReadBool(options, "tools.skill_install");
            result.DriveTopK = ReadInt(options, "drive.topK", 5);
            return result;
        }

        public bool IsToolEnabled(string name)
        {
            return name switch
            {
                "corpus_rag_search" => UseDrive,
                "generate_image" => UseImageGeneration,
                "skill_search" => UseSkills,
                "skill_install" => UseSkills && AllowSkillInstall,
                _ => false
            };
        }

        private static bool ReadBool(JObject options, string path)
        {
            return options.SelectToken(path)?.Value<bool?>() == true;
        }

        private static int ReadInt(JObject options, string path, int fallback)
        {
            var value = options.SelectToken(path)?.Value<int?>();
            return value ?? fallback;
        }
    }

    internal record BuiltinToolBinding(string Name, PromptAgentOptions AgentOptions);

    internal record CorpusDocumentCache(DateTime LastWriteTimeUtc, long Length, List<CorpusChunk> Chunks);

    internal record CorpusChunk(int Index, string Text);

    internal record CorpusMatch(string FilePath, int ChunkIndex, double Score, string Snippet);

    internal record SkillAuditResult(bool Blocked, string Message, JToken? Raw);
}
