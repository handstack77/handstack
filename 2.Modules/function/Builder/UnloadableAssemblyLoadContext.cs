using System;
using System.Collections.Concurrent;
using System.IO;
using System.Reflection;
using System.Runtime.Loader;

namespace function.Builder
{
    internal class UnloadableAssemblyLoadContext : AssemblyLoadContext, IDisposable
    {
        private ConcurrentDictionary<string, Assembly> LoadedAssemblies { get; }

        public UnloadableAssemblyLoadContext() : base(true)
        {
            LoadedAssemblies = new ConcurrentDictionary<string, Assembly>();

            Resolving += LoadContext_Resolving;
        }

        private Assembly LoadContext_Resolving(AssemblyLoadContext assemblyLoadContext, AssemblyName assemblyName)
        {
            return LoadedAssemblies[assemblyName.FullName];
        }

        public Assembly? LoadAssembliyFromStream(Stream stream)
        {
            var assembly = LoadFromStream(stream);
            if (string.IsNullOrEmpty(assembly.FullName) == false)
            {
                LoadedAssemblies.TryAdd(assembly.FullName, assembly);
            }

            return assembly;
        }

        protected sealed override Assembly? Load(AssemblyName assemblyName)
        {
            return null;
        }

        public void Dispose()
        {
            LoadedAssemblies.Clear();
            Unload();
        }
    }
}
