using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Web;
using HandStack.Web.Common;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

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
            if (SyncPathPolicy.ShouldSkip(request.ModuleName, request.ChangeType, request.FilePath, out string skipReason))
            {
                return Ok(skipReason);
            }

            string fileSyncServer = configuration["FileSyncServer"] ?? "";
            if (string.IsNullOrWhiteSpace(fileSyncServer))
            {
                return BadRequest("FileSyncServer is empty.");
            }

            var result = await SyncForwarder.ForwardUploadAsync(fileSyncServer, request.ModuleName, request.ChangeType, request.FilePath, file, cancellationToken);
            if (!result.Success)
            {
                return StatusCode(StatusCodes.Status502BadGateway, result.Message);
            }

            return Ok(result.Message);
        }

        [HttpGet("refresh")]
        public async Task<IActionResult> Refresh([FromQuery] SyncRefreshRequest request, CancellationToken cancellationToken)
        {
            if (SyncPathPolicy.ShouldSkip(request.ModuleName, request.ChangeType, request.FilePath, out string skipReason))
            {
                return Ok(skipReason);
            }

            string fileSyncServer = configuration["FileSyncServer"] ?? "";
            if (string.IsNullOrWhiteSpace(fileSyncServer))
            {
                return BadRequest("FileSyncServer is empty.");
            }

            var result = await SyncForwarder.ForwardRefreshAsync(fileSyncServer, request.ModuleName, request.ChangeType, request.FilePath, cancellationToken);
            if (!result.Success)
            {
                return StatusCode(StatusCodes.Status502BadGateway, result.Message);
            }

            return Ok(result.Message);
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

    internal sealed class SyncForwardResult
    {
        public bool Success { get; }
        public string Message { get; }

        public SyncForwardResult(bool success, string message)
        {
            Success = success;
            Message = message;
        }
    }

    internal static class SyncForwarder
    {
        private static readonly HttpClient HttpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        public static async Task<SyncForwardResult> ForwardUploadAsync(string fileSyncServer, string moduleName, string changeType, string filePath, IFormFile? file, CancellationToken cancellationToken = default)
        {
            using var formData = CreateFormData(moduleName, changeType, filePath);

            if (file != null)
            {
                var streamContent = new StreamContent(file.OpenReadStream());
                streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                formData.Add(streamContent, "file", file.FileName);
            }

            string uploadUrl = BuildUrl(fileSyncServer, "wwwroot/api/sync/upload");
            try
            {
                using var response = await HttpClient.PostAsync(uploadUrl, formData, cancellationToken);
                string responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                return response.IsSuccessStatusCode
                    ? new SyncForwardResult(true, responseText)
                    : new SyncForwardResult(false, $"Upload failed. statusCode: {(int)response.StatusCode}, response: {responseText}");
            }
            catch (Exception exception)
            {
                return new SyncForwardResult(false, $"Upload exception: {exception.Message}");
            }
        }

        public static async Task<SyncForwardResult> ForwardRefreshAsync(string fileSyncServer, string moduleName, string changeType, string filePath, CancellationToken cancellationToken = default)
        {
            string refreshUrl = BuildUrl(fileSyncServer, "wwwroot/api/sync/refresh")
                + $"?moduleName={Uri.EscapeDataString(moduleName)}"
                + $"&changeType={Uri.EscapeDataString(changeType)}"
                + $"&filePath={Uri.EscapeDataString(filePath)}";

            try
            {
                using var response = await HttpClient.GetAsync(refreshUrl, cancellationToken);
                string responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                return response.IsSuccessStatusCode
                    ? new SyncForwardResult(true, responseText)
                    : new SyncForwardResult(false, $"Refresh failed. statusCode: {(int)response.StatusCode}, response: {responseText}");
            }
            catch (Exception exception)
            {
                return new SyncForwardResult(false, $"Refresh exception: {exception.Message}");
            }
        }

        private static MultipartFormDataContent CreateFormData(string moduleName, string changeType, string filePath)
        {
            var formData = new MultipartFormDataContent();
            formData.Add(new StringContent(moduleName ?? ""), "moduleName");
            formData.Add(new StringContent(changeType ?? ""), "changeType");
            formData.Add(new StringContent(filePath ?? ""), "filePath");
            return formData;
        }

        private static string BuildUrl(string baseUrl, string relativePath)
        {
            return $"{baseUrl.TrimEnd('/')}/{relativePath.TrimStart('/')}";
        }
    }

    internal static class SyncPathPolicy
    {
        public static bool ShouldSkip(string moduleName, string changeType, string filePath, out string reason)
        {
            if (changeType.Equals(WatcherChangeTypes.Deleted.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                reason = "Delete changeType is ignored.";
                return true;
            }

            if (HasExistingContractPath(moduleName, filePath) == false)
            {
                reason = "Target directory or file does not exist. Sync skipped.";
                return true;
            }

            reason = "";
            return false;
        }

        private static bool HasExistingContractPath(string moduleName, string filePath)
        {
            foreach (string contractBasePath in GetContractBasePaths(moduleName))
            {
                if (Directory.Exists(contractBasePath) == false)
                {
                    continue;
                }

                if (TryResolveTargetPath(contractBasePath, filePath, out string targetPath, out string targetDirectoryPath) == false)
                {
                    continue;
                }

                if (File.Exists(targetPath)
                    || Directory.Exists(targetPath)
                    || (!string.IsNullOrWhiteSpace(targetDirectoryPath) && Directory.Exists(targetDirectoryPath)))
                {
                    return true;
                }
            }

            return false;
        }

        private static IEnumerable<string> GetContractBasePaths(string moduleName)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID.Equals(moduleName, StringComparison.OrdinalIgnoreCase));
            if (module != null && module.ContractBasePath.Count > 0)
            {
                foreach (string basePath in module.ContractBasePath)
                {
                    string resolvedBasePath = ResolveBasePath(basePath);
                    if (!string.IsNullOrWhiteSpace(resolvedBasePath))
                    {
                        yield return resolvedBasePath;
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(GlobalConfiguration.LoadContractBasePath))
            {
                yield return Path.GetFullPath(Path.Combine(GlobalConfiguration.LoadContractBasePath, moduleName));
            }
            else
            {
                string entryBasePath = string.IsNullOrWhiteSpace(GlobalConfiguration.EntryBasePath)
                    ? AppDomain.CurrentDomain.BaseDirectory
                    : GlobalConfiguration.EntryBasePath;

                yield return Path.GetFullPath(Path.Combine(entryBasePath, "..", "contracts", moduleName));
            }
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

        private static bool TryResolveTargetPath(string contractBasePath, string filePath, out string targetPath, out string targetDirectoryPath)
        {
            targetPath = "";
            targetDirectoryPath = "";

            if (string.IsNullOrWhiteSpace(contractBasePath) || string.IsNullOrWhiteSpace(filePath))
            {
                return false;
            }

            string normalizedRelativePath = filePath.Replace("\\", "/").Trim().TrimStart('/');
            if (string.IsNullOrWhiteSpace(normalizedRelativePath) || Path.IsPathRooted(normalizedRelativePath))
            {
                return false;
            }

            string normalizedBasePath = Path.GetFullPath(contractBasePath);
            string candidatePath = Path.GetFullPath(Path.Combine(normalizedBasePath, normalizedRelativePath.Replace('/', Path.DirectorySeparatorChar)));
            if (IsPathUnderBase(candidatePath, normalizedBasePath) == false)
            {
                return false;
            }

            targetPath = candidatePath;
            targetDirectoryPath = Path.GetDirectoryName(candidatePath) ?? "";
            return true;
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
