using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;

using HandStack.Web.Modules;

using Serilog;

namespace ack.Extensions
{
    internal sealed class ModuleAssemblyLoader : IDisposable
    {
        private readonly ModuleProbe[] probes;

        public ModuleAssemblyLoader(IEnumerable<ModuleInfo> modules)
        {
            probes = modules.Where(module => module.IsBundledWithHost == false)
                .Select(module => new ModuleProbe(module)).ToArray();
            AssemblyLoadContext.Default.Resolving += ResolveAssembly;
        }

        public Assembly? LoadModule(ModuleInfo module)
        {
            var probe = probes.First(item => ReferenceEquals(item.Module, module));
            var assemblyName = new AssemblyName(module.ModuleID);
            var path = probe.FindDirectPath(assemblyName);
            if (path == null)
            {
                path = probe.FindFallbackPaths(assemblyName.Name!).FirstOrDefault();
            }

            if (path == null)
            {
                return null;
            }

            var assembly = LoadAssembly(path);
            return Path.GetFileNameWithoutExtension(assembly.ManifestModule.Name) == module.ModuleID ? assembly : null;
        }

        private Assembly? ResolveAssembly(AssemblyLoadContext context, AssemblyName assemblyName)
        {
            if (string.IsNullOrEmpty(assemblyName.Name))
            {
                return null;
            }

            foreach (var probe in probes)
            {
                var path = probe.FindDirectPath(assemblyName);
                var assembly = path == null ? null : TryLoadDependency(path, assemblyName);
                if (assembly != null)
                {
                    return assembly;
                }
            }

            foreach (var probe in probes)
            {
                foreach (var path in probe.FindFallbackPaths(assemblyName.Name))
                {
                    var assembly = TryLoadDependency(path, assemblyName);
                    if (assembly != null)
                    {
                        return assembly;
                    }
                }
            }

            return null;
        }

        private static Assembly? TryLoadDependency(string path, AssemblyName requestedName)
        {
            AssemblyName candidateName;
            try
            {
                candidateName = AssemblyName.GetAssemblyName(path);
            }
            catch (BadImageFormatException)
            {
                return null;
            }

            if (IsCompatible(candidateName, requestedName) == false)
            {
                return null;
            }

            var assembly = LoadAssembly(path);
            return IsCompatible(assembly.GetName(), requestedName) ? assembly : null;
        }

        private static bool IsCompatible(AssemblyName candidate, AssemblyName requested)
        {
            if (string.Equals(candidate.Name, requested.Name, StringComparison.OrdinalIgnoreCase) == false ||
                string.Equals(candidate.CultureName ?? "", requested.CultureName ?? "", StringComparison.OrdinalIgnoreCase) == false ||
                (requested.Version != null && (candidate.Version == null || candidate.Version < requested.Version)))
            {
                return false;
            }

            var requestedToken = requested.GetPublicKeyToken();
            return requestedToken == null || requestedToken.Length == 0 ||
                requestedToken.AsSpan().SequenceEqual(candidate.GetPublicKeyToken());
        }

        private static Assembly LoadAssembly(string path)
        {
            try
            {
                return AssemblyLoadContext.Default.LoadFromAssemblyPath(path);
            }
            catch (FileLoadException)
            {
                var candidateName = AssemblyName.GetAssemblyName(path);
                var assembly = AssemblyLoadContext.Default.Assemblies.FirstOrDefault(item =>
                    AssemblyName.ReferenceMatchesDefinition(item.GetName(), candidateName));
                if (assembly == null)
                {
                    throw;
                }

                var loadedPath = string.IsNullOrWhiteSpace(assembly.Location) ? path : assembly.Location;
                var loadedVersion = FileVersionInfo.GetVersionInfo(loadedPath).FileVersion;
                var candidateVersion = FileVersionInfo.GetVersionInfo(path).FileVersion;
                if (candidateVersion != loadedVersion)
                {
                    Log.Logger.Warning("파일 {AssemblyPath} {CandidateVersion}을(를) 로드할 수 없습니다. 이미 {LoadedPath} {LoadedVersion}이(가) 로드되었습니다.",
                        path, candidateVersion, loadedPath, loadedVersion);
                }

                return assembly;
            }
        }

        public void Dispose()
        {
            AssemblyLoadContext.Default.Resolving -= ResolveAssembly;
        }

        private sealed class ModuleProbe
        {
            private readonly string basePath;
            private readonly string[] excludedPaths;
            private readonly Lazy<Dictionary<string, List<string>>> fallbackPaths;

            public ModuleInfo Module { get; }

            public ModuleProbe(ModuleInfo module)
            {
                Module = module;
                basePath = Path.GetFullPath(module.BasePath);
                excludedPaths = module.LoadPassAssemblyPath.Select(path => path.Replace('\\', '/')).ToArray();
                fallbackPaths = new Lazy<Dictionary<string, List<string>>>(IndexFallbackPaths);
            }

            public string? FindDirectPath(AssemblyName assemblyName)
            {
                var name = assemblyName.Name;
                var culture = assemblyName.CultureName;
                if (string.IsNullOrEmpty(name) || name.IndexOfAny(['/', '\\']) >= 0 ||
                    (culture != null && culture.IndexOfAny(['/', '\\']) >= 0))
                {
                    return null;
                }

                var path = string.IsNullOrEmpty(culture)
                    ? Path.Combine(basePath, name + ".dll")
                    : Path.Combine(basePath, culture, name + ".dll");
                return IsExcluded(path) == false && File.Exists(path) ? path : null;
            }

            public IEnumerable<string> FindFallbackPaths(string name)
            {
                return fallbackPaths.Value.TryGetValue(name, out var paths) ? paths : Array.Empty<string>();
            }

            private Dictionary<string, List<string>> IndexFallbackPaths()
            {
                var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
                if (Directory.Exists(basePath) == false)
                {
                    return result;
                }

                var directories = new Queue<string>();
                directories.Enqueue(basePath);
                while (directories.TryDequeue(out var directory))
                {
                    foreach (var path in Directory.EnumerateFiles(directory, "*.dll"))
                    {
                        if (IsExcluded(path))
                        {
                            continue;
                        }

                        var name = Path.GetFileNameWithoutExtension(path);
                        if (result.TryGetValue(name, out var paths) == false)
                        {
                            paths = new List<string>();
                            result.Add(name, paths);
                        }
                        paths.Add(path);
                    }

                    foreach (var child in Directory.EnumerateDirectories(directory))
                    {
                        if (IsExcluded(child + Path.DirectorySeparatorChar) == false &&
                            (File.GetAttributes(child) & FileAttributes.ReparsePoint) == 0)
                        {
                            directories.Enqueue(child);
                        }
                    }
                }

                return result;
            }

            private bool IsExcluded(string path)
            {
                var normalizedPath = path.Replace('\\', '/');
                if (normalizedPath.Contains("/runtimes/", StringComparison.Ordinal))
                {
                    return true;
                }

                foreach (var excludedPath in excludedPaths)
                {
                    if (normalizedPath == excludedPath ||
                        (excludedPath.EndsWith("/**", StringComparison.Ordinal) &&
                         normalizedPath.StartsWith(excludedPath[..^3], StringComparison.Ordinal)))
                    {
                        return true;
                    }
                }
                return false;
            }
        }
    }
}
