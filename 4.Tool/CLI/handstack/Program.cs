using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
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
            var exitCode = 0;
            var entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
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

            var appSettingsFilePath = PathExtensions.Combine(entryBasePath, "appsettings.json");
            var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
            var configuration = configurationBuilder.Build();

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
                var processes = new List<Process>();
                processes.AddRange(Process.GetProcessesByName("ack"));
                processes.AddRange(Process.GetProcessesByName("dotnet"));
                if (processes.Count > 0)
                {
                    var processPorts = new Dictionary<int, List<int>>();
                    var netstatScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"netstat -ano | findstr /R /C:\"LISTENING\"" : $"lsof -iTCP -n -P | grep -E '(LISTEN)'";
                    var netstatResult = CommandHelper.RunScript($"{netstatScript}", false, true, true);
                    if (netstatResult.Count > 0 && netstatResult[0].Item1 == 0)
                    {
                        var netstatOutput = netstatResult[0].Item2.ToStringSafe();

                        MatchCollection? matches = null;
                        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                        {
                            var regex = new Regex(@"TCP\s+(?<ip>\d+\.\d+\.\d+\.\d+|\[\:\:1\]):(?<port>\d+)\s+.*LISTENING\s+(?<pid>\d+)");
                            matches = regex.Matches(netstatOutput);
                        }
                        else
                        {
                            var regex = new Regex(@"(\w+)\s+(?<pid>\d+)\s+\w+\s+\d+u\s+\w+\s+\w+\s+\d+t\d+\s+TCP\s+(?<ip>[\d\.]+|\[::1\]|\*):(?<port>\d+)\s+\(LISTEN\)");
                            matches = regex.Matches(netstatOutput);
                        }

                        if (matches != null)
                        {
                            foreach (Match match in matches)
                            {
                                if (int.TryParse(match.Groups["pid"].Value, out var processID) == true && int.TryParse(match.Groups["port"].Value, out var portNumber) == true)
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

                    var strings = new List<string>();
                    strings.Add($"pname|pid|port|startat|ram|cmd|path");
                    foreach (var process in processes)
                    {
                        if (process.Id == currentId)
                        {
                            continue;
                        }

                        var commandLine = "";
                        var commandLineScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"powershell -NoProfile -Command \"Get-CimInstance Win32_Process | Where-Object {{ $_.ProcessId -eq {process.Id} }} | Select-Object -ExpandProperty CommandLine\"" : $"ps -fp {process.Id} | awk '{{print $NF}}'";
                        var commandLineResult = CommandHelper.RunScript($"{commandLineScript}", false, true, true);
                        if (commandLineResult.Count > 0 && commandLineResult[0].Item1 == 0)
                        {
                            var commandLineOutput = commandLineResult[0].Item2.ToStringSafe();
                            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                            {
                                commandLine = commandLineOutput.Replace("\\", "/").Replace("CommandLine", "").Replace("\n", "").Replace("\r", "").Trim();
                            }
                            else
                            {
                                commandLine = commandLineOutput.Replace("CMD", "").Replace("\n", "").Replace("\r", "").Trim();
                            }
                        }

                        var isProcessCollect = false;
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
                            if (processPorts.TryGetValue(process.Id, out var ports) == true)
                            {
                                var port = ports == null ? "" : string.Join(",", ports);
                                strings.Add($"{process.ProcessName}|{process.Id}|{port}|{process.StartTime:yyyy-MM-dd HH:mm:dd}|{process.WorkingSet64.ToByteSize()}|{commandLine}|{process.MainModule?.FileName}");
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
                    var targetBasePath = ackFile.DirectoryName.ToStringSafe();
                    var settingDirectoryPath = settings.DirectoryName.ToStringSafe();
                    var settingFilePath = settings.FullName.Replace("\\", "/");
                    var settingFileName = settings.Name;
                    try
                    {
                        var settingText = File.ReadAllText(settingFilePath);
                        var setting = JObject.Parse(settingText);
                        var moduleBasePath = setting.SelectToken("AppSettings.LoadModuleBasePath").ToStringSafe();
                        if (moduleBasePath.StartsWith(".") == true)
                        {
                            moduleBasePath = PathExtensions.Combine(targetBasePath, moduleBasePath);
                        }

                        var loadModules = setting.SelectToken("AppSettings.LoadModules");
                        if (string.IsNullOrEmpty(moduleBasePath) == false && loadModules != null && loadModules.Count() > 0)
                        {
                            var wwwrootModuleBasePath = string.Empty;
                            var functionModuleBasePath = string.Empty;
                            var moduleSettingFile = "module.json";
                            var modules = (JArray)loadModules;
                            for (var i = 0; i < modules.Count; i++)
                            {
                                var module = modules[i];
                                var moduleID = module.ToString();
                                if (string.IsNullOrEmpty(moduleID) == false)
                                {
                                    var splits = settingFileName.SplitAndTrim('.');
                                    var programID = splits[0];
                                    var environment = splits[1];

                                    var sourceModuleSettingFilePath = string.Empty;
                                    if (moduleID.IndexOf("|") > -1)
                                    {
                                        var moduleIndex = modules.IndexOf(module);
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
                                        var directoryInfo = new DirectoryInfo(PathExtensions.Combine(moduleBasePath, moduleID));
                                        if (directoryInfo.Exists == true)
                                        {
                                            if (moduleID == "wwwroot")
                                            {
                                                wwwrootModuleBasePath = directoryInfo.FullName.Replace("\\", "/");
                                            }
                                            else if (moduleID == "function")
                                            {
                                                functionModuleBasePath = directoryInfo.FullName.Replace("\\", "/");
                                            }

                                            var sourceModuleSettingFileInfo = new FileInfo(sourceModuleSettingFilePath);
                                            var targetModuleSettingFilePath = PathExtensions.Combine(moduleBasePath, moduleID, moduleSettingFile);
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

                            var appBasePath = ackFile.DirectoryName.ToStringSafe();
                            var appSettingFileInfo = new FileInfo(PathExtensions.Combine(appBasePath, "appsettings.json"));
                            var appSettingFilePath = appSettingFileInfo.FullName.Replace("\\", "/");
                            File.WriteAllText(appSettingFilePath, setting.ToString());
                            var settingFileInfo = new FileInfo(settingFilePath);
                            Log.Information($"appsettings: {appSettingFilePath}");

                            var synConfigFilePath = PathExtensions.Combine(settingDirectoryPath, "synconfigs", settingFileName);
                            if (File.Exists(synConfigFilePath) == true && string.IsNullOrEmpty(wwwrootModuleBasePath) == false)
                            {
                                var synConfigFileInfo = new FileInfo(PathExtensions.Combine(wwwrootModuleBasePath, "wwwroot", "syn.config.json"));
                                File.Copy(synConfigFilePath, synConfigFileInfo.FullName.Replace("\\", "/"), true);
                                Log.Information($"synconfigs: {synConfigFileInfo.FullName.Replace("\\", "/")}");
                            }

                            var nodeConfigFilePath = PathExtensions.Combine(settingDirectoryPath, "nodeconfigs", settingFileName);
                            if (File.Exists(nodeConfigFilePath) == true && string.IsNullOrEmpty(functionModuleBasePath) == false)
                            {
                                var nodeConfigFileInfo = new FileInfo(PathExtensions.Combine(functionModuleBasePath, "node.config.json"));
                                File.Copy(nodeConfigFilePath, nodeConfigFileInfo.FullName.Replace("\\", "/"), true);
                                Log.Information($"nodeconfigs: {nodeConfigFileInfo.FullName.Replace("\\", "/")}");
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
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인 또는 settings:{settings?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
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
                    var appBasePath = ackFile.DirectoryName.ToStringSafe();
                    var ackHomePath = (ackFile.Directory?.Parent?.FullName.Replace("\\", "/")).ToStringSafe();
                    var targetContractDir = PathExtensions.Combine(ackHomePath, "contracts");
                    var baseDir = directory.FullName.Replace("\\", "/");

                    try
                    {
                        string[] subDirs = { "dbclient", "transact", "wwwroot", "repository", "function" };
                        foreach (var subDir in subDirs)
                        {
                            var dirPath = PathExtensions.Combine(baseDir, subDir);
                            if (Directory.Exists(dirPath))
                            {
                                var files = Directory.GetFiles(dirPath, "*", SearchOption.AllDirectories);
                                foreach (var baseFile in files)
                                {
                                    var targetFile = baseFile.Replace(baseDir, targetContractDir);
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
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인 또는 settings:{directory?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
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
                    var targetBasePath = ackFile.DirectoryName.ToStringSafe();
                    if (settings != null && settings.Exists == true)
                    {
                        var settingFilePath = settings.FullName.Replace("\\", "/");
                        try
                        {
                            var settingText = File.ReadAllText(settingFilePath);
                            var key = settingText.ToSHA256().Substring(0, 32);
                            arguments = $"{arguments}{(string.IsNullOrEmpty(arguments) == true ? "" : " ")}--key={key} --appsettings={settingText.EncryptAES(key)}";
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                        }
                    }

                    var ackFilePath = ackFile.FullName.Replace("\\", "/");
                    var ackFileName = ackFile.Name == "ack.dll" ? "dotnet" : ackFilePath;
                    arguments = ackFile.Name == "ack.dll" ? $"ack.dll {arguments}" : arguments.ToStringSafe();

                    Log.Information($"{ackFileName} {arguments.ToStringSafe()}".Trim());
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
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
                    var targetBasePath = ackFile.DirectoryName.ToStringSafe();
                    if (settings != null && settings.Exists == true)
                    {
                        var settingFilePath = settings.FullName.Replace("\\", "/");
                        try
                        {
                            var settingText = File.ReadAllText(settingFilePath);
                            var key = settingText.ToSHA256().Substring(0, 32);
                            arguments = $"{arguments}{(string.IsNullOrEmpty(arguments) == true ? "" : " ")}--key={key} --appsettings={settingText.EncryptAES(key)}";
                        }
                        catch (Exception exception)
                        {
                            Log.Error(exception, $"settingFilePath: {settingFilePath} 확인 필요");
                        }
                    }

                    var ackFilePath = ackFile.FullName.Replace("\\", "/");
                    var process = new Process();
                    process.StartInfo = new ProcessStartInfo
                    {
                        FileName = ackFile.Name == "ack.dll" ? "dotnet" : ackFilePath,
                        Arguments = ackFile.Name == "ack.dll" ? $"ack.dll {arguments}".Trim() : arguments.ToStringSafe(),
                        WorkingDirectory = Path.GetDirectoryName(ackFilePath),
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    process.Start();
                }
                else
                {
                    Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
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
                var processes = new List<Process>();
                processes.AddRange(Process.GetProcessesByName("ack"));
                processes.AddRange(Process.GetProcessesByName("dotnet"));

                if (pid == 0 && port == null)
                {
                    for (var i = 0; i < processes.Count; i++)
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
                    for (var i = 0; i < processes.Count; i++)
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
                    var netstatScript = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? $"netstat -ano | findstr /R /C:\"LISTENING\"" : $"lsof -iTCP -n -P | grep -E '(LISTEN)'";
                    var netstatResult = CommandHelper.RunScript($"{netstatScript}", false, true, true);
                    if (netstatResult.Count > 0 && netstatResult[0].Item1 == 0)
                    {
                        var netstatOutput = netstatResult[0].Item2.ToStringSafe();

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
                                if (int.TryParse(match.Groups["pid"].Value, out var processID) == true && int.TryParse(match.Groups["port"].Value, out var portNumber) == true)
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

                    foreach (var processID in processPorts.Keys)
                    {
                        if (processPorts.TryGetValue(processID, out var usagePorts) == true)
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
                optionFormat, optionKey, optionValue, optionOptions
            };

            // handstack encrypt --format=base64 --value="helloworld"
            // handstack encrypt --format=connectionstring --value="[connection string]"
            subCommandEncrypt.SetHandler((format, key, value, options) =>
            {
                switch (format)
                {
                    case "base64":
                        if (string.IsNullOrEmpty(options) == true)
                        {
                            options = "string";
                        }

                        if (options == "string")
                        {
                            Log.Information($"{value?.EncodeBase64()}");
                        }
                        else if (options == "file")
                        {
                            var inputFilePath = value.ToStringSafe();
                            var fileInfo = new FileInfo(inputFilePath);
                            if (fileInfo.Exists == false)
                            {
                                Log.Information($"'{inputFilePath}' 파일 확인이 필요합니다");
                                return;
                            }

                            var outputFilePath = PathExtensions.Join(fileInfo.DirectoryName!, fileInfo.Name + ".txt");
                            var fileBytes = File.ReadAllBytes(inputFilePath);
                            var base64String = Convert.ToBase64String(fileBytes);
                            File.WriteAllText(outputFilePath, base64String);
                            Log.Information(outputFilePath);
                        }
                        else
                        {
                            Log.Information($"'{options}' 지원하지 않는 옵션입니다. string, file 을 입력하세요.");
                        }
                        break;
                    case "suid":
                        ISequentialIdGenerator sequentialIdGenerator = new SequentialIdGenerator();
                        switch (value)
                        {
                            case "N":
                                Log.Information($"{sequentialIdGenerator.NewId():N}");
                                break;
                            case "D":
                                Log.Information($"{sequentialIdGenerator.NewId():D}");
                                break;
                            case "B":
                                Log.Information($"{sequentialIdGenerator.NewId():B}");
                                break;
                            case "P":
                                Log.Information($"{sequentialIdGenerator.NewId():P}");
                                break;
                            case "X":
                                Log.Information($"{sequentialIdGenerator.NewId():X}");
                                break;
                            default:
                                Log.Information($"{sequentialIdGenerator.NewId()}");
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
                            var splitNumbers = value.ToStringSafe().Split(',');
                            var numbers = Array.ConvertAll(splitNumbers, int.Parse);

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

                        var encrypt = $"{value.ToStringSafe().EncryptAES(key)}.{key.EncodeBase64()}.{Dns.GetHostName().EncodeBase64()}";
                        Log.Information($"{encrypt}.{encrypt.ToSHA256()}");
                        break;
                }
            }, optionFormat, optionKey, optionValue, optionOptions);

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

                        var encrypt = values[0];
                        var decryptKey = values[1];
                        var hostName = values[2].DecodeBase64();
                        var hash = values[3];

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

                        var zipFileName = (file?.FullName.Replace("\\", "/")).ToStringSafe();
                        if (file != null && file.Extension != ".zip")
                        {
                            zipFileName = $"{zipFileName}.zip";
                        }

                        if (string.IsNullOrEmpty(zipFileName) == true)
                        {
                            zipFileName = PathExtensions.Combine(directory.Parent.FullName.Replace("\\", "/"), $"{directory.Name}.zip");
                        }

                        if (File.Exists(zipFileName) == true)
                        {
                            File.Delete(zipFileName);
                        }

                        ZipFile.CreateFromDirectory(directory.FullName.Replace("\\", "/"), zipFileName);
                    }
                    else
                    {
                        Log.Information($"directory:{directory?.FullName.Replace("\\", "/")}, file:{file?.FullName.Replace("\\", "/")} 확인이 필요합니다");
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

                        ZipFile.ExtractToDirectory(file.FullName.Replace("\\", "/"), directory.FullName.Replace("\\", "/"), true);
                    }
                    else
                    {
                        Log.Information($"directory:{directory?.FullName.Replace("\\", "/")}, file:{file?.FullName.Replace("\\", "/")} 확인이 필요합니다");
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
                optionFile, optionDirectory, optionFind, optionReplace, optionValue
            };

            // handstack create --file=C:/tmp/handstack.zip --directory=C:/tmp/handstack --find=handstack --replace=myprojectname
            subCommandCreate.SetHandler((file, directory, find, replace, ignored) =>
            {
                if (file != null && file.Exists == true && directory != null && directory.Exists == false)
                {
                    var targetDirectoryPath = directory.FullName.Replace("\\", "/");
                    ZipFile.ExtractToDirectory(file.FullName.Replace("\\", "/"), targetDirectoryPath, true);

                    if (string.IsNullOrEmpty(ignored) == false)
                    {
                        ignoredDirectoryNames = ignored.SplitComma().ToArray();
                    }

                    if (string.IsNullOrEmpty(find) == false && string.IsNullOrEmpty(replace) == false)
                    {
                        try
                        {
                            var findText = find;
                            var replaceText = replace;

                            ReplaceInFiles(targetDirectoryPath, findText, replaceText, deleteVsUserSettingsDirectory: true);

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
                    Log.Information($"file:{file?.FullName.Replace("\\", "/")}, directory:{directory?.FullName.Replace("\\", "/")} 확인이 필요합니다");
                }
            }, optionFile, optionDirectory, optionFind, optionReplace, optionValue);

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
                            var findText = find;
                            var replaceText = replace;

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
                    Log.Information($"file:{file?.FullName.Replace("\\", "/")} 확인이 필요합니다");
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
                    var command = value.ToStringSafe();
                    if (command.StartsWith("*:") == true)
                    {
                        var tasks = BindTasks(file.FullName.Replace("\\", "/"), command);
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
                            var task = BindTask(file.FullName.Replace("\\", "/"), item);
                            if (task != null)
                            {
                                RunningTask(file, task);
                            }
                        }
                    }
                }
                else
                {
                    Log.Information($"file:{file?.FullName.Replace("\\", "/")}, value:{value} 확인이 필요합니다");
                }

                static void RunningTask(FileInfo? file, Entity.Tasks task)
                {
                    foreach (var item in task.environments)
                    {
                        if (item.Key == "$DATE_STRING")
                        {
                            var dateString = DateTime.Now.ToString(string.IsNullOrEmpty(item.Value) == true ? "yyyy-MM-dd" : item.Value);
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

                    for (var i = 0; i < task.commands.Count; i++)
                    {
                        var command = task.commands[i];
                        foreach (var item in task.environments.Where(p => p.Key.StartsWith("$") == true))
                        {
                            task.commands[i] = command.Replace(item.Key, item.Value);
                            task.basepath = string.IsNullOrEmpty(task.basepath) == true ? "" : task.basepath.Replace(item.Key, item.Value);
                        }
                    }

                    var scripts = string.Join(Environment.NewLine, task.commands);
                    var workingDirectory = string.IsNullOrEmpty(task.basepath) == true ? (file?.DirectoryName).ToStringSafe() : task.basepath;
                    var scriptsResult = CommandHelper.RunScript(scripts, false, true, true, true, workingDirectory, task.ignoreExit);

                    var commandIndex = 1;
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

            #region synusage

            // synusage --directory="%HANDSTACK_HOME%\modules\wwwroot\wwwroot\view" --value=uicontrols > result.csv
            var subCommandSynUsage = new Command("synusage", "특정 디렉토리 내에 있는 코드에서 많이 사용되는 syn 코드를 스캔합니다.") {
                optionDirectory, optionValue
            };

            subCommandSynUsage.SetHandler((directory, value) =>
            {
                Dictionary<string, List<string>> scanTargets = new Dictionary<string, List<string>>
                {
                    ["functions"] = new List<string>
                    {
                        "syn\\.\\$b\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$m\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$d\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$c\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$k\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$v\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$l\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$w\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$r\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$n\\.[a-zA-Z0-9_]+",
                        "syn\\.\\$p\\.[a-zA-Z0-9_]+",
                        "\\$date\\.[a-zA-Z0-9_]+",
                        "\\$array\\.[a-zA-Z0-9_]+",
                        "\\$string\\.[a-zA-Z0-9_]+",
                        "\\$number\\.[a-zA-Z0-9_]+",
                        "\\$object\\.[a-zA-Z0-9_]+"
                    },
                    ["uicontrols"] = new List<string>
                    {
                        "syn\\.uicontrols\\.\\$checkbox\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$codepicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$colorpicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$contextmenu\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$data\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$dateperiodpicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$datepicker\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$multiselect\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$select\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$element\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$fileclient\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$list\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$guide\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$htmleditor\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$organization\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$radio\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$sourceeditor\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$textarea\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$textbox\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$button\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$tree\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$grid\\.[a-zA-Z0-9_]+",
                        "syn\\.uicontrols\\.\\$auigrid\\.[a-zA-Z0-9_]+"
                    }
                };

                string? targetDir = directory?.FullName;
                string scanType = value == null ? "functions" : value;
                if (targetDir == null || directory == null || directory.Exists == false)
                {
                    Log.Error("사용법: dotnet run \"<대상_디렉토리>\" [스캔_타입] > result.csv");
                    Log.Error("스캔 타입: 'functions' (기본값) 또는 'uicontrols'");
                    Environment.Exit(1);
                    return;
                }

                if (!scanTargets.TryGetValue(scanType, out var patternsToUse))
                {
                    string availableTypes = string.Join("' 또는 '", scanTargets.Keys);
                    Log.Error($"오류: 유효하지 않은 스캔 타입입니다. '{availableTypes}' 중에서 선택해주세요.");
                    Environment.Exit(1);
                    return;
                }

                string combinedPattern = $"({string.Join("|", patternsToUse)})";
                Regex synRegex = new Regex(combinedPattern, RegexOptions.Compiled);
                string baseDir = Path.GetFullPath(targetDir);

                Dictionary<string, List<string>> ScanDirectory(string currentDir, string baseDir, Regex synRegex)
                {
                    var results = new Dictionary<string, List<string>>();
                    var searchOption = SearchOption.AllDirectories;

                    try
                    {
                        var files = Directory.EnumerateFiles(currentDir, "*.*", searchOption)
                                             .Where(file => file.EndsWith(".js") || file.EndsWith(".html"));

                        foreach (var fullPath in files)
                        {
                            try
                            {
                                string content = File.ReadAllText(fullPath, Encoding.UTF8);
                                var matches = synRegex.Matches(content);

                                foreach (Match match in matches)
                                {
                                    string funcName = match.Value;
                                    string relPath = Path.GetRelativePath(baseDir, fullPath);

                                    if (!results.ContainsKey(funcName))
                                    {
                                        results[funcName] = new List<string>();
                                    }
                                    results[funcName].Add(relPath);
                                }
                            }
                            catch (Exception ex)
                            {
                                Log.Error($"파일을 읽는 중 오류 발생: {fullPath} - {ex.Message}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Error($"디렉토리 스캔 중 오류 발생: {currentDir} - {ex.Message}");
                    }

                    return results;
                }

                List<SummaryEntry> Summarize(Dictionary<string, List<string>> result)
                {
                    return result
                        .Select(kvp => new SummaryEntry
                        {
                            Function = kvp.Key,
                            TotalCount = kvp.Value.Count
                        })
                        .OrderByDescending(entry => entry.TotalCount)
                        .ToList();
                }

                var result = ScanDirectory(baseDir, baseDir, synRegex);
                var summary = Summarize(result);

                Console.OutputEncoding = Encoding.UTF8;
                Console.WriteLine("이름,사용횟수");
                foreach (var row in summary)
                {
                    Console.WriteLine($"{row.Function},{row.TotalCount}");
                }
            }, optionDirectory, optionValue);

            rootCommand.Add(subCommandSynUsage);

            #endregion

            #region publickey

            // publickey --file="C:\projects\MyLib\bin\Release\net8.0\MyLib.dll"
            var subCommandPublicKey = new Command("publickey", "지정한 .NET(.NET Core/5+/Framework) 관리형 DLL의 강력한 이름(Strong Name) 서명에 사용된 공개 키를 출력합니다.") {
                optionFile, optionValue
            };

            subCommandPublicKey.SetHandler((file, value) =>
            {
                string? path = file?.FullName;
                if (File.Exists(path) == false)
                {
                    Console.Error.WriteLine($"[오류] 파일을 찾을 수 없습니다: {path}");
                    Environment.Exit(2);
                }

                try
                {
                    var asmName = AssemblyName.GetAssemblyName(path);

                    var publicKey = asmName.GetPublicKey() ?? Array.Empty<byte>();
                    var publicKeyToken = asmName.GetPublicKeyToken() ?? Array.Empty<byte>();

                    Console.WriteLine($"파일: {path}");
                    Console.WriteLine($"이름: {asmName.Name}");
                    Console.WriteLine($"버전: {asmName.Version}");
                    Console.WriteLine();

                    if (publicKey.Length == 0)
                    {
                        Console.WriteLine("강력한 이름 서명: 아니오 (공개 키 없음)");
                    }
                    else
                    {
                        Console.WriteLine("강력한 이름 서명: 예");
                        Console.WriteLine("공개 키 (Hex):");
                        Console.WriteLine(ToHex(publicKey));
                        Console.WriteLine();
                        Console.WriteLine("공개 키 (Base64):");
                        Console.WriteLine(Convert.ToBase64String(publicKey));

                        using (SHA256 sha256 = SHA256.Create())
                        {
                            byte[] hash = sha256.ComputeHash(publicKey);
                            Console.WriteLine();
                            Console.WriteLine("공개 키 (SHA256):");
                            Console.WriteLine(ToHex(hash).ToLowerInvariant());
                        }
                    }

                    Console.WriteLine();
                    Console.WriteLine("공개 키 (Token):");
                    Console.WriteLine(publicKeyToken.Length == 0 ? "(없음)" : ToHex(publicKeyToken).ToLowerInvariant());

                    Environment.Exit(0);
                }
                catch (BadImageFormatException)
                {
                    Console.Error.WriteLine("[오류] .NET 어셈블리가 아닙니다(네이티브 DLL 또는 손상된 파일).");
                    Environment.Exit(3);
                }
                catch (FileLoadException ex)
                {
                    Console.Error.WriteLine("[오류] 어셈블리 메타데이터를 읽을 수 없습니다: " + ex.Message);
                    Environment.Exit(4);
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("[오류] 예기치 않은 오류: " + ex.Message);
                    Environment.Exit(5);
                }
            }, optionFile, optionValue);

            rootCommand.Add(subCommandPublicKey);

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

            var arguments = new ArgumentHelper(args);
            var argumentOptions = arguments["options"];
            if (argumentOptions != null)
            {
                commandOptions = new ArgumentHelper(argumentOptions.Split(" "));
            }

            var debug = false;
            if (arguments["debug"] != null)
            {
                debug = true;
            }

            await DebuggerAttach(debug);

            exitCode = await rootCommand.InvokeAsync(args);
            return exitCode;
        }

        public static string ToHex(byte[] data, bool upper = true)
        {
            if (data.Length == 0) return "";
            var sb = new StringBuilder(data.Length * 2);
            var format = upper ? "X2" : "x2";
            foreach (var b in data) sb.Append(b.ToString(format));
            return sb.ToString();
        }

        public static List<Entity.Tasks>? BindTasks(string taskFilePath, string key)
        {
            var result = new List<Entity.Tasks>();
            try
            {
                var taskJson = File.ReadAllText(taskFilePath);
                var taskMetas = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, List<Entity.Tasks>>>(taskJson);

                var os = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? "windows" : RuntimeInformation.IsOSPlatform(OSPlatform.OSX) == true ? "osx" : "linux";
                var moduleID = key.Split(":")[0];
                var taskID = key.Split(":")[1];

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
                var taskJson = File.ReadAllText(taskFilePath);
                var taskMetas = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, List<Entity.Tasks>>>(taskJson);

                var os = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true ? "windows" : RuntimeInformation.IsOSPlatform(OSPlatform.OSX) == true ? "osx" : "linux";
                var moduleID = key.Split(":")[0];
                var taskID = key.Split(":")[1];

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
                var fileText = File.ReadAllText(fileInfo.FullName.Replace("\\", "/"));
                var count = Regex.Matches(fileText, findText, RegexOptions.None).Count;
                if (count > 0)
                {
                    File.WriteAllText(fileInfo.FullName.Replace("\\", "/"), fileText.Replace(findText, replaceText));
                }
            }
        }

        public static void ReplaceInFiles(string directoryPath, string findText, string replaceText, bool deleteVsUserSettingsDirectory)
        {
            var directoryInfo = new DirectoryInfo(directoryPath);

            if (deleteVsUserSettingsDirectory && ignoredDirectoryNames.Contains(directoryInfo.Name))
            {
                return;
            }

            foreach (var file in Directory.GetFiles(directoryPath))
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.IsBinary() == false)
                {
                    var fileText = File.ReadAllText(file);
                    var count = Regex.Matches(fileText, findText, RegexOptions.None).Count;
                    if (count > 0)
                    {
                        File.WriteAllText(file, fileText.Replace(findText, replaceText));
                        replaceInFilesCount += count;
                    }
                }
            }

            foreach (var directory in Directory.GetDirectories(directoryPath))
            {
                ReplaceInFiles(directory, findText, replaceText, deleteVsUserSettingsDirectory);
            }
        }

        public static void ReplaceInFileNames(string directoryPath, string findText, string replaceText, bool deleteVsUserSettingsDirectory)
        {
            var directoryInfo = new DirectoryInfo(directoryPath);
            if (deleteVsUserSettingsDirectory && ignoredDirectoryNames.Contains(directoryInfo.Name))
            {
                return;
            }

            foreach (var file in Directory.GetFiles(directoryPath))
            {
                var fileInfo = new FileInfo(file);
                var count = Regex.Matches(fileInfo.Name, findText, RegexOptions.None).Count;
                if (count > 0)
                {
                    var newFileName = fileInfo.Name.Replace(findText, replaceText);
                    var originalFileName = fileInfo.Name;

                    if (newFileName.Equals(originalFileName, StringComparison.InvariantCultureIgnoreCase))
                    {
                        var tempFileName = $"temp_{originalFileName}_{Guid.NewGuid()}";
                        var tempFullFileName = fileInfo.FullName.Replace("\\", "/").ReplaceLastOccurrence(fileInfo.Name, tempFileName);
                        File.Move(fileInfo.FullName.Replace("\\", "/"), tempFullFileName);
                        var newFullFileName = fileInfo.FullName.Replace("\\", "/").ReplaceLastOccurrence(fileInfo.Name, newFileName);
                        File.Move(tempFullFileName, newFullFileName);
                    }
                    else
                    {
                        var newFullFileName = fileInfo.FullName.Replace("\\", "/").ReplaceLastOccurrence(fileInfo.Name, newFileName);
                        File.Move(fileInfo.FullName.Replace("\\", "/"), newFullFileName);
                    }

                    replaceInFileNamesCount += count;
                }
            }

            foreach (var directory in Directory.GetDirectories(directoryPath))
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

            var count = Regex.Matches(directoryInfo.Name, findText, RegexOptions.None).Count;
            var directoryInfoFullName = directoryInfo.FullName.Replace("\\", "/");

            if (count > 0)
            {
                var newDirectoryName = directoryInfo.Name.Replace(findText, replaceText);
                var orginalDirectoryName = directoryInfo.Name;
                if (newDirectoryName.Equals(orginalDirectoryName, StringComparison.InvariantCultureIgnoreCase))
                {
                    var tempDirectoryName = $"temp_{orginalDirectoryName}_{Guid.NewGuid()}";
                    var tempFullDirectoryName = directoryInfo.FullName.Replace("\\", "/").ReplaceLastOccurrence(directoryInfo.Name, tempDirectoryName);
                    Directory.Move(directoryInfo.FullName.Replace("\\", "/"), tempFullDirectoryName);
                    var newFullDirectoryName = directoryInfo.FullName.Replace("\\", "/").ReplaceLastOccurrence(directoryInfo.Name, newDirectoryName);
                    Directory.Move(tempFullDirectoryName, newFullDirectoryName);
                }
                else
                {
                    directoryInfoFullName = directoryInfo.FullName.Replace("\\", "/").ReplaceLastOccurrence(directoryInfo.Name, newDirectoryName);
                    Directory.Move(directoryInfo.FullName.Replace("\\", "/"), directoryInfoFullName);
                }

                replaceInDirectoryNamesCount += count;
            }

            foreach (var directory in Directory.GetDirectories(directoryInfoFullName))
            {
                ReplaceInDirectoryNames(directory, findText, replaceText, deleteVsUserSettingsDirectory);
            }
        }

        private static async System.Threading.Tasks.Task DebuggerAttach(bool debug)
        {
            if (debug == true)
            {
                var startupAwaitDelay = 10000;
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

    class SummaryEntry
    {
        public required string Function { get; set; }
        public required int TotalCount { get; set; }
    }
}
