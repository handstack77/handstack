using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

using Google;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;

using HandStack.Web.Entity;

using repository.Entity;

namespace repository.Extensions
{
    public class GoogleCloudStorageProvider : IStorageProvider
    {
        private readonly StorageClient storageClient;
        private readonly string bucketName;

        public GoogleCloudStorageProvider(Repository repository)
        {
            bucketName = repository.GcsBucketName;
            var credential = GoogleCredential.FromFile(repository.GcsCredentialFile);
            storageClient = StorageClient.Create(credential);
        }

        public async Task DeleteAsync(string blobID)
        {
            try
            {
                await storageClient.DeleteObjectAsync(bucketName, blobID);
            }
            catch (GoogleApiException e) when (e.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
            {
            }
        }

        public async Task<StorageDownloadResult> DownloadAsync(string blobID)
        {
            if (!await FileExistsAsync(blobID))
            {
                return null;
            }

            var stream = new MemoryStream();
            var obj = await storageClient.DownloadObjectAsync(bucketName, blobID, stream);
            stream.Position = 0;

            return new StorageDownloadResult
            {
                Content = stream,
                ContentType = obj.ContentType,
                ContentLength = (long)(obj.Size ?? 0),
                ETag = obj.ETag
            };
        }

        public async Task<bool> FileExistsAsync(string blobID)
        {
            try
            {
                await storageClient.GetObjectAsync(bucketName, blobID);
                return true;
            }
            catch (GoogleApiException e) when (e.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
        }

        public async Task MoveAsync(string sourceBlobID, string destinationBlobID, string contentType)
        {
            await storageClient.CopyObjectAsync(bucketName, sourceBlobID, bucketName, destinationBlobID);
            await DeleteAsync(sourceBlobID);
        }

        public async Task<(DateTime?, DateTime?)> UploadAsync(string blobID, Stream content, string contentType)
        {
            content.Position = 0;

            var uploadedObject = await storageClient.UploadObjectAsync(bucketName, blobID, contentType, content);

            DateTime? createdTime = uploadedObject.TimeCreatedDateTimeOffset?.LocalDateTime;
            DateTime? updatedTime = uploadedObject.UpdatedDateTimeOffset?.LocalDateTime;

            return (createdTime, updatedTime);
        }

        public async Task<string> GetDuplicateCheckUniqueFileName(string blobID)
        {
            bool exists;
            try
            {
                await storageClient.GetObjectAsync(bucketName, blobID);
                exists = true;
            }
            catch (GoogleApiException e) when (e.HttpStatusCode == HttpStatusCode.NotFound)
            {
                exists = false;
            }

            if (!exists)
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
                try
                {
                    await storageClient.GetObjectAsync(bucketName, newBlobID);
                    exists = true;
                }
                catch (GoogleApiException e) when (e.HttpStatusCode == HttpStatusCode.NotFound)
                {
                    exists = false;
                }
            } while (exists);

            return newBlobID;
        }

    }
}
