using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

internal static class Program
{
    private static async Task<int> Main(string[] args)
    {
        PackOptions options;
        try
        {
            options = PackOptions.Parse(args);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            Console.Error.WriteLine("도움말을 보려면 --help 옵션을 사용하세요.");
            return 1;
        }

        if (options.ShowHelp)
        {
            PackOptions.PrintHelp();
            return 0;
        }

        if (!Directory.Exists(options.SourceDirectory))
        {
            Console.Error.WriteLine($"소스 디렉터리를 찾을 수 없습니다: {options.SourceDirectory}");
            return 1;
        }

        Directory.CreateDirectory(options.OutputDirectory);

        Console.WriteLine("설치 파일 패키징을 시작합니다.");
        Console.WriteLine($"소스 경로 : {options.SourceDirectory}");
        Console.WriteLine($"출력 경로 : {options.OutputDirectory}");
        Console.WriteLine($"대상      : {string.Join(", ", options.Targets)}");
        Console.WriteLine($"앱 이름   : {options.AppName}");
        Console.WriteLine($"버전      : {options.Version}");

        var packager = new DotnetInstaller(options);
        var results = await packager.RunAsync();

        Console.WriteLine();
        Console.WriteLine("결과 요약:");
        var failedCount = 0;

        foreach (var result in results)
        {
            var status = result.Success ? "성공" : "실패";
            Console.WriteLine($"- [{status}] {result.Target}: {result.Message}");
            if (!result.Success)
            {
                failedCount++;
            }
        }

        return failedCount > 0 ? 1 : 0;
    }
}

internal sealed class DotnetInstaller(PackOptions options)
{
    private readonly PackOptions _options = options;

    public async Task<IReadOnlyList<PackageResult>> RunAsync()
    {
        var results = new List<PackageResult>();
        foreach (var target in _options.Targets)
        {
            try
            {
                PackageResult result = target switch
                {
                    TargetPlatform.Windows => await BuildWindowsInstallerAsync(),
                    TargetPlatform.Ubuntu => await BuildUbuntuDebAsync(),
                    TargetPlatform.MacOs => await BuildMacPkgAsync(),
                    _ => throw new InvalidOperationException($"지원하지 않는 대상 플랫폼입니다: {target}")
                };

                results.Add(result);
            }
            catch (Exception ex)
            {
                results.Add(new PackageResult(target, false, ex.Message, null));
            }
        }

        return results;
    }

    // Inno Setup 스크립트를 동적으로 생성해 Windows 설치 파일(.exe)을 만든다.
    private async Task<PackageResult> BuildWindowsInstallerAsync()
    {
        var isccPath = ResolveWindowsIsccPath();
        if (string.IsNullOrWhiteSpace(isccPath))
        {
            throw new InvalidOperationException(
                "ISCC.exe(Inno Setup)를 찾을 수 없습니다. Inno Setup을 설치하거나 --windows-iscc <path>를 지정하세요.");
        }

        var tempRoot = CreateTempRoot("windows");
        var stagingDir = Path.Combine(tempRoot, "app");
        Directory.CreateDirectory(stagingDir);
        CopyDirectory(_options.SourceDirectory, stagingDir);

        var outputDir = Path.Combine(_options.OutputDirectory, "windows");
        Directory.CreateDirectory(outputDir);

        var entryExe = ResolveWindowsEntryExecutable(stagingDir);
        var outputBase = $"{SanitizeFileName(_options.AppName)}-{SanitizeFileName(_options.Version)}-win-x64-setup";
        var setupScriptPath = Path.Combine(tempRoot, "setup.iss");
        var appId = CreateStableGuid($"{_options.Publisher}:{_options.AppName}");

        await File.WriteAllTextAsync(
            setupScriptPath,
            BuildInnoSetupScript(
                appId: appId,
                appName: _options.AppName,
                appVersion: _options.Version,
                publisher: _options.Publisher,
                sourceDirectory: stagingDir,
                outputDirectory: outputDir,
                outputBaseFilename: outputBase,
                entryExecutable: entryExe));

        await RunProcessAsync(isccPath, [setupScriptPath], _options.Verbose);

        var outputFile = Path.Combine(outputDir, $"{outputBase}.exe");
        if (!File.Exists(outputFile))
        {
            throw new InvalidOperationException($"Windows 설치 파일이 생성되지 않았습니다: {outputFile}");
        }

        return new PackageResult(
            TargetPlatform.Windows,
            true,
            $"설치 파일 생성 완료: {outputFile}",
            outputFile);
    }

    // Debian 패키지 구조를 구성한 뒤 dpkg-deb로 Ubuntu 설치 파일(.deb)을 만든다.
    private async Task<PackageResult> BuildUbuntuDebAsync()
    {
        var dpkgDeb = FindExecutableOnPath("dpkg-deb");
        if (string.IsNullOrWhiteSpace(dpkgDeb))
        {
            throw new InvalidOperationException(
                "PATH에서 dpkg-deb를 찾을 수 없습니다. Ubuntu 패키징은 dpkg가 설치된 Linux 환경에서 실행하세요.");
        }

        var tempRoot = CreateTempRoot("ubuntu");
        var packageRoot = Path.Combine(tempRoot, "package");
        var installRoot = Path.Combine(packageRoot, "opt", _options.AppName);
        Directory.CreateDirectory(installRoot);
        CopyDirectory(_options.SourceDirectory, installRoot);

        var debianDir = Path.Combine(packageRoot, "DEBIAN");
        Directory.CreateDirectory(debianDir);
        var controlFile = Path.Combine(debianDir, "control");
        var packageName = SanitizeDebianPackageName(_options.AppName);
        var debVersion = SanitizeDebianVersion(_options.Version);
        var maintainer = string.IsNullOrWhiteSpace(_options.Maintainer)
            ? _options.Publisher
            : _options.Maintainer;

        var control = new StringBuilder();
        control.AppendLine($"Package: {packageName}");
        control.AppendLine($"Version: {debVersion}");
        control.AppendLine("Section: utils");
        control.AppendLine("Priority: optional");
        control.AppendLine("Architecture: amd64");
        control.AppendLine($"Maintainer: {maintainer}");
        control.AppendLine($"Description: {_options.Description}");
        await File.WriteAllTextAsync(controlFile, control.ToString());

        var desktopEntry = TryBuildDesktopEntry(installRoot);
        if (!string.IsNullOrWhiteSpace(desktopEntry))
        {
            var desktopDir = Path.Combine(packageRoot, "usr", "share", "applications");
            Directory.CreateDirectory(desktopDir);
            var desktopFile = Path.Combine(desktopDir, $"{packageName}.desktop");
            await File.WriteAllTextAsync(desktopFile, desktopEntry);
        }

        var outputDir = Path.Combine(_options.OutputDirectory, "ubuntu");
        Directory.CreateDirectory(outputDir);
        var outputFile = Path.Combine(outputDir, $"{packageName}_{debVersion}_amd64.deb");

        await RunProcessAsync(dpkgDeb, ["--build", packageRoot, outputFile], _options.Verbose);

        if (!File.Exists(outputFile))
        {
            throw new InvalidOperationException($"Ubuntu 패키지가 생성되지 않았습니다: {outputFile}");
        }

        return new PackageResult(
            TargetPlatform.Ubuntu,
            true,
            $"설치 파일 생성 완료: {outputFile}",
            outputFile);
    }

    // pkgbuild를 사용해 macOS 설치 파일(.pkg)을 만든다.
    private async Task<PackageResult> BuildMacPkgAsync()
    {
        var pkgbuild = FindExecutableOnPath("pkgbuild");
        if (string.IsNullOrWhiteSpace(pkgbuild))
        {
            throw new InvalidOperationException(
                "PATH에서 pkgbuild를 찾을 수 없습니다. macOS 패키징은 Xcode Command Line Tools가 설치된 macOS에서 실행하세요.");
        }

        var tempRoot = CreateTempRoot("macos");
        var rootDir = Path.Combine(tempRoot, "root");
        var installRoot = Path.Combine(rootDir, "opt", _options.AppName);
        Directory.CreateDirectory(installRoot);
        CopyDirectory(_options.SourceDirectory, installRoot);

        var outputDir = Path.Combine(_options.OutputDirectory, "macos");
        Directory.CreateDirectory(outputDir);

        var packageName = $"{SanitizeFileName(_options.AppName)}-{SanitizeFileName(_options.Version)}-macos.pkg";
        var outputFile = Path.Combine(outputDir, packageName);
        var identifier = BuildPkgIdentifier(_options.Publisher, _options.AppName);

        await RunProcessAsync(
            pkgbuild,
            [
                "--root", rootDir,
                "--identifier", identifier,
                "--version", _options.Version,
                "--install-location", "/",
                outputFile
            ],
            _options.Verbose);

        if (!File.Exists(outputFile))
        {
            throw new InvalidOperationException($"macOS 패키지가 생성되지 않았습니다: {outputFile}");
        }

        return new PackageResult(
            TargetPlatform.MacOs,
            true,
            $"설치 파일 생성 완료: {outputFile}",
            outputFile);
    }

    private string? ResolveWindowsEntryExecutable(string stagingDir)
    {
        if (!string.IsNullOrWhiteSpace(_options.EntryExecutable))
        {
            var candidate = Path.Combine(stagingDir, _options.EntryExecutable);
            if (File.Exists(candidate))
            {
                return _options.EntryExecutable;
            }

            throw new InvalidOperationException(
                $"지정한 시작 실행 파일을 소스에서 찾을 수 없습니다: {_options.EntryExecutable}");
        }

        var preferred = $"{_options.AppName}.exe";
        var preferredFull = Path.Combine(stagingDir, preferred);
        if (File.Exists(preferredFull))
        {
            return preferred;
        }

        var fallback = Directory.EnumerateFiles(stagingDir, "*.exe", SearchOption.TopDirectoryOnly)
            .Select(Path.GetFileName)
            .FirstOrDefault();

        return fallback;
    }

    private string? ResolveWindowsIsccPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.WindowsIsccPath))
        {
            return File.Exists(_options.WindowsIsccPath) ? _options.WindowsIsccPath : null;
        }

        if (OperatingSystem.IsWindows())
        {
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var candidates = new[]
            {
                Path.Combine(localAppData, "Programs", "Inno Setup 6", "ISCC.exe"),
                @"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
                @"C:\Program Files\Inno Setup 6\ISCC.exe",
            };

            foreach (var candidate in candidates)
            {
                if (File.Exists(candidate))
                {
                    return candidate;
                }
            }

            return FindExecutableOnPath("ISCC.exe");
        }

        return FindExecutableOnPath("iscc");
    }

    private string? TryBuildDesktopEntry(string installRoot)
    {
        var explicitCommand = _options.EntryCommand;
        if (!string.IsNullOrWhiteSpace(explicitCommand))
        {
            return BuildDesktopEntry(explicitCommand);
        }

        var linuxBinary = Path.Combine(installRoot, _options.AppName);
        if (File.Exists(linuxBinary))
        {
            return BuildDesktopEntry($"/opt/{_options.AppName}/{_options.AppName}");
        }

        var dotnetDll = Directory.EnumerateFiles(installRoot, "*.dll", SearchOption.TopDirectoryOnly)
            .FirstOrDefault(file => string.Equals(Path.GetFileNameWithoutExtension(file), _options.AppName, StringComparison.OrdinalIgnoreCase))
            ?? Directory.EnumerateFiles(installRoot, "*.dll", SearchOption.TopDirectoryOnly).FirstOrDefault();

        if (dotnetDll is null)
        {
            return null;
        }

        var dllName = Path.GetFileName(dotnetDll);
        return BuildDesktopEntry($"dotnet /opt/{_options.AppName}/{dllName}");
    }

    private string BuildDesktopEntry(string execCommand)
    {
        var sb = new StringBuilder();
        sb.AppendLine("[Desktop Entry]");
        sb.AppendLine("Type=Application");
        sb.AppendLine($"Name={_options.AppName}");
        sb.AppendLine($"Comment={_options.Description}");
        sb.AppendLine($"Exec={execCommand}");
        sb.AppendLine("Terminal=false");
        sb.AppendLine("Categories=Utility;");
        return sb.ToString();
    }

    private static async Task RunProcessAsync(string fileName, IReadOnlyList<string> arguments, bool verbose)
    {
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        foreach (var arg in arguments)
        {
            process.StartInfo.ArgumentList.Add(arg);
        }

        process.Start();
        var stdOutTask = process.StandardOutput.ReadToEndAsync();
        var stdErrTask = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        var stdOut = await stdOutTask;
        var stdErr = await stdErrTask;

        if (verbose)
        {
            if (!string.IsNullOrWhiteSpace(stdOut))
            {
                Console.WriteLine(stdOut.TrimEnd());
            }

            if (!string.IsNullOrWhiteSpace(stdErr))
            {
                Console.WriteLine(stdErr.TrimEnd());
            }
        }

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"{Path.GetFileName(fileName)} 프로세스가 종료 코드 {process.ExitCode}로 실패했습니다.{Environment.NewLine}{stdErr}{stdOut}");
        }
    }

    private static string CreateTempRoot(string targetName)
    {
        var path = Path.Combine(Path.GetTempPath(), "installer-packager", $"{targetName}-{Guid.NewGuid():N}");
        Directory.CreateDirectory(path);
        return path;
    }

    private static string BuildInnoSetupScript(
        string appId,
        string appName,
        string appVersion,
        string publisher,
        string sourceDirectory,
        string outputDirectory,
        string outputBaseFilename,
        string? entryExecutable)
    {
        static string Escape(string text) => text.Replace("\"", "\"\"");

        var script = new StringBuilder();
        script.AppendLine("[Setup]");
        script.AppendLine("AppId={{" + appId + "}");
        script.AppendLine($"AppName={Escape(appName)}");
        script.AppendLine($"AppVersion={Escape(appVersion)}");
        script.AppendLine($"AppPublisher={Escape(publisher)}");
        script.AppendLine($"DefaultDirName={{autopf}}\\{Escape(appName)}");
        script.AppendLine($"DefaultGroupName={Escape(appName)}");
        script.AppendLine($"OutputDir={Escape(outputDirectory)}");
        script.AppendLine($"OutputBaseFilename={Escape(outputBaseFilename)}");
        script.AppendLine("Compression=lzma");
        script.AppendLine("SolidCompression=yes");
        script.AppendLine("ArchitecturesAllowed=x64compatible");
        script.AppendLine("ArchitecturesInstallIn64BitMode=x64compatible");
        script.AppendLine();
        script.AppendLine("[Tasks]");
        script.AppendLine("Name: \"desktopicon\"; Description: \"바탕 화면 아이콘 만들기\"; GroupDescription: \"추가 아이콘:\"");
        script.AppendLine();
        script.AppendLine("[Files]");
        script.AppendLine($"Source: \"{Escape(Path.Combine(sourceDirectory, "*"))}\"; DestDir: \"{{app}}\"; Flags: recursesubdirs createallsubdirs ignoreversion");
        script.AppendLine();

        if (!string.IsNullOrWhiteSpace(entryExecutable))
        {
            script.AppendLine("[Icons]");
            script.AppendLine($"Name: \"{{group}}\\{Escape(appName)}\"; Filename: \"{{app}}\\{Escape(entryExecutable)}\"");
            script.AppendLine($"Name: \"{{autodesktop}}\\{Escape(appName)}\"; Filename: \"{{app}}\\{Escape(entryExecutable)}\"; Tasks: desktopicon");
            script.AppendLine();
        }

        return script.ToString();
    }

    private static string CreateStableGuid(string input)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return new Guid(hash).ToString().ToUpperInvariant();
    }

    private static string BuildPkgIdentifier(string publisher, string appName)
    {
        static string Normalize(string value)
        {
            var lowered = value.ToLowerInvariant();
            var normalized = Regex.Replace(lowered, "[^a-z0-9]+", ".");
            normalized = normalized.Trim('.');
            return string.IsNullOrWhiteSpace(normalized) ? "app" : normalized;
        }

        return $"com.{Normalize(publisher)}.{Normalize(appName)}";
    }

    private static string SanitizeFileName(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var chars = value.Select(ch => invalid.Contains(ch) ? '-' : ch).ToArray();
        return new string(chars);
    }

    private static string SanitizeDebianPackageName(string value)
    {
        var lowered = value.ToLowerInvariant();
        var normalized = Regex.Replace(lowered, "[^a-z0-9+.-]+", "-");
        normalized = normalized.Trim('-');
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return "app-package";
        }

        if (!char.IsLetterOrDigit(normalized[0]))
        {
            normalized = $"a{normalized}";
        }

        return normalized;
    }

    private static string SanitizeDebianVersion(string value)
    {
        var normalized = Regex.Replace(value, "[^A-Za-z0-9.+:~\\-]+", ".");
        normalized = normalized.Trim('.');
        return string.IsNullOrWhiteSpace(normalized) ? "1.0.0" : normalized;
    }

    private static string? FindExecutableOnPath(string executableName)
    {
        if (Path.IsPathRooted(executableName))
        {
            return File.Exists(executableName) ? executableName : null;
        }

        var pathEnv = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(pathEnv))
        {
            return null;
        }

        var paths = pathEnv.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var dir in paths)
        {
            var candidate = Path.Combine(dir, executableName);
            if (File.Exists(candidate))
            {
                return candidate;
            }

            if (OperatingSystem.IsWindows() && !executableName.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            {
                var winCandidate = Path.Combine(dir, $"{executableName}.exe");
                if (File.Exists(winCandidate))
                {
                    return winCandidate;
                }
            }
        }

        return null;
    }

    private static void CopyDirectory(string sourceDir, string destinationDir)
    {
        foreach (var directory in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relative = Path.GetRelativePath(sourceDir, directory);
            Directory.CreateDirectory(Path.Combine(destinationDir, relative));
        }

        foreach (var file in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relative = Path.GetRelativePath(sourceDir, file);
            var target = Path.Combine(destinationDir, relative);
            var targetDir = Path.GetDirectoryName(target);
            if (!string.IsNullOrWhiteSpace(targetDir))
            {
                Directory.CreateDirectory(targetDir);
            }

            File.Copy(file, target, overwrite: true);
        }
    }
}

internal sealed record PackOptions(
    string SourceDirectory,
    string OutputDirectory,
    string AppName,
    string Version,
    string Publisher,
    string Maintainer,
    string Description,
    string? EntryExecutable,
    string? EntryCommand,
    string? WindowsIsccPath,
    IReadOnlyList<TargetPlatform> Targets,
    bool Verbose,
    bool ShowHelp)
{
    public static PackOptions Parse(string[] args)
    {
        string? source = null;
        var output = Path.Combine(Directory.GetCurrentDirectory(), "artifacts");
        var appName = "my-app";
        var version = DateTime.UtcNow.ToString("yyyy.MM.dd.HHmm");
        var publisher = "HandStack";
        var maintainer = "HandStack";
        var description = "my-app 배포 패키지";
        string? entryExecutable = null;
        string? entryCommand = null;
        string? windowsIscc = null;
        var targets = new List<TargetPlatform> { TargetPlatform.Windows, TargetPlatform.Ubuntu, TargetPlatform.MacOs };
        var verbose = false;
        var showHelp = false;

        for (var i = 0; i < args.Length; i++)
        {
            var rawArg = args[i];
            var (arg, inlineValue) = SplitOptionToken(rawArg);
            switch (arg)
            {
                case "--help":
                case "-h":
                    showHelp = true;
                    break;
                case "--source":
                    source = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--output":
                    output = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--app-name":
                    appName = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--version":
                    version = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--publisher":
                    publisher = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--maintainer":
                    maintainer = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--description":
                    description = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--entry-exe":
                    entryExecutable = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--entry-command":
                    entryCommand = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--windows-iscc":
                    windowsIscc = RequireValue(args, ref i, arg, inlineValue);
                    break;
                case "--targets":
                    targets = ParseTargets(RequireValue(args, ref i, arg, inlineValue));
                    break;
                case "--verbose":
                    verbose = true;
                    break;
                default:
                    throw new ArgumentException($"알 수 없는 인수입니다: {rawArg}");
            }
        }

        if (!showHelp && string.IsNullOrWhiteSpace(source))
        {
            throw new ArgumentException("--source 인수는 필수입니다. 게시(publish) 폴더 경로를 지정하세요.");
        }

        var normalizedSource = string.Empty;
        if (!string.IsNullOrWhiteSpace(source))
        {
            normalizedSource = Path.GetFullPath(source);
        }

        output = Path.GetFullPath(output);

        return new PackOptions(
            SourceDirectory: normalizedSource,
            OutputDirectory: output,
            AppName: appName,
            Version: version,
            Publisher: publisher,
            Maintainer: maintainer,
            Description: description,
            EntryExecutable: entryExecutable,
            EntryCommand: entryCommand,
            WindowsIsccPath: windowsIscc,
            Targets: targets,
            Verbose: verbose,
            ShowHelp: showHelp);
    }

    public static void PrintHelp()
    {
        Console.WriteLine(
"""
dotnet-installer - 게시된 파일을 Windows, Ubuntu, macOS 설치 파일로 패키징합니다.

사용법:
  .\dotnet-installer\bin\Debug\net10.0\dotnet-installer.exe [옵션]

옵션:
  --source <path>          게시(publish) 폴더 경로 (필수)
                           형식: --source <path> 또는 --source=<path>
  --output <path>          생성된 설치 파일 출력 폴더
                           기본값: .\artifacts
  --app-name <name>        애플리케이션 이름 (기본값: my-app)
  --version <version>      설치 파일/패키지 버전 (기본값: UTC 타임스탬프)
  --publisher <name>       게시자/벤더 이름 (기본값: HandStack)
  --maintainer <name>      Debian control용 Maintainer (기본값: HandStack)
  --description <text>     패키지 설명
  --entry-exe <file>       Windows 바로가기용 시작 .exe 파일명
  --entry-command <cmd>    Linux .desktop Exec 명령
  --windows-iscc <path>    ISCC.exe(Inno Setup 컴파일러) 전체 경로
  --targets <list>         콤마 구분 대상: windows,ubuntu,macos,all
                           기본값: all
  --verbose                하위 프로세스 stdout/stderr 출력
  -h, --help               도움말 표시
""");
    }

    private static string RequireValue(string[] args, ref int index, string argumentName, string? inlineValue = null)
    {
        if (inlineValue is not null)
        {
            if (string.IsNullOrWhiteSpace(inlineValue))
            {
                throw new ArgumentException($"{argumentName} 인수 값이 누락되었습니다.");
            }

            return inlineValue;
        }

        if (index + 1 >= args.Length)
        {
            throw new ArgumentException($"{argumentName} 인수 값이 누락되었습니다.");
        }

        index++;
        return args[index];
    }

    private static (string Name, string? InlineValue) SplitOptionToken(string token)
    {
        if (!token.StartsWith("--", StringComparison.Ordinal))
        {
            return (token, null);
        }

        var equalIndex = token.IndexOf('=');
        if (equalIndex < 0)
        {
            return (token, null);
        }

        var name = token[..equalIndex];
        var inlineValue = token[(equalIndex + 1)..];
        return (name, inlineValue);
    }

    private static List<TargetPlatform> ParseTargets(string value)
    {
        if (string.Equals(value, "all", StringComparison.OrdinalIgnoreCase))
        {
            return new List<TargetPlatform> { TargetPlatform.Windows, TargetPlatform.Ubuntu, TargetPlatform.MacOs };
        }

        var result = new List<TargetPlatform>();
        var parts = value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var part in parts)
        {
            if (part.Equals("windows", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(TargetPlatform.Windows);
                continue;
            }

            if (part.Equals("ubuntu", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(TargetPlatform.Ubuntu);
                continue;
            }

            if (part.Equals("macos", StringComparison.OrdinalIgnoreCase) || part.Equals("mac", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(TargetPlatform.MacOs);
                continue;
            }

            throw new ArgumentException($"알 수 없는 대상 값입니다: {part}");
        }

        if (result.Count == 0)
        {
            throw new ArgumentException("최소 하나 이상의 대상 플랫폼을 지정해야 합니다.");
        }

        return result.Distinct().ToList();
    }
}

internal enum TargetPlatform
{
    Windows,
    Ubuntu,
    MacOs
}

internal sealed record PackageResult(TargetPlatform Target, bool Success, string Message, string? OutputFile);
