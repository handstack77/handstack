using System;
using System.Text;

using deploy.Options;
using deploy.Security;
using deploy.Services;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
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

            ConfigureServiceLifetime(builder.Host);

            var app = builder.Build();
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

        private static void ConfigureServiceLifetime(IHostBuilder hostBuilder)
        {
            if (OperatingSystem.IsWindows() == true)
            {
                hostBuilder.UseWindowsService();
            }

            if (OperatingSystem.IsLinux() == true)
            {
                hostBuilder.UseSystemd();
            }
        }

        private static bool HasConfiguredUrls(string[] args, string? configuredUrls, string? aspNetCoreUrls)
        {
            if (string.IsNullOrWhiteSpace(configuredUrls) == false || string.IsNullOrWhiteSpace(aspNetCoreUrls) == false)
            {
                return true;
            }

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                if (string.Equals(arg, "--urls", StringComparison.OrdinalIgnoreCase) == true ||
                    arg.StartsWith("--urls=", StringComparison.OrdinalIgnoreCase) == true ||
                    arg.StartsWith("--urls:", StringComparison.OrdinalIgnoreCase) == true ||
                    arg.StartsWith("urls=", StringComparison.OrdinalIgnoreCase) == true ||
                    arg.StartsWith("urls:", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return true;
                }
            }

            return false;
        }
    }
}
