namespace HandStack.Bootstrapper.Platform;

/// <summary>
/// git/curl과 달리 OS별 패키지 매니저가 필요 없는, 세 OS에서 설치 명령이 동일한 추가 도구들.
/// (Node.js/.NET SDK가 이미 설치되어 있다는 전제로 npm/dotnet tool을 사용한다.)
/// </summary>
internal static class AdditionalTools
{
    public static async Task InstallGulpCliAsync()
    {
        if (await IsAvailableViaNpmShimAsync("gulp"))
        {
            Console.WriteLine("  gulp-cli가 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await RunNpmAsync("install -g gulp-cli");
    }

    public static async Task InstallLibManCliAsync()
    {
        if (await InstallChecks.IsCommandAvailableAsync("libman"))
        {
            Console.WriteLine("  libman(Microsoft.Web.LibraryManager.Cli)이 이미 설치되어 있어 건너뜁니다.");
            return;
        }

        await ProcessRunner.RunAsync("dotnet", "tool install --global Microsoft.Web.LibraryManager.Cli");
    }

    // npm이 만드는 명령(npm 자신, gulp-cli 등)은 Windows에서 .cmd 셸 스크립트로 설치되어
    // 프로세스를 직접 실행할 수 없다(Win32 CreateProcess가 PATHEXT를 해석하지 않음).
    // 따라서 Windows에서는 cmd.exe를 거쳐 실행/확인한다.
    private static Task<bool> IsAvailableViaNpmShimAsync(string command)
    {
        if (OperatingSystem.IsWindows())
        {
            return CaptureExitCodeAsync("cmd", $"/c {command} --version");
        }

        return InstallChecks.IsCommandAvailableAsync(command);
    }

    private static Task RunNpmAsync(string args)
    {
        if (OperatingSystem.IsWindows())
        {
            return ProcessRunner.RunAsync("cmd", $"/c npm {args}");
        }

        return ProcessRunner.RunAsync("npm", args);
    }

    private static async Task<bool> CaptureExitCodeAsync(string fileName, string arguments)
    {
        var (exitCode, _) = await ProcessRunner.CaptureAsync(fileName, arguments);
        return exitCode == 0;
    }
}
