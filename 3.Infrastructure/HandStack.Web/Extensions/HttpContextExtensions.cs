using System;
using System.IO;

using HandStack.Core.ExtensionMethod;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace HandStack.Web.Extensions
{
    public static class HttpContextExtensions
    {
        static string? WebRootPath { get; set; }

        static string? ContentRootPath { get; set; }

        public static string MapPath(this HttpContext context, string? relativePath = null, IWebHostEnvironment? host = null, string? basePath = null, bool useAppBasePath = false)
        {
            if (string.IsNullOrEmpty(relativePath) == true)
            {
                relativePath = "/";
            }

            if (relativePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase) == true || relativePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) == true)
            {
                return relativePath;
            }

            if (string.IsNullOrEmpty(basePath))
            {
                if (string.IsNullOrEmpty(WebRootPath) == true || string.IsNullOrEmpty(ContentRootPath) == true)
                {
                    host ??= context.RequestServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
                    WebRootPath = (host?.WebRootPath).ToStringSafe();
                    ContentRootPath = (host?.ContentRootPath).ToStringSafe();
                }
                basePath = useAppBasePath ? ContentRootPath.TrimEnd('/', '\\') : WebRootPath;
            }

            relativePath = relativePath.TrimStart('~', '/', '\\');

            var path = PathExtensions.Join(basePath, relativePath);
            var slash = Path.DirectorySeparatorChar.ToString();
            return path.Replace("/", slash)
                .Replace("\\", slash)
                .Replace(slash + slash, slash);
        }
    }
}
