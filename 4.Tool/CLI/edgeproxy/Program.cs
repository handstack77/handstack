using System.Diagnostics;
using System.Runtime.InteropServices;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace edgeproxy
{
    public class Program
    {
        private static Process? ackProcess;

        public static void Main(string[] args)
        {
            var isDaemonService = (args.Contains("--d") == true || args.Contains("--daemon") == true);
            var builder = CreateHostBuilder(args);

            if (isDaemonService == true)
            {
                builder.UseWindowsService();
                builder.UseSystemd();
            }

            var host = builder.Build();

            var handstackHome = Environment.GetEnvironmentVariable("HANDSTACK_HOME");
            if (string.IsNullOrEmpty(handstackHome))
            {
                Console.WriteLine("HANDSTACK_HOME 환경변수가 설정되지 않았습니다.");
                Environment.Exit(1);
            }

            var processes = Process.GetProcessesByName("ack");
            var entryAckDllFileName = Path.Join(handstackHome, "app", "ack.dll");
            if (File.Exists(entryAckDllFileName) == true && processes.Any() == false)
            {
                bool isAckProcessRun = true;
                var ackProcessRun = args.FirstOrDefault(arg => arg.StartsWith("--ackrun="))?.Split('=')[1];
                if (bool.TryParse(ackProcessRun, out isAckProcessRun) == false)
                {
                    isAckProcessRun = true;
                }

                if (isAckProcessRun == true)
                {
                    var entryCommand = Path.Join(handstackHome, "app", "ack");
                    var entryArguments = args.FirstOrDefault(arg => arg.StartsWith("--arguments="))?.Replace("--arguments=", "");
                    if (string.IsNullOrEmpty(entryArguments) == false)
                    {
                        entryCommand = $"{entryCommand} {entryArguments}";
                    }

                    ExecuteEntryCommand(entryCommand);
                }
            }
            else
            {
                ackProcess = processes.FirstOrDefault();
            }

            bool isAckProcessExit = true;
            var ackProcessExit = args.FirstOrDefault(arg => arg.StartsWith("--ackexit="))?.Split('=')[1];
            if (bool.TryParse(ackProcessExit, out isAckProcessExit) == false)
            {
                isAckProcessExit = true;
            }

            if (isAckProcessExit == true)
            {
                AppDomain.CurrentDomain.ProcessExit += (s, e) =>
                {
                    if (ackProcess != null && ackProcess.HasExited == false)
                    {
                        ackProcess.Kill(true);
                        ackProcess.WaitForExit();
                    }
                };
            }

            host.Run();
        }

        private static void ExecuteEntryCommand(string command)
        {
            var processInfo = new ProcessStartInfo();
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                processInfo.FileName = "cmd.exe";
                processInfo.Arguments = $"/c {command}";
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) || RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                processInfo.FileName = "/bin/bash";
                processInfo.Arguments = $"-c \"{command}\"";
            }

            processInfo.CreateNoWindow = true;
            processInfo.UseShellExecute = false;

            ackProcess = Process.Start(processInfo);
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.AddJsonFile("edgeproxy.appsettings.json", optional: false, reloadOnChange: true);
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.ConfigureKestrel(serverOptions =>
                    {
                        var configuration = (IConfiguration?)serverOptions.ApplicationServices.GetService(typeof(IConfiguration));
                        if (configuration != null)
                        {
                            serverOptions.Configure(configuration.GetSection("Kestrel"));
                        }
                    });

                    webBuilder.ConfigureServices((context, services) =>
                    {
                        services.AddReverseProxy()
                            .LoadFromConfig(context.Configuration.GetSection("ReverseProxy"));
                    });

                    webBuilder.Configure(app =>
                    {
                        app.UseRouting();
                        app.UseEndpoints(endpoints =>
                        {
                            endpoints.MapReverseProxy();
                        });
                    });
                })
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.AddConsole();
                    logging.AddFilter("Microsoft.AspNetCore.DataProtection.KeyManagement.XmlKeyManager", LogLevel.None);
                });
    }
}
