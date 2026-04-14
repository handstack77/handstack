#!/usr/bin/env pwsh

param(
    [ValidateSet('win', 'linux', 'osx')]
    [string]$OsMode = 'win',

    [ValidateSet('build', 'publish')]
    [string]$ActionMode = 'build',

    [ValidateSet('Debug', 'Release')]
    [string]$ConfigurationMode = 'Release',

    [string]$ArchMode = 'x64',

    [string]$PublishPath = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Resolve-Rid {
    param(
        [Parameter(Mandatory = $true)][string]$TargetOs,
        [Parameter(Mandatory = $true)][string]$TargetArch
    )

    switch ($TargetOs) {
        'win' {
            switch ($TargetArch) {
                'x64' { return 'win-x64' }
                'x86' { return 'win-x86' }
                'arm64' { return 'win-arm64' }
                default { throw "지원하지 않는 아키텍처입니다: $TargetOs/$TargetArch" }
            }
        }
        'linux' {
            switch ($TargetArch) {
                'x64' { return 'linux-x64' }
                'arm64' { return 'linux-arm64' }
                default { throw "지원하지 않는 아키텍처입니다: $TargetOs/$TargetArch" }
            }
        }
        'osx' {
            switch ($TargetArch) {
                'x64' { return 'osx-x64' }
                'arm64' { return 'osx-arm64' }
                default { throw "지원하지 않는 아키텍처입니다: $TargetOs/$TargetArch" }
            }
        }
        default {
            throw "지원하지 않는 OS 모드입니다: $TargetOs"
        }
    }
}

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Remove-IfExists {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
}

function Invoke-DotNet {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet 명령 실패: dotnet $($Arguments -join ' ')"
    }
}

function Copy-FileSet {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDirectory,
        [Parameter(Mandatory = $true)][string]$Pattern,
        [Parameter(Mandatory = $true)][string]$DestinationDirectory
    )

    Ensure-Directory -Path $DestinationDirectory

    Get-ChildItem -Path $SourceDirectory -Filter $Pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination ([System.IO.Path]::Combine($DestinationDirectory, $_.Name)) -Force
    }
}

function Copy-DirectoryContents {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        return
    }

    Ensure-Directory -Path $Destination
    Get-ChildItem -LiteralPath $Source -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

function Sync-DirectoryMirror {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        return
    }

    Remove-IfExists -Path $Destination
    Ensure-Directory -Path $Destination
    Get-ChildItem -LiteralPath $Source -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptRoot

try {
    if ([string]::IsNullOrWhiteSpace($env:HANDSTACK_SRC)) {
        $env:HANDSTACK_SRC = $scriptRoot
    }

    if ([string]::IsNullOrWhiteSpace($env:HANDSTACK_HOME)) {
        $env:HANDSTACK_HOME = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($env:HANDSTACK_SRC, '..', 'build', 'handstack'))
    }

    if ([string]::IsNullOrWhiteSpace($PublishPath)) {
        $PublishPath = [System.IO.Path]::Combine($env:HANDSTACK_SRC, '..', 'publish', "$OsMode-$ArchMode")
    }

    $PublishPath = [System.IO.Path]::GetFullPath($PublishPath)
    $rid = Resolve-Rid -TargetOs $OsMode -TargetArch $ArchMode
    $optimizeFlag = if ($ConfigurationMode -eq 'Debug') { 'false' } else { 'true' }

    if ($ActionMode -eq 'publish') {
        $dotnetOptions = @(
            "-p:Optimize=$optimizeFlag"
            '--configuration'
            $ConfigurationMode
            '--runtime'
            $rid
            '--self-contained'
            'false'
        )
    }
    else {
        $dotnetOptions = @(
            "-p:Optimize=$optimizeFlag"
            '--configuration'
            $ConfigurationMode
        )
    }

    Write-Host "os_mode: $OsMode, action_mode: $ActionMode, configuration_mode: $ConfigurationMode, arch_mode: $ArchMode, optimize: $optimizeFlag, rid: $rid, publish_path: $PublishPath"

    Remove-IfExists -Path $PublishPath

    Invoke-DotNet -Arguments @(
        $ActionMode
        $dotnetOptions
        '1.WebHost/ack/ack.csproj'
        '--output'
        ([System.IO.Path]::Combine($PublishPath, 'handstack', 'app'))
    )

    Invoke-DotNet -Arguments @(
        $ActionMode
        $dotnetOptions
        '1.WebHost/agent/agent.csproj'
        '--output'
        ([System.IO.Path]::Combine($PublishPath, 'handstack', 'hosts', 'agent'))
    )

    Invoke-DotNet -Arguments @(
        $ActionMode
        $dotnetOptions
        '1.WebHost/deploy/deploy.csproj'
        '--output'
        ([System.IO.Path]::Combine($PublishPath, 'handstack', 'hosts', 'deploy'))
    )

    Invoke-DotNet -Arguments @(
        $ActionMode
        $dotnetOptions
        '1.WebHost/forbes/forbes.csproj'
        '--output'
        ([System.IO.Path]::Combine($PublishPath, 'handstack', 'hosts', 'forbes'))
    )

    $cliProjects = @(
        @{ Project = '4.Tool/CLI/bundling/bundling.csproj'; Name = 'bundling' }
        @{ Project = '4.Tool/CLI/dotnet-installer/dotnet-installer.csproj'; Name = 'dotnet-installer' }
        @{ Project = '4.Tool/CLI/edgeproxy/edgeproxy.csproj'; Name = 'edgeproxy' }
        @{ Project = '4.Tool/CLI/excludedportrange/excludedportrange.csproj'; Name = 'excludedportrange' }
        @{ Project = '4.Tool/CLI/handsonapp/handsonapp.csproj'; Name = 'handsonapp' }
        @{ Project = '4.Tool/CLI/updater/updater.csproj'; Name = 'updater' }
        @{ Project = '4.Tool/CLI/handstack/handstack.csproj'; Name = 'handstack' }
        @{ Project = '4.Tool/CLI/ports/ports.csproj'; Name = 'ports' }
        @{ Project = '4.Tool/CLI/publish-package/publish-package.csproj'; Name = 'publish-package' }
    )

    foreach ($cliProject in $cliProjects) {
        if ($ActionMode -eq 'publish') {
            Invoke-DotNet -Arguments @(
                $ActionMode
                "-p:Optimize=$optimizeFlag"
                '-p:PublishSingleFile=true'
                '--configuration'
                $ConfigurationMode
                '--runtime'
                $rid
                '--self-contained'
                'false'
                $cliProject.Project
                '--output'
                ([System.IO.Path]::Combine($PublishPath, 'handstack', 'tools', $cliProject.Name))
            )
        }
        else {
            Invoke-DotNet -Arguments @(
                $ActionMode
                "-p:Optimize=$optimizeFlag"
                '--configuration'
                $ConfigurationMode
                $cliProject.Project
                '--output'
                ([System.IO.Path]::Combine($PublishPath, 'handstack', 'tools', $cliProject.Name))
            )
        }
    }

    $contractsPath = [System.IO.Path]::Combine($env:HANDSTACK_HOME, 'contracts')
    Remove-IfExists -Path $contractsPath

    $modules = @(
        @{ Project = '2.Modules/checkup/checkup.csproj'; Name = 'checkup' }
        @{ Project = '2.Modules/command/command.csproj'; Name = 'command' }
        @{ Project = '2.Modules/prompter/prompter.csproj'; Name = 'prompter' }
        @{ Project = '2.Modules/dbclient/dbclient.csproj'; Name = 'dbclient' }
        @{ Project = '2.Modules/forwarder/forwarder.csproj'; Name = 'forwarder' }
        @{ Project = '2.Modules/function/function.csproj'; Name = 'function' }
        @{ Project = '2.Modules/logger/logger.csproj'; Name = 'logger' }
        @{ Project = '2.Modules/repository/repository.csproj'; Name = 'repository' }
        @{ Project = '2.Modules/transact/transact.csproj'; Name = 'transact' }
        @{ Project = '2.Modules/wwwroot/wwwroot.csproj'; Name = 'wwwroot' }
    )

    foreach ($module in $modules) {
        Invoke-DotNet -Arguments @(
            'build'
            "-p:Optimize=$optimizeFlag"
            '--configuration'
            $ConfigurationMode
            $module.Project
            '--output'
            ([System.IO.Path]::Combine($PublishPath, 'handstack', 'modules', $module.Name))
        )
    }

    if (Test-Path -LiteralPath $contractsPath) {
        Copy-DirectoryContents -Source $contractsPath -Destination ([System.IO.Path]::Combine($PublishPath, 'handstack', 'contracts'))
    }

    Copy-FileSet -SourceDirectory $scriptRoot -Pattern 'install.*' -DestinationDirectory ([System.IO.Path]::Combine($PublishPath, 'handstack'))
    Copy-FileSet -SourceDirectory ([System.IO.Path]::Combine($scriptRoot, '2.Modules', 'function')) -Pattern 'package*.*' -DestinationDirectory ([System.IO.Path]::Combine($PublishPath, 'handstack'))

    $wwwrootJsPath = [System.IO.Path]::Combine($PublishPath, 'handstack', 'modules', 'wwwroot', 'wwwroot')
    Remove-IfExists -Path ([System.IO.Path]::Combine($wwwrootJsPath, 'lib'))

    foreach ($jsFile in @(
        'syn.bundle.js',
        'syn.bundle.min.js',
        'syn.controls.js',
        'syn.controls.min.js',
        'syn.scripts.base.js',
        'syn.scripts.base.min.js',
        'syn.scripts.js',
        'syn.scripts.min.js'
    )) {
        Remove-IfExists -Path ([System.IO.Path]::Combine($wwwrootJsPath, 'js', $jsFile))
    }

    foreach ($pattern in @('*.staticwebassets.endpoints.json', '*.staticwebassets.runtime.json')) {
        Get-ChildItem -Path ([System.IO.Path]::Combine($PublishPath, 'handstack')) -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-IfExists -Path $_.FullName
        }
    }

    Get-ChildItem -Path ([System.IO.Path]::Combine($PublishPath, 'handstack')) -Recurse -Directory -Filter 'runtimes' -ErrorAction SilentlyContinue | ForEach-Object {
        Get-ChildItem -LiteralPath $_.FullName -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne $rid } | ForEach-Object {
            Remove-IfExists -Path $_.FullName
        }

        Get-ChildItem -LiteralPath $_.FullName -File -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-IfExists -Path $_.FullName
        }
    }

    $assembliesSource = [System.IO.Path]::Combine($env:HANDSTACK_SRC, '3.Infrastructure', 'Assemblies')
    $assembliesDestination = [System.IO.Path]::Combine($PublishPath, 'handstack', 'assemblies')
    if (Test-Path -LiteralPath $assembliesSource) {
        Sync-DirectoryMirror -Source $assembliesSource -Destination $assembliesDestination
    }

    Write-Host '빌드/퍼블리시가 성공적으로 완료되었습니다!'
    Write-Host "출력 디렉토리: $PublishPath"
}
catch {
    Write-Error "ERROR: publish.ps1 실행 실패. $($_.Exception.Message)"
    exit 1
}
finally {
    Pop-Location
}

