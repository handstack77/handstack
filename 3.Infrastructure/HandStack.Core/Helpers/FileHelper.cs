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
            var outputFilePath = Path.GetTempFileName();
            using (var encryptor = Aes.Create())
            {
#pragma warning disable SYSLIB0041
                using var pdb = new Rfc2898DeriveBytes(cryptographyKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
#pragma warning restore SYSLIB0041
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using var fsOutput = new FileStream(outputFilePath, FileMode.Create);
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
            var outputFilePath = Path.GetTempFileName();
            using (var encryptor = Aes.Create())
            {
#pragma warning disable SYSLIB0041
                var pdb = new Rfc2898DeriveBytes(cryptographyKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
#pragma warning restore SYSLIB0041
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using var fsInput = new FileStream(filePath, FileMode.Open);
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
