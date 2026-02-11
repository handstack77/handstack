#!/usr/bin/env pwsh
#
# handstack CLI 도구 빌드 스크립트
#
# 설명:
#   handstack CLI 도구를 빌드하거나 배포(publish)하여
#   지정된 출력 경로에 배포합니다.
#   빌드 전에 기존 출력 디렉터리를 삭제하여 클린 빌드를 보장합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (dotnet CLI)
#
# 매개변수:
#   OsMode            - 대상 운영체제: win, linux, osx (기본값: 현재 OS 자동 감지)
#   ActionMode        - dotnet 액션: build 또는 publish (기본값: build)
#   ConfigurationMode - 빌드 구성: Debug 또는 Release (기본값: Debug)
#   ArchMode          - 대상 아키텍처: x64, x86, arm64 (기본값: x64)
#
# 사용법:
#   ./build.ps1
#   ./build.ps1 win build Debug
#   ./build.ps1 linux publish Release x64

param(
    [string]$OsMode = "",
    [string]$ActionMode = "build",
    [string]$ConfigurationMode = "Debug",
    [string]$ArchMode = "x64"
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# OsMode 미지정 시 현재 OS 자동 감지
if ([string]::IsNullOrEmpty($OsMode)) {
    $IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
    $IsMacOS = $IsMacOS -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))

    if ($IsWindows) { $OsMode = "win" }
    elseif ($IsMacOS) { $OsMode = "osx" }
    else { $OsMode = "linux" }
}

Write-Host "os_mode: $OsMode, action_mode: $ActionMode, configuration_mode: $ConfigurationMode, arch_mode: $ArchMode"

$publishBase = [System.IO.Path]::Combine([System.IO.Path]::GetPathRoot((Get-Location).Path), "publish")
$cliOutput = [System.IO.Path]::Combine($publishBase, "$OsMode-$ArchMode", "handstack", "app", "cli")
$handstackDir = [System.IO.Path]::Combine($cliOutput, "handstack")

# 기존 출력 디렉터리 삭제
if (Test-Path $handstackDir) {
    Remove-Item -Path $handstackDir -Recurse -Force
}

dotnet $ActionMode handstack.csproj --configuration $ConfigurationMode --arch $ArchMode --os $OsMode --output $cliOutput

if ($LASTEXITCODE -ne 0) {
    Write-Error "handstack CLI 빌드 실패"
    exit 1
}