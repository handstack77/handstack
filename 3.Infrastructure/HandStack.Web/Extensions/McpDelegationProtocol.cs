using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace HandStack.Web.Extensions
{
    // OAuth/PAT와 별개인 호스트 간 요청 위임 전문. 본문·대상·수명을 서명으로 결합한다.
    public sealed class McpDelegationClaims
    {
        public string Issuer { get; set; } = "";
        public string Audience { get; set; } = "";
        public string Subject { get; set; } = "";
        public string UserName { get; set; } = "";
        public string[] Roles { get; set; } = [];
        public Dictionary<string, string> Claims { get; set; } = [];
        public string ContractId { get; set; } = "";
        public string[] AllowedContracts { get; set; } = [];
        public string Path { get; set; } = "";
        public string BodyHash { get; set; } = "";
        public long IssuedAt { get; set; }
        public long ExpiresAt { get; set; }
        public string Nonce { get; set; } = Guid.NewGuid().ToString("N");
        public List<McpContractStamp> Files { get; set; } = [];
    }

    public sealed class McpContractStamp
    {
        public string Kind { get; set; } = "";
        public string RelativePath { get; set; } = "";
        public string Hash { get; set; } = "";
    }

    public static class McpDelegationProtocol
    {
        public const string Header = "X-HandStack-Mcp-Delegation";
        public static string Hash(byte[] bytes)
        {
            return Convert.ToHexString(SHA256.HashData(bytes));
        }

        public static string Sign(McpDelegationClaims claims, RSA key)
        {
            var payload = Encode(JsonSerializer.SerializeToUtf8Bytes(claims));
            var message = "hs-mcp-v1." + payload;
            return message + "." + Encode(key.SignData(Encoding.ASCII.GetBytes(message), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
        }

        public static McpDelegationClaims Verify(string token, RSA key, string issuer, string audience, string path, string bodyHash, long now)
        {
            if (token.Length > 131072)
            {
                throw new CryptographicException("위임 전문 크기 확인 필요");
            }

            var parts = token.Split('.');
            if (parts.Length != 3 || parts[0] != "hs-mcp-v1" || !key.VerifyData(Encoding.ASCII.GetBytes(parts[0] + "." + parts[1]), Decode(parts[2]), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1))
            {
                throw new CryptographicException("위임 서명 확인 필요");
            }

            var claims = JsonSerializer.Deserialize<McpDelegationClaims>(Decode(parts[1])) ?? throw new CryptographicException("위임 전문 확인 필요");
            if (claims.Issuer != issuer || claims.Audience != audience || claims.Path != path || claims.BodyHash != bodyHash || claims.IssuedAt > now + 5 || claims.IssuedAt < now - 60 || claims.ExpiresAt <= now || claims.ExpiresAt > claims.IssuedAt + 60 || string.IsNullOrWhiteSpace(claims.Subject) || string.IsNullOrWhiteSpace(claims.UserName) || claims.Nonce.Length != 32)
            {
                throw new CryptographicException("위임 대상 또는 유효기간 확인 필요");
            }

            return claims;
        }

        private static string Encode(byte[] bytes)
        {
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        private static byte[] Decode(string text)
        {
            text = text.Replace('-', '+').Replace('_', '/');
            return Convert.FromBase64String(text.PadRight((text.Length + 3) / 4 * 4, '='));
        }
    }
}
