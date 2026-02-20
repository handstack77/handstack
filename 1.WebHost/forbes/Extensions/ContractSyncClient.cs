using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;

namespace forbes.Extensions
{
    internal static class ContractSyncClient
    {
        private static readonly HttpClient HttpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        public static async Task<ContractSyncResult> UploadAndRefreshFromFileAsync(string fileSyncServer, string moduleName, WatcherChangeTypes changeTypes, string filePath, string fullFilePath)
        {
            var uploadResult = await ForwardUploadFromFileAsync(fileSyncServer, moduleName, changeTypes.ToString(), filePath, fullFilePath);
            if (!uploadResult.Success)
            {
                return uploadResult;
            }

            return await ForwardRefreshAsync(fileSyncServer, moduleName, changeTypes.ToString(), filePath);
        }

        private static async Task<ContractSyncResult> ForwardUploadFromFileAsync(string fileSyncServer, string moduleName, string changeType, string filePath, string fullFilePath, CancellationToken cancellationToken = default)
        {
            using var formData = CreateFormData(moduleName, changeType, filePath);

            if (!changeType.Equals(WatcherChangeTypes.Deleted.ToString(), StringComparison.OrdinalIgnoreCase) && File.Exists(fullFilePath))
            {
                var stream = File.OpenRead(fullFilePath);
                var streamContent = new StreamContent(stream);
                streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                formData.Add(streamContent, "file", Path.GetFileName(fullFilePath));
            }

            string uploadUrl = BuildUrl(fileSyncServer, "wwwroot/api/sync/upload");
            try
            {
                using var response = await HttpClient.PostAsync(uploadUrl, formData, cancellationToken);
                string responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                return response.IsSuccessStatusCode
                    ? new ContractSyncResult(true, responseText)
                    : new ContractSyncResult(false, $"Upload failed. statusCode: {(int)response.StatusCode}, response: {responseText}");
            }
            catch (Exception exception)
            {
                return new ContractSyncResult(false, $"Upload exception: {exception.Message}");
            }
        }

        private static async Task<ContractSyncResult> ForwardRefreshAsync(string fileSyncServer, string moduleName, string changeType, string filePath, CancellationToken cancellationToken = default)
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
                    ? new ContractSyncResult(true, responseText)
                    : new ContractSyncResult(false, $"Refresh failed. statusCode: {(int)response.StatusCode}, response: {responseText}");
            }
            catch (Exception exception)
            {
                return new ContractSyncResult(false, $"Refresh exception: {exception.Message}");
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

    internal sealed class ContractSyncResult
    {
        public bool Success { get; }
        public string Message { get; }

        public ContractSyncResult(bool success, string message)
        {
            Success = success;
            Message = message;
        }
    }
}
