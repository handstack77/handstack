using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

using Serilog;

using transact.Entity;

namespace transact.Extensions
{
    public static class TransactionMapper
    {
        public static ExpiringDictionary<string, BusinessContract> BusinessMappings = new ExpiringDictionary<string, BusinessContract>();

        public static BusinessContract? GetBusinessContract(string applicationID, string projectID, string transactionID)
        {
            BusinessContract? businessContract = null;
            lock (BusinessMappings)
            {
                businessContract = BusinessMappings.FirstOrDefault(item => item.Value.ApplicationID == applicationID
                    && item.Value.ProjectID == projectID
                    && item.Value.TransactionID == transactionID).Value;

                if (businessContract == null)
                {
                    var userWorkID = string.Empty;
                    var appBasePath = string.Empty;
                    var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                    var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                    foreach (var directory in directories)
                    {
                        var directoryInfo = new DirectoryInfo(directory);
                        if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                        {
                            appBasePath = directoryInfo.FullName.Replace("\\", "/");
                            userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                            break;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(appBasePath))
                    {
                        var tenantID = $"{userWorkID}|{applicationID}";
                        var businessFile = PathExtensions.Combine(appBasePath, "transact", projectID, transactionID + ".json");
                        if (File.Exists(businessFile) == true)
                        {
                            try
                            {
                                var configData = File.ReadAllText(businessFile);

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
                                            Log.Logger.Error("[{LogCategory}] " + $"{businessFile} 업무 계약 파일 오류 - 서명 키 불일치", "TransactionMapper/GetBusinessContract");
                                            return businessContract;
                                        }

                                        var cipher = encryptNode!.GetValue<string>();
                                        var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                        JsonNode? restored;
                                        try
                                        {
                                            restored = JsonNode.Parse(plain);

                                            if (restored is not JsonArray restoredArr)
                                            {
                                                Log.Logger.Error("[{LogCategory}] " + $"Decrypted Services는 {businessFile} 내의 JSON 배열이 아닙니다.", "TransactionMapper/GetBusinessContract");
                                                return businessContract;
                                            }

                                            rootNode["Services"] = restoredArr;
                                        }
                                        catch (Exception exception)
                                        {
                                            Log.Logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "TransactionMapper/GetBusinessContract");
                                            return businessContract;
                                        }

                                        rootNode.Remove("SignatureKey");
                                        rootNode.Remove("EncryptServices");

                                        configData = rootNode.ToJsonString();
                                    }
                                }

                                businessContract = BusinessContract.FromJson(configData);
                                if (businessContract != null)
                                {
                                    lock (BusinessMappings)
                                    {
                                        if (BusinessMappings.ContainsKey(businessFile) == true)
                                        {
                                            BusinessMappings.Remove(businessFile);
                                        }

                                        var fileInfo = new FileInfo(businessFile);
                                        businessContract.ApplicationID = string.IsNullOrWhiteSpace(businessContract.ApplicationID) ? (fileInfo.Directory?.Parent?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                        businessContract.ProjectID = string.IsNullOrWhiteSpace(businessContract.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                        businessContract.TransactionID = string.IsNullOrWhiteSpace(businessContract.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                        businessContract.TransactionProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                        BusinessMappings.Add(PathExtensions.Combine(businessFile), businessContract);
                                    }
                                }

                            }
                            catch (Exception exception)
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"{businessFile} 업무 계약 파일 오류 - {exception.ToMessage()}", "TransactionMapper/GetBusinessContract");
                            }
                        }
                    }
                }
            }

            return businessContract;
        }

        public static string? GetRoutingCommandUri(string routeSegmentID)
        {
            string? result = null;
            result = ModuleConfiguration.RoutingCommandUri[routeSegmentID];

            if (result == null)
            {
                var applicationID = string.Empty;
                var userWorkID = string.Empty;
                var itemKeys = routeSegmentID.Split("|");
                if (itemKeys.Length == 4)
                {
                    applicationID = itemKeys[0];
                    userWorkID = string.Empty;
                    var publicRouteSegmentID = $"{itemKeys[0]}|*|{itemKeys[2]}|{itemKeys[3]}";
                    result = ModuleConfiguration.RoutingCommandUri[publicRouteSegmentID];
                }
                else if (itemKeys.Length == 5)
                {
                    userWorkID = itemKeys[0];
                    applicationID = itemKeys[1];
                    var publicRouteSegmentID = $"{itemKeys[0]}|{itemKeys[1]}|*|{itemKeys[3]}|{itemKeys[4]}";
                    result = ModuleConfiguration.RoutingCommandUri[publicRouteSegmentID];
                }

                if (result == null)
                {
                    var appBasePath = string.Empty;
                    var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);

                    if (string.IsNullOrWhiteSpace(userWorkID))
                    {
                        var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                        foreach (var directory in directories)
                        {
                            var directoryInfo = new DirectoryInfo(directory);
                            if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                            {
                                appBasePath = directoryInfo.FullName.Replace("\\", "/");
                                userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                                break;
                            }
                        }
                    }
                    else
                    {
                        appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    }

                    var tenantID = $"{userWorkID}|{applicationID}";
                    var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                    if (!string.IsNullOrWhiteSpace(appBasePath) && File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                    {
                        var appSettingText = File.ReadAllText(settingFilePath);
                        var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                        if (appSetting != null)
                        {
                            var routingCommandUri = appSetting.Routing;
                            if (routingCommandUri != null)
                            {
                                foreach (var item in routingCommandUri.AsEnumerable())
                                {
                                    var tenantRouteSegmentID = $"{userWorkID}|{item.ApplicationID}|{item.ProjectID}|{item.CommandType}|{item.Environment}";
                                    if (ModuleConfiguration.RoutingCommandUri.ContainsKey(tenantRouteSegmentID) == false)
                                    {
                                        ModuleConfiguration.RoutingCommandUri.Add(tenantRouteSegmentID, item.Uri);
                                    }
                                }

                                result = ModuleConfiguration.RoutingCommandUri[routeSegmentID];
                                if (result == null)
                                {
                                    if (itemKeys.Length == 4)
                                    {
                                        var publicRouteSegmentID = $"{itemKeys[0]}|*|{itemKeys[2]}|{itemKeys[3]}";
                                        result = ModuleConfiguration.RoutingCommandUri[publicRouteSegmentID];
                                    }
                                    else if (itemKeys.Length == 5)
                                    {
                                        var publicRouteSegmentID = $"{itemKeys[0]}|{itemKeys[1]}|*|{itemKeys[3]}|{itemKeys[4]}";
                                        result = ModuleConfiguration.RoutingCommandUri[publicRouteSegmentID];
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return result;
        }

        public static PublicTransaction? GetPublicTransaction(string applicationID, string projectID, string transactionID)
        {
            PublicTransaction? result = null;
            result = ModuleConfiguration.PublicTransactions?.FirstOrDefault(p => p.ApplicationID == applicationID
                && (p.ProjectID == "*" || p.ProjectID == projectID)
                && (p.TransactionID == "*" || p.TransactionID == transactionID)
            );

            if (result == null)
            {
                var userWorkID = string.Empty;
                var appBasePath = string.Empty;
                var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                foreach (var directory in directories)
                {
                    var directoryInfo = new DirectoryInfo(directory);
                    if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                    {
                        appBasePath = directoryInfo.FullName.Replace("\\", "/");
                        userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                        break;
                    }
                }

                var tenantID = $"{userWorkID}|{applicationID}";
                var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                if (!string.IsNullOrWhiteSpace(appBasePath) && File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                {
                    var appSettingText = File.ReadAllText(settingFilePath);
                    var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                    if (appSetting != null)
                    {
                        var publicTransactions = appSetting.Public;
                        if (ModuleConfiguration.PublicTransactions == null)
                        {
                            ModuleConfiguration.PublicTransactions = new ExpiringList<PublicTransaction>();
                        }

                        if (publicTransactions != null && publicTransactions.Count() > 0)
                        {
                            for (var i = 0; i < publicTransactions.Count(); i++)
                            {
                                var publicTransaction = publicTransactions[i];

                                var appPublicTransaction = new PublicTransaction();
                                appPublicTransaction.ApplicationID = applicationID;
                                appPublicTransaction.ProjectID = publicTransaction.ProjectID;
                                appPublicTransaction.TransactionID = publicTransaction.TransactionID;

                                var findPublicTransaction = ModuleConfiguration.PublicTransactions.FirstOrDefault(p => p.ApplicationID == appPublicTransaction.ApplicationID
                                    && p.ProjectID == appPublicTransaction.ProjectID
                                    && p.TransactionID == appPublicTransaction.TransactionID
                                );

                                if (findPublicTransaction == null)
                                {
                                    ModuleConfiguration.PublicTransactions.Add(appPublicTransaction);
                                }
                            }

                            result = ModuleConfiguration.PublicTransactions?.FirstOrDefault(p => p.ApplicationID == applicationID
                                && (p.ProjectID == "*" || p.ProjectID == projectID)
                                && (p.TransactionID == "*" || p.TransactionID == transactionID)
                            );
                        }
                    }
                }
            }

            return result;
        }

        public static bool HasContractFile(string fileRelativePath)
        {
            var result = false;
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                var filePath = PathExtensions.Join(basePath, fileRelativePath);
                result = File.Exists(filePath);
                if (result == true)
                {
                    break;
                }
            }

            return result;
        }

        public static bool IsDynamicContract(string applicationID, string projectID, string transactionID)
        {
            var result = false;
            lock (BusinessMappings)
            {
                var findContracts = from item in BusinessMappings
                                    where item.Value.ApplicationID == applicationID && item.Value.ProjectID == projectID && item.Value.TransactionID == transactionID
                                    select item;

                if (findContracts.Count() == 1)
                {
                    var contract = findContracts.FirstOrDefault();
                    result = contract.Key.StartsWith("DYNAMIC|");
                }
            }

            return result;
        }

        public static bool Upsert(string key, BusinessContract businessContract, TimeSpan? expiryDuration = null)
        {
            var result = false;
            lock (BusinessMappings)
            {
                try
                {
                    if (businessContract != null)
                    {
                        if (BusinessMappings.ContainsKey(key) == true)
                        {
                            BusinessMappings.Remove(key);
                        }

                        BusinessMappings.Add(PathExtensions.Combine(key), businessContract, expiryDuration);
                        result = true;
                    }
                    else
                    {
                        result = false;
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"{key} 업무 계약 추가 오류 - {exception.ToMessage()}", "TransactionMapper/Add");
                    result = false;
                }
            }

            return result;
        }

        public static bool Remove(string filePath)
        {
            var result = false;
            lock (BusinessMappings)
            {
                try
                {
                    if (BusinessMappings.ContainsKey(filePath) == true)
                    {
                        BusinessMappings.Remove(filePath);
                        result = true;
                    }
                    else
                    {
                        result = false;
                    }
                }
                catch (Exception exception)
                {
                    Log.Logger.Error("[{LogCategory}] " + $"{filePath} 업무 계약 파일 오류 - {exception.ToMessage()}", "TransactionMapper/Remove");
                    result = false;
                }
            }

            return result;
        }

        public static int HasCount(string applicationID, string projectID, string transactionID)
        {
            var result = 0;
            lock (BusinessMappings)
            {
                var findContracts = from item in BusinessMappings.Values
                                    where item.ApplicationID == applicationID && item.ProjectID == projectID && item.TransactionID == transactionID
                                    select item;

                result = findContracts.Count();
            }

            return result;
        }

        public static void LoadContract(string environmentName, ILogger logger, IConfiguration configuration)
        {
            try
            {
                if (ModuleConfiguration.ContractBasePath.Count == 0)
                {
                    ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath($"../contracts/{ModuleConfiguration.ModuleID}"));
                }

                foreach (var basePath in ModuleConfiguration.ContractBasePath)
                {
                    if (Directory.Exists(basePath) == false || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                    {
                        continue;
                    }

                    var businessFiles = Directory.GetFiles(basePath, "*.json", SearchOption.AllDirectories);
                    lock (BusinessMappings)
                    {
                        foreach (var businessFile in businessFiles)
                        {
                            try
                            {
                                var fileInfo = new FileInfo(businessFile);
                                var configData = File.ReadAllText(businessFile);

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
                                            logger.Error("[{LogCategory}] " + $"{businessFile} 업무 계약 파일 오류 - 서명 키 불일치", "TransactionMapper/LoadContract");
                                            continue;
                                        }

                                        var cipher = encryptNode!.GetValue<string>();
                                        var plain = LZStringHelper.DecompressFromUint8Array(cipher.DecryptAESBytes(licenseItem.AssemblyKey.NormalizeKey())) ?? string.Empty;

                                        JsonNode? restored;
                                        try
                                        {
                                            restored = JsonNode.Parse(plain);

                                            if (restored is not JsonArray restoredArr)
                                            {
                                                logger.Error("[{LogCategory}] " + $"Decrypted Services는 {businessFile} 내의 JSON 배열이 아닙니다.", "TransactionMapper/LoadContract");
                                                continue;
                                            }

                                            rootNode["Services"] = restoredArr;
                                        }
                                        catch (Exception exception)
                                        {
                                            logger.Error(exception, "[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "TransactionMapper/LoadContract");
                                            continue;
                                        }

                                        rootNode.Remove("SignatureKey");
                                        rootNode.Remove("EncryptServices");

                                        configData = rootNode.ToJsonString();
                                    }
                                }

                                var businessContract = BusinessContract.FromJson(configData);
                                if (businessContract == null)
                                {
                                    logger.Error("[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}", "TransactionMapper/LoadContract");
                                }
                                else
                                {
                                    businessContract.ApplicationID = string.IsNullOrWhiteSpace(businessContract.ApplicationID) ? (fileInfo.Directory?.Parent?.Name).ToStringSafe() : businessContract.ApplicationID;
                                    businessContract.ProjectID = string.IsNullOrWhiteSpace(businessContract.ProjectID) ? (fileInfo.Directory?.Name).ToStringSafe() : businessContract.ProjectID;
                                    businessContract.TransactionID = string.IsNullOrWhiteSpace(businessContract.TransactionID) ? fileInfo.Name.Replace(fileInfo.Extension, "") : businessContract.TransactionID;
                                    businessContract.TransactionProjectID = string.IsNullOrWhiteSpace(businessContract.TransactionProjectID) ? businessContract.ProjectID : businessContract.TransactionProjectID;

                                    if (BusinessMappings.ContainsKey(businessFile) == false && HasCount(businessContract.ApplicationID, businessContract.ProjectID, businessContract.TransactionID) == 0)
                                    {
                                        BusinessMappings.Add(PathExtensions.Combine(businessFile), businessContract, TimeSpan.FromDays(36500));
                                    }
                                    else
                                    {
                                        logger.Warning("[{LogCategory}] " + $"업무 계약 파일 또는 거래 정보 중복 오류 - {businessFile}, ProjectID - {businessContract.ApplicationID}, BusinessID - {businessContract.ProjectID}, TransactionID - {businessContract.TransactionID}", "TransactionMapper/LoadContract");
                                    }
                                }
                            }
                            catch (Exception exception)
                            {
                                logger.Error("[{LogCategory}] " + $"업무 계약 파일 역 직렬화 오류 - {businessFile}, {exception.ToMessage()}", "TransactionMapper/LoadContract");
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + $"LoadContract 오류 - {exception.ToMessage()}", "TransactionMapper/LoadContract");
            }
        }
    }

    public static class Serialize
    {
        public static string ToJson(this List<Entity.Transaction> self) => JsonConvert.SerializeObject(self, Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters = {
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }
}

