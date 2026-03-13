#!/usr/bin/env pwsh
#
# Infrastructure 어셈블리 빌드 스크립트
#
# 설명:
#   HandStack 프로젝트의 Infrastructure 레이어에 속하는 핵심 어셈블리
#   (HandStack.Core, HandStack.Data, HandStack.Web)를 Debug/Release 양쪽
#   구성으로 빌드하여 Assemblies 디렉터리에 출력합니다.
#   빌드 전에 어셈블리 서명을 활성화하고, 빌드 완료 후 비활성화합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (dotnet CLI)
#   - Node.js (signassembly.js 실행용)
#
# 사용법:
#   Windows: ./assemblies.ps1 또는 pwsh ./assemblies.ps1
#   macOS/Linux: ./assemblies.ps1 또는 pwsh ./assemblies.ps1


$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Test-CommandExists {
    param([string]$CommandName)
    $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Invoke-ExternalCommand {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$ErrorMessage
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptRoot

# Assemblies 출력 루트 디렉터리
$assembliesDir = [System.IO.Path]::Combine("3.Infrastructure", "Assemblies")

# Debug/Release 출력 디렉터리
$debugOutputDir = [System.IO.Path]::Combine($assembliesDir, "Debug")
$releaseOutputDir = [System.IO.Path]::Combine($assembliesDir, "Release")

# 빌드 대상 프로젝트
$projectNames = @(
    "HandStack.Core",
    "HandStack.Data",
    "HandStack.Web"
)

$signingEnabled = $false

try {
    if (-not (Test-CommandExists "node")) {
        throw "node 명령을 찾을 수 없습니다."
    }

    if (-not (Test-CommandExists "dotnet")) {
        throw "dotnet 명령을 찾을 수 없습니다."
    }

    # 기존 Assemblies 디렉터리 삭제
    if (Test-Path $assembliesDir) {
        Write-Host "[assemblies] 기존 Assemblies 디렉터리 삭제 중: $assembliesDir"
        Remove-Item -Path $assembliesDir -Recurse -Force
    }

    # 어셈블리 서명 활성화
    Write-Host "[assemblies] 어셈블리 서명 활성화 중..."
    Invoke-ExternalCommand -Command "node" -Arguments @("signassembly.js", "true") -ErrorMessage "어셈블리 서명 활성화 실패"
    $signingEnabled = $true

    # Debug 구성 빌드
    Write-Host "[assemblies] Debug 구성 빌드 시작..."
    foreach ($project in $projectNames) {
        $projectPath = [System.IO.Path]::Combine("3.Infrastructure", $project, "$project.csproj")
        Write-Host "  빌드 중: $projectPath"
        Invoke-ExternalCommand -Command "dotnet" -Arguments @("build", "--configuration", "Debug", $projectPath, "--output", $debugOutputDir) -ErrorMessage "Debug 빌드 실패: $projectPath"
    }
    Write-Host "[assemblies] Debug 구성 빌드 완료"

    # Release 구성 빌드
    Write-Host "[assemblies] Release 구성 빌드 시작..."
    foreach ($project in $projectNames) {
        $projectPath = [System.IO.Path]::Combine("3.Infrastructure", $project, "$project.csproj")
        Write-Host "  빌드 중: $projectPath"
        Invoke-ExternalCommand -Command "dotnet" -Arguments @("build", "--configuration", "Release", $projectPath, "--output", $releaseOutputDir) -ErrorMessage "Release 빌드 실패: $projectPath"
    }
    Write-Host "[assemblies] Release 구성 빌드 완료"

    Write-Host "[assemblies] 모든 어셈블리 빌드가 완료되었습니다."
}
catch {
    Write-Error $_
    exit 1
}
finally {
    if ($signingEnabled) {
        Write-Host "[assemblies] 어셈블리 서명 비활성화 중..."
        & node signassembly.js false | Out-Null
    }

    Pop-Location
}
