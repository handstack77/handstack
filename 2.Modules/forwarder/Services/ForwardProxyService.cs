using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

using forwarder.Entity;
using forwarder.Models;

using Microsoft.Playwright;

using Serilog;

namespace forwarder.Services
{
    public class ForwardProxyService : IForwardProxyService, IAsyncDisposable
    {
        private readonly ILogger logger;
        private readonly IForwardProxySessionStore sessionStore;
        private readonly SemaphoreSlim runtimeSyncRoot = new SemaphoreSlim(1, 1);
        private readonly ConcurrentDictionary<string, BrowserSessionEntry> browserSessions = new ConcurrentDictionary<string, BrowserSessionEntry>(StringComparer.OrdinalIgnoreCase);

        private IPlaywright? playwright;
        private IBrowser? browser;

        public ForwardProxyService(ILogger logger, IForwardProxySessionStore sessionStore)
        {
            this.logger = logger;
            this.sessionStore = sessionStore;
        }


        public async Task<ForwardProxyExecution> ForwardAsync(ForwardProxyRequest request, CancellationToken cancellationToken)
        {
            return request.ClientKind == ForwardClientKind.Browser
                ? await ForwardBrowserAsync(request, cancellationToken)
                : await ForwardProgramAsync(request, cancellationToken);
        }

        private async Task<ForwardProxyExecution> ForwardBrowserAsync(ForwardProxyRequest request, CancellationToken cancellationToken)
        {
            // 브라우저 요청은 사용자 세션별 BrowserContext를 재사용해 쿠키와 저장소를 유지한다.
            var entry = browserSessions.GetOrAdd(request.Session.SessionKey, sessionKey => new BrowserSessionEntry(sessionKey));

            IBrowserContext context;
            await entry.SyncRoot.WaitAsync(cancellationToken);
            try
            {
                CancelIdleClose(entry);

                if (entry.Context == null)
                {
                    entry.Context = await CreateBrowserContextAsync(request.Session, cancellationToken);
                }

                entry.Session = request.Session;
                entry.ReferenceCount++;
                entry.LastAccessedAt = DateTime.UtcNow;
                context = entry.Context;
            }
            finally
            {
                entry.SyncRoot.Release();
            }

            try
            {
                var result = await ExecuteFetchAsync(context.APIRequest, request, cancellationToken);
                return new ForwardProxyExecution(result, () => ReleaseBrowserContextAsync(entry, request.Session));
            }
            catch
            {
                await ReleaseBrowserContextAsync(entry, request.Session);
                throw;
            }
        }

        private async Task<ForwardProxyExecution> ForwardProgramAsync(ForwardProxyRequest request, CancellationToken cancellationToken)
        {
            // 프로그램 요청은 매번 새 컨텍스트를 만들고 응답 직후 저장 후 닫는다.
            var context = await CreateBrowserContextAsync(request.Session, cancellationToken);

            try
            {
                var result = await ExecuteFetchAsync(context.APIRequest, request, cancellationToken);
                return new ForwardProxyExecution(result, () => PersistAndCloseProgramContextAsync(context, request.Session));
            }
            catch
            {
                await PersistAndCloseProgramContextAsync(context, request.Session);
                throw;
            }
        }

        private async Task<ForwardProxyResult> ExecuteFetchAsync(IAPIRequestContext apiRequest, ForwardProxyRequest request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var stopwatch = Stopwatch.StartNew();
            var fetchOptions = new APIRequestContextOptions
            {
                Method = request.Method,
                Headers = request.Headers,
                FailOnStatusCode = false,
                Timeout = request.TimeoutMS ?? ModuleConfiguration.RequestTimeoutMS,
                MaxRedirects = ModuleConfiguration.MaxRedirects
            };

            if (request.Body.Length > 0)
            {
                fetchOptions.DataByte = request.Body;
            }

            var response = await apiRequest.FetchAsync(request.TargetUrl, fetchOptions);
            var result = new ForwardProxyResult
            {
                StatusCode = response.Status,
                StatusText = response.StatusText,
                ResponseUrl = response.Url,
                Headers = new Dictionary<string, string>(response.Headers, StringComparer.OrdinalIgnoreCase)
            };

            if (string.Equals(request.Method, "HEAD", StringComparison.OrdinalIgnoreCase) == false)
            {
                result.Body = await response.BodyAsync();
            }

            stopwatch.Stop();
            logger.Information(
                "[{LogCategory}] " + $"userID: {request.UserID}, userNo: {request.Session.UserNo}, clientKind: {request.ClientKind}, method: {request.Method}, targetUrl: {request.TargetUrl}, statusCode: {result.StatusCode}, elapsedMS: {stopwatch.ElapsedMilliseconds}",
                "PlaywrightForwardProxyService/ExecuteFetchAsync");

            return result;
        }

        private async Task<IBrowserContext> CreateBrowserContextAsync(ForwardSessionDescriptor session, CancellationToken cancellationToken)
        {
            var runtimeBrowser = await EnsureBrowserAsync(cancellationToken);
            var storageState = await sessionStore.LoadStorageStateAsync(session, cancellationToken);

            var contextOptions = new BrowserNewContextOptions
            {
                IgnoreHTTPSErrors = ModuleConfiguration.IgnoreHTTPSErrors
            };

            if (string.IsNullOrWhiteSpace(storageState) == false)
            {
                contextOptions.StorageState = storageState;
            }

            if (ModuleConfiguration.UseProxy == true)
            {
                if (string.IsNullOrWhiteSpace(ModuleConfiguration.ProxyServer) == true)
                {
                    throw new InvalidOperationException("forwarder module.json의 ProxyServer 확인 필요");
                }

                contextOptions.Proxy = new Proxy
                {
                    Server = ModuleConfiguration.ProxyServer,
                    Username = string.IsNullOrWhiteSpace(ModuleConfiguration.ProxyUsername) == true ? null : ModuleConfiguration.ProxyUsername,
                    Password = string.IsNullOrWhiteSpace(ModuleConfiguration.ProxyPassword) == true ? null : ModuleConfiguration.ProxyPassword,
                    Bypass = string.IsNullOrWhiteSpace(ModuleConfiguration.ProxyBypass) == true ? null : ModuleConfiguration.ProxyBypass
                };
            }

            var context = await runtimeBrowser.NewContextAsync(contextOptions);
            context.SetDefaultTimeout(ModuleConfiguration.RequestTimeoutMS);
            context.SetDefaultNavigationTimeout(ModuleConfiguration.RequestTimeoutMS);
            return context;
        }

        private async Task<IBrowser> EnsureBrowserAsync(CancellationToken cancellationToken)
        {
            if (browser != null)
            {
                return browser;
            }

            await runtimeSyncRoot.WaitAsync(cancellationToken);
            try
            {
                if (playwright == null)
                {
                    playwright = await Playwright.CreateAsync();
                }

                if (browser == null)
                {
                    browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
                    {
                        Headless = true
                    });
                }

                return browser;
            }
            finally
            {
                runtimeSyncRoot.Release();
            }
        }

        private async ValueTask ReleaseBrowserContextAsync(BrowserSessionEntry entry, ForwardSessionDescriptor session)
        {
            await entry.SyncRoot.WaitAsync();
            try
            {
                if (entry.Context != null)
                {
                    var storageState = await entry.Context.StorageStateAsync(new BrowserContextStorageStateOptions
                    {
                        IndexedDB = true
                    });
                    await sessionStore.SaveStorageStateAsync(session, storageState, ForwardClientKind.Browser, CancellationToken.None);
                }

                if (entry.ReferenceCount > 0)
                {
                    entry.ReferenceCount--;
                }

                entry.LastAccessedAt = DateTime.UtcNow;
                if (entry.ReferenceCount == 0)
                {
                    CancelIdleClose(entry);

                    var idleCts = new CancellationTokenSource();
                    entry.IdleCancellationTokenSource = idleCts;
                    _ = Task.Run(() => CloseBrowserContextWhenIdleAsync(entry, session, idleCts.Token));
                }
            }
            finally
            {
                entry.SyncRoot.Release();
            }
        }

        private async ValueTask PersistAndCloseProgramContextAsync(IBrowserContext context, ForwardSessionDescriptor session)
        {
            try
            {
                var storageState = await context.StorageStateAsync(new BrowserContextStorageStateOptions
                {
                    IndexedDB = true
                });
                await sessionStore.SaveStorageStateAsync(session, storageState, ForwardClientKind.Program, CancellationToken.None);
            }
            finally
            {
                await context.CloseAsync();
            }
        }

        private async Task CloseBrowserContextWhenIdleAsync(BrowserSessionEntry entry, ForwardSessionDescriptor session, CancellationToken cancellationToken)
        {
            try
            {
                // 브라우저 연결이 모두 정리된 뒤 유휴 시간이 지나면 컨텍스트를 닫는다.
                if (ModuleConfiguration.BrowserIdleTimeoutSecond > 0)
                {
                    await Task.Delay(TimeSpan.FromSeconds(ModuleConfiguration.BrowserIdleTimeoutSecond), cancellationToken);
                }
                else
                {
                    cancellationToken.ThrowIfCancellationRequested();
                }
            }
            catch (OperationCanceledException)
            {
                return;
            }

            IBrowserContext? contextToClose = null;

            await entry.SyncRoot.WaitAsync();
            try
            {
                if (entry.ReferenceCount != 0 || entry.Context == null)
                {
                    return;
                }

                if (entry.IdleCancellationTokenSource == null || entry.IdleCancellationTokenSource.Token != cancellationToken)
                {
                    return;
                }

                var storageState = await entry.Context.StorageStateAsync(new BrowserContextStorageStateOptions
                {
                    IndexedDB = true
                });
                await sessionStore.SaveStorageStateAsync(session, storageState, ForwardClientKind.Browser, CancellationToken.None);

                contextToClose = entry.Context;
                entry.Context = null;

                entry.IdleCancellationTokenSource.Dispose();
                entry.IdleCancellationTokenSource = null;
                browserSessions.TryRemove(entry.SessionKey, out _);
            }
            finally
            {
                entry.SyncRoot.Release();
            }

            if (contextToClose != null)
            {
                await contextToClose.CloseAsync();
            }
        }

        private static void CancelIdleClose(BrowserSessionEntry entry)
        {
            if (entry.IdleCancellationTokenSource == null)
            {
                return;
            }

            entry.IdleCancellationTokenSource.Cancel();
            entry.IdleCancellationTokenSource.Dispose();
            entry.IdleCancellationTokenSource = null;
        }

        public async ValueTask DisposeAsync()
        {
            foreach (var item in browserSessions)
            {
                var entry = item.Value;
                await entry.SyncRoot.WaitAsync();
                try
                {
                    CancelIdleClose(entry);
                    if (entry.Context != null)
                    {
                        if (entry.Session != null)
                        {
                            var storageState = await entry.Context.StorageStateAsync(new BrowserContextStorageStateOptions
                            {
                                IndexedDB = true
                            });
                            await sessionStore.SaveStorageStateAsync(entry.Session, storageState, ForwardClientKind.Browser, CancellationToken.None);
                        }

                        await entry.Context.CloseAsync();
                        entry.Context = null;
                    }
                }
                finally
                {
                    entry.SyncRoot.Release();
                    entry.SyncRoot.Dispose();
                }
            }

            browserSessions.Clear();

            if (browser != null)
            {
                await browser.CloseAsync();
                browser = null;
            }

            playwright?.Dispose();
            playwright = null;

            runtimeSyncRoot.Dispose();
        }

        private sealed class BrowserSessionEntry
        {
            public BrowserSessionEntry(string sessionKey)
            {
                SessionKey = sessionKey;
            }

            public string SessionKey { get; }

            public SemaphoreSlim SyncRoot { get; } = new SemaphoreSlim(1, 1);

            public ForwardSessionDescriptor? Session { get; set; }

            public IBrowserContext? Context { get; set; }

            public int ReferenceCount { get; set; }

            public DateTime LastAccessedAt { get; set; }

            public CancellationTokenSource? IdleCancellationTokenSource { get; set; }
        }
    }
}
