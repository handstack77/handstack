using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace HandStack.Core.Helpers
{
    public static class AesCryptoHelper
    {
        public static string Encrypt(string plainText, string iv = "", string key = "0123456789abcdef0123456789abcdef", int keySize = 256, int blockSize = 128, CipherMode mode = CipherMode.CBC, PaddingMode padding = PaddingMode.PKCS7)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = mode;
            aes.Padding = padding;
            aes.Key = Encoding.UTF8.GetBytes(key);

            if (string.IsNullOrEmpty(iv) == true)
            {
                aes.IV = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
            }
            else
            {
                aes.IV = Encoding.UTF8.GetBytes(iv);
            }

            var encrypt = aes.CreateEncryptor(aes.Key, aes.IV);
            byte[] buffer = new byte[0];
            using (var ms = new MemoryStream())
            {
                using (var cs = new CryptoStream(ms, encrypt, CryptoStreamMode.Write))
                {
                    byte[] byteValue = Encoding.UTF8.GetBytes(plainText);
                    cs.Write(byteValue, 0, byteValue.Length);
                }

                buffer = ms.ToArray();
            }

            return Convert.ToBase64String(buffer);
        }

        public static string Decrypt(string cipherText, string? iv = "", string key = "0123456789abcdef0123456789abcdef", int keySize = 256, int blockSize = 128, CipherMode mode = CipherMode.CBC, PaddingMode padding = PaddingMode.PKCS7)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = mode;
            aes.Padding = padding;
            aes.Key = Encoding.UTF8.GetBytes(key);

            if (string.IsNullOrEmpty(iv) == true)
            {
                aes.IV = new byte[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
            }
            else
            {
                aes.IV = Encoding.UTF8.GetBytes(iv);
            }

            var decrypt = aes.CreateDecryptor();
            byte[] buffer = new byte[0];
            using (var ms = new MemoryStream())
            {
                using (var cs = new CryptoStream(ms, decrypt, CryptoStreamMode.Write))
                {
                    byte[] byteValue = Convert.FromBase64String(cipherText);
                    cs.Write(byteValue, 0, byteValue.Length);
                }

                buffer = ms.ToArray();
            }

            return Encoding.UTF8.GetString(buffer);
        }
    }
}
