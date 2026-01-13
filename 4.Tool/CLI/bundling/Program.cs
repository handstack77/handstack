using System;
using System.Collections.Generic;
using System.CommandLine;
using System.CommandLine.Parsing;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using BundlerMinifier;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;

using Microsoft.Extensions.Configuration;

using Newtonsoft.Json;

using NUglify;
using NUglify.Css;
using NUglify.Html;
using NUglify.JavaScript;

using Serilog;

namespace bundling
{
    public class BundleFile
    {
        public string fileType = string.Empty;
        public List<string> inputFileNames = new List<string>();
        public string outputFileName = string.Empty;
    }

    internal class Program
    {
        private static System.Timers.Timer? startupAwaitTimer;
        private static CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
        private static ArgumentHelper? commandOptions = null;

        static async Task<int> Main(string[] args)
        {
            var exitCode = 0;
            Console.WriteLine($"Current Directory from {Directory.GetCurrentDirectory()}");
            Console.WriteLine($"Launched from {Environment.CurrentDirectory}");
            Console.WriteLine($"Physical location {AppDomain.CurrentDomain.BaseDirectory}");
            Console.WriteLine($"Runtime call {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");
            Console.WriteLine($"Batch Program Start...");

            var optionDebug = new Option<bool?>("--debug") { Description = "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)", DefaultValueFactory = parseResult => false };

            var entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            if (string.IsNullOrEmpty(entryBasePath) == true)
            {
                entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            }

            if (entryBasePath != Environment.CurrentDirectory)
            {
                Environment.CurrentDirectory = entryBasePath;
            }

            var appSettingsFilePath = PathExtensions.Combine(entryBasePath, "appsettings.json");
            var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
            var configuration = configurationBuilder.Build();

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .CreateLogger();

            var optionFile = new Option<FileInfo>("--file") { Description = ".html, .js, .css 형식의 전체 파일 경로입니다." };
            var optionKeepSourceFile = new Option<bool?>("--keep") { Description = "Compress 효과 적용시 원본 파일을 .src 만들지 여부입니다. (기본값 false)" };
            var optionByPassMinFile = new Option<bool?>("--passmin") { Description = "Compress 효과 적용시 파일명에 .min 파일을 건너뛰는지 여부입니다. (기본값 true)" };
            var optionDirectoryInfo = new Option<DirectoryInfo>("--path") { Description = "bundling 프로그램 기능을 적용하는 전체 디렉토리 경로입니다." };
            var optionFormat = new Option<string>("--format") { Description = "실행 명령에 따라 적용하는 포맷입니다. 예) encrypt --format=base64|aes256|syn|sha256" };
            var optionBundle = new Option<string>("--bundle") { Description = "BundleFile 형식의 JSON 포맷의 Base64 문자열입니다." };
            var optionExcludes = new Option<string?>("--excludes") { Description = "실행 명령에서 제외할 옵션 정보입니다." };
            var optionArtifactFile = new Option<FileInfo>("--artifactFile") { Description = "ArtifactFile 형식의 .json 형식의 전체 파일 경로입니다." };

            var rootCommand = new RootCommand("HandStack 기반 화면을 위한 Bundling, Compress, Beautify CLI 프로그램"){
                optionDebug
            };

            #region compress

            // bundling compress --file=sample\\BOD\\BOD010.html --keep=true
            var subCommandCompress = new Command("compress", ".html, .js, .css 형식의 파일에 Compress 효과를 적용합니다.") {
                optionFile,
                optionKeepSourceFile,
                optionByPassMinFile,
                optionDebug
            };
            subCommandCompress.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);
                var keepSourceFile = parseResult.GetValue(optionKeepSourceFile);
                var byPassMinFile = parseResult.GetValue(optionByPassMinFile);

                if (keepSourceFile == null)
                {
                    keepSourceFile = false;
                }

                if (byPassMinFile == null)
                {
                    byPassMinFile = true;
                }

                try
                {
                    if (file == null || file.Exists == false)
                    {
                        Log.Warning("대상 파일을 찾을 수 없습니다");
                    }
                    else
                    {
                        WebFileCompress(file, keepSourceFile.Value, byPassMinFile.Value);
                    }
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "compress 기능 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }

                return exitCode;
            });
            rootCommand.Add(subCommandCompress);

            #endregion

            #region compresspath

            // bundling compresspath --path=sample\\BOD --keep=true
            var subCommandCompressPath = new Command("compresspath", "디렉토리내 모든 (하위 디렉토리 포함) .html, .js, .css 형식의 파일에 Compress 효과를 적용합니다.") {
                optionDirectoryInfo,
                optionKeepSourceFile,
                optionByPassMinFile,
                optionExcludes,
                optionDebug
            };
            subCommandCompressPath.SetAction((parseResult) =>
            {
                var directory = parseResult.GetValue(optionDirectoryInfo);
                var keepSourceFile = parseResult.GetValue(optionKeepSourceFile);
                var byPassMinFile = parseResult.GetValue(optionByPassMinFile);
                var excludeDirectories = parseResult.GetValue(optionExcludes);

                if (keepSourceFile == null)
                {
                    keepSourceFile = false;
                }

                if (byPassMinFile == null)
                {
                    byPassMinFile = true;
                }

                if (excludeDirectories == null)
                {
                    excludeDirectories = "";
                }

                try
                {
                    if (directory == null || directory.Exists == false)
                    {
                        Log.Warning("대상 디렉토리 경로를 찾을 수 없습니다");
                    }
                    else
                    {
                        WebFileCompress(directory, keepSourceFile.Value, byPassMinFile.Value, excludeDirectories);
                    }
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "compresspath 기능 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            });
            rootCommand.Add(subCommandCompressPath);

            #endregion

            #region compress

            // bundling minify --file=sample\\BOD\\BOD010.html --keep=true
            var subCommandMinify = new Command("minify", ".html, .js, .css 형식의 파일에 *.min.xxx 파일을 *.xxx 파일로 적용합니다.") {
                optionFile,
                optionKeepSourceFile,
                optionDebug
            };
            subCommandMinify.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);
                var keepSourceFile = parseResult.GetValue(optionKeepSourceFile);

                if (keepSourceFile == null)
                {
                    keepSourceFile = false;
                }

                try
                {
                    if (file == null || file.Exists == false)
                    {
                        Log.Warning("대상 파일을 찾을 수 없습니다");
                    }
                    else
                    {
                        WebFileMinify(file, keepSourceFile.Value);
                    }
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "minify 기능 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            });
            rootCommand.Add(subCommandMinify);

            #endregion

            #region minifypath

            // bundling minifypath --path=sample\\BOD --keep=true
            var subCommandMinifyPath = new Command("minifypath", "특정 디렉토리내 .html, .js, .css 형식의 파일에 *.min.xxx 파일을 *.xxx 파일로 적용합니다.") {
                optionDirectoryInfo,
                optionKeepSourceFile,
                optionDebug
            };
            subCommandMinifyPath.SetAction((parseResult) =>
            {
                var directory = parseResult.GetValue(optionDirectoryInfo);
                var keepSourceFile = parseResult.GetValue(optionKeepSourceFile);

                if (keepSourceFile == null)
                {
                    keepSourceFile = false;
                }

                try
                {
                    if (directory == null || directory.Exists == false)
                    {
                        Log.Warning("대상 디렉토리 경로를 찾을 수 없습니다");
                    }
                    else
                    {
                        WebFileMinify(directory, keepSourceFile.Value);
                    }
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "minifypath 기능 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            });
            rootCommand.Add(subCommandMinifyPath);

            #endregion

            #region beautifyfile

            // bundling beautifyfile --file=sample\\BOD\\BOD010.html
            var subCommandBeautify = new Command("beautifyfile", ".html, .js, .css 형식의 파일에 Beautify 효과를 적용합니다.") {
                optionFile,
                optionDebug
            };
            subCommandBeautify.SetAction((parseResult) =>
            {
                var file = parseResult.GetValue(optionFile);

                try
                {
                    if (file == null || file.Exists == false)
                    {
                        Log.Warning("대상 파일을 찾을 수 없습니다");
                    }
                    else
                    {
                        Beautify(file);
                    }
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "beautifyfile 기능 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            });
            rootCommand.Add(subCommandBeautify);

            #endregion

            #region beautifypath

            // bundling beautifypath --path=sample\\BOD
            var subCommandBeautifyPath = new Command("beautifypath", "디렉토리내 모든 (하위 디렉토리 포함) .html, .js, .css 형식의 파일에 Beautify 효과를 적용합니다.") {
                optionDirectoryInfo,
                optionDebug
            };
            subCommandBeautifyPath.SetAction((parseResult) =>
            {
                var directory = parseResult.GetValue(optionDirectoryInfo);

                try
                {
                    if (directory == null || directory.Exists == false)
                    {
                        Log.Warning("대상 디렉토리 경로를 찾을 수 없습니다");
                    }
                    else
                    {
                        Beautify(directory);
                    }
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "beautifypath 기능 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            });
            rootCommand.Add(subCommandBeautifyPath);

            #endregion

            #region merge

            // bundling merge --bundle=eyJmaWxlVHlwZSI6ImpzIiwiaW5wdXRGaWxlTmFtZXMi...
            var subCommandMerge = new Command("merge", "동일한 형식의 텍스트 파일을 단일 파일로 병합합니다") {
                optionBundle,
                optionDebug
            };
            subCommandMerge.SetAction((parseResult) =>
            {
                /*
                // string fileType, List<string> inputFileNames, string outputFileName
                var bundleFile = new
                {
                    fileType = fileType,
                    inputFileNames = inputFileNames,
                    outputFileName = outputFileName
                };

                string base64BundleFile = JsonConvert.SerializeObject(bundleFile).EncodeBase64();
                */
                var bundle = parseResult.GetValue(optionBundle);

                string base64BundleFile = bundle.ToStringSafe();
                var bundleFile = JsonConvert.DeserializeObject<BundleFile>(base64BundleFile.DecodeBase64());
                if (bundleFile != null)
                {
                    exitCode = BundleFileProcess(bundleFile.fileType, bundleFile.inputFileNames, bundleFile.outputFileName);
                }
            });
            rootCommand.Add(subCommandMerge);

            #endregion

            #region artifact

            // bundling artifact --artifactFile=sample\\bundleconfig.json
            var subCommandArtifact = new Command("artifact", "ArtifactFile json 파일로 번들링을 수행합니다") {
                optionArtifactFile,
                optionDebug
            };
            subCommandArtifact.SetAction((parseResult) =>
            {
                var artifactFile = parseResult.GetValue(optionArtifactFile);

                if (artifactFile == null || artifactFile.Exists == false)
                {
                    Log.Warning("대상 파일을 찾을 수 없습니다");
                }
                else
                {
                    var processor = new BundleFileProcessor();
                    lock (processor)
                    {
                        var artifactFilePath = artifactFile.FullName.Replace("\\", "/");
                        var bundles = BundleHandler.GetBundles(artifactFilePath);
                        var bundleResult = processor.Process(artifactFilePath, bundles);
                        if (bundleResult == false)
                        {
                            exitCode = -1;
                        }
                    }
                }
            });
            rootCommand.Add(subCommandArtifact);

            #endregion

            rootCommand.SetAction((parseResult) =>
            {
                var debug = parseResult.GetValue(optionDebug);

                try
                {
                    Log.Information($"Current Directory from {Directory.GetCurrentDirectory()}");
                    Log.Information($"Launched from {Environment.CurrentDirectory}");
                    Log.Information($"Physical location {AppDomain.CurrentDomain.BaseDirectory}");
                    Log.Information($"Runtime call {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");
                }
                catch (Exception exception)
                {
                    Log.Fatal(exception, "프로그램 실행 중 오류가 발생했습니다");
                    exitCode = -1;
                }
            });

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

        private static int BundleFileProcess(string fileType, List<string> inputFileNames, string outputFileName)
        {
            var result = 0;
            try
            {
                // https://github.com/madskristensen/BundlerMinifier/wiki/bundleconfig.json-specs
                var bundle = new Bundle();
                bundle.SourceMap = false;
                bundle.OutputFileName = outputFileName;

                for (var i = 0; i < inputFileNames.Count; i++)
                {
                    var inputFileName = inputFileNames[i];
                    if (bundle.InputFiles.Contains(inputFileName) == false && File.Exists(inputFileName) == true)
                    {
                        bundle.InputFiles.Add(inputFileName);
                    }
                }

                var fileInfo = new FileInfo(outputFileName);
                if (fileInfo.Directory?.Exists == false)
                {
                    fileInfo.Directory.Create();
                }

                var artifactFilePath = outputFileName.Replace("." + fileType, ".json");
                BundleHandler.AddBundle(artifactFilePath, bundle);

                var processor = new BundleFileProcessor();
                lock (processor)
                {
                    var bundles = BundleHandler.GetBundles(artifactFilePath);
                    var bundleResult = processor.Process(artifactFilePath, bundles);
                    if (bundleResult == true)
                    {
                        result = 0;
                    }
                    else
                    {
                        result = -1;
                    }
                }

            }
            catch (Exception exception)
            {
                result = -1;
                Log.Information("[{LogCategory}] " + $"inputFileName: {string.Join(",", inputFileNames)}, outputFileName: {outputFileName}, exception: {exception}");
            }

            return result;
        }

        public static void WebFileCompress(FileInfo file, bool keepSourceFile = false, bool byPassMinFile = true)
        {
            if (file.Exists == true)
            {
                if (byPassMinFile == true && file.Name.IndexOf(".min") > -1)
                {
                    return;
                }

                UglifyResult? uglifyResult = null;

                try
                {
                    var code = File.ReadAllText(file.FullName.Replace("\\", "/"));
                    switch (file.Extension)
                    {
                        case ".html":
                            var htmlSettings = new HtmlSettings();
                            htmlSettings.KeepTags.Add("html");
                            htmlSettings.KeepTags.Add("head");
                            htmlSettings.KeepTags.Add("body");
                            htmlSettings.RemoveComments = true;
                            uglifyResult = Uglify.Html(code, settings: htmlSettings);
                            break;
                        case ".js":
                            var codeSettings = new CodeSettings();
                            codeSettings.PreserveImportantComments = false;
                            code = code.Replace("use strict", "");
                            uglifyResult = Uglify.Js(code, codeSettings);
                            break;
                        case ".css":
                            var cssSettings = new CssSettings();
                            cssSettings.CommentMode = CssComment.None;
                            uglifyResult = Uglify.Css(code, cssSettings);
                            break;
                        default:
                            break;
                    }

                    if (uglifyResult != null && uglifyResult.HasValue == true)
                    {
                        if (uglifyResult.Value.HasErrors == true)
                        {
                            Log.Error(string.Join("\n", uglifyResult.Value.Errors));
                        }
                        else
                        {
                            if (keepSourceFile == true)
                            {
                                File.Move(file.FullName.Replace("\\", "/"), Path.ChangeExtension(file.FullName.Replace("\\", "/"), ".src" + file.Extension), true);
                            }

                            var uglifyCode = Regex.Replace(uglifyResult.Value.Code, @"\s{2,}", " ");

                            if (file.Extension == ".js")
                            {
                                File.WriteAllText(file.FullName.Replace("\\", "/"), uglifyCode + ";");
                            }
                            else
                            {
                                File.WriteAllText(file.FullName.Replace("\\", "/"), uglifyCode);
                            }

                            Log.Information($"file: {file.FullName.Replace("\\", "/")}");
                        }
                    }
                    else
                    {
                        Log.Error($"file: {file.FullName.Replace("\\", "/")} uglifyResult 반환 오류 확인 필요");
                    }
                }
                catch
                {
                    Log.Error($"file: {file.FullName.Replace("\\", "/")} 실행 오류 확인 필요");
                }
            }
        }

        public static void WebFileCompress(DirectoryInfo directory, bool keepSourceFile = false, bool byPassMinFile = true, string excludeDirectories = "")
        {
            var excludes = new List<string>();
            var excludeList = excludeDirectories.SplitAndTrim('|').ToList();
            for (var i = 0; i < excludeList.Count; i++)
            {
                var excludePath = PathExtensions.Combine(directory.FullName.Replace("\\", "/"), excludeList[i]);
                excludes.Add(excludePath);
            }

            var extensions = new[] { ".js", ".html", ".css" };

            var files = directory.GetFiles("*.*", SearchOption.AllDirectories)
                .Where((file) =>
                {
                    var result = extensions.Contains(file.Extension) == true && file.Name.Contains(".src.") == false;
                    if (result == true)
                    {
                        var fileDirectoryPath = file.DirectoryName.ToStringSafe();
                        for (var i = 0; i < excludes.Count; i++)
                        {
                            if (fileDirectoryPath.StartsWith(excludes[i]) == true)
                            {
                                result = false;
                                break;
                            }
                        }
                    }
                    return result;
                })
                .ToList();

            Log.Information($"files: {files.Count}");

            foreach (var file in files)
            {
                WebFileCompress(file, keepSourceFile, byPassMinFile);
            }
        }

        public static void WebFileMinify(FileInfo file, bool keepSourceFile = false)
        {
            if (file.Exists == true && (file.Name.EndsWith(".min.html") == true || file.Name.EndsWith(".min.js") == true || file.Name.EndsWith(".min.css") == true))
            {
                var targetFilePath = file.FullName.Replace("\\", "/").Replace(file.Name, file.Name.Replace(".min", ""));
                if (keepSourceFile == true && File.Exists(targetFilePath) == true)
                {
                    File.Move(targetFilePath, Path.ChangeExtension(targetFilePath, ".src" + file.Extension), true);
                }

                File.Move(file.FullName.Replace("\\", "/"), targetFilePath, true);
            }
        }

        public static void WebFileMinify(DirectoryInfo directory, bool keepSourceFile = false)
        {
            var extensions = new[] { ".min.js", ".min.html", ".min.css" };

            var files = directory.GetFiles("*.*", SearchOption.AllDirectories)
                .Where(file => (file.Name.EndsWith(".min.html") == true || file.Name.EndsWith(".min.js") == true || file.Name.EndsWith(".min.css") == true))
                .ToList();

            foreach (var file in files)
            {
                WebFileMinify(file, keepSourceFile);
            }
        }

        public static void Beautify(FileInfo file)
        {
            if (file.Exists == true)
            {
                UglifyResult? uglifyResult = null;
                var code = File.ReadAllText(file.FullName.Replace("\\", "/"));

                switch (file.Extension)
                {
                    case ".html":
                        uglifyResult = Uglify.Html(code, settings: HtmlSettings.Pretty());
                        break;
                    case ".js":
                        uglifyResult = Uglify.Js(code, codeSettings: CodeSettings.Pretty());
                        break;
                    case ".css":
                        uglifyResult = Uglify.Css(code, settings: CssSettings.Pretty());
                        break;
                    default:
                        break;
                }

                if (uglifyResult != null && uglifyResult.HasValue == true)
                {
                    if (uglifyResult.Value.HasErrors == true)
                    {
                        Log.Information(string.Join("\n", uglifyResult.Value.Errors));
                    }
                    else
                    {
                        File.WriteAllText(file.FullName.Replace("\\", "/"), uglifyResult.Value.Code);
                    }
                }
            }
        }

        public static void Beautify(DirectoryInfo directory)
        {
            var extensions = new[] { ".js", ".html", ".css" };

            var files = directory.GetFiles("*.*", SearchOption.AllDirectories)
                .Where(file => extensions.Contains(file.Extension) == true)
                .ToList();

            foreach (var file in files)
            {
                Beautify(file);
            }
        }

        private static async Task DebuggerAttach(bool debug)
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
}
