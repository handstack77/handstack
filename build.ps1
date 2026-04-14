#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Invoke-DotNet {
    param([string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet command failed: dotnet $($Arguments -join ' ')"
    }
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptRoot

$projects = @(
    "2.Modules/wwwroot/wwwroot.csproj"
    "2.Modules/dbclient/dbclient.csproj"
    "2.Modules/function/function.csproj"
    "2.Modules/command/command.csproj"
    "2.Modules/logger/logger.csproj"
    "2.Modules/repository/repository.csproj"
    "2.Modules/transact/transact.csproj"
    "2.Modules/checkup/checkup.csproj"
    "1.WebHost/ack/ack.csproj"
    "1.WebHost/agent/agent.csproj"
    "1.WebHost/deploy/deploy.csproj"
    "1.WebHost/forbes/forbes.csproj"
    "4.Tool/CLI/bundling/bundling.csproj"
    "4.Tool/CLI/dotnet-installer/dotnet-installer.csproj"
    "4.Tool/CLI/edgeproxy/edgeproxy.csproj"
    "4.Tool/CLI/excludedportrange/excludedportrange.csproj"
    "4.Tool/CLI/handsonapp/handsonapp.csproj"
    "4.Tool/CLI/updater/updater.csproj"
    "4.Tool/CLI/handstack/handstack.csproj"
    "4.Tool/CLI/ports/ports.csproj"
    "4.Tool/CLI/publish-package/publish-package.csproj"
)

try {
    Write-Host "Restoring solution packages..."
    Invoke-DotNet -Arguments @("restore", "handstack.sln")

    Write-Host ""
    Write-Host "Cleaning solution..."
    Invoke-DotNet -Arguments @("clean", "handstack.sln")

    foreach ($project in $projects) {
        $projectName = [System.IO.Path]::GetFileNameWithoutExtension($project)

        Write-Host ""
        Write-Host "Building $projectName..."
        Invoke-DotNet -Arguments @("build", $project, "-c", "Debug")
    }

    Write-Host ""
    Write-Host "All projects built successfully."
}
catch {
    Write-Error "ERROR: Build failed. $($_.Exception.Message)"
    exit 1
}
finally {
    Pop-Location
}
