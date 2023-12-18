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
}
