using System.IO;

namespace HandStack.Core.ExtensionMethod
{
    public static class PathExtensions
    {
        public static string Combine(string path1, char separator = '/')
        {
            var combinedPath = Path.Combine(path1);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4, path5);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, string path6, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4, path5, path6);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, string path6, string path7, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4, path5, path6, path7);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, string path6, string path7, string path8, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4, path5, path6, path7, path8);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, string path6, string path7, string path8, string path9, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4, path5, path6, path7, path8, path9);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string path1, string path2, string path3, string path4, string path5, string path6, string path7, string path8, string path9, string path10, char separator = '/')
        {
            var combinedPath = Path.Combine(path1, path2, path3, path4, path5, path6, path7, path8, path9, path10);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Combine(string[] paths, char separator = '/')
        {
            var combinedPath = Path.Combine(paths);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, char separator = '/')
        {
            var combinedPath = Path.Join(path1);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4, path5);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, string path6, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4, path5, path6);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, string path6, string path7, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4, path5, path6, path7);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, string path6, string path7, string path8, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4, path5, path6, path7, path8);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, string path6, string path7, string path8, string path9, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4, path5, path6, path7, path8, path9);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string path1, string path2, string path3, string path4, string path5, string path6, string path7, string path8, string path9, string path10, char separator = '/')
        {
            var combinedPath = Path.Join(path1, path2, path3, path4, path5, path6, path7, path8, path9, path10);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string Join(string[] paths, char separator = '/')
        {
            var combinedPath = Path.Join(paths);
            return GetFullPath(combinedPath.Replace('\\', separator).Replace('/', separator), separator);
        }

        public static string GetFullPath(string path, char separator = '/')
        {
            var fullPath = Path.GetFullPath(path);
            return fullPath.Replace('\\', separator).Replace('/', separator);
        }
    }
}
