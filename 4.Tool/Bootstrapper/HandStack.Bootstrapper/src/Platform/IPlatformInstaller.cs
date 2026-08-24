namespace HandStack.Bootstrapper.Platform;

/// <summary>도구 모음 구성 요소를 조용히 설치하기 위한 OS별 전략.</summary>
internal interface IPlatformInstaller
{
    /// <summary>설치를 시작하기 전에 관리자 권한/패키지 매니저 존재 여부를 확인한다.</summary>
    Task EnsurePrerequisitesAsync();

    Task InstallDotNetSdkAsync(string channel);

    Task InstallNodeLtsAsync();

    Task InstallPowerShellAsync();

    Task InstallGitAsync();

    Task InstallCurlAsync();
}
