#!/usr/bin/env pwsh

[CmdletBinding()]
param(
    # 필수 프로그램 확인·자동 설치만 수행하고 종료합니다. install.bat 이 이 모드로 호출합니다.
    [switch]$PrerequisitesOnly,
    # 누락된 필수 프로그램을 설치하지 않고 확인만 합니다. HANDSTACK_SKIP_PREREQUISITES=1 과 같습니다.
    [switch]$CheckOnly,
    # 관리자 권한으로 다시 실행된 내부 호출에서만 사용합니다.
    [string]$MachinePrerequisites,
    [string]$ResultPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ProgressPreference = 'SilentlyContinue'

$IsWindowsPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)
$IsMacOSPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::OSX)
$IsLinuxPlatform = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux)

$NodeUrlWindows = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$NodeUrlMac = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$NodeUrlLinux = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$CurlUrlWindows = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$CurlUrlMac = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$CurlUrlLinux = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$GulpUrl = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$DotNetUrlWindows = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$DotNetUrlMac = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$DotNetUrlLinux = 'https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내'
$LibZipUrl = 'https://github.com/handstack77/handstack/raw/master/lib.zip'

$NodeMinimumVersion = [version]'20.12.2'
$NodeUpgradeVersion = [version]'24.0.0'
$NpmCommand = if ($IsWindowsPlatform) { 'npm.cmd' } else { 'npm' }
$GulpCommand = if ($IsWindowsPlatform) { 'gulp.cmd' } else { 'gulp' }
$CurlCommand = if ($IsWindowsPlatform) { 'curl.exe' } else { 'curl' }
$SkipPrerequisiteInstall = $CheckOnly -or ($env:HANDSTACK_SKIP_PREREQUISITES -eq '1')
$script:RestartRequired = $false
$script:DownloadDirectory = $null

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

    # ErrorActionPreference=Stop 에서 Write-Error 는 즉시 종료되어 안내가 출력되지 않으므로 표준 오류에 직접 씁니다.
    [Console]::Error.WriteLine($Message)
    Write-Host "참고: $Url"
    Open-Guide -Url $Url
    exit 1
}

function Get-NativeOutput {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$ArgumentList = @()
    )

    if (-not (Test-CommandExists $FilePath)) {
        return @()
    }

    # Windows PowerShell 5.1 은 Stop 상태에서 리디렉션한 표준 오류를 종료 오류로 바꾸므로 잠시 Continue 로 둡니다.
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $FilePath @ArgumentList 2>$null
        if ($LASTEXITCODE -ne 0 -or $null -eq $output) {
            return @()
        }

        return @($output | ForEach-Object { "$_" })
    }
    catch {
        return @()
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Get-NodeVersion {
    param([string]$FilePath = 'node')

    $raw = @(Get-NativeOutput -FilePath $FilePath -ArgumentList @('--version')) | Select-Object -First 1
    if ($raw -and ($raw -match '^v?(\d+)\.(\d+)\.(\d+)')) {
        return [version]('{0}.{1}.{2}' -f $Matches[1], $Matches[2], $Matches[3])
    }

    return $null
}

function Test-DotNetSdk10 {
    $sdks = @(Get-NativeOutput -FilePath 'dotnet' -ArgumentList @('--list-sdks'))
    return $null -ne ($sdks | Where-Object { $_ -match '^10\.0\.\d+\s' } | Select-Object -First 1)
}

function Test-DotNetRuntime10 {
    $runtimes = @(Get-NativeOutput -FilePath 'dotnet' -ArgumentList @('--list-runtimes'))
    $hasNetCore = $null -ne ($runtimes | Where-Object { $_ -match '^Microsoft\.NETCore\.App 10\.0\.\d+\s' } | Select-Object -First 1)
    $hasAspNetCore = $null -ne ($runtimes | Where-Object { $_ -match '^Microsoft\.AspNetCore\.App 10\.0\.\d+\s' } | Select-Object -First 1)
    return $hasNetCore -and $hasAspNetCore
}

function Test-DotNetRequirement {
    param([Parameter(Mandatory = $true)][bool]$RequireSdk)

    # 개발 환경은 빌드에 SDK 10 이 필요하고, 실행 환경은 net10.0 framework-dependent 배포본이므로 런타임 10 이 필요합니다.
    if ($RequireSdk) {
        return Test-DotNetSdk10
    }

    return Test-DotNetRuntime10
}

function Add-ProcessPathEntry {
    param(
        [Parameter(Mandatory = $true)][string]$Directory,
        [switch]$Prepend
    )

    $separator = [string][System.IO.Path]::PathSeparator
    $entries = @($env:PATH -split [Regex]::Escape($separator) | Where-Object { $_ })
    if ($entries -contains $Directory) {
        if (-not $Prepend) { return }
        $entries = @($entries | Where-Object { $_ -ne $Directory })
    }

    if ($Prepend) {
        $env:PATH = (@($Directory) + $entries) -join $separator
    }
    else {
        $env:PATH = (@($entries) + $Directory) -join $separator
    }
}

function Update-WindowsProcessPath {
    # 설치 프로그램이 레지스트리에 추가한 PATH 를 현재 프로세스에 반영하고, 프로세스에만 있던 항목은 유지합니다.
    $entries = New-Object System.Collections.Generic.List[string]
    $sources = @(
        [System.Environment]::GetEnvironmentVariable('Path', 'Machine'),
        [System.Environment]::GetEnvironmentVariable('Path', 'User'),
        $env:PATH
    )

    foreach ($source in $sources) {
        if (-not $source) {
            continue
        }

        foreach ($entry in ($source -split ';')) {
            $trimmed = $entry.Trim()
            if ($trimmed -and -not ($entries -contains $trimmed)) {
                $entries.Add($trimmed)
            }
        }
    }

    $env:PATH = $entries -join ';'
}

function Add-WindowsUserPathEntry {
    param([Parameter(Mandatory = $true)][string]$Directory)

    # %USERPROFILE% 같은 확장 전 값을 보존하도록 레지스트리 원문을 읽고 REG_EXPAND_SZ 로 저장합니다.
    $environmentKey = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
    try {
        $rawPath = [string]$environmentKey.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
        $expandedEntries = @([System.Environment]::ExpandEnvironmentVariables($rawPath) -split ';' | Where-Object { $_ })
        if ($expandedEntries -notcontains $Directory) {
            $newPath = if ([string]::IsNullOrEmpty($rawPath)) { $Directory } else { $rawPath.TrimEnd(';') + ';' + $Directory }
            $environmentKey.SetValue('Path', $newPath, [Microsoft.Win32.RegistryValueKind]::ExpandString)
        }
    }
    finally {
        $environmentKey.Close()
    }

    Add-ProcessPathEntry -Directory $Directory
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal $identity
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-WindowsArchitecture {
    $architecture = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
    switch ($architecture) {
        'AMD64' { return 'x64' }
        'ARM64' { return 'arm64' }
        default { throw "지원하지 않는 Windows 아키텍처입니다: $architecture" }
    }
}

function Get-DownloadDirectory {
    if (-not $script:DownloadDirectory) {
        $script:DownloadDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('handstack-install-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $script:DownloadDirectory -Force | Out-Null
    }

    return $script:DownloadDirectory
}

function Remove-DownloadDirectory {
    if ($script:DownloadDirectory -and (Test-Path -LiteralPath $script:DownloadDirectory)) {
        Remove-Item -LiteralPath $script:DownloadDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Save-InstallerFile {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][string]$FileName,
        [Parameter(Mandatory = $true)][ValidateSet('SHA256', 'SHA512')][string]$Algorithm,
        [Parameter(Mandatory = $true)][string]$ExpectedHash
    )

    $filePath = Join-Path (Get-DownloadDirectory) $FileName
    Write-Host "  다운로드: $Uri"
    Invoke-WebRequest -Uri $Uri -OutFile $filePath -UseBasicParsing

    $actualHash = (Get-FileHash -LiteralPath $filePath -Algorithm $Algorithm).Hash
    if ($actualHash -ne $ExpectedHash.ToUpperInvariant()) {
        throw "다운로드한 파일의 해시가 일치하지 않습니다: $FileName"
    }

    return $filePath
}

function Invoke-Installer {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$ArgumentList
    )

    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -Wait -PassThru
    if ($process.ExitCode -eq 3010) {
        $script:RestartRequired = $true
    }
    elseif ($process.ExitCode -ne 0) {
        throw "$Name 설치 실패 (종료 코드 $($process.ExitCode))"
    }

    Update-WindowsProcessPath
}

function Install-WinGetPackage {
    param([Parameter(Mandatory = $true)][string]$Id)

    # 종료 코드만으로 판단하지 않고 호출한 쪽에서 설치 결과를 다시 확인합니다.
    & winget.exe install --id $Id --exact --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity --silent
    $exitCode = $LASTEXITCODE
    Update-WindowsProcessPath
    if ($exitCode -ne 0) {
        Write-Warning "WinGet 패키지 설치가 종료 코드 $exitCode 로 끝났습니다: $Id"
    }
}

function Install-DotNetSdkDirect {
    $architecture = Get-WindowsArchitecture
    $releases = Invoke-RestMethod -Uri 'https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json' -UseBasicParsing
    $sdkVersion = $releases.'latest-sdk'
    $sdk = $releases.releases |
        ForEach-Object { $_.sdks } |
        Where-Object { $_.version -eq $sdkVersion } |
        Select-Object -First 1
    $file = $sdk.files | Where-Object { $_.name -eq "dotnet-sdk-win-$architecture.exe" } | Select-Object -First 1
    if (-not $file) {
        throw ".NET SDK $sdkVersion Windows $architecture 설치 파일 정보를 찾을 수 없습니다."
    }

    $installer = Save-InstallerFile -Uri $file.url -FileName "dotnet-sdk-$sdkVersion-win-$architecture.exe" -Algorithm SHA512 -ExpectedHash $file.hash
    Invoke-Installer -Name ".NET SDK $sdkVersion" -FilePath $installer -ArgumentList @('/install', '/quiet', '/norestart')
}

function Get-NodeJsTargetRelease {
    param([Parameter(Mandatory = $true)][string]$FileKey)

    # index.json 은 최신 배포부터 나열되므로 첫 번째 24.x LTS 가 최신 패치입니다.
    # Windows PowerShell 5.1 의 Invoke-RestMethod 는 JSON 배열을 하나의 객체로 전달하므로 변수에 담은 뒤 나열합니다.
    $releases = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing
    $release = $releases |
        Where-Object { $_.lts -and $_.version -match "^v$($NodeUpgradeVersion.Major)\." -and ($_.files -contains $FileKey) } |
        Select-Object -First 1
    if (-not $release) {
        throw "Node.js $($NodeUpgradeVersion.Major) LTS 배포 정보($FileKey)를 찾을 수 없습니다."
    }

    return $release
}

function Test-NvmWindowsNode {
    # nvm-windows 가 설치되어 있고 현재 node 가 NVM_SYMLINK 에서 실행되면 nvm 으로 버전을 전환해야 PATH 앞의 이전 버전이 바뀝니다.
    if (-not $env:NVM_HOME -or -not $env:NVM_SYMLINK) {
        return $false
    }
    if (-not (Test-Path -LiteralPath ([System.IO.Path]::Combine($env:NVM_HOME, 'nvm.exe')))) {
        return $false
    }

    $nodeCommand = Get-Command 'node' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $nodeCommand) {
        return $true
    }

    $symlinkPrefix = $env:NVM_SYMLINK.TrimEnd('\') + '\'
    return $nodeCommand.Source.StartsWith($symlinkPrefix, [System.StringComparison]::OrdinalIgnoreCase)
}

function Install-NodeJsWithNvm {
    if (-not $env:NVM_HOME -or -not $env:NVM_SYMLINK) {
        throw 'nvm-windows 환경 변수(NVM_HOME, NVM_SYMLINK)를 찾을 수 없습니다. 같은 사용자 계정의 관리자 권한 터미널에서 다시 실행하세요.'
    }

    $architecture = Get-WindowsArchitecture
    $release = Get-NodeJsTargetRelease -FileKey "win-$architecture-zip"
    $version = $release.version.TrimStart('v')
    $nvmCommand = [System.IO.Path]::Combine($env:NVM_HOME, 'nvm.exe')

    # nvm-windows 는 실패해도 종료 코드 0 을 반환하는 경우가 있으므로 전환된 node 버전으로 결과를 확인합니다.
    Write-Host "nvm-windows 로 Node.js v$version 을 설치하고 사용 버전으로 전환합니다..."
    & $nvmCommand install $version
    & $nvmCommand use $version
    Update-WindowsProcessPath

    $switchedVersion = Get-NodeVersion -FilePath ([System.IO.Path]::Combine($env:NVM_SYMLINK, 'node.exe'))
    if ($null -eq $switchedVersion -or $switchedVersion -ne [version]$version) {
        throw "nvm-windows 로 Node.js v$version 전환에 실패했습니다. 현재 버전: $switchedVersion"
    }
}

function Install-NodeJsDirect {
    $architecture = Get-WindowsArchitecture
    $release = Get-NodeJsTargetRelease -FileKey "win-$architecture-msi"

    $version = $release.version
    $fileName = "node-$version-$architecture.msi"
    $checksums = (Invoke-WebRequest -Uri "https://nodejs.org/dist/$version/SHASUMS256.txt" -UseBasicParsing).Content
    $checksumLine = $checksums -split "`n" | Where-Object { $_ -match "^([0-9a-fA-F]{64})\s+$([Regex]::Escape($fileName))\s*$" } | Select-Object -First 1
    if (-not $checksumLine) {
        throw "Node.js $version 체크섬을 찾을 수 없습니다."
    }

    $expectedHash = ($checksumLine -split '\s+')[0]
    $installer = Save-InstallerFile -Uri "https://nodejs.org/dist/$version/$fileName" -FileName $fileName -Algorithm SHA256 -ExpectedHash $expectedHash
    Invoke-Installer -Name "Node.js $version" -FilePath 'msiexec.exe' -ArgumentList @('/i', "`"$installer`"", '/qn', '/norestart')
}

function Install-WindowsMachinePrerequisites {
    param([Parameter(Mandatory = $true)][string[]]$Items)

    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $useWinGet = Test-CommandExists 'winget.exe'

    # WinGet 이 없거나 실패하면 공식 배포처의 설치 파일을 해시 확인 후 직접 설치합니다.
    foreach ($item in $Items) {
        switch ($item) {
            'dotnet' {
                Write-Host '.NET SDK 10 을 설치합니다...'
                if ($useWinGet) {
                    Install-WinGetPackage -Id 'Microsoft.DotNet.SDK.10'
                }
                if (-not (Test-DotNetSdk10)) {
                    Install-DotNetSdkDirect
                }
            }
            'node' {
                Write-Host 'Node.js 24 LTS 최신 패치를 설치합니다...'
                Install-NodeJsDirect
            }
            'node-nvm' {
                Install-NodeJsWithNvm
            }
            default {
                throw "알 수 없는 설치 항목입니다: $item"
            }
        }
    }
}

function Invoke-ElevatedMachinePrerequisites {
    param([Parameter(Mandatory = $true)][string[]]$Items)

    $resultFilePath = Join-Path ([System.IO.Path]::GetTempPath()) ('handstack-install-' + [Guid]::NewGuid().ToString('N') + '.log')
    $hostPath = (Get-Process -Id $PID).Path
    $arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -MachinePrerequisites {1} -ResultPath "{2}"' -f $PSCommandPath, ($Items -join ','), $resultFilePath

    Write-Host "관리자 권한이 필요한 설치($($Items -join ', '))를 위해 권한 상승을 한 번 요청합니다..."
    try {
        $process = Start-Process -FilePath $hostPath -ArgumentList $arguments -Verb RunAs -Wait -PassThru
    }
    catch {
        throw "관리자 권한 상승이 거부되었거나 실패했습니다. 관리자 권한 터미널에서 다시 실행하세요. $($_.Exception.Message)"
    }

    $detail = ''
    if (Test-Path -LiteralPath $resultFilePath) {
        $detail = (Get-Content -LiteralPath $resultFilePath -Raw -Encoding UTF8).Trim()
        Remove-Item -LiteralPath $resultFilePath -Force -ErrorAction SilentlyContinue
    }

    if ($process.ExitCode -eq 3010) {
        $script:RestartRequired = $true
    }
    elseif ($process.ExitCode -ne 0) {
        throw "관리자 권한 설치 실패 (종료 코드 $($process.ExitCode)). $detail"
    }
}

function Test-DirectoryWritable {
    param([Parameter(Mandatory = $true)][string]$Path)

    try {
        Ensure-Directory -Path $Path
        $probePath = [System.IO.Path]::Combine($Path, ('.handstack-write-test-' + [Guid]::NewGuid().ToString('N')))
        [System.IO.File]::WriteAllText($probePath, '')
        Remove-Item -LiteralPath $probePath -Force
        return $true
    }
    catch {
        return $false
    }
}

function Initialize-NpmGlobalPrefix {
    $prefix = @(Get-NativeOutput -FilePath $NpmCommand -ArgumentList @('prefix', '--global')) | Select-Object -First 1
    if ($prefix -and (Test-DirectoryWritable -Path $prefix)) {
        Add-ProcessPathEntry -Directory $prefix
        return
    }

    # npm 전역 prefix 가 Program Files 처럼 쓸 수 없는 위치이면 사용자 전용 위치로 바꿉니다.
    $userPrefix = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('ApplicationData'), 'npm')
    Ensure-Directory -Path $userPrefix
    Write-Host "npm 전역 설치 경로를 사용자 디렉터리로 지정합니다: $userPrefix"
    [System.Environment]::SetEnvironmentVariable('NPM_CONFIG_PREFIX', $userPrefix, 'User')
    $env:NPM_CONFIG_PREFIX = $userPrefix
    Add-WindowsUserPathEntry -Directory $userPrefix
}

function Ensure-WindowsPrerequisites {
    param([Parameter(Mandatory = $true)][bool]$RequireSdk)

    $machineItems = @()
    if (-not (Test-DotNetRequirement -RequireSdk $RequireSdk)) {
        $machineItems += 'dotnet'
    }
    $currentNode = Get-NodeVersion
    if ($null -eq $currentNode -or $currentNode -lt $NodeUpgradeVersion) {
        if ($null -ne $currentNode) {
            Write-Host "Node.js v$currentNode 를 감지했습니다. 기존 환경에 영향을 줄 수 있는 Node.js 24 LTS 업그레이드를 진행합니다."
        }
        $machineItems += if (Test-NvmWindowsNode) { 'node-nvm' } else { 'node' }
    }

    if ($machineItems.Count -gt 0) {
        Write-Host "자동 설치 대상: $($machineItems -join ', ')"
        if (Test-Administrator) {
            Install-WindowsMachinePrerequisites -Items $machineItems
        }
        else {
            Invoke-ElevatedMachinePrerequisites -Items $machineItems
        }

        Update-WindowsProcessPath
        foreach ($directory in @([System.IO.Path]::Combine($env:ProgramFiles, 'dotnet'), [System.IO.Path]::Combine($env:ProgramFiles, 'nodejs'))) {
            if (Test-Path -LiteralPath $directory -PathType Container) {
                Add-ProcessPathEntry -Directory $directory
            }
        }
    }

    if (($machineItems -contains 'node') -or ($machineItems -contains 'node-nvm')) {
        $installedNode = Get-NodeVersion
        if ($null -eq $installedNode -or $installedNode -lt $NodeUpgradeVersion) {
            Fail-WithGuide -Message 'Node.js 24 설치 후에도 실행 버전이 24 미만입니다. 설치 오류와 PATH 또는 버전 관리 도구 설정을 확인하세요.' -Url $NodeUrlWindows
        }
    }

    if (-not (Test-CommandExists $CurlCommand) -and (Test-CommandExists 'winget.exe')) {
        Write-Host 'curl 을 설치합니다...'
        Install-WinGetPackage -Id 'cURL.cURL'
    }

    if (Test-CommandExists $NpmCommand) {
        Initialize-NpmGlobalPrefix
        if (-not (Test-CommandExists $GulpCommand)) {
            Write-Host 'gulp-cli 를 설치합니다...'
            Invoke-Step -Action { & $NpmCommand install --global gulp-cli } -ErrorMessage 'gulp-cli 설치 실패'
        }
    }
}

function Update-UnixProcessPath {
    param([Parameter(Mandatory = $true)][bool]$RequireSdk)

    # install.sh 가 별도 bash 프로세스에서 설치한 도구의 경로를 현재 pwsh 프로세스에 반영합니다.
    foreach ($directory in @('/opt/homebrew/bin', '/usr/local/bin', '/opt/homebrew/opt/node@24/bin', '/usr/local/opt/node@24/bin')) {
        if (Test-Path -LiteralPath $directory -PathType Container) {
            Add-ProcessPathEntry -Directory $directory
        }
    }

    $userDotNetRoot = [System.IO.Path]::Combine($HOME, '.dotnet')
    if (-not (Test-DotNetRequirement -RequireSdk $RequireSdk) -and (Test-Path -LiteralPath ([System.IO.Path]::Combine($userDotNetRoot, 'dotnet')))) {
        Add-ProcessPathEntry -Directory $userDotNetRoot -Prepend
        $env:DOTNET_ROOT = $userDotNetRoot
    }

    $npmPrefix = @(Get-NativeOutput -FilePath $NpmCommand -ArgumentList @('prefix', '--global')) | Select-Object -First 1
    if ($npmPrefix) {
        Add-ProcessPathEntry -Directory ([System.IO.Path]::Combine($npmPrefix, 'bin'))
    }
}

function Ensure-UnixPrerequisites {
    param([Parameter(Mandatory = $true)][bool]$RequireSdk)

    $previousNode = Get-NodeVersion
    $previousNodeCommand = Get-Command 'node' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $installScriptPath = [System.IO.Path]::Combine($scriptRoot, 'install.sh')
    if (Test-Path -LiteralPath $installScriptPath) {
        Invoke-Step -Action { & bash $installScriptPath --prerequisites-only } -ErrorMessage 'install.sh 필수 프로그램 설치 실패'
    }

    # install.sh 가 nvm 으로 설치한 Node.js 24 는 별도 bash 프로세스에만 반영되므로 현재 pwsh 프로세스 PATH 앞에 둡니다.
    $nvmDirectory = if ($env:NVM_DIR) { $env:NVM_DIR } else { [System.IO.Path]::Combine($HOME, '.nvm') }
    $nvmVersionsPath = [System.IO.Path]::Combine($nvmDirectory, 'versions', 'node')
    $usesNvm = ($null -eq $previousNodeCommand) -or $previousNodeCommand.Source.StartsWith($nvmDirectory + '/')
    if ($usesNvm -and ($null -eq $previousNode -or $previousNode -lt $NodeUpgradeVersion) -and (Test-Path -LiteralPath $nvmVersionsPath)) {
        $latestNvmNode = Get-ChildItem -LiteralPath $nvmVersionsPath -Directory -Filter "v$($NodeUpgradeVersion.Major).*" |
            Sort-Object { [version]($_.Name.TrimStart('v')) } -Descending |
            Select-Object -First 1
        if ($latestNvmNode) {
            Add-ProcessPathEntry -Directory ([System.IO.Path]::Combine($latestNvmNode.FullName, 'bin')) -Prepend
        }
    }

    if ($IsMacOSPlatform -and ($null -eq $previousNode -or $previousNode -lt $NodeUpgradeVersion)) {
        foreach ($directory in @('/opt/homebrew/opt/node@24/bin', '/usr/local/opt/node@24/bin')) {
            if (Test-Path -LiteralPath $directory -PathType Container) {
                Add-ProcessPathEntry -Directory $directory -Prepend
            }
        }
    }
    Update-UnixProcessPath -RequireSdk $RequireSdk
    if ($null -eq $previousNode -or $previousNode -lt $NodeUpgradeVersion) {
        $installedNode = Get-NodeVersion
        if ($null -eq $installedNode -or $installedNode -lt $NodeUpgradeVersion) {
            $url = Get-PlatformGuideUrl -WindowsUrl $NodeUrlWindows -MacUrl $NodeUrlMac -LinuxUrl $NodeUrlLinux
            Fail-WithGuide -Message 'Node.js 24 설치 후에도 실행 버전이 24 미만입니다. PATH 또는 버전 관리 도구 설정을 확인하세요.' -Url $url
        }
    }
}

function Assert-Prerequisites {
    param([Parameter(Mandatory = $true)][bool]$RequireSdk)

    $nodeVersion = Get-NodeVersion
    if ($null -eq $nodeVersion -or $nodeVersion -lt $NodeMinimumVersion -or -not (Test-CommandExists $NpmCommand)) {
        $url = Get-PlatformGuideUrl -WindowsUrl $NodeUrlWindows -MacUrl $NodeUrlMac -LinuxUrl $NodeUrlLinux
        Fail-WithGuide -Message "Node.js v$NodeMinimumVersion LTS 이상 버전을 설치 해야 합니다." -Url $url
    }

    if (-not (Test-CommandExists $GulpCommand)) {
        Fail-WithGuide -Message 'Node.js 기반 gulp CLI 도구를 설치 해야 합니다.' -Url $GulpUrl
    }

    if (-not (Test-CommandExists $CurlCommand)) {
        $url = Get-PlatformGuideUrl -WindowsUrl $CurlUrlWindows -MacUrl $CurlUrlMac -LinuxUrl $CurlUrlLinux
        Fail-WithGuide -Message 'curl CLI 를 설치 해야 합니다.' -Url $url
    }

    if (-not (Test-DotNetRequirement -RequireSdk $RequireSdk)) {
        $url = Get-PlatformGuideUrl -WindowsUrl $DotNetUrlWindows -MacUrl $DotNetUrlMac -LinuxUrl $DotNetUrlLinux
        $message = if ($RequireSdk) { '.NET SDK 10.0 버전을 설치 해야 합니다.' } else { '.NET 10.0 런타임(Microsoft.AspNetCore.App 10.0) 또는 .NET SDK 10.0 버전을 설치 해야 합니다.' }
        Fail-WithGuide -Message $message -Url $url
    }

    Write-Host "필수 프로그램 확인 완료: Node.js v$nodeVersion, gulp-cli, curl, .NET $(if ($RequireSdk) { 'SDK 10' } else { '런타임 10' })"
}

function Ensure-Prerequisites {
    param([Parameter(Mandatory = $true)][bool]$RequireSdk)

    # 다른 터미널이나 설치 프로그램이 레지스트리에 추가한 PATH 를 확인 전에 반영합니다.
    if ($IsWindowsPlatform) {
        Update-WindowsProcessPath
    }

    if (-not $SkipPrerequisiteInstall) {
        if ($IsWindowsPlatform) {
            Ensure-WindowsPrerequisites -RequireSdk $RequireSdk
        }
        else {
            Ensure-UnixPrerequisites -RequireSdk $RequireSdk
        }
    }

    Assert-Prerequisites -RequireSdk $RequireSdk

    if ($script:RestartRequired) {
        Write-Warning '일부 설치 프로그램이 재부팅을 요청했습니다. 설치는 계속 진행하며, 완료 후 Windows 를 다시 시작하세요.'
    }
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
    Add-ProcessPathEntry -Directory ([System.IO.Path]::Combine($HOME, '.dotnet', 'tools'))
    if (Test-CommandExists 'libman') {
        return
    }

    # libman restore 는 현재 사용하지 않으므로 libman 설치 실패는 경고만 남기고 계속 진행합니다.
    if (@(Get-NativeOutput -FilePath 'dotnet' -ArgumentList @('--list-sdks')).Count -eq 0) {
        Write-Warning '.NET SDK 가 없어 libman CLI 도구 설치를 건너뜁니다.'
        return
    }

    $installedTools = @(Get-NativeOutput -FilePath 'dotnet' -ArgumentList @('tool', 'list', '--global'))
    if ($installedTools | Where-Object { $_ -match '^microsoft\.web\.librarymanager\.cli\s' }) {
        return
    }

    Write-Host 'libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다...'
    & dotnet tool install --global Microsoft.Web.LibraryManager.Cli
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "libman 설치 실패 (exit code: $LASTEXITCODE). libman restore 를 사용하지 않으므로 계속 진행합니다."
    }
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

if ($MachinePrerequisites) {
    $machineExitCode = 0
    try {
        Install-WindowsMachinePrerequisites -Items @($MachinePrerequisites -split ',' | Where-Object { $_ })
        if ($script:RestartRequired) {
            $machineExitCode = 3010
        }
    }
    catch {
        $machineExitCode = 1
        [Console]::Error.WriteLine("관리자 권한 설치 실패: $($_.Exception.Message)")
        if ($ResultPath) {
            Set-Content -LiteralPath $ResultPath -Value $_.Exception.Message -Encoding UTF8
        }
    }
    finally {
        Remove-DownloadDirectory
    }

    exit $machineExitCode
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
    $handstackHome = if ($isDevelopment) { [System.IO.Path]::Combine($parentPath, 'build', 'handstack') } else { $currentPath }

    if (-not $isDevelopment -and -not $isRuntime) {
        throw '개발 환경(1.WebHost/ack/ack.csproj) 또는 실행 환경(app/ack.exe, app/ack.dll, app/ack)을 찾지 못했습니다.'
    }

    Write-Host '필수 프로그램 설치 확인 중...'
    Ensure-Prerequisites -RequireSdk $isDevelopment

    if ($PrerequisitesOnly) {
        exit 0
    }

    Set-EnvValue -Name 'DOTNET_CLI_TELEMETRY_OPTOUT' -Value '1' -Persist
    if ($isDevelopment) {
        $handstackSrc = $currentPath
        Set-EnvValue -Name 'HANDSTACK_SRC' -Value $handstackSrc -Persist
        Set-EnvValue -Name 'HANDSTACK_HOME' -Value $handstackHome -Persist

        Write-Host "HANDSTACK_SRC: $handstackSrc"
        Write-Host "HANDSTACK_HOME: $handstackHome"

        Ensure-Directory -Path $handstackHome

        $ackDir = [System.IO.Path]::Combine($currentPath, '1.WebHost', 'ack')
        Write-Host "syn.js 번들링 $currentPath/package.json 설치를 시작합니다..."
        Push-Location $ackDir
        Invoke-Step -Action { & $NpmCommand install } -ErrorMessage 'ack npm install 실패'
        Invoke-Step -Action { & $GulpCommand } -ErrorMessage 'ack gulp 실패'
        Pop-Location

        Write-Host "current_path: $currentPath"
        if ($IsWindowsPlatform) {
            Invoke-Step -Action { cmd /c build.bat } -ErrorMessage 'build.bat 실행 실패'
        }
        else {
            Invoke-Step -Action { bash ./build.sh } -ErrorMessage 'build.sh 실행 실패'
        }

        $wwwrootLibPath = [System.IO.Path]::Combine($currentPath, '2.Modules', 'wwwroot', 'wwwroot', 'lib')
        Write-Host 'handstack CLI 도구를 빌드합니다...'
        Invoke-Step -Action { dotnet build "$currentPath/4.Tool/CLI/handstack/handstack.csproj" } -ErrorMessage 'handstack CLI 빌드 실패'

        Write-Host 'lib.zip 파일을 해제합니다...'
        $handstackCli = Get-HandStackCliPath -BasePath $handstackHome
        Invoke-Step -Action { & $handstackCli extract "--file=$currentPath/lib.zip" "--directory=$wwwrootLibPath" } -ErrorMessage 'lib.zip 해제 실패'

        Write-Host 'libman 도구 확인 및 라이브러리 복원을 시작합니다...'
        Push-Location ([System.IO.Path]::Combine($currentPath, '2.Modules', 'wwwroot'))
        Ensure-Libman
        Pop-Location

        $wwwrootModulePath = [System.IO.Path]::Combine($currentPath, '2.Modules', 'wwwroot')
        Write-Host "syn.bundle.js 모듈 $currentPath/2.Modules/wwwroot/package.json 설치를 시작합니다..."
        Push-Location $wwwrootModulePath
        Invoke-Step -Action { & $NpmCommand install } -ErrorMessage 'wwwroot npm install 실패'
        Sync-DirectoryMirror -Source ([System.IO.Path]::Combine($wwwrootModulePath, 'wwwroot', 'lib')) -Destination ([System.IO.Path]::Combine($handstackHome, 'modules', 'wwwroot', 'wwwroot', 'lib'))
        Write-Host 'syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다...'
        Invoke-Step -Action { & $GulpCommand } -ErrorMessage 'wwwroot gulp 실패'
        Pop-Location

        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, '2.Modules', 'function', 'package.json')) -Destination ([System.IO.Path]::Combine($handstackHome, 'package.json'))
        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, '2.Modules', 'function', 'package-lock.json')) -Destination ([System.IO.Path]::Combine($handstackHome, 'package-lock.json'))

        Write-Host "node.js Function 모듈 $handstackHome/package.json 설치를 시작합니다..."
        Push-Location $handstackHome
        Invoke-Step -Action { & $NpmCommand install } -ErrorMessage 'HANDSTACK_HOME npm install 실패'
        Pop-Location

        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, '1.WebHost', 'ack', 'wwwroot', 'assets', 'js', 'index.js')) `
            -Destination ([System.IO.Path]::Combine($handstackHome, 'node_modules', 'syn', 'index.js'))

        Write-Host 'HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr/docs/startup/install/개발-환경-설정하기#빌드와-확인 를 참고하세요.'
        exit 0
    }

    if ($isRuntime) {
        Set-EnvValue -Name 'HANDSTACK_HOME' -Value $currentPath -Persist

        Write-Host "current_path: $currentPath ack 실행 환경 설치 확인 중..."
        Write-Host "HANDSTACK_SRC: $($env:HANDSTACK_SRC)"
        Write-Host "HANDSTACK_HOME: $currentPath"

        Write-Host "function 모듈 $currentPath/package.json 설치를 시작합니다..."
        Invoke-Step -Action { & $NpmCommand install } -ErrorMessage 'runtime root npm install 실패'
        Copy-FileSafe -Source ([System.IO.Path]::Combine($currentPath, 'app', 'wwwroot', 'assets', 'js', 'index.js')) `
            -Destination ([System.IO.Path]::Combine($currentPath, 'node_modules', 'syn', 'index.js'))

        $runtimeAppDir = [System.IO.Path]::Combine($currentPath, 'app')
        Write-Host "syn.js 번들링 모듈 $currentPath/app/package.json 설치를 시작합니다..."
        Push-Location $runtimeAppDir
        Invoke-Step -Action { & $NpmCommand install } -ErrorMessage 'runtime app npm install 실패'
        Pop-Location

        $runtimeWwwrootPath = [System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot', 'wwwroot')
        $runtimeLibPath = [System.IO.Path]::Combine($runtimeWwwrootPath, 'lib')
        $runtimeLibZipPath = [System.IO.Path]::Combine($runtimeWwwrootPath, 'lib.zip')
        Write-Host "클라이언트 라이브러리 $runtimeLibPath 설치를 시작합니다..."
        Ensure-Directory -Path $runtimeWwwrootPath

        if (-not (Test-Path $runtimeLibZipPath)) {
            Write-Host 'lib.zip 파일을 다운로드 합니다...'
            Push-Location $runtimeWwwrootPath
            Invoke-Step -Action { & $CurlCommand -L -o 'lib.zip' $LibZipUrl } -ErrorMessage 'lib.zip 다운로드 실패'
            Pop-Location
        }

        Write-Host 'lib.zip 파일을 해제합니다...'
        $runtimeCli = Get-HandStackCliPath -BasePath $currentPath
        Invoke-Step -Action { & $runtimeCli extract "--file=$runtimeLibZipPath" "--directory=$runtimeLibPath" } -ErrorMessage 'runtime lib.zip 해제 실패'

        Write-Host 'libman 도구 확인 및 라이브러리 복원을 시작합니다...'
        Push-Location ([System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot'))
        Ensure-Libman
        Pop-Location

        Write-Host "syn.bundle.js 모듈 $currentPath/modules/wwwroot/package.json 설치를 시작합니다..."
        Push-Location ([System.IO.Path]::Combine($currentPath, 'modules', 'wwwroot'))
        Invoke-Step -Action { & $NpmCommand install } -ErrorMessage 'runtime wwwroot npm install 실패'
        Invoke-Step -Action { & $GulpCommand } -ErrorMessage 'runtime wwwroot gulp 실패'
        Pop-Location

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
}
catch {
    [Console]::Error.WriteLine("ERROR: install.ps1 실행 실패. $($_.Exception.Message)")
    exit 1
}
finally {
    Remove-DownloadDirectory
    Pop-Location
}
