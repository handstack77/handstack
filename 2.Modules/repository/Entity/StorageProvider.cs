using System;
using System.IO;
using System.Threading.Tasks;

namespace repository.Entity
{
    public class StorageDownloadResult
    {
        public Stream Content { get; set; } = Stream.Null;
        public string ContentType { get; set; } = string.Empty;
        public string ETag { get; set; } = string.Empty;
        public long ContentLength { get; set; }
    }

    public interface IStorageProvider
    {
        Task<(DateTime?, DateTime?)> UploadAsync(string blobID, Stream content, string contentType);
        Task<StorageDownloadResult> DownloadAsync(string blobID);
        Task DeleteAsync(string blobID);
        Task MoveAsync(string sourceBlobID, string destinationBlobID, string contentType);
        Task<bool> FileExistsAsync(string blobID);
        Task<string> GetDuplicateCheckUniqueFileName(string blobID);
    }
}
