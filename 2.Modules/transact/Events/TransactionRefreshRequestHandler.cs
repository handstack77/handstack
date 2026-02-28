using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using MediatR;

using transact.Entity;
using transact.Extensions;

namespace transact.Events
{
    public class TransactionRefreshRequest : IRequest<bool>
    {
        public string ChangeType { get; }

        public string FilePath { get; }

        public string? UserWorkID { get; }

        public string? ApplicationID { get; }

        public TransactionRefreshRequest(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ChangeType = changeType;
            FilePath = filePath;
            UserWorkID = userWorkID;
            ApplicationID = applicationID;
        }
    }

    public class TransactionRefreshRequestHandler : IRequestHandler<TransactionRefreshRequest, bool>
    {
        private readonly Serilog.ILogger logger;

        public TransactionRefreshRequestHandler(Serilog.ILogger logger)
        {
            this.logger = logger;
        }

        public Task<bool> Handle(TransactionRefreshRequest request, CancellationToken cancellationToken)
        {
            var actionResult = false;
            var filePath = request.FilePath;

            if (filePath.StartsWith(Path.DirectorySeparatorChar) == true)
            {
                filePath = filePath.Substring(1);
            }

            logger.Information("[{LogCategory}] " + $"WatcherChangeTypes: {request.ChangeType}, FilePath: {filePath}", "Transaction/Refresh");

            var fileInfo = new FileInfo(filePath);

            var businessContracts = TransactionMapper.BusinessMappings;
            lock (businessContracts)
            {
                var watcherChangeTypes = (WatcherChangeTypes)Enum.Parse(typeof(WatcherChangeTypes), request.ChangeType);
                switch (watcherChangeTypes)
                {
                    case WatcherChangeTypes.Created:
                    case WatcherChangeTypes.Changed:
                        if (!string.IsNullOrWhiteSpace(request.UserWorkID) && !string.IsNullOrWhiteSpace(request.ApplicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, request.UserWorkID, request.ApplicationID);
                            var businessFile = PathExtensions.Join(appBasePath, filePath);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true && System.IO.File.Exists(businessFile) == true)
                            {
                                var configData = System.IO.File.ReadAllText(businessFile);

                                JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                                {
                                    CommentHandling = JsonCommentHandling.Skip,
                                    AllowTrailingCommas = true
                                });
                                if (root is JsonObject rootNode)
                                {
                                    var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                                    var hasEncrypt = rootNode.TryGetPropertyValue("EncryptServices", out var encryptNode) && encryptNode is JsonValue;
                                    if (hasSignatureKey == true && hasEncrypt == true)
                                    {
                                        var signatureKey = signatureKeyNode!.GetValue<string>();
                                        var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                        if (licenseItem == null)
                                        {
                                            logger.Error("[{LogCategory}] " + $"{businessFile} 업무 계약 파일 오류 - 서명 키 불일치", "TransactionController/Refresh");
                                            break;
                                        }

                                        var cipher = encryptNode!.GetValue<string>();
                                        var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                        JsonNode? restored;
                                        try
                                        {
                                            restored = JsonNode.Parse(plain);

                                            if (restored is not JsonArray restoredArr)
                                            {
                                                logger.Error("[{LogCategory}] " + $"Decrypted Services는 {businessFile} 내의 JSON 배열이 아닙니다.", "TransactionController/Refresh");
                                                break;
                                            }

                                            rootNode["Services"] = restoredArr;
                                        }
                                        catch (Exception exception)
                                        {
                                            logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "TransactionController/Refresh");
                                            break;
                                        }

                                        rootNode.Remove("SignatureKey");
                                        rootNode.Remove("EncryptServices");

                                        configData = rootNode.ToJsonString();
                                    }
                                }

                                var businessContract = BusinessContract.FromJson(configData);
                                if (businessContract != null)
                                {
                                    if (businessContracts.ContainsKey(businessFile) == true)
                                    {
                                        businessContracts.Remove(businessFile);
                                    }

                                    businessContract.TransactionProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                    fileInfo = new FileInfo(businessFile);
                                    businessContract.ApplicationID = string.IsNullOrWhiteSpace(businessContract.ApplicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                    businessContract.ProjectID = string.IsNullOrWhiteSpace(businessContract.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                    businessContract.TransactionID = string.IsNullOrWhiteSpace(businessContract.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                    businessContract.TransactionProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                    businessContracts.Add(businessFile, businessContract);

                                    logger.Information("[{LogCategory}] " + $"Add TenantApp Contract FilePath: {businessFile}", "Transaction/Refresh");
                                    actionResult = true;
                                }
                            }
                        }
                        else
                        {
                            foreach (var basePath in ModuleConfiguration.ContractBasePath)
                            {
                                var businessFile = PathExtensions.Join(basePath, filePath);
                                if (System.IO.File.Exists(businessFile) == true)
                                {
                                    var configData = System.IO.File.ReadAllText(businessFile);

                                    JsonNode? root = JsonNode.Parse(configData, documentOptions: new JsonDocumentOptions
                                    {
                                        CommentHandling = JsonCommentHandling.Skip,
                                        AllowTrailingCommas = true
                                    });
                                    if (root is JsonObject rootNode)
                                    {
                                        var hasSignatureKey = rootNode.TryGetPropertyValue("SignatureKey", out var signatureKeyNode) && signatureKeyNode is JsonValue;
                                        var hasEncrypt = rootNode.TryGetPropertyValue("EncryptServices", out var encryptNode) && encryptNode is JsonValue;
                                        if (hasSignatureKey == true && hasEncrypt == true)
                                        {
                                            var signatureKey = signatureKeyNode!.GetValue<string>();
                                            var licenseItem = GlobalConfiguration.LoadModuleLicenses.Values.FirstOrDefault(li => li.AssemblyToken == signatureKey);
                                            if (licenseItem == null)
                                            {
                                                logger.Error("[{LogCategory}] " + $"{businessFile} 업무 계약 파일 오류 - 서명 키 불일치", "TransactionController/Refresh");
                                                break;
                                            }

                                            var cipher = encryptNode!.GetValue<string>();
                                            var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                            JsonNode? restored;
                                            try
                                            {
                                                restored = JsonNode.Parse(plain);

                                                if (restored is not JsonArray restoredArr)
                                                {
                                                    logger.Error("[{LogCategory}] " + $"Decrypted Services는 {businessFile} 내의 JSON 배열이 아닙니다.", "TransactionController/Refresh");
                                                    break;
                                                }

                                                rootNode["Services"] = restoredArr;
                                            }
                                            catch (Exception exception)
                                            {
                                                logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "TransactionController/Refresh");
                                                break;
                                            }

                                            rootNode.Remove("SignatureKey");
                                            rootNode.Remove("EncryptServices");

                                            configData = rootNode.ToJsonString();
                                        }
                                    }

                                    var businessContract = BusinessContract.FromJson(configData);
                                    if (businessContract != null)
                                    {
                                        if (businessContracts.ContainsKey(businessFile) == true)
                                        {
                                            businessContracts.Remove(businessFile);
                                        }

                                        fileInfo = new FileInfo(businessFile);
                                        businessContract.ApplicationID = string.IsNullOrWhiteSpace(businessContract.ApplicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                        businessContract.ProjectID = string.IsNullOrWhiteSpace(businessContract.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                        businessContract.TransactionID = string.IsNullOrWhiteSpace(businessContract.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                        businessContract.TransactionProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                        businessContracts.Add(businessFile, businessContract, TimeSpan.FromDays(36500));

                                        logger.Information("[{LogCategory}] " + $"Add Contract FilePath: {businessFile}", "Transaction/Refresh");
                                        actionResult = true;
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    case WatcherChangeTypes.Deleted:
                        if (!string.IsNullOrWhiteSpace(request.UserWorkID) && !string.IsNullOrWhiteSpace(request.ApplicationID))
                        {
                            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, request.UserWorkID, request.ApplicationID);
                            var directoryInfo = new DirectoryInfo(appBasePath);
                            if (directoryInfo.Exists == true)
                            {
                                var itemPath = PathExtensions.Join(appBasePath, filePath);
                                if (fileInfo.Name != "publicTransactions.json")
                                {
                                    logger.Information("[{LogCategory}] " + $"Delete TenantApp Contract FilePath: {itemPath}", "Transaction/Refresh");
                                    actionResult = TransactionMapper.Remove(itemPath);
                                }
                            }
                        }
                        else if (fileInfo.Name != "publicTransactions.json")
                        {
                            foreach (var basePath in ModuleConfiguration.ContractBasePath)
                            {
                                var itemPath = PathExtensions.Join(basePath, filePath);
                                if (System.IO.File.Exists(itemPath) == true)
                                {
                                    logger.Information("[{LogCategory}] " + $"Delete Contract FilePath: {itemPath}", "Transaction/Refresh");

                                    actionResult = TransactionMapper.Remove(itemPath);
                                    break;
                                }
                            }
                        }
                        break;
                }
            }

            return Task.FromResult(actionResult);
        }
    }
}
