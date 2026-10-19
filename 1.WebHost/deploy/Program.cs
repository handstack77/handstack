using System;
using System.Text;

using deploy.Options;
using deploy.Security;
using deploy.Services;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

using Serilog;

namespace deploy
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var loggerConfiguration = new LoggerConfiguration()
                .ReadFrom.Configuration(builder.Configuration);
            Log.Logger = loggerConfiguration.CreateLogger();

            builder.Host.UseSerilog((context, configuration) =>
            {
                configuration.ReadFrom.Configuration(context.Configuration);
            });

            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            builder.Services
                .AddOptions<DeployOptions>()
                .Bind(builder.Configuration.GetSection(DeployOptions.SectionName))
                .ValidateOnStart();

            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = null;
            });

            builder.Services.AddSingleton<ManagementKeyValidator>();
            builder.Services.AddScoped<ManagementKeyActionFilter>();
            builder.Services.AddSingleton<IUpdatePackageRepositoryService, UpdatePackageRepositoryService>();

            if (OperatingSystem.IsWindows() == true)
            {
                builder.Host.UseWindowsService();
            }

            if (OperatingSystem.IsLinux() == true)
            {
                builder.Host.UseSystemd();
            }

            bool useProxyForward = builder.Configuration.GetValue<bool>("UseForwardProxy");
            if (useProxyForward == true)
            {
                builder.Services.Configure<ForwardedHeadersOptions>(options =>
                {
                    options.ForwardedHeaders = ForwardedHeaders.All;
                    options.ForwardLimit = null;
                    foreach (var forwardProxyIP in builder.Configuration.GetSection("ForwardProxyIP").Get<string[]>() ?? [])
                    {
                        if (string.IsNullOrWhiteSpace(forwardProxyIP) == false)
                        {
                            if (forwardProxyIP.Contains('/') == true)
                            {
                                options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(forwardProxyIP));
                            }
                            else
                            {
                                options.KnownProxies.Add(System.Net.IPAddress.Parse(forwardProxyIP));
                            }
                        }
                    }
                });
            }

            var app = builder.Build();
            if (useProxyForward == true)
            {
                app.UseForwardedHeaders();
            }

            var repositoryService = app.Services.GetRequiredService<IUpdatePackageRepositoryService>();

            Log.Information(
                "handstack-deploy starting. ContentRootPath={ContentRootPath}, PublicRootPath={PublicRootPath}, PublicRequestPath={PublicRequestPath}",
                app.Environment.ContentRootPath,
                repositoryService.PublicRootPath,
                "/" + repositoryService.PublicRequestPath);

            app.UseSerilogRequestLogging();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(repositoryService.PublicRootPath),
                RequestPath = "/" + repositoryService.PublicRequestPath,
                ServeUnknownFileTypes = true
            });

            app.MapControllers();
            app.Lifetime.ApplicationStopped.Register(Log.CloseAndFlush);
            app.Run();
        }
    }
}
