#!/usr/bin/env pwsh
#
# wwwroot 모듈 빌드 후 배포 스크립트
#
# 설명:
#   wwwroot 모듈 프로젝트를 MSBuild로 빌드한 뒤,
#   빌드 출력물과 관련 리소스를 HANDSTACK_HOME의 해당 위치로 배포합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (dotnet msbuild)
#   - 환경 변수: HANDSTACK_SRC, HANDSTACK_HOME
#   - rsync (macOS/Linux 전용)
#   - pm2 (프로세스 관리 사용 시)
#
# 사용법:
#   ./build.ps1

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))

# ─────────────────────────────────────────────
# Sync-Directory 디렉터리 간 파일 동기화를 수행하는 크로스 플랫폼 함수. Windows에서는 robocopy, macOS/Linux에서는 rsync를 사용합니다.
#
# 매개변수:
#   Source      - 원본 디렉터리 경로
#   Destination - 대상 디렉터리 경로
#   Mirror      - [스위치] 미러 모드 (대상에만 있는 파일도 삭제하여 완전 동기화)
#   Recurse     - [스위치] 하위 디렉터리 포함 재귀 복사
function Sync-Directory {
    param(
        [string]$Source,
        [string]$Destination,
        [switch]$Mirror,
        [switch]$Recurse
    )

    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    if ($IsWindows) {
        $robocopyArgs = @($Source, $Destination)

        if ($Mirror) { $robocopyArgs += "/MIR" }
        elseif ($Recurse) { $robocopyArgs += @("/e", "/copy:dat") }

        $robocopyArgs += @("/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP")

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

        & rsync @rsyncArgs $srcTrail $dstTrail
        if ($LASTEXITCODE -ne 0) {
            Write-Error "rsync 실행 실패 (종료 코드: $LASTEXITCODE)"
        }
    }
}

# 경로 설정
$wwwrootCsproj = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "2.Modules", "wwwroot", "wwwroot.csproj")
$buildOutput = [System.IO.Path]::Combine("bin", "Debug", "net10.0")
$moduleTarget = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "wwwroot")
$contractsSource = "Contracts"
$contractsTarget = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts")
$viewSource = [System.IO.Path]::Combine("wwwroot", "view")
$viewTarget = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "contracts", "wwwroot")

# (선택) 실행 중인 서버를 중지한 뒤 빌드하려면 아래 주석을 해제하세요.
# pm2 stop ack

# wwwroot 모듈 MSBuild 빌드
Write-Host "wwwroot 모듈 빌드 중: $wwwrootCsproj"
dotnet msbuild $wwwrootCsproj
if ($LASTEXITCODE -ne 0) {
    Write-Error "wwwroot 모듈 빌드 실패"
    exit 1
}

# 빌드 출력물을 modules/wwwroot로 미러 복사
Write-Host "빌드 결과 배포 중: $buildOutput → $moduleTarget"
Sync-Directory -Source $buildOutput -Destination $moduleTarget -Mirror

# Contracts 디렉터리를 contracts로 재귀 복사
Write-Host "Contracts 복사 중: $contractsSource → $contractsTarget"
Sync-Directory -Source $contractsSource -Destination $contractsTarget -Recurse

# wwwroot/view를 contracts/wwwroot로 재귀 복사
Write-Host "view 복사 중: $viewSource → $viewTarget"
Sync-Directory -Source $viewSource -Destination $viewTarget -Recurse

# (선택) 빌드 후 서버를 자동 재시작하려면 아래 주석을 해제하세요.
# pm2 restart ack

Write-Host "빌드 완료"