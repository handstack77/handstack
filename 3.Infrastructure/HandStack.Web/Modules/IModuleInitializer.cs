using System.Collections.Generic;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HandStack.Web.Modules
{
    public interface IModuleInitializer
    {
        void ConfigureServices(IServiceCollection services, IWebHostEnvironment environment, IConfiguration configuration);

        void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider);
    }

    public interface IModuleRuntimeConfiguration
    {
        ModuleConfigurationReloadResult ReloadModuleConfiguration(ModuleInfo module, string configurationText);
    }

    public class ModuleConfigurationReloadResult
    {
        public string ModuleID { get; set; } = "";

        public List<string> AppliedKeys { get; set; } = new List<string>();

        public List<string> RestartRequiredKeys { get; set; } = new List<string>();

        public List<string> Errors { get; set; } = new List<string>();
    }
}
