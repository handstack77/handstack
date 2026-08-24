using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.Versioning;
using System.Security.Principal;

namespace HandStack.Bootstrapper.Platform;

/// <summary>Windows 전략: Node.js/PowerShell은 winget, SDK는 공식 스크립트를 사용한다.</summary>
[SupportedOSPlatform("windows")]
internal sealed class WindowsInstaller : IPlatformInstaller
{
    private const int ErrorCancelled = 1223; // 사용자가 UAC 승인 창에서 "아니오"를 선택함

    public Task EnsurePrerequisitesAsync()
    {
        if (!IsElevated())
        {
            if (TryRelaunchElevated())
            {
                // 관리자 권한으로 상승된 새 프로세스가 이어서 실행되므로, 이 프로세스는
                // 오류 없이 조용히 종료한다.
                Environment.Exit(0);
            }

            throw new InvalidOperationException(
                "관리자 권한이 필요합니다. UAC 승인 창에서 '예'를 선택해 주세요. 자동 재실행이 되지 " +
                "않는다면(예: `dotnet run`으로 실행 중) 관리자 권한으로 상승된(Administrator) 셸에서 " +
                "직접 다시 실행해 주세요.");
        }

        if (!IsWingetAvailable())
        {
            throw new InvalidOperationException(
                "winget을 찾을 수 없습니다. Microsoft Store에서 'App Installer'를 설치하거나 " +
                "Windows를 업데이트한 뒤 다시 실행해 주세요.");
        }

        return Task.CompletedTask;
    }

    public Task InstallDotNetSdkAsync(string channel) => DotNetInstallHelper.InstallViaScriptAsync(channel);

    public async Task InstallNodeLtsAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("node"))
        {
            Console.WriteLine("  Node.js가 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await WingetInstall("OpenJS.NodeJS.LTS");
    }

    public async Task InstallPowerShellAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("pwsh"))
        {
            Console.WriteLine("  PowerShell(pwsh)이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await WingetInstall("Microsoft.PowerShell");
    }

    public async Task InstallGitAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("git"))
        {
            Console.WriteLine("  git이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await WingetInstall("Git.Git");
    }

    public async Task InstallCurlAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("curl"))
        {
            Console.WriteLine("  curl이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await WingetInstall("cURL.cURL");
    }

    private static async Task WingetInstall(string packageId)
    {
        await ProcessRunner.RunAsync(
            "winget",
            $"install --id {packageId} --exact --silent " +
            "--accept-package-agreements --accept-source-agreements --disable-interactivity");

        // 방금 설치한 도구를 같은 프로세스 안에서 바로 호출할 수 있도록 PATH를 갱신한다.
        WindowsPath.RefreshFromRegistry();
    }

    private static bool IsElevated()
    {
        using var identity = WindowsIdentity.GetCurrent();
        var principal = new WindowsPrincipal(identity);
        return principal.IsInRole(WindowsBuiltInRole.Administrator);
    }

    /// <summary>
    /// 현재 실행 파일을 UAC(runas)로 다시 실행한다. 게시된 self-contained 단일 실행 파일에서만
    /// 동작한다 — `dotnet run`처럼 dotnet 호스트로 실행 중이면 재실행 대상을 특정할 수 없으므로
    /// 시도하지 않는다.
    /// </summary>
    private static bool TryRelaunchElevated()
    {
        var exePath = Environment.ProcessPath;
        if (string.IsNullOrEmpty(exePath) ||
            string.Equals(Path.GetFileNameWithoutExtension(exePath), "dotnet", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        Console.WriteLine("관리자 권한이 필요합니다. UAC 승인 창을 확인해 주세요...");

        var psi = new ProcessStartInfo
        {
            FileName = exePath,
            Arguments = string.Join(' ', Environment.GetCommandLineArgs().Skip(1).Select(QuoteArgument)),
            WorkingDirectory = Environment.CurrentDirectory,
            UseShellExecute = true,
            Verb = "runas",
        };

        try
        {
            using var process = Process.Start(psi);
            return process is not null;
        }
        catch (Win32Exception ex) when (ex.NativeErrorCode == ErrorCancelled)
        {
            // 사용자가 UAC 승인 창에서 취소함 — 일반적인 실패 메시지로 넘어간다.
            return false;
        }
    }

    private static string QuoteArgument(string arg)
    {
        if (arg.Length > 0 && arg.IndexOfAny([' ', '"']) < 0)
        {
            return arg;
        }

        return "\"" + arg.Replace("\"", "\\\"") + "\"";
    }

    private static bool IsWingetAvailable()
    {
        try
        {
            var psi = new ProcessStartInfo("winget", "--version")
            {
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = Process.Start(psi);
            process!.WaitForExit(5000);
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}
