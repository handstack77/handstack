#!/usr/bin/env pwsh
#
# HandStack 빌드/퍼블리시 스크립트
#
# 설명:
#   HandStack 배포 산출물을 대상 운영체제/아키텍처 기준으로 생성합니다.
#   현재 디렉터리를 기준으로 WebHost, CLI, Modules를 순서대로 빌드/퍼블리시하고,
#   최종적으로 설치 스크립트, package 파일, Assemblies, contracts 등을 publish 디렉터리로 복사합니다.
#   OsMode 또는 ArchMode를 생략하면 현재 실행 중인 플랫폼 정보를 기준으로 기본값을 결정합니다.
#
#   [build 모드]
#     - dotnet build + --os/--arch 옵션을 사용하여 플랫폼별 출력물을 생성합니다.
#     - CLI 도구는 PublishSingleFile=true로 별도 출력 경로에 생성합니다.
#
#   [publish 모드]
#     - dotnet publish + RID(--runtime) 기준으로 배포 산출물을 생성합니다.
#     - self-contained=false 기준을 사용합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK
#   - HANDSTACK_SRC: 생략 시 현재 스크립트 디렉터리 기준으로 계산
#   - HANDSTACK_HOME: 생략 시 ../build/handstack 기준으로 계산
#
# 사용법:
#   Windows: ./publish.ps1 win build Debug x64
#   Windows: ./publish.ps1 win publish Release x64
#   macOS/Linux: ./publish.ps1 linux build Debug x64
#   macOS/Linux: ./publish.ps1 osx build Debug arm64
#   공통: ./publish.ps1 win build Debug x64 "../custom-path"

param(
    [ValidateSet("win", "linux", "osx")]
    [string]$OsMode,

    [ValidateSet("build", "publish")]
    [string]$ActionMode = "build",

    [ValidateSet("Debug", "Release")]
    [string]$ConfigurationMode = "Release",

    [string]$ArchMode = "",

    [string]$PublishPath = ""
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 현재 실행 중인 머신의 OS 아키텍처를 HandStack 스크립트에서 사용하는 arch 이름으로 변환합니다.
#
# 반환값:
#   x64, x86, arm64
function Resolve-CurrentArchitecture {
    $architectureName = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()

    switch ($architectureName) {
        "x64" { return "x64" }
        "arm64" { return "arm64" }
        "x86" { return "x86" }
        default { throw "현재 실행 중인 아키텍처를 확인할 수 없습니다: $architectureName" }
    }
}

# 존재하는 경로만 재귀 삭제합니다.
# publish 출력 경로 정리나 불필요한 산출물 제거에 사용합니다.
function Remove-SafeItem {
    param([string]$Path)

    if (-not [string]::IsNullOrWhiteSpace($Path) -and (Test-Path -LiteralPath $Path)) {
        Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 대상 디렉터리가 없으면 생성합니다.
function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# dotnet 명령을 실행하고 실패 시 즉시 예외를 발생시킵니다.
function Invoke-DotNet {
    param([string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet 명령 실패: dotnet $($Arguments -join ' ')"
    }
}

# 디렉터리의 직계 하위 항목을 대상 경로로 복사합니다.
# contracts, assemblies 등 부가 산출물 복사에 사용합니다.
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

# 대상 OS/아키텍처 조합을 Runtime Identifier(RID) 문자열로 변환합니다.
#
# 예시:
#   win + x64   -> win-x64
#   linux + arm64 -> linux-arm64
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

# 현재 실행 중인 운영체제를 publish 스크립트에서 사용하는 os_mode 값으로 변환합니다.
#
# 반환값:
#   win, linux, osx
function Resolve-CurrentOsMode {
    $onWindows = ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
    $onMacOS = ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))
    $onLinux = ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux))

    if ($onWindows) {
        return "win"
    }

    if ($onLinux) {
        return "linux"
    }

    if ($onMacOS) {
        return "osx"
    }

    throw "현재 실행 중인 OS를 확인할 수 없습니다."
}

# CLI 프로젝트를 build/publish 모드에 맞는 공통 옵션으로 실행합니다.
# handstack, edgeproxy, bundling 출력물 생성에 사용합니다.
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
    # 인수가 비어 있으면 현재 플랫폼 정보를 기반으로 기본 대상 OS/아키텍처를 계산합니다.
    if ([string]::IsNullOrWhiteSpace($OsMode)) {
        $OsMode = Resolve-CurrentOsMode
    }

    if ([string]::IsNullOrWhiteSpace($ArchMode)) {
        $ArchMode = Resolve-CurrentArchitecture
    }

    # 스크립트 단독 실행도 가능하도록 환경 변수가 없으면 기본값을 계산합니다.
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

    # dotnet build/publish용 공통 옵션을 계산합니다.
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

    # 이전 publish 결과를 삭제하고 새 출력 루트를 준비합니다.
    Remove-SafeItem -Path $PublishPath

    $handstackRoot = [System.IO.Path]::Combine($PublishPath, "handstack")

    # WebHost 프로젝트 출력물을 app/forbes 디렉터리로 생성합니다.
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

    # CLI 도구는 개별 디렉터리에 single-file 기준으로 출력합니다.
    Invoke-CliBuildOrPublish -ProjectPath ([System.IO.Path]::Combine("4.Tool", "CLI", "handstack", "handstack.csproj")) `
        -OutputPath ([System.IO.Path]::Combine($handstackRoot, "app", "cli", "handstack")) `
        -Action $ActionMode -Optimize $optimizeFlag -Configuration $ConfigurationMode -Os $OsMode -Arch $ArchMode -Rid $rid

    Invoke-CliBuildOrPublish -ProjectPath ([System.IO.Path]::Combine("4.Tool", "CLI", "edgeproxy", "edgeproxy.csproj")) `
        -OutputPath ([System.IO.Path]::Combine($handstackRoot, "app", "cli", "edgeproxy")) `
        -Action $ActionMode -Optimize $optimizeFlag -Configuration $ConfigurationMode -Os $OsMode -Arch $ArchMode -Rid $rid

    Invoke-CliBuildOrPublish -ProjectPath ([System.IO.Path]::Combine("4.Tool", "CLI", "bundling", "bundling.csproj")) `
        -OutputPath ([System.IO.Path]::Combine($handstackRoot, "app", "cli", "bundling")) `
        -Action $ActionMode -Optimize $optimizeFlag -Configuration $ConfigurationMode -Os $OsMode -Arch $ArchMode -Rid $rid

    # build 과정에서 생성된 contracts 디렉터리를 먼저 정리합니다.
    $contractsPath = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts")
    Remove-SafeItem -Path $contractsPath

    # 핵심 모듈 출력물을 publish 경로 하위 modules 디렉터리에 생성합니다.
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

    # 추가 리소스와 설치 보조 파일들을 publish 결과에 복사합니다.
    if (Test-Path -LiteralPath $contractsPath) {
        Copy-DirectoryContents -Source $contractsPath -Destination ([System.IO.Path]::Combine($handstackRoot, "contracts"))
    }

    Get-ChildItem -Path $scriptRoot -Filter "install.*" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination ([System.IO.Path]::Combine($handstackRoot, $_.Name)) -Force
    }

    Get-ChildItem -Path ([System.IO.Path]::Combine("2.Modules", "function")) -Filter "package*.*" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination ([System.IO.Path]::Combine($handstackRoot, $_.Name)) -Force
    }

    $wwwrootModuleDestination = [System.IO.Path]::Combine($handstackRoot, "modules", "wwwroot")
    Ensure-Directory -Path $wwwrootModuleDestination
    Get-ChildItem -Path ([System.IO.Path]::Combine("2.Modules", "wwwroot")) -Filter "package*.*" -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination ([System.IO.Path]::Combine($wwwrootModuleDestination, $_.Name)) -Force
    }

    # publish 결과에서 설치 후 재생성 가능한 프론트엔드 산출물과 불필요한 메타데이터를 정리합니다.
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

    # 빌드된 Infrastructure 어셈블리를 publish 결과물에 포함합니다.
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
    # 예외 내용만 사용자에게 표시하고 실패 코드로 종료합니다.
    Write-Error $_
    exit 1
}
finally {
    # 스크립트 실행 전 작업 디렉터리로 복원합니다.
    Pop-Location
}
