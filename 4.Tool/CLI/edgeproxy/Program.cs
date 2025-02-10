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
