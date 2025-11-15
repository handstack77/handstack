using System.IO;
using System.Security.Cryptography;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Core.Helpers
{
    public static class FileHelper
    {
        public static void CopyFolder(string sourceFolder, string destnationFolder)
        {
            if (Directory.Exists(destnationFolder) == false)
            {
                Directory.CreateDirectory(destnationFolder);
            }

            var files = Directory.GetFiles(sourceFolder);
            var folders = Directory.GetDirectories(sourceFolder);

            foreach (var file in files)
            {
                var name = Path.GetFileName(file);
                var dest = PathExtensions.Combine(destnationFolder, name);
                File.Copy(file, dest);
            }

            foreach (var folder in folders)
            {
                var name = Path.GetFileName(folder);
                var dest = PathExtensions.Combine(destnationFolder, name);
                CopyFolder(folder, dest);
            }
        }

        public static void EncryptFile(string filePath, string cryptographyKey = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        {
            var tempFileName = Path.GetRandomFileName();
            var outputFilePath = Path.Combine(Path.GetTempPath(), tempFileName);

            byte[] salt = RandomNumberGenerator.GetBytes(16);

            int iterations = 100_000;

            byte[] key = Rfc2898DeriveBytes.Pbkdf2(
                cryptographyKey,
                salt,
                iterations,
                HashAlgorithmName.SHA512,
                32
            );
            byte[] iv = Rfc2898DeriveBytes.Pbkdf2(
                cryptographyKey,
                salt,
                iterations,
                HashAlgorithmName.SHA512,
                16
            );

            using (var encryptor = Aes.Create())
            {
                encryptor.Key = key;
                encryptor.IV = iv;
                using var fsOutput = new FileStream(outputFilePath, FileMode.Create);
                fsOutput.Write(salt, 0, salt.Length);
                using var cs = new CryptoStream(fsOutput, encryptor.CreateEncryptor(), CryptoStreamMode.Write);
                using var fsInput = new FileStream(filePath, FileMode.Open);
                int data;
                while ((data = fsInput.ReadByte()) != -1)
                {
                    cs.WriteByte((byte)data);
                }
            }

            if (File.Exists(filePath) == true)
            {
                File.Delete(filePath);
            }

            File.Move(outputFilePath, filePath);

            if (File.Exists(outputFilePath) == true)
            {
                File.Delete(outputFilePath);
            }
        }

        public static void DecryptFile(string filePath, string cryptographyKey = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        {
            var tempFileName = Path.GetRandomFileName();
            var outputFilePath = Path.Combine(Path.GetTempPath(), tempFileName);

            int saltLength = 16;
            int iterations = 100_000;

            using (var fsInput = new FileStream(filePath, FileMode.Open))
            {
                byte[] salt = new byte[saltLength];
                int bytesRead = 0;
                while (bytesRead < saltLength)
                {
                    int read = fsInput.Read(salt, bytesRead, saltLength - bytesRead);
                    if (read == 0)
                    {
                        throw new EndOfStreamException("파일에서 salt를 모두 읽을 수 없습니다.");
                    }
                    bytesRead += read;
                }

                byte[] key = Rfc2898DeriveBytes.Pbkdf2(
                    cryptographyKey,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA512,
                    32
                );
                byte[] iv = Rfc2898DeriveBytes.Pbkdf2(
                    cryptographyKey,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA512,
                    16
                );

                using var encryptor = Aes.Create();
                encryptor.Key = key;
                encryptor.IV = iv;
                using var cs = new CryptoStream(fsInput, encryptor.CreateDecryptor(), CryptoStreamMode.Read);
                using var fsOutput = new FileStream(outputFilePath, FileMode.Create);
                int data;
                while ((data = cs.ReadByte()) != -1)
                {
                    fsOutput.WriteByte((byte)data);
                }
            }

            if (File.Exists(filePath) == true)
            {
                File.Delete(filePath);
            }

            File.Move(outputFilePath, filePath);

            if (File.Exists(outputFilePath) == true)
            {
                File.Delete(outputFilePath);
            }
        }
    }
}
