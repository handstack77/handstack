using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
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

        public static async Task<ContractSyncResult> UploadAndRefreshFromFileAsync(string fileSyncServer, string fileSyncAccessToken, string moduleName, WatcherChangeTypes changeTypes, string filePath, string fullFilePath)
        {
            var uploadResult = await ForwardUploadFromFileAsync(fileSyncServer, fileSyncAccessToken, moduleName, changeTypes.ToString(), filePath, fullFilePath);
            if (!uploadResult.Success)
            {
                return uploadResult;
            }

            return await ForwardRefreshAsync(fileSyncServer, fileSyncAccessToken, moduleName, changeTypes.ToString(), filePath);
        }

        private static async Task<ContractSyncResult> ForwardUploadFromFileAsync(string fileSyncServer, string fileSyncAccessToken, string moduleName, string changeType, string filePath, string fullFilePath, CancellationToken cancellationToken = default)
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
                using var httpRequest = new HttpRequestMessage(HttpMethod.Post, uploadUrl)
                {
                    Content = formData
                };
                AddBasicAuthorizationHeader(httpRequest, fileSyncAccessToken);

                using var response = await HttpClient.SendAsync(httpRequest, cancellationToken);
                string responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                return response.IsSuccessStatusCode
                    ? new ContractSyncResult(true, responseText)
                    : new ContractSyncResult(false, $"업로드 실패. 상태 코드: {(int)response.StatusCode}, 응답: {responseText}");
            }
            catch (Exception exception)
            {
                return new ContractSyncResult(false, $"업로드 예외: {exception.Message}");
            }
        }

        private static async Task<ContractSyncResult> ForwardRefreshAsync(string fileSyncServer, string fileSyncAccessToken, string moduleName, string changeType, string filePath, CancellationToken cancellationToken = default)
        {
            string refreshUrl = BuildUrl(fileSyncServer, "wwwroot/api/sync/refresh")
                + $"?moduleName={Uri.EscapeDataString(moduleName)}"
                + $"&changeType={Uri.EscapeDataString(changeType)}"
                + $"&filePath={Uri.EscapeDataString(filePath)}";

            try
            {
                using var httpRequest = new HttpRequestMessage(HttpMethod.Get, refreshUrl);
                AddBasicAuthorizationHeader(httpRequest, fileSyncAccessToken);

                using var response = await HttpClient.SendAsync(httpRequest, cancellationToken);
                string responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                return response.IsSuccessStatusCode
                    ? new ContractSyncResult(true, responseText)
                    : new ContractSyncResult(false, $"새로고침 실패. 상태 코드: {(int)response.StatusCode}, 응답: {responseText}");
            }
            catch (Exception exception)
            {
                return new ContractSyncResult(false, $"새로고침 예외: {exception.Message}");
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

        private static void AddBasicAuthorizationHeader(HttpRequestMessage request, string fileSyncAccessToken)
        {
            if (string.IsNullOrWhiteSpace(fileSyncAccessToken))
            {
                return;
            }

            string credential = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{fileSyncAccessToken}:"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credential);
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
