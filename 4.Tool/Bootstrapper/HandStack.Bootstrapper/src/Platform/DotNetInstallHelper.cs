namespace HandStack.Bootstrapper.Platform;

/// <summary>
/// Microsoft 공식 dotnet-install 스크립트로 .NET SDK를 설치한다. 모든 OS에서 동일하게
/// 동작하며, 패키지 매니저가 현재 어떤 버전을 제공하는지와 무관하게 특정 채널
/// (예: "10.0")을 정확히 고정해서 설치할 수 있다.
/// </summary>
internal static class DotNetInstallHelper
{
    public static async Task InstallViaScriptAsync(string channel)
    {
        if (await InstallChecks.IsDotNetSdkChannelInstalledAsync(channel))
        {
            Console.WriteLine($"  .NET SDK {channel} 채널이 이미 설치되어 있어 건너뜁니다.");
        }
        else if (OperatingSystem.IsWindows())
        {
            var scriptPath = Path.Combine(Path.GetTempPath(), "dotnet-install.ps1");

            await ProcessRunner.RunAsync(
                "powershell",
                $"-NoProfile -ExecutionPolicy Bypass -Command " +
                $"\"$ProgressPreference='SilentlyContinue'; Invoke-WebRequest https://dot.net/v1/dotnet-install.ps1 -OutFile '{scriptPath}'\"");

            var installDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "dotnet");

            await ProcessRunner.RunAsync(
                "powershell",
                $"-NoProfile -ExecutionPolicy Bypass -File \"{scriptPath}\" " +
                $"-Channel {channel} -InstallDir \"{installDir}\" -NoPath:$false");

            // 스크립트는 시스템 PATH를 영구히 갱신하지 않을 수 있으므로, 같은 프로세스 안에서
            // 바로 이어지는 단계(예: dotnet tool install)가 dotnet을 찾을 수 있도록 보정한다.
            WindowsPath.PrependToProcessPath(installDir);
        }
        else
        {
            const string scriptPath = "/tmp/dotnet-install.sh";

            await ProcessRunner.RunAsync(
                "bash",
                $"-c \"curl -fsSL https://dot.net/v1/dotnet-install.sh -o {scriptPath} && chmod +x {scriptPath}\"");

            var installDir = OperatingSystem.IsMacOS() ? "/usr/local/share/dotnet" : "/usr/share/dotnet";
            var installCmd = $"{scriptPath} --channel {channel} --install-dir {installDir}";
            var linkCmd = $"ln -sf {installDir}/dotnet /usr/local/bin/dotnet";

            if (OperatingSystem.IsMacOS())
            {
                // macOS: 프로세스 전체를 root로 실행하지 않는다(Homebrew가 root 실행을 금지함).
                // 따라서 시스템 전역 설치가 필요한 이 단계에서만 sudo로 권한을 상승시킨다.
                await ProcessRunner.RunAsync("sudo", $"bash -c \"{installCmd} && {linkCmd}\"");
            }
            else
            {
                // Linux: 부트스트래퍼 프로세스 전체가 이미 root 권한으로 실행되도록 요구한다.
                await ProcessRunner.RunAsync("bash", $"-c \"{installCmd} && {linkCmd}\"");
            }
        }

        if (OperatingSystem.IsWindows())
        {
            // dotnet global tool(예: libman)은 %USERPROFILE%\.dotnet\tools 에 설치되는데,
            // 이 경로는 winget/MSI 설치가 아니면 시스템 PATH에 자동으로 추가되지 않는다.
            // .NET SDK 설치를 건너뛴 경우에도(이미 설치돼 있어도) 이 단계는 항상 보정해 둔다.
            var toolsDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".dotnet", "tools");
            WindowsPath.PrependToProcessPath(toolsDir);
        }
    }
}
