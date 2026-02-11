#!/usr/bin/env pwsh
#
# HandStack 개발 환경 변수 설정 스크립트
#
# 설명:
#   HandStack 프로젝트 개발에 필요한 환경 변수를 설정합니다.
#   현재 스크립트가 실행되는 디렉터리를 기준으로 소스 경로와 빌드 경로를
#   자동 계산하여 환경 변수로 등록합니다.
#
#   설정되는 환경 변수:
#     - DOTNET_CLI_TELEMETRY_OPTOUT : .NET CLI 원격 분석 비활성화
#     - HANDSTACK_SRC              : HandStack 소스 코드 루트 경로
#     - HANDSTACK_HOME             : HandStack 빌드 출력 경로 (부모/build/handstack)
#
# 플랫폼별 환경 변수 등록 방식:
#   - Windows : [Environment]::SetEnvironmentVariable (사용자 영구 등록)
#   - macOS   : ~/.zshrc 파일에 export 구문 추가
#   - Linux   : ~/.bashrc 파일에 export 구문 추가
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - 프로젝트 루트 디렉터리에서 실행
#
# 사용법:
#   ./env.ps1
#
# 주의사항:
#   - macOS/Linux에서는 셸 프로필 파일에 export 구문을 추가합니다.
#     이미 동일한 변수가 등록되어 있으면 기존 값을 업데이트합니다.
#   - 변경된 환경 변수를 현재 터미널에 즉시 반영하려면
#     macOS: source ~/.zshrc  |  Linux: source ~/.bashrc 를 실행하세요.


$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
$IsMacOS = $IsMacOS -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))
$IsLinux = $IsLinux -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux))

$currentPath = (Get-Location).Path
$parentDir = Split-Path -Parent $currentPath
$handstackHome = [System.IO.Path]::Combine($parentDir, "build", "handstack")


# 환경 변수를 현재 세션과 영구 저장소에 동시에 등록합니다.
#
# 플랫폼별 동작:
#   Windows - [Environment]::SetEnvironmentVariable로 사용자 수준에 영구 등록
#   macOS   - ~/.zshrc 파일에 export 구문 추가 (기존 값이 있으면 교체)
#   Linux   - ~/.bashrc 파일에 export 구문 추가 (기존 값이 있으면 교체)
#
# 매개변수:
#   Name  - 환경 변수 이름
#   Value - 환경 변수 값
#
# 사용 예시:
#   Set-PersistentEnv -Name "HANDSTACK_SRC" -Value "/home/user/handstack"
function Set-PersistentEnv {
    param(
        [string]$Name,
        [string]$Value
    )

    # 현재 PowerShell 세션에 즉시 반영
    [System.Environment]::SetEnvironmentVariable($Name, $Value, "Process")

    if ($IsWindows) {
        # Windows: 사용자 수준 환경 변수로 영구 등록 (레지스트리에 저장)
        [System.Environment]::SetEnvironmentVariable($Name, $Value, "User")
        Write-Host "  [Windows] 사용자 환경 변수 등록 완료: $Name"
    }
    else {
        # macOS/Linux: 셸 프로필 파일에 export 구문 추가
        if ($IsMacOS) {
            $profilePath = [System.IO.Path]::Combine($env:HOME, ".zshrc")
        }
        else {
            $profilePath = [System.IO.Path]::Combine($env:HOME, ".bashrc")
        }

        # export 구문 준비
        $exportLine = "export $Name=`"$Value`""

        # 프로필 파일이 없으면 새로 생성
        if (-not (Test-Path $profilePath)) {
            New-Item -ItemType File -Path $profilePath -Force | Out-Null
        }

        # 기존 프로필 내용 읽기
        $profileContent = Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue
        if ($null -eq $profileContent) { $profileContent = "" }

        # 동일 변수명의 기존 export 구문이 있으면 교체, 없으면 끝에 추가
        $pattern = "(?m)^export $Name=.*$"
        if ($profileContent -match $pattern) {
            # 기존 값을 새 값으로 교체
            $profileContent = $profileContent -replace $pattern, $exportLine
            Set-Content -Path $profilePath -Value $profileContent -NoNewline -Encoding UTF8
            Write-Host "  [$(if ($IsMacOS) {'macOS'} else {'Linux'})] 기존 환경 변수 업데이트: $profilePath"
        }
        else {
            # 프로필 끝에 새 export 구문 추가
            Add-Content -Path $profilePath -Value "`n$exportLine" -Encoding UTF8
            Write-Host "  [$(if ($IsMacOS) {'macOS'} else {'Linux'})] 환경 변수 추가: $profilePath"
        }
    }
}

# 환경 변수 설정
Write-Host "HandStack 개발 환경 변수 설정 시작"
Write-Host ""

# .NET CLI 원격 분석 비활성화
Write-Host "DOTNET_CLI_TELEMETRY_OPTOUT 설정 중..."
Set-PersistentEnv -Name "DOTNET_CLI_TELEMETRY_OPTOUT" -Value "1"

# HandStack 소스 코드 루트 경로
Write-Host "HANDSTACK_SRC 설정 중..."
Set-PersistentEnv -Name "HANDSTACK_SRC" -Value $currentPath

# HandStack 빌드 출력 경로
Write-Host "HANDSTACK_HOME 설정 중..."
Set-PersistentEnv -Name "HANDSTACK_HOME" -Value $handstackHome

# 설정 결과 출력
Write-Host ""
Write-Host "환경 변수 설정 결과"
Write-Host "  DOTNET_CLI_TELEMETRY_OPTOUT : 1"
Write-Host "  HANDSTACK_SRC              : $currentPath"
Write-Host "  HANDSTACK_HOME             : $handstackHome"
Write-Host "  플랫폼                      : $(if ($IsWindows) {'Windows'} elseif ($IsMacOS) {'macOS'} else {'Linux'})"

# macOS/Linux에서는 프로필 파일을 다시 로드해야 영구 설정이 적용됨을 안내
if (-not $IsWindows) {
    $shellProfile = if ($IsMacOS) { "~/.zshrc" } else { "~/.bashrc" }
    Write-Host ""
    Write-Host "현재 PowerShell 세션에는 즉시 반영되었습니다."
    Write-Host "다른 터미널에서 사용하려면 다음 명령을 실행하세요:"
    Write-Host "  source $shellProfile"
}

Write-Host ""
Write-Host "환경 변수 설정이 완료되었습니다."