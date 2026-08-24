#Requires -Version 5.1
<#
    부트스트래퍼를 게시(publish)하고 Windows용 Velopack 릴리스로 패키징한다.
    Windows 머신에서 실행할 것. `vpk` 전역 도구가 필요하다:
        dotnet tool install -g vpk
#>
param(
    [string]$Version = "1.0.0",
    [string]$PackageId = "HandStack.Bootstrapper"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$publishDir = Join-Path $root "publish\win-x64"
$releaseDir = Join-Path $root "releases\win-x64"

Write-Host "게시 중 (win-x64 게시 프로필)..."
dotnet publish "$root\src\HandStack.Bootstrapper.csproj" `
    -c Release -p:PublishProfile=win-x64 `
    -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish 실패" }

Write-Host "vpk로 패키징 중..."
# vpk 버전에 따라 플래그 이름이 달라질 수 있다. 실패하면 설치된 버전 기준으로
# `vpk pack --help`를 실행해 확인할 것.
vpk pack `
    --packId $PackageId `
    --packVersion $Version `
    --packDir $publishDir `
    --mainExe "HandStack.Bootstrapper.exe" `
    --outputDir $releaseDir `
    --runtime win-x64
if ($LASTEXITCODE -ne 0) { throw "vpk pack 실패" }

Write-Host "완료 -> $releaseDir"
