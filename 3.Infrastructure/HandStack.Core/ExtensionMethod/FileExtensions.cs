using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;

namespace HandStack.Core.ExtensionMethod
{
    public static class FileExtensions
    {
        public static string? GetPathRoot(string? path)
        {
            return Path.GetPathRoot(path);
        }

        public static string GetFullPath(string path)
        {
            return Path.GetFullPath(path);
        }

        public static string PathCombine(params string[] paths)
        {
            return PathExtensions.Combine(paths);
        }

        public static string GetFileName(string filePath)
        {
            return Path.GetFileName(filePath);
        }

        public static string GetFileNameWithoutExtension(string filePath)
        {
            return Path.GetFileNameWithoutExtension(filePath);
        }

        public static bool FileExists(string path)
        {
            return File.Exists(path);
        }

        public static FileStream FileCreate(string path)
        {
            return File.Create(path);
        }

        public static StreamWriter FileAppendText(string text)
        {
            return File.AppendText(text);
        }

        public static void CopyFile(string filePath, string newFilePath, bool overwrite = false)
        {
            File.Copy(filePath, newFilePath, overwrite);
        }

        public static void MoveFile(string filePath, string newFilePath)
        {
            File.Move(filePath, newFilePath);
        }

        public static void DeleteFile(string filePath)
        {
            File.Delete(filePath);
        }

        public static IEnumerable<string> GetFiles(string path, string filter)
        {
            return Directory.EnumerateFiles(path, (filter ?? "*"));
        }

        public static IEnumerable<string> GetFiles(string path, string filter, SearchOption searchOption)
        {
            return Directory.EnumerateFiles(path, (filter ?? "*.*"), searchOption);
        }

        public static string? GetDirectoryName(string? path)
        {
            return Path.GetDirectoryName(path);
        }

        public static bool DirectoryExists(string path)
        {
            return Directory.Exists(path);
        }

        public static void DeleteDirectory(string path, bool recursive = true)
        {
            try
            {
                Directory.Delete(path, recursive);
            }
            catch (DirectoryNotFoundException)
            {
            }
        }

        public static void CreateDirectory(string path)
        {
            Directory.CreateDirectory(path);
        }

        public static IEnumerable<string> GetDirectories(string path, string filter)
        {
            return Directory.EnumerateDirectories(path, (filter ?? "*"));
        }

        public static IEnumerable<string> GetDirectories(string path, string filter, SearchOption searchOption)
        {
            return Directory.GetDirectories(path, (filter ?? "*.*"), searchOption);
        }

        /// <code>
        /// var @this = new FileInfo(@"c:\test.txt");
        /// @this.ToMD5Hash();
        /// </code>
        public static string ToMD5Hash(this FileInfo @this)
        {
            string result = "";
            if (@this != null)
            {
                if (@this.Exists == true)
                {
                    using (var md5 = MD5.Create())
                    using (var stream = File.OpenRead(@this.FullName.Replace("\\", "/")))
                    {
                        return BitConverter.ToString(md5.ComputeHash(stream)).Replace("-", string.Empty);
                    }
                }
            }

            return result;
        }

        /// <code>
        /// var @this = new FileInfo(@"c:\test.txt");
        /// @this.Rename("test2.txt");
        /// </code>
        public static FileInfo? Rename(this FileInfo @this, string newName)
        {
            if (@this != null)
            {
                string? directoryName = Path.GetDirectoryName(@this.FullName.Replace("\\", "/"));
                if (string.IsNullOrEmpty(directoryName) == false)
                {
                    var filePath = PathExtensions.Combine(directoryName, newName);
                    @this.MoveTo(filePath);
                }
            }

            return @this;
        }

        /// <code>
        /// var @this = new FileInfo(@"c:\test.txt");
        /// @this.RenameFileWithoutExtension("test3");
        /// </code>
        public static FileInfo RenameFileWithoutExtension(this FileInfo @this, string newName)
        {
            var fileName = string.Concat(newName, @this.Extension);
            @this.Rename(fileName);
            return @this;
        }

        /// <code>
        /// var @this = new FileInfo(@"c:\test.txt");
        /// @this.ChangeExtension("xml");
        /// </code>
        public static FileInfo ChangeExtension(this FileInfo @this, string newExtension)
        {
            var fileName = string.Concat(Path.GetFileNameWithoutExtension(@this.FullName.Replace("\\", "/")), newExtension);
            @this.Rename(fileName);
            return @this;
        }

        /// <code>
        /// var files = directory.GetFiles("*.txt", "*.xml");
        /// files.ChangeExtensions("tmp");
        /// </code>
        public static FileInfo[] ChangeExtensions(this FileInfo[] files, string newExtension)
        {
            files.ForEach(f => f.ChangeExtension(newExtension));
            return files;
        }

        /// <code>
        /// var files = directory.GetFiles("*.txt", "*.xml");
        /// files.Delete()
        /// </code>
        public static void Delete(this FileInfo[] files)
        {
            foreach (var @this in files)
            {
                @this.Delete();
            }
        }

        /// <code>
        /// var files = directory.GetFiles("*.txt", "*.xml");
        /// var copiedFiles = files.CopyTo(@"c:\temp\");
        /// </code>
        public static FileInfo[] CopyTo(this FileInfo[] files, string targetPath)
        {
            var copiedfiles = new List<FileInfo>();
            foreach (var @this in files)
            {
                var fileName = PathExtensions.Combine(targetPath, @this.Name);
                copiedfiles.Add(@this.CopyTo(fileName));
            }

            return copiedfiles.ToArray();
        }

        /// <code>
        /// var files = directory.GetFiles("*.txt", "*.xml");
        /// files.MoveTo(@"c:\temp\");
        /// </code>
        public static FileInfo[] MoveTo(this FileInfo[] files, string targetPath)
        {
            foreach (var @this in files)
            {
                var fileName = PathExtensions.Combine(targetPath, @this.Name);
                @this.MoveTo(fileName);
            }

            return files;
        }

        /// <code>
        /// var files = directory.GetFiles("*.txt", "*.xml");
        /// files.SetAttributes(FileAttributes.Archive);
        /// </code>
        public static void SetAttributes(this FileInfo[] files, FileAttributes attributes)
        {
            foreach (var @this in files)
            {
                @this.Attributes = attributes;
            }
        }

        /// <code>
        /// var files = directory.GetFiles("*.txt", "*.xml");
        /// files.SetAttributesAdditive(FileAttributes.Archive);
        /// </code>
        public static void SetAttributesAdditive(this FileInfo[] files, FileAttributes attributes)
        {
            foreach (var @this in files)
            {
                @this.Attributes = (@this.Attributes | attributes);
            }
        }

        public static bool IsBinary(this FileInfo file, int requiredConsecutiveNul = 1)
        {
            if (file.Exists == false)
            {
                return false;
            }

            int charsToCheck = 8000;
            char nulChar = '\0';

            int nulCount = 0;
            using (var streamReader = new StreamReader(file.FullName.Replace("\\", "/")))
            {
                for (var i = 0; i < charsToCheck; i++)
                {
                    if (streamReader.EndOfStream)
                        return false;

                    if ((char)streamReader.Read() == nulChar)
                    {
                        nulCount++;

                        if (nulCount >= requiredConsecutiveNul)
                            return true;
                    }
                    else
                    {
                        nulCount = 0;
                    }
                }
            }

            return false;
        }

        public static void ExtractZipFileToDirectory(this FileInfo @this, string destinationDirectoryName)
        {
            ZipFile.ExtractToDirectory(@this.FullName.Replace("\\", "/"), destinationDirectoryName);
        }

        public static void ExtractZipFileToDirectory(this FileInfo @this, string destinationDirectoryName, Encoding entryNameEncoding)
        {
            ZipFile.ExtractToDirectory(@this.FullName.Replace("\\", "/"), destinationDirectoryName, entryNameEncoding);
        }

        public static void ExtractZipFileToDirectory(this FileInfo @this, DirectoryInfo destinationDirectory)
        {
            ZipFile.ExtractToDirectory(@this.FullName.Replace("\\", "/"), destinationDirectory.FullName.Replace("\\", "/"));
        }

        public static void ExtractZipFileToDirectory(this FileInfo @this, DirectoryInfo destinationDirectory, Encoding entryNameEncoding)
        {
            ZipFile.ExtractToDirectory(@this.FullName.Replace("\\", "/"), destinationDirectory.FullName.Replace("\\", "/"), entryNameEncoding);
        }

        public static ZipArchive OpenReadZipFile(this FileInfo @this)
        {
            return ZipFile.OpenRead(@this.FullName.Replace("\\", "/"));
        }

        public static ZipArchive OpenZipFile(this FileInfo @this, ZipArchiveMode mode)
        {
            return ZipFile.Open(@this.FullName.Replace("\\", "/"), mode);
        }

        public static ZipArchive OpenZipFile(this FileInfo @this, ZipArchiveMode mode, Encoding entryNameEncoding)
        {
            return ZipFile.Open(@this.FullName.Replace("\\", "/"), mode, entryNameEncoding);
        }
    }
}
