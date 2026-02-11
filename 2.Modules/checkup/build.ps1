#!/usr/bin/env pwsh
#
# checkup 모듈 빌드 후 배포 스크립트
#
# 설명:
#   checkup 트랜잭션 처리 모듈을 MSBuild로 빌드한 뒤,
#   빌드 출력물을 HANDSTACK_HOME/modules/checkup로 미러 복사합니다.
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

# 경로 설정
$checkupCsproj = [System.IO.Path]::Combine($env:HANDSTACK_SRC, "2.Modules", "checkup", "checkup.csproj")
$buildOutput = [System.IO.Path]::Combine("bin", "Debug", "net10.0")
$deployTarget = [System.IO.Path]::Combine($env:HANDSTACK_HOME, "modules", "checkup")

# (선택) 실행 중인 서버를 중지한 뒤 빌드하려면 아래 주석을 해제하세요.
# pm2 stop ack

# checkup 모듈 MSBuild 빌드
Write-Host "checkup 모듈 빌드 중: $checkupCsproj"
dotnet msbuild $checkupCsproj
if ($LASTEXITCODE -ne 0) {
    Write-Error "checkup 모듈 빌드 실패"
    exit 1
}

# 빌드 출력물을 modules/checkup로 미러 복사
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

# (선택) 빌드 후 서버를 자동 재시작하려면 아래 주석을 해제하세요.
# pm2 restart ack

Write-Host "빌드 완료"