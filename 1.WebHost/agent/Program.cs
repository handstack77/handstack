using System.Text;

using agent.Options;
using agent.Security;
using agent.Services;

using Microsoft.Extensions.Options;

namespace agent
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            builder.Services
                .AddOptions<AgentOptions>()
                .Bind(builder.Configuration.GetSection(AgentOptions.SectionName))
                .ValidateOnStart();

            builder.Services.AddControllers();

            builder.Services.AddSingleton<ManagementKeyValidator>();
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

