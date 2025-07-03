using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

using Amazon;
using Amazon.S3;
using Amazon.S3.Model;

using HandStack.Web.Entity;

using repository.Entity;

namespace repository.Extensions
{
    public class AwsS3StorageProvider : IStorageProvider
    {
        private readonly IAmazonS3 s3Client;
        private readonly string bucketName;

        public AwsS3StorageProvider(Repository repository)
        {
            bucketName = repository.AwsBucketName;
            var config = new AmazonS3Config
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(repository.AwsRegion)
            };

            if (!string.IsNullOrEmpty(repository.AwsServiceUrl))
            {
                config.ServiceURL = repository.AwsServiceUrl;
                config.ForcePathStyle = true;
            }

            s3Client = new AmazonS3Client(repository.AwsAccessKey, repository.AwsSecretKey, config);
        }

        public async Task DeleteAsync(string blobID)
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = bucketName,
                Key = blobID
            };
            await s3Client.DeleteObjectAsync(deleteRequest);
        }

        public async Task<StorageDownloadResult?> DownloadAsync(string blobID)
        {
            var request = new GetObjectRequest
            {
                BucketName = bucketName,
                Key = blobID
            };

            try
            {
                var response = await s3Client.GetObjectAsync(request);
                return new StorageDownloadResult
                {
                    Content = response.ResponseStream,
                    ContentType = response.Headers.ContentType,
                    ContentLength = response.ContentLength,
                    ETag = response.ETag
                };
            }
            catch (AmazonS3Exception e) when (e.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        public async Task<bool> FileExistsAsync(string blobID)
        {
            try
            {
                await s3Client.GetObjectMetadataAsync(bucketName, blobID);
                return true;
            }
            catch (AmazonS3Exception e)
            {
                if (e.StatusCode == HttpStatusCode.NotFound)
                    return false;
                throw;
            }
        }

        public async Task MoveAsync(string sourceBlobID, string destinationBlobID, string contentType)
        {
            var copyRequest = new CopyObjectRequest
            {
                SourceBucket = bucketName,
                SourceKey = sourceBlobID,
                DestinationBucket = bucketName,
                DestinationKey = destinationBlobID
            };
            await s3Client.CopyObjectAsync(copyRequest);
            await DeleteAsync(sourceBlobID);
        }

        public async Task<(DateTime?, DateTime?)> UploadAsync(string blobID, Stream content, string contentType)
        {
            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = blobID,
                InputStream = content,
                ContentType = contentType
            };

            await s3Client.PutObjectAsync(request);

            var metadataRequest = new GetObjectMetadataRequest
            {
                BucketName = bucketName,
                Key = blobID
            };
            var metadataResponse = await s3Client.GetObjectMetadataAsync(metadataRequest);

            var lastModifiedTime = metadataResponse.LastModified?.ToLocalTime();
            var createdTime = lastModifiedTime;

            return (createdTime, lastModifiedTime);
        }

        public async Task<string> GetDuplicateCheckUniqueFileName(string blobID)
        {
            if (!await FileExistsAsync(blobID))
            {
                return blobID;
            }

            string newBlobID;
            var i = 1;
            var extension = Path.GetExtension(blobID);
            var baseBlobID = blobID.Substring(0, blobID.Length - extension.Length);

            do
            {
                newBlobID = $"{baseBlobID} ({i++}){extension}";
            } while (await FileExistsAsync(newBlobID));

            return newBlobID;
        }

    }
}
