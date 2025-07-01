using System;
using System.IO;
using System.Reflection.Metadata;
using System.Threading.Tasks;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;

using repository.Entity;

namespace repository.Extensions
{
    public class AzureBlobStorageProvider : IStorageProvider
    {
        private readonly BlobContainerClient containerClient;

        public AzureBlobStorageProvider(Repository repository)
        {
            containerClient = new BlobContainerClient(repository.BlobConnectionString, repository.BlobContainerID.ToLower());
            containerClient.CreateIfNotExists(PublicAccessType.Blob);
        }

        public async Task DeleteAsync(string blobID)
        {
            await containerClient.DeleteBlobIfExistsAsync(blobID);
        }

        public async Task<StorageDownloadResult> DownloadAsync(string blobID)
        {
            var blobClient = containerClient.GetBlobClient(blobID);
            if (!await blobClient.ExistsAsync())
            {
                return null;
            }

            BlobDownloadInfo downloadInfo = await blobClient.DownloadAsync();
            return new StorageDownloadResult
            {
                Content = downloadInfo.Content,
                ContentType = downloadInfo.ContentType,
                ContentLength = downloadInfo.ContentLength,
                ETag = downloadInfo.Details.ETag.ToString()
            };
        }

        public async Task<bool> FileExistsAsync(string blobID)
        {
            return await containerClient.GetBlobClient(blobID).ExistsAsync();
        }

        public async Task MoveAsync(string sourceBlobID, string destinationBlobID, string contentType)
        {
            var sourceBlob = containerClient.GetBlobClient(sourceBlobID);
            var destBlob = containerClient.GetBlobClient(destinationBlobID);

            if (await sourceBlob.ExistsAsync())
            {
                await destBlob.StartCopyFromUriAsync(sourceBlob.Uri);
                await sourceBlob.DeleteIfExistsAsync();
            }
        }

        public async Task<(DateTime?, DateTime?)> UploadAsync(string blobID, Stream content, string contentType)
        {
            var blobClient = containerClient.GetBlobClient(blobID);
            var headers = new BlobHttpHeaders { ContentType = contentType };
            content.Position = 0;
            var response = await blobClient.UploadAsync(content, headers);

            BlobProperties properties = await blobClient.GetPropertiesAsync();
            return (properties.CreatedOn.LocalDateTime, properties.LastModified.LocalDateTime);
        }

        public async Task<string> GetDuplicateCheckUniqueFileName(string blobID)
        {
            var blobClient = containerClient.GetBlobClient(blobID);

            if (!await blobClient.ExistsAsync())
            {
                return blobID;
            }

            string newBlobID;
            int i = 1;
            var extension = Path.GetExtension(blobID);
            var baseBlobID = blobID.Substring(0, blobID.Length - extension.Length);

            do
            {
                newBlobID = $"{baseBlobID} ({i++}){extension}";
                blobClient = containerClient.GetBlobClient(newBlobID);
            } while (await blobClient.ExistsAsync());

            return newBlobID;
        }
    }
}
