using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace HandStack.Core.Helpers
{
    public static class CryptoHelper
    {

        public static (RSAParameters publicKey, RSAParameters privateKey) GenerateRSAKey()
        {
            using (var rsa = new RSACryptoServiceProvider(2048))
            {
                return (rsa.ExportParameters(false), rsa.ExportParameters(true));
            }
        }

        public static string ExportCryptoKey(RSAParameters key, bool isPublic)
        {
            using (var rsa = new RSACryptoServiceProvider())
            {
                rsa.ImportParameters(key);
                var keyBytes = isPublic ? rsa.ExportSubjectPublicKeyInfo() : rsa.ExportPkcs8PrivateKey();
                var keyBase64 = Convert.ToBase64String(keyBytes);
                var keyLabel = isPublic ? "PUBLIC" : "PRIVATE";
                var keyPem = $"-----BEGIN {keyLabel} KEY-----\n{keyBase64}\n-----END {keyLabel} KEY-----";
                return keyPem;
            }
        }

        public static RSAParameters ImportCryptoKey(string pem, bool isPublic)
        {
            var keyLabel = isPublic ? "PUBLIC" : "PRIVATE";
            var pemHeader = $"-----BEGIN {keyLabel} KEY-----";
            var pemFooter = $"-----END {keyLabel} KEY-----";
            var pemContents = pem.Replace(pemHeader, "").Replace(pemFooter, "").Replace("\n", "");
            var keyBytes = Convert.FromBase64String(pemContents);

            using (var rsa = new RSACryptoServiceProvider())
            {
                if (isPublic)
                {
                    rsa.ImportSubjectPublicKeyInfo(keyBytes, out _);
                }
                else
                {
                    rsa.ImportPkcs8PrivateKey(keyBytes, out _);
                }
                return rsa.ExportParameters(isPublic);
            }
        }

        public static string RsaEncode(string text, RSAParameters publicKey)
        {
            using (var rsa = new RSACryptoServiceProvider())
            {
                rsa.ImportParameters(publicKey);
                var data = Encoding.UTF8.GetBytes(text);
                var encryptedData = rsa.Encrypt(data, RSAEncryptionPadding.OaepSHA256);
                return Convert.ToBase64String(encryptedData);
            }
        }

        public static string RsaDecode(string encryptedData, RSAParameters privateKey)
        {
            using (var rsa = new RSACryptoServiceProvider())
            {
                rsa.ImportParameters(privateKey);
                var data = Convert.FromBase64String(encryptedData);
                var decryptedData = rsa.Decrypt(data, RSAEncryptionPadding.OaepSHA256);
                return Encoding.UTF8.GetString(decryptedData);
            }
        }

        public static byte[] PadKey(string key, int length)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            if (keyBytes.Length >= length)
            {
                return keyBytes.Take(length).ToArray();
            }

            var paddedKey = new byte[length];
            Array.Copy(keyBytes, paddedKey, keyBytes.Length);
            return paddedKey;
        }

        public static string GenerateHMAC(string key, string message)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var messageBytes = Encoding.UTF8.GetBytes(message);

            using (var hmac = new HMACSHA256(keyBytes))
            {
                var hashBytes = hmac.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }

        public static bool VerifyHMAC(string key, string message, string signature)
        {
            var generatedSignature = GenerateHMAC(key, message);
            return generatedSignature.Equals(signature, StringComparison.OrdinalIgnoreCase);
        }

        public static byte[] GenerateIV(string key, int ivLength = 16)
        {
            if (key.ToUpper() == "$RANDOM$")
            {
                var iv = new byte[ivLength];
                RandomNumberGenerator.Fill(iv);
                return iv;
            }
            else
            {
                return PadKey(key, ivLength);
            }
        }

        public static (string iv, string encrypted) AesEncode(string text, string key = "0123456789abcdef0123456789abcdef", int keyLength = 256, CipherMode mode = CipherMode.CBC, PaddingMode padding = PaddingMode.PKCS7)
        {
            var iv = GenerateIV(key, 16);
            var keyBytes = PadKey(key, keyLength / 8);
            var data = Encoding.UTF8.GetBytes(text);

            using (var aes = Aes.Create())
            {
                aes.Key = keyBytes;
                aes.IV = iv;
                aes.Mode = mode;
                aes.Padding = padding;

                using (var encryptor = aes.CreateEncryptor())
                {
                    var encryptedData = encryptor.TransformFinalBlock(data, 0, data.Length);
                    return (Convert.ToBase64String(iv), Convert.ToBase64String(encryptedData));
                }
            }
        }

        public static string AesDecode(string encryptedData, string key = "0123456789abcdef0123456789abcdef", string iv = "", int keyLength = 256, CipherMode mode = CipherMode.CBC, PaddingMode padding = PaddingMode.PKCS7)
        {
            var ivBytes = string.IsNullOrEmpty(iv) == true ? GenerateIV(key, 16) :  Convert.FromBase64String(iv);
            var encryptedBytes = Convert.FromBase64String(encryptedData);
            var keyBytes = PadKey(key, keyLength / 8);

            using (var aes = Aes.Create())
            {
                aes.Key = keyBytes;
                aes.IV = ivBytes;
                aes.Mode = mode;
                aes.Padding = padding;

                using (var decryptor = aes.CreateDecryptor())
                {
                    var decryptedData = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);
                    return Encoding.UTF8.GetString(decryptedData);
                }
            }
        }

        public static string Sha(string message, string algorithm = "SHA-1")
        {
            string result = string.Empty;
            HashAlgorithm? hashAlgorithm = null;
            switch (algorithm)
            {
                case "SHA-1":
                    hashAlgorithm = SHA1.Create();
                    break;
                case "SHA-256":
                    hashAlgorithm = SHA256.Create();
                    break;
                case "SHA-384":
                    hashAlgorithm = SHA384.Create();
                    break;
                case "SHA-512":
                    hashAlgorithm = SHA512.Create();
                    break;
            }

            if (hashAlgorithm != null)
            {
                var data = Encoding.UTF8.GetBytes(message);
                var hash = hashAlgorithm.ComputeHash(data);
                result = BitConverter.ToString(hash).Replace("-", "").ToLower();
            }

            return result;
        }
    }
}
