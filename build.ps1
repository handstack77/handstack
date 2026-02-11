#!/usr/bin/env pwsh
#
# HandStack 솔루션 전체 빌드 스크립트
#
# 설명:
#   HandStack 솔루션의 모든 프로젝트를 의존성 순서에 따라 빌드합니다.
#   솔루션 복원 및 클린을 먼저 수행한 뒤, 아래 순서로 빌드합니다:
#     1. Modules (2.Modules) - 핵심 모듈 프로젝트
#     2. WebHost (1.WebHost)  - 웹 호스트 프로젝트
#     3. CLI Tools (4.Tool)   - 명령줄 도구 프로젝트
#   빌드 도중 하나라도 실패하면 즉시 중단하고 오류를 보고합니다.
#
# 사전 조건:
#   - PowerShell 7 이상 (pwsh)
#   - .NET SDK (dotnet CLI)
#   - 프로젝트 루트 디렉터리(handstack.sln이 있는 위치)에서 실행
#
# 사용법:
#   ./build.ps1


$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 빌드 대상 프로젝트 정의
$buildGroups = @(
    @{
        # Modules: 핵심 기능 모듈 (다른 프로젝트들이 의존하므로 가장 먼저 빌드)
        Name = "Modules"
        Projects = @(
            @{ Label = "wwwroot";    Path = [System.IO.Path]::Combine("2.Modules", "wwwroot", "wwwroot.csproj") }
            @{ Label = "dbclient";   Path = [System.IO.Path]::Combine("2.Modules", "dbclient", "dbclient.csproj") }
            @{ Label = "function";   Path = [System.IO.Path]::Combine("2.Modules", "function", "function.csproj") }
            @{ Label = "logger";     Path = [System.IO.Path]::Combine("2.Modules", "logger", "logger.csproj") }
            @{ Label = "repository"; Path = [System.IO.Path]::Combine("2.Modules", "repository", "repository.csproj") }
            @{ Label = "transact";   Path = [System.IO.Path]::Combine("2.Modules", "transact", "transact.csproj") }
            @{ Label = "checkup";    Path = [System.IO.Path]::Combine("2.Modules", "checkup", "checkup.csproj") }
        )
    }
    @{
        # WebHost: 웹 호스트 애플리케이션 (Modules에 의존)
        Name = "WebHost"
        Projects = @(
            @{ Label = "ack";    Path = [System.IO.Path]::Combine("1.WebHost", "ack", "ack.csproj") }
            @{ Label = "forbes"; Path = [System.IO.Path]::Combine("1.WebHost", "forbes", "forbes.csproj") }
        )
    }
    @{
        # CLI Tools: 명령줄 도구 (독립적이거나 Infrastructure에 의존)
        Name = "CLI Tools"
        Projects = @(
            @{ Label = "handstack";         Path = [System.IO.Path]::Combine("4.Tool", "CLI", "handstack", "handstack.csproj") }
            @{ Label = "handsonapp";        Path = [System.IO.Path]::Combine("4.Tool", "CLI", "handsonapp", "handsonapp.csproj") }
            @{ Label = "edgeproxy";         Path = [System.IO.Path]::Combine("4.Tool", "CLI", "edgeproxy", "edgeproxy.csproj") }
            @{ Label = "excludedportrange"; Path = [System.IO.Path]::Combine("4.Tool", "CLI", "excludedportrange", "excludedportrange.csproj") }
            @{ Label = "bundling";          Path = [System.IO.Path]::Combine("4.Tool", "CLI", "bundling", "bundling.csproj") }
        )
    }
)

# 모든 프로젝트의 의존성 패키지를 한 번에 복원합니다.
Write-Host "솔루션 NuGet 패키지 복원 중..."
dotnet restore handstack.sln
if ($LASTEXITCODE -ne 0) {
    Write-Error "솔루션 복원 실패"
    exit 1
}

# ─────────────────────────────────────────────
# 이전 빌드 산출물을 제거하여 클린 빌드를 보장합니다.
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "솔루션 클린 중..."
dotnet clean handstack.sln
if ($LASTEXITCODE -ne 0) {
    Write-Error "솔루션 클린 실패"
    exit 1
}

# 정의된 빌드 그룹 순서(Modules → WebHost → CLI Tools)대로 각 프로젝트를 Debug 구성으로 빌드합니다.
foreach ($group in $buildGroups) {
    Write-Host ""
    Write-Host "$($group.Name) 프로젝트 빌드 시작..."

    foreach ($project in $group.Projects) {
        Write-Host ""
        Write-Host "  ▶ $($project.Label) 빌드 중... ($($project.Path))"

        dotnet build $project.Path -c Debug

        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Error "빌드 실패: $($project.Label) ($($project.Path))"
            exit 1
        }

        Write-Host "  ✔ $($project.Label) 빌드 성공"
    }

    Write-Host ""
    Write-Host "$($group.Name) 그룹 빌드 완료"
}

# 빌드 완료
Write-Host ""
Write-Host "모든 프로젝트가 성공적으로 빌드되었습니다."
