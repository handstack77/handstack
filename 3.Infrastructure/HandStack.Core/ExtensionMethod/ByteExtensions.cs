using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace HandStack.Core.ExtensionMethod
{
    public static class ByteExtensions
    {
        public static byte[] Combine(params byte[][] @this)
        {
            var result = new byte[@this.Sum(a => a.Length)];
            var offset = 0;
            foreach (var array in @this)
            {
                Buffer.BlockCopy(array, 0, result, offset, array.Length);
                offset += array.Length;
            }
            return result;
        }

        public static byte[] Combine(this byte[] @this, byte[] bind)
        {
            var result = new byte[@this.Length + bind.Length];
            Buffer.BlockCopy(@this, 0, result, 0, @this.Length);
            Buffer.BlockCopy(bind, 0, result, @this.Length, bind.Length);
            return result;
        }

        public static int Find(this byte[] @this, byte[] search, int startIndex = 0)
        {
            var result = -1;
            var matchIndex = 0;

            for (var i = startIndex; i < @this.Length; i++)
            {
                if (@this[i] == search[matchIndex])
                {
                    if (matchIndex == (search.Length - 1))
                    {
                        result = i - matchIndex;
                        break;
                    }
                    matchIndex++;
                }
                else if (@this[i] == search[0])
                {
                    matchIndex = 1;
                }
                else
                {
                    matchIndex = 0;
                }
            }

            return result;
        }

        public static byte[]? Replace(this byte[] @this, byte[] search, byte[] replace)
        {
            byte[]? result = null;
            var index = Find(@this, search);

            if (index >= 0)
            {
                result = new byte[@this.Length - search.Length + replace.Length];

                Buffer.BlockCopy(@this, 0, result, 0, index);
                Buffer.BlockCopy(replace, 0, result, index, replace.Length);
                Buffer.BlockCopy(@this, index + search.Length, result, index + replace.Length, @this.Length - (index + search.Length));
            }

            return result;
        }

        public static string ToString(this byte[] @this, Encoding encoding)
        {
            return encoding.GetString(@this);
        }

        public static string ToHex(this byte[] @this)
        {
            var sb = new StringBuilder();
            for (var i = 0; i < @this.Length; ++i)
            {
                sb.Append(@this[i].ToString("x2"));
            }
            return sb.ToString();
        }

        public static string ToHex(this byte @this)
        {
            return @this.ToString("x2");
        }


        public static bool AreEqual(this byte[] @this, byte[] target)
        {
            if (@this == null || target == null)
            {
                return false;
            }

            if (ReferenceEquals(@this, target))
            {
                return true;
            }

            if (@this.Length != target.Length)
            {
                return false;
            }

            for (var i = 0; i < @this.Length; i++)
            {
                if (@this[i] != target[i])
                {
                    return false;
                }
            }

            return true;
        }

        public static string ToBase64String(this byte[] @this)
        {
            return Convert.ToBase64String(@this);
        }

        public static string ToBase64String(this byte[] @this, Base64FormattingOptions options)
        {
            return Convert.ToBase64String(@this, options);
        }

        public static string ToBase64String(this byte[] @this, int offset, int length)
        {
            return Convert.ToBase64String(@this, offset, length);
        }

        public static string ToBase64String(this byte[] @this, int offset, int length, Base64FormattingOptions options)
        {
            return Convert.ToBase64String(@this, offset, length, options);
        }

        public static MemoryStream ToMemoryStream(this byte[] @this)
        {
            return new MemoryStream(@this);
        }

        public static string EncryptAES(this byte[] @this, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var encrypt = aes.CreateEncryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, encrypt, CryptoStreamMode.Write))
            {
                cs.Write(@this, 0, @this.Length);
            }

            return Convert.ToBase64String(ms.ToArray());
        }

        public static string DecryptAES(this byte[] @this, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var decrypt = aes.CreateDecryptor();
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, decrypt, CryptoStreamMode.Write))
            {
                cs.Write(@this, 0, @this.Length);
            }

            return Encoding.UTF8.GetString(ms.ToArray());
        }

        public static byte[] DecryptAESBytes(this byte[] @this, string key, int keySize = 256, int blockSize = 128, CipherMode cipherMode = CipherMode.CBC, PaddingMode paddingMode = PaddingMode.PKCS7, int ivLength = 16)
        {
            var aes = Aes.Create();
            aes.KeySize = keySize;
            aes.BlockSize = blockSize;
            aes.Mode = cipherMode;
            aes.Padding = paddingMode;
            aes.Key = Encoding.UTF8.GetBytes(key);
            aes.IV = new byte[ivLength];

            var decrypt = aes.CreateDecryptor();
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, decrypt, CryptoStreamMode.Write))
            {
                cs.Write(@this, 0, @this.Length);
            }

            return ms.ToArray();
        }
    }
}
