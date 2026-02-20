using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Licensing;
using HandStack.Web;
using HandStack.Web.Entity;

using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

using Serilog;

namespace ack.Services
{
    public record ManagementHostInfo(string MachineID, string IpAddress, string HostName, string SystemVaultKey);

    public class SecretData
    {
        public ManagementHostInfo ManagementHost { get; set; } = new("", "", "", "");

        public Dictionary<string, List<KeyItem>> Secrets { get; set; } = new();
    }

    public record ClientInfo(string MachineID, string IpAddress, string HostName, string Environment)
    {
        public static bool TryGetFromHeaders(IHeaderDictionary headers, out ClientInfo? clientInfo)
        {
            var machineID = headers["HandStack-MachineID"].FirstOrDefault();
            var ipAddress = headers["HandStack-IP"].FirstOrDefault();
            var hostName = headers["HandStack-HostName"].FirstOrDefault();
            var environment = headers["HandStack-Environment"].FirstOrDefault();

            if (string.IsNullOrEmpty(machineID) == true || string.IsNullOrEmpty(ipAddress) == true || string.IsNullOrEmpty(hostName) == true || string.IsNullOrEmpty(environment) == true)
            {
                clientInfo = null;
                return false;
            }

            clientInfo = new ClientInfo(machineID, ipAddress, hostName, environment);
            return true;
        }
    }

    public class SecretService
    {
        private readonly string secretFilePath = PathExtensions.Join(GlobalConfiguration.EntryBasePath, "handstack-secrets.json");
        private SecretData? secretData = null;
        private readonly SemaphoreSlim fileLock = new(1, 1);
        private readonly ILogger logger;
        public readonly string SystemVaultKey;


        public SecretService(ILogger logger)
        {
            this.logger = logger;
            LoadSecretsAsync().GetAwaiter().GetResult();

            SystemVaultKey = (secretData?.ManagementHost.SystemVaultKey).ToStringSafe();
        }

        private async Task LoadSecretsAsync()
        {
            if (File.Exists(secretFilePath) == true)
            {
                await fileLock.WaitAsync();
                try
                {
                    var json = await File.ReadAllTextAsync(secretFilePath);
                    secretData = JsonConvert.DeserializeObject<SecretData>(json) ?? new SecretData();
                }
                finally
                {
                    fileLock.Release();
                }
            }
            else
            {
                secretData = null;
            }
        }

        private async Task SaveSecretsInternalAsync()
        {
            if (secretData != null)
            {
                var settings = new JsonSerializerSettings
                {
                    Formatting = Formatting.Indented,
                    NullValueHandling = NullValueHandling.Ignore
                };
                var json = JsonConvert.SerializeObject(secretData, settings);
                await File.WriteAllTextAsync(secretFilePath, json);
            }
            else
            {
                logger.Warning("[{LogCategory}] ack 프로그램 루트에 handstack-secrets.json 파일이 없습니다. 초기 데이터를 구성하세요.", "SecretService/SaveSecretsInternalAsync");
            }
        }

        public Dictionary<string, List<KeyItem>>? GetAllKeys(ClientInfo client)
        {
            var isManagementHost = IsManagementHost(client);
            if (isManagementHost == false)
            {
                return null;
            }

            return secretData?.Secrets;
        }

        public async Task<KeyItem?> GetKeyAsync(ClientInfo client, string keyName)
        {
            if (secretData != null)
            {
                await fileLock.WaitAsync();
                try
                {
                    var rule = FindMatchingRule(client);
                    if (rule == null)
                    {
                        return null;
                    }

                    if (!secretData.Secrets.TryGetValue(rule, out var keyList))
                    {
                        return null;
                    }

                    KeyItem? wildcardKeyItem = null;
                    foreach (var keyItem in keyList)
                    {
                        if (keyItem.Key != keyName)
                        {
                            continue;
                        }

                        if (keyItem.Environment == client.Environment)
                        {
                            return keyItem;
                        }

                        if (keyItem.Environment == "*" && wildcardKeyItem == null)
                        {
                            wildcardKeyItem = keyItem;
                        }
                    }

                    return wildcardKeyItem;
                }
                finally
                {
                    fileLock.Release();
                }
            }
            else
            {
                logger.Warning("[{LogCategory}] ack 프로그램 루트에 handstack-secrets.json 파일이 없습니다. 초기 데이터를 구성하세요.", "SecretService/GetKeyAsync");
            }

            return null;
        }

        public async Task<(bool, string)> UpsertKeyAsync(ClientInfo client, KeyItem newKey)
        {
            if (secretData == null)
            {
                logger.Warning("[{LogCategory}] ack 프로그램 루트에 handstack-secrets.json 파일이 없습니다. 초기 데이터를 구성하세요.", "SecretService/AddKeyAsync");
                return (false, "ack 프로그램 루트에 handstack-secrets.json 파일을 만들고 초기 데이터를 구성하세요.");
            }

            var isManagementHost = IsManagementHost(client);
            if (isManagementHost == false)
            {
                return (false, "키를 추가할 일치하는 규칙 확인이 필요합니다.");
            }

            await fileLock.WaitAsync();
            try
            {
                var rule = FindMatchingRule(client);
                if (rule == null)
                {
                    return (false, "키를 추가할 일치하는 규칙을 찾을 수 없습니다.");
                }

                newKey.CreatedAt = DateTime.Now;

                if (secretData.Secrets.TryGetValue(rule, out var keyList) == false)
                {
                    return (false, "키를 추가할 일치하는 규칙을 찾을 수 없습니다.");
                }

                var existingKey = keyList.FirstOrDefault(k => k.Key == newKey.Key && k.Environment == newKey.Environment);
                if (existingKey != null)
                {
                    keyList.Remove(existingKey);
                }

                keyList.Add(newKey);
                await SaveSecretsInternalAsync();
                return (true, "키가 성공적으로 추가/업데이트되었습니다.");
            }
            finally
            {
                fileLock.Release();
            }
        }

        public async Task<(bool, string)> DeleteKeyAsync(ClientInfo client, string keyName)
        {
            if (secretData == null)
            {
                logger.Warning("[{LogCategory}] ack 프로그램 루트에 handstack-secrets.json 파일이 없습니다. 초기 데이터를 구성하세요.", "SecretService/DeleteKeyAsync");
                return (false, "ack 프로그램 루트에 handstack-secrets.json 파일을 만들고 초기 데이터를 구성하세요.");
            }

            var isManagementHost = IsManagementHost(client);
            if (isManagementHost == false)
            {
                return (false, "키를 삭제할 일치하는 규칙 확인이 필요합니다.");
            }

            await fileLock.WaitAsync();
            try
            {
                var rule = FindMatchingRule(client);
                if (rule == null)
                {
                    return (false, "클라이언트에 대한 일치하는 규칙을 찾을 수 없습니다.");
                }

                if (secretData.Secrets.TryGetValue(rule, out var keyList) == false)
                {
                    return (false, "클라이언트에 대한 일치하는 규칙을 찾을 수 없습니다.");
                }

                var keysToRemoveCount = keyList.RemoveAll(k => k.Key == keyName);

                if (keysToRemoveCount == 0)
                {
                    return (false, $"일치하는 규칙 '{rule}' 아래에서 '{keyName}' 키를 찾을 수 없습니다.");
                }

                await SaveSecretsInternalAsync();
                return (true, $"{keysToRemoveCount}개의 키가 성공적으로 삭제되었습니다.");
            }
            finally
            {
                fileLock.Release();
            }
        }

        private string? FindMatchingRule(ClientInfo client)
        {
            if (secretData != null)
            {
                foreach (var rule in secretData.Secrets.Keys)
                {
                    var firstSeparatorIndex = rule.IndexOf('|');
                    if (firstSeparatorIndex < 0)
                    {
                        continue;
                    }

                    var secondSeparatorIndex = rule.IndexOf('|', firstSeparatorIndex + 1);
                    if (secondSeparatorIndex < 0 || secondSeparatorIndex == rule.Length - 1)
                    {
                        continue;
                    }

                    var machineRule = rule.Substring(0, firstSeparatorIndex);
                    var ipRule = rule.Substring(firstSeparatorIndex + 1, secondSeparatorIndex - firstSeparatorIndex - 1);
                    var hostRule = rule.Substring(secondSeparatorIndex + 1);

                    bool machineIDMatch = machineRule == client.MachineID || machineRule == "*";
                    bool ipMatch = ipRule == client.IpAddress || ipRule == "*";
                    bool hostIDMatch = hostRule == client.HostName || hostRule == "*";

                    if (machineIDMatch && ipMatch && hostIDMatch)
                    {
                        return rule;
                    }
                }
            }

            return null;
        }

        public bool IsManagementHost(ClientInfo client)
        {
            if (secretData?.ManagementHost == null)
            {
                return false;
            }

            var managementHost = secretData.ManagementHost;
            bool machineIDMatch = managementHost.MachineID == client.MachineID || managementHost.MachineID == "*";
            bool ipMatch = managementHost.IpAddress == client.IpAddress || managementHost.IpAddress == "*";
            bool hostNameMatch = managementHost.HostName == client.HostName || managementHost.HostName == "*";

            return machineIDMatch && ipMatch && hostNameMatch;
        }
    }
}
