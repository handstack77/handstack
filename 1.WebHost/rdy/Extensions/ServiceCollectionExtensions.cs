using System.Collections.Generic;
using System.Reflection;

using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;

using Serilog;

namespace rdy.Extensions
{
    public static class ServiceCollectionExtensions
    {
        private static readonly IModuleConfigurationManager modulesConfig = new ModuleConfigurationManager();

        // rdy는 모듈 어셈블리를 ProjectReference로 정적 참조하므로 동적 어셈블리 로딩 없이 모듈을 결합
        private static readonly Dictionary<string, Assembly> staticModuleAssemblies = new()
        {
            ["command"] = typeof(global::command.ModuleInitializer).Assembly,
            ["dbclient"] = typeof(global::dbclient.ModuleInitializer).Assembly,
            ["function"] = typeof(global::function.ModuleInitializer).Assembly,
            ["graphclient"] = typeof(global::graphclient.ModuleInitializer).Assembly,
            ["logger"] = typeof(global::logger.ModuleInitializer).Assembly,
            ["repository"] = typeof(global::repository.ModuleInitializer).Assembly,
            ["transact"] = typeof(global::transact.ModuleInitializer).Assembly,
            ["wwwroot"] = typeof(global::wwwroot.ModuleInitializer).Assembly,
        };

        public static IServiceCollection AddModules(this IServiceCollection services)
        {
            foreach (var module in modulesConfig.GetModules())
            {
                if (staticModuleAssemblies.TryGetValue(module.ModuleID, out var assembly) == true)
                {
                    module.Assembly = assembly;
                    Log.Logger.Information($"LoadModule: {module.ModuleID}, StaticBundled");

                    GlobalConfiguration.Modules.Add(module);
                }
                else
                {
                    Log.Logger.Warning($"LoadModule: {module.ModuleID}은(는) rdy에 정적으로 포함되지 않은 모듈로 무시됩니다");
                }
            }

            return services;
        }

        public static IServiceCollection AddCustomizedMvc(this IServiceCollection services, IList<ModuleInfo> modules)
        {
            var mvcBuilder = services
                .AddMvc(o =>
                {
                    o.EnableEndpointRouting = false;
                    o.ModelBinderProviders.Insert(0, new InvariantDecimalModelBinderProvider());
                })
                .AddViewLocalization()
                .AddModelBindingMessagesLocalizer(services)
                .AddNewtonsoftJson();

            foreach (var module in modules)
            {
                if (module.Assembly != null)
                {
                    AddApplicationPart(mvcBuilder, module.Assembly);
                }
            }

            return services;
        }

        public static IMvcBuilder AddModelBindingMessagesLocalizer(this IMvcBuilder mvc, IServiceCollection services)
        {
            return mvc.AddMvcOptions(o =>
            {
            });
        }

        private static void AddApplicationPart(IMvcBuilder mvcBuilder, Assembly assembly)
        {
            var partFactory = ApplicationPartFactory.GetApplicationPartFactory(assembly);
            foreach (var part in partFactory.GetApplicationParts(assembly))
            {
                mvcBuilder.PartManager.ApplicationParts.Add(part);
            }

            var relatedAssemblies = RelatedAssemblyAttribute.GetRelatedAssemblies(assembly, throwOnError: false);
            foreach (var relatedAssembly in relatedAssemblies)
            {
                partFactory = ApplicationPartFactory.GetApplicationPartFactory(relatedAssembly);
                foreach (var part in partFactory.GetApplicationParts(relatedAssembly))
                {
                    mvcBuilder.PartManager.ApplicationParts.Add(part);
                }
            }
        }
    }
}
