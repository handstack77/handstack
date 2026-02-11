#!/usr/bin/env pwsh
#
# HandStack 배포 스크립트
#
# 설명:
#   HandStack 솔루션의 WebHost, CLI 도구, 모듈 프로젝트를 빌드하거나
#   배포(publish)하여 지정된 경로에 실행 가능한 구조로 출력합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK 10.0 (dotnet CLI)
#   - 환경 변수: HANDSTACK_SRC, HANDSTACK_HOME
#   - rsync (macOS/Linux 전용)
#
# 매개변수:
#   OsMode            - 대상 운영체제: win, linux, osx (기본값: 현재 OS 자동 감지)
#   ActionMode        - dotnet 액션: build 또는 publish (기본값: build)
#   ConfigurationMode - 빌드 구성: Debug 또는 Release (기본값: Release)
#   ArchMode          - 대상 아키텍처: x64, x86, arm64 (기본값: x64)
#   PublishPath       - 출력 디렉터리 경로 (기본값: HANDSTACK_SRC/../publish/{os}-{arch})
#
# 사용법:
#   ./publish.ps1                                           # 현재 OS, build, Release, x64
#   ./publish.ps1 win build Debug x64                       # Windows, Debug 빌드
#   ./publish.ps1 linux build Debug x64                     # Linux, Debug 빌드
#   ./publish.ps1 osx build Debug arm64                     # macOS Apple Silicon, Debug 빌드
#   ./publish.ps1 win publish Release x64                   # Windows, Release 배포
#   ./publish.ps1 win build Debug x64 "../custom-path"      # 사용자 지정 출력 경로


param(
    [string]$OsMode = "",                   # 대상 OS (win, linux, osx / 미지정 시 자동 감지)
    [string]$ActionMode = "build",          # dotnet 액션 (build, publish)
    [string]$ConfigurationMode = "Release", # 빌드 구성 (Debug, Release)
    [string]$ArchMode = "x64",              # 대상 아키텍처 (x64, x86, arm64)
    [string]$PublishPath = ""               # 출력 경로 (미지정 시 자동 계산)
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
$IsMacOS = $IsMacOS -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))
$IsLinux = $IsLinux -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux))

# OsMode가 지정되지 않은 경우 현재 OS 기반으로 자동 설정
if ([string]::IsNullOrEmpty($OsMode)) {
    if ($IsWindows) { $OsMode = "win" }
    elseif ($IsMacOS) { $OsMode = "osx" }
    else { $OsMode = "linux" }
}

# Sync-Directory
# 디렉터리 간 파일 동기화를 수행하며, Windows에서는 robocopy, macOS/Linux에서는 rsync를 사용합니다.
#
# 매개변수:
#   Source         - 원본 디렉터리 경로
#   Destination    - 대상 디렉터리 경로
#   Mirror         - [스위치] 미러 모드 (대상에만 있는 파일 삭제)
#   Recurse        - [스위치] 하위 디렉터리 포함 재귀 복사
#   FileFilter     - 복사할 특정 파일명 배열 (예: @("index.html"))
#   MoveAfterCopy  - [스위치] 복사 후 원본에서 이동 (robocopy /MOVE 동작)
# ─────────────────────────────────────────────
function Sync-Directory {
    param(
        [string]$Source,
        [string]$Destination,
        [switch]$Mirror,
        [switch]$Recurse,
        [string[]]$FileFilter,
        [switch]$MoveAfterCopy
    )

    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    if ($IsWindows) {
        $robocopyArgs = @($Source, $Destination)

        if ($FileFilter -and $FileFilter.Count -gt 0) {
            $robocopyArgs += $FileFilter
        }

        if ($Mirror) { $robocopyArgs += "/MIR" }
        elseif ($Recurse -or (-not $FileFilter)) { $robocopyArgs += @("/s", "/e") }

        if ($MoveAfterCopy) { $robocopyArgs += @("/E", "/MOVE") }

        $robocopyArgs += @("/copy:dat", "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP")

        & robocopy @robocopyArgs
        if ($LASTEXITCODE -gt 7) {
            Write-Error "robocopy 실행 실패 (종료 코드: $LASTEXITCODE)"
        }
        $global:LASTEXITCODE = 0
    }
    else {
        $srcTrail = $Source.TrimEnd('/') + "/"
        $dstTrail = $Destination.TrimEnd('/') + "/"
        $rsyncArgs = @("-a", "--human-readable")

        if ($Mirror) { $rsyncArgs += "--delete" }

        if ($MoveAfterCopy) { $rsyncArgs += "--remove-source-files" }

        if ($FileFilter -and $FileFilter.Count -gt 0) {
            foreach ($f in $FileFilter) {
                $rsyncArgs += "--include=$f"
            }
            $rsyncArgs += "--exclude=*"
        }

        & rsync @rsyncArgs $srcTrail $dstTrail

        # rsync --remove-source-files는 파일만 삭제하므로 빈 디렉터리를 수동 정리
        if ($MoveAfterCopy -and (Test-Path $Source)) {
            Get-ChildItem -Path $Source -Directory -Recurse |
                Sort-Object { $_.FullName.Length } -Descending |
                Where-Object { (Get-ChildItem $_.FullName -Force).Count -eq 0 } |
                ForEach-Object { Remove-Item $_.FullName -Force }
        }

        if ($LASTEXITCODE -ne 0) {
            Write-Error "rsync 실행 실패 (종료 코드: $LASTEXITCODE)"
        }
    }
}

# 파일 또는 디렉터리를 안전하게 삭제합니다.
#
# 매개변수:
#   Path - 삭제할 파일 또는 디렉터리 경로
#
# 사용 예시:
#   Remove-SafeItem -Path "/tmp/build/output"
#   Remove-SafeItem -Path "/tmp/build/file.js"
function Remove-SafeItem {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 배포 출력 경로 결정 (미지정 시 HANDSTACK_SRC 기준으로 자동 계산)
if ([string]::IsNullOrEmpty($PublishPath)) {
    $PublishPath = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "..", "publish", "$OsMode-$ArchMode")
}
$PublishPath = [System.IO.Path]::GetFullPath($PublishPath)

# 빌드 구성에 따른 최적화 플래그 결정
$optimizeFlag = if ($ConfigurationMode -eq "Debug") { "false" } else { "true" }

# OS와 아키텍처 조합으로 .NET 런타임 대상을 지정합니다.
$rid = "$OsMode-$ArchMode"

# dotnet 명령어 공통/개별 옵션 구성
if ($ActionMode -eq "publish") {
    $dotnetOptions = @(
        "-p:Optimize=$optimizeFlag",
        "--configuration", $ConfigurationMode,
        "--arch", $ArchMode,
        "--os", $OsMode,
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

# 모듈 빌드용 옵션 (모듈은 OS/아키텍처 독립적으로 빌드)
$moduleBuildOptions = @(
    "-p:Optimize=$optimizeFlag",
    "--configuration", $ConfigurationMode
)

# 주요 경로 변수
$handstackOutput = [System.IO.Path]::Combine($PublishPath, "handstack")
$forbesPath = [System.IO.Path]::Combine($handstackOutput, "forbes")
$wwwrootJsPath = [System.IO.Path]::Combine($handstackOutput, "modules", "wwwroot", "wwwroot")

# 빌드 설정 정보 출력
Write-Host "빌드/배포 설정"
Write-Host "  OS:            $OsMode"
Write-Host "  액션:          $ActionMode"
Write-Host "  빌드 구성:     $ConfigurationMode"
Write-Host "  아키텍처:      $ArchMode"
Write-Host "  최적화:        $optimizeFlag"
Write-Host "  RID:           $rid"
Write-Host "  출력 경로:     $PublishPath"
Write-Host "  플랫폼:        $(if ($IsWindows) {'Windows'} elseif ($IsMacOS) {'macOS'} else {'Linux'})"

# 기존 배포 디렉터리 삭제
Write-Host ""
Write-Host "기존 배포 디렉터리 삭제 중: $PublishPath"
Remove-SafeItem -Path $PublishPath

# WebHost 프로젝트 빌드/배포
Write-Host ""
Write-Host "WebHost 프로젝트 빌드/배포 시작..."

# ack - 메인 웹 호스트 애플리케이션
$ackCsproj = [System.IO.Path]::Combine("1.WebHost", "ack", "ack.csproj")
$ackOutput = [System.IO.Path]::Combine($handstackOutput, "app")
Write-Host "  ▶ ack 빌드 중..."
& dotnet $ActionMode @dotnetOptions $ackCsproj --output $ackOutput
if ($LASTEXITCODE -ne 0) {
    Write-Error "ack 빌드 실패"
    exit 1
}

# forbes - 보조 웹 호스트 애플리케이션
$forbesCsproj = [System.IO.Path]::Combine("1.WebHost", "forbes", "forbes.csproj")
Write-Host "  ▶ forbes 빌드 중..."
& dotnet $ActionMode @dotnetOptions $forbesCsproj --output $forbesPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "forbes 빌드 실패"
    exit 1
}

# handstack CLI와 edgeproxy CLI를 빌드합니다.
Write-Host ""
Write-Host "CLI 도구 빌드/배포 시작..."

$cliOutput = [System.IO.Path]::Combine($handstackOutput, "app", "cli")

# handstack CLI - 메인 CLI 도구
$handstackCsproj = [System.IO.Path]::Combine("4.Tool", "CLI", "handstack", "handstack.csproj")
Write-Host "  ▶ handstack CLI 빌드 중..."
& dotnet $ActionMode @dotnetOptions $handstackCsproj --output $cliOutput
if ($LASTEXITCODE -ne 0) {
    Write-Error "handstack CLI 빌드 실패"
    exit 1
}

# edgeproxy CLI - 엣지 프록시 도구
$edgeproxyCsproj = [System.IO.Path]::Combine("4.Tool", "CLI", "edgeproxy", "edgeproxy.csproj")
Write-Host "  ▶ edgeproxy CLI 빌드 중..."
if ($ActionMode -eq "publish") {
    $edgeproxyOptions = @(
        "-p:Optimize=$optimizeFlag",
        "--configuration", $ConfigurationMode,
        "--runtime", $rid,
        "--self-contained", "false"
    )
}
else {
    $edgeproxyOptions = @(
        "-p:Optimize=$optimizeFlag",
        "--configuration", $ConfigurationMode,
        "--arch", $ArchMode,
        "--os", $OsMode
    )
}
& dotnet $ActionMode @edgeproxyOptions $edgeproxyCsproj --output $cliOutput
if ($LASTEXITCODE -ne 0) {
    Write-Error "edgeproxy CLI 빌드 실패"
    exit 1
}

# Forbes 출력 디렉터리 정리
Write-Host ""
Write-Host "Forbes 출력 디렉터리 정리 중..."

$forbesWwwroot = [System.IO.Path]::Combine($forbesPath, "wwwroot")
if (Test-Path $forbesWwwroot) {
    # wwwroot 내부의 모든 파일과 폴더를 forbes 루트로 이동
    Sync-Directory -Source $forbesWwwroot -Destination $forbesPath -MoveAfterCopy -Recurse

    # 이동 후 빈 wwwroot 디렉터리 삭제
    Remove-SafeItem -Path $forbesWwwroot
}

# forbes 루트에 남은 파일들(DLL, PDB, 설정 파일 등) 삭제
Get-ChildItem -Path $forbesPath -File -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
}

# HANDSTACK_HOME의 contracts 폴더 정리

Write-Host ""
Write-Host "contracts 폴더 정리 중..."
$contractsPath = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts")
Remove-SafeItem -Path $contractsPath

# 모듈 프로젝트 빌드. 각 모듈을 빌드하여 handstack/modules 하위 디렉터리에 출력합니다. 모듈은 OS/아키텍처에 독립적이므로 공통 빌드 옵션을 사용합니다.

Write-Host ""
Write-Host "모듈 프로젝트 빌드 시작..."

# 빌드 대상 모듈 목록 (이름, 프로젝트 경로, 출력 디렉터리)
$modules = @(
    @{ Label = "dbclient"; Csproj = [System.IO.Path]::Combine("2.Modules", "dbclient", "dbclient.csproj") }
    @{ Label = "function"; Csproj = [System.IO.Path]::Combine("2.Modules", "function", "function.csproj") }
    @{ Label = "logger"; Csproj = [System.IO.Path]::Combine("2.Modules", "logger", "logger.csproj") }
    @{ Label = "repository"; Csproj = [System.IO.Path]::Combine("2.Modules", "repository", "repository.csproj") }
    @{ Label = "transact"; Csproj = [System.IO.Path]::Combine("2.Modules", "transact", "transact.csproj") }
    @{ Label = "wwwroot"; Csproj = [System.IO.Path]::Combine("2.Modules", "wwwroot", "wwwroot.csproj") }
    @{ Label = "checkup"; Csproj = [System.IO.Path]::Combine("2.Modules", "checkup", "checkup.csproj") }
)

foreach ($module in $modules) {
    $moduleOutput = [System.IO.Path]::Combine($handstackOutput, "modules", $module.Label)
    Write-Host "  ▶ $($module.Label) 빌드 중..."
    & dotnet build @moduleBuildOptions $module.Csproj --output $moduleOutput
    if ($LASTEXITCODE -ne 0) {
        Write-Error "$($module.Label) 모듈 빌드 실패"
        exit 1
    }
}

# contracts, install 스크립트, package.json 파일을 배포 경로로 복사합니다.
Write-Host ""
Write-Host "추가 파일 복사 중..."

# contracts 폴더 복사 (존재하는 경우에만)
$homeContracts = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts")
$outputContracts = [System.IO.Path]::Combine($handstackOutput, "contracts")
if (Test-Path $homeContracts) {
    Sync-Directory -Source $homeContracts -Destination $outputContracts -Recurse
}
Write-Host "  contracts 복사 완료"


# install.* 파일 복사 (install.ps1, install.bat 등)
$installFiles = Get-ChildItem -Path "." -Filter "install.*" -File -ErrorAction SilentlyContinue
foreach ($file in $installFiles) {
    $destFile = [System.IO.Path]::Combine($handstackOutput, $file.Name)
    Copy-Item -Path $file.FullName -Destination $destFile -Force
}
Write-Host "  install 파일 복사 완료"

# package*.* 파일 복사 (package.json, package-lock.json)
$functionDir = [System.IO.Path]::Combine("2.Modules", "function")
$packageFiles = Get-ChildItem -Path $functionDir -Filter "package*.*" -File -ErrorAction SilentlyContinue
foreach ($file in $packageFiles) {
    $destFile = [System.IO.Path]::Combine($handstackOutput, $file.Name)
    Copy-Item -Path $file.FullName -Destination $destFile -Force
}
Write-Host "  package 파일 복사 완료"

# 빌드 과정에서 생성된 불필요한 파일들을 삭제합니다:
#   - wwwroot/lib 디렉터리 전체 (npm install로 재설치 대상)
#   - syn.bundle, syn.controls, syn.scripts 번들 파일 (gulp로 재생성 대상)
#   - *.staticwebassets.endpoints.json, *.staticwebassets.runtime.json 메타 파일
Write-Host ""
Write-Host "wwwroot 정리 중..."

# wwwroot/lib 디렉터리 삭제
$wwwrootLibPath = [System.IO.Path]::Combine($wwwrootJsPath, "lib")
Remove-SafeItem -Path $wwwrootLibPath

# 불필요한 번들 JS 파일 목록 삭제
$bundleFilesToDelete = @(
    "syn.bundle.js",
    "syn.bundle.min.js",
    "syn.controls.js",
    "syn.controls.min.js",
    "syn.scripts.base.js",
    "syn.scripts.base.min.js",
    "syn.scripts.js",
    "syn.scripts.min.js"
)

$jsPath = [System.IO.Path]::Combine($wwwrootJsPath, "js")
foreach ($file in $bundleFilesToDelete) {
    $filePath = [System.IO.Path]::Combine($jsPath, $file)
    Remove-SafeItem -Path $filePath
}
Write-Host "  ✔ 번들 파일 정리 완료"

# 정적 자산 메타데이터 파일 재귀 삭제
# .NET 빌드 시 자동 생성되는 정적 웹 자산 메타 파일을 모두 제거합니다.
$staticAssetPatterns = @(
    "*.staticwebassets.endpoints.json",
    "*.staticwebassets.runtime.json"
)

foreach ($pattern in $staticAssetPatterns) {
    Get-ChildItem -Path $handstackOutput -Filter $pattern -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  ✔ 정적 자산 메타 파일 정리 완료"

# 빌드된 Infrastructure 어셈블리를 배포 경로의 assemblies 디렉터리로 미러 복사합니다.
Write-Host ""
Write-Host "Infrastructure Assemblies 미러 복사 중..."

$assembliesSource = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "3.Infrastructure", "Assemblies")
$assembliesDest = [System.IO.Path]::Combine($handstackOutput, "assemblies")

if (Test-Path $assembliesSource) {
    Sync-Directory -Source $assembliesSource -Destination $assembliesDest -Mirror
}
else {
    Write-Warning "Assemblies 소스 경로를 찾을 수 없습니다: $assembliesSource"
}

Write-Host ""
Write-Host "빌드/배포가 성공적으로 완료되었습니다!"
Write-Host "  출력 디렉터리: $PublishPath"

# 참고: 소스 코드 아카이브 생성 (필요 시 주석 해제)
# $archivePath = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "..", "publish", "handstack-src.zip")
# git archive --format zip --output $archivePath master