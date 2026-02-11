#!/usr/bin/env pwsh
#
# forbes 프로젝트 빌드 후 배포 스크립트
#
# 설명:
#   forbes 웹 호스트 프로젝트를 MSBuild로 빌드한 뒤,
#   빌드 출력물의 wwwroot 디렉터리를 HANDSTACK_HOME/forbes로 미러 복사합니다.
#   현재 모든 동작이 주석 처리되어 있으며,
#   필요한 단계의 주석을 해제하여 사용할 수 있습니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (dotnet msbuild)
#   - 환경 변수: HANDSTACK_HOME
#   - rsync (macOS/Linux 전용)
#   - pm2 (프로세스 관리 사용 시)
#
# 사용법:
#   ./build.ps1

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))

$forbesCsproj = "forbes.csproj"
$buildOutput = [System.IO.Path]::Combine("bin", "Debug", "net10.0", "wwwroot")
$deployTarget = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "forbes")

# forbes 프로젝트 MSBuild 빌드
Write-Host "forbes 프로젝트 빌드 중: $forbesCsproj"
dotnet msbuild $forbesCsproj
if ($LASTEXITCODE -ne 0) {
    Write-Error "forbes 빌드 실패"
    exit 1
}

# 빌드 출력 wwwroot 디렉터리만 HANDSTACK_HOME/forbes로 복사합니다.
Write-Host "빌드 결과 배포 중: $buildOutput → $deployTarget"

if (-not (Test-Path $deployTarget)) {
    New-Item -ItemType Directory -Path $deployTarget -Force | Out-Null
}

if ($IsWindows) {
    & robocopy $buildOutput $deployTarget /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
    if ($LASTEXITCODE -gt 7) {
        Write-Error "robocopy 실행 실패 (종료 코드: $LASTEXITCODE)"
        exit 1
    }
    $global:LASTEXITCODE = 0
}
else {
    $srcTrail = $buildOutput.TrimEnd('/') + "/"
    $dstTrail = $deployTarget.TrimEnd('/') + "/"
    & rsync -a --delete $srcTrail $dstTrail
    if ($LASTEXITCODE -ne 0) {
        Write-Error "rsync 실행 실패 (종료 코드: $LASTEXITCODE)"
        exit 1
    }
}

Write-Host "빌드 완료"
