using System.Diagnostics;
using System.Runtime.InteropServices;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
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
            if (string.IsNullOrWhiteSpace(handstackHome))
            {
                Console.WriteLine("HANDSTACK_HOME 환경변수가 설정되지 않았습니다.");
                Environment.Exit(1);
            }

            var entryAckFileName = Path.Join(handstackHome, "app", RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? "ack.exe" : "ack");
            var ackFile = new FileInfo(entryAckFileName);
            if (ackFile.Exists == false)
            {
                Console.WriteLine($"ACK 파일이 존재하지 않습니다. {ackFile.FullName}");
                Environment.Exit(1);
            }

            var processes = Process.GetProcessesByName("ack");
            if (processes.Any() == false)
            {
                var isAckProcessRun = true;
                var ackProcessRun = args.FirstOrDefault(arg => arg.StartsWith("--ackrun="))?.Split('=')[1];
                if (bool.TryParse(ackProcessRun, out isAckProcessRun) == false)
                {
                    isAckProcessRun = true;
                }

                if (isAckProcessRun == true)
                {
                    var arguments = $"{args.FirstOrDefault(arg => arg.StartsWith("--arguments="))?.Replace("--arguments=", "")} --pname=edgeproxy-ack".Trim();

                    var ackFilePath = ackFile.FullName.Replace("\\", "/");

                    var processInfo = new ProcessStartInfo();
                    processInfo.FileName = ackFilePath;
                    processInfo.Arguments = arguments;
                    processInfo.WorkingDirectory = Path.GetDirectoryName(ackFilePath);
                    processInfo.CreateNoWindow = true;
                    processInfo.UseShellExecute = false;
                    processInfo.WindowStyle = ProcessWindowStyle.Hidden;

                    ackProcess = Process.Start(processInfo);
                }
            }
            else
            {
                ackProcess = processes.FirstOrDefault();
            }

            var isAckProcessExit = true;
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

        public static IHostBuilder CreateHostBuilder(string[] args) =>
           Host.CreateDefaultBuilder(args)
               .ConfigureAppConfiguration((hostingContext, config) =>
               {
                   config.AddJsonFile("edgeproxy.appsettings.json", optional: false, reloadOnChange: true);
               })
               .ConfigureWebHostDefaults(webBuilder =>
               {
                   webBuilder.ConfigureServices((context, services) =>
                   {
                       services.Configure<KestrelServerOptions>(context.Configuration.GetSection("Kestrel"));
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
                   logging.AddFilter("Microsoft.AspNetCore.DataProtection.Repositories.FileSystemXmlRepository", LogLevel.None);
               });
    }
}
