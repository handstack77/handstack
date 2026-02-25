using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace forbes.Controllers
{
    [ApiController]
    [Route("api/configuration/sync-secrets")]
    public sealed class ConfigurationController : ControllerBase
    {
        private static readonly JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true
        };

        private readonly IHostEnvironment hostEnvironment;

        public ConfigurationController(IHostEnvironment hostEnvironment)
        {
            this.hostEnvironment = hostEnvironment;
        }

        [HttpGet]
        public IActionResult GetSyncSecrets()
        {
            if (!IsLocalRequest())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "개발 서버 로컬 요청에서만 설정 파일 관리 API를 사용할 수 있습니다."
                });
            }

            string filePath = GetSyncSecretsFilePath();
            SyncSecretsFileSnapshot snapshot;
            try
            {
                snapshot = LoadSnapshot(filePath);
            }
            catch (InvalidOperationException exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = exception.Message
                });
            }

            return Ok(new
            {
                success = true,
                file = snapshot
            });
        }

        [HttpPut]
        public async Task<IActionResult> SaveSyncSecrets([FromBody] SyncSecretsSaveRequest? request)
        {
            if (!IsLocalRequest())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "개발 서버 로컬 요청에서만 설정 파일 관리 API를 사용할 수 있습니다."
                });
            }

            if (request == null || request.Config == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "저장할 설정 항목 확인 필요."
                });
            }

            string filePath = GetSyncSecretsFilePath();
            DateTimeOffset? currentLastWriteUtc = System.IO.File.Exists(filePath)
                ? new DateTimeOffset(System.IO.File.GetLastWriteTimeUtc(filePath), TimeSpan.Zero)
                : null;

            if (request.LastKnownWriteTimeUtc.HasValue && currentLastWriteUtc.HasValue)
            {
                if (request.LastKnownWriteTimeUtc.Value.UtcDateTime != currentLastWriteUtc.Value.UtcDateTime)
                {
                    return Conflict(new
                    {
                        success = false,
                        message = "파일이 다른 변경으로 갱신되었습니다. 최신 내용을 다시 로드한 뒤 저장하세요.",
                        currentLastWriteTimeUtc = currentLastWriteUtc
                    });
                }
            }

            var normalizedConfig = new SyncSecretsConfig
            {
                UserEmail = NormalizeValue(request.Config.UserEmail),
                UserName = NormalizeValue(request.Config.UserName),
                FileSyncServer = NormalizeValue(request.Config.FileSyncServer),
                FileSyncAccessToken = NormalizeValue(request.Config.FileSyncAccessToken),
                GitHubPersonalAccessToken = NormalizeValue(request.Config.GitHubPersonalAccessToken),
                GitHubRepositoryOwner = NormalizeValue(request.Config.GitHubRepositoryOwner),
                GitHubRepositoryName = NormalizeValue(request.Config.GitHubRepositoryName),
                GitHubRepositoryBranch = string.IsNullOrWhiteSpace(request.Config.GitHubRepositoryBranch) ? "main" : request.Config.GitHubRepositoryBranch.Trim(),
                GitHubRepositoryBasePath = string.IsNullOrWhiteSpace(request.Config.GitHubRepositoryBasePath) ? "Contracts" : request.Config.GitHubRepositoryBasePath.Trim()
            };

            string json = JsonSerializer.Serialize(normalizedConfig, JsonSerializerOptions);
            await System.IO.File.WriteAllTextAsync(filePath, json + Environment.NewLine);
            TraceLogger.Info($"설정 파일 저장 완료: {filePath}");

            SyncSecretsFileSnapshot snapshot;
            try
            {
                snapshot = LoadSnapshot(filePath);
            }
            catch (InvalidOperationException exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = exception.Message
                });
            }
            return Ok(new
            {
                success = true,
                message = "sync-secrets.json 저장 완료.",
                file = snapshot
            });
        }

        private SyncSecretsFileSnapshot LoadSnapshot(string filePath)
        {
            bool exists = System.IO.File.Exists(filePath);
            SyncSecretsConfig config = new SyncSecretsConfig();
            DateTimeOffset? lastWriteTimeUtc = null;

            if (exists)
            {
                string text = System.IO.File.ReadAllText(filePath);
                if (!string.IsNullOrWhiteSpace(text))
                {
                    try
                    {
                        var loaded = JsonSerializer.Deserialize<SyncSecretsConfig>(text, JsonSerializerOptions);
                        if (loaded != null)
                        {
                            config = loaded;
                        }
                    }
                    catch (JsonException exception)
                    {
                        throw new InvalidOperationException($"sync-secrets.json JSON 형식 오류: {exception.Message}", exception);
                    }
                }

                lastWriteTimeUtc = new DateTimeOffset(System.IO.File.GetLastWriteTimeUtc(filePath), TimeSpan.Zero);
            }

            return new SyncSecretsFileSnapshot(
                "sync-secrets.json",
                exists,
                lastWriteTimeUtc,
                config);
        }

        private string GetSyncSecretsFilePath()
        {
            return Path.Combine(hostEnvironment.ContentRootPath, "sync-secrets.json");
        }

        private static string NormalizeValue(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
        }

        private bool IsLocalRequest()
        {
            IPAddress? remoteIp = HttpContext.Connection.RemoteIpAddress;
            if (remoteIp == null)
            {
                return false;
            }

            if (IPAddress.IsLoopback(remoteIp))
            {
                return true;
            }

            IPAddress? localIp = HttpContext.Connection.LocalIpAddress;
            return localIp != null && remoteIp.Equals(localIp);
        }
    }

    public sealed class SyncSecretsSaveRequest
    {
        public SyncSecretsConfig? Config { get; set; }
        public DateTimeOffset? LastKnownWriteTimeUtc { get; set; }
    }

    public sealed class SyncSecretsConfig
    {
        public string UserEmail { get; set; } = "";
        public string UserName { get; set; } = "";
        public string FileSyncServer { get; set; } = "";
        public string FileSyncAccessToken { get; set; } = "";
        public string GitHubPersonalAccessToken { get; set; } = "";
        public string GitHubRepositoryOwner { get; set; } = "";
        public string GitHubRepositoryName { get; set; } = "";
        public string GitHubRepositoryBranch { get; set; } = "main";
        public string GitHubRepositoryBasePath { get; set; } = "Contracts";
    }

    public sealed record SyncSecretsFileSnapshot(
        string FileName,
        bool Exists,
        DateTimeOffset? LastWriteTimeUtc,
        SyncSecretsConfig Config);
}
