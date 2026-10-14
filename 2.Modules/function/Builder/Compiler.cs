using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Reflection.Metadata;
using System.Runtime.InteropServices;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using Microsoft.CSharp.RuntimeBinder;

namespace function.Builder
{
    internal class Compiler
    {
        public Tuple<byte[]?, string?>? CompileText(string sourceCode)
        {
            Tuple<byte[]?, string?>? result = null;
            using (var memoryStream = new MemoryStream())
            {
                var emitResult = GenerateCode(sourceCode).Emit(memoryStream);

                if (emitResult.Success == false)
                {
                    var failureMessages = new List<string>();
                    var failures = emitResult.Diagnostics.Where(diagnostic => diagnostic.IsWarningAsError || diagnostic.Severity == DiagnosticSeverity.Error);
                    foreach (var diagnostic in failures)
                    {
                        failureMessages.Add($"{diagnostic.Id}: {diagnostic.GetMessage()}");
                    }

                    result = new Tuple<byte[]?, string?>(null, string.Join("\n", failureMessages.ToArray()));
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                result = new Tuple<byte[]?, string?>(memoryStream.ToArray(), null);
            }

            return result;
        }

        public Tuple<byte[]?, string?>? CompileFile(string sourceFilePath, string? moduleID = null)
        {
            Tuple<byte[]?, string?>? result = null;
            if (File.Exists(sourceFilePath))
            {
                var module = GlobalConfiguration.Modules.FirstOrDefault(p => sourceFilePath.IndexOf(p.BasePath) > -1);
                if (string.IsNullOrWhiteSpace(moduleID))
                {
                    module = GlobalConfiguration.Modules.FirstOrDefault(p => sourceFilePath.IndexOf(p.BasePath) > -1);
                }
                else
                {
                    module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == moduleID);
                    module ??= GlobalConfiguration.Modules.FirstOrDefault(p => sourceFilePath.IndexOf(p.BasePath) > -1);
                }

                var targetAssembly = module?.Assembly;
                var sourceCode = File.ReadAllText(sourceFilePath);
                using var memoryStream = new MemoryStream();
                var emitResult = GenerateCode(sourceCode, targetAssembly).Emit(memoryStream);

                if (emitResult.Success == false)
                {
                    var failureMessages = new List<string>();
                    var failures = emitResult.Diagnostics.Where(diagnostic => diagnostic.IsWarningAsError || diagnostic.Severity == DiagnosticSeverity.Error);
                    foreach (var diagnostic in failures)
                    {
                        failureMessages.Add(diagnostic.ToString());
                    }

                    result = new Tuple<byte[]?, string?>(null, string.Join("\n", failureMessages.ToArray()));
                    return result;
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                result = new Tuple<byte[]?, string?>(memoryStream.ToArray(), null);
            }

            return result;
        }

        private static bool AddReferenceAssemblyFilePath(List<string> referenceAssemblyLocations, string assemblyFilePath)
        {
            if (string.IsNullOrWhiteSpace(assemblyFilePath))
            {
                return false;
            }

            var file = Path.GetFullPath(assemblyFilePath);
            if (File.Exists(file) == false)
            {
                var path = RuntimeEnvironment.GetRuntimeDirectory();
                if (path != null)
                {
                    file = PathExtensions.Combine(path, assemblyFilePath);
                    if (File.Exists(file) == false)
                    {
                        return false;
                    }
                }
                else
                {
                    return false;
                }
            }

            if (referenceAssemblyLocations.Any(r => r == file) == true)
            {
                return true;
            }

            try
            {
                MetadataReference.CreateFromFile(file);
                referenceAssemblyLocations.Add(file);
            }
            catch
            {
                return false;
            }

            return true;
        }

        private static unsafe PortableExecutableReference CreateAssemblyReference(Assembly assembly)
        {
            if (assembly.TryGetRawMetadata(out var metadata, out var length) == false)
            {
                throw new InvalidOperationException($"컴파일 참조 메타데이터를 읽을 수 없습니다: {assembly.FullName}");
            }

            var module = ModuleMetadata.CreateFromMetadata((IntPtr)metadata, length, () => GC.KeepAlive(assembly));
            return AssemblyMetadata.Create(module).GetReference();
        }

        private static CSharpCompilation GenerateCode(string sourceCode, Assembly? assembly = null)
        {
            var codeString = SourceText.From(sourceCode);
            var options = CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.CSharp10);
            var parsedSyntaxTree = SyntaxFactory.ParseSyntaxTree(codeString, options);
            var references = new List<MetadataReference>();
            var referencedAssemblies = new HashSet<Assembly>();
            void AddAssemblyReference(Assembly target)
            {
                if (referencedAssemblies.Add(target))
                {
                    references.Add(CreateAssemblyReference(target));
                }
            }

            AddAssemblyReference(typeof(object).Assembly);
            AddAssemblyReference(typeof(RuntimeBinderException).Assembly);

            var assemblyPaths = new List<string>();
            var functionAssembly = typeof(ModuleInitializer).Assembly;
            functionAssembly.GetReferencedAssemblies().ToList()
                .ForEach((AssemblyName assemblyName) =>
                {
                    AddAssemblyReference(Assembly.Load(assemblyName));
                });

            if (assembly != null)
            {
                assembly.GetReferencedAssemblies().ToList()
                    .ForEach((AssemblyName assemblyName) =>
                    {
                        AddAssemblyReference(Assembly.Load(assemblyName));
                    });

                AddAssemblyReference(assembly);
            }

            var baseAssemblyPath = RuntimeEnvironment.GetRuntimeDirectory() + Path.DirectorySeparatorChar;
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "netstandard.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "Microsoft.CSharp.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Core.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Private.CoreLib.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Runtime.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Console.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Text.RegularExpressions.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Linq.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Linq.Expressions.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.IO.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.IO.Compression.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.IO.Compression.ZipFile.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Net.Primitives.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Net.Http.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Private.Uri.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Reflection.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.ComponentModel.Primitives.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Globalization.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Collections.Concurrent.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Collections.NonGeneric.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Data.Common.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.ComponentModel.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.ComponentModel.TypeConverter.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.ComponentModel.Primitives.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Xml.ReaderWriter.dll");
            AddReferenceAssemblyFilePath(assemblyPaths, baseAssemblyPath + "System.Private.Xml.dll");

            AddAssemblyReference(functionAssembly);
            assemblyPaths = assemblyPaths.Distinct().ToList();

            assemblyPaths.ForEach((string path) =>
            {
                var portableExecutableReference = MetadataReference.CreateFromFile(path);
                if (references.Contains(portableExecutableReference) == false)
                {
                    references.Add(portableExecutableReference);
                }
            });

            return CSharpCompilation.Create(null,
                new[] { parsedSyntaxTree },
                references: references,
                options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,
                    optimizationLevel: OptimizationLevel.Release,
                    assemblyIdentityComparer: DesktopAssemblyIdentityComparer.Default));
        }
    }
}

