#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$IsWindowsPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)
$IsMacOSPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX)
$IsLinuxPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux)

$NodeUrlWindows = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-nodejs-설치'
$NodeUrlMac = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-nodejs-설치'
$NodeUrlLinux = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-nodejs-설치'
$CurlUrlWindows = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-curl-설치'
$CurlUrlMac = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치'
$CurlUrlLinux = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치'
$GulpUrl = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#gulp-설치하기'
$DotNetUrlWindows = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치'
$DotNetUrlMac = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치'
$DotNetUrlLinux = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치'
$LibZipUrl = 'https://github.com/handstack77/handstack/raw/master/lib.zip'

function Get-PlatformGuideUrl {
    param(
        [Parameter(Mandatory = $true)][string]$WindowsUrl,
        [Parameter(Mandatory = $true)][string]$MacUrl,
        [Parameter(Mandatory = $true)][string]$LinuxUrl
    )

    if ($IsWindowsPlatform) { return $WindowsUrl }
    if ($IsMacOSPlatform) { return $MacUrl }
    return $LinuxUrl
}

function Test-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [Parameter(Mandatory = $true)][string]$ErrorMessage
    )

    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$ErrorMessage (exit code: $LASTEXITCODE)"
    }
}

function Open-Guide {
    param([Parameter(Mandatory = $true)][string]$Url)

    try {
        if ($IsWindowsPlatform) {
            Start-Process $Url | Out-Null
        }
        elseif ($IsMacOSPlatform -and (Test-CommandExists 'open')) {
            & open $Url | Out-Null
        }
        elseif ($IsLinuxPlatform -and (Test-CommandExists 'xdg-open')) {
            & xdg-open $Url *> $null
        }
    }
    catch {
    }
}

function Fail-WithGuide {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [Parameter(Mandatory = $true)][string]$Url
    )

    Write-Error $Message
    Write-Host "참고: $Url"
    Open-Guide -Url $Url
    exit 1
}

function Require-Command {
    param(
        [Parameter(Mandatory = $true)][string]$CommandName,
        [Parameter(Mandatory = $true)][string]$Message,
        [Parameter(Mandatory = $true)][string]$WindowsUrl,
        [Parameter(Mandatory = $true)][string]$MacUrl,
        [Parameter(Mandatory = $true)][string]$LinuxUrl
    )

    if (Test-CommandExists $CommandName) {
        return
    }

    $url = Get-PlatformGuideUrl -WindowsUrl $WindowsUrl -MacUrl $MacUrl -LinuxUrl $LinuxUrl
    Fail-WithGuide -Message $Message -Url $url
}

function Get-ProfilePath {
    if ($IsWindowsPlatform) {
        return $null
    }

    if ($env:SHELL -and ([System.IO.Path]::GetFileName($env:SHELL) -eq 'zsh')) {
        return [System.IO.Path]::Combine($HOME, '.zshrc')
    }

    if ($IsMacOSPlatform) {
        return [System.IO.Path]::Combine($HOME, '.zshrc')
    }

    return [System.IO.Path]::Combine($HOME, '.bashrc')
}

function Set-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value,
        [switch]$Persist
    )

    [System.Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
    Set-Item -Path "Env:$Name" -Value $Value

    if (-not $Persist) {
        return
    }

    if ($IsWindowsPlatform) {
        [System.Environment]::SetEnvironmentVariable($Name, $Value, 'User')
        return
    }

    $profilePath = Get-ProfilePath
    if (-not (Test-Path $profilePath)) {
        New-Item -Path $profilePath -ItemType File -Force | Out-Null
    }

    $line = "export $Name=`"$Value`""
    $pattern = "(?m)^\s*export $([Regex]::Escape($Name))=.*$"
    $content = Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) {
        $content = ''
    }

    if ($content -match $pattern) {
        $updated = [Regex]::Replace($content, $pattern, $line)
        Set-Content -Path $profilePath -Value $updated -NoNewline -Encoding UTF8
    }
    else {
        $trimmed = $content.TrimEnd("`r", "`n")
        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            Set-Content -Path $profilePath -Value "$line`n" -Encoding UTF8
        }
        else {
            Set-Content -Path $profilePath -Value "$trimmed`n$line`n" -Encoding UTF8
        }
    }
}

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -Path $Path -ItemType Directory -Force | Out-Null
    }
}

function Copy-FileSafe {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    if (-not (Test-Path $Source)) {
        return
    }

    Ensure-Directory -Path (Split-Path -Parent $Destination)
    Copy-Item -Path $Source -Destination $Destination -Force
}

function Sync-DirectoryMirror {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    Ensure-Directory -Path $Destination

    Get-ChildItem -Path $Destination -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }

    Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
}

function Ensure-Libman {
    if (Test-CommandExists 'libman') {
        return
    }

    Write-Host 'libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다...'
    Invoke-Step -Action { dotnet tool install --global Microsoft.Web.LibraryManager.Cli } -ErrorMessage 'libman 설치 실패'
}

function Get-HandStackCliPath {
    param([Parameter(Mandatory = $true)][string]$BasePath)

    $candidates = @(
        [System.IO.Path]::Combine($BasePath, 'tools', 'handstack', 'handstack.exe'),
        [System.IO.Path]::Combine($BasePath, 'tools', 'handstack', 'handstack')
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw "handstack CLI 실행 파일을 찾을 수 없습니다. 기준 경로: $BasePath"
}

function Get-DotNetMajorVersion {
    $version = (& dotnet --version).Trim()
    if (-not $version) {
        throw '.NET 버전을 확인할 수 없습니다.'
    }

    return @{
        Raw = $version
        Major = [int]($version.Split('.')[0])
    }
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptRoot

try {
    $currentPath = (Get-Location).Path
    $parentPath = Split-Path -Parent $currentPath

    $ackCsprojPath = [System.IO.Path]::Combine($currentPath, '1.WebHost', 'ack', 'ack.csproj')
    $runtimeAckExePath = [System.IO.Path]::Combine($currentPath, 'app', 'ack.exe')
    $runtimeAckDllPath = [System.IO.Path]::Combine($currentPath, 'app', 'ack.dll')
    $runtimeAckPath = [System.IO.Path]::Combine($currentPath, 'app', 'ack')

    $isDevelopment = Test-Path $ackCsprojPath
    $isRuntime = (Test-Path $runtimeAckExePath) -or (Test-Path $runtimeAckDllPath) -or (Test-Path $runtimeAckPath)
    $handstackHome = if ($isDevelopment) { [System.IO.Path]::Combine($parentPath, 'handstack') } else { $currentPath }

    Write-Host '필수 프로그램 설치 확인 중...'

    Require-Command -CommandName 'node' -Message 'Node.js v20.12.2 LTS 이상 버전을 설치 해야 합니다.' `
        -WindowsUrl $NodeUrlWindows -MacUrl $NodeUrlMac -LinuxUrl $NodeUrlLinux
    Require-Command -CommandName 'gulp' -Message 'Node.js 기반 gulp CLI 도구를 설치 해야 합니다.' `
        -WindowsUrl $GulpUrl -MacUrl $GulpUrl -LinuxUrl $GulpUrl
    $curlCommand = if ($IsWindowsPlatform) { 'curl.exe' } else { 'curl' }
    Require-Command -CommandName $curlCommand -Message 'curl CLI 를 설치 해야 합니다.' `
        -WindowsUrl $CurlUrlWindows -MacUrl $CurlUrlMac -LinuxUrl $CurlUrlLinux

    Set-EnvValue -Name 'DOTNET_CLI_TELEMETRY_OPTOUT' -Value '1' -Persist
    Set-EnvValue -Name 'HANDSTACK_HOME' -Value $handstackHome -Persist:$isDevelopment

    Write-Host "HANDSTACK_HOME: $handstackHome"

    if ($isDevelopment) {
        $handstackSrc = $currentPath
        Set-EnvValue -Name 'HANDSTACK_SRC' -Value $handstackSrc -Persist

        Write-Host "HANDSTACK_SRC: $handstackSrc"

        Ensure-Directory -Path $handstackHome

        Require-Command -CommandName 'dotnet' -Message '.NET Core 10.0 버전을 설치 해야 합니다.' `
            -WindowsUrl $DotNetUrlWindows -MacUrl $DotNetUrlMac -LinuxUrl $DotNetUrlLinux

        $dotnetVersion = Get-DotNetMajorVersion
        if ($dotnetVersion.Major -lt 10) {
            $url = Get-PlatformGuideUrl -WindowsUrl $DotNetUrlWindows -MacUrl $DotNetUrlMac -LinuxUrl $DotNetUrlLinux
            Fail-WithGuide -Message ".NET Core 10.0 버전을 설치 해야 합니다. 현재 버전: $($dotnetVersion.Raw)" -Url $url
        }

        $ackDir = [System.IO.Path]::Combine($currentPath, '1.WebHost', 'ack')
        $ackNodeModules = [System.IO.Path]::Combine($ackDir, 'node_modules')
        if (-not (Test-Path $ackNodeModules)) {
            Write-Host "syn.js 번들링 $currentPath/package.json 설치를 시작합니다..."
            Push-Location $ackDir
            Invoke-Step -Action { npm install } -ErrorMessage 'ack npm install 실패'
            Invoke-Step -Action { gulp } -ErrorMessage 'ack gulp 실패'
            Pop-Location
        }

        Write-Host "current_path: $currentPath"
        if ($IsWindowsPlatform) {
            Invoke-Step -Action { cmd /c build.bat } -ErrorMessage 'build.bat 실행 실패'
        }
        else {
            Invoke-Step -Action { bash ./build.sh } -ErrorMessage 'build.sh 실행 실패'
        }

        $wwwrootLibPath = [System.IO.Path]::Combine($currentPath, '2.Modules', 'wwwroot', 'wwwroot', 'lib')
        if (-not (Test-Path $wwwrootLibPath)) {
            Write-Host 'handstack CLI 도구를 빌드합니다...'
            Invoke-Step -Action { dotnet build "$currentPath/4.Tool/CLI/handstack/handstack.csproj" } -ErrorMessage 'handstack CLI 빌드 실패'

            Write-Host 'lib.zip 파일을 해제합니다...'
            $handstackCli = Get-HandStackCliPath -BasePath $handstackHome
            Invoke-Step -Action { & $handstackCli extract "--file=$currentPath/lib.zip" "--directory=$wwwrootLibPath" } -ErrorMessage 'lib.zip 해제 실패'
        }

        Write-Host 'libman 도구 확인 및 라이브러리 복원을 시작합니다...'
        Push-Location ([System.IO.Path]::Combine($currentPath, '2.Modules', 'wwwroot'))
        Ensure-Libman
        Pop-Location

        $wwwrootModulePath = [System.IO.Path]::Combine($currentPath, '2.Modules', 'wwwroot')
        $wwwrootNodeModules = [System.IO.Path]::Combine($wwwrootModulePath, 'node_modules')
        if (-not (Test-Path $wwwrootNodeModules)) {
            Write-Host "syn.bundle.js 모듈 $currentPath/2.Modules/wwwroot/package.json 설치를 시작합니다..."
            Push-Location $wwwrootModulePath
            Invoke-Step -Action { npm install } -ErrorMessage 'wwwroot npm install 실패'
            Sync-DirectoryMirror -Source ([System.IO.Path]::Combine($wwwrootModulePath, 'wwwroot', 'lib')) -Destination ([System.IO.Path]::Combine($handstackHome, 'modules', 'wwwroot', 'wwwroot', 'lib'))
            Write-Host 'syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다...'
            Invoke-Step -Action { gulp } -ErrorMessage 'wwwroot gulp 실패'
            Pop-Location
        }

        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, '2.Modules', 'function', 'package.json')) -Destination ([System.IO.Path]::Combine($handstackHome, 'package.json'))
        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, '2.Modules', 'function', 'package-lock.json')) -Destination ([System.IO.Path]::Combine($handstackHome, 'package-lock.json'))

        $handstackNodeModules = [System.IO.Path]::Combine($handstackHome, 'node_modules')
        if (-not (Test-Path $handstackNodeModules)) {
            Write-Host "node.js Function 모듈 $handstackHome/package.json 설치를 시작합니다..."
            Push-Location $handstackHome
            Invoke-Step -Action { npm install } -ErrorMessage 'HANDSTACK_HOME npm install 실패'
            Pop-Location
        }

        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, '1.WebHost', 'ack', 'wwwroot', 'assets', 'js', 'index.js')) `
            -Destination ([System.IO.Path]::Combine($handstackHome, 'node_modules', 'syn', 'index.js'))

        Write-Host 'HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr 를 참고하세요.'
        exit 0
    }

    if ($isRuntime) {
        Set-EnvValue -Name 'HANDSTACK_HOME' -Value $currentPath

        Write-Host "current_path: $currentPath ack 실행 환경 설치 확인 중..."
        Write-Host "HANDSTACK_SRC: $($env:HANDSTACK_SRC)"
        Write-Host "HANDSTACK_HOME: $currentPath"

        $rootNodeModules = [System.IO.Path]::Combine($currentPath, 'node_modules')
        if (-not (Test-Path $rootNodeModules)) {
            Write-Host "function 모듈 $currentPath/package.json 설치를 시작합니다..."
            Invoke-Step -Action { npm install } -ErrorMessage 'runtime root npm install 실패'
            Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, 'app', 'wwwroot', 'assets', 'js', 'index.js')) `
                -Destination ([System.IO.Path]::Combine($currentPath, 'node_modules', 'syn', 'index.js'))
        }

        $runtimeAppDir = [System.IO.Path]::Combine($currentPath, 'app')
        $runtimeAppNodeModules = [System.IO.Path]::Combine($runtimeAppDir, 'node_modules')
        if (-not (Test-Path $runtimeAppNodeModules)) {
            Write-Host "syn.js 번들링 모듈 $currentPath/app/package.json 설치를 시작합니다..."
            Push-Location $runtimeAppDir
            Invoke-Step -Action { npm install } -ErrorMessage 'runtime app npm install 실패'
            Pop-Location
        }

        $runtimeWwwrootPath = [System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot', 'wwwroot')
        $runtimeLibPath = [System.IO.Path]::Combine($runtimeWwwrootPath, 'lib')
        $runtimeLibZipPath = [System.IO.Path]::Combine($runtimeWwwrootPath, 'lib.zip')
        if (-not (Test-Path $runtimeLibPath)) {
            Write-Host "클라이언트 라이브러리 $runtimeLibPath 설치를 시작합니다..."
            Ensure-Directory -Path $runtimeWwwrootPath

            if ($env:HANDSTACK_SRC) {
                $sourceLibZip = [System.IO.Path]::Combine($env:HANDSTACK_SRC, 'lib.zip')
                if ((Test-Path $sourceLibZip) -and -not (Test-Path $runtimeLibZipPath)) {
                    Copy-Item -Path $sourceLibZip -Destination $runtimeLibZipPath -Force
                }
            }

            if (-not (Test-Path $runtimeLibZipPath)) {
                Write-Host 'lib.zip 파일을 다운로드 합니다...'
                Push-Location $runtimeWwwrootPath
                Invoke-Step -Action { & $curlCommand -L -o 'lib.zip' $LibZipUrl } -ErrorMessage 'lib.zip 다운로드 실패'
                Pop-Location
            }

            Write-Host 'lib.zip 파일을 해제합니다...'
            $runtimeCli = Get-HandStackCliPath -BasePath $currentPath
            Invoke-Step -Action { & $runtimeCli extract "--file=$runtimeLibZipPath" "--directory=$runtimeLibPath" } -ErrorMessage 'runtime lib.zip 해제 실패'
        }

        Write-Host 'libman 도구 확인 및 라이브러리 복원을 시작합니다...'
        Push-Location ([System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot'))
        Ensure-Libman
        Pop-Location

        $runtimeModuleNodeModules = [System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot', 'node_modules')
        if (-not (Test-Path $runtimeModuleNodeModules)) {
            Write-Host "syn.bundle.js 모듈 $currentPath/modules/wwwroot/package.json 설치를 시작합니다..."
            Push-Location ([System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot'))
            Invoke-Step -Action { npm install } -ErrorMessage 'runtime wwwroot npm install 실패'
            Invoke-Step -Action { gulp } -ErrorMessage 'runtime wwwroot gulp 실패'
            Pop-Location
        }

        $finalAckPath = if (Test-Path $runtimeAckExePath) {
            $runtimeAckExePath
        }
        elseif (Test-Path $runtimeAckPath) {
            $runtimeAckPath
        }
        else {
            $runtimeAckDllPath
        }

        Write-Host "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $finalAckPath"
        exit 0
    }

    throw '개발 환경(1.WebHost/ack/ack.csproj) 또는 실행 환경(app/ack.exe, app/ack.dll, app/ack)을 찾지 못했습니다.'
}
catch {
    Write-Error "ERROR: install.ps1 실행 실패. $($_.Exception.Message)"
    exit 1
}
finally {
    Pop-Location
}
