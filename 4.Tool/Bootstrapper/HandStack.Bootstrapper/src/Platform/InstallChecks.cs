namespace HandStack.Bootstrapper.Platform;

/// <summary>세 OS에서 공통으로 쓰는 "이미 설치되어 있는지" 확인 로직.</summary>
internal static class InstallChecks
{
    /// <summary>
    /// 지정한 채널(예: "10.0")의 .NET SDK **정식(GA) 버전**이 이미 설치되어 있는지 확인한다.
    /// 이 프로젝트는 ".NET SDK는 반드시 버전 10이어야 한다"는 요구사항을 따르므로, 버전
    /// 문자열에 "-rc.", "-preview." 등 프리릴리스 식별자가 붙은 빌드(예: "10.0.100-rc.2.25502.107")는
    /// 아직 버전 10이 정식으로 설치된 것으로 인정하지 않고 설치를 계속 진행한다.
    /// </summary>
    public static async Task<bool> IsDotNetSdkChannelInstalledAsync(string channel)
    {
        var (exitCode, stdOut) = await ProcessRunner.CaptureAsync("dotnet", "--list-sdks");
        if (exitCode != 0)
        {
            return false;
        }

        var prefix = channel + ".";
        return stdOut
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Select(line => line.Split(' ')[0]) // "10.0.400 [C:\...]" 에서 버전 부분만 추출
            .Any(version => version.StartsWith(prefix, StringComparison.Ordinal)
                && !version.Contains('-', StringComparison.Ordinal));
    }

    /// <summary>해당 명령어가 PATH 상에서 실행 가능한지(=이미 설치되어 있는지) 확인한다.</summary>
    public static async Task<bool> IsCommandAvailableAsync(string fileName, string versionArg = "--version")
    {
        var (exitCode, _) = await ProcessRunner.CaptureAsync(fileName, versionArg);
        return exitCode == 0;
    }
}
