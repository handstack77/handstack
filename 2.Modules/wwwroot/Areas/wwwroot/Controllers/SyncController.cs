using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Web;
using HandStack.Web.Common;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using wwwroot.Entity;

namespace wwwroot.Areas.wwwroot.Controllers
{
    [Area("wwwroot")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    public class SyncController : BaseController
    {
        private readonly IConfiguration configuration;

        public SyncController(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] SyncUploadRequest request, IFormFile? file, CancellationToken cancellationToken)
        {
            if (!TryValidateSyncRequest(out string authorizationError))
            {
                return Unauthorized(authorizationError);
            }

            if (!SyncRequest.TryCreate(request.ModuleName, request.ChangeType, request.FilePath, out SyncRequest syncRequest, out string errorMessage))
            {
                return BadRequest(errorMessage);
            }

            if (syncRequest.IsDeleteChange)
            {
                return Ok();
            }

            var result = await SyncProcessor.SaveUploadedFileAsync(syncRequest, file, cancellationToken);
            if (!result.Success)
            {
                return StatusCode(result.StatusCode, result.Message);
            }

            return Ok(result.Message);
        }

        [HttpGet("refresh")]
        public async Task<IActionResult> Refresh([FromQuery] SyncRefreshRequest request, CancellationToken cancellationToken)
        {
            if (!TryValidateSyncRequest(out string authorizationError))
            {
                return Unauthorized(authorizationError);
            }

            if (!SyncRequest.TryCreate(request.ModuleName, request.ChangeType, request.FilePath, out SyncRequest syncRequest, out string errorMessage))
            {
                return BadRequest(errorMessage);
            }

            if (syncRequest.IsDeleteChange)
            {
                return Ok();
            }

            string? authorizationKey = Request.Headers["AuthorizationKey"].FirstOrDefault();
            string host = Request.Host.HasValue ? Request.Host.Value : "localhost";
            var result = await SyncProcessor.RefreshModuleAsync(Request.Scheme, host, syncRequest, authorizationKey, cancellationToken);
            if (!result.Success)
            {
                return StatusCode(StatusCodes.Status502BadGateway, result.Message);
            }

            return Ok(result.Message);
        }

        private bool TryValidateSyncRequest(out string errorMessage)
        {
            errorMessage = "";

            if (ModuleConfiguration.FileSyncTokens.Count == 0)
            {
                errorMessage = "FileSync 토큰 설정 확인 필요.";
                return false;
            }

            string authorizationHeader = Request.Headers["Authorization"].FirstOrDefault() ?? "";
            if (string.IsNullOrWhiteSpace(authorizationHeader))
            {
                errorMessage = "Authorization 헤더 확인 필요.";
                return false;
            }

            if (!TryReadBasicToken(authorizationHeader, out string token))
            {
                errorMessage = "Basic 인증 헤더 형식 확인 필요.";
                return false;
            }

            if (!string.IsNullOrWhiteSpace(token) && !ModuleConfiguration.FileSyncTokens.Any(p => p.Equals(token, StringComparison.Ordinal)))
            {
                errorMessage = "동기화 인증 토큰 확인 필요.";
                return false;
            }

            return true;
        }

        private static bool TryReadBasicToken(string authorizationHeader, out string token)
        {
            token = "";

            const string basicPrefix = "Basic ";
            if (!authorizationHeader.StartsWith(basicPrefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            string basicPayload = authorizationHeader.Substring(basicPrefix.Length).Trim();
            if (string.IsNullOrWhiteSpace(basicPayload))
            {
                return false;
            }

            try
            {
                string decodedCredential = Encoding.UTF8.GetString(Convert.FromBase64String(basicPayload));
                int separatorIndex = decodedCredential.IndexOf(':');
                token = separatorIndex >= 0 ? decodedCredential.Substring(0, separatorIndex).Trim() : decodedCredential.Trim();
            }
            catch (FormatException)
            {
                token = basicPayload;
            }

            return !string.IsNullOrWhiteSpace(token);
        }
    }

    public class SyncUploadRequest
    {
        public string ModuleName { get; set; } = "";
        public string ChangeType { get; set; } = "";
        public string FilePath { get; set; } = "";
    }

    public class SyncRefreshRequest
    {
        public string ModuleName { get; set; } = "";
        public string ChangeType { get; set; } = "";
        public string FilePath { get; set; } = "";
    }

    internal sealed class SyncRequest
    {
        public string ModuleName { get; }
        public string ChangeType { get; }
        public string RelativeFilePath { get; }
        public bool IsDeleteChange => ChangeType.Equals(WatcherChangeTypes.Deleted.ToString(), StringComparison.OrdinalIgnoreCase);

        private SyncRequest(string moduleName, string changeType, string relativeFilePath)
        {
            ModuleName = moduleName;
            ChangeType = changeType;
            RelativeFilePath = relativeFilePath;
        }

        public static bool TryCreate(string moduleName, string changeType, string filePath, out SyncRequest request, out string errorMessage)
        {
            request = null!;

            string normalizedModuleName = (moduleName ?? "").Trim().ToLowerInvariant();
            if (normalizedModuleName != "dbclient"
                && normalizedModuleName != "transact"
                && normalizedModuleName != "function"
                && normalizedModuleName != "wwwroot")
            {
                errorMessage = "모듈 명 확인 필요.";
                return false;
            }

            string normalizedChangeType = (changeType ?? "").Trim();
            if (string.IsNullOrWhiteSpace(normalizedChangeType))
            {
                errorMessage = "변경 타입 확인 필요.";
                return false;
            }

            string normalizedRelativePath = (filePath ?? "").Replace("\\", "/").Trim().TrimStart('/');
            if (string.IsNullOrWhiteSpace(normalizedRelativePath))
            {
                errorMessage = "파일 정보 확인 필요.";
                return false;
            }

            request = new SyncRequest(normalizedModuleName, normalizedChangeType, normalizedRelativePath);
            errorMessage = "";
            return true;
        }
    }

    internal sealed class SyncProcessResult
    {
        public bool Success { get; }
        public string Message { get; }
        public int StatusCode { get; }

        private SyncProcessResult(bool success, int statusCode, string message)
        {
            Success = success;
            StatusCode = statusCode;
            Message = message;
        }

        public static SyncProcessResult Ok(string message)
        {
            return new SyncProcessResult(true, StatusCodes.Status200OK, message);
        }

        public static SyncProcessResult Fail(int statusCode, string message)
        {
            return new SyncProcessResult(false, statusCode, message);
        }
    }

    internal static class SyncProcessor
    {
        private static readonly HttpClient HttpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        public static async Task<SyncProcessResult> SaveUploadedFileAsync(SyncRequest request, IFormFile? file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return SyncProcessResult.Fail(StatusCodes.Status400BadRequest, "업로드 파일이 비어 있습니다.");
            }

            if (!TryResolveContractFilePath(request, out string contractFilePath, out string contractDirectoryPath, out string errorMessage))
            {
                return SyncProcessResult.Fail(StatusCodes.Status400BadRequest, errorMessage);
            }

            if (!File.Exists(contractFilePath))
            {
                return SyncProcessResult.Fail(StatusCodes.Status400BadRequest, "업로드 요청 무시.");
            }

            Directory.CreateDirectory(contractDirectoryPath);

            await using (var outputStream = new FileStream(contractFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
            await using (var inputStream = file.OpenReadStream())
            {
                await inputStream.CopyToAsync(outputStream, cancellationToken);
            }

            return SyncProcessResult.Ok("업로드 동기화 완료.");
        }

        public static async Task<SyncProcessResult> RefreshModuleAsync(string scheme, string host, SyncRequest request, string? authorizationKey, CancellationToken cancellationToken)
        {
            if (request.ModuleName == "wwwroot")
            {
                return SyncProcessResult.Ok("");
            }

            string refreshPath;
            if (request.ModuleName == "dbclient")
            {
                refreshPath = "dbclient/api/query/refresh";
            }
            else if (request.ModuleName == "transact")
            {
                refreshPath = "transact/api/transaction/refresh";
            }
            else if (request.ModuleName == "function")
            {
                refreshPath = "function/api/execution/refresh";
            }
            else
            {
                return SyncProcessResult.Fail(StatusCodes.Status400BadRequest, "모듈 명 확인 필요.");
            }

            string baseUrl = $"{scheme}://{host}".TrimEnd('/');
            string refreshUrl = $"{baseUrl}/{refreshPath}"
                + $"?changeType={Uri.EscapeDataString(request.ChangeType)}"
                + $"&filePath={Uri.EscapeDataString(request.RelativeFilePath)}";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, refreshUrl);
            string forwardedAuthorizationKey = string.IsNullOrWhiteSpace(authorizationKey)
                ? $"{GlobalConfiguration.SystemID}{GlobalConfiguration.RunningEnvironment}{GlobalConfiguration.HostName}"
                : authorizationKey;
            if (!string.IsNullOrWhiteSpace(forwardedAuthorizationKey))
            {
                httpRequest.Headers.TryAddWithoutValidation("AuthorizationKey", forwardedAuthorizationKey);
            }

            using var response = await HttpClient.SendAsync(httpRequest, cancellationToken);
            string responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return SyncProcessResult.Ok(responseText);
            }

            return SyncProcessResult.Fail(
                StatusCodes.Status502BadGateway,
                $"리프레시 실패. 상태 코드: {(int)response.StatusCode}, 응답: {responseText}");
        }

        private static bool TryResolveContractFilePath(SyncRequest request, out string contractFilePath, out string contractDirectoryPath, out string errorMessage)
        {
            contractFilePath = "";
            contractDirectoryPath = "";

            string? contractBasePath = ResolveContractBasePath(request.ModuleName);
            if (string.IsNullOrWhiteSpace(contractBasePath))
            {
                errorMessage = $"계약 기본 경로를 찾을 수 없습니다. 모듈 이름: {request.ModuleName}";
                return false;
            }

            string normalizedBasePath = Path.GetFullPath(contractBasePath);
            string candidatePath = Path.GetFullPath(Path.Combine(normalizedBasePath, request.RelativeFilePath.Replace('/', Path.DirectorySeparatorChar)));

            if (!IsPathUnderBase(candidatePath, normalizedBasePath))
            {
                errorMessage = "파일 경로가 유효하지 않습니다.";
                return false;
            }

            contractFilePath = candidatePath;
            contractDirectoryPath = Path.GetDirectoryName(candidatePath) ?? normalizedBasePath;
            errorMessage = "";
            return true;
        }

        private static string? ResolveContractBasePath(string moduleName)
        {
            if (moduleName == "wwwroot")
            {
                if (!string.IsNullOrWhiteSpace(ModuleConfiguration.ContractBasePath))
                {
                    return ModuleConfiguration.ContractBasePath;
                }

                string moduleContractPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Contracts", "wwwroot");
                return Path.GetFullPath(moduleContractPath);
            }

            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID.Equals(moduleName, StringComparison.OrdinalIgnoreCase));
            if (module != null && module.ContractBasePath.Count > 0)
            {
                foreach (string item in module.ContractBasePath)
                {
                    string resolvedPath = ResolveBasePath(item);
                    if (!string.IsNullOrWhiteSpace(resolvedPath))
                    {
                        return resolvedPath;
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(GlobalConfiguration.LoadContractBasePath))
            {
                return Path.GetFullPath(Path.Combine(GlobalConfiguration.LoadContractBasePath, moduleName));
            }

            string entryBasePath = string.IsNullOrWhiteSpace(GlobalConfiguration.EntryBasePath)
                ? AppDomain.CurrentDomain.BaseDirectory
                : GlobalConfiguration.EntryBasePath;
            return Path.GetFullPath(Path.Combine(entryBasePath, "..", "contracts", moduleName));
        }

        private static string ResolveBasePath(string basePath)
        {
            string expandedPath = Environment.ExpandEnvironmentVariables(basePath ?? "");
            if (string.IsNullOrWhiteSpace(expandedPath))
            {
                return "";
            }

            if (Path.IsPathRooted(expandedPath))
            {
                return Path.GetFullPath(expandedPath);
            }

            string entryBasePath = string.IsNullOrWhiteSpace(GlobalConfiguration.EntryBasePath)
                ? AppDomain.CurrentDomain.BaseDirectory
                : GlobalConfiguration.EntryBasePath;
            return Path.GetFullPath(Path.Combine(entryBasePath, expandedPath));
        }

        private static bool IsPathUnderBase(string targetPath, string basePath)
        {
            string normalizedBasePath = Path.GetFullPath(basePath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string normalizedTargetPath = Path.GetFullPath(targetPath);
            StringComparison comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

            if (normalizedTargetPath.Equals(normalizedBasePath, comparison))
            {
                return true;
            }

            string prefix = normalizedBasePath + Path.DirectorySeparatorChar;
            return normalizedTargetPath.StartsWith(prefix, comparison);
        }
    }
}
