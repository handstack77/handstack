#!/usr/bin/env pwsh
#
# ack 프로젝트 빌드 후 배포 스크립트
#
# 설명:
#   ack 웹 호스트 프로젝트를 MSBuild로 빌드한 뒤,
#   빌드 출력물을 HANDSTACK_HOME/app 디렉터리로 미러 복사합니다.
#   pm2로 관리되는 ack 프로세스를 중지/재시작하는 코드는
#   주석으로 포함되어 있으며, 필요 시 주석을 해제하여 사용할 수 있습니다.
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

$ackCsproj = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "1.WebHost", "ack", "ack.csproj")
$buildOutput = [System.IO.Path]::Combine("bin", "Debug", "net10.0")
$deployTarget = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "app")

# (선택) pm2 ack 프로세스 중지. 실행 중인 서버를 중지한 뒤 빌드하려면 아래 주석을 해제하세요.
# pm2 stop ack

# ack 프로젝트 MSBuild 빌드
Write-Host "ack 프로젝트 빌드 중: $ackCsproj"
dotnet msbuild $ackCsproj
if ($LASTEXITCODE -ne 0) {
    Write-Error "ack 빌드 실패"
    exit 1
}

# 빌드 출력물을 배포 디렉터리로 미러 복사
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

# (선택) pm2 ack 프로세스 재시작. 빌드 후 서버를 자동 재시작하려면 아래 주석을 해제하세요.
# pm2 restart ack