using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HandStack.Core.Licensing.Validation
{
    public class ModuleLicenseValidator
    {
        private string saltValue = "handstack-salt-value";
        private readonly Dictionary<string, (ValidationResult result, DateTime timestamp)> cache = new();
        private readonly TimeSpan cacheTtl = TimeSpan.FromHours(24);
        private int validationCount = 0;
        private readonly int maxValidationAttempts = 1000;

        public async Task<ValidationResult> ValidateLicenseAsync(
            string moduleID,
            LicenseItem entry,
            bool enableCache = true,
            bool throwOnError = true,
            string? customErrorMessage = null)
        {
            try
            {
                validationCount++;
                if (validationCount > maxValidationAttempts)
                {
                    throw new InvalidOperationException("유효성 검사 시도 횟수가 너무 많습니다.");
                }

                string cacheKey = $"{moduleID}_{entry.ProductName}";
                if (enableCache && cache.TryGetValue(cacheKey, out var cached))
                {
                    if (DateTime.UtcNow - cached.timestamp < cacheTtl)
                    {
                        return cached.result;
                    }
                }

                string licenseString = $"{entry.Key}.{entry.SignKey}";
                var parsed = ParseLicenseKey(licenseString);
                if (!parsed.valid)
                {
                    throw new InvalidOperationException($"잘못된 라이선스 형식: {parsed.error}");
                }

                var validation = await PerformLicenseValidationAsync(
                    moduleID,
                    parsed.encryptedKey!,
                    parsed.signKey!);

                if (!validation.valid)
                {
                    var em = customErrorMessage ?? $"라이선스 유효성 검사 실패: {validation.reason}";
                    throw new InvalidOperationException(em);
                }

                List<string> matchTypes = new List<string>();
                var allowedHosts = entry.AuthorizedHost.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToList();

                for (int i = 0; i < allowedHosts.Count; i++)
                {
                    var allowedHost = allowedHosts[i].Trim();

                    var domainResult = ValidateDomain(validation.data!.AllowedHosts, allowedHost);
                    if (domainResult.valid == false)
                    {
                        var em = customErrorMessage ?? $"도메인이 승인되지 않았습니다: {domainResult.reason}";
                        throw new InvalidOperationException(em);
                    }

                    matchTypes.Add(domainResult.matchType!);
                }

                var expirationResult = ValidateExpiration(validation.data!.ExpiresAt);
                if (!expirationResult.valid)
                {
                    var em = customErrorMessage ?? $"라이선스 만료: {expirationResult.reason}";
                    throw new InvalidOperationException(em);
                }

                var result = new ValidationResult
                {
                    IsValid = true,
                    Data = new LicenseValidationData
                    {
                        ModuleID = moduleID,
                        Company = validation.data.CompanyName,
                        Product = entry.ProductName,
                        Environment = validation.data.Environment,
                        CreatedAt = validation.data.CreatedAt,
                        ExpiresAt = validation.data.ExpiresAt,
                        AllowedHosts = validation.data.AllowedHosts,
                        DomainMatch = string.Join(",", matchTypes),
                        ValidatedAt = DateTime.UtcNow
                    }
                };

                if (enableCache)
                {
                    cache[cacheKey] = (result, DateTime.UtcNow);
                }

                return result;
            }
            catch (Exception ex)
            {
                if (throwOnError) throw;
                return new ValidationResult { IsValid = false, Error = ex.Message };
            }
        }

        private (bool valid, string? encryptedKey, string? signKey, string? error) ParseLicenseKey(string licenseKey)
        {
            if (string.IsNullOrWhiteSpace(licenseKey))
                return (false, null, null, "라이선스 키가 비어있습니다.");

            var parts = licenseKey.Split('.');
            if (parts.Length != 3)
                return (false, null, null, "잘못된 라이선스 키 형식 (Key.SignKey 예상)");

            var encrypted = parts[0];
            var sign = parts[1];
            saltValue = parts[2];

            if (!IsValidBase64(encrypted))
                return (false, null, null, "암호화된 키 Base64 형식 오류");

            if (!System.Text.RegularExpressions.Regex.IsMatch(sign, "^[a-fA-F0-9]+$"))
                return (false, null, null, "잘못된 서명 형식");

            return (true, encrypted, sign.ToLowerInvariant(), null);
        }

        private bool IsValidBase64(string s)
        {
            try
            {
                return Convert.ToBase64String(Convert.FromBase64String(s)) == s;
            }
            catch
            {
                return false;
            }
        }

        private async Task<(bool valid, LicenseData? data, string? reason)> PerformLicenseValidationAsync(
            string moduleID,
            string encryptedKey,
            string signKey)
        {
            string decoded;
            try
            {
                decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encryptedKey));
            }
            catch
            {
                return (false, null, "라이선스 키 디코딩 실패");
            }

            var parts = decoded.Split(':');
            if (parts.Length != 2)
                return (false, null, "잘못된 라이선스 데이터 구조");

            string ivHex = parts[0];
            string cipherHex = parts[1];

            if (signKey.Length != 64)
                return (false, null, "잘못된 서명 길이");

            try
            {
                byte[] keyBytes = await DeriveKeyAsync(moduleID);
                byte[] iv = HexToBytes(ivHex);
                byte[] cipherBytes = HexToBytes(cipherHex);

                string plaintext = DecryptAesCbc(cipherBytes, keyBytes, iv);

                var fields = plaintext.Split('|');
                if (fields.Length < 5)
                {
                    return (false, null, "필드 개수가 부족합니다.");
                }

                string expectedSign = await GenerateSignKeyAsync(plaintext, saltValue);
                if (!CryptographicOperations.FixedTimeEquals(
                        Encoding.ASCII.GetBytes(expectedSign),
                        Encoding.ASCII.GetBytes(signKey)))
                {
                    return (false, null, "서명 불일치");
                }

                var data = new LicenseData
                {
                    CompanyName = fields[0],
                    CreatedAt = fields[1],
                    ExpiresAt = string.IsNullOrWhiteSpace(fields[2]) ? null : fields[2],
                    Environment = fields[3],
                    AllowedHosts = fields[4].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                };

                return (true, data, null);
            }
            catch (Exception ex)
            {
                return (false, null, ex.Message);
            }
        }

        private record LicenseData
        {
            public string CompanyName { get; init; } = "";
            public string CreatedAt { get; init; } = "";
            public string? ExpiresAt { get; init; }
            public string Environment { get; init; } = "";
            public List<string> AllowedHosts { get; init; } = new();
        }

        private async Task<byte[]> DeriveKeyAsync(string moduleID)
        {
            byte[] password = Encoding.UTF8.GetBytes(moduleID);
            byte[] salt = Encoding.UTF8.GetBytes(saltValue);
            return await Task.Run(() => Scrypt.DeriveKey(password, salt, 16384, 8, 1, 32));
        }

        private string DecryptAesCbc(byte[] cipher, byte[] key, byte[] iv)
        {
            using var aes = Aes.Create();
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.KeySize = 256;
            aes.BlockSize = 128;
            aes.Key = key;
            aes.IV = iv;

            using var dec = aes.CreateDecryptor();
            byte[] plain = dec.TransformFinalBlock(cipher, 0, cipher.Length);
            return Encoding.UTF8.GetString(plain);
        }

        private byte[] HexToBytes(string hex)
        {
            if (hex.Length % 2 != 0) throw new ArgumentException("유효하지 않는 hex 길이 입니다.");
            byte[] r = new byte[hex.Length / 2];
            for (int i = 0; i < r.Length; i++)
                r[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
            return r;
        }

        private async Task<string> GenerateSignKeyAsync(string data, string salt)
        {
            var combined = data + salt;
            var bytes = Encoding.UTF8.GetBytes(combined);
            byte[] hash = await Task.Run(() => SHA256.HashData(bytes));
            return string.Concat(hash.Select(b => b.ToString("x2")));
        }

        private (bool valid, string? matchType, string? reason) ValidateDomain(List<string> allowedHosts, string currentDomain)
        {
            if (string.IsNullOrWhiteSpace(currentDomain))
                return (false, null, "현재 도메인을 확인할 수 없습니다.");

            if (allowedHosts.Contains(currentDomain, StringComparer.OrdinalIgnoreCase))
                return (true, "정확히 일치", null);

            foreach (var host in allowedHosts)
            {
                if (host.StartsWith("*.", StringComparison.Ordinal))
                {
                    var baseDomain = host[2..];
                    if (currentDomain.EndsWith("." + baseDomain, StringComparison.OrdinalIgnoreCase) ||
                        currentDomain.Equals(baseDomain, StringComparison.OrdinalIgnoreCase))
                    {
                        return (true, "서브도메인", null);
                    }
                }
                else
                {
                    if (currentDomain.EndsWith("." + host, StringComparison.OrdinalIgnoreCase))
                        return (true, "서브도메인", null);
                }
            }

            return (false, null, $"도메인 '{currentDomain}' 은(는) 허용 목록에 없습니다: {string.Join(", ", allowedHosts)}");
        }

        private (bool valid, string reason) ValidateExpiration(string? expiresAt)
        {
            if (string.IsNullOrWhiteSpace(expiresAt))
                return (true, "만료일 없음");
            if (!DateTime.TryParse(expiresAt, out var expiry))
                return (false, "만료일 파싱 실패");

            if (expiry < DateTime.UtcNow)
                return (false, $"라이선스가 {expiry:O} 에 만료됨");

            return (true, "만료되지 않음");
        }

        public static string ToJson(object o)
            => JsonSerializer.Serialize(o, new JsonSerializerOptions { WriteIndented = true });
    }
}
