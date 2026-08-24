#Requires -Version 5.1
<#
    Windows에서 부트스트래퍼를 게시(publish)하고 Ubuntu(linux-x64)용 Velopack 릴리스로 패키징한다.
    `vpk` 전역 도구가 필요하다:
        dotnet tool install -g vpk
#>
param(
    [string]$Version = "1.0.0",
    [string]$PackageId = "HandStack.Bootstrapper"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$runtime = "linux-x64"
$publishDir = Join-Path $root "publish\$runtime"
$releaseDir = Join-Path $root "releases\$runtime"

Write-Host "게시 중 ($runtime 게시 프로필)..."
dotnet publish "$root\src\HandStack.Bootstrapper.csproj" `
    -c Release -p:PublishProfile=$runtime `
    -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish 실패" }

Write-Host "vpk로 패키징 중..."
# vpk 버전에 따라 플래그 이름이 달라질 수 있다. 실패하면 설치된 버전 기준으로
# `vpk pack --help`를 실행해 확인할 것.
vpk '[linux]' pack `
    --packId $PackageId `
    --packVersion $Version `
    --packDir $publishDir `
    --mainExe "HandStack.Bootstrapper" `
    --outputDir $releaseDir `
    --runtime $runtime
if ($LASTEXITCODE -ne 0) { throw "vpk pack 실패" }

Write-Host "완료 -> $releaseDir"
