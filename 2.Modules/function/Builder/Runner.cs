using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.Loader;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

using Serilog;

namespace function.Builder
{
    public sealed class Runner
    {
        private Runner() { }
        private static readonly Lazy<Runner> instance = new Lazy<Runner>(() => new Runner());

        public static Runner Instance { get { return instance.Value; } }

        internal Dictionary<string, UnloadableAssemblyLoadContext> FileAssemblyCache = new Dictionary<string, UnloadableAssemblyLoadContext>();

        public object? ExecuteDynamicText(HttpContext? httpContext, string sourceText, string queryID, string typeName, string methodName, params object[] args)
        {
            object? result = null;
            result = ExecuteDynamicMethod(httpContext, false, sourceText, queryID, typeName, methodName, args);

            return result;
        }

        public object? ExecuteDynamicFile(HttpContext? httpContext, string sourceFilePath, string queryID, string typeName, string methodName, params object[] args)
        {
            object? result = null;
            result = ExecuteDynamicMethod(httpContext, true, sourceFilePath, queryID, typeName, methodName, args);

            return result;
        }

        public object? ExecuteDynamicFile(HttpContext? httpContext, string sourceFilePath, string queryID, ModuleScriptMap moduleScriptMap, params object[] args)
        {
            object? result = null;

            string typeName = moduleScriptMap.EntryType.ToStringSafe();
            string methodName = moduleScriptMap.EntryMethod.ToStringSafe();
            string referenceModuleID = moduleScriptMap.ReferenceModuleID.ToStringSafe();

            Assembly? entryAssembly = null;
            if (FileAssemblyCache.ContainsKey(sourceFilePath) == true)
            {
                var assemblyLoadContext = FileAssemblyCache[sourceFilePath];
                entryAssembly = assemblyLoadContext.Assemblies.FirstOrDefault();
            }
            else
            {
                var compiler = new Compiler();
                Tuple<byte[]?, string?>? compiledResult = compiler.CompileFile(sourceFilePath, referenceModuleID);
                if (compiledResult != null)
                {
                    var compiledAssembly = compiledResult.Item1;
                    var errorText = compiledResult.Item2;
                    if (string.IsNullOrEmpty(errorText) == true && compiledAssembly != null)
                    {
                        using (var asm = new MemoryStream(compiledAssembly))
                        {
                            var assemblyLoadContext = new UnloadableAssemblyLoadContext();
                            entryAssembly = assemblyLoadContext.LoadAssembliyFromStream(asm);
                            FileAssemblyCache.Add(sourceFilePath, assemblyLoadContext);
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException(errorText);
                    }
                }
            }

            if (entryAssembly != null && string.IsNullOrEmpty(typeName) == false && string.IsNullOrEmpty(methodName) == false && entryAssembly.GetTypes().Count() > 0)
            {
                var myType = entryAssembly.GetType(typeName);
                if (myType != null)
                {
                    object? myObject = null;
                    if (httpContext == null)
                    {
                        myObject = Activator.CreateInstance(myType);
                    }
                    else
                    {
                        myObject = Activator.CreateInstance(myType, [httpContext]);
                    }

                    MethodInfo? entry = myObject?.GetType().GetMethod(methodName);

                    if (entry != null)
                    {
                        result = entry.GetParameters().Length > 0
                            ? entry.Invoke(myObject, args)
                            : entry.Invoke(myObject, null);
                    }
                    else
                    {
                        throw new MissingMethodException($"queryID: {queryID}, typeName: {typeName}, methodName: {methodName} 확인 필요");
                    }
                }
                else
                {
                    throw new NotImplementedException($"queryID: {queryID}, typeName: {typeName} 확인 필요");
                }
            }

            return result;
        }

        private object? ExecuteDynamicMethod(HttpContext? httpContext, bool isFileSource, string dataSource, string queryID, string typeName, string methodName, object[] args)
        {
            object? result = null;
            Assembly? entryAssembly = null;
            if (FileAssemblyCache.ContainsKey(dataSource) == true)
            {
                var assemblyLoadContext = FileAssemblyCache[dataSource];
                entryAssembly = assemblyLoadContext.Assemblies.FirstOrDefault();
            }
            else
            {
                var compiler = new Compiler();
                Tuple<byte[]?, string?>? compiledResult = isFileSource == true ? compiler.CompileFile(dataSource) : compiler.CompileText(dataSource);
                if (compiledResult != null)
                {
                    var compiledAssembly = compiledResult.Item1;
                    var errorText = compiledResult.Item2;
                    if (string.IsNullOrEmpty(errorText) == true && compiledAssembly != null)
                    {
                        using (var asm = new MemoryStream(compiledAssembly))
                        {
                            var assemblyLoadContext = new UnloadableAssemblyLoadContext();
                            entryAssembly = assemblyLoadContext.LoadAssembliyFromStream(asm);

                            if (isFileSource == true)
                            {
                                FileAssemblyCache.Add(dataSource, assemblyLoadContext);
                            }
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException(errorText);
                    }
                }
            }

            if (entryAssembly != null && string.IsNullOrEmpty(typeName) == false && string.IsNullOrEmpty(methodName) == false && entryAssembly.GetTypes().Count() > 0)
            {
                var myType = entryAssembly.GetType(typeName);
                if (myType != null)
                {
                    object? myObject = null;
                    if (httpContext == null)
                    {
                        myObject = Activator.CreateInstance(myType);
                    }
                    else
                    {
                        myObject = Activator.CreateInstance(myType, [httpContext]);
                    }

                    MethodInfo? entry = myObject?.GetType().GetMethod(methodName);

                    if (entry != null)
                    {
                        result = entry.GetParameters().Length > 0
                            ? entry.Invoke(myObject, args)
                            : entry.Invoke(myObject, null);
                    }
                    else
                    {
                        throw new MissingMethodException($"queryID: {queryID}, typeName: {typeName}, methodName: {methodName} 확인 필요");
                    }
                }
                else
                {
                    throw new NotImplementedException($"queryID: {queryID}, typeName: {typeName} 확인 필요");
                }
            }

            return result;
        }

        public object? ExecuteAndUnload(HttpContext? httpContext, Tuple<byte[]?, string?>? compiledResult, string typeName, string methodName, params string[] args)
        {
            object? result = null;
            if (compiledResult != null)
            {
                var compiledAssembly = compiledResult.Item1;
                var errorText = compiledResult.Item2;
                if (string.IsNullOrEmpty(errorText) == false && compiledAssembly != null)
                {
                    var executeResult = LoadAndExecute(httpContext, compiledAssembly, typeName, methodName, args);

                    for (var i = 0; i < 8 && executeResult.Item2.IsAlive; i++)
                    {
                        GC.Collect();
                        GC.WaitForPendingFinalizers();
                    }

                    result = executeResult.Item1;
                }
            }

            return result;
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private Tuple<object?, WeakReference> LoadAndExecute(HttpContext? httpContext, byte[] compiledAssembly, string typeName, string methodName, params string[] args)
        {
            Tuple<object?, WeakReference>? result = null;
            using (var asm = new MemoryStream(compiledAssembly))
            using (var assemblyLoadContext = new UnloadableAssemblyLoadContext())
            {
                var assembly = assemblyLoadContext.LoadAssembliyFromStream(asm);

                object? executeResult = null;
                MethodInfo? entry = null;
                if (string.IsNullOrEmpty(typeName) == false && string.IsNullOrEmpty(methodName) == false && assembly != null && assembly.GetTypes().Count() > 0)
                {
                    var myType = assembly.GetType(typeName);
                    if (myType != null)
                    {
                        object? myObject;
                        if (httpContext == null)
                        {
                            myObject = Activator.CreateInstance(myType);
                        }
                        else
                        {
                            myObject = Activator.CreateInstance(myType, [httpContext]);
                            myObject = null;
                        }

                        entry = myObject?.GetType().GetMethod(methodName);

                        if (entry != null)
                        {
                            executeResult = entry.GetParameters().Length > 0
                                ? entry.Invoke(myObject, new object[] { args })
                                : entry.Invoke(myObject, null);
                        }
                    }
                }

                result = new Tuple<object?, WeakReference>(executeResult, new WeakReference(assemblyLoadContext));
            }

            return result;
        }
    }
}
