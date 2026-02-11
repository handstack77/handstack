#!/usr/bin/env pwsh
#
# edgeproxy CLI 도구 빌드 후 배포 스크립트
#
# 설명:
#   edgeproxy CLI 도구를 dotnet publish로 빌드하여
#   HANDSTACK_HOME/app/cli 디렉터리에 배포합니다.
#   중복 빌드 방지를 위해 BUILD_COMPLETED 환경 변수를 확인합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (dotnet CLI)
#   - 환경 변수: HANDSTACK_HOME
#
# 매개변수:
#   OsMode            - 대상 운영체제: win, linux, osx (기본값: 현재 OS 자동 감지)
#   ActionMode        - dotnet 액션: build 또는 publish (기본값: build)
#   ConfigurationMode - 빌드 구성: Debug 또는 Release (기본값: Debug)
#   ArchMode          - 대상 아키텍처: x64, x86, arm64 (기본값: x64)
#
# 사용법:
#   ./post-build.ps1
#   ./post-build.ps1 win build Debug
#   ./post-build.ps1 linux publish Release x64

param(
    [string]$OsMode = "",
    [string]$ActionMode = "build",
    [string]$ConfigurationMode = "Debug",
    [string]$ArchMode = "x64"
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 중복 빌드 방지
if ($env:BUILD_COMPLETED -eq "true") {
    Write-Host "Build already completed, skipping..."
    exit 0
}
$env:BUILD_COMPLETED = "true"

# OsMode 미지정 시 현재 OS 자동 감지
if ([string]::IsNullOrEmpty($OsMode)) {
    $IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
    $IsMacOS = $IsMacOS -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))

    if ($IsWindows) { $OsMode = "win" }
    elseif ($IsMacOS) { $OsMode = "osx" }
    else { $OsMode = "linux" }
}

Write-Host "os_mode: $OsMode, action_mode: $ActionMode, configuration_mode: $ConfigurationMode, arch_mode: $ArchMode"

$cliOutput = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "app", "cli")

dotnet publish edgeproxy.csproj --configuration $ConfigurationMode --arch $ArchMode --os $OsMode --output $cliOutput

if ($LASTEXITCODE -ne 0) {
    Write-Error "edgeproxy CLI 배포 실패"
    exit 1
}