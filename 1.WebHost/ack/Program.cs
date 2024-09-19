using System;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Versioning;
using System.Text;
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

            var version = Assembly.GetEntryAssembly()?
                .GetCustomAttribute<TargetFrameworkAttribute>()?
                .FrameworkName;

            Console.WriteLine($"Current .NET Core version: {version}");
            Console.WriteLine($"Current Directory from {Directory.GetCurrentDirectory()}");
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

            var optionPort = new Option<int?>("--port", description: "프로그램 수신 포트를 설정합니다. (기본값: 8000)");
            var optionDebug = new Option<bool?>("--debug", description: "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)");
            var optionDelay = new Option<int?>("--delay", description: "프로그램 시작시 지연 시간(밀리초)을 설정합니다. (기본값: 10000)");
            var optionProcessName = new Option<string?>("--pname", description: "관리 업무 목적으로 부여한 프로세스 이름입니다");
            var optionKey = new Option<string?>(name: "--key", description: "ack 프로그램 실행 검증키입니다");
            var optionAppSettings = new Option<string?>(name: "--appsettings", description: "ack 프로그램 appsettings 파일명입니다");

            var rootOptionModules = new Option<string?>("--modules", description: "프로그램 시작시 포함할 모듈을 설정합니다. 예) --modules=wwwroot,transact,dbclient,function");

            var rootCommand = new RootCommand("IT 혁신은 고객과 업무에 들여야 하는 시간과 노력을 줄이는 데 있습니다. HandStack은 기업 경쟁력 유지를 위한 도구입니다") {
                optionDebug, optionDelay, optionPort, rootOptionModules, optionKey, optionAppSettings, optionProcessName
            };

            rootCommand.SetHandler(async (debug, delay, port, modules, key, settings, pname) =>
            {
                await DebuggerAttach(args, debug, delay);

                try
                {
                    if (string.IsNullOrEmpty(pname) == false)
                    {
                        GlobalConfiguration.ProcessName = pname;
                    }

                    IConfigurationRoot configuration;
                    string appSettingsFilePath = Path.Combine(GlobalConfiguration.EntryBasePath, "appsettings.json");
                    Console.WriteLine($"appSettings.json FilePath {appSettingsFilePath}");
                    var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
                    configurationBuilder.AddEnvironmentVariables();

                    if (string.IsNullOrEmpty(key) == false && string.IsNullOrEmpty(settings) == false)
                    {
                        byte[] buffer = Encoding.UTF8.GetBytes(settings.DecryptAES(key));
                        using MemoryStream stream = new MemoryStream(buffer);
                        configurationBuilder = configurationBuilder.AddJsonStream(stream);

                        configuration = configurationBuilder.Build();
                    }
                    else
                    {
                        string environmentFileName = $"appsettings.{environmentName}.json";
                        if (File.Exists(Path.Combine(GlobalConfiguration.EntryBasePath, environmentFileName)) == true)
                        {
                            configuration = configurationBuilder.AddJsonFile(environmentFileName).Build();
                        }
                        else
                        {
                            configuration = configurationBuilder.Build();
                        }
                    }

                    GlobalConfiguration.ConfigurationRoot = configuration;

                    var loggerConfiguration = new LoggerConfiguration()
                        .ReadFrom.Configuration(configuration);

                    if (string.IsNullOrEmpty(GlobalConfiguration.ProcessName) == false)
                    {
                        var writeToSection = configuration.GetSection("Serilog:WriteTo");
                        foreach (var childSection in writeToSection.GetChildren())
                        {
                            var sinkName = childSection.GetValue<string>("Name");
                            var sinkArgs = childSection.GetSection("Args").GetChildren().ToDictionary(x => x.Key, x => x.Value);
                            if (sinkName == "File")
                            {
                                var sinkFilePath = sinkArgs["path"];
                                if (string.IsNullOrEmpty(sinkFilePath) == false)
                                {
                                    FileInfo fileInfo = new FileInfo(sinkFilePath);
                                    if (string.IsNullOrEmpty(fileInfo.DirectoryName) == false)
                                    {
                                        if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                                        {
                                            Directory.CreateDirectory(fileInfo.DirectoryName);
                                        }

                                        sinkFilePath = Path.Combine(fileInfo.DirectoryName, GlobalConfiguration.ProcessName + "_" + fileInfo.Name);

                                        loggerConfiguration.WriteTo.File(
                                            path: sinkFilePath
                                        );
                                    }
                                }
                            }
                        }
                    }

                    Log.Logger = loggerConfiguration.CreateLogger();

                    int listenPort = (port == null ? 8000 : (int)port);
                    if (SocketExtensions.PortInUse(listenPort) == true)
                    {
                        Log.Error($"{listenPort} 포트는 이미 사용중입니다. 참고 명령어) netstat -ano | findstr {listenPort}");
                        exitCode = -1;
                        return;
                    }

                    if (string.IsNullOrEmpty(modules) == false)
                    {
                        var loadModules = modules.Split(",");
                        foreach (var item in loadModules)
                        {
                            string module = item.Trim();
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

                    AppDomain.CurrentDomain.UnhandledException += new UnhandledExceptionEventHandler(HandleException);

                    await applicationManager.StartAsync(listenPort, args, configuration);
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "프로그램 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            }, optionDebug, optionDelay, optionPort, rootOptionModules, optionKey, optionAppSettings, optionProcessName);

            await rootCommand.InvokeAsync(args);
            return exitCode;
        }

        static void HandleException(object sender, UnhandledExceptionEventArgs e)
        {
            Exception exception = (Exception)e.ExceptionObject;

            GlobalConfiguration.UnhandledExceptions.Add(exception);

            Console.WriteLine("처리 되지 않은 오류가 발생했습니다: " + exception.Message);
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
