using System.Collections.Generic;
using System.IO;

using HandStack.Core.ExtensionMethod;

namespace repository.Extensions
{
    public static class FileSystemExtensions
    {
        public static string GetPathRoot(string path)
        {
            var pathRoot = Path.GetPathRoot(path);
            return pathRoot == null ? path : pathRoot;
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

        public static string GetDirectoryName(string path)
        {
            var directoryName = Path.GetDirectoryName(path);
            return directoryName == null ? path : directoryName;
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
    }
}
