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
            if (string.IsNullOrWhiteSpace(directoryPath))
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
                if (!string.IsNullOrWhiteSpace(path))
                {
                    var directoryContents = fileProvider.GetDirectoryContents(Path.GetDirectoryName(path).ToStringSafe());
                    var file = directoryContents?.FirstOrDefault(f => f.Name.Equals(Path.GetFileName(path), StringComparison.OrdinalIgnoreCase));
                    if (file != null)
                    {
                        context.Request.Path = Path.Join(Path.GetDirectoryName(path).ToStringSafe(), file.Name).Replace('\\', '/');
                    }
                }
            }

            await next(context);
        }
    }
}

