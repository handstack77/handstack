using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using forwarder.Entity;
using forwarder.Services;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json;

using Serilog;

namespace forwarder
{
    public class ModuleInitializer : IModuleInitializer
    {
        public string? ModuleID;

        public ModuleInitializer()
        {
            ModuleID = typeof(ModuleInitializer).Assembly.GetName().Name;
        }

        public void ConfigureServices(IServiceCollection services, IWebHostEnvironment environment, IConfiguration configuration)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module == null)
            {
                return;
            }

            var moduleSettingFilePath = module.ModuleSettingFilePath;
            if (File.Exists(moduleSettingFilePath) == false)
            {
                var message = $"module.json 파일 확인 필요: {moduleSettingFilePath}";
                Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleID} ModuleInitializer/ConfigureServices");
                throw new FileNotFoundException(message);
            }

            var configurationText = File.ReadAllText(moduleSettingFilePath);
            var moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);
            if (moduleConfigJson == null)
            {
                var message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleSettingFilePath}";
                Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleID} ModuleInitializer/ConfigureServices");
                throw new FileLoadException(message);
            }

            var moduleConfig = moduleConfigJson.ModuleConfig;
            ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
            ModuleConfiguration.Version = moduleConfigJson.Version;
            ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
            ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
            ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleBasePath, module.BasePath);
            ModuleConfiguration.ModuleFilePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleFilePath, module.BasePath);
            ModuleConfiguration.ModuleLogFilePath = GlobalConfiguration.GetBaseFilePath(moduleConfig.ModuleLogFilePath);
            ModuleConfiguration.UseProxy = moduleConfig.UseProxy;
            ModuleConfiguration.ProxyServer = moduleConfig.ProxyServer;
            ModuleConfiguration.ProxyUsername = moduleConfig.ProxyUsername;
            ModuleConfiguration.ProxyPassword = moduleConfig.ProxyPassword;
            ModuleConfiguration.ProxyBypass = moduleConfig.ProxyBypass;
            ModuleConfiguration.IgnoreHTTPSErrors = moduleConfig.IgnoreHTTPSErrors;
            ModuleConfiguration.RequestTimeoutMS = moduleConfig.RequestTimeoutMS;
            ModuleConfiguration.MaxRedirects = moduleConfig.MaxRedirects;
            ModuleConfiguration.SessionStorageBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.SessionStorageBasePath, Path.Combine(GlobalConfiguration.EntryBasePath, "sqlite", ModuleConfiguration.ModuleID));
            ModuleConfiguration.BrowserIdleTimeoutSecond = Math.Max(0, moduleConfig.BrowserIdleTimeoutSecond);
            ModuleConfiguration.ForwardUrls = BuildForwardUrls(moduleConfig.ForwardUrls);
            ModuleConfiguration.AllowClientIP = (moduleConfig.AllowClientIP ?? new List<string>())
                .Where(p => string.IsNullOrWhiteSpace(p) == false)
                .Select(p => p.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (ModuleConfiguration.AllowClientIP.Count == 0)
            {
                ModuleConfiguration.AllowClientIP.Add("*");
            }

            ModuleConfiguration.IsConfigure = true;

            services.AddSingleton<IForwardProxySessionStore, SQLiteForwardProxySessionStore>();
            services.AddSingleton<IForwardProxyService, ForwardProxyService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (!string.IsNullOrWhiteSpace(ModuleID) && module != null)
            {
                var wwwrootDirectory = PathExtensions.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (!string.IsNullOrWhiteSpace(wwwrootDirectory) && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseDefaultFiles(new DefaultFilesOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        RequestPath = "/" + ModuleID,
                        DefaultFileNames = { "index.html" }
                    });

                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        RequestPath = "/" + ModuleID,
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
                            if (WithOnlyIPFilter.TryRejectStaticFile(httpContext.Context, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure") == true)
                            {
                                return;
                            }

                            var policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                            .ConfigureAwait(false)
                            .GetAwaiter().GetResult();

                            if (policy != null)
                            {
                                try
                                {
                                    var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                    corsService.ApplyResult(corsResult, httpContext.Context.Response);
                                }
                                catch
                                {
                                    Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                        }
                    });
                }
            }
        }

        private Dictionary<string, string> BuildForwardUrls(List<Dictionary<string, string>>? configuredForwardUrls)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (configuredForwardUrls == null || configuredForwardUrls.Count == 0)
            {
                return result;
            }

            foreach (var configuredForwardUrl in configuredForwardUrls)
            {
                if (configuredForwardUrl == null || configuredForwardUrl.Count == 0)
                {
                    continue;
                }

                foreach (var item in configuredForwardUrl)
                {
                    var requestKey = item.Key?.Trim();
                    var targetUrl = item.Value?.Trim();
                    if (string.IsNullOrWhiteSpace(requestKey) == true || string.IsNullOrWhiteSpace(targetUrl) == true)
                    {
                        continue;
                    }

                    if (Uri.TryCreate(targetUrl, UriKind.Absolute, out var targetUri) == false ||
                        (targetUri.Scheme != Uri.UriSchemeHttp && targetUri.Scheme != Uri.UriSchemeHttps))
                    {
                        Log.Logger.Warning("[{LogCategory}] requestKey: {RequestKey}, targetUrl: {TargetUrl} ForwardUrls 설정 확인 필요", $"{ModuleID} ModuleInitializer/ConfigureServices", requestKey, targetUrl);
                        continue;
                    }

                    result[requestKey] = targetUri.AbsoluteUri;
                }
            }

            return result;
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("forwarder");
        }
    }
}
