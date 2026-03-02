using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;

using agent.Options;
using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace agent
{
    public class Program
    {
        public static void Main(string[] args)
        {
            string entryDirectoryPath = AppDomain.CurrentDomain.BaseDirectory;
            var builder = WebApplication.CreateBuilder(args);

            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            builder.Services
                .AddOptions<AgentOptions>()
                .Bind(builder.Configuration.GetSection(AgentOptions.SectionName))
                .ValidateOnStart();
            builder.Services
                .AddOptions<List<UserCredentialOptions>>()
                .Bind(builder.Configuration.GetSection("Users"))
                .ValidateOnStart();

            builder.Services.AddControllers();
            builder.Services
                .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(options =>
                {
                    options.Cookie.Name = "handstack-agent-auth";
                    options.Cookie.HttpOnly = true;
                    options.SlidingExpiration = true;
                    options.ExpireTimeSpan = TimeSpan.FromHours(20);
                    options.LoginPath = "/login.html";
                    options.AccessDeniedPath = "/login.html";
                });
            builder.Services.AddAuthorization();

            builder.Services.AddSingleton<ManagementKeyValidator>();
            builder.Services.AddSingleton<UserCredentialValidator>();
            builder.Services.AddScoped<ManagementKeyActionFilter>();
            builder.Services.AddSingleton<IHostStatsProvider, HostStatsProvider>();
            builder.Services.AddSingleton<IDotNetMonitorCollector, DotNetMonitorCollector>();
            builder.Services.AddSingleton<ITargetProcessManager, TargetProcessManager>();
            builder.Services.AddSingleton<ITargetAuditLogger, TargetAuditLogger>();
            builder.Services.AddSingleton<ISettingsModuleService, SettingsModuleService>();

            builder.Services
                .AddHttpClient(DotNetMonitorCollector.HttpClientName)
                .ConfigurePrimaryHttpMessageHandler(serviceProvider =>
                {
                    var options = serviceProvider.GetRequiredService<IOptionsMonitor<AgentOptions>>().CurrentValue.DotNetMonitor;
                    var handler = new HttpClientHandler();
                    if (options.AllowInsecureTls == true)
                    {
                        handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
                    }

                    return handler;
                });
            builder.Services.AddHttpClient(TargetAuditLogger.HttpClientName);
            builder.Services.AddHttpClient(SettingsModuleService.HttpClientName);

            ConfigureServiceLifetime(builder.Host);

            var app = builder.Build();
            app.UseAuthentication();
            app.Use(async (context, next) =>
            {
                var path = context.Request.Path.Value ?? "";
                var isProtectedMainFile =
                    string.Equals(path, "/main.html", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(path, "/main.js", StringComparison.OrdinalIgnoreCase) == true;

                if (isProtectedMainFile == true && context.User.Identity?.IsAuthenticated != true)
                {
                    if (string.Equals(path, "/main.html", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        context.Response.Redirect("/login.html");
                        return;
                    }

                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    return;
                }

                await next();
            });

            app.UseAuthorization();

            string contractsBasePath = Path.Combine(entryDirectoryPath, "Contracts");
            string contractViewPath = Path.Combine(contractsBasePath, "wwwroot", "HDS");
            string contractRequestPath = "view";
            if (!string.IsNullOrWhiteSpace(contractViewPath))
            {
                if (Directory.Exists(contractViewPath))
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(contractViewPath),
                        RequestPath = "/" + contractRequestPath,
                        ServeUnknownFileTypes = true
                    });
                }
            }

            app.UseStaticFiles();
            app.MapControllers();
            app.Run();
        }

        private static void ConfigureServiceLifetime(IHostBuilder hostBuilder)
        {
            if (OperatingSystem.IsWindows() == true)
            {
                TryInvokeHostBuilderExtension(
                    hostBuilder,
                    "Microsoft.Extensions.Hosting.WindowsServices.WindowsServiceLifetimeHostBuilderExtensions, Microsoft.Extensions.Hosting.WindowsServices",
                    "UseWindowsService");
            }

            if (OperatingSystem.IsLinux() == true)
            {
                TryInvokeHostBuilderExtension(
                    hostBuilder,
                    "Microsoft.Extensions.Hosting.Systemd.SystemdHostBuilderExtensions, Microsoft.Extensions.Hosting.Systemd",
                    "UseSystemd");
            }
        }

        private static void TryInvokeHostBuilderExtension(IHostBuilder hostBuilder, string typeName, string methodName)
        {
            var extensionType = Type.GetType(typeName, throwOnError: false);
            var method = extensionType?.GetMethod(methodName, new[] { typeof(IHostBuilder) });
            method?.Invoke(null, new object[] { hostBuilder });
        }
    }
}

