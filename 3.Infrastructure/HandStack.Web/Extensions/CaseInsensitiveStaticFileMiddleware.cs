using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

namespace HandStack.Web.Extensions
{
    public class CaseInsensitiveStaticFileMiddleware
    {
        private readonly RequestDelegate next;
        private readonly IFileProvider? fileProvider = null;

        public CaseInsensitiveStaticFileMiddleware(RequestDelegate next, string directoryPath)
        {
            this.next = next;
            if (string.IsNullOrEmpty(directoryPath) == true)
            {
                directoryPath = GlobalConfiguration.WebRootPath;
            }

            if (GlobalConfiguration.PhysicalFileProviders.Contains(directoryPath) == false)
            {
                GlobalConfiguration.PhysicalFileProviders.Add(directoryPath);
                fileProvider = new PhysicalFileProvider(directoryPath);
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (fileProvider != null)
            {
                var path = context.Request.Path.Value;
                if (string.IsNullOrEmpty(path) == false)
                {
                    var directoryContents = fileProvider.GetDirectoryContents(Path.GetDirectoryName(path).ToStringSafe());
                    var file = directoryContents?.FirstOrDefault(f => f.Name.Equals(Path.GetFileName(path), StringComparison.OrdinalIgnoreCase));
                    if (file != null)
                    {
                        context.Request.Path = PathExtensions.Combine(Path.GetDirectoryName(path).ToStringSafe(), file.Name);
                    }
                }
            }

            await next(context);
        }
    }
}
