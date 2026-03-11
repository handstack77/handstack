#!/usr/bin/env pwsh

param(
    [ValidateSet("win", "linux", "osx")]
    [string]$OsMode = "win",

    [ValidateSet("build", "publish")]
    [string]$ActionMode = "build",

    [ValidateSet("Debug", "Release")]
    [string]$ConfigurationMode = "Release",

    [ValidateSet("x64", "x86", "arm64")]
    [string]$ArchMode = "x64",

    [string]$PublishPath = ""
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Remove-SafeItem {
    param([string]$Path)

    if (-not [string]::IsNullOrWhiteSpace($Path) -and (Test-Path -LiteralPath $Path)) {
        Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Invoke-DotNet {
    param([string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet 명령 실패: dotnet $($Arguments -join ' ')"
    }
}

function Copy-DirectoryContents {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        return
    }

    Ensure-Directory -Path $Destination

    Get-ChildItem -LiteralPath $Source -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

function Resolve-Rid {
    param(
        [string]$TargetOs,
        [string]$TargetArch
    )

    switch ($TargetOs) {
        "win" {
            switch ($TargetArch) {
                "x64" { return "win-x64" }
                "x86" { return "win-x86" }
                "arm64" { return "win-arm64" }
                default { throw "지원하지 않는 아키텍처입니다: $TargetOs/$TargetArch" }
            }
        }
        "linux" {
            switch ($TargetArch) {
                "x64" { return "linux-x64" }
                "arm64" { return "linux-arm64" }
                default { throw "지원하지 않는 아키텍처입니다: $TargetOs/$TargetArch" }
            }
        }
        "osx" {
            switch ($TargetArch) {
                "x64" { return "osx-x64" }
                "arm64" { return "osx-arm64" }
                default { throw "지원하지 않는 아키텍처입니다: $TargetOs/$TargetArch" }
            }
        }
        default { throw "지원하지 않는 OS 모드입니다: $TargetOs" }
    }
}

function Invoke-CliBuildOrPublish {
    param(
        [string]$ProjectPath,
        [string]$OutputPath,
        [string]$Action,
        [string]$Optimize,
        [string]$Configuration,
        [string]$Os,
        [string]$Arch,
        [string]$Rid
    )

    $args = @(
        $Action,
        "-p:Optimize=$Optimize",
        "-p:PublishSingleFile=true",
        "--configuration", $Configuration
    )

    if ($Action -eq "publish") {
        $args += @("--runtime", $Rid, "--self-contained", "false")
    }
    else {
        $args += @("--arch", $Arch, "--os", $Os)
    }

    $args += @($ProjectPath, "--output", $OutputPath)
    Invoke-DotNet -Arguments $args
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptRoot

try {
    if ([string]::IsNullOrWhiteSpace($env:HANDSTACK_SRC)) {
        $env:HANDSTACK_SRC = $scriptRoot
    }

    if ([string]::IsNullOrWhiteSpace($env:HANDSTACK_HOME)) {
        $env:HANDSTACK_HOME = [System.IO.Path]::GetFullPath(
            [System.IO.Path]::Combine($env:HANDSTACK_SRC, "..", "build", "handstack")
        )
    }

    if ([string]::IsNullOrWhiteSpace($PublishPath)) {
        $PublishPath = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "..", "publish", "$OsMode-$ArchMode")
    }

    $PublishPath = [System.IO.Path]::GetFullPath($PublishPath)
    $rid = Resolve-Rid -TargetOs $OsMode -TargetArch $ArchMode
    $optimizeFlag = if ($ConfigurationMode -eq "Debug") { "false" } else { "true" }

    if ($ActionMode -eq "publish") {
        $dotnetOptions = @(
            "-p:Optimize=$optimizeFlag",
            "--configuration", $ConfigurationMode,
            "--runtime", $rid,
            "--self-contained", "false"
        )
    }
    else {
        $dotnetOptions = @(
            "-p:Optimize=$optimizeFlag",
            "--configuration", $ConfigurationMode,
            "--arch", $ArchMode,
            "--os", $OsMode
        )
    }

    Write-Host "os_mode: $OsMode, action_mode: $ActionMode, configuration_mode: $ConfigurationMode, arch_mode: $ArchMode, optimize: $optimizeFlag, rid: $rid, publish_path: $PublishPath"

    Remove-SafeItem -Path $PublishPath

    $handstackRoot = [System.IO.Path]::Combine($PublishPath, "handstack")

    Invoke-DotNet -Arguments @(
        $ActionMode
        $dotnetOptions
        [System.IO.Path]::Combine("1.WebHost", "ack", "ack.csproj")
        "--output"
        [System.IO.Path]::Combine($handstackRoot, "app")
    )

    Invoke-DotNet -Arguments @(
        $ActionMode
        $dotnetOptions
        [System.IO.Path]::Combine("1.WebHost", "forbes", "forbes.csproj")
        "--output"
        [System.IO.Path]::Combine($handstackRoot, "forbes")
    )

    Invoke-CliBuildOrPublish -ProjectPath ([System.IO.Path]::Combine("4.Tool", "CLI", "handstack", "handstack.csproj")) `
        -OutputPath ([System.IO.Path]::Combine($handstackRoot, "app", "cli", "handstack")) `
        -Action $ActionMode -Optimize $optimizeFlag -Configuration $ConfigurationMode -Os $OsMode -Arch $ArchMode -Rid $rid

    Invoke-CliBuildOrPublish -ProjectPath ([System.IO.Path]::Combine("4.Tool", "CLI", "edgeproxy", "edgeproxy.csproj")) `
        -OutputPath ([System.IO.Path]::Combine($handstackRoot, "app", "cli", "edgeproxy")) `
        -Action $ActionMode -Optimize $optimizeFlag -Configuration $ConfigurationMode -Os $OsMode -Arch $ArchMode -Rid $rid

    Invoke-CliBuildOrPublish -ProjectPath ([System.IO.Path]::Combine("4.Tool", "CLI", "bundling", "bundling.csproj")) `
        -OutputPath ([System.IO.Path]::Combine($handstackRoot, "app", "cli", "bundling")) `
        -Action $ActionMode -Optimize $optimizeFlag -Configuration $ConfigurationMode -Os $OsMode -Arch $ArchMode -Rid $rid

    $contractsPath = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts")
    Remove-SafeItem -Path $contractsPath

    $modules = @(
        @{ Name = "dbclient";   Project = [System.IO.Path]::Combine("2.Modules", "dbclient", "dbclient.csproj") }
        @{ Name = "function";   Project = [System.IO.Path]::Combine("2.Modules", "function", "function.csproj") }
        @{ Name = "logger";     Project = [System.IO.Path]::Combine("2.Modules", "logger", "logger.csproj") }
        @{ Name = "repository"; Project = [System.IO.Path]::Combine("2.Modules", "repository", "repository.csproj") }
        @{ Name = "transact";   Project = [System.IO.Path]::Combine("2.Modules", "transact", "transact.csproj") }
        @{ Name = "wwwroot";    Project = [System.IO.Path]::Combine("2.Modules", "wwwroot", "wwwroot.csproj") }
        @{ Name = "checkup";    Project = [System.IO.Path]::Combine("2.Modules", "checkup", "checkup.csproj") }
    )

    foreach ($module in $modules) {
        Invoke-DotNet -Arguments @(
            "build"
            "-p:Optimize=$optimizeFlag"
            "--configuration"
            $ConfigurationMode
            $module.Project
            "--output"
            [System.IO.Path]::Combine($handstackRoot, "modules", $module.Name)
        )
    }

    if (Test-Path -LiteralPath $contractsPath) {
        Copy-DirectoryContents -Source $contractsPath -Destination ([System.IO.Path]::Combine($handstackRoot, "contracts"))
    }

    Get-ChildItem -Path $scriptRoot -Filter "install.*" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination ([System.IO.Path]::Combine($handstackRoot, $_.Name)) -Force
    }

    Get-ChildItem -Path ([System.IO.Path]::Combine("2.Modules", "function")) -Filter "package*.*" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination ([System.IO.Path]::Combine($handstackRoot, $_.Name)) -Force
    }

    $wwwrootJsPath = [System.IO.Path]::Combine($handstackRoot, "modules", "wwwroot", "wwwroot")
    Remove-SafeItem -Path ([System.IO.Path]::Combine($wwwrootJsPath, "lib"))

    $jsFiles = @(
        "syn.bundle.js",
        "syn.bundle.min.js",
        "syn.controls.js",
        "syn.controls.min.js",
        "syn.scripts.base.js",
        "syn.scripts.base.min.js",
        "syn.scripts.js",
        "syn.scripts.min.js"
    )

    foreach ($jsFile in $jsFiles) {
        Remove-SafeItem -Path ([System.IO.Path]::Combine($wwwrootJsPath, "js", $jsFile))
    }

    foreach ($pattern in @("*.staticwebassets.endpoints.json", "*.staticwebassets.runtime.json")) {
        Get-ChildItem -Path $handstackRoot -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-SafeItem -Path $_.FullName
        }
    }

    Get-ChildItem -Path $handstackRoot -Recurse -Directory -Filter "runtimes" -ErrorAction SilentlyContinue | ForEach-Object {
        $runtimesPath = $_.FullName

        Get-ChildItem -LiteralPath $runtimesPath -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -ne $rid } |
            ForEach-Object { Remove-SafeItem -Path $_.FullName }

        Get-ChildItem -LiteralPath $runtimesPath -File -ErrorAction SilentlyContinue |
            ForEach-Object { Remove-SafeItem -Path $_.FullName }
    }

    $assembliesSource = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "3.Infrastructure", "Assemblies")
    $assembliesDestination = [System.IO.Path]::Combine($handstackRoot, "assemblies")

    if (Test-Path -LiteralPath $assembliesSource) {
        Remove-SafeItem -Path $assembliesDestination
        Copy-DirectoryContents -Source $assembliesSource -Destination $assembliesDestination
    }
    else {
        Write-Warning "Assemblies 경로를 찾을 수 없습니다: $assembliesSource"
    }

    Write-Host "빌드/퍼블리시가 성공적으로 완료되었습니다!"
    Write-Host "출력 디렉토리: $PublishPath"
}
catch {
    Write-Error $_
    exit 1
}
finally {
    Pop-Location
}
