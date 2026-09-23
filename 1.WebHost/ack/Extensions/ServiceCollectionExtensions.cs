using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;

using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;

using Serilog;

namespace ack.Extensions
{
    public static class ServiceCollectionExtensions
    {
        private static readonly IModuleConfigurationManager modulesConfig = new ModuleConfigurationManager();
        private static ModuleAssemblyLoader? moduleAssemblyLoader;

        public static IServiceCollection AddModules(this IServiceCollection services)
        {
            var modules = modulesConfig.GetModules().ToArray();
            moduleAssemblyLoader?.Dispose();
            moduleAssemblyLoader = new ModuleAssemblyLoader(modules);

            foreach (var module in modules)
            {
                if (module.IsBundledWithHost == false)
                {
                    Log.Logger.Information("LoadModule: {ModuleID}, moduleBasePath: {ModuleBasePath}", module.ModuleID, module.BasePath);
                    module.Assembly = moduleAssemblyLoader.LoadModule(module);
                }
                else
                {
                    var assemblyPath = Path.Combine(AppContext.BaseDirectory, $"{module.ModuleID}.dll");
                    module.Assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(assemblyPath);
                    Log.Logger.Information($"LoadModule: {module.ModuleID}, IsBundledWithHost");
                }

                GlobalConfiguration.Modules.Add(module);
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

            foreach (var module in modules.Where(x => x.IsBundledWithHost == false))
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
