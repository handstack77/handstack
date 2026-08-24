using System.Diagnostics;
using System.Runtime.Versioning;

namespace HandStack.Bootstrapper.Platform;

/// <summary>Ubuntu 전략: Node.js는 apt + NodeSource, 나머지는 Microsoft 공식 스크립트를 사용한다.</summary>
[SupportedOSPlatform("linux")]
internal sealed class LinuxInstaller : IPlatformInstaller
{
    private static readonly Dictionary<string, string> NonInteractiveApt = new()
    {
        ["DEBIAN_FRONTEND"] = "noninteractive",
    };

    public async Task EnsurePrerequisitesAsync()
    {
        if (!IsRoot())
        {
            await TryRelaunchWithSudoAsync();

            // 재실행에 성공했다면 위에서 sudo 자식 프로세스의 종료 코드로 이미 종료했으므로
            // 이 지점에 도달하지 않는다. 여기 도달했다는 것은 재실행을 시도할 수 없었다는 뜻이다.
            throw new InvalidOperationException(
                "관리자 권한이 필요합니다. sudo 비밀번호 입력을 진행해 주세요. 자동 재실행이 되지 " +
                "않는다면(예: `dotnet run`으로 실행 중이거나 sudo가 없는 경우) " +
                "'sudo ./HandStack.Bootstrapper'로 직접 다시 실행해 주세요.");
        }

        await AptGet("update -y");
        await AptGet("install -y curl ca-certificates apt-transport-https gnupg");
    }

    public Task InstallDotNetSdkAsync(string channel) => DotNetInstallHelper.InstallViaScriptAsync(channel);

    public async Task InstallNodeLtsAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("node"))
        {
            Console.WriteLine("  Node.js가 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        // NodeSource의 자체 스크립트는 apt 기반 배포판에서 "현재 LTS" 버전을 고정하는 표준적이고 신뢰할 수 있는 방법이다.
        await ProcessRunner.RunAsync("bash", "-c \"curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -\"");
        await AptGet("install -y nodejs");
    }

    public async Task InstallPowerShellAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("pwsh"))
        {
            Console.WriteLine("  PowerShell(pwsh)이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await ProcessRunner.RunAsync("bash", "-c \"curl -fsSL https://aka.ms/install-powershell.sh | bash -s -- -includedts\"");
    }

    public async Task InstallGitAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("git"))
        {
            Console.WriteLine("  git이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await AptGet("install -y git");
    }

    public async Task InstallCurlAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("curl"))
        {
            Console.WriteLine("  curl이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await AptGet("install -y curl");
    }

    private static Task AptGet(string args) =>
        ProcessRunner.RunAsync("bash", $"-c \"apt-get {args}\"", env: NonInteractiveApt);

    private static bool IsRoot()
    {
        try
        {
            var psi = new ProcessStartInfo("id", "-u")
            {
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = Process.Start(psi)!;
            var output = process.StandardOutput.ReadToEnd().Trim();
            process.WaitForExit();
            return output == "0";
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 현재 실행 파일을 <c>sudo</c>로 다시 실행한다. 표준 입출력을 리디렉션하지 않고 그대로
    /// 물려주므로, sudo의 비밀번호 프롬프트가 지금과 같은 터미널에 그대로 표시된다. 게시된
    /// self-contained 단일 실행 파일에서만 동작한다 — `dotnet run`처럼 dotnet 호스트로 실행
    /// 중이면 재실행 대상을 특정할 수 없으므로 시도하지 않는다.
    /// </summary>
    private static async Task TryRelaunchWithSudoAsync()
    {
        var exePath = Environment.ProcessPath;
        if (string.IsNullOrEmpty(exePath) ||
            string.Equals(Path.GetFileNameWithoutExtension(exePath), "dotnet", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        Console.WriteLine("관리자 권한이 필요합니다. sudo 비밀번호를 입력해 주세요...");

        var psi = new ProcessStartInfo
        {
            FileName = "sudo",
            UseShellExecute = false,
            WorkingDirectory = Environment.CurrentDirectory,
        };
        psi.ArgumentList.Add(exePath);
        foreach (var arg in Environment.GetCommandLineArgs().Skip(1))
        {
            psi.ArgumentList.Add(arg);
        }

        Process? process;
        try
        {
            process = Process.Start(psi);
        }
        catch
        {
            // sudo가 설치되어 있지 않는 등 재실행 자체가 불가능함 — 호출부의 안내 메시지로 넘어간다.
            return;
        }

        if (process is null)
        {
            return;
        }

        await process.WaitForExitAsync();
        Environment.Exit(process.ExitCode);
    }
}
