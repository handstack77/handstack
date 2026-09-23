using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace HandStack.Web.Extensions
{
    public class CaseInsensitiveStaticFileMiddleware : IDisposable
    {
        private static readonly TimeSpan cacheLifetime = TimeSpan.FromMinutes(10);
        private readonly RequestDelegate next;
        private readonly IFileProvider? fileProvider;
        private readonly MemoryCache? pathCache;
        private readonly object cacheLock = new object();
        private readonly string directoryPath;
        private readonly CancellationTokenRegistration applicationStoppedRegistration;
        private int disposed;

        [ActivatorUtilitiesConstructor]
        public CaseInsensitiveStaticFileMiddleware(RequestDelegate next, string directoryPath, IHostApplicationLifetime applicationLifetime)
            : this(next, directoryPath)
        {
            applicationStoppedRegistration = applicationLifetime.ApplicationStopped.Register(
                static state => ((CaseInsensitiveStaticFileMiddleware)state!).Dispose(), this);
        }

        public CaseInsensitiveStaticFileMiddleware(RequestDelegate next, string directoryPath)
        {
            this.next = next;
            if (string.IsNullOrWhiteSpace(directoryPath))
            {
                directoryPath = GlobalConfiguration.WebRootPath;
            }

            this.directoryPath = directoryPath;
            lock (GlobalConfiguration.PhysicalFileProviders)
            {
                if (GlobalConfiguration.PhysicalFileProviders.Contains(directoryPath) == false)
                {
                    fileProvider = new PhysicalFileProvider(directoryPath);
                    pathCache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 4096 });
                    GlobalConfiguration.PhysicalFileProviders.Add(directoryPath);
                }
            }
        }

        public Task InvokeAsync(HttpContext context)
        {
            var request = context.Request;
            var path = request.Path.Value;
            if (fileProvider != null && Volatile.Read(ref disposed) == 0 &&
                (HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method)) &&
                context.GetEndpoint()?.RequestDelegate == null &&
                string.IsNullOrEmpty(path) == false && path.EndsWith('/') == false &&
                IsApiPath(path) == false)
            {
                var actualPath = GetActualPath(path);
                if (actualPath != null)
                {
                    request.Path = actualPath;
                }
            }

            return next(context);
        }

        private static bool IsApiPath(string path)
        {
            return path.IndexOf("/api/", StringComparison.OrdinalIgnoreCase) >= 0 ||
                path.EndsWith("/api", StringComparison.OrdinalIgnoreCase);
        }

        private string? GetActualPath(string path)
        {
            if (pathCache!.TryGetValue(path, out string? actualPath))
            {
                return actualPath;
            }

            lock (cacheLock)
            {
                if (pathCache.TryGetValue(path, out actualPath))
                {
                    return actualPath;
                }

                using var entry = pathCache.CreateEntry(path);
                entry.Size = 1;
                entry.AbsoluteExpirationRelativeToNow = cacheLifetime;
                entry.AddExpirationToken(fileProvider!.Watch("**/*"));

                var directory = Path.GetDirectoryName(path) ?? string.Empty;
                var fileName = Path.GetFileName(path);
                foreach (var file in fileProvider.GetDirectoryContents(directory))
                {
                    if (file.Name.Equals(fileName, StringComparison.OrdinalIgnoreCase))
                    {
                        actualPath = Path.Join(directory, file.Name).Replace('\\', '/');
                        break;
                    }
                }

                entry.Value = actualPath;
                return actualPath;
            }
        }

        public void Dispose()
        {
            if (Interlocked.Exchange(ref disposed, 1) == 0)
            {
                applicationStoppedRegistration.Dispose();
                pathCache?.Dispose();
                (fileProvider as IDisposable)?.Dispose();
                if (fileProvider != null)
                {
                    lock (GlobalConfiguration.PhysicalFileProviders)
                    {
                        GlobalConfiguration.PhysicalFileProviders.Remove(directoryPath);
                    }
                }
            }
        }
    }
}

