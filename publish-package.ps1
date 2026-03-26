#!/usr/bin/env pwsh
#
# HandStack 업데이트 패키지 생성 스크립트
#
# 설명:
#   publish.ps1으로 생성한 handstack 배포 산출물에서
#   host(app) 및 modules 단위 ZIP 패키지와 version.json을 생성합니다.
#
# 사용법:
#   ./publish-package.ps1 win Release x64
#   ./publish-package.ps1 win Release x64 "../publish/win-x64"

param(
    [ValidateSet("win", "linux", "osx")]
    [string]$OsMode = "win",

    [ValidateSet("Debug", "Release")]
    [string]$ConfigurationMode = "Release",

    [string]$ArchMode = "x64",

    [string]$PublishPath = "",

    [string]$Channel = "stable"
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Remove-SafeItem {
    param([string]$Path)

    if (-not [string]::IsNullOrWhiteSpace($Path) -and (Test-Path -LiteralPath $Path)) {
        Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Compress-DirectoryContents {
    param(
        [string]$SourcePath,
        [string]$DestinationZipPath
    )

    if (-not (Test-Path -LiteralPath $SourcePath)) {
        throw "압축 대상 경로를 찾을 수 없습니다: $SourcePath"
    }

    $parent = Split-Path -Parent $DestinationZipPath
    Ensure-Directory -Path $parent
    Remove-SafeItem -Path $DestinationZipPath
    [System.IO.Compression.ZipFile]::CreateFromDirectory($SourcePath, $DestinationZipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
}

function Get-Sha256 {
    param([string]$Path)

    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-HostVersion {
    param([string]$AppPath)

    $candidate = [System.IO.Path]::Combine($AppPath, "ack.dll")
    if (-not (Test-Path -LiteralPath $candidate)) {
        $candidate = [System.IO.Path]::Combine($AppPath, "ack.exe")
    }

    if (-not (Test-Path -LiteralPath $candidate)) {
        return "0.0.0"
    }

    $version = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($candidate).ProductVersion
    if ([string]::IsNullOrWhiteSpace($version)) {
        $version = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($candidate).FileVersion
    }

    if ([string]::IsNullOrWhiteSpace($version)) {
        return "0.0.0"
    }

    return $version.Split('+')[0]
}

function Get-ModuleVersion {
    param([string]$ModulePath)

    $moduleJsonPath = [System.IO.Path]::Combine($ModulePath, "module.json")
    if (-not (Test-Path -LiteralPath $moduleJsonPath)) {
        return "0.0.0"
    }

    $moduleJson = Get-Content $moduleJsonPath -Raw | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace($moduleJson.Version)) {
        return "0.0.0"
    }

    return [string]$moduleJson.Version
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptRoot

try {
    if ([string]::IsNullOrWhiteSpace($PublishPath)) {
        $PublishPath = [System.IO.Path]::Combine($scriptRoot, "..", "publish", "$OsMode-$ArchMode")
    }

    $PublishPath = [System.IO.Path]::GetFullPath($PublishPath)
    $handstackRoot = if (Test-Path -LiteralPath ([System.IO.Path]::Combine($PublishPath, "handstack"))) {
        [System.IO.Path]::Combine($PublishPath, "handstack")
    }
    else {
        $PublishPath
    }

    $appPath = [System.IO.Path]::Combine($handstackRoot, "app")
    $modulesPath = [System.IO.Path]::Combine($handstackRoot, "modules")

    if (-not (Test-Path -LiteralPath $appPath)) {
        throw "app 경로를 찾을 수 없습니다. 먼저 publish.ps1 실행 결과를 확인하세요: $appPath"
    }

    $updatesRoot = [System.IO.Path]::Combine($PublishPath, "updates", $Channel)
    $packagesRoot = [System.IO.Path]::Combine($updatesRoot, "packages")
    Remove-SafeItem -Path $updatesRoot
    Ensure-Directory -Path $packagesRoot

    $platformId = "$OsMode-$ArchMode"
    $releaseId = "rel-" + (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
    $hostVersion = Get-HostVersion -AppPath $appPath
    $hostZipName = "ack-$platformId-$hostVersion.zip"
    $hostZipPath = [System.IO.Path]::Combine($packagesRoot, $hostZipName)

    Compress-DirectoryContents -SourcePath $appPath -DestinationZipPath $hostZipPath

    $platformManifest = [ordered]@{
        host = [ordered]@{
            version = $hostVersion
            packageType = "host"
            target = "app"
            fileName = $hostZipName
            downloadUrl = "packages/$hostZipName"
            sha256 = Get-Sha256 -Path $hostZipPath
            size = (Get-Item -LiteralPath $hostZipPath).Length
        }
        modules = [ordered]@{}
    }

    if (Test-Path -LiteralPath $modulesPath) {
        Get-ChildItem -LiteralPath $modulesPath -Directory | Sort-Object Name | ForEach-Object {
            $moduleName = $_.Name
            $moduleVersion = Get-ModuleVersion -ModulePath $_.FullName
            $moduleZipName = "modules-$moduleName-$moduleVersion.zip"
            $moduleZipPath = [System.IO.Path]::Combine($packagesRoot, $moduleZipName)

            Compress-DirectoryContents -SourcePath $_.FullName -DestinationZipPath $moduleZipPath

            $platformManifest.modules[$moduleName] = [ordered]@{
                version = $moduleVersion
                packageType = "module"
                target = "modules/$moduleName"
                fileName = $moduleZipName
                downloadUrl = "packages/$moduleZipName"
                sha256 = Get-Sha256 -Path $moduleZipPath
                size = (Get-Item -LiteralPath $moduleZipPath).Length
            }
        }
    }

    $versionManifest = [ordered]@{
        channel = $Channel
        releaseId = $releaseId
        releasedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
        platforms = [ordered]@{
            $platformId = $platformManifest
        }
    }

    $versionJsonPath = [System.IO.Path]::Combine($updatesRoot, "version.json")
    ($versionManifest | ConvertTo-Json -Depth 10) | Set-Content -LiteralPath $versionJsonPath -Encoding utf8

    Write-Host "업데이트 패키지 생성 완료"
    Write-Host "출력 경로: $updatesRoot"
    Write-Host "manifest: $versionJsonPath"
}
catch {
    Write-Error $_
    exit 1
}
finally {
    Pop-Location
}
