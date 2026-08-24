using System.Runtime.Versioning;

namespace HandStack.Bootstrapper.Platform;

/// <summary>macOS 전략: Node.js는 Homebrew, SDK/PowerShell은 공식 install.sh 스크립트를 사용한다.</summary>
[SupportedOSPlatform("macos")]
internal sealed class MacInstaller : IPlatformInstaller
{
    public async Task EnsurePrerequisitesAsync()
    {
        if (await IsBrewAvailableAsync())
        {
            return;
        }

        Console.WriteLine("Homebrew를 찾을 수 없어 비대화형 모드로 설치합니다...");
        await ProcessRunner.RunAsync(
            "bash",
            "-c \"NONINTERACTIVE=1 /bin/bash -c \\\"$(curl -fsSL " +
            "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\\\"\"");
    }

    public Task InstallDotNetSdkAsync(string channel) => DotNetInstallHelper.InstallViaScriptAsync(channel);

    public async Task InstallNodeLtsAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("node"))
        {
            Console.WriteLine("  Node.js가 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await Brew("install node");
    }

    public async Task InstallPowerShellAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("pwsh"))
        {
            Console.WriteLine("  PowerShell(pwsh)이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        // Microsoft 공식 스크립트가 macOS를 자동 감지해 내부적으로 Homebrew를 통해 PowerShell을 설치한다.
        await ProcessRunner.RunAsync("bash", "-c \"curl -fsSL https://aka.ms/install-powershell.sh | bash -s -- -includedts\"");
    }

    public async Task InstallGitAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("git"))
        {
            Console.WriteLine("  git이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await Brew("install git");
    }

    public async Task InstallCurlAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("curl"))
        {
            Console.WriteLine("  curl이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await Brew("install curl");
    }

    private static Task Brew(string args) =>
        ProcessRunner.RunAsync(
            "brew",
            args,
            env: new Dictionary<string, string>
            {
                ["HOMEBREW_NO_AUTO_UPDATE"] = "1",
                ["HOMEBREW_NO_INSTALL_CLEANUP"] = "1",
                ["NONINTERACTIVE"] = "1",
            });

    private static async Task<bool> IsBrewAvailableAsync()
    {
        try
        {
            return await ProcessRunner.RunAsync("brew", "--version", requireSuccess: false) == 0;
        }
        catch
        {
            return false;
        }
    }
}
