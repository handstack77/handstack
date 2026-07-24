using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;

using Newtonsoft.Json;

using wwwroot.Entity;

namespace wwwroot.Extensions
{
    public class SharedFileServingMiddleware
    {
        public const string ManifestRequestPath = "/shared-files/manifest";

        private readonly RequestDelegate next;
        private static readonly FileExtensionContentTypeProvider contentTypeProvider = new FileExtensionContentTypeProvider();

        public SharedFileServingMiddleware(RequestDelegate next)
        {
            this.next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestPath = context.Request.Path.Value;
            if (string.IsNullOrWhiteSpace(requestPath) == false)
            {
                if (string.Equals(requestPath, ManifestRequestPath, StringComparison.OrdinalIgnoreCase) == true)
                {
                    var manifest = ModuleConfiguration.SharedFiles.Select(p => new { requestPath = p.RequestPath }).ToList<object>();
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync(JsonConvert.SerializeObject(manifest));
                    return;
                }

                var sharedFile = ModuleConfiguration.SharedFiles
                    .FirstOrDefault(p => string.Equals(p.RequestPath, requestPath, StringComparison.OrdinalIgnoreCase));
                if (sharedFile != null && File.Exists(sharedFile.HostFilePath) == true)
                {
                    if (contentTypeProvider.TryGetContentType(sharedFile.HostFilePath, out var contentType) == false)
                    {
                        contentType = "application/octet-stream";
                    }

                    context.Response.ContentType = contentType;
                    await context.Response.SendFileAsync(sharedFile.HostFilePath);
                    return;
                }
            }

            await next(context);
        }
    }
}
