using System;
using System.Collections;
using System.CommandLine;
using System.CommandLine.Parsing;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.Versioning;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using ack.Updates;

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
        private static readonly CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();

        public static async Task<int> Main(string[] args)
        {
            var exitCode = 0;
            var version = Assembly.GetEntryAssembly()?
                .GetCustomAttribute<TargetFrameworkAttribute>()?
                .FrameworkName;

            Console.WriteLine($"Current .NET Core version: {version}");
            Console.WriteLine($"Current Directory from: {Directory.GetCurrentDirectory()}");
            Console.WriteLine($"Launched from: {Environment.CurrentDirectory}");
            Console.WriteLine($"Physical location: {AppDomain.CurrentDomain.BaseDirectory}");
            Console.WriteLine($"Runtime call: {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");

            GlobalConfiguration.EntryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists("entrybasepath.txt") == true)
            {
                var entryBasePath = File.ReadAllText("entrybasepath.txt");
                if (string.IsNullOrWhiteSpace(entryBasePath) == false)
                {
                    GlobalConfiguration.EntryBasePath = entryBasePath;
                }
            }

            if (string.IsNullOrWhiteSpace(GlobalConfiguration.EntryBasePath) == true)
            {
                GlobalConfiguration.EntryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            }

            if (GlobalConfiguration.EntryBasePath != Environment.CurrentDirectory)
            {
                Environment.CurrentDirectory = GlobalConfiguration.EntryBasePath;
            }

            var versionFilePath = Path.Combine(GlobalConfiguration.EntryBasePath, "version.json");
            var versionInfo = VersionFileStore.Ensure(versionFilePath, VersionFileStore.DefaultVersion);
            Console.WriteLine($"version.json: {versionFilePath}, version: {versionInfo.Version}, updatedAt: {versionInfo.UpdatedAt:O}");

            DotNetEnv.Env.Load(Path.Combine(AppContext.BaseDirectory, ".env"));

            if (OperatingSystem.IsWindows() == true)
            {
                await Task.Run(() =>
                {
                    var userVariables = Environment.GetEnvironmentVariables(EnvironmentVariableTarget.User);
                    var machineVariables = Environment.GetEnvironmentVariables(EnvironmentVariableTarget.Machine);

                    Parallel.ForEach(userVariables.Cast<DictionaryEntry>().Concat(machineVariables.Cast<DictionaryEntry>()), entry =>
                    {
                        try
                        {
                            Environment.SetEnvironmentVariable(entry.Key.ToStringSafe(), entry.Value.ToStringSafe(), EnvironmentVariableTarget.Process);
                        }
                        catch
                        {
                            // 환경 변수 설정 중 오류가 발생할 경우 무시하고 계속 진행
                        }
                    });
                });
            }

            Console.WriteLine($"EntryBasePath: {GlobalConfiguration.EntryBasePath}");

            var environmentName = Environment.GetEnvironmentVariable("ACK_ENVIRONMENT");
            if (string.IsNullOrWhiteSpace(environmentName) == true)
            {
                environmentName = "";
            }

            var optionPort = new Option<int?>("--port") { Description = "프로그램 수신 포트를 설정합니다. (기본값: 8421)" };
            var optionDebug = new Option<bool?>("--debug") { Description = "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)", DefaultValueFactory = parseResult => false };
            var optionDelay = new Option<int?>("--delay") { Description = "프로그램 시작시 지연 시간(밀리초)을 설정합니다. (기본값: 10000)", DefaultValueFactory = parseResult => 10000 };
            var optionProcessName = new Option<string?>("--pname") { Description = "관리 업무 목적으로 부여한 프로세스 이름입니다" };
            var optionKey = new Option<string?>("--key") { Description = "ack 프로그램 실행 검증키입니다" };
            var optionAppSettings = new Option<string?>("--appsettings") { Description = "ack 프로그램 appsettings 파일명입니다" };
            var optionEnv = new Option<string?>("--env") { Description = "env 문자열을 로드합니다. (예: OK=GOOD\nTEST=\"more stuff\"" };
            var optionShowEnv = new Option<string?>("--showenv") { Description = "ack 프로그램 시작할 때 적용되는 환경설정을 출력합니다. (기본값: false)" };
            var rootOptionModules = new Option<string?>("--modules") { Description = "프로그램 시작시 포함할 모듈을 설정합니다. 예) --modules=wwwroot,transact,dbclient,function" };

            var rootCommand = new RootCommand("IT 혁신은 고객과 업무에 들여야 하는 시간과 노력을 줄이는 데 있습니다. HandStack은 기업 경쟁력 유지를 위한 도구입니다") {
                optionDebug, optionDelay, optionPort, rootOptionModules, optionKey, optionAppSettings, optionProcessName, optionEnv, optionShowEnv
            };

            rootCommand.SetAction(async (parseResult) =>
            {
                var debug = parseResult.GetValue(optionDebug);
                var delay = parseResult.GetValue(optionDelay);
                var port = parseResult.GetValue(optionPort);
                var modules = parseResult.GetValue(rootOptionModules);
                var key = parseResult.GetValue(optionKey);
                var settings = parseResult.GetValue(optionAppSettings);
                var pname = parseResult.GetValue(optionProcessName);
                var env = parseResult.GetValue(optionEnv);
                var showenv = parseResult.GetValue(optionShowEnv);

                await DebuggerAttach(args, debug, delay);

                try
                {
                    if (string.IsNullOrWhiteSpace(env) == false)
                    {
                        DotNetEnv.Env.LoadContents(env);
                    }

                    if (string.IsNullOrWhiteSpace(pname) == false)
                    {
                        GlobalConfiguration.ProcessName = pname;
                    }

                    IConfigurationRoot configuration;
                    var appSettingsFilePath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "appsettings.json");
                    Console.WriteLine($"appSettings.json FilePath {appSettingsFilePath}");
                    var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
                    configurationBuilder.AddEnvironmentVariables();

                    if (string.IsNullOrWhiteSpace(key) == false && string.IsNullOrWhiteSpace(settings) == false)
                    {
                        var buffer = Encoding.UTF8.GetBytes(settings.DecryptAES(key));
                        using var stream = new MemoryStream(buffer);
                        configurationBuilder = configurationBuilder.AddJsonStream(stream);

                        configuration = configurationBuilder.Build();
                    }
                    else
                    {
                        var environmentFileName = $"appsettings.{environmentName}.json";
                        if (File.Exists(PathExtensions.Combine(GlobalConfiguration.EntryBasePath, environmentFileName)) == true)
                        {
                            configuration = configurationBuilder.AddJsonFile(environmentFileName).Build();
                        }
                        else
                        {
                            configuration = configurationBuilder.Build();
                        }
                    }

                    GlobalConfiguration.ConfigurationRoot = configuration;

                    var isAutoUpdate = IsAutoUpdateEnabled(configuration);
                    if (isAutoUpdate == true)
                    {
                        _ = Task.Run(() => TryLaunchUpdaterIfUpdateAvailableAsync(configuration, versionInfo));
                    }
                    else
                    {
                        Log.Information("[Program] AppSettings:IsAutoUpdate=false로 updater 자동 실행을 건너뜁니다.");
                    }

                    if (string.IsNullOrWhiteSpace(GlobalConfiguration.ProcessName) == false)
                    {
                        var writeToSection = configuration.GetSection("Serilog:WriteTo");
                        foreach (var childSection in writeToSection.GetChildren())
                        {
                            var sinkName = childSection.GetValue<string>("Name");
                            if (sinkName == "File")
                            {
                                var sinkFilePath = childSection.GetValue<string>("Args:path");
                                if (string.IsNullOrWhiteSpace(sinkFilePath) == false)
                                {
                                    var fileInfo = new FileInfo(sinkFilePath);
                                    if (string.IsNullOrWhiteSpace(fileInfo.DirectoryName) == false)
                                    {
                                        if (fileInfo.Directory?.Exists == false)
                                        {
                                            Directory.CreateDirectory(fileInfo.DirectoryName);
                                        }

                                        var newPath = PathExtensions.Combine(fileInfo.DirectoryName, $"{GlobalConfiguration.ProcessName}_{fileInfo.Name}");
                                        configuration[$"Serilog:WriteTo:{childSection.Key}:Args:path"] = newPath;
                                    }
                                }
                            }
                        }
                    }

                    var loggerConfiguration = new LoggerConfiguration()
                        .ReadFrom.Configuration(configuration);

                    Log.Logger = loggerConfiguration.CreateLogger();

                    GlobalConfiguration.ServerPort = port ?? int.Parse(configuration["AppSettings:ServerPort"].ToStringSafe("8421"));
                    GlobalConfiguration.OriginPort = int.Parse(configuration["AppSettings:OriginPort"].ToStringSafe(GlobalConfiguration.ServerPort.ToString()));

                    GlobalConfiguration.ServerDevCertSslPort = int.Parse(configuration["AppSettings:ServerDevCertSslPort"].ToStringSafe("8443"));
                    GlobalConfiguration.ServerDevCertFilePath = configuration["AppSettings:ServerDevCertFilePath"].ToStringSafe();
                    GlobalConfiguration.ServerDevCertPassword = configuration["AppSettings:ServerDevCertPassword"];

                    var listenPort = GlobalConfiguration.ServerPort;
                    if (SocketExtensions.PortInUse(listenPort) == true)
                    {
                        Log.Error($"{listenPort} 포트는 이미 사용중입니다. 참고 명령어) netstat -ano | findstr {listenPort}");
                        exitCode = -1;
                        return;
                    }

                    GlobalConfiguration.ExternalIPAddress = await GetExternalIPAddress();

                    if (string.IsNullOrWhiteSpace(modules) == false)
                    {
                        var loadModules = modules.Split(',', StringSplitOptions.RemoveEmptyEntries);
                        foreach (var item in loadModules)
                        {
                            var module = item.Trim();
                            if (string.IsNullOrWhiteSpace(module) == false)
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
                                if (string.IsNullOrWhiteSpace(item.Value) == false)
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
                            var ignoreKey = await File.ReadAllTextAsync("bootstraping-ignore.json");
                            GlobalConfiguration.ByPassBootstrappingLoggingKey = ignoreKey.Split('\n').ToList();
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
                        Environment.Exit(0);
                    };

                    AppDomain.CurrentDomain.UnhandledException += new UnhandledExceptionEventHandler(HandleException);

                    Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

                    Console.OutputEncoding = Encoding.UTF8;
                    Console.InputEncoding = Encoding.UTF8;

                    await applicationManager.StartAsync(listenPort, args, configuration);
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "프로그램 실행 중 오류가 발생했습니다");
                    Console.WriteLine("프로그램 실행 중 오류가 발생했습니다: " + exception.Message);
                    exitCode = -1;
                }
            });

            ParseResult parseResult = rootCommand.Parse(args);
            if (parseResult.Errors.Count > 0)
            {
                exitCode = -1;
                foreach (ParseError parseError in parseResult.Errors)
                {
                    Console.Error.WriteLine(parseError.Message);
                }
            }
            else
            {
                exitCode = await parseResult.InvokeAsync();
            }

            return exitCode;
        }

        static async Task<string> GetExternalIPAddress()
        {
            string? ipAddress = null;
            var urls = new[]
            {
                new { Url = "https://api.ipify.org?format=json", IsJson = true },
                new { Url = $"http://localhost:{GlobalConfiguration.ServerPort}/checkip", IsJson = false }
            };

            using (HttpClient client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(3);

                foreach (var urlInfo in urls)
                {
                    try
                    {
                        HttpResponseMessage response = await client.GetAsync(urlInfo.Url);

                        if (response.IsSuccessStatusCode)
                        {
                            if (urlInfo.IsJson)
                            {
                                string jsonContent = await response.Content.ReadAsStringAsync();
                                using (JsonDocument doc = JsonDocument.Parse(jsonContent))
                                {
                                    if (doc.RootElement.TryGetProperty("ip", out JsonElement ipElement))
                                    {
                                        ipAddress = ipElement.GetString();
                                    }
                                }
                            }
                            else
                            {
                                ipAddress = (await response.Content.ReadAsStringAsync()).Trim();
                            }

                            break;
                        }
                    }
                    catch
                    {
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(ipAddress) == true)
            {
                ipAddress = GetLocalIPAddress();
            }

            return ipAddress;
        }

        static string GetLocalIPAddress()
        {
            try
            {
                using (Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, 0))
                {
                    socket.Connect("8.8.8.8", 65530);
                    var endPoint = socket.LocalEndPoint as IPEndPoint;
                    if (endPoint != null)
                    {
                        return endPoint.Address.ToString();
                    }
                }
            }
            catch
            {
            }

            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                var ipAddress = host.AddressList
                    .FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork
                                       && !IPAddress.IsLoopback(ip));

                if (ipAddress != null)
                {
                    return ipAddress.ToString();
                }
            }
            catch
            {
            }

            return "127.0.0.1";
        }

        static void HandleException(object sender, UnhandledExceptionEventArgs e)
        {
            var exception = (Exception)e.ExceptionObject;

            GlobalConfiguration.UnhandledExceptions.Add(exception);

            Log.Fatal(exception, "처리 되지 않은 오류가 발생했습니다");
            Console.WriteLine("처리 되지 않은 오류가 발생했습니다: " + exception.Message);
        }

        private static async Task DebuggerAttach(string[] args, bool? debug, int? delay)
        {
            var arguments = new ArgumentHelper(args);
            if (debug != null && debug == true)
            {
                var startupAwaitDelay = 10000;
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

        private static async Task TryLaunchUpdaterIfUpdateAvailableAsync(IConfiguration configuration, InstalledVersionInfo currentVersionInfo)
        {
            try
            {
                var manifestUrl = FirstNonEmpty(configuration["HandstackUpdateManifestUrl"], configuration["AppSettings:HandstackUpdateManifestUrl"]);
                if (string.IsNullOrWhiteSpace(manifestUrl) == true)
                {
                    return;
                }

                var manifestVersion = await TryGetManifestVersionAsync(manifestUrl);
                if (string.IsNullOrWhiteSpace(manifestVersion) == true)
                {
                    return;
                }

                if (IsNewerVersion(manifestVersion, currentVersionInfo.Version) == false)
                {
                    return;
                }

                var updaterExecutablePath = Path.GetFullPath(Path.Combine(GlobalConfiguration.EntryBasePath, "..", "tools", "updater", OperatingSystem.IsWindows() == true ? "updater.exe" : "updater"));
                var updaterDllPath = Path.ChangeExtension(updaterExecutablePath, ".dll");
                if (File.Exists(updaterExecutablePath) == false && File.Exists(updaterDllPath) == false)
                {
                    Log.Warning("[Program] updater 실행 파일 확인 필요. UpdaterPath={UpdaterPath}", updaterExecutablePath);
                    return;
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = File.Exists(updaterExecutablePath) == true ? updaterExecutablePath : "dotnet",
                    WorkingDirectory = Path.GetDirectoryName(updaterExecutablePath) ?? GlobalConfiguration.EntryBasePath,
                    UseShellExecute = false
                };

                if (File.Exists(updaterExecutablePath) == false)
                {
                    startInfo.ArgumentList.Add(updaterDllPath);
                }

                startInfo.ArgumentList.Add("--manifest-url");
                startInfo.ArgumentList.Add(manifestUrl);
                startInfo.ArgumentList.Add("--ack-process-id");
                startInfo.ArgumentList.Add(Environment.ProcessId.ToString());

                var errorUrl = FirstNonEmpty(configuration["HandstackUpdateErrorUrl"], configuration["AppSettings:HandstackUpdateErrorUrl"]);
                if (string.IsNullOrWhiteSpace(errorUrl) == false)
                {
                    startInfo.ArgumentList.Add("--error-url");
                    startInfo.ArgumentList.Add(errorUrl);
                }

                var currentArguments = Environment.GetCommandLineArgs();
                for (int argumentIndex = 1; argumentIndex < currentArguments.Length; argumentIndex++)
                {
                    startInfo.ArgumentList.Add(currentArguments[argumentIndex]);
                }

                var updaterProcess = Process.Start(startInfo);
                if (updaterProcess == null)
                {
                    Log.Warning("[Program] updater 프로세스 시작 실패");
                    return;
                }

                Log.Information("[Program] 최신 버전 감지로 updater를 비동기 실행했습니다. CurrentVersion={CurrentVersion}, ManifestVersion={ManifestVersion}, UpdaterProcessId={UpdaterProcessId}", currentVersionInfo.Version, manifestVersion, updaterProcess.Id);
            }
            catch (Exception exception)
            {
                Log.Warning(exception, "[Program] 시작 시 updater 실행 확인 중 오류가 발생했습니다.");
            }
        }

        private static async Task<string?> TryGetManifestVersionAsync(string manifestUrl)
        {
            try
            {
                string manifestJson;
                if (Uri.TryCreate(manifestUrl, UriKind.Absolute, out var manifestUri) == true && (manifestUri.Scheme == Uri.UriSchemeHttp || manifestUri.Scheme == Uri.UriSchemeHttps))
                {
                    HttpClient updateCheckHttpClient = new HttpClient
                    {
                        Timeout = TimeSpan.FromSeconds(5)
                    };
                    using var response = await updateCheckHttpClient.GetAsync(manifestUri);
                    response.EnsureSuccessStatusCode();
                    manifestJson = await response.Content.ReadAsStringAsync();
                }
                else
                {
                    var manifestFilePath = Path.GetFullPath(manifestUrl);
                    manifestJson = await File.ReadAllTextAsync(manifestFilePath);
                }

                using var document = JsonDocument.Parse(manifestJson);
                if (document.RootElement.TryGetProperty("version", out var versionElement) == true)
                {
                    return versionElement.GetString()?.Trim();
                }
            }
            catch
            {
            }

            return null;
        }

        private static bool IsNewerVersion(string candidateVersion, string currentVersion)
        {
            if (Version.TryParse(candidateVersion, out var parsedCandidate) == true
                && Version.TryParse(currentVersion, out var parsedCurrent) == true)
            {
                return parsedCandidate > parsedCurrent;
            }

            return string.Compare(candidateVersion, currentVersion, StringComparison.OrdinalIgnoreCase) > 0;
        }

        private static string? FirstNonEmpty(params string?[] values)
        {
            return values.FirstOrDefault(item => string.IsNullOrWhiteSpace(item) == false)?.Trim();
        }

        private static bool IsAutoUpdateEnabled(IConfiguration configuration)
        {
            var value = FirstNonEmpty(configuration["AppSettings:IsAutoUpdate"], configuration["IsAutoUpdate"]);
            return bool.TryParse(value, out var enabled) == true && enabled == true;
        }
    }
}
