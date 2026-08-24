#Requires -Version 5.1
<#
    macOS에서 부트스트래퍼를 게시(publish)하고 macOS용 Velopack 릴리스로 패키징한다.
    `vpk` 전역 도구가 필요하다:
        dotnet tool install -g vpk
#>
param(
    [string]$Version = "1.0.0",
    [string]$PackageId = "HandStack.Bootstrapper",
    [ValidateSet("osx-arm64", "osx-x64")]
    [string]$Runtime = "osx-arm64"
)

$ErrorActionPreference = "Stop"
$runningOnWindows = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform(
    [System.Runtime.InteropServices.OSPlatform]::Windows)
if ($runningOnWindows) {
    throw "Velopack macOS 릴리스는 codesign, xcrun, productbuild 의존성 때문에 Windows에서 패키징할 수 없습니다. macOS에서 이 스크립트를 실행하세요."
}

$root = Split-Path -Parent $PSScriptRoot
$publishDir = Join-Path $root "publish\$Runtime"
$releaseDir = Join-Path $root "releases\$Runtime"

Write-Host "게시 중 ($Runtime 게시 프로필)..."
dotnet publish "$root\src\HandStack.Bootstrapper.csproj" `
    -c Release -p:PublishProfile=$Runtime `
    -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish 실패" }

Write-Host "vpk로 패키징 중..."
# vpk 버전에 따라 플래그 이름이 달라질 수 있다. 실패하면 설치된 버전 기준으로
# `vpk pack --help`를 실행해 확인할 것.
vpk pack `
    --packId $PackageId `
    --packVersion $Version `
    --packDir $publishDir `
    --mainExe "HandStack.Bootstrapper" `
    --outputDir $releaseDir `
    --runtime $Runtime
if ($LASTEXITCODE -ne 0) { throw "vpk pack 실패" }

Write-Host "완료 -> $releaseDir"
