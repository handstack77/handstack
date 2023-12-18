using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;

using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;

using HandStack.Web;
using HandStack.Web.Extensions;
using HandStack.Web.Modules;

using Serilog;

namespace ack.Extensions
{
    public static class ServiceCollectionExtensions
    {
        private static readonly IModuleConfigurationManager modulesConfig = new ModuleConfigurationManager();

        public static IServiceCollection AddModules(this IServiceCollection services)
        {
            foreach (var module in modulesConfig.GetModules())
            {
                if (module.IsBundledWithHost == false)
                {
                    TryLoadModuleAssembly(module.ModuleID, module);
                }
                else
                {
                    module.Assembly = Assembly.Load(new AssemblyName(module.ModuleID));
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

        private static void TryLoadModuleAssembly(string moduleID, ModuleInfo module)
        {
            string moduleBasePath = module.BasePath;
            var binariesFolder = new DirectoryInfo(moduleBasePath);

            Log.Logger.Information($"LoadModule: {moduleID}, moduleBasePath: {moduleBasePath}");

            if (GlobalConfiguration.ModuleNames.IndexOf(moduleID) > -1 && Directory.Exists(moduleBasePath) == true)
            {
                var files = binariesFolder.GetFileSystemInfos("*.dll", SearchOption.AllDirectories);
                foreach (var file in files)
                {
                    Assembly? assembly = null;
                    try
                    {
                        if (file.FullName.IndexOf($"{Path.DirectorySeparatorChar}runtimes{Path.DirectorySeparatorChar}") > -1)
                        {
                     
                        }
                        else
                        {
                            assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(file.FullName);
                        }
                    }
                    catch (FileLoadException fileLoadException)
                    {
                        assembly = Assembly.Load(new AssemblyName(Path.GetFileNameWithoutExtension(file.Name)));

                        if (assembly == null)
                        {
                            Log.Logger.Error(fileLoadException, $"LoadModule: {moduleID}, moduleBasePath: {moduleBasePath}");
                            throw;
                        }

                        string assemblyFilePath = string.IsNullOrEmpty(assembly.Location) == true ? file.FullName : assembly.Location;
                        string? loadedAssemblyVersion = FileVersionInfo.GetVersionInfo(assemblyFilePath).FileVersion;
                        string? tryToLoadAssemblyVersion = FileVersionInfo.GetVersionInfo(file.FullName).FileVersion;

                        if (tryToLoadAssemblyVersion != loadedAssemblyVersion)
                        {
                            throw new Exception($"Cannot load {file.FullName} {tryToLoadAssemblyVersion} because {assembly.Location} {loadedAssemblyVersion} has been loaded");
                        }
                    }

                    if (assembly != null && Path.GetFileNameWithoutExtension(assembly.ManifestModule.Name) == module.ModuleID)
                    {
                        module.Assembly = assembly;
                    }
                }
            }
        }
    }
}
