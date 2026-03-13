#!/usr/bin/env pwsh
#
# forbes 호스트 publish 스크립트
#
# 설명:
#   forbes 웹 호스트 프로젝트를 여러 런타임 식별자(RID) 기준으로 publish합니다.
#   각 런타임별로 self-contained 단일 파일 산출물을 생성하고,
#   publish 출력은 스크립트 디렉터리 아래 publish/{rid} 경로에 저장합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK
#   - forbes.csproj 파일이 현재 스크립트 디렉터리에 존재해야 함
#
# 사용법:
#   Windows: ./publish.ps1 -Configuration Release
#   macOS/Linux: ./publish.ps1 -Configuration Release
#   공통: ./publish.ps1 -OutputRoot ./publish-custom -NoRestore

param(
    [string]$Configuration = "Release",
    [string]$Framework = "net10.0",
    [string]$ProjectPath = (Join-Path $PSScriptRoot "forbes.csproj"),
    [string]$OutputRoot = ([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "publish"))),
    [switch]$NoRestore
)

$ErrorActionPreference = "Stop"

# publish 대상 프로젝트 파일 존재 여부를 먼저 확인합니다.
if (-not (Test-Path $ProjectPath))
{
    throw "프로젝트 파일을 찾을 수 없습니다: $ProjectPath"
}

# 배포할 런타임 식별자 목록입니다.
$runtimeIdentifiers = @(
    "win-x64",
    "linux-x64",
    "osx-x64"
)

# 각 런타임 식별자별로 dotnet publish를 실행합니다.
foreach ($runtimeIdentifier in $runtimeIdentifiers)
{
    $outputPath = Join-Path $OutputRoot $runtimeIdentifier

    $arguments = @(
        "publish"
        $ProjectPath
        "-c"
        $Configuration
        "-f"
        $Framework
        "-r"
        $runtimeIdentifier
        "--self-contained"
        "true"
        "-p:PublishSingleFile=true"
        "-p:DebugSymbols=false"
        "-p:DebugType=None"
        "-o"
        $outputPath
    )

    $arguments += "-p:DefaultItemExcludesInProjectFolder=publish*/**"

    # 필요 시 restore 단계를 생략합니다.
    if ($NoRestore)
    {
        $arguments += "--no-restore"
    }

    Write-Host "==> Publishing: $runtimeIdentifier"
    Write-Host "    Output: $outputPath"

    & dotnet @arguments

    if ($LASTEXITCODE -ne 0)
    {
        throw "publish 실패: $runtimeIdentifier"
    }
}

Write-Host ""
# 모든 RID 대상 publish가 끝나면 결과 위치를 출력합니다.
Write-Host "모든 런타임 publish가 완료되었습니다."
Write-Host "출력 경로: $OutputRoot"
