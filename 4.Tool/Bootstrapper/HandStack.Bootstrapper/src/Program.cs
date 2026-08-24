using HandStack.Bootstrapper.Platform;

using System.Runtime.InteropServices;

using Velopack;

// 가장 먼저 실행되어야 함: Velopack의 설치/업데이트/제거 라이프사이클 훅
// (예: 바로가기 생성/삭제)을 우리 로직이 실행되기 전에 처리한다.
VelopackApp.Build().Run();

// 이 프로젝트의 요구사항: .NET SDK는 반드시 "버전 10"이어야 한다. 절대 다른 메이저
// 버전(8, 9, 11...)으로 바꾸지 말 것 — dotnet-install 스크립트의 --channel 값이자,
// InstallChecks.IsDotNetSdkChannelInstalledAsync가 "이미 설치됨"을 판단하는 기준이 된다.
const string DotNetChannel = "10.0";

Console.WriteLine("=== 개발 환경 부트스트래퍼 ===");
Console.WriteLine($"운영체제: {RuntimeInformation.OSDescription}");
Console.WriteLine();

IPlatformInstaller installer = GetInstaller();

try
{
    Console.WriteLine("[1/8] 사전 조건 확인 중...");
    await installer.EnsurePrerequisitesAsync();

    Console.WriteLine("[2/8] .NET SDK 10 확인 후 설치...");
    await installer.InstallDotNetSdkAsync(DotNetChannel);

    Console.WriteLine("[3/8] Node.js LTS 확인 후 설치...");
    await installer.InstallNodeLtsAsync();

    Console.WriteLine("[4/8] PowerShell 확인 후 설치...");
    await installer.InstallPowerShellAsync();

    Console.WriteLine("[5/8] git 확인 후 설치...");
    await installer.InstallGitAsync();

    Console.WriteLine("[6/8] curl 확인 후 설치...");
    await installer.InstallCurlAsync();

    Console.WriteLine("[7/8] gulp-cli 확인 후 필요 시 설치 (npm install -g gulp-cli)...");
    await AdditionalTools.InstallGulpCliAsync();

    Console.WriteLine("[8/8] Microsoft.Web.LibraryManager.Cli 확인 후 필요 시 설치 (dotnet tool install)...");
    await AdditionalTools.InstallLibManCliAsync();

    Console.WriteLine();
    Console.WriteLine("모든 구성 요소가 성공적으로 설치되었습니다.");
    Console.WriteLine("PATH 변경 사항을 반영하려면 새 터미널 창을 여세요.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine();
    Console.Error.WriteLine($"부트스트랩 실패: {ex.Message}");
    return 1;
}

static IPlatformInstaller GetInstaller()
{
    if (OperatingSystem.IsWindows())
    {
        return new WindowsInstaller();
    }

    if (OperatingSystem.IsMacOS())
    {
        return new MacInstaller();
    }

    if (OperatingSystem.IsLinux())
    {
        return new LinuxInstaller();
    }

    throw new PlatformNotSupportedException("이 부트스트래퍼는 Windows, macOS, Ubuntu(Linux)만 지원합니다.");
}
