using System;
using System.Diagnostics;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Web;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using RestSharp;

using Serilog;

namespace ack
{
    public class ApplicationManager
    {
        private static ApplicationManager? applicationManager;
        private CancellationTokenSource? cancellationTokenSource;
        private IHost? host;
        private bool isServiceRunning;
        private bool isRestart;

        public bool IsRestarting => isRestart;

        public bool IsServiceRunning => isServiceRunning;

        public ApplicationManager()
        {
            isServiceRunning = false;
            isRestart = false;
        }

        public static ApplicationManager Load()
        {
            if (applicationManager == null)
            {
                applicationManager = new ApplicationManager();
            }

            return applicationManager;
        }

        public async Task StartAsync(int port, string[] args, IConfigurationRoot configuration)
        {
            if (isServiceRunning == true)
            {
                return;
            }

            if (cancellationTokenSource != null && cancellationTokenSource.IsCancellationRequested == true)
            {
                return;
            }

            cancellationTokenSource = new CancellationTokenSource();
            cancellationTokenSource.Token.ThrowIfCancellationRequested();
            isServiceRunning = true;

            if (Array.Exists(args, p => p == "showenv=1") == true || Array.Exists(args, p => p == "showenv=Y") == true)
            {
                Log.Information($"Bootstrapping IConfigurationRoot... {GlobalConfiguration.BootstrappingVariables(configuration)}");
            }

            host = CreateWebHostBuilder(port, args).Build();

            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var environment = services.GetService<IWebHostEnvironment>();

                if (environment != null)
                {
                    Log.Information($"Bootstrapping IWebHostEnvironment... {GlobalConfiguration.BootstrappingVariables(environment)}");
                }
            }

            Log.Information($"ack {port} Start...");

            _ = Task.Run(async () =>
            {
                await Task.Delay(1000);
                BackgroundTaskAsync();
            });

            GlobalConfiguration.IsRunning = true;
            await host.RunAsync(cancellationTokenSource.Token);
            host.Dispose();
        }

        public void Stop()
        {
            if (cancellationTokenSource != null)
            {
                cancellationTokenSource.Cancel();
            }
            isServiceRunning = false;
            Log.Information($"ack Stop...");
            Log.CloseAndFlush();

            Process currentProcess = Process.GetCurrentProcess();
            currentProcess.Kill();
        }

        public static IHostBuilder CreateWebHostBuilder(int port, string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .UseContentRoot(GlobalConfiguration.EntryBasePath)
                .UseSerilog((context, config) =>
                {
                    config.ReadFrom.Configuration(context.Configuration);
                })
                .ConfigureServices((context, services) =>
                {
                    var kestrelSection = context.Configuration.GetSection("Kestrel");
                    services.Configure<KestrelServerOptions>(kestrelSection);
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.UseKestrel((options) =>
                    {
                        options.ListenAnyIP(port);
                        options.AddServerHeader = false;
                    });
                })
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.AddConsole();
                })
                .UseWindowsService()
                .UseSystemd();
        }

        private static async void BackgroundTaskAsync()
        {
            string moduleConfigurationUrl = "";
            try
            {
                var client = new RestClient();
                foreach (var item in GlobalConfiguration.ModuleConfigurationUrl)
                {
                    moduleConfigurationUrl = item;
                    if (Uri.TryCreate(moduleConfigurationUrl, UriKind.Absolute, out var uriResult) && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps) == true)
                    {
                        Log.Information($"ModuleConfigurationUrl: {item} 요청");

                        Uri baseUri = new Uri(item);
                        var request = new RestRequest(baseUri, Method.Get);
                        request.AddHeader("ApplicationName", GlobalConfiguration.ApplicationName);
                        request.AddHeader("SystemID", GlobalConfiguration.SystemID);
                        request.AddHeader("HostName", GlobalConfiguration.HostName);
                        request.AddHeader("RunningEnvironment", GlobalConfiguration.RunningEnvironment);
                        request.AddHeader("ApplicationRuntimeID", GlobalConfiguration.ApplicationRuntimeID);
                        request.AddHeader("AuthorizationKey", GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName);

                        var response = await client.ExecuteAsync(request);
                        if (response.StatusCode != HttpStatusCode.OK)
                        {
                            Log.Error($"ModuleConfigurationUrl: {item}, StatusCode: {response.StatusCode}, ErrorMessage: {response.ErrorMessage} 응답 확인 필요");
                        }
                    }
                    else
                    {
                        Log.Error($"ModuleConfigurationUrl: {item} 경로 확인 필요");
                    }
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, $"BackgroundTaskAsync 오류: {moduleConfigurationUrl}");
            }
        }
    }
}
