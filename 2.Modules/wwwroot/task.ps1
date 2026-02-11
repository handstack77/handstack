#!/usr/bin/env pwsh
#
# wwwroot 모듈 빌드/배포 자동화 스크립트
#
# 설명:
#   다양한 작업을 하나의 스크립트로 통합 관리합니다.
#   Windows에서는 robocopy, macOS/Linux에서는 rsync를 자동 선택하여
#   동일한 명령으로 모든 운영체제에서 실행할 수 있습니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (빌드/배포 명령)
#   - pm2 (프로세스 관리 명령: start, stop, build)
#   - rsync (macOS/Linux 전용, macOS는 기본 내장, Ubuntu: sudo apt install rsync)
#   - 환경 변수: HANDSTACK_HOME, HANDSTACK_SRC (또는 HANDSTACK_PATH)
#
# 명령어 목록:
#   purge    - Contracts 디렉터리의 계약 파일을 정리(삭제)합니다.
#   run      - ack 구성을 적용한 뒤 ack 서버를 실행합니다.
#   app      - ack 서버의 시작 로그를 출력합니다.
#   copy     - Contracts와 view를 HANDSTACK_HOME으로 복사합니다.
#   www      - wwwroot를 HANDSTACK_HOME으로 복사합니다 (lib, syn.config.json 제외).
#   lib      - wwwroot 전체를 HANDSTACK_HOME으로 복사합니다 (lib 포함).
#   syn      - syn 관련 JS와 uicontrols를 HANDSTACK_HOME으로 동기화합니다.
#   devcert  - 개발용 HTTPS 인증서를 생성하고 신뢰 저장소에 등록합니다.
#   start    - pm2로 ack 프로세스를 시작합니다.
#   stop     - pm2로 ack 프로세스를 중지합니다.
#   build    - dotnet 클린 빌드 후 pm2로 ack 프로세스를 재시작합니다.
#   publish  - Release 모드로 최적화 빌드를 수행합니다.
#
# 사용법:
#   ./task.ps1 purge
#   ./task.ps1 run development
#   ./task.ps1 copy
#   ./task.ps1 www
#   ./task.ps1 lib
#   ./task.ps1 syn
#   ./task.ps1 devcert
#   ./task.ps1 start
#   ./task.ps1 stop
#   ./task.ps1 build
#   ./task.ps1 publish

param(
    [string]$TaskCommand = "",
    [string]$TaskSetting = "development",
    [string]$TaskArguments = ""
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 플랫폼 감지
$IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
$IsMacOS = $IsMacOS -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))
$IsLinux = $IsLinux -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux))

# 디렉터리 간 파일 동기화 (Windows: robocopy, macOS/Linux: rsync)
function Sync-Directory {
    param(
        [string]$Source,
        [string]$Destination,
        [switch]$Mirror,
        [switch]$Recurse,
        [string[]]$ExcludeDir,
        [string[]]$ExcludeFile,
        [int]$MaxDepth = 0
    )

    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    if ($IsWindows) {
        $robocopyArgs = @($Source, $Destination)

        if ($Mirror) { $robocopyArgs += "/MIR" }
        elseif ($Recurse) { $robocopyArgs += @("/e", "/copy:dat") }

        if ($MaxDepth -gt 0) {
            $robocopyArgs += "/LEV:$MaxDepth"
            $robocopyArgs += @("/R:0", "/W:0")
        }

        if ($ExcludeDir -and $ExcludeDir.Count -gt 0) {
            $robocopyArgs += "/XD"
            $robocopyArgs += $ExcludeDir
        }

        if ($ExcludeFile -and $ExcludeFile.Count -gt 0) {
            $robocopyArgs += "/XF"
            $robocopyArgs += $ExcludeFile
        }

        $robocopyArgs += @("/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP")

        & robocopy @robocopyArgs
        if ($LASTEXITCODE -gt 7) { Write-Error "robocopy 실행 실패 (종료 코드: $LASTEXITCODE)" }
        $global:LASTEXITCODE = 0
    }
    else {
        $srcTrail = $Source.TrimEnd('/') + "/"
        $dstTrail = $Destination.TrimEnd('/') + "/"
        $rsyncArgs = @("-a", "--human-readable")

        if ($Mirror) { $rsyncArgs += "--delete" }

        if ($ExcludeDir -and $ExcludeDir.Count -gt 0) {
            foreach ($ex in $ExcludeDir) {
                $dirName = Split-Path -Leaf $ex
                $rsyncArgs += "--exclude=$dirName/"
            }
        }

        if ($ExcludeFile -and $ExcludeFile.Count -gt 0) {
            foreach ($ex in $ExcludeFile) { $rsyncArgs += "--exclude=$ex" }
        }

        if ($MaxDepth -gt 0) { $rsyncArgs += "--exclude=*/" }

        & rsync @rsyncArgs $srcTrail $dstTrail
        if ($LASTEXITCODE -ne 0) { Write-Error "rsync 실행 실패 (종료 코드: $LASTEXITCODE)" }
    }
}

# 운영체제에 따라 실행 파일 이름에 확장자를 붙여 반환합니다.
function Get-ExeName {
    param([string]$BaseName)
    if ($IsWindows) { return "$BaseName.exe" }
    return $BaseName
}

# pm2에 등록된 프로세스가 존재하는지 확인합니다.
function Test-Pm2Process {
    param([string]$Name)
    try {
        $result = & pm2 id $Name 2>$null
        return ($result -and $result -ne "[]")
    }
    catch { return $false }
}

# 변수 초기화
$WorkingPath = (Get-Location).Path

# HandStack 소스 경로 결정 (우선순위: HANDSTACK_PATH > HANDSTACK_SRC > 기본 경로)
if ([string]::IsNullOrEmpty($env:HANDSTACK_PATH)) {
    if (-not [string]::IsNullOrEmpty($env:HANDSTACK_SRC)) {
        $HandstackPath = $env:HANDSTACK_SRC
    }
    else {
        $HandstackPath = [System.IO.Path]::Combine("C:", "projects", "handstack77", "handstack")
    }
}
else {
    $HandstackPath = $env:HANDSTACK_PATH
}

$AckExeName = Get-ExeName "ack"
$HandstackAck = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "app", $AckExeName)
$HandstackCli = [System.IO.Path]::Combine($HandstackPath, "4.Tool", "CLI", "handstack", "bin", "Debug", "net10.0", "handstack")

Write-Host "WORKING_PATH:  $WorkingPath"
Write-Host "HANDSTACK_PATH: $HandstackPath"
Write-Host "HANDSTACK_ACK: $HandstackAck"
Write-Host "HANDSTACK_CLI: $HandstackCli"
Write-Host "TASK_COMMAND:  $TaskCommand"
Write-Host "TASK_SETTING:  $TaskSetting"
Write-Host "PLATFORM:      $(if ($IsWindows) {'Windows'} elseif ($IsMacOS) {'macOS'} else {'Linux'})"

# purge - Contracts 디렉터리의 계약 파일을 정리합니다.
if ($TaskCommand -eq "purge") {
    $contractsDir = [System.IO.Path]::Combine($WorkingPath, "Contracts")
    & $HandstackCli purgecontracts --ack=$HandstackAck --directory=$contractsDir
}

# run - ack 구성을 적용한 뒤 ack 서버를 실행합니다.
if ($TaskCommand -eq "run") {
    $appSettings = [System.IO.Path]::Combine($WorkingPath, "Settings", "ack.$TaskSetting.json")
    & $HandstackCli configuration --ack=$HandstackAck --appsettings=$appSettings
    & $HandstackAck
}

# app - ack 서버의 시작 로그를 출력합니다.
if ($TaskCommand -eq "app") {
    $appSettings = [System.IO.Path]::Combine($WorkingPath, "Settings", "ack.$TaskSetting.json")
    & $HandstackCli startlog --ack=$HandstackAck --appsettings=$appSettings
}

# copy - Contracts와 view를 HANDSTACK_HOME으로 복사합니다.
#   Contracts → contracts, modules/wwwroot/Contracts
#   wwwroot/view → modules/wwwroot/wwwroot/view
if ($TaskCommand -eq "copy") {
    $contractsSrc = [System.IO.Path]::Combine($WorkingPath, "Contracts")
    $contractsDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts")
    $contractsModuleDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot", "Contracts")
    $viewSrc = [System.IO.Path]::Combine($WorkingPath, "wwwroot", "view")
    $viewDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot", "wwwroot", "view")

    Sync-Directory -Source $contractsSrc -Destination $contractsDst -Recurse
    Sync-Directory -Source $contractsSrc -Destination $contractsModuleDst -Recurse
    Sync-Directory -Source $viewSrc -Destination $viewDst -Recurse
}

# www - wwwroot를 HANDSTACK_HOME으로 복사합니다.
#   lib 디렉터리와 syn.config.json 파일은 제외합니다.
if ($TaskCommand -eq "www") {
    $wwwSrc = [System.IO.Path]::Combine($WorkingPath, "wwwroot")
    $wwwDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot", "wwwroot")
    $excludeLibDir = [System.IO.Path]::Combine($WorkingPath, "wwwroot", "lib")

    Sync-Directory -Source $wwwSrc -Destination $wwwDst -Recurse `
        -ExcludeDir @($excludeLibDir) `
        -ExcludeFile @("syn.config.json")
}

# lib - wwwroot 전체를 HANDSTACK_HOME으로 복사합니다 (lib 포함).
if ($TaskCommand -eq "lib") {
    $wwwSrc = [System.IO.Path]::Combine($WorkingPath, "wwwroot")
    $wwwDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot", "wwwroot")

    Sync-Directory -Source $wwwSrc -Destination $wwwDst -Recurse
}

# syn - syn 관련 JS와 uicontrols를 동기화합니다.
#   wwwroot/js → modules/wwwroot/wwwroot/js (최상위만, 도메인/로더 파일 제외)
#   wwwroot/uicontrols → modules/wwwroot/wwwroot/uicontrols (lib 제외)
if ($TaskCommand -eq "syn") {
    $jsSrc = [System.IO.Path]::Combine($WorkingPath, "wwwroot", "js")
    $jsDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot", "wwwroot", "js")

    Sync-Directory -Source $jsSrc -Destination $jsDst -MaxDepth 1 `
        -ExcludeFile @("syn.domain.js", "syn.domain.min.js", "syn.loader.js", "syn.loader.min.js")

    $uiSrc = [System.IO.Path]::Combine($WorkingPath, "wwwroot", "uicontrols")
    $uiDst = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot", "wwwroot", "uicontrols")
    $excludeLibDir = [System.IO.Path]::Combine($WorkingPath, "wwwroot", "lib")

    Sync-Directory -Source $uiSrc -Destination $uiDst -Recurse -ExcludeDir @($excludeLibDir)
}

# devcert - 개발용 HTTPS 인증서를 생성하고 신뢰 저장소에 등록합니다.
#   Linux에서는 자동 신뢰 등록이 지원되지 않으므로 수동 안내를 출력합니다.
if ($TaskCommand -eq "devcert") {
    $pfxPath = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "ack.pfx")
    dotnet dev-certs https -ep $pfxPath -p 1234

    if ($IsLinux) {
        Write-Warning "Linux에서는 'dotnet dev-certs https --trust'가 자동 지원되지 않습니다."
        Write-Host "다음 명령으로 수동 등록하세요:"
        Write-Host "  sudo cp $pfxPath /usr/local/share/ca-certificates/"
        Write-Host "  sudo update-ca-certificates"
    }
    else {
        dotnet dev-certs https --trust
    }
}

# start - pm2로 ack 프로세스를 시작합니다.
if ($TaskCommand -eq "start") {
    pm2 start $HandstackAck --name ack --no-autorestart
}

# stop - pm2로 ack 프로세스를 중지합니다.
if ($TaskCommand -eq "stop") {
    pm2 stop ack
}

# build - dotnet 클린 빌드 후 pm2로 ack 프로세스를 재시작합니다.
if ($TaskCommand -eq "build") {
    if (Test-Pm2Process "ack") {
        pm2 stop ack
    }

    dotnet clean
    dotnet build --no-restore --no-incremental

    if ($LASTEXITCODE -ne 0) {
        Write-Error "빌드 실패"
        exit 1
    }

    pm2 start $HandstackAck --name ack --no-autorestart
}

# publish - Release 모드로 최적화 빌드를 수행합니다.
if ($TaskCommand -eq "publish") {
    dotnet build -p:Optimize=true --configuration Release

    if ($LASTEXITCODE -ne 0) {
        Write-Error "빌드 실패"
        exit 1
    }
}