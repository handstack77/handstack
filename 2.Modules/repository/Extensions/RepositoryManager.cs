using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using Azure.Storage.Sas;

using HandStack.Web.Entity;

using Serilog;

namespace repository.Extensions
{
    public class RepositoryManager
    {
        private ILogger logger { get; }
        private string directoryPathFlag = "/";
        private string persistenceDirectoryPath = "";

        public string PersistenceDirectoryPath
        {
            get { return this.persistenceDirectoryPath; }
            set { this.persistenceDirectoryPath = value; }
        }

        public RepositoryManager()
        {
            this.logger = Log.Logger;
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
            {
                directoryPathFlag = @"\";
            }
            else
            {
                directoryPathFlag = "/";
            }
        }

        public RepositoryManager(ILogger logger) : base()
        {
            this.logger = logger;
        }

        public string GetPolicyPath(Repository repository)
        {
            string result = "";
            if (repository.IsAutoPath == true)
            {
                switch (repository.PolicyPathID)
                {
                    case "1":
                        result = DateTime.Now.ToString("yyyy");
                        break;
                    case "2":
                        result = DateTime.Now.ToString("yyyyMM");
                        break;
                    case "3":
                        result = DateTime.Now.ToString("yyyyMMdd");
                        break;
                }
            }

            return result;
        }

        public string GetPhysicalPath(Repository repository, string applicationID, string customPath1, string customPath2, string customPath3)
        {
            string result = "";
            if (repository.IsAutoPath == true)
            {
                string dynamicPath = "";
                switch (repository.PolicyPathID)
                {
                    case "1": // 참조식별자+년도
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3) + DateTime.Now.ToString("yyyy") + directoryPathFlag;
                        break;
                    case "2": // 참조식별자+년월
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3) + DateTime.Now.ToString("yyyy-MM") + directoryPathFlag;
                        break;
                    case "3": // 참조식별자+년월일
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3) + DateTime.Now.ToString("yyyy-MM-dd") + directoryPathFlag;
                        break;
                    default:
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3);
                        break;
                }
                result = Path.Combine(repository.PhysicalPath, dynamicPath);
            }
            else
            {
                result = Path.Combine(repository.PhysicalPath, GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3));
            }

            result = new DirectoryInfo(result).FullName;
            return result;
        }

        public string GetRelativePath(Repository repository, string applicationID, string customPath1, string customPath2, string customPath3)
        {
            string result;
            if (repository.IsAutoPath == true)
            {
                string dynamicPath;
                switch (repository.PolicyPathID)
                {
                    case "1": // 참조식별자+년도
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3) + DateTime.Now.ToString("yyyy") + directoryPathFlag;
                        break;
                    case "2": // 참조식별자+년월
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3) + DateTime.Now.ToString("yyyy-MM") + directoryPathFlag;
                        break;
                    case "3": // 참조식별자+년월일
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3) + DateTime.Now.ToString("yyyy-MM-dd") + directoryPathFlag;
                        break;
                    default:
                        dynamicPath = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3);
                        break;
                }
                result = dynamicPath;
            }
            else
            {
                result = GetCustomFileStoragePath(applicationID, customPath1, customPath2, customPath3);
            }

            return result;
        }

        public string GetRepositoryItemPath(Repository repository, RepositoryItems repositoryItem)
        {
            string result = "";

            if (repository.StorageType == "AzureBlob")
            {
                if (repository.IsAutoPath == true)
                {
                    result = GetCustomUrlPath(repositoryItem.ApplicationID, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3) + repositoryItem.PolicyPath;
                }
                else
                {
                    result = GetCustomUrlPath(repositoryItem.ApplicationID, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3);
                }
            }
            else
            {
                if (repository.IsAutoPath == true)
                {
                    string dynamicPath = GetCustomFileStoragePath(repositoryItem.ApplicationID, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3) + repositoryItem.PolicyPath;
                    result = Path.Combine(repository.PhysicalPath, dynamicPath);
                }
                else
                {
                    result = Path.Combine(repository.PhysicalPath, GetCustomFileStoragePath(repositoryItem.ApplicationID, repositoryItem.CustomPath1, repositoryItem.CustomPath2, repositoryItem.CustomPath3));
                }
            }

            return result;
        }

        private Uri? GetServiceSasUriForContainer(BlobContainerClient blobContainerClient, string? storedPolicyName = null)
        {
            return GetServiceSasUriForContainer(blobContainerClient, DateTimeOffset.UtcNow.AddHours(1), storedPolicyName);
        }

        private Uri? GetServiceSasUriForContainer(BlobContainerClient blobContainerClient, DateTimeOffset expiresOn, string? storedPolicyName = null)
        {
            if (blobContainerClient.CanGenerateSasUri)
            {
                BlobSasBuilder sasBuilder = new BlobSasBuilder()
                {
                    BlobContainerName = blobContainerClient.Name,
                    Resource = "c"
                };

                if (storedPolicyName == null)
                {
                    sasBuilder.ExpiresOn = expiresOn;
                    sasBuilder.SetPermissions(BlobSasPermissions.Read);
                }
                else
                {
                    sasBuilder.Identifier = storedPolicyName;
                }

                Uri sasUri = blobContainerClient.GenerateSasUri(sasBuilder);
                return sasUri;
            }
            else
            {
                logger.Warning("[{LogCategory}] 서비스 SAS를 생성하려면 BlobContainerClient 공유 키 자격 증명이 있어야합니다", "RepositoryManager/GetServiceSasUriForContainer");
                return null;
            }
        }

        private Uri? GetServiceSasUriForBlob(BlobClient blobClient, string? storedPolicyName = null)
        {
            return GetServiceSasUriForBlob(blobClient, DateTimeOffset.UtcNow.AddHours(1), storedPolicyName);
        }

        private Uri? GetServiceSasUriForBlob(BlobClient blobClient, DateTimeOffset expiresOn, string? storedPolicyName = null)
        {
            if (blobClient.CanGenerateSasUri)
            {
                BlobSasBuilder sasBuilder = new BlobSasBuilder()
                {
                    BlobContainerName = blobClient.GetParentBlobContainerClient().Name,
                    BlobName = blobClient.Name,
                    Resource = "b"
                };

                if (storedPolicyName == null)
                {
                    sasBuilder.ExpiresOn = expiresOn;
                    sasBuilder.SetPermissions(BlobSasPermissions.Read);
                }
                else
                {
                    sasBuilder.Identifier = storedPolicyName;
                }

                Uri sasUri = blobClient.GenerateSasUri(sasBuilder);
                return sasUri;
            }
            else
            {
                logger.Warning("[{LogCategory}] 서비스 SAS를 생성하려면 BlobClient에 공유 키 자격 증명이 있어야합니다", "RepositoryManager/GetServiceSasUriForBlob");
                return null;
            }
        }

        public string GetCustomUrlPath(string applicationID, string customPath1, string customPath2, string customPath3)
        {
            string result = "";

            if (string.IsNullOrEmpty(applicationID) == false)
            {
                result += applicationID + "/";
            }

            if (string.IsNullOrEmpty(customPath1) == false)
            {
                result += customPath1 + "/";
            }

            if (string.IsNullOrEmpty(customPath2) == false)
            {
                result += customPath2 + "/";
            }

            if (string.IsNullOrEmpty(customPath3) == false)
            {
                result += customPath3 + "/";
            }

            return result;
        }

        public string GetCustomFileStoragePath(string applicationID, string customPath1, string customPath2, string customPath3)
        {
            string result = "";

            if (string.IsNullOrEmpty(applicationID) == false)
            {
                result += applicationID + directoryPathFlag;
            }

            if (string.IsNullOrEmpty(customPath1) == false)
            {
                result += customPath1 + directoryPathFlag;
            }

            if (string.IsNullOrEmpty(customPath2) == false)
            {
                result += customPath2 + directoryPathFlag;
            }

            if (string.IsNullOrEmpty(customPath3) == false)
            {
                result += customPath3 + directoryPathFlag;
            }

            return result;
        }

        public void WriteTextFile(string fileName, string addedText)
        {
            File.WriteAllText(Path.Combine(persistenceDirectoryPath, fileName), addedText);
        }

        public async Task<string> GetDuplicateCheckUniqueFileName(BlobContainerClient container, string blobID)
        {
            string result;
            BlobClient blob = container.GetBlobClient(blobID);
            if (await blob.ExistsAsync() == true)
            {
                string originalBlobID = blobID;
                if (File.Exists(Path.Combine(this.PersistenceDirectoryPath, blobID)) == false)
                {
                    result = blobID;
                }
                else
                {
                    int i = 0;
                    string extension = Path.GetExtension(blobID);
                    blobID = blobID.Replace(extension, "");
                    do
                    {
                        blobID = string.Concat(originalBlobID, " (", (i++).ToString(), ")", extension);
                        blob = container.GetBlobClient(blobID);
                    } while (await blob.ExistsAsync());

                    result = blobID;
                }
            }
            else {
                result = blobID;
            }

            return result;
        }

        public string GetDuplicateCheckUniqueFileName(string fileName)
        {
            string result;
            if (File.Exists(Path.Combine(this.PersistenceDirectoryPath, fileName)) == true)
            {
                string originalFileName = fileName;
                int i = 0;
                string extension = Path.GetExtension(fileName);

                if (string.IsNullOrEmpty(extension) == false)
                {
                    fileName = fileName.Replace(extension, "");
                }

                FileInfo fileInfo;
                do
                {
                    fileName = string.Concat(originalFileName, " (", (i++).ToString(), ")", extension);
                    fileInfo = new FileInfo(Path.Combine(this.PersistenceDirectoryPath, fileName));
                } while (fileInfo.Exists);

                result = fileName;
            }
            else
            {
                result = fileName;
            }

            return result;
        }

        public string GetSavePath(string itemID)
        {
            DirectoryInfo saveFolder = new DirectoryInfo(this.PersistenceDirectoryPath);

            if (saveFolder.Exists == false)
            {
                saveFolder.Create();
            }

            return Path.Combine(this.PersistenceDirectoryPath, itemID);
        }

        public void Move(string sourceFileName, string destnationFileName)
        {
            if (string.IsNullOrEmpty(sourceFileName) == false)
            {
                string fileName = GetSavePath(sourceFileName);
                if (File.Exists(fileName) == true)
                {
                    File.Move(fileName, destnationFileName, true);
                }
            }
        }

        public void Delete(string itemID)
        {
            if (string.IsNullOrEmpty(itemID) == false)
            {
                string fileName = Path.Combine(this.PersistenceDirectoryPath, itemID);
                if (File.Exists(fileName) == true)
                {
                    File.Delete(fileName);
                }
            }
        }

        private void getThumbnailSize(int originalWidth, int originalHeight, bool keepOriginalSizeRatio, int thumbnailMaxWidth, int thumbnailMaxHeight, out int thumbnailWidth, out int thumbnailHeight)
        {
            if (keepOriginalSizeRatio)
            {
                thumbnailWidth = originalWidth;
                thumbnailHeight = originalHeight;
                Single ratio = (((Single)originalHeight) / ((Single)originalWidth)) * 100f;
                if (ratio < 100f)
                {
                    if (originalWidth > thumbnailMaxWidth)
                    {
                        thumbnailWidth = thumbnailMaxWidth;
                        thumbnailHeight = (originalHeight * thumbnailMaxWidth) / originalWidth;
                    }
                }
                else if (originalHeight > thumbnailMaxHeight)
                {
                    thumbnailWidth = (originalWidth * thumbnailMaxHeight) / originalHeight;
                    thumbnailHeight = thumbnailMaxHeight;
                }
            }
            else
            {
                thumbnailWidth = thumbnailMaxWidth;
                thumbnailHeight = thumbnailMaxHeight;
            }
        }
    }
}
