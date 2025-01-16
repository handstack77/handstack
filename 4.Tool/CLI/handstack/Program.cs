using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using handstack.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json.Linq;

using Serilog;

using Sqids;

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
        private static ArgumentHelper? commandOptions = null;

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

            string appSettingsFilePath = PathExtensions.Combine(entryBasePath, "appsettings.json");
            var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
            IConfigurationRoot configuration = configurationBuilder.Build();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();

            var optionDebug = new Option<bool?>("--debug", description: "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)");
            var optionAckFile = new Option<FileInfo?>(name: "--ack", description: "ack 프로그램 전체 파일 경로입니다");
            var optionArguments = new Option<string?>("--arguments", description: "ack 프로그램 실행시 전달할 매개변수 입니다. 예) \"--modules=wwwroot,transact,dbclient,function\"");
            var optionPort = new Option<int?>("--port", description: "프로그램 수신 포트를 설정합니다. (기본값: 8080)");
            var optionProcessID = new Option<int?>("--pid", description: "OS에서 부여한 프로세스 ID 입니다");
            var optionFormat = new Option<string?>(name: "--format", description: "실행 명령에 따라 적용하는 포맷입니다. 예) encrypt --format=base64|aes256|syn|sha256");
            var optionKey = new Option<string?>(name: "--key", description: "ack 프로그램 실행 검증 키입니다");
            var optionValue = new Option<string?>(name: "--value", description: "실행 명령에 따라 적용하는 검증 값입니다");
            var optionAppSettingFile = new Option<FileInfo?>(name: "--appsettings", description: "ack 프로그램 appsettings 파일명입니다");
            var optionDirectory = new Option<DirectoryInfo?>(name: "--directory", description: "실행 명령에 따라 적용하는 기준 디렉토리 경로입니다");
            var optionFile = new Option<FileInfo?>(name: "--file", description: "실행 명령에 따라 적용하는 파일 경로입니다");
            var optionFind = new Option<string?>(name: "--find", description: "실행 명령에 따라 적용하는 검색 값입니다");
            var optionReplace = new Option<string?>(name: "--replace", description: "실행 명령에 따라 적용하는 변경 값입니다");
            var optionOptions = new Option<string?>(name: "--options", description: "실행 명령에 따라 적용하는 옵션 값입니다");

            var rootOptionModules = new Option<string?>("--modules", description: "프로그램 시작시 포함할 모듈을 설정합니다. 예) --modules=wwwroot,transact,dbclient,function");

            var rootCommand = new RootCommand("IT 혁신은 고객과 업무에 들여야 하는 시간과 노력을 줄이는 데 있습니다. HandStack은 기업 경쟁력 유지를 위한 도구입니다") {
                optionDebug, optionPort, rootOptionModules, optionOptions
            };

            #region list

            var subCommandList = new Command("list", "ack 프로세스 목록을 조회합니다");
            subCommandList.SetHandler(() =>
            {
                var currentId = Process.GetCurrentProcess().Id;
                List<Process> processes = new List<Process>();
                processes.AddRange(Process.GetProcessesByName("ack"));
                processes.AddRange(Process.GetProcessesByName("dotnet"));
                if (processes.Count > 0)
                {
                    var processPorts = new Dictionary<int, List<int>>();
                    string netstatScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"netstat -ano | findstr /R /C:\"LISTENING\"" : $"lsof -iTCP -n -P | grep -E '(LISTEN)'";
                    var netstatResult = CommandHelper.RunScript($"{netstatScript}", false, true, true);
                    if (netstatResult.Count > 0 && netstatResult[0].Item1 == 0)
                    {
                        string netstatOutput = netstatResult[0].Item2.ToStringSafe();

                        MatchCollection? matches = null;
                        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                        {
                            var regex = new Regex(@"TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]):(?<port>\d+)\s+.*LISTENING\s+(?<pid>\d+)");
                            matches = regex.Matches(netstatOutput);
                        }
                        else
                        {
                            var regex = new Regex(@"(\w+)\s+(?<pid>\d+)\s+\w+\s+\d+u\s+\w+\s+\w+\s+\d+t\d+\s+TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]|\*):(?<port>\d+)\s+\(LISTEN\)");
                            matches = regex.Matches(netstatOutput);
                        }

                        if (matches != null)
                        {
                            foreach (Match match in matches)
                            {
                                if (int.TryParse(match.Groups["pid"].Value, out int processID) == true && int.TryParse(match.Groups["port"].Value, out int portNumber) == true)
                                {
                                    if (processPorts.ContainsKey(processID) == true)
                                    {
                                        var ports = processPorts[processID];
                                        if (ports.Contains(portNumber) == false)
                                        {
                                            ports.Add(portNumber);
                                        }
                                    }
                                    else
                                    {
                                        processPorts.Add(processID, new List<int> { portNumber });
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        Log.Error($"error: {netstatResult[0].Item3}");
                    }

                    List<string> strings = new List<string>();
                    strings.Add($"pname|pid|port|startat|ram|cmd|path");
                    foreach (var process in processes)
                    {
                        if (process.Id == currentId)
                        {
                            continue;
                        }

                        string commandLine = "";
                        string commandLineScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"wmic process where processid={process.Id} get CommandLine" : $"ps -fp {process.Id} | awk '{{print $NF}}'";
                        var commandLineResult = CommandHelper.RunScript($"{commandLineScript}", false, true, true);
                        if (commandLineResult.Count > 0 && commandLineResult[0].Item1 == 0)
                        {
                            string commandLineOutput = commandLineResult[0].Item2.ToStringSafe();
                            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                            {
                                commandLine = commandLineOutput.Replace("CommandLine", "").Replace("\n", "").Replace("\r", "").Trim();
                            }
                            else
                            {
                                commandLine = commandLineOutput.Replace("CMD", "").Replace("\n", "").Replace("\r", "").Trim();
                            }
                        }

                        bool isProcessCollect = false;
                        if (commandLine.StartsWith("dotnet") == true)
                        {
                            isProcessCollect = commandLine.IndexOf("ack.dll") > -1 ? true : false;
                        }
                        else
                        {
                            isProcessCollect = commandLine.IndexOf("ack.exe") > -1
                                || commandLine.IndexOf($"{Path.DirectorySeparatorChar}ack") > -1
                                ? true : false;
                        }

                        if (isProcessCollect == true)
                        {
                            if (processPorts.TryGetValue(process.Id, out List<int>? ports) == true)
                            {
                                string port = ports == null ? "" : string.Join(",", ports);
                                strings.Add($"{process.ProcessName}|{process.Id}|{port}|{process.StartTime.ToString("yyyy-MM-dd HH:mm:dd")}|{process.WorkingSet64.ToByteSize()}|{commandLine}|{process.MainModule?.FileName}");
                            }
                        }
                    }

                    Log.Information(string.Join(Environment.NewLine, strings));
                }
            });
            rootCommand.Add(subCommandList);

            #endregion

            #region configuration

            // configuration --ack=%HANDSTACK_HOME%/app/ack.exe --appsettings=ack.localhost.json
            var subCommandConfiguration = new Command("configuration", "의도된 ack 프로그램 및 모듈 환경설정을 적용합니다") {
                optionAckFile, optionAppSettingFile
            };

            subCommandConfiguration.SetHandler((ackFile, settings) =>
            {
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
                            moduleBasePath = PathExtensions.Combine(targetBasePath, moduleBasePath);
                        }

                        var loadModules = setting.SelectToken("AppSettings.LoadModules");
                        if (string.IsNullOrEmpty(moduleBasePath) == false && loadModules != null && loadModules.Count() > 0)
                        {
                            string wwwrootModuleBasePath = string.Empty;
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
                                        sourceModuleSettingFilePath = PathExtensions.Combine(settingDirectoryPath, "modulesettings", $"{programID}.{moduleID}.{environment}.json");
                                        if (File.Exists(sourceModuleSettingFilePath) == false)
                                        {
                                            sourceModuleSettingFilePath = PathExtensions.Combine(settingDirectoryPath, "modules", $"{programID}.{moduleID}.{environment}.json");
                                        }
                                    }

                                    if (File.Exists(sourceModuleSettingFilePath) == true)
                                    {
                                        DirectoryInfo directoryInfo = new DirectoryInfo(PathExtensions.Combine(moduleBasePath, moduleID));
                                        if (directoryInfo.Exists == true)
                                        {
                                            if (moduleID == "wwwroot")
                                            {
                                                wwwrootModuleBasePath = directoryInfo.FullName;
                                            }
                                            else if (moduleID == "function")
                                            {
                                                functionModuleBasePath = directoryInfo.FullName;
                                            }

                                            FileInfo sourceModuleSettingFileInfo = new FileInfo(sourceModuleSettingFilePath);
                                            string targetModuleSettingFilePath = PathExtensions.Combine(moduleBasePath, moduleID, moduleSettingFile);
                                            File.Copy(sourceModuleSettingFilePath, targetModuleSettingFilePath, true);
                                            Log.Information($"modules: {targetModuleSettingFilePath}");
                                        }
                                        else
                                        {
                                            Log.Warning($"moduleBasePath: {moduleBasePath}, moduleID: {moduleID} 확인 필요");
                                        }
                                    }
                                }
                            }

                            string appBasePath = ackFile.DirectoryName.ToStringSafe();
                            FileInfo appSettingFileInfo = new FileInfo(PathExtensions.Combine(appBasePath, "appsettings.json"));
                            var appSettingFilePath = appSettingFileInfo.FullName;
                            File.WriteAllText(appSettingFilePath, setting.ToString());
                            FileInfo settingFileInfo = new FileInfo(settingFilePath);
                            Log.Information($"appsettings: {appSettingFilePath}");

                            string synConfigFilePath = PathExtensions.Combine(settingDirectoryPath, "synconfigs", settingFileName);
                            if (File.Exists(synConfigFilePath) == true && string.IsNullOrEmpty(wwwrootModuleBasePath) == false)
                            {
                                FileInfo synConfigFileInfo = new FileInfo(PathExtensions.Combine(wwwrootModuleBasePath, "wwwroot", "syn.config.json"));
                                File.Copy(synConfigFilePath, synConfigFileInfo.FullName, true);
                                Log.Information($"synconfigs: {synConfigFileInfo.FullName}");
                            }

                            string nodeConfigFilePath = PathExtensions.Combine(settingDirectoryPath, "nodeconfigs", settingFileName);
                            if (File.Exists(nodeConfigFilePath) == true && string.IsNullOrEmpty(functionModuleBasePath) == false)
                            {
                                FileInfo nodeConfigFileInfo = new FileInfo(PathExtensions.Combine(functionModuleBasePath, "node.config.json"));
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
            }, optionAckFile, optionAppSettingFile);

            rootCommand.Add(subCommandConfiguration);

            #endregion

            #region purgecontracts

            // purgecontracts --ack=%HANDSTACK_HOME%/app/ack.exe --directory=C:/projects/myapp/contracts
            var subCommandPurgeContracts = new Command("purgecontracts", "모듈의 Contracts를 사용하도록 ack 프로그램의 contracts 내 중복 파일을 삭제합니다") {
                optionAckFile, optionDirectory
            };

            subCommandPurgeContracts.SetHandler((ackFile, directory) =>
            {
                if (ackFile != null && ackFile.Exists == true && directory != null && directory.Exists == true)
                {
                    string appBasePath = ackFile.DirectoryName.ToStringSafe();
                    string ackHomePath = (ackFile.Directory?.Parent?.FullName).ToStringSafe();
                    string targetContractDir = PathExtensions.Combine(ackHomePath, "contracts");
                    string baseDir = directory.FullName;

                    try
                    {
                        string[] subDirs = { "dbclient", "transact", "wwwroot", "repository", "function" };
                        foreach (string subDir in subDirs)
                        {
                            string dirPath = PathExtensions.Combine(baseDir, subDir);
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
            }, optionAckFile, optionDirectory);

            rootCommand.Add(subCommandPurgeContracts);

            #endregion

            #region startlog

            // startlog --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=ack.localhost.json
            var subCommandStartLog = new Command("startlog", "ack 프로그램을 시작하기 위한 명령어 로그를 출력합니다") {
                optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStartLog.SetHandler((ackFile, arguments, settings) =>
            {
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

                    Log.Information($"{ackFile.FullName} {arguments.ToStringSafe()}");
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName} 파일 확인이 필요합니다");
                }
            }, optionAckFile, optionArguments, optionAppSettingFile);

            rootCommand.Add(subCommandStartLog);

            #endregion

            #region start

            // start --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--debug --delay=1000000" --appsettings=ack.localhost.json
            var subCommandStart = new Command("start", "ack 프로그램을 시작합니다") {
                optionAckFile, optionArguments, optionAppSettingFile
            };

            subCommandStart.SetHandler((ackFile, arguments, settings) =>
            {
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
            }, optionAckFile, optionArguments, optionAppSettingFile);

            rootCommand.Add(subCommandStart);

            #endregion

            #region stop

            var subCommandStop = new Command("stop", "ack 프로그램을 종료합니다") {
                optionProcessID, optionPort
            };

            subCommandStop.SetHandler((pid, port) =>
            {
                List<Process> processes = new List<Process>();
                processes.AddRange(Process.GetProcessesByName("ack"));
                processes.AddRange(Process.GetProcessesByName("dotnet"));

                if (pid == 0 && port == null)
                {
                    for (int i = 0; i < processes.Count; i++)
                    {
                        var process = processes[i];
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
                    for (int i = 0; i < processes.Count; i++)
                    {
                        var process = processes[i];
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
                else if (port != null && port > 0)
                {
                    var processPorts = new Dictionary<int, List<int>>();
                    string netstatScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"netstat -ano | findstr /R /C:\"LISTENING\"" : $"lsof -iTCP -n -P | grep -E '(LISTEN)'";
                    var netstatResult = CommandHelper.RunScript($"{netstatScript}", false, true, true);
                    if (netstatResult.Count > 0 && netstatResult[0].Item1 == 0)
                    {
                        string netstatOutput = netstatResult[0].Item2.ToStringSafe();

                        MatchCollection? matches = null;
                        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                        {
                            var regex = new Regex(@"TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]):(?<port>\d+)\s+.*LISTENING\s+(?<pid>\d+)");
                            matches = regex.Matches(netstatOutput);
                        }
                        else
                        {
                            var regex = new Regex(@"(\w+)\s+(?<pid>\d+)\s+\w+\s+\d+u\s+\w+\s+\w+\s+\d+t\d+\s+TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]|\*):(?<port>\d+)\s+\(LISTEN\)");
                            matches = regex.Matches(netstatOutput);
                        }

                        if (matches != null)
                        {
                            foreach (Match match in matches)
                            {
                                if (int.TryParse(match.Groups["pid"].Value, out int processID) == true && int.TryParse(match.Groups["port"].Value, out int portNumber) == true)
                                {
                                    if (processPorts.ContainsKey(processID) == true)
                                    {
                                        var ports = processPorts[processID];
                                        if (ports.Contains(portNumber) == false)
                                        {
                                            ports.Add(portNumber);
                                        }
                                    }
                                    else
                                    {
                                        processPorts.Add(processID, new List<int> { portNumber });
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        Log.Error($"error: {netstatResult[0].Item3}");
                    }

                    foreach (int processID in processPorts.Keys)
                    {
                        if (processPorts.TryGetValue(processID, out List<int>? usagePorts) == true)
                        {
                            if (usagePorts.Contains((int)port) == true)
                            {
                                var process = Process.GetProcessById(processID);
                                if (process != null)
                                {
                                    try
                                    {
                                        process.Kill(true);
                                    }
                                    catch (Exception exception)
                                    {
                                        Log.Error(exception, $"ProcessID:{processID} 프로세스 Kill 오류");
                                    }
                                }
                                else
                                {
                                    Log.Information($"ProcessID:{processID} 프로세스 확인이 필요합니다");
                                }
                            }
                        }
                    }
                }
            }, optionProcessID, optionPort);

            rootCommand.Add(subCommandStop);

            #endregion

            #region encrypt

            var subCommandEncrypt = new Command("encrypt", "지정된 매개변수로 값 인코딩을 수행합니다") {
                optionFormat, optionKey, optionValue
            };

            // handstack encrypt --format=base64 --value="helloworld"
            // handstack encrypt --format=connectionstring --value="[connection string]"
            subCommandEncrypt.SetHandler((format, key, value) =>
            {
                switch (format)
                {
                    case "base64":
                        Log.Information($"{value?.EncodeBase64()}");
                        break;
                    case "suid":
                        ISequentialIdGenerator sequentialIdGenerator = new SequentialIdGenerator();
                        switch (value)
                        {
                            case "N":
                                Log.Information($"{sequentialIdGenerator.NewId().ToString("N")}");
                                break;
                            case "D":
                                Log.Information($"{sequentialIdGenerator.NewId().ToString("D")}");
                                break;
                            case "B":
                                Log.Information($"{sequentialIdGenerator.NewId().ToString("B")}");
                                break;
                            case "P":
                                Log.Information($"{sequentialIdGenerator.NewId().ToString("P")}");
                                break;
                            case "X":
                                Log.Information($"{sequentialIdGenerator.NewId().ToString("X")}");
                                break;
                            default:
                                Log.Information($"{sequentialIdGenerator.NewId().ToString()}");
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

                            Log.Information($"{sqids.Encode(numbers)}");
                        }
                        catch
                        {
                            Log.Information($"{sqids.Encode(0)}");
                        }
                        break;
                    case "aes256":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').Substring(0, 32);
                        Log.Information($"key={key}, value={value.ToStringSafe().EncryptAES(key)}");
                        break;
                    case "syn":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(6);
                        }

                        Log.Information($"key={key}, value={SynCryptoHelper.Encrypt(value.ToStringSafe(), key)}");
                        break;
                    case "sha256":
                        Log.Information($"{value.ToStringSafe().ToSHA256()}");
                        break;
                    case "connectionstring":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').Substring(0, 32);

                        string encrypt = $"{value.ToStringSafe().EncryptAES(key)}.{key.EncodeBase64()}.{Dns.GetHostName().EncodeBase64()}";
                        Log.Information($"{encrypt}.{encrypt.ToSHA256()}");
                        break;
                }
            }, optionFormat, optionKey, optionValue);

            rootCommand.Add(subCommandEncrypt);

            #endregion

            #region decrypt

            var subCommandDecrypt = new Command("decrypt", "지정된 매개변수로 값 디코딩을 수행합니다") {
                optionFormat, optionKey, optionValue
            };

            // handstack decrypt --format=base64 --value="YmxhYmxhIGhlbGxvIHdvcmxk"
            subCommandDecrypt.SetHandler((format, key, value) =>
            {
                switch (format)
                {
                    case "base64":
                        Log.Information($"{value?.DecodeBase64()}");
                        break;
                    case "suid":
                        try
                        {
                            var guid = Guid.Parse(value.ToStringSafe());
                            Log.Information($"{guid.ToDateTime()}");
                        }
                        catch
                        {
                            Log.Information("");
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
                            Log.Information($"{string.Join(",", sqids.Decode(value))}");
                        }
                        catch
                        {
                            Log.Information("");
                        }
                        break;
                    case "aes256":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(0, 32);
                        }
                        key = key.ToStringSafe().PadRight(32, '0').Substring(0, 32);
                        Log.Information($"{value.ToStringSafe().DecryptAES(key)}");
                        break;
                    case "syn":
                        if (string.IsNullOrEmpty(key) == true)
                        {
                            key = value.ToStringSafe().ToSHA256().Substring(6);
                        }

                        Log.Information($"{SynCryptoHelper.Decrypt(value.ToStringSafe(), key)}");
                        break;
                    case "sha256":
                        Log.Information($"{key == value.ToStringSafe().ToSHA256()}");
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
                            Log.Information($"{encrypt.DecryptAES(decryptKey)}");
                        }
                        else
                        {
                            Log.Information($"인코딩 값 확인 필요");
                        }
                        break;
                }
            }, optionFormat, optionKey, optionValue);

            rootCommand.Add(subCommandDecrypt);

            #endregion

            #region compress

            var subCommandCompress = new Command("compress", "지정된 디렉터리에서 파일 및 디렉터리를 포함하는 Zip 파일을 만듭니다") {
                optionDirectory, optionFile, optionKey
            };

            // handstack compress --directory=C:/projects/handstack77/handstack/4.Tool/CLI/handstack/bin/Debug/net8.0/win-x64 --file=C:/tmp/handstack.zip
            subCommandCompress.SetHandler((directory, file, key) =>
            {
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
                            zipFileName = PathExtensions.Combine(directory.Parent.FullName, $"{directory.Name}.zip");
                        }

                        if (File.Exists(zipFileName) == true)
                        {
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
            }, optionDirectory, optionFile, optionKey);

            rootCommand.Add(subCommandCompress);

            #endregion

            #region extract

            var subCommandExtract = new Command("extract", "지정된 ZIP 파일의 모든 파일을 파일 시스템의 디렉터리에 추출합니다") {
                optionFile, optionDirectory, optionOptions
            };

            // handstack extract --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack
            subCommandExtract.SetHandler((file, directory, options) =>
            {
                try
                {
                    if (file != null && file.Exists == true && directory != null)
                    {
                        if (directory.Exists == true && options.ToBoolean() == true)
                        {
                            directory.Delete(true);
                        }

                        ZipFile.ExtractToDirectory(file.FullName, directory.FullName, true);
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
            }, optionFile, optionDirectory, optionOptions);

            rootCommand.Add(subCommandExtract);

            #endregion

            #region create

            var subCommandCreate = new Command("create", "modules, webapp 템플릿 ZIP 파일을 기반으로 프로젝트를 생성합니다") {
                optionAckFile, optionFile, optionKey, optionDirectory, optionFind, optionReplace, optionValue
            };

            // handstack create --ack=%HANDSTACK_HOME%/app/ack.exe --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack --find=handstack --replace=myprojectname
            subCommandCreate.SetHandler((ackFile, file, key, directory, find, replace, ignored) =>
            {
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
                            Log.Information(exception.Message);
                            Environment.Exit(-1);
                        }
                    }
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName}, directory:{directory?.FullName}, file:{file?.FullName} 확인이 필요합니다");
                }
            }, optionAckFile, optionFile, optionKey, optionDirectory, optionFind, optionReplace, optionValue);

            rootCommand.Add(subCommandCreate);

            #endregion

            #region replacetext

            var subCommandReplaceText = new Command("replacetext", "텍스트 파일의 특정 문자열을 치환합니다") {
                optionFile, optionFind, optionReplace
            };

            // handstack replacetext --file=C:/tmp/handstack.txt --find=handstack --replace=myprojectname
            subCommandReplaceText.SetHandler((file, find, replace) =>
            {
                if (file != null && file.Exists == true)
                {
                    if (string.IsNullOrEmpty(find) == false && string.IsNullOrEmpty(replace) == false)
                    {
                        try
                        {
                            string findText = find;
                            string replaceText = replace;

                            ReplaceInFile(file, findText, replaceText);
                        }
                        catch (Exception exception)
                        {
                            Log.Information(exception.Message);
                            Environment.Exit(-1);
                        }
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName} 확인이 필요합니다");
                }
            }, optionFile, optionFind, optionReplace);

            rootCommand.Add(subCommandReplaceText);

            #endregion

            #region task

            var subCommandTask = new Command("task", "운영체제에 따라 사전에 정의된 배치 스크립트 업무를 수행합니다") {
                optionFile, optionValue
            };

            // handstack task --file=C:/tmp/task.json --value=checkman:build;dbclient:build
            subCommandTask.SetHandler((file, value) =>
            {
                if (file != null && file.Exists == true && file.Name == "task.json" && string.IsNullOrEmpty(value) == false)
                {
                    string command = value.ToStringSafe();
                    if (command.StartsWith("*:") == true)
                    {
                        var tasks = BindTasks(file.FullName, command);
                        if (tasks != null)
                        {
                            foreach (var task in tasks)
                            {
                                RunningTask(file, task);
                            }
                        }
                    }
                    else
                    {
                        var commands = command.SplitAndTrim(';');
                        foreach (var item in commands)
                        {
                            var task = BindTask(file.FullName, item);
                            if (task != null)
                            {
                                RunningTask(file, task);
                            }
                        }
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName}, value:{value} 확인이 필요합니다");
                }

                static void RunningTask(FileInfo? file, Entity.Tasks task)
                {
                    foreach (var item in task.environments)
                    {
                        if (item.Key == "$DATE_STRING")
                        {
                            string dateString = DateTime.Now.ToString(string.IsNullOrEmpty(item.Value) == true ? "yyyy-MM-dd" : item.Value);
                            CommandHelper.EnvironmentVariables.Add(item.Key.Substring(1).ToUpper(), dateString);
                        }
                        else if (item.Key.StartsWith("$") == true)
                        {
                            CommandHelper.EnvironmentVariables.Add(item.Key.Substring(1).ToUpper(), item.Value);
                        }
                        else
                        {
                            CommandHelper.EnvironmentVariables.Add(item.Key.ToUpper(), item.Value);
                        }
                    }

                    for (int i = 0; i < task.commands.Count; i++)
                    {
                        string command = task.commands[i];
                        foreach (var item in task.environments.Where(p => p.Key.StartsWith("$") == true))
                        {
                            task.commands[i] = command.Replace(item.Key, item.Value);
                            task.basepath = string.IsNullOrEmpty(task.basepath) == true ? "" : task.basepath.Replace(item.Key, item.Value);
                        }
                    }

                    var scripts = string.Join(Environment.NewLine, task.commands);
                    var workingDirectory = string.IsNullOrEmpty(task.basepath) == true ? (file?.DirectoryName).ToStringSafe() : task.basepath;
                    var scriptsResult = CommandHelper.RunScript(scripts, false, true, true, true, workingDirectory, task.ignoreExit);

                    int commandIndex = 1;
                    foreach (var item in scriptsResult)
                    {
                        if (item.Item1 != 0)
                        {
                            Log.Error($"command: {commandIndex}, error: {item.Item3}");
                        }

                        commandIndex = commandIndex + 1;
                    }
                }
            }, optionFile, optionValue);

            rootCommand.Add(subCommandTask);

            #endregion

            rootCommand.SetHandler((debug, port, modules, options) =>
            {
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
            }, optionDebug, optionPort, rootOptionModules, optionOptions);

            ArgumentHelper arguments = new ArgumentHelper(args);
            var argumentOptions = arguments["options"];
            if (argumentOptions != null)
            {
                commandOptions = new ArgumentHelper(argumentOptions.Split(" "));
            }

            bool debug = false;
            if (arguments["debug"] != null)
            {
                debug = true;
            }

            await DebuggerAttach(debug);

            exitCode = await rootCommand.InvokeAsync(args);
            return exitCode;
        }

        public static List<Entity.Tasks>? BindTasks(string taskFilePath, string key)
        {
            List<Entity.Tasks> result = new List<Entity.Tasks>();
            try
            {
                string? taskJson = File.ReadAllText(taskFilePath);
                var taskMetas = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, List<Entity.Tasks>>>(taskJson);

                string os = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? "windows" : RuntimeInformation.IsOSPlatform(OSPlatform.OSX) == true ? "osx" : "linux";
                string moduleID = key.Split(":")[0];
                string taskID = key.Split(":")[1];

                if (taskMetas == null)
                {
                    Log.Error("[{LogCategory}] " + $"task.json 파일 확인 필요", "BindTask");
                    return null;
                }

                foreach (var item in taskMetas)
                {
                    result.AddRange(item.Value);
                }

                result = result.Where(x => x.key == taskID && x.os == os).ToList();
                if (result.Count == 0)
                {
                    Log.Error("[{LogCategory}] " + $"taskID: {taskID}, os: {os}  항목 확인 필요", "BindTask");
                    return null;
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"key: {key} 항목 및 인스턴스 확인 필요", "BindTask");
            }

            return result;
        }

        public static Entity.Tasks? BindTask(string taskFilePath, string key)
        {
            Entity.Tasks? result = null;
            try
            {
                string? taskJson = File.ReadAllText(taskFilePath);
                var taskMetas = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, List<Entity.Tasks>>>(taskJson);

                string os = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? "windows" : RuntimeInformation.IsOSPlatform(OSPlatform.OSX) == true ? "osx" : "linux";
                string moduleID = key.Split(":")[0];
                string taskID = key.Split(":")[1];

                if (taskMetas == null)
                {
                    Log.Error("[{LogCategory}] " + $"task.json 파일 확인 필요", "BindTask");
                    return null;
                }

                var tasks = taskMetas.FirstOrDefault(x => x.Key == moduleID).Value;
                if (tasks == null || tasks.Count == 0)
                {
                    Log.Error("[{LogCategory}] " + $"moduleID: {moduleID} 항목 확인 필요", "BindTask");
                    return null;
                }

                result = tasks.FirstOrDefault(x => x.key == taskID && x.os == os);
                if (result == null)
                {
                    Log.Error("[{LogCategory}] " + $"taskID: {taskID}, os: {os}  항목 확인 필요", "BindTask");
                    return null;
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"key: {key} 항목 및 인스턴스 확인 필요", "BindTask");
            }

            return result;
        }

        public static void ReplaceInFile(FileInfo fileInfo, string findText, string replaceText)
        {
            if (fileInfo.Exists == true && fileInfo.IsBinary() == false)
            {
                string fileText = File.ReadAllText(fileInfo.FullName);
                int count = Regex.Matches(fileText, findText, RegexOptions.None).Count;
                if (count > 0)
                {
                    File.WriteAllText(fileInfo.FullName, fileText.Replace(findText, replaceText));
                }
            }
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

        private static async System.Threading.Tasks.Task DebuggerAttach(bool debug)
        {
            if (debug == true)
            {
                int startupAwaitDelay = 10000;
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
                    await System.Threading.Tasks.Task.Delay(startupAwaitDelay, cancellationTokenSource.Token);
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
