using System.Runtime.Versioning;

namespace HandStack.Bootstrapper.Platform;

/// <summary>
/// winget/설치 스크립트가 PATH를 갱신해도, 이미 실행 중인 이 프로세스의 환경 변수는
/// 자동으로 반영되지 않는다. 같은 실행 안에서 방금 설치한 도구(git, npm 등)를 바로
/// 이어서 호출할 수 있도록 현재 프로세스의 PATH를 직접 갱신해 준다.
/// </summary>
[SupportedOSPlatform("windows")]
internal static class WindowsPath
{
    /// <summary>레지스트리에 기록된 최신 시스템/사용자 PATH로 현재 프로세스의 PATH를 덮어쓴다.</summary>
    public static void RefreshFromRegistry()
    {
        var machinePath = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.Machine) ?? string.Empty;
        var userPath = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User) ?? string.Empty;

        var combined = string.Join(';', new[] { machinePath, userPath }.Where(p => !string.IsNullOrEmpty(p)));
        if (!string.IsNullOrEmpty(combined))
        {
            Environment.SetEnvironmentVariable("Path", combined);
        }
    }

    /// <summary>레지스트리 갱신 없이 특정 디렉터리를 현재 프로세스 PATH 맨 앞에 추가한다.</summary>
    public static void PrependToProcessPath(string directory)
    {
        var current = Environment.GetEnvironmentVariable("Path") ?? string.Empty;
        var alreadyPresent = current
            .Split(';', StringSplitOptions.RemoveEmptyEntries)
            .Any(p => string.Equals(p.TrimEnd('\\'), directory.TrimEnd('\\'), StringComparison.OrdinalIgnoreCase));

        if (!alreadyPresent)
        {
            Environment.SetEnvironmentVariable("Path", $"{directory};{current}");
        }
    }
}
