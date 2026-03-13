#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

#
# HandStack 환경 변수 설정 스크립트
#
# 사용법:
#   Windows: ./env.ps1 또는 pwsh ./env.ps1
#   macOS/Linux: ./env.ps1 또는 pwsh ./env.ps1
#

$currentPath = (Get-Location).Path
$parentDir = Split-Path -Parent $currentPath
$handstackHome = Join-Path (Join-Path $parentDir "build") "handstack"

function Test-CommandExists {
    param([string]$CommandName)
    $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Get-ProfilePath {
    if ($IsMacOS) {
        return Join-Path $HOME ".zshrc"
    }

    return Join-Path $HOME ".bashrc"
}

function Update-UnixProfileExport {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    $profilePath = Get-ProfilePath
    if (-not (Test-Path $profilePath)) {
        New-Item -Path $profilePath -ItemType File -Force | Out-Null
    }

    $pattern = "^\s*export\s+$([Regex]::Escape($Name))=.*$"
    $escapedValue = $Value.Replace("\", "\\").Replace('"', '\"')
    $newLine = "export $Name=""$escapedValue"""

    $existing = Get-Content -Path $profilePath -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        $existing = @()
    }

    $updated = @($existing | Where-Object { $_ -notmatch $pattern })
    $updated += $newLine
    Set-Content -Path $profilePath -Value $updated -Encoding utf8

    Write-Host "Profile updated: $profilePath"
}

function Repair-MacOSNpmOwnership {
    if (-not $IsMacOS) {
        return
    }

    $npmCacheDir = Join-Path $HOME ".npm"
    if (-not (Test-Path $npmCacheDir)) {
        return
    }

    if (-not (Test-CommandExists "sudo")) {
        throw "macOS npm 권한 보정을 위해 sudo가 필요합니다."
    }

    $currentUser = [System.Environment]::UserName
    Write-Host "macOS npm 캐시 권한 보정 중..."
    & sudo chown -R $currentUser $npmCacheDir
    if ($LASTEXITCODE -ne 0) {
        throw "~/.npm 권한 보정 실패"
    }
}

function Set-HandStackEnv {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    [Environment]::SetEnvironmentVariable($Name, $Value, "Process")

    if ($IsWindows) {
        [Environment]::SetEnvironmentVariable($Name, $Value, "User")
    }
    else {
        Update-UnixProfileExport -Name $Name -Value $Value
    }
}

Repair-MacOSNpmOwnership

if (-not (Test-Path $handstackHome)) {
    New-Item -Path $handstackHome -ItemType Directory -Force | Out-Null
}

Set-HandStackEnv -Name "DOTNET_CLI_TELEMETRY_OPTOUT" -Value "1"
Set-HandStackEnv -Name "HANDSTACK_SRC" -Value $currentPath
Set-HandStackEnv -Name "HANDSTACK_HOME" -Value $handstackHome

Write-Host "HANDSTACK_SRC: $currentPath"
Write-Host "HANDSTACK_HOME: $handstackHome"

if (-not $IsWindows) {
    $profileName = if ($IsMacOS) { "~/.zshrc" } else { "~/.bashrc" }
    Write-Host "Reload shell profile: source $profileName"
}
