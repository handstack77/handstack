using System;
using System.Collections.Generic;
using System.CommandLine;
using System.CommandLine.Parsing;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using handstack.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Microsoft.Extensions.Configuration;

using Serilog;

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
            var exitCode = 0;
            var entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            if (string.IsNullOrWhiteSpace(entryBasePath) == true)
            {
                entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            }

            if (entryBasePath != Environment.CurrentDirectory)
            {
                Environment.CurrentDirectory = entryBasePath;
            }

            var environmentName = Environment.GetEnvironmentVariable("ACK_ENVIRONMENT");
            if (string.IsNullOrWhiteSpace(environmentName) == true)
            {
                environmentName = "";
            }

            var appSettingsFilePath = PathExtensions.Combine(entryBasePath, "appsettings.json");
            var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
            var configuration = configurationBuilder.Build();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();

            var optionDebug = new Option<bool?>("--debug") { Description = "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)" };
            var optionAckFile = new Option<FileInfo?>("--ack") { Description = "ack 프로그램 전체 파일 경로입니다" };
            var optionArguments = new Option<string?>("--arguments") { Description = "ack 프로그램 실행시 전달할 매개변수 입니다. 예) \"--modules=wwwroot,transact,dbclient,function\"" };
            var optionPort = new Option<int?>("--port") { Description = "프로그램 수신 포트를 설정합니다. (기본값: 8080)" };
            var optionProcessID = new Option<int?>("--pid") { Description = "OS에서 부여한 프로세스 ID 입니다" };
            var optionFormat = new Option<string?>("--format") { Description = "실행 명령에 따라 적용하는 포맷입니다. 예) encrypt --format=base64|aes256|syn|sha256" };
            var optionKey = new Option<string?>("--key") { Description = "ack 프로그램 실행 검증 키입니다" };
            var optionValue = new Option<string?>("--value") { Description = "실행 명령에 따라 적용하는 검증 값입니다" };
            var optionAppSettingFile = new Option<FileInfo?>("--appsettings") { Description = "ack 프로그램 appsettings 파일명입니다" };
            var optionDirectory = new Option<DirectoryInfo?>("--directory") { Description = "실행 명령에 따라 적용하는 기준 디렉토리 경로입니다" };
            var optionFile = new Option<FileInfo?>("--file") { Description = "실행 명령에 따라 적용하는 파일 경로입니다" };
            var optionFind = new Option<string?>("--find") { Description = "실행 명령에 따라 적용하는 검색 값입니다" };
            var optionReplace = new Option<string?>("--replace") { Description = "실행 명령에 따라 적용하는 변경 값입니다" };
            var optionReplaceExpressions = new Option<string[]>("--replace") { Description = "replacetext 명령에서 적용할 치환 규칙입니다. 예) --replace handstack=myprojectname --replace old=new" };
            var optionOptions = new Option<string?>("--options") { Description = "실행 명령에 따라 적용하는 옵션 값입니다" };
            var rootOptionModules = new Option<string?>("--modules") { Description = "프로그램 시작시 포함할 모듈을 설정합니다. 예) --modules=wwwroot,transact,dbclient,function" };

            var rootCommand = new RootCommand("IT 혁신은 고객과 업무에 들여야 하는 시간과 노력을 줄이는 데 있습니다. HandStack은 기업 경쟁력 유지를 위한 도구입니다") {
                optionDebug, optionPort, rootOptionModules, optionOptions
            };

            HandstackCommandRegistry.Register(
                rootCommand,
                optionAckFile,
                optionArguments,
                optionPort,
                optionProcessID,
                optionFormat,
                optionKey,
                optionValue,
                optionAppSettingFile,
                optionDirectory,
                optionFile,
                optionFind,
                optionReplace,
                optionReplaceExpressions,
                optionOptions);
            rootCommand.SetAction((parseResult) =>
            {
                var debug = parseResult.GetValue(optionDebug);
                var port = parseResult.GetValue(optionPort);
                var modules = parseResult.GetValue(rootOptionModules);
                var options = parseResult.GetValue(optionOptions);

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
            });

            var arguments = new ArgumentHelper(args);
            var debug = false;
            if (arguments["debug"] != null)
            {
                debug = true;
            }

            await DebuggerAttach(debug);

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

        public static string ToHex(byte[] data, bool upper = true)
        {
            if (data.Length == 0) return "";
            var sb = new StringBuilder(data.Length * 2);
            var format = upper ? "X2" : "x2";
            foreach (var b in data) sb.Append(b.ToString(format));
            return sb.ToString();
        }

        internal static void CreateZipFromDirectoryWithProgress(string sourceDirectoryPath, string zipFilePath)
        {
            var sourceDirectoryFullPath = Path.GetFullPath(sourceDirectoryPath);
            var sourceDirectoryInfo = new DirectoryInfo(sourceDirectoryFullPath);
            if (sourceDirectoryInfo.Exists == false)
            {
                throw new DirectoryNotFoundException($"sourceDirectoryPath: {sourceDirectoryPath}");
            }

            var filePaths = Directory.EnumerateFiles(sourceDirectoryFullPath, "*", SearchOption.AllDirectories).ToList();
            var directoryPaths = Directory.EnumerateDirectories(sourceDirectoryFullPath, "*", SearchOption.AllDirectories).ToList();

            long totalBytes = 0;
            foreach (var filePath in filePaths)
            {
                totalBytes += new FileInfo(filePath).Length;
            }

            var totalFiles = filePaths.Count;
            var processedBytes = 0L;
            var processedFiles = 0;
            var progressPercent = -1;
            var progressFiles = -1;

            using (var zipStream = new FileStream(zipFilePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create))
            {
                foreach (var directoryPath in directoryPaths)
                {
                    if (Directory.EnumerateFileSystemEntries(directoryPath).Any() == false)
                    {
                        var relativeDirectoryPath = Path.GetRelativePath(sourceDirectoryFullPath, directoryPath).Replace("\\", "/");
                        archive.CreateEntry($"{relativeDirectoryPath}/");
                    }
                }

                if (filePaths.Count == 0)
                {
                    WriteZipProgress("compress", 0, 0, 0, 0, ref progressPercent, ref progressFiles);
                    return;
                }

                foreach (var filePath in filePaths)
                {
                    var relativeFilePath = Path.GetRelativePath(sourceDirectoryFullPath, filePath).Replace("\\", "/");
                    var entry = archive.CreateEntry(relativeFilePath, CompressionLevel.Optimal);

                    using (var sourceStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                    using (var entryStream = entry.Open())
                    {
                        CopyStreamWithProgress(sourceStream, entryStream, copiedBytes =>
                        {
                            processedBytes += copiedBytes;
                            WriteZipProgress("compress", processedBytes, totalBytes, processedFiles, totalFiles, ref progressPercent, ref progressFiles);
                        });
                    }

                    processedFiles += 1;
                    WriteZipProgress("compress", processedBytes, totalBytes, processedFiles, totalFiles, ref progressPercent, ref progressFiles);
                }
            }

            WriteZipProgress("compress", totalBytes, totalBytes, totalFiles, totalFiles, ref progressPercent, ref progressFiles);
        }

        internal static void ExtractZipToDirectoryWithProgress(string zipFilePath, string destinationDirectoryPath)
        {
            var zipFileFullPath = Path.GetFullPath(zipFilePath);
            var destinationDirectoryFullPath = Path.GetFullPath(destinationDirectoryPath);
            Directory.CreateDirectory(destinationDirectoryFullPath);

            var destinationDirectoryWithSeparator = destinationDirectoryFullPath.EndsWith(Path.DirectorySeparatorChar) == true
                ? destinationDirectoryFullPath
                : destinationDirectoryFullPath + Path.DirectorySeparatorChar;

            using (var archive = ZipFile.OpenRead(zipFileFullPath))
            {
                var fileEntries = archive.Entries.Where(x => string.IsNullOrEmpty(x.Name) == false).ToList();
                long totalBytes = 0;
                foreach (var entry in fileEntries)
                {
                    totalBytes += entry.Length;
                }

                var totalFiles = fileEntries.Count;
                var processedBytes = 0L;
                var processedFiles = 0;
                var progressPercent = -1;
                var progressFiles = -1;

                if (archive.Entries.Count == 0)
                {
                    WriteZipProgress("extract", 0, 0, 0, 0, ref progressPercent, ref progressFiles);
                    return;
                }

                foreach (var entry in archive.Entries)
                {
                    var entryFullPath = Path.GetFullPath(Path.Combine(destinationDirectoryFullPath, entry.FullName));

                    if (entryFullPath.StartsWith(destinationDirectoryWithSeparator, StringComparison.OrdinalIgnoreCase) == false
                        && string.Equals(entryFullPath, destinationDirectoryFullPath, StringComparison.OrdinalIgnoreCase) == false)
                    {
                        throw new IOException($"ZIP 엔트리 경로가 잘못되었습니다: {entry.FullName}");
                    }

                    if (string.IsNullOrEmpty(entry.Name) == true)
                    {
                        Directory.CreateDirectory(entryFullPath);
                        continue;
                    }

                    var targetDirectoryPath = Path.GetDirectoryName(entryFullPath);
                    if (string.IsNullOrWhiteSpace(targetDirectoryPath) == false)
                    {
                        Directory.CreateDirectory(targetDirectoryPath);
                    }

                    using (var sourceStream = entry.Open())
                    using (var destinationStream = new FileStream(entryFullPath, FileMode.Create, FileAccess.Write, FileShare.None))
                    {
                        CopyStreamWithProgress(sourceStream, destinationStream, copiedBytes =>
                        {
                            processedBytes += copiedBytes;
                            WriteZipProgress("extract", processedBytes, totalBytes, processedFiles, totalFiles, ref progressPercent, ref progressFiles);
                        });
                    }

                    File.SetLastWriteTime(entryFullPath, entry.LastWriteTime.LocalDateTime);
                    processedFiles += 1;
                    WriteZipProgress("extract", processedBytes, totalBytes, processedFiles, totalFiles, ref progressPercent, ref progressFiles);
                }

                WriteZipProgress("extract", totalBytes, totalBytes, totalFiles, totalFiles, ref progressPercent, ref progressFiles);
            }
        }

        private static void CopyStreamWithProgress(Stream source, Stream destination, Action<int> onBytesCopied)
        {
            var buffer = new byte[81920];
            while (true)
            {
                var readBytes = source.Read(buffer, 0, buffer.Length);
                if (readBytes <= 0)
                {
                    break;
                }

                destination.Write(buffer, 0, readBytes);
                onBytesCopied(readBytes);
            }
        }

        private static void WriteZipProgress(string operation, long processedBytes, long totalBytes, int processedFiles, int totalFiles, ref int previousPercent, ref int previousFiles)
        {
            int progressPercent;
            if (totalBytes > 0)
            {
                progressPercent = (int)Math.Clamp((processedBytes * 100) / totalBytes, 0, 100);
                if (processedFiles < totalFiles && progressPercent == 100)
                {
                    progressPercent = 99;
                }
            }
            else if (totalFiles > 0)
            {
                progressPercent = (int)Math.Clamp((processedFiles * 100) / totalFiles, 0, 100);
            }
            else
            {
                progressPercent = 100;
            }

            if (progressPercent == previousPercent && processedFiles == previousFiles)
            {
                return;
            }

            previousPercent = progressPercent;
            previousFiles = processedFiles;

            var processedMegabytes = processedBytes / 1024d / 1024d;
            var totalMegabytes = totalBytes / 1024d / 1024d;
            Console.Write($"\r[{operation}] {progressPercent,3}% ({processedFiles}/{totalFiles} files, {processedMegabytes:0.00}/{totalMegabytes:0.00} MB)");

            if (progressPercent == 100)
            {
                Console.WriteLine();
            }
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

        public static List<KeyValuePair<string, string>> BindReplaceMappings(string find, string[] replaceExpressions)
        {
            var result = new List<KeyValuePair<string, string>>();
            if (replaceExpressions == null || replaceExpressions.Length == 0)
            {
                return result;
            }

            if (string.IsNullOrWhiteSpace(find) == false)
            {
                var replaceText = replaceExpressions.FirstOrDefault();
                if (string.IsNullOrWhiteSpace(replaceText) == false)
                {
                    result.Add(new KeyValuePair<string, string>(find, replaceText));
                }

                return result;
            }

            foreach (var replaceExpression in replaceExpressions)
            {
                if (string.IsNullOrWhiteSpace(replaceExpression) == true)
                {
                    continue;
                }

                var separatorIndex = replaceExpression.IndexOf('=');
                if (separatorIndex < 1)
                {
                    Log.Information($"replace:{replaceExpression} 형식 확인이 필요합니다. 예) --replace old=new");
                    continue;
                }

                var findText = replaceExpression.SubstringSafe(0, separatorIndex);
                var replaceText = replaceExpression.SubstringSafe(separatorIndex + 1);
                result.Add(new KeyValuePair<string, string>(findText, replaceText));
            }

            return result;
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


