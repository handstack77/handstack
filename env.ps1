#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

$currentPath = (Get-Location).Path
$parentDir = Split-Path -Parent $currentPath
$handstackHome = Join-Path (Join-Path $parentDir "build") "handstack"

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

Set-HandStackEnv -Name "DOTNET_CLI_TELEMETRY_OPTOUT" -Value "1"
Set-HandStackEnv -Name "HANDSTACK_SRC" -Value $currentPath
Set-HandStackEnv -Name "HANDSTACK_HOME" -Value $handstackHome

Write-Host "HANDSTACK_SRC: $currentPath"
Write-Host "HANDSTACK_HOME: $handstackHome"

if (-not $IsWindows) {
    $profileName = if ($IsMacOS) { "~/.zshrc" } else { "~/.bashrc" }
    Write-Host "Reload shell profile: source $profileName"
}
