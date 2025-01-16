using System.IO;

namespace HandStack.Core.ExtensionMethod
{
    public static class PathExtensions
    {
        public static string Combine(string path1, string path2, char separator = '/')
        {
            string combinedPath = Path.Combine(path1, path2);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Combine(string path1, string path2, string path3, char separator = '/')
        {
            string combinedPath = Path.Combine(path1, path2, path3);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, char separator = '/')
        {
            string combinedPath = Path.Combine(path1, path2, path3, path4);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, char separator = '/')
        {
            string combinedPath = Path.Combine(path1, path2, path3, path4, path5);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Combine(string[] paths, char separator = '/')
        {
            string combinedPath = Path.Combine(paths);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Join(string path1, string path2, char separator = '/')
        {
            string combinedPath = Path.Join(path1, path2);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Join(string path1, string path2, string path3, char separator = '/')
        {
            string combinedPath = Path.Join(path1, path2, path3);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, char separator = '/')
        {
            string combinedPath = Path.Join(path1, path2, path3, path4);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, char separator = '/')
        {
            string combinedPath = Path.Join(path1, path2, path3, path4, path5);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }

        public static string Join(string[] paths, char separator = '/')
        {
            string combinedPath = Path.Join(paths);
            return combinedPath.Replace('\\', separator).Replace('/', separator);
        }
    }
}
