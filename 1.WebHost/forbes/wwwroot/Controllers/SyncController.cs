using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace forbes.wwwroot.Controllers
{
    [Route("wwwroot/api/[controller]")]
    [ApiController]
    public class SyncController : ControllerBase
    {
        private readonly IConfiguration configuration;

        public SyncController(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] SyncUploadRequest request, IFormFile? file, CancellationToken cancellationToken)
        {
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

        public static async Task<SyncForwardResult> UploadAndRefreshFromFileAsync(string fileSyncServer, string moduleName, WatcherChangeTypes changeTypes, string filePath, string fullFilePath)
        {
            var uploadResult = await SyncForwarder.ForwardUploadFromFileAsync(fileSyncServer, moduleName, changeTypes.ToString(), filePath, fullFilePath);
            if (!uploadResult.Success)
            {
                return uploadResult;
            }

            return await SyncForwarder.ForwardRefreshAsync(fileSyncServer, moduleName, changeTypes.ToString(), filePath);
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

    public sealed class SyncForwardResult
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

        public static async Task<SyncForwardResult> ForwardUploadFromFileAsync(string fileSyncServer, string moduleName, string changeType, string filePath, string fullFilePath, CancellationToken cancellationToken = default)
        {
            using var formData = CreateFormData(moduleName, changeType, filePath);

            if (!changeType.Equals(WatcherChangeTypes.Deleted.ToString(), StringComparison.OrdinalIgnoreCase) && File.Exists(fullFilePath))
            {
                var stream = File.OpenRead(fullFilePath);
                var streamContent = new StreamContent(stream);
                streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                formData.Add(streamContent, "file", Path.GetFileName(fullFilePath));
            }

            return await PostUploadAsync(fileSyncServer, formData, cancellationToken);
        }

        public static async Task<SyncForwardResult> ForwardUploadAsync(string fileSyncServer, string moduleName, string changeType, string filePath, IFormFile? file, CancellationToken cancellationToken = default)
        {
            using var formData = CreateFormData(moduleName, changeType, filePath);

            if (file != null)
            {
                var streamContent = new StreamContent(file.OpenReadStream());
                streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                formData.Add(streamContent, "file", file.FileName);
            }

            return await PostUploadAsync(fileSyncServer, formData, cancellationToken);
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

        private static async Task<SyncForwardResult> PostUploadAsync(string fileSyncServer, MultipartFormDataContent formData, CancellationToken cancellationToken)
        {
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
}
