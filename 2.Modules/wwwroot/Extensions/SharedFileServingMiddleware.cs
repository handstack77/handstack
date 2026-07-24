using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;

using wwwroot.Entity;

namespace wwwroot.Extensions
{
    // module.json ModuleConfig.SharedFileConfigPath가 가리키는 "공통 파일 관리" 정보 파일을 기준으로,
    // wwwroot 정적 파일 경로와 무관하게 RequestPath 요청을 HostFilePath에서 직접 서빙한다.
    public class SharedFileServingMiddleware
    {
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
