using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Web;

using Microsoft.Extensions.Configuration;

using Serilog;

namespace ack
{
    public class Program
    {
        private static System.Timers.Timer? startupAwaitTimer;
        private static CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();

        public static async Task<int> Main(string[] args)
        {
            int exitCode = 0;

            Console.WriteLine($"Launched from {Environment.CurrentDirectory}");
            Console.WriteLine($"Physical location {AppDomain.CurrentDomain.BaseDirectory}");
            Console.WriteLine($"Runtime call {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");

            GlobalConfiguration.EntryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists("entrybasepath.txt") == true)
            {
                string entryBasePath = File.ReadAllText("entrybasepath.txt");
                if (string.IsNullOrEmpty(entryBasePath) == false)
                {
                    GlobalConfiguration.EntryBasePath = entryBasePath;
                }
            }

            if (string.IsNullOrEmpty(GlobalConfiguration.EntryBasePath) == true)
            {
                GlobalConfiguration.EntryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            }

            if (GlobalConfiguration.EntryBasePath != Environment.CurrentDirectory)
            {
                Environment.CurrentDirectory = GlobalConfiguration.EntryBasePath;
            }

            var environmentName = Environment.GetEnvironmentVariable("ACK_ENVIRONMENT");
            if (string.IsNullOrEmpty(environmentName) == true)
            {
                environmentName = "";
            }

            IConfigurationRoot configuration;
            string appSettingsFilePath = Path.Combine(GlobalConfiguration.EntryBasePath, "appsettings.json");
            Console.WriteLine($"appSettings.json FilePath {appSettingsFilePath}");
            var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
            configurationBuilder.AddEnvironmentVariables();

            string environmentFileName = $"appsettings.{environmentName}.json";
            if (File.Exists(Path.Combine(GlobalConfiguration.EntryBasePath, environmentFileName)) == true)
            {
                configuration = configurationBuilder.AddJsonFile(environmentFileName).Build();
            }
            else
            {
                configuration = configurationBuilder.Build();
            }

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();

            var optionFile = new Option<FileInfo?>(name: "--file", description: "handstack 프로그램 전체 파일 경로입니다");
            var optionArguments = new Option<string?>("--arguments", description: "handstack 프로그램 실행시 전달할 매개변수 입니다. 예) \"--modules=wwwroot,transact,dbclient,function\"");
            var optionPort = new Option<int?>("--port", description: "프로그램 수신 포트를 설정합니다. (기본값: 8080)");
            var optionDebug = new Option<bool?>("--debug", description: "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)");
            var optionDelay = new Option<int?>("--delay", description: "프로그램 시작시 지연 시간(밀리초)을 설정합니다. (기본값: 10000)");
            var optionProcessID = new Option<int>("--pid", description: "OS에서 부여한 프로세스 ID 입니다");

            var rootOptionModules = new Option<string?>("--modules", description: "프로그램 시작시 포함할 모듈을 설정합니다. 예) --modules=wwwroot,transact,dbclient,function");

            var rootCommand = new RootCommand("IT 혁신은 고객과 업무에 들여야 하는 시간과 노력을 줄이는 데 있습니다. HandStack은 기업 경쟁력 유지를 위한 도구입니다") {
                optionDebug, optionDelay, optionPort, rootOptionModules
            };

            rootCommand.SetHandler(async (debug, delay, port, modules) =>
            {
                await DebuggerAttach(args, debug, delay);

                try
                {
                    int listenPort = (port == null ? 8080 : (int)port);
                    if (SocketExtensions.PortInUse(listenPort) == true)
                    {
                        Log.Error($"{listenPort} 포트는 이미 사용중입니다. 참고 명령어) netstat -ano | findstr {listenPort}");
                        exitCode = -1;
                        return;
                    }

                    if (string.IsNullOrEmpty(modules) == false)
                    {
                        var runningModules = modules.Split(",");
                        foreach (var runningModule in runningModules)
                        {
                            string module = runningModule.Trim();
                            if (string.IsNullOrEmpty(module) == false)
                            {
                                GlobalConfiguration.ModuleNames.Add(module);
                            }
                        }
                    }
                    else
                    {
                        var loadModules = configuration.GetSection("AppSettings").GetSection("LoadModules").AsEnumerable();
                        if (loadModules != null && loadModules.Any() == true)
                        {
                            foreach (var item in loadModules)
                            {
                                if (string.IsNullOrEmpty(item.Value) == false)
                                {
                                    GlobalConfiguration.ModuleNames.Add(item.Value);
                                }
                            }
                        }
                    }

                    Log.Information($"ACK_ENVIRONMENT: {environmentName}, TargetFramework: {AppContext.TargetFrameworkName}, BaseDirectory: {AppContext.BaseDirectory} ");

                    try
                    {
                        if (File.Exists("bootstraping-ignore.json") == true)
                        {
                            string ignoreKey = File.ReadAllText("bootstraping-ignore.json");
                            GlobalConfiguration.ByPassBootstrappingLoggingKey = ignoreKey.Split("\n").ToList();
                        }
                    }
                    catch
                    {
                    }

                    var applicationManager = ApplicationManager.Load();

                    Console.CancelKeyPress += (sender, eventArgs) =>
                    {
                        eventArgs.Cancel = true;
                        applicationManager.Stop();
                    };

                    await applicationManager.StartAsync(listenPort, args, configuration);
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "프로그램 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            }, optionDebug, optionDelay, optionPort, rootOptionModules);

            await rootCommand.InvokeAsync(args);
            return exitCode;
        }

        private static async Task DebuggerAttach(string[] args, bool? debug, int? delay)
        {
            ArgumentHelper arguments = new ArgumentHelper(args);
            if (debug != null && debug == true)
            {
                int startupAwaitDelay = 10000;
                if (delay != null)
                {
                    startupAwaitDelay = (int)delay;
                }

                startupAwaitTimer = new System.Timers.Timer(1000);
                startupAwaitTimer.Elapsed += (object? sender, System.Timers.ElapsedEventArgs e) =>
                {
                    if (startupAwaitTimer != null && Debugger.IsAttached == true)
                    {
                        startupAwaitTimer.Stop();
                        cancellationTokenSource.Cancel();
                    }
                };
                startupAwaitTimer.Start();

                try
                {
                    await Task.Delay(startupAwaitDelay, cancellationTokenSource.Token);
                }
                catch
                {
                }

                if (Debugger.IsAttached == true)
                {
                    Debugger.Break();
                }
            }
        }
    }
}
