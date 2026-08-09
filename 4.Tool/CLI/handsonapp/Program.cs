using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

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
        public static FileSyncManager? WWWFileSyncManager = null;
        public static readonly List<FileSyncManager> ContractFileSyncManagers = new List<FileSyncManager>();
        private static readonly (string ContractType, string Filter)[] ContractSyncTargets =
        {
            ("dbclient", "*.xml|*.dbc"),
            ("graphclient", "*.xml|*.cyp"),
            ("function", "*.xml|*.fnc|featureMain.cs|featureMain.js|featureMain.py|featureMeta.json|featureSQL.xml"),
            ("transact", "*.json|*.txn"),
            ("command", "*.xml|*.bas"),
            ("prompter", "*.xml|*.pmt"),
            ("repository", "*.json|*.rpo")
        };

        public static string moduleID = string.Empty;
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

            var port = 0;

            for (var i = 0; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--debug":
                        await Task.Delay(10000);
                        break;
                    case "--port":
                        if (i + 1 < args.Length && int.TryParse(args[i + 1], out var argsParsedPort))
                        {
                            port = argsParsedPort;
                            i++;
                        }
                        break;
                    case "--moduleID":
                        if (i + 1 < args.Length)
                        {
                            moduleID = args[i + 1];
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
                        if (i + 1 < args.Length && bool.TryParse(args[i + 1], out var argsUseContractFileSync))
                        {
                            useContractFileSync = argsUseContractFileSync;
                            i++;
                        }
                        break;
                    case "--contractUrlSync":
                        if (i + 1 < args.Length && bool.TryParse(args[i + 1], out var argsUseContractUrlSync))
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

            if (string.IsNullOrWhiteSpace(workingDirectory) == false)
            {
                Environment.CurrentDirectory = workingDirectory;
            }

            var entryBasePath = Environment.CurrentDirectory;

            if (Directory.Exists(PathExtensions.Combine(Environment.CurrentDirectory, "wwwroot")) == false || Directory.Exists(PathExtensions.Combine(Environment.CurrentDirectory, "contracts")) == false)
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
                var definePort = configuration["Port"];
                if (int.TryParse(definePort, out var parsedPort) == true)
                {
                    port = parsedPort;
                }
            }

            if (port == 0)
            {
                port = 8080;
            }

            if (string.IsNullOrWhiteSpace(moduleID) == true)
            {
                moduleID = configuration["SyncModuleName"] ?? "";
            }

            if (string.IsNullOrWhiteSpace(moduleID) == true)
            {
                Console.WriteLine($"SyncModuleName: {moduleID} 확인 필요");
                Environment.Exit(-1);
            }

            if (string.IsNullOrWhiteSpace(handstackHomePath) == true)
            {
                handstackHomePath = configuration["HandStackBasePath"] ?? "";
            }

            if (useContractFileSync == false)
            {
                var isContractFileSync = configuration["UseContractFileSync"] ?? "false";
                if (bool.TryParse(isContractFileSync, out var argsUseContractFileSync))
                {
                    useContractFileSync = argsUseContractFileSync;
                }
            }

            if (useContractUrlSync == false)
            {
                var isContractUrlSync = configuration["UseContractUrlSync"] ?? "false";
                if (bool.TryParse(isContractUrlSync, out var argsUseContractUrlSync))
                {
                    useContractUrlSync = argsUseContractUrlSync;
                }
            }

            if (useContractUrlSync == true)
            {
                if (string.IsNullOrWhiteSpace(handstackUrl) == true)
                {
                    handstackUrl = configuration["HandStackUrl"] ?? "";
                }

                if (string.IsNullOrWhiteSpace(hostAccessID) == true)
                {
                    hostAccessID = configuration["HandStackHostAccessID"] ?? "";
                }
            }

            if (string.IsNullOrWhiteSpace(handstackHomePath) == true)
            {
                handstackHomePath = Environment.GetEnvironmentVariable("HANDSTACK_HOME") ?? "";
                if (string.IsNullOrWhiteSpace(handstackHomePath))
                {
                    Console.WriteLine("HANDSTACK_HOME 환경변수가 설정되지 않았습니다.");
                    Environment.Exit(1);
                }
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

                        if (string.IsNullOrWhiteSpace(handstackHomePath) == false && Directory.Exists(handstackHomePath) == true && File.Exists(PathExtensions.Combine(handstackHomePath, "app", "ack.dll")) == true)
                        {
                            var wwwRootBasePath = PathExtensions.Combine(handstackHomePath, "modules", "wwwroot", "wwwroot");
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

                            StartContractFileSyncManagers(entryBasePath, useContractFileSync);

                            var wwwrootBasePath = PathExtensions.Combine(entryBasePath, "wwwroot", moduleID);
                            if (Directory.Exists(wwwrootBasePath) == true)
                            {
                                var destWWWRootBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "wwwroot", moduleID);
                                WWWFileSyncManager = new FileSyncManager(wwwrootBasePath, "*.html|*.css|*.js|*.json");
                                WWWFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.Replace("\\", "/").IndexOf(wwwrootBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        var destFilePath = fileInfo.FullName.Replace("\\", "/").Replace(PathExtensions.Combine(wwwrootBasePath, "wwwroot"), "");
                                        if (useContractFileSync == true)
                                        {
                                            if (changeTypes == WatcherChangeTypes.Deleted)
                                            {
                                                File.Delete(destWWWRootBasePath + destFilePath);
                                            }
                                            else
                                            {
                                                await CopyFileAsync(fileInfo.FullName.Replace("\\", "/"), destWWWRootBasePath + destFilePath);
                                            }
                                        }

                                        if (string.IsNullOrWhiteSpace(handstackUrl) == false)
                                        {
                                            await UploadFileAsync(moduleID, "wwwroot", fileInfo.FullName.Replace("\\", "/"), destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                WWWFileSyncManager.Start();
                            }
                        }
                        else if (string.IsNullOrWhiteSpace(handstackUrl) == false)
                        {
                            StartContractFileSyncManagers(entryBasePath, false);

                            var wwwrootBasePath = PathExtensions.Combine(entryBasePath, "contracts", "wwwroot");
                            if (Directory.Exists(wwwrootBasePath) == true)
                            {
                                WWWFileSyncManager = new FileSyncManager(wwwrootBasePath, "*.html|*.css|*.js|*.json");
                                WWWFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                                {
                                    if (fileInfo.FullName.Replace("\\", "/").IndexOf(wwwrootBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                                    {
                                        var destFilePath = fileInfo.FullName.Replace("\\", "/").Replace(PathExtensions.Combine(wwwrootBasePath, "wwwroot"), "");
                                        if (string.IsNullOrWhiteSpace(handstackUrl) == false)
                                        {
                                            await UploadFileAsync(moduleID, "wwwroot", fileInfo.FullName.Replace("\\", "/"), destFilePath, changeTypes.ToString());
                                        }
                                    }
                                };

                                WWWFileSyncManager.Start();
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

        static void StartContractFileSyncManagers(string entryBasePath, bool enableFileSync)
        {
            foreach (var target in ContractSyncTargets)
            {
                var sourceBasePath = PathExtensions.Combine(entryBasePath, "contracts", target.ContractType);
                if (Directory.Exists(sourceBasePath) == false)
                {
                    continue;
                }

                var destModuleBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "Contracts", target.ContractType);
                var destContractBasePath = PathExtensions.Combine(handstackHomePath, "contracts", target.ContractType);
                var fileSyncManager = new FileSyncManager(sourceBasePath, target.Filter);
                fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                {
                    var sourceFilePath = fileInfo.FullName.Replace("\\", "/");
                    var destFilePath = Path.GetRelativePath(sourceBasePath, fileInfo.FullName).Replace("\\", "/");

                    if (enableFileSync == true)
                    {
                        var destModuleFilePath = PathExtensions.Combine(destModuleBasePath, destFilePath);
                        var destContractFilePath = PathExtensions.Combine(destContractBasePath, destFilePath);
                        if (changeTypes == WatcherChangeTypes.Deleted)
                        {
                            File.Delete(destModuleFilePath);
                            File.Delete(destContractFilePath);
                        }
                        else
                        {
                            await CopyFileAsync(sourceFilePath, destModuleFilePath);
                            await CopyFileAsync(sourceFilePath, destContractFilePath);
                        }
                    }

                    if (string.IsNullOrWhiteSpace(handstackUrl) == false)
                    {
                        await UploadFileAsync(moduleID, target.ContractType, sourceFilePath, destFilePath, changeTypes.ToString());
                    }
                };

                ContractFileSyncManagers.Add(fileSyncManager);
                fileSyncManager.Start();
            }
        }

        static async Task CopyFileAsync(string sourceFilePath, string destAbsoluteFilePath)
        {
            if (File.Exists(sourceFilePath) == true)
            {
                var destDirectory = Path.GetDirectoryName(destAbsoluteFilePath);
                if (string.IsNullOrWhiteSpace(destDirectory) == false && Directory.Exists(destDirectory) == false)
                {
                    Directory.CreateDirectory(destDirectory);
                }

                using var sourceStream = new FileStream(sourceFilePath, FileMode.Open, FileAccess.Read);
                using var destStream = new FileStream(destAbsoluteFilePath, FileMode.Create, FileAccess.Write, FileShare.None);
                var sourceFileName = Path.GetFileName(sourceFilePath);

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

        static async Task UploadFileAsync(string moduleID, string contractType, string sourceFilePath, string destRelativeFilePath, string changeType)
        {
            if (changeType != WatcherChangeTypes.Deleted.ToString() && File.Exists(sourceFilePath) == false)
            {
                return;
            }

            using var httpClient = new HttpClient();
            using var form = new MultipartFormDataContent();
            var sourceFileName = Path.GetFileName(sourceFilePath);

            try
            {
                if (changeType != WatcherChangeTypes.Deleted.ToString())
                {
                    var fileStream = new FileStream(sourceFilePath, FileMode.Open, FileAccess.Read);
                    var streamContent = new StreamContent(fileStream);
                    form.Add(streamContent, "file", sourceFileName);
                }

                form.Add(new StringContent(moduleID), "moduleID");
                form.Add(new StringContent(contractType), "contractType");
                form.Add(new StringContent(destRelativeFilePath), "destFilePath");
                form.Add(new StringContent(changeType), "changeType");

                httpClient.DefaultRequestHeaders.Add("hostAccessID", hostAccessID);

                var response = await httpClient.PostAsync(handstackUrl, form);
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
