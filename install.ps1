#!/usr/bin/env pwsh
#
# HandStack 개발/실행 환경 설치 스크립트
#
# 설명:
#   HandStack 프로젝트의 개발 환경 또는 실행 환경을 자동으로 설치합니다.
#   현재 디렉터리 내에 존재하는 파일을 기준으로 두 가지 모드로 동작합니다:
#
#   [개발 환경 모드] - 1.WebHost/ack/ack.csproj 파일이 존재하는 경우
#     소스 코드에서 빌드하여 개발 환경을 구성합니다.
#     1. 필수 프로그램 설치 확인 (node, gulp, curl, dotnet)
#     2. 환경 변수 설정 (HANDSTACK_SRC, HANDSTACK_HOME)
#     3. ack 프로젝트 npm 의존성 설치 및 gulp 번들링
#     4. 전체 솔루션 빌드 (build.ps1 호출)
#     5. HandStack CLI 도구 빌드 및 lib.zip 해제
#     6. libman 설치 및 클라이언트 라이브러리 복원
#     7. wwwroot 모듈 npm 의존성 설치 및 gulp 번들링
#     8. Function 모듈 node_modules 설치
#
#   [실행 환경 모드] - app/ack.exe(또는 app/ack) 파일이 존재하는 경우
#     빌드된 결과물을 기반으로 실행 환경을 구성합니다.
#     1. 필수 프로그램 설치 확인 (node, gulp, curl)
#     2. 환경 변수 설정
#     3. 루트 node_modules 설치
#     4. app/node_modules 설치
#     5. lib.zip 다운로드 및 해제
#     6. libman 설치 및 라이브러리 복원
#     7. modules/wwwroot 모듈 npm 의존성 설치 및 gulp 번들링
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - Node.js v20.12.2 LTS 이상
#   - gulp CLI (npm install -g gulp-cli)
#   - curl
#   - .NET SDK 10.0 (개발 환경 모드에서만 필요)
#   - rsync (macOS/Linux 전용, macOS는 기본 내장, Ubuntu: sudo apt install rsync)
#
# 사용법:
#   ./install.ps1

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$IsWindows = $IsWindows -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows))
$IsMacOS = $IsMacOS -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX))
$IsLinux = $IsLinux -or ([System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux))

# 지정된 명령어가 시스템 PATH에 존재하는지 확인합니다.
# Windows에서는 Get-Command, macOS/Linux에서도 동일하게 동작합니다.
#
# 매개변수:
#   CommandName - 확인할 명령어 이름 (예: "node", "dotnet")
#
# 반환값:
#   $true: 명령어 존재, $false: 명령어 없음
#
# 사용 예시:
#   if (Test-CommandExists "node") { Write-Host "Node.js 설치됨" }
function Test-CommandExists {
    param([string]$CommandName)
    $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# 필수 프로그램 미설치 시 안내 메시지를 출력하고, 설치 가이드 URL을 브라우저로 엽니다.
#
# 플랫폼별 브라우저 열기 방식:
#   Windows - Start-Process (기본 브라우저)
#   macOS   - open 명령어
#   Linux   - xdg-open 명령어
#
# 매개변수:
#   Message - 콘솔에 출력할 안내 메시지
#   Url     - 브라우저에서 열 설치 가이드 URL
#
# 사용 예시:
#   Open-InstallGuide -Message "Node.js를 설치하세요." -Url "https://handstack.kr/..."
function Open-InstallGuide {
    param(
        [string]$Message,
        [string]$Url
    )
    Write-Error $Message
    if ($IsWindows) {
        Start-Process $Url
    }
    elseif ($IsMacOS) {
        & open $Url
    }
    else {
        & xdg-open $Url 2>$null
    }
    exit 1
}

# 환경 변수를 현재 세션과 영구 저장소에 동시에 등록합니다.
#
# 플랫폼별 동작:
#   Windows - [Environment]::SetEnvironmentVariable로 사용자 수준에 영구 등록
#   macOS   - ~/.zshrc에 export 구문 추가/업데이트
#   Linux   - ~/.bashrc에 export 구문 추가/업데이트
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
        # 사용자 수준 환경 변수로 영구 등록 (레지스트리 저장)
        [System.Environment]::SetEnvironmentVariable($Name, $Value, "User")
    }
    else {
        # 셸 프로필 파일에 export 구문 추가/업데이트
        $profilePath = if ($IsMacOS) {
            [System.IO.Path]::Combine($env:HOME, ".zshrc")
        }
        else {
            [System.IO.Path]::Combine($env:HOME, ".bashrc")
        }

        $exportLine = "export $Name=`"$Value`""

        if (-not (Test-Path $profilePath)) {
            New-Item -ItemType File -Path $profilePath -Force | Out-Null
        }

        $profileContent = Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue
        if ($null -eq $profileContent) { $profileContent = "" }

        $pattern = "(?m)^export $Name=.*$"
        if ($profileContent -match $pattern) {
            $profileContent = $profileContent -replace $pattern, $exportLine
            Set-Content -Path $profilePath -Value $profileContent -NoNewline -Encoding UTF8
        }
        else {
            Add-Content -Path $profilePath -Value "`n$exportLine" -Encoding UTF8
        }
    }
}

# 디렉터리 간 파일 동기화를 수행하는 크로스 플랫폼 함수입니다. Windows에서는 robocopy, macOS/Linux에서는 rsync를 사용합니다.
#
# 매개변수:
#   Source         - 원본 디렉터리 경로
#   Destination    - 대상 디렉터리 경로
#   Mirror         - [스위치] 미러 모드 (대상에만 있는 파일 삭제)
#   FileFilter     - 복사할 특정 파일명 배열
#
# 사용 예시:
#   Sync-Directory -Source "/src/lib" -Destination "/dst/lib" -Mirror
#   Sync-Directory -Source "/src/js" -Destination "/dst/syn" -FileFilter @("index.js")
function Sync-Directory {
    param(
        [string]$Source,
        [string]$Destination,
        [switch]$Mirror,
        [string[]]$FileFilter
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

        $robocopyArgs += @("/copy:dat", "/NFL", "/NDL", "/NJH", "/NP")

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

        if ($FileFilter -and $FileFilter.Count -gt 0) {
            foreach ($f in $FileFilter) {
                $rsyncArgs += "--include=$f"
            }
            $rsyncArgs += "--exclude=*"
        }

        & rsync @rsyncArgs $srcTrail $dstTrail
        if ($LASTEXITCODE -ne 0) {
            Write-Error "rsync 실행 실패 (종료 코드: $LASTEXITCODE)"
        }
    }
}

# 현재 플랫폼에 맞는 ack 실행 파일명을 반환합니다.
#
# 반환값:
#   Windows: "ack.exe", macOS/Linux: "ack"
#
# 사용 예시:
#   $ackExe = Get-AckExecutable
# ─────────────────────────────────────────────
function Get-AckExecutable {
    if ($IsWindows) { return "ack.exe" }
    return "ack"
}

# 필수 프로그램 설치 확인하고, 누락된 프로그램이 있으면 설치 가이드를 브라우저로 열고 스크립트를 종료합니다.
Write-Host "필수 프로그램 설치 확인 중..."

# Node.js 설치 확인
if (-not (Test-CommandExists "node")) {
    Open-InstallGuide `
        -Message "Node.js v20.12.2 LTS 이상 버전을 설치해야 합니다." `
        -Url "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-nodejs-설치"
}

# gulp CLI 설치 확인
if (-not (Test-CommandExists "gulp")) {
    Open-InstallGuide `
        -Message "Node.js 기반 gulp CLI 도구를 설치해야 합니다." `
        -Url "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#gulp-설치하기"
}

# curl 설치 확인
if (-not (Test-CommandExists "curl")) {
    Open-InstallGuide `
        -Message "curl CLI를 설치해야 합니다." `
        -Url "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-curl-설치"
}

# 현재 디렉터리를 기준으로 소스 경로와 빌드 출력 경로를 계산하여 환경 변수로 등록합니다.
Write-Host ""
Write-Host "환경 변수 설정 중..."

$currentPath = (Get-Location).Path
$parentDir = Split-Path -Parent $currentPath
$handstackHome = [System.IO.Path]::Combine($parentDir, "build", "handstack")

# .NET CLI 원격 분석 비활성화
Set-PersistentEnv -Name "DOTNET_CLI_TELEMETRY_OPTOUT" -Value "1"

# HandStack 소스 루트 경로
Set-PersistentEnv -Name "HANDSTACK_SRC" -Value $currentPath

# HandStack 빌드 출력 경로
Set-PersistentEnv -Name "HANDSTACK_HOME" -Value $handstackHome

# 편의를 위해 스크립트 내에서도 환경 변수로 접근 가능하도록 설정
$env:HANDSTACK_SRC = $currentPath
$env:HANDSTACK_HOME = $handstackHome

Write-Host "  HANDSTACK_SRC:  $currentPath"
Write-Host "  HANDSTACK_HOME: $handstackHome"

# 빌드 출력 디렉터리가 없으면 생성
if (-not (Test-Path $handstackHome)) {
    New-Item -ItemType Directory -Path $handstackHome -Force | Out-Null
    Write-Host "  빌드 출력 디렉터리 생성됨: $handstackHome"
}

# 개발 환경 설정. 1.WebHost/ack/ack.csproj가 존재하면 개발 환경으로 판단하고 소스 코드 빌드 및 개발 의존성을 설치합니다.
$ackCsprojPath = [System.IO.Path]::Combine($currentPath, "1.WebHost", "ack", "ack.csproj")

if (Test-Path $ackCsprojPath) {
    Write-Host ""
    Write-Host "개발 환경 설치 시작..."

    # .NET SDK 10.0 설치 확인
    if (-not (Test-CommandExists "dotnet")) {
        Open-InstallGuide `
            -Message ".NET Core 10.0 버전을 설치해야 합니다." `
            -Url "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치"
    }

    $dotnetVersion = dotnet --version
    if ($dotnetVersion -notmatch "^10\.") {
        Open-InstallGuide `
            -Message ".NET Core 10.0 버전을 설치해야 합니다. (현재: $dotnetVersion)" `
            -Url "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치"
    }

    # syn.js 번들링에 필요한 npm 패키지를 설치하고 gulp를 실행합니다. node_modules가 이미 존재하면 건너뜁니다.
    $ackNodeModules = [System.IO.Path]::Combine($currentPath, "1.WebHost", "ack", "node_modules")
    if (-not (Test-Path $ackNodeModules)) {
        $ackDir = [System.IO.Path]::Combine($currentPath, "1.WebHost", "ack")
        Write-Host ""
        Write-Host "syn.js 번들링 npm 패키지 설치 시작..."
        Push-Location $ackDir
        npm install
        gulp
        Pop-Location
    }

    # build.ps1 스크립트를 호출하여 모든 프로젝트를 빌드합니다.
    Write-Host ""
    Write-Host "전체 솔루션 빌드 시작..."
    Set-Location $currentPath

    $buildScript = [System.IO.Path]::Combine($currentPath, "build.ps1")
    if (Test-Path $buildScript) {
        & $buildScript
        if ($LASTEXITCODE -ne 0) {
            Write-Error "[install] 솔루션 빌드 실패"
            exit 1
        }
    }
    else {
        Write-Error "[install] build.ps1을 찾을 수 없습니다: $buildScript"
        exit 1
    }

    # wwwroot/lib 디렉터리가 없으면 CLI 도구를 빌드한 뒤 lib.zip 아카이브를 해제하여 클라이언트 라이브러리를 설치합니다.
    $wwwrootLib = [System.IO.Path]::Combine($currentPath, "2.Modules", "wwwroot", "wwwroot", "lib")
    if (-not (Test-Path $wwwrootLib)) {
        Set-Location $currentPath
        Write-Host ""
        Write-Host "HandStack CLI 도구 빌드 중..."

        $cliCsproj = [System.IO.Path]::Combine($currentPath, "4.Tool", "CLI", "handstack", "handstack.csproj")

        # 플랫폼에 맞는 dotnet publish 옵션 결정
        if ($IsWindows) { $osTarget = "win" }
        elseif ($IsMacOS) { $osTarget = "osx" }
        else { $osTarget = "linux" }

        $cliOutputDir = [System.IO.Path]::Combine($parentDir, "publish", "$osTarget-x64", "app", "cli")
        dotnet publish $cliCsproj --configuration Debug --arch x64 --os $osTarget --output $cliOutputDir

        if ($LASTEXITCODE -ne 0) {
            Write-Error "[install] HandStack CLI 빌드 실패"
            exit 1
        }

        # lib.zip 해제
        $handstackCliExe = [System.IO.Path]::Combine($cliOutputDir, "handstack")
        $libZipPath = [System.IO.Path]::Combine($currentPath, "lib.zip")

        Write-Host "lib.zip 파일 해제 중..."
        & $handstackCliExe extract --file=$libZipPath --directory=$wwwrootLib
    }
    else {
        Write-Host "  ✔ wwwroot/lib 이미 존재 (건너뜀)"
    }

    # .NET 전역 도구인 libman이 설치되어 있지 않으면 자동 설치합니다.
    Write-Host ""
    Write-Host "libman 도구 확인 중..."
    $wwwrootModuleDir = [System.IO.Path]::Combine($currentPath, "2.Modules", "wwwroot")
    Set-Location $wwwrootModuleDir

    if (-not (Test-CommandExists "libman")) {
        Write-Host "libman CLI 도구가 설치되어 있지 않습니다. 전역 도구로 설치합니다..."
        dotnet tool install --global Microsoft.Web.LibraryManager.Cli
    }

    # syn.bundle.js 모듈의 npm 패키지를 설치하고 gulp로 번들링합니다.
    $wwwrootNodeModules = [System.IO.Path]::Combine($currentPath, "2.Modules", "wwwroot", "node_modules")
    if (-not (Test-Path $wwwrootNodeModules)) {
        Write-Host ""
        Write-Host "syn.bundle.js 모듈 npm 패키지 설치 시작..."
        Set-Location $wwwrootModuleDir
        npm install

        # wwwroot/lib를 HANDSTACK_HOME/modules/wwwroot/wwwroot/lib로 미러 복사
        $libSource = [System.IO.Path]::Combine($wwwrootModuleDir, "wwwroot", "lib")
        $libDest = [System.IO.Path]::Combine($handstackHome, "modules", "wwwroot", "wwwroot", "lib")
        Sync-Directory -Source $libSource -Destination $libDest -Mirror

        Write-Host "syn.controls, syn.scripts, syn.bundle 번들링 시작..."
        gulp
    }

    # function 모듈의 package.json을 HANDSTACK_HOME에 복사하고, npm 의존성을 설치합니다. syn index.js도 복사합니다.
    Set-Location $currentPath

    # package*.* 파일을 HANDSTACK_HOME으로 복사
    $functionDir = [System.IO.Path]::Combine($currentPath, "2.Modules", "function")
    Sync-Directory -Source $functionDir -Destination $handstackHome -FileFilter @("package.json", "package-lock.json")

    $homeNodeModules = [System.IO.Path]::Combine($handstackHome, "node_modules")
    if (-not (Test-Path $homeNodeModules)) {
        Write-Host ""
        Write-Host "Function 모듈 npm 패키지 설치 시작..."
        Push-Location $handstackHome
        npm install

        # syn index.js 복사
        $synSource = [System.IO.Path]::Combine($currentPath, "1.WebHost", "ack", "wwwroot", "assets", "js")
        $synDest = [System.IO.Path]::Combine($handstackHome, "node_modules", "syn")
        Sync-Directory -Source $synSource -Destination $synDest -FileFilter @("index.js")
        Pop-Location
    }
    else {
        Write-Host "  ✔ Function 모듈 node_modules 이미 존재 (건너뜀)"
    }

    # syn index.js 최신 버전 복사 (node_modules 존재 여부와 무관하게 항상 수행)
    Set-Location $currentPath
    $synSource = [System.IO.Path]::Combine($currentPath, "1.WebHost", "ack", "wwwroot", "assets", "js")
    $synDest = [System.IO.Path]::Combine($handstackHome, "node_modules", "syn")
    Sync-Directory -Source $synSource -Destination $synDest -FileFilter @("index.js")

    # 개발 환경 설치 완료 안내
    Write-Host ""
    Write-Host "HandStack 개발 환경 설치가 완료되었습니다."
    Write-Host "  Visual Studio 개발 도구로 handstack.sln을 실행하세요."
    Write-Host "  자세한 정보: https://handstack.kr"
}

# 실행 환경 설정 app/ack.exe(또는 app/ack)가 존재하면 실행 환경으로 판단하고 빌드된 결과물 기반의 의존성을 설치합니다.
$ackExeName = Get-AckExecutable
$ackExePath = [System.IO.Path]::Combine($currentPath, "app", $ackExeName)

if (Test-Path $ackExePath) {
    Write-Host ""
    Write-Host "ack 실행 환경 설치 확인 중..."

    # function 모듈에서 사용하는 npm 의존성을 설치합니다.
    $rootNodeModules = [System.IO.Path]::Combine($currentPath, "node_modules")
    if (-not (Test-Path $rootNodeModules)) {
        Write-Host ""
        Write-Host "function 모듈 npm 패키지 설치 시작..."
        npm install

        # syn index.js 복사
        $synSource = [System.IO.Path]::Combine($currentPath, "app", "wwwroot", "assets", "js")
        $synDest = [System.IO.Path]::Combine($currentPath, "node_modules", "syn")
        Sync-Directory -Source $synSource -Destination $synDest -FileFilter @("index.js")
    }

    # syn.js 번들링에 필요한 npm 의존성을 설치합니다.
    $appNodeModules = [System.IO.Path]::Combine($currentPath, "app", "node_modules")
    if (-not (Test-Path $appNodeModules)) {
        $appDir = [System.IO.Path]::Combine($currentPath, "app")
        Write-Host ""
        Write-Host "syn.js 번들링 모듈 npm 패키지 설치 시작..."
        Push-Location $appDir
        npm install
        Pop-Location
    }

    # 클라이언트 라이브러리가 없으면 GitHub에서 lib.zip을 다운로드하고 HandStack CLI의 extract 명령으로 해제합니다.
    $modulesWwwrootLib = [System.IO.Path]::Combine($currentPath, "modules", "wwwroot", "wwwroot", "lib")
    if (-not (Test-Path $modulesWwwrootLib)) {
        $modulesWwwrootDir = [System.IO.Path]::Combine($currentPath, "modules", "wwwroot", "wwwroot")
        Write-Host ""
        Write-Host "클라이언트 라이브러리 설치 시작..."
        Push-Location $modulesWwwrootDir

        $libZipPath = [System.IO.Path]::Combine($modulesWwwrootDir, "lib.zip")
        if (-not (Test-Path $libZipPath)) {
            Write-Host "lib.zip 파일 다운로드 중..."
            curl -L -O https://github.com/handstack77/handstack/raw/master/lib.zip
        }

        $handstackCliExe = [System.IO.Path]::Combine($currentPath, "app", "cli", "handstack")
        Write-Host "lib.zip 파일 해제 중..."
        & $handstackCliExe extract --file=$libZipPath --directory=$modulesWwwrootLib
        Pop-Location
    }

    # libman 설치 확인 및 자동 설치
    Write-Host ""
    Write-Host "libman 도구 확인 중..."
    $modulesWwwrootDir = [System.IO.Path]::Combine($currentPath, "modules", "wwwroot")
    Set-Location $modulesWwwrootDir

    if (-not (Test-CommandExists "libman")) {
        Write-Host "libman CLI 도구가 설치되어 있지 않습니다. 전역 도구로 설치합니다..."
        dotnet tool install --global Microsoft.Web.LibraryManager.Cli
    }
    else {
        Write-Host "  ✔ libman 설치됨"
    }

    # modules/wwwroot 모듈 npm 의존성 설치 및 gulp 번들링
    $modulesWwwrootNodeModules = [System.IO.Path]::Combine($currentPath, "modules", "wwwroot", "node_modules")
    if (-not (Test-Path $modulesWwwrootNodeModules)) {
        Write-Host ""
        Write-Host "syn.bundle.js 모듈 npm 패키지 설치 시작..."
        Set-Location $modulesWwwrootDir
        npm install
        gulp
    }

    # 실행 환경 설치 완료 안내
    Set-Location $currentPath
    Write-Host ""
    Write-Host "ack 실행 환경 설치가 완료되었습니다."
    Write-Host "  터미널에서 다음 프로그램을 실행하세요: $ackExePath"
}