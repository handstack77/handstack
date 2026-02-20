using System;
using System.IO;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;
using HandStack.Web.Helper;

using repository.Entity;

namespace repository.Extensions
{
    public class FileSystemStorageProvider : IStorageProvider
    {
        private readonly RepositoryManager repositoryManager;
        private readonly Repository repository;

        public FileSystemStorageProvider(Repository repository, RepositoryManager repositoryManager)
        {
            this.repository = repository;
            this.repositoryManager = repositoryManager;
        }

        public Task DeleteAsync(string blobID)
        {
            var filePath = repositoryManager.GetSavePath(blobID);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }

        public Task<StorageDownloadResult?> DownloadAsync(string blobID)
        {
            var filePath = repositoryManager.GetSavePath(blobID);
            if (!File.Exists(filePath))
            {
                return Task.FromResult<StorageDownloadResult?>(null);
            }

            var fileInfo = new FileInfo(filePath);
            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);

#pragma warning disable CS8619
            return Task.FromResult(new StorageDownloadResult
            {
                Content = stream,
                ContentType = MimeHelper.GetMimeType(Path.GetFileName(filePath)) ?? "application/octet-stream",
                ContentLength = fileInfo.Length
            });
#pragma warning restore CS8619
        }

        public Task<bool> FileExistsAsync(string blobID)
        {
            var filePath = repositoryManager.GetSavePath(blobID);
            return Task.FromResult(File.Exists(filePath));
        }

        public Task MoveAsync(string sourceBlobID, string destinationBlobID, string contentType)
        {
            var sourcePath = repositoryManager.GetSavePath(sourceBlobID);
            var destPath = repositoryManager.GetSavePath(destinationBlobID);
            if (File.Exists(sourcePath))
            {
                File.Move(sourcePath, destPath);
            }
            return Task.CompletedTask;
        }

        public async Task<(DateTime?, DateTime?)> UploadAsync(string blobID, Stream content, string contentType)
        {
            var filePath = repositoryManager.GetSavePath(blobID);
            using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            {
                content.Position = 0;
                await content.CopyToAsync(fileStream);
            }

            var fileInfo = new FileInfo(filePath);
            return (fileInfo.CreationTime, fileInfo.LastWriteTime);
        }

        public Task<string> GetDuplicateCheckUniqueFileName(string fileName)
        {
            string result;
            if (File.Exists(PathExtensions.Combine(repositoryManager.PersistenceDirectoryPath, fileName)) == true)
            {
                var originalFileName = fileName;
                var i = 0;
                var extension = Path.GetExtension(fileName);

                if (!string.IsNullOrEmpty(extension))
                {
                    fileName = fileName.Replace(extension, "");
                }

                FileInfo fileInfo;
                do
                {
                    fileName = string.Concat(originalFileName, " (", (i++).ToString(), ")", extension);
                    fileInfo = new FileInfo(PathExtensions.Combine(repositoryManager.PersistenceDirectoryPath, fileName));
                } while (fileInfo.Exists);

                result = fileName;
            }
            else
            {
                result = fileName;
            }

            return Task.FromResult(result);
        }
    }
}

