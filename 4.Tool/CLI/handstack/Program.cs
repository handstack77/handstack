using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.IO.Compression;

using handstack.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json.Linq;

using Serilog;

using Sqids;
using Org.BouncyCastle.Asn1.X509;
using System.Text.RegularExpressions;

namespace handstack
{
    public class Program
    {
        private static string[] ignoredDirectoryNames = { ".vs", ".git", ".svn" };
        private static int replaceInFilesCount;
        private static int replaceInFileNamesCount;
        private static int replaceInDirectoryNamesCount;
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

            var optionAckFile = new Option<FileInfo?>(name: "--ack", description: "ack 프로그램 전체 파일 경로입니다");
            var optionArguments = new Option<string?>("--arguments", description: "ack 프로그램 실행시 전달할 매개변수 입니다. 예) \"--modules=wwwroot,transact,dbclient,function\"");
            var optionPort = new Option<int?>("--port", description: "프로그램 수신 포트를 설정합니다. (기본값: 8080)");
            var optionDebug = new Option<bool?>("--debug", description: "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)");
            var optionDelay = new Option<int?>("--delay", description: "프로그램 시작시 지연 시간(밀리초)을 설정합니다. (기본값: 10000)");
            var optionProcessID = new Option<int>("--pid", description: "OS에서 부여한 프로세스 ID 입니다");
            var optionFormat = new Option<string?>(name: "--format", description: "실행 명령에 따라 적용하는 포맷입니다. 예) encrypt --format=base64|aes256|syn|sha256");
            var optionKey = new Option<string?>(name: "--key", description: "ack 프로그램 실행 검증 키입니다");
            var optionValue = new Option<string?>(name: "--value", description: "실행 명령에 따라 적용하는 검증 값입니다");
            var optionAppSettingFile = new Option<FileInfo?>(name: "--appsettings", description: "ack 프로그램 appsettings 파일명입니다");
            var optionDirectory = new Option<DirectoryInfo?>(name: "--directory", description: "실행 명령에 따라 적용하는 기준 디렉토리 경로입니다");
            var optionFile = new Option<FileInfo?>(name: "--file", description: "실행 명령에 따라 적용하는 파일 경로입니다");
            var optionFind = new Option<string?>(name: "--find", description: "실행 명령에 따라 적용하는 검색 값입니다");
            var optionReplace = new Option<string?>(name: "--replace", description: "실행 명령에 따라 적용하는 변경 값입니다");

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

            // configuration --ack=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --appsettings=ack.localhost.json
            var subCommandConfiguration = new Command("configuration", "의도된 ack 프로그램 및 모듈 환경설정을 적용합니다") {
                optionDebug, optionDelay, optionAckFile, optionAppSettingFile
            };

            subCommandConfiguration.SetHandler(async (debug, delay, ackFile, settings) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (ackFile != null && ackFile.Exists == true && settings != null && settings.Exists == true)
                {
                    string targetBasePath = ackFile.DirectoryName.ToStringSafe();
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

                            string appBasePath = ackFile.DirectoryName.ToStringSafe();
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
                    Log.Information($"ackFile:{ackFile?.FullName} 파일 확인 또는 settings:{settings?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionAppSettingFile);

            rootCommand.Add(subCommandConfiguration);

            #endregion

            #region purgecontracts

            // purgecontracts --ack=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --directory=ack.localhost.json
            var subCommandPurgeContracts = new Command("purgecontracts", "모듈의 Contracts를 사용하도록 ack 프로그램의 contracts 내 중복 파일을 삭제합니다") {
                optionDebug, optionDelay, optionAckFile, optionDirectory
            };

            subCommandPurgeContracts.SetHandler(async (debug, delay, ackFile, directory) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (ackFile != null && ackFile.Exists == true && directory != null && directory.Exists == true)
                {
                    string appBasePath = ackFile.DirectoryName.ToStringSafe();
                    string ackHomePath = (ackFile.Directory?.Parent?.FullName).ToStringSafe();
                    string targetContractDir = Path.Combine(ackHomePath, "contracts");
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
                    Log.Information($"ackFile:{ackFile?.FullName} 파일 확인 또는 settings:{directory?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionDirectory);

            rootCommand.Add(subCommandPurgeContracts);

            #endregion

            #region startlog

            // startlog --ack=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=ack.localhost.json
            var subCommandStartLog = new Command("startlog", "ack 프로세스를 시작하기 위한 명령어 로그를 출력합니다") {
                optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStartLog.SetHandler(async (debug, delay, ackFile, arguments, settings) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (ackFile != null && ackFile.Exists == true)
                {
                    string targetBasePath = ackFile.DirectoryName.ToStringSafe();
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

                    Console.WriteLine($"{ackFile.FullName} {arguments.ToStringSafe()}");
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName} 파일 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile);

            rootCommand.Add(subCommandStartLog);

            #endregion

            #region start

            // start --ack=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=ack.localhost.json
            var subCommandStart = new Command("start", "ack 프로세스를 시작합니다") {
                optionDebug, optionDelay, optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStart.SetHandler(async (debug, delay, ackFile, arguments, settings) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (ackFile != null && ackFile.Exists == true)
                {
                    string targetBasePath = ackFile.DirectoryName.ToStringSafe();
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

                    string ackFilePath = ackFile.FullName;
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
                    Log.Information($"ackFile:{ackFile?.FullName} 파일 확인이 필요합니다");
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

            // handstack encrypt --format=base64 --value="helloworld"
            // handstack encrypt --format=connectionstring --value="[connection string]"
            subCommandEncrypt.SetHandler(async (debug, delay, format, key, value) =>
            {
                await DebuggerAttach(args, debug, delay);

                switch (format)
                {
                    case "base64":
                        Console.WriteLine($"{value?.EncodeBase64()}");
                        break;
                    case "suid":
                        ISequentialIdGenerator sequentialIdGenerator = new SequentialIdGenerator();
                        switch (value)
                        {
                            case "N":
                                Console.WriteLine($"{sequentialIdGenerator.NewId().ToString("N")}");
                                break;
                            case "D":
                                Console.WriteLine($"{sequentialIdGenerator.NewId().ToString("D")}");
                                break;
                            case "B":
                                Console.WriteLine($"{sequentialIdGenerator.NewId().ToString("B")}");
                                break;
                            case "P":
                                Console.WriteLine($"{sequentialIdGenerator.NewId().ToString("P")}");
                                break;
                            case "X":
                                Console.WriteLine($"{sequentialIdGenerator.NewId().ToString("X")}");
                                break;
                            default:
                                Console.WriteLine($"{sequentialIdGenerator.NewId().ToString()}");
                                break;
                        }
                        break;
                    case "sqids":
                        key = string.IsNullOrEmpty(key) == true ? "abcdefghijklmnopqrstuvwxyz1234567890" : key;
                        var sqids = new SqidsEncoder<int>(new()
                        {
                            Alphabet = key,
                            MinLength = 8,
                        });

                        try
                        {
                            string[] splitNumbers = value.ToStringSafe().Split(',');
                            int[] numbers = Array.ConvertAll(splitNumbers, int.Parse);

                            Console.WriteLine($"{sqids.Encode(numbers)}");
                        }
                        catch
                        {
                            Console.WriteLine($"{sqids.Encode(0)}");
                        }
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

            // handstack decrypt --format=base64 --value="YmxhYmxhIGhlbGxvIHdvcmxk"
            subCommandDecrypt.SetHandler(async (debug, delay, format, key, value) =>
            {
                await DebuggerAttach(args, debug, delay);

                switch (format)
                {
                    case "base64":
                        Console.WriteLine($"{value?.DecodeBase64()}");
                        break;
                    case "suid":
                        try
                        {
                            var guid = Guid.Parse(value.ToStringSafe());
                            Console.WriteLine($"{guid.ToDateTime()}");
                        }
                        catch
                        {
                            Console.WriteLine("");
                        }
                        break;
                    case "sqids":
                        key = string.IsNullOrEmpty(key) == true ? "abcdefghijklmnopqrstuvwxyz1234567890" : key;
                        var sqids = new SqidsEncoder<int>(new()
                        {
                            Alphabet = key,
                            MinLength = 8,
                        });

                        try
                        {
                            Console.WriteLine($"{string.Join(",", sqids.Decode(value))}");
                        }
                        catch
                        {
                            Console.WriteLine("");
                        }
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

            #region compress

            var subCommandCompress = new Command("compress", "지정된 디렉터리에서 파일 및 디렉터리를 포함하는 Zip 파일을 만듭니다") {
                optionDebug, optionDelay, optionDirectory, optionFile
            };

            // handstack compress --directory=C:/projects/handstack77/handstack/4.Tool/CLI/handstack/bin/Debug/net8.0/win-x64 --file=C:/tmp/handstack.zip
            subCommandCompress.SetHandler(async (debug, delay, directory, file) =>
            {
                await DebuggerAttach(args, debug, delay);

                try
                {
                    if (directory != null && directory.Parent != null && directory.Exists == true)
                    {
                        if (file != null && file.Exists == true)
                        {
                            file.Delete();
                        }

                        string zipFileName = (file?.FullName).ToStringSafe();
                        if (file != null && file.Extension != ".zip")
                        {
                            zipFileName = $"{zipFileName}.zip";
                        }

                        if (string.IsNullOrEmpty(zipFileName) == true)
                        {
                            zipFileName = Path.Combine(directory.Parent.FullName, $"{directory.Name}.zip");
                        }

                        if (File.Exists(zipFileName) == true) {
                            File.Delete(zipFileName);
                        }

                        ZipFile.CreateFromDirectory(directory.FullName, zipFileName);
                    }
                    else
                    {
                        Log.Information($"directory:{directory?.FullName}, file:{file?.FullName} 확인이 필요합니다");
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"compress 오류");
                }
            }, optionDebug, optionDelay, optionDirectory, optionFile);

            rootCommand.Add(subCommandCompress);

            #endregion

            #region extract

            var subCommandExtract = new Command("extract", "지정된 ZIP 파일의 모든 파일을 파일 시스템의 디렉터리에 추출합니다") {
                optionDebug, optionDelay, optionFile, optionDirectory
            };

            // handstack extract --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack
            subCommandExtract.SetHandler(async (debug, delay, file, directory) =>
            {
                await DebuggerAttach(args, debug, delay);

                try
                {
                    if (file != null && file.Exists == true && directory != null)
                    {
                        if (directory.Exists == true)
                        {
                            directory.Delete(true);
                        }

                        ZipFile.ExtractToDirectory(file.FullName, directory.FullName);
                    }
                    else
                    {
                        Log.Information($"directory:{directory?.FullName}, file:{file?.FullName} 확인이 필요합니다");
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"extract 오류");
                }
            }, optionDebug, optionDelay, optionFile, optionDirectory);

            rootCommand.Add(subCommandExtract);

            #endregion

            #region create

            var subCommandCreate = new Command("create", "modules, webapp 템플릿 ZIP 파일을 기반으로 프로젝트를 생성합니다") {
                optionDebug, optionDelay, optionAckFile, optionFile, optionDirectory, optionFind, optionReplace, optionValue
            };

            // handstack create --ack=C:/projects/handstack77/handstack/1.WebHost/build/handstack/app/ack.exe --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack --find=handsup --replace=myprojectname
            subCommandCreate.SetHandler(async (debug, delay, ackFile, file, directory, find, replace, ignored) =>
            {
                await DebuggerAttach(args, debug, delay);

                if (ackFile != null && ackFile.Exists == true && file != null && file.Exists == true && directory != null)
                {
                    string ackHomePath = (ackFile.Directory?.Parent?.FullName).ToStringSafe();
                    if (directory.Exists == true)
                    {
                        directory.Delete(true);
                    }

                    string targetDirectoryPath = directory.FullName;
                    ZipFile.ExtractToDirectory(file.FullName, targetDirectoryPath);

                    if (string.IsNullOrEmpty(ignored) == false)
                    {
                        ignoredDirectoryNames = ignored.SplitComma().ToArray();
                    }

                    if (string.IsNullOrEmpty(find) == false && string.IsNullOrEmpty(replace) == false)
                    {
                        try
                        {
                            string findText = find;
                            string replaceText = replace;

                            ReplaceInFiles(ackHomePath, targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);

                            ReplaceInFileNames(targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);

                            ReplaceInDirectoryNames(targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);
                        }
                        catch (Exception exception)
                        {
                            Console.WriteLine(exception.Message);
                            Environment.Exit(-1);
                        }
                    }
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName}, directory:{directory?.FullName}, file:{file?.FullName} 확인이 필요합니다");
                }
            }, optionDebug, optionDelay, optionAckFile, optionFile, optionDirectory, optionFind, optionReplace, optionValue);

            rootCommand.Add(subCommandCreate);

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

        public static void ReplaceInFiles(string ackHomePath, string directoryPath, string findText, string replaceText, bool deleteVsUserSettingsDirectory)
        {
            var directoryInfo = new DirectoryInfo(directoryPath);

            if (deleteVsUserSettingsDirectory && ignoredDirectoryNames.Contains(directoryInfo.Name))
            {
                return;
            }

            foreach (string file in Directory.GetFiles(directoryPath))
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.IsBinary() == false)
                {
                    string fileText = File.ReadAllText(file);
                    int count = Regex.Matches(fileText, findText, RegexOptions.None).Count;
                    if (count > 0)
                    {
                        File.WriteAllText(file, fileText.Replace(findText, replaceText));
                        replaceInFilesCount += count;
                    }

                    findText = "#{ackHomePath}";
                    count = Regex.Matches(fileText, findText, RegexOptions.None).Count;
                    if (count > 0)
                    {
                        File.WriteAllText(file, fileText.Replace(findText, ackHomePath));
                        replaceInFilesCount += count;
                    }
                }
            }

            foreach (string directory in Directory.GetDirectories(directoryPath))
            {
                ReplaceInFiles(ackHomePath, directory, findText, replaceText, deleteVsUserSettingsDirectory);
            }
        }

        public static void ReplaceInFileNames(string directoryPath, string findText, string replaceText, bool deleteVsUserSettingsDirectory)
        {
            var directoryInfo = new DirectoryInfo(directoryPath);
            if (deleteVsUserSettingsDirectory && ignoredDirectoryNames.Contains(directoryInfo.Name))
            {
                return;
            }

            foreach (string file in Directory.GetFiles(directoryPath))
            {
                var fileInfo = new FileInfo(file);
                int count = Regex.Matches(fileInfo.Name, findText, RegexOptions.None).Count;
                if (count > 0)
                {
                    string newFileName = fileInfo.Name.Replace(findText, replaceText);
                    string originalFileName = fileInfo.Name;

                    if (newFileName.Equals(originalFileName, StringComparison.InvariantCultureIgnoreCase))
                    {
                        string tempFileName = $"temp_{originalFileName}_{Guid.NewGuid()}";
                        string tempFullFileName = fileInfo.FullName.ReplaceLastOccurrence(fileInfo.Name, tempFileName);
                        File.Move(fileInfo.FullName, tempFullFileName);
                        string newFullFileName = fileInfo.FullName.ReplaceLastOccurrence(fileInfo.Name, newFileName);
                        File.Move(tempFullFileName, newFullFileName);
                    }
                    else
                    {
                        string newFullFileName = fileInfo.FullName.ReplaceLastOccurrence(fileInfo.Name, newFileName);
                        File.Move(fileInfo.FullName, newFullFileName);
                    }

                    replaceInFileNamesCount += count;
                }
            }

            foreach (string directory in Directory.GetDirectories(directoryPath))
            {
                ReplaceInFileNames(directory, findText, replaceText, deleteVsUserSettingsDirectory);
            }
        }

        public static void ReplaceInDirectoryNames(string directoryPath, string findText, string replaceText, bool deleteVsUserSettingsDirectory)
        {
            var directoryInfo = new DirectoryInfo(directoryPath);
            if (deleteVsUserSettingsDirectory && ignoredDirectoryNames.Contains(directoryInfo.Name))
            {
                return;
            }

            int count = Regex.Matches(directoryInfo.Name, findText, RegexOptions.None).Count;
            string directoryInfoFullName = directoryInfo.FullName;

            if (count > 0)
            {
                string newDirectoryName = directoryInfo.Name.Replace(findText, replaceText);
                string orginalDirectoryName = directoryInfo.Name;
                if (newDirectoryName.Equals(orginalDirectoryName, StringComparison.InvariantCultureIgnoreCase))
                {
                    string tempDirectoryName = $"temp_{orginalDirectoryName}_{Guid.NewGuid()}";
                    string tempFullDirectoryName = directoryInfo.FullName.ReplaceLastOccurrence(directoryInfo.Name, tempDirectoryName);
                    Directory.Move(directoryInfo.FullName, tempFullDirectoryName);
                    string newFullDirectoryName = directoryInfo.FullName.ReplaceLastOccurrence(directoryInfo.Name, newDirectoryName);
                    Directory.Move(tempFullDirectoryName, newFullDirectoryName);
                }
                else
                {
                    directoryInfoFullName = directoryInfo.FullName.ReplaceLastOccurrence(directoryInfo.Name, newDirectoryName);
                    Directory.Move(directoryInfo.FullName, directoryInfoFullName);
                }

                replaceInDirectoryNamesCount += count;
            }

            foreach (string directory in Directory.GetDirectories(directoryInfoFullName))
            {
                ReplaceInDirectoryNames(directory, findText, replaceText, deleteVsUserSettingsDirectory);
            }
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
