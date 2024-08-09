using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace handsonapp
{
    public class Program
    {
        public static FileSyncManager? SQLFileSyncManager = null;
        public static FileSyncManager? CsharpFileSyncManager = null;
        public static FileSyncManager? NodeFileSyncManager = null;
        public static FileSyncManager? BusinessFileSyncManager = null;

        public static string handstackHomePath = string.Empty;
        public static bool useContractFileSync = false;
        public static bool useContractUrlSync = false;
        public static string handstackUrl = string.Empty;
        public static string hostAccessID = string.Empty;
        public static string workingDirectory = string.Empty;

        public static async Task Main(string[] args)
        {
            Console.WriteLine($"Current Directory from {Directory.GetCurrentDirectory()}");
            Console.WriteLine($"Launched from {Environment.CurrentDirectory}");
            Console.WriteLine($"Physical location {AppDomain.CurrentDomain.BaseDirectory}");
            Console.WriteLine($"Runtime call {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");

            int port = 0;

            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--debug":
                        await Task.Delay(10000);
                        break;
                    case "--port":
                        if (i + 1 < args.Length && int.TryParse(args[i + 1], out int argsParsedPort))
                        {
                            port = argsParsedPort;
                            i++;
                        }
                        break;
                    case "--handstackPath":
                        if (i + 1 < args.Length)
                        {
                            handstackHomePath = args[i + 1];
                            i++;
                        }
                        break;
                    case "--contractFileSync":
                        if (i + 1 < args.Length && bool.TryParse(args[i + 1], out bool argsUseContractFileSync))
                        {
                            useContractFileSync = argsUseContractFileSync;
                            i++;
                        }
                        break;
                    case "--contractUrlSync":
                        if (i + 1 < args.Length && bool.TryParse(args[i + 1], out bool argsUseContractUrlSync))
                        {
                            useContractUrlSync = argsUseContractUrlSync;
                            i++;
                        }
                        break;
                    case "--handstackUrl":
                        if (i + 1 < args.Length)
                        {
                            handstackUrl = args[i + 1];
                            i++;
                        }
                        break;
                    case "--hostAccessID":
                        if (i + 1 < args.Length)
                        {
                            hostAccessID = args[i + 1];
                            i++;
                        }
                        break;
                    case "--workingDirectory":
                        if (i + 1 < args.Length)
                        {
                            workingDirectory = args[i + 1];
                            i++;
                        }
                        break;
                }
            }

            if (string.IsNullOrEmpty(workingDirectory) == false) {
                Environment.CurrentDirectory = workingDirectory;
            }

            string entryBasePath = Environment.CurrentDirectory;

            if (Directory.Exists(Path.Combine(Environment.CurrentDirectory, "wwwroot")) == false || Directory.Exists(Path.Combine(Environment.CurrentDirectory, "contracts")) == false)
            {
                Console.WriteLine($"{Environment.CurrentDirectory} handsonapp 디렉토리 확인 필요");
                Environment.Exit(-1);
            }

            var builder = new ConfigurationBuilder()
                .SetBasePath(Environment.CurrentDirectory)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

            IConfiguration configuration = builder.Build();

            if (port == 0)
            {
                string? definePort = configuration["Port"];
                if (int.TryParse(definePort, out int parsedPort) == true)
                {
                    port = parsedPort;
                }
            }

            if (port == 0)
            {
                port = 8080;
            }

            if (string.IsNullOrEmpty(handstackHomePath) == true)
            {
                handstackHomePath = configuration["HandStackBasePath"] ?? "";
            }

            if (useContractFileSync == false)
            {
                string isContractFileSync = configuration["UseContractFileSync"] ?? "false";
                if (bool.TryParse(isContractFileSync, out bool argsUseContractFileSync))
                {
                    useContractFileSync = argsUseContractFileSync;
                }
            }

            if (useContractUrlSync == false)
            {
                string isContractUrlSync = configuration["UseContractUrlSync"] ?? "false";
                if(bool.TryParse(isContractUrlSync, out bool argsUseContractUrlSync))
                {
                    useContractUrlSync = argsUseContractUrlSync;
                }
            }

            if (useContractUrlSync == true)
            {
                if (string.IsNullOrEmpty(handstackUrl) == true)
                {
                    handstackUrl = configuration["HandStackUrl"] ?? "";
                }

                if (string.IsNullOrEmpty(hostAccessID) == true)
                {
                    hostAccessID = configuration["HandStackHostAccessID"] ?? "";
                }
            }

            if (string.IsNullOrEmpty(handstackHomePath) == true)
            {
                handstackHomePath = Environment.GetEnvironmentVariable("HANDSTACK_HOME") ?? "";
            }

            Console.WriteLine($"UseContractFileSync {useContractFileSync}");
            Console.WriteLine($"HandStackBasePath {handstackHomePath}");
            Console.WriteLine($"UseContractUrlSync {useContractUrlSync}");
            Console.WriteLine($"HandStackUrl {handstackUrl}");

            var host = Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.Configure(app =>
                    {
                        app.UseDefaultFiles();

                        if (string.IsNullOrEmpty(handstackHomePath) == false && Directory.Exists(handstackHomePath) == true && File.Exists(Path.Combine(handstackHomePath, "app", "ack.dll")) == true)
                        {
                            string wwwRootBasePath = Path.Combine(handstackHomePath, "modules", "wwwroot", "wwwroot");
                            app.UseStaticFiles(new StaticFileOptions
                            {
                                FileProvider = new PhysicalFileProvider(wwwRootBasePath),
                                ServeUnknownFileTypes = true,
                                OnPrepareResponse = httpContext =>
                                {
                                    if (httpContext.Context.Request.Path.ToString().IndexOf("syn.loader.js") > -1)
                                    {
                                        if (httpContext.Context.Response.Headers.ContainsKey("Cache-Control") == true)
                                        {
                                            httpContext.Context.Response.Headers.Remove("Cache-Control");
                                        }

                                        httpContext.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");

                                        if (httpContext.Context.Response.Headers.ContainsKey("Expires") == false)
                                        {
                                            httpContext.Context.Response.Headers.Remove("Expires");
                                        }

                                        httpContext.Context.Response.Headers.Append("Expires", "-1");
                                    }

                                    if (httpContext.Context.Response.Headers.ContainsKey("p3p") == true)
                                    {
                                        httpContext.Context.Response.Headers.Remove("p3p");
                                        httpContext.Context.Response.Headers.Append("p3p", "CP=\"ALL ADM DEV PSAi COM OUR OTRo STP IND ONL\"");
                                    }
                                }
                            });
                            
                            var dbclientBasePath = Path.Combine(entryBasePath, "contracts", "dbclient");
                            if (Directory.Exists(dbclientBasePath) == true)
                            {
                                string destDbclientBasePath = Path.Combine(handstackHomePath, "modules", "dbclient", "Contracts", "dbclient");
                                string destContractDbclientBasePath = Path.Combine(handstackHomePath, "contracts", "dbclient");
                                SQLFileSyncManager = new FileSyncManager(dbclientBasePath, "*.xml");
                                SQLFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(dbclientBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(dbclientBasePath, "");
                                        if(useContractFileSync == true)
                                        {
                                            if (changeTypes == WatcherChangeTypes.Deleted)
                                            {
                                                File.Delete(destDbclientBasePath + destFilePath);
                                                File.Delete(destContractDbclientBasePath + destFilePath);
                                            }
                                            else
                                            {
                                                await CopyFileAsync(fileInfo.FullName, destDbclientBasePath + destFilePath);
                                                await CopyFileAsync(fileInfo.FullName, destContractDbclientBasePath + destFilePath);
                                            }
                                        }

                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("dbclient", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                SQLFileSyncManager.Start();
                            }

                            var functionCSharpBasePath = Path.Combine(entryBasePath, "contracts", "function", "csharp");
                            if (Directory.Exists(functionCSharpBasePath) == true)
                            {
                                string destFunctionCSharpBasePath = Path.Combine(handstackHomePath, "modules", "function", "Contracts", "function", "csharp");
                                string destContractFunctionCSharpBasePath = Path.Combine(handstackHomePath, "contracts", "function", "csharp");
                                CsharpFileSyncManager = new FileSyncManager(functionCSharpBasePath, "featureMain.cs|featureMeta.json|featureSQL.xml");
                                CsharpFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(functionCSharpBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(functionCSharpBasePath, "");
                                        if (useContractFileSync == true)
                                        {
                                            if (changeTypes == WatcherChangeTypes.Deleted)
                                            {
                                                File.Delete(destFunctionCSharpBasePath + destFilePath);
                                                File.Delete(destContractFunctionCSharpBasePath + destFilePath);
                                            }
                                            else
                                            {
                                                await CopyFileAsync(fileInfo.FullName, destFunctionCSharpBasePath + destFilePath);
                                                await CopyFileAsync(fileInfo.FullName, destContractFunctionCSharpBasePath + destFilePath);
                                            }
                                        }

                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("function_csharp", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                CsharpFileSyncManager.Start();
                            }

                            var functionNodeBasePath = Path.Combine(entryBasePath, "contracts", "function", "javascript");
                            if (Directory.Exists(functionNodeBasePath) == true)
                            {
                                NodeFileSyncManager = new FileSyncManager(functionNodeBasePath, "featureMain.js|featureMeta.json|featureSQL.xml");
                                NodeFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    string destFunctionNodeBasePath = Path.Combine(handstackHomePath, "modules", "function", "Contracts", "function", "javascript");
                                    string destContractFunctionNodeBasePath = Path.Combine(handstackHomePath, "contracts", "function", "javascript");
                                    if (fileInfo.FullName.IndexOf(functionNodeBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(functionNodeBasePath, "");
                                        if (useContractFileSync == true)
                                        {
                                            if (changeTypes == WatcherChangeTypes.Deleted)
                                            {
                                                File.Delete(destFunctionNodeBasePath + destFilePath);
                                                File.Delete(destContractFunctionNodeBasePath + destFilePath);
                                            }
                                            else
                                            {
                                                await CopyFileAsync(fileInfo.FullName, destFunctionNodeBasePath + destFilePath);
                                                await CopyFileAsync(fileInfo.FullName, destContractFunctionNodeBasePath + destFilePath);
                                            }
                                        }

                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("function_javascript", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                NodeFileSyncManager.Start();
                            }

                            var transactBasePath = Path.Combine(entryBasePath, "contracts", "transact");
                            if (Directory.Exists(transactBasePath) == true)
                            {
                                string destTransactBasePath = Path.Combine(handstackHomePath, "modules", "transact", "Contracts", "transact");
                                string destContractTransactBasePath = Path.Combine(handstackHomePath, "contracts", "transact");
                                SQLFileSyncManager = new FileSyncManager(transactBasePath, "*.json");
                                SQLFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(transactBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(transactBasePath, "");
                                        if (useContractFileSync == true)
                                        {
                                            if (changeTypes == WatcherChangeTypes.Deleted)
                                            {
                                                File.Delete(destTransactBasePath + destFilePath);
                                                File.Delete(destContractTransactBasePath + destFilePath);
                                            }
                                            else
                                            {
                                                await CopyFileAsync(fileInfo.FullName, destTransactBasePath + destFilePath);
                                                await CopyFileAsync(fileInfo.FullName, destContractTransactBasePath + destFilePath);
                                            }
                                        }

                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("transact", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                SQLFileSyncManager.Start();
                            }
                        }
                        else if (string.IsNullOrEmpty(handstackUrl) == false)
                        {
                            var dbclientBasePath = Path.Combine(entryBasePath, "contracts", "dbclient");
                            if (Directory.Exists(dbclientBasePath) == true)
                            {
                                SQLFileSyncManager = new FileSyncManager(dbclientBasePath, "*.xml");
                                SQLFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(dbclientBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(dbclientBasePath, "");
                                        await UploadFileAsync("dbclient", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                    }
                                };

                                SQLFileSyncManager.Start();
                            }

                            var functionCSharpBasePath = Path.Combine(entryBasePath, "contracts", "function", "csharp");
                            if (Directory.Exists(functionCSharpBasePath) == true)
                            {
                                CsharpFileSyncManager = new FileSyncManager(functionCSharpBasePath, "featureMain.cs|featureMeta.json|featureSQL.xml");
                                CsharpFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(functionCSharpBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(functionCSharpBasePath, "");
                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("function_csharp", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                CsharpFileSyncManager.Start();
                            }

                            var functionNodeBasePath = Path.Combine(entryBasePath, "contracts", "function", "javascript");
                            if (Directory.Exists(functionNodeBasePath) == true)
                            {
                                NodeFileSyncManager = new FileSyncManager(functionNodeBasePath, "featureMain.js|featureMeta.json|featureSQL.xml");
                                NodeFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(functionNodeBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(functionNodeBasePath, "");
                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("function_javascript", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                NodeFileSyncManager.Start();
                            }

                            var transactBasePath = Path.Combine(entryBasePath, "contracts", "transact");
                            if (Directory.Exists(transactBasePath) == true)
                            {
                                SQLFileSyncManager = new FileSyncManager(transactBasePath, "*.json");
                                SQLFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.IndexOf(transactBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        string destFilePath = fileInfo.FullName.Replace(transactBasePath, "");
                                        if (string.IsNullOrEmpty(handstackUrl) == false)
                                        {
                                            await UploadFileAsync("transact", fileInfo.FullName, destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                SQLFileSyncManager.Start();
                            }
                        }
                        app.UseStaticFiles();

                        app.UseRouting();
                        app.UseEndpoints(endpoints =>
                        {
                            endpoints.MapGet("/", () => "Hello World!");
                        });
                    });
                    webBuilder.UseKestrel((options) =>
                    {
                        options.ListenAnyIP(port);
                        options.AddServerHeader = false;
                    });
                })
                .Build();

            host.Run();
        }

        static async Task CopyFileAsync(string sourceFilePath, string destAbsoluteFilePath)
        {
            if (File.Exists(sourceFilePath) == true)
            {
                using (FileStream sourceStream = new FileStream(sourceFilePath, FileMode.Open, FileAccess.Read))
                using (FileStream destStream = new FileStream(destAbsoluteFilePath, FileMode.OpenOrCreate, FileAccess.Write, FileShare.ReadWrite))
                {
                    string sourceFileName = Path.GetFileName(sourceFilePath);

                    try
                    {
                        await sourceStream.CopyToAsync(destStream);
                        Console.WriteLine($"{sourceFileName} 복사 완료");
                    }
                    catch (Exception exception)
                    {
                        Console.WriteLine($"{sourceFileName} 복사 실패. {exception.Message}");
                    }
                }
            }
        }

        static async Task UploadFileAsync(string moduleName, string sourceFilePath, string destRelativeFilePath, string changeType)
        {
            if (File.Exists(sourceFilePath))
            {
                using (var httpClient = new HttpClient())
                using (var form = new MultipartFormDataContent())
                using (var fileStream = new FileStream(sourceFilePath, FileMode.Open, FileAccess.Read))
                {
                    string sourceFileName = Path.GetFileName(sourceFilePath);

                    try
                    {
                        var streamContent = new StreamContent(fileStream);
                        form.Add(streamContent, "file", sourceFileName);
                        form.Add(new StringContent(moduleName), "moduleName");
                        form.Add(new StringContent(destRelativeFilePath), "destFilePath");
                        form.Add(new StringContent(changeType), "changeType");

                        httpClient.DefaultRequestHeaders.Add("hostAccessID", hostAccessID);

                        HttpResponseMessage response = await httpClient.PostAsync(handstackUrl, form);
                        if (response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"{sourceFileName} 업로드 완료");
                        }
                        else
                        {
                            Console.WriteLine($"{sourceFileName} 업로드 실패. {response.StatusCode}");
                        }
                    }
                    catch (Exception exception)
                    {
                        Console.WriteLine($"{sourceFileName} 업로드 실패. {exception.Message}");
                    }
                }
            }
        }
    }
}
