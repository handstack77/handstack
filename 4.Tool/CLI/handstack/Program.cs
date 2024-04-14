using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json.Linq;

using Serilog;

namespace handstack
{
    public class Program
    {
        private static System.Timers.Timer? startupAwaitTimer;
        private static CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();

        public static async Task<int> Main(string[] args)
        {
            int exitCode = 0;
            string entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            if (string.IsNullOrEmpty(entryBasePath) == true)
            {
                entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            }

            if (entryBasePath != Environment.CurrentDirectory)
            {
                Environment.CurrentDirectory = entryBasePath;
            }

            var environmentName = Environment.GetEnvironmentVariable("ACK_ENVIRONMENT");
            if (string.IsNullOrEmpty(environmentName) == true)
            {
                environmentName = "";
            }

            string appSettingsFilePath = Path.Combine(entryBasePath, "appsettings.json");
            var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
            IConfigurationRoot configuration = configurationBuilder.Build();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();

            var optionAckFile = new Option<FileInfo?>(name: "--file", description: "ack 프로그램 전체 파일 경로입니다");
            var optionArguments = new Option<string?>("--arguments", description: "ack 프로그램 실행시 전달할 매개변수 입니다. 예) \"--modules=wwwroot,transact,dbclient,function\"");
            var optionPort = new Option<int?>("--port", description: "프로그램 수신 포트를 설정합니다. (기본값: 8080)");
            var optionDebug = new Option<bool?>("--debug", description: "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)");
            var optionDelay = new Option<int?>("--delay", description: "프로그램 시작시 지연 시간(밀리초)을 설정합니다. (기본값: 10000)");
            var optionProcessID = new Option<int>("--pid", description: "OS에서 부여한 프로세스 ID 입니다");
            var optionFormat = new Option<string?>(name: "--format", description: "실행 명령에 따라 적용하는 포맷입니다. 예) encrypt --format=base64|aes256|syn|sha256");
            var optionKey = new Option<string?>(name: "--key", description: "ack 프로그램 실행 검증 키입니다");
            var optionValue = new Option<string?>(name: "--value", description: "ack 프로그램 실행 검증 값입니다");
            var optionAppSettingFile = new Option<FileInfo?>(name: "--appsettings", description: "ack 프로그램 appsettings 파일명입니다");
            var optionDirectory = new Option<DirectoryInfo?>(name: "--directory", description: "실행 명령에 따라 적용하는 기준 디렉토리 경로입니다");

            var rootOptionModules = new Option<string?>("--modules", description: "프로그램 시작시 포함할 모듈을 설정합니다. 예) --modules=wwwroot,transact,dbclient,function");

            var rootCommand = new RootCommand("IT 혁신은 고객과 업무에 들여야 하는 시간과 노력을 줄이는 데 있습니다. HandStack은 기업 경쟁력 유지를 위한 도구입니다") {
                optionDebug, optionDelay, optionPort, rootOptionModules
            };

            #region list

            var subCommandList = new Command("list", "ack 프로세스 목록을 조회합니다");
            subCommandList.SetHandler(() =>
            {
                var currentId = Process.GetCurrentProcess().Id;
                var processList = Process.GetProcessesByName("ack");
                if (processList != null)
                {
                    List<string> strings = new List<string>();
                    strings.Add($"pid|starttime|ram|path");
                    foreach (var process in processList)
                    {
                        if (currentId != process.Id)
                        {
                            strings.Add($"{process.Id}|{process.StartTime}|{process.WorkingSet64.ToByteSize()}|{process.MainModule?.FileName}");
                        }
                    }

                    Log.Information(string.Join(Environment.NewLine, strings));
                }
            });
            rootCommand.Add(subCommandList);

            #endregion

            #region configuration

            // configuration --file=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --appsettings=ack.localhost.json
            var subCommandConfiguration = new Command("configuration", "의도된 ack 프로그램 및 모듈 환경설정을 적용합니다") {
                optionDebug, optionDelay, optionAckFile, optionAppSettingFile
            };

            subCommandConfiguration.SetHandler(async (debug, delay, file, settings) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (file != null && file.Exists == true && settings != null && settings.Exists == true)
                {
                    string targetBasePath = file.DirectoryName.ToStringSafe();
                    string settingDirectoryPath = settings.DirectoryName.ToStringSafe();
                    string settingFilePath = settings.FullName;
                    string settingFileName = settings.Name;
                    try
                    {
                        string settingText = File.ReadAllText(settingFilePath);
                        var setting = JObject.Parse(settingText);
                        var moduleBasePath = setting.SelectToken("AppSettings.LoadModuleBasePath").ToStringSafe();
                        if (moduleBasePath.StartsWith(".") == true)
                        {
                            moduleBasePath = Path.Combine(targetBasePath, moduleBasePath);
                        }

                        var loadModules = setting.SelectToken("AppSettings.LoadModules");
                        if (string.IsNullOrEmpty(moduleBasePath) == false && loadModules != null && loadModules.Count() > 0)
                        {
                            string functionModuleBasePath = string.Empty;
                            string moduleSettingFile = "module.json";
                            var modules = (JArray)loadModules;
                            for (int i = 0; i < modules.Count; i++)
                            {
                                var module = modules[i];
                                var moduleID = module.ToString();
                                if (string.IsNullOrEmpty(moduleID) == false)
                                {
                                    var splits = settingFileName.SplitAndTrim('.');
                                    string programID = splits[0];
                                    string environment = splits[1];

                                    string sourceModuleSettingFilePath = string.Empty;
                                    if (moduleID.IndexOf("|") > -1)
                                    {
                                        int moduleIndex = modules.IndexOf(module);
                                        sourceModuleSettingFilePath = moduleID.Substring(moduleID.IndexOf("|") + 1);
                                        moduleID = moduleID.Substring(0, moduleID.IndexOf("|"));
                                        if (moduleIndex > -1)
                                        {
                                            modules[moduleIndex] = moduleID;
                                        }
                                    }
                                    else
                                    {
                                        sourceModuleSettingFilePath = Path.Combine(settingDirectoryPath, "modulesettings", $"{programID}.{moduleID}.{environment}.json");
                                    }

                                    if (File.Exists(sourceModuleSettingFilePath) == true)
                                    {
                                        DirectoryInfo directoryInfo = new DirectoryInfo(Path.Combine(moduleBasePath, moduleID));
                                        if (directoryInfo.Exists == true)
                                        {
                                            if (moduleID == "function")
                                            {
                                                functionModuleBasePath = directoryInfo.FullName;
                                            }

                                            FileInfo sourceModuleSettingFileInfo = new FileInfo(sourceModuleSettingFilePath);
                                            string targetModuleSettingFilePath = Path.Combine(moduleBasePath, moduleID, moduleSettingFile);
                                            File.Copy(sourceModuleSettingFilePath, targetModuleSettingFilePath, true);
                                            Log.Information($"modulesettings: {targetModuleSettingFilePath}");
                                        }
                                        else
                                        {
                                            Log.Warning($"moduleBasePath: {moduleBasePath}, moduleID: {moduleID} 확인 필요");
                                        }
                                    }
                                    else
                                    {
                                        Log.Warning($"moduleSettingFilePath: {sourceModuleSettingFilePath}, moduleID: {moduleID} 확인 필요");
                                    }
                                }
                            }

                            string appBasePath = file.DirectoryName.ToStringSafe();
                            FileInfo appSettingFileInfo = new FileInfo(Path.Combine(appBasePath, "appsettings.json"));
                            var appSettingFilePath = appSettingFileInfo.FullName;
                            File.WriteAllText(appSettingFilePath, setting.ToString());
                            FileInfo settingFileInfo = new FileInfo(settingFilePath);
                            Log.Information($"appsettings: {appSettingFilePath}");

                            string synConfigFilePath = Path.Combine(settingDirectoryPath, "synconfigs", settingFileName);
                            if (File.Exists(synConfigFilePath) == true)
                            {
                                FileInfo synConfigFileInfo = new FileInfo(Path.Combine(appBasePath, "wwwroot", "syn.config.json"));
                                File.Copy(synConfigFilePath, synConfigFileInfo.FullName, true);
                                Log.Information($"synconfigs: {synConfigFileInfo.FullName}");
                            }

                            string nodeConfigFilePath = Path.Combine(settingDirectoryPath, "nodeconfigs", settingFileName);
                            if (File.Exists(nodeConfigFilePath) == true && string.IsNullOrEmpty(functionModuleBasePath) == false)
                            {
                                FileInfo nodeConfigFileInfo = new FileInfo(Path.Combine(functionModuleBasePath, "node.config.json"));
                                File.Copy(nodeConfigFilePath, nodeConfigFileInfo.FullName, true);
                                Log.Information($"nodeconfigs: {nodeConfigFileInfo.FullName}");
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName} 파일 확인 또는 settings:{settings?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionAppSettingFile);

            rootCommand.Add(subCommandConfiguration);

            #endregion

            #region purgecontracts

            // purgecontracts --file=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --directory=ack.localhost.json
            var subCommandPurgeContracts = new Command("purgecontracts", "모듈의 Contracts를 사용하도록 ack 프로그램의 contracts 내 중복 파일을 삭제합니다") {
                optionDebug, optionDelay, optionAckFile, optionDirectory
            };

            subCommandPurgeContracts.SetHandler(async (debug, delay, file, directory) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (file != null && file.Exists == true && directory != null && directory.Exists == true)
                {
                    string appBasePath = file.DirectoryName.ToStringSafe();
                    string parentPath = (file.Directory?.Parent?.FullName).ToStringSafe();
                    string targetContractDir = Path.Combine(parentPath, "contracts");
                    string baseDir = directory.FullName;

                    try
                    {
                        string[] subDirs = { "dbclient", "transact", "wwwroot", "repository", "function" };
                        foreach (string subDir in subDirs)
                        {
                            string dirPath = Path.Combine(baseDir, subDir);
                            if (Directory.Exists(dirPath))
                            {
                                string[] files = Directory.GetFiles(dirPath, "*", SearchOption.AllDirectories);
                                foreach (string baseFile in files)
                                {
                                    string targetFile = baseFile.Replace(baseDir, targetContractDir);
                                    if (File.Exists(targetFile) == true)
                                    {
                                        File.Delete(targetFile);
                                        Log.Information($"{targetFile} contract 파일 삭제");
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, $"purgecontracts 오류");
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName} 파일 확인 또는 settings:{directory?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionDirectory);

            rootCommand.Add(subCommandPurgeContracts);

            #endregion

            #region startlog

            // startlog --file=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=qrame.localhost.json
            var subCommandStartLog = new Command("startlog", "ack 프로세스를 시작하기 위한 명령어 로그를 출력합니다") {
                optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStartLog.SetHandler(async (debug, delay, file, arguments, settings) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (file != null && file.Exists == true)
                {
                    string targetBasePath = file.DirectoryName.ToStringSafe();
                    if (settings != null && settings.Exists == true)
                    {
                        string settingFilePath = settings.FullName;
                        try
                        {
                            string settingText = File.ReadAllText(settingFilePath);
                            string key = settingText.ToSHA256().Substring(0, 32);
                            arguments = $"{arguments}{(string.IsNullOrEmpty(arguments) == true ? "" : " ")}--key={key} --appsettings={settingText.EncryptAES(key)}";
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                        }
                    }

                    Console.WriteLine($"{file.FullName} {arguments.ToStringSafe()}");
                }
                else
                {
                    Log.Information($"file:{file?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile);

            rootCommand.Add(subCommandStartLog);

            #endregion

            #region start

            // start --file=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=qrame.localhost.json
            var subCommandStart = new Command("start", "ack 프로세스를 시작합니다") {
                optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStart.SetHandler(async (debug, delay, file, arguments, settings) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (file != null && file.Exists == true)
                {
                    string targetBasePath = file.DirectoryName.ToStringSafe();
                    if (settings != null && settings.Exists == true)
                    {
                        string settingFilePath = settings.FullName;
                        try
                        {
                            string settingText = File.ReadAllText(settingFilePath);
                            string key = settingText.ToSHA256().Substring(0, 32);
                            arguments = $"{arguments}{(string.IsNullOrEmpty(arguments) == true ? "" : " ")}--key={key} --appsettings={settingText.EncryptAES(key)}";
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                        }
                    }

                    string ackFilePath = file.FullName;
                    Process process = new Process();
                    process.StartInfo = new ProcessStartInfo(ackFilePath);
                    process.StartInfo.Arguments = arguments.ToStringSafe();
                    process.StartInfo.WorkingDirectory = Path.GetDirectoryName(ackFilePath);
                    process.StartInfo.CreateNoWindow = true;
                    process.StartInfo.UseShellExecute = false;
                    process.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                    process.Start();
                }
                else
                {
                    Log.Information($"file:{file?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile);

            rootCommand.Add(subCommandStart);

            #endregion

            #region stop

            var subCommandStop = new Command("stop", "ack 프로세스를 강제 종료합니다") {
                optionDebug, optionDelay, optionProcessID
            };

            subCommandStop.SetHandler(async (debug, delay, pid) =>
            {
                await DebuggerAttach(args, debug, delay);

                var processList = Process.GetProcessesByName("ack");

                if (pid == 0)
                {
                    for (int i = 0; i < processList.Length; i++)
                    {
                        var process = processList[i];
                        try
                        {
                            if (process != null)
                            {
                                process.Kill(true);
                            }
                            else
                            {
                                Log.Information($"ProcessID:{pid} 프로세스 확인이 필요합니다");
                            }
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"ProcessID:{pid} 프로세스 Kill 오류");
                        }
                    }
                }
                else if (pid > 0)
                {
                    for (int i = 0; i < processList.Length; i++)
                    {
                        var process = processList[i];
                        if (process.Id == pid)
                        {
                            try
                            {
                                if (process != null)
                                {
                                    process.Kill(true);
                                }
                                else
                                {
                                    Log.Information($"ProcessID:{pid} 프로세스 확인이 필요합니다");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, $"ProcessID:{pid} 프로세스 Kill 오류");
                            }
                            break;
                        }
                    }
                }
            }, optionDebug, optionDelay, optionProcessID);

            rootCommand.Add(subCommandStop);

            #endregion

            #region encrypt

            var subCommandEncrypt = new Command("encrypt", "지정된 매개변수로 값 인코딩을 수행합니다") {
                optionDebug, optionDelay, optionFormat, optionKey, optionValue
            };

            // qrame encrypt --format=base64 --value="helloworld"
            // qrame encrypt --format=connectionstring --value="[connection string]"
            subCommandEncrypt.SetHandler(async (debug, delay, format, key, value) =>
            {
                await DebuggerAttach(args, debug, delay);

                switch (format)
                {
                    case "base64":
                        Console.WriteLine($"{value?.EncodeBase64()}");
                        break;
                    case "suid":
                        switch (value)
                        {
                            case "N":
                                Console.WriteLine($"{Guid.NewGuid().ToString("N")}");
                                break;
                            case "D":
                                Console.WriteLine($"{Guid.NewGuid().ToString("D")}");
                                break;
                            case "B":
                                Console.WriteLine($"{Guid.NewGuid().ToString("B")}");
                                break;
                            case "P":
                                Console.WriteLine($"{Guid.NewGuid().ToString("P")}");
                                break;
                            case "X":
                                Console.WriteLine($"{Guid.NewGuid().ToString("X")}");
                                break;
                            default:
                                Console.WriteLine($"{Guid.NewGuid().ToString()}");
                                break;
                        }
                        Console.WriteLine($"{value?.EncodeBase64()}");
                        break;
                    case "sqids":
                        Console.WriteLine($"{value?.EncodeBase64()}");
                        break;
                    case "aes256":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').Substring(0, 32);
                        Console.WriteLine($"key={key}, value={value.ToStringSafe().EncryptAES(key)}");
                        break;
                    case "syn":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(6);
                        }

                        Console.WriteLine($"key={key}, value={SynCryptoHelper.Encrypt(value.ToStringSafe(), key)}");
                        break;
                    case "sha256":
                        Console.WriteLine($"{value.ToStringSafe().ToSHA256()}");
                        break;
                    case "connectionstring":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').Substring(0, 32);

                        string encrypt = $"{value.ToStringSafe().EncryptAES(key)}.{key.EncodeBase64()}.{Dns.GetHostName().EncodeBase64()}";
                        Console.WriteLine($"{encrypt}.{encrypt.ToSHA256()}");
                        break;
                }
            }, optionDebug, optionDelay, optionFormat, optionKey, optionValue);

            rootCommand.Add(subCommandEncrypt);

            #endregion

            #region decrypt

            var subCommandDecrypt = new Command("decrypt", "지정된 매개변수로 값 디코딩을 수행합니다") {
                optionDebug, optionDelay, optionFormat, optionKey, optionValue
            };

            // qrame decrypt --format=base64 --value="YmxhYmxhIGhlbGxvIHdvcmxk"
            subCommandDecrypt.SetHandler(async (debug, delay, format, key, value) =>
            {
                await DebuggerAttach(args, debug, delay);

                switch (format)
                {
                    case "base64":
                        Console.WriteLine($"{value?.DecodeBase64()}");
                        break;
                    case "suid":
                        Console.WriteLine($"{value?.EncodeBase64()}");
                        break;
                    case "sqids":
                        Console.WriteLine($"{value?.EncodeBase64()}");
                        break;
                    case "aes256":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').Substring(0, 32);
                        Console.WriteLine($"{value.ToStringSafe().DecryptAES(key)}");
                        break;
                    case "syn":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(6);
                        }

                        Console.WriteLine($"{SynCryptoHelper.Decrypt(value.ToStringSafe(), key)}");
                        break;
                    case "sha256":
                        Console.WriteLine($"{key == value.ToStringSafe().ToSHA256()}");
                        break;
                    case "connectionstring":
                        var values = value.ToStringSafe().SplitAndTrim('.');

                        string encrypt = values[0];
                        string decryptKey = values[1];
                        string hostName = values[2].DecodeBase64();
                        string hash = values[3];

                        if (hostName == Dns.GetHostName() && $"{encrypt}.{decryptKey}.{values[2]}".ToSHA256() == hash)
                        {
                            decryptKey = decryptKey.DecodeBase64().PadRight(32, '0').Substring(0, 32);
                            Console.WriteLine($"{encrypt.DecryptAES(decryptKey)}");
                        }
                        else
                        {
                            Console.WriteLine($"인코딩 값 확인 필요");
                        }
                        break;
                }
            }, optionDebug, optionDelay, optionFormat, optionKey, optionValue);

            rootCommand.Add(subCommandDecrypt);

            #endregion

            rootCommand.SetHandler(async (debug, delay, port, modules) =>
            {
                await DebuggerAttach(args, debug, delay);

                try
                {
                    Log.Information($"Current Directory from {Directory.GetCurrentDirectory()}");
                    Log.Information($"Launched from {Environment.CurrentDirectory}");
                    Log.Information($"Physical location {AppDomain.CurrentDomain.BaseDirectory}");
                    Log.Information($"Runtime call {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");

                    Log.Information($"ACK_ENVIRONMENT: {environmentName}, TargetFramework: {AppContext.TargetFrameworkName}, BaseDirectory: {AppContext.BaseDirectory}");
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "프로그램 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            }, optionDebug, optionDelay, optionPort, rootOptionModules);

            exitCode = await rootCommand.InvokeAsync(args);
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
