using System.IO;
using System.Security.Cryptography;

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

            string[] files = Directory.GetFiles(sourceFolder);
            string[] folders = Directory.GetDirectories(sourceFolder);

            foreach (string file in files)
            {
                string name = Path.GetFileName(file);
                string dest = Path.Combine(destnationFolder, name);
                File.Copy(file, dest);
            }

            foreach (string folder in folders)
            {
                string name = Path.GetFileName(folder);
                string dest = Path.Combine(destnationFolder, name);
                CopyFolder(folder, dest);
            }
        }

        public static void EncryptFile(string filePath, string cryptographyKey = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        {
            string outputFilePath = Path.GetTempFileName();
            using (Aes encryptor = Aes.Create())
            {
#pragma warning disable SYSLIB0041
                using Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(cryptographyKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
#pragma warning restore SYSLIB0041
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using (FileStream fsOutput = new FileStream(outputFilePath, FileMode.Create))
                using (CryptoStream cs = new CryptoStream(fsOutput, encryptor.CreateEncryptor(), CryptoStreamMode.Write))
                using (FileStream fsInput = new FileStream(filePath, FileMode.Open))
                {
                    int data;
                    while ((data = fsInput.ReadByte()) != -1)
                    {
                        cs.WriteByte((byte)data);
                    }
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
            string outputFilePath = Path.GetTempFileName();
            using (Aes encryptor = Aes.Create())
            {
#pragma warning disable SYSLIB0041
                Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(cryptographyKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
#pragma warning restore SYSLIB0041
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using (FileStream fsInput = new FileStream(filePath, FileMode.Open))
                using (CryptoStream cs = new CryptoStream(fsInput, encryptor.CreateDecryptor(), CryptoStreamMode.Read))
                using (FileStream fsOutput = new FileStream(outputFilePath, FileMode.Create))
                {
                    int data;
                    while ((data = cs.ReadByte()) != -1)
                    {
                        fsOutput.WriteByte((byte)data);
                    }
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
