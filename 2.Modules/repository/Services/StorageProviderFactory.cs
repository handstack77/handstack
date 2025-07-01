using System;

using HandStack.Web.Entity;

using repository.Entity;
using repository.Extensions;

namespace repository.Services
{
    public interface IStorageProviderFactory
    {
        IStorageProvider? Create(Repository repository, string customPath1, string customPath2, string customPath3);
    }

    public class StorageProviderFactory : IStorageProviderFactory
    {
        public IStorageProvider? Create(Repository repository, string customPath1, string customPath2, string customPath3)
        {
            switch (repository.StorageType)
            {
                case "AzureBlob":
                    return new AzureBlobStorageProvider(repository);
                case "AWS_S3":
                    return new AwsS3StorageProvider(repository);
                case "GoogleCloudStorage":
                    return new GoogleCloudStorageProvider(repository);
                case "FileSystem":
                    var repositoryManager = new RepositoryManager();
                    repositoryManager.PersistenceDirectoryPath = repositoryManager.GetPhysicalPath(repository, customPath1, customPath2, customPath3);
                    return new FileSystemStorageProvider(repository, repositoryManager);
            }

            return null;
        }
    }
}
