using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

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

            if (Array.Exists(args, p => p == "--showenv") == true)
            {
                Log.Information($"Bootstrapping IConfigurationRoot.... {GlobalConfiguration.BootstrappingVariables(configuration)}");
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

            GlobalConfiguration.ServerLocalIP = GetLocalIPv4Address();
            if (string.IsNullOrEmpty(GlobalConfiguration.ServerDevCertFilePath) == true)
            {
                Log.Information($"ack LocalIP: {GlobalConfiguration.ServerLocalIP}, Port: {port}, ProxyBasePath: {GlobalConfiguration.ProxyBasePath} Start...");
            }
            else
            {
                Log.Information($"ack LocalIP: {GlobalConfiguration.ServerLocalIP}, Port: {port}, ProxyBasePath: {GlobalConfiguration.ProxyBasePath}, SslPort: {GlobalConfiguration.ServerDevCertSslPort} Start...");
            }

            GlobalConfiguration.IsRunning = true;
            await host.RunAsync(cancellationTokenSource.Token);
            host.Dispose();
        }

        public static string GetLocalIPv4Address()
        {
            string localIp = "127.0.0.1";

            try
            {
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus == OperationalStatus.Up &&
                        (ni.NetworkInterfaceType == NetworkInterfaceType.Ethernet ||
                         ni.NetworkInterfaceType == NetworkInterfaceType.Wireless80211) &&
                        ni.Name.Contains("Loopback") == false)
                    {
                        IPInterfaceProperties ipProps = ni.GetIPProperties();
                        foreach (UnicastIPAddressInformation ip in ipProps.UnicastAddresses)
                        {
                            if (ip.Address.AddressFamily == AddressFamily.InterNetwork)
                            {
                                if (!IPAddress.IsLoopback(ip.Address))
                                {
                                    return ip.Address.ToString();
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"IP 주소를 가져오는 중 오류 발생: {ex.Message}");
            }

            return localIp;
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

            var currentProcess = Process.GetCurrentProcess();
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
                        if (string.IsNullOrEmpty(GlobalConfiguration.ServerDevCertFilePath) == false && File.Exists(GlobalConfiguration.ServerDevCertFilePath) == true)
                        {
                            if (SocketExtensions.PortInUse(GlobalConfiguration.ServerDevCertSslPort) == true)
                            {
                                Log.Error($"{GlobalConfiguration.ServerDevCertSslPort} SSL 포트는 이미 사용중입니다. 참고 명령어) netstat -ano | findstr {GlobalConfiguration.ServerDevCertSslPort}");
                            }
                            else
                            {
                                try
                                {
                                    options.ListenAnyIP(GlobalConfiguration.ServerDevCertSslPort, listenOptions =>
                                    {
                                        listenOptions.UseHttps(GlobalConfiguration.ServerDevCertFilePath, GlobalConfiguration.ServerDevCertPassword);
                                    });
                                }
                                catch (Exception exception)
                                {
                                    Log.Error(exception, $"HTTPS 인증서 확인 필요. SslPort: {GlobalConfiguration.ServerDevCertSslPort}, FilePath: {GlobalConfiguration.ServerDevCertFilePath}");
                                }
                            }
                        }
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
    }
}
