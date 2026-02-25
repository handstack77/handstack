param(
    [string]$Configuration = "Release",
    [string]$Framework = "net10.0",
    [string]$ProjectPath = (Join-Path $PSScriptRoot "forbes.csproj"),
    [string]$OutputRoot = ([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "publish"))),
    [switch]$NoRestore
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ProjectPath))
{
    throw "프로젝트 파일을 찾을 수 없습니다: $ProjectPath"
}

$runtimeIdentifiers = @(
    "win-x64",
    "linux-x64",
    "osx-x64"
)

foreach ($runtimeIdentifier in $runtimeIdentifiers)
{
    $outputPath = Join-Path $OutputRoot $runtimeIdentifier

    $arguments = @(
        "publish"
        $ProjectPath
        "-c"
        $Configuration
        "-f"
        $Framework
        "-r"
        $runtimeIdentifier
        "--self-contained"
        "true"
        "-p:PublishSingleFile=true"
        "-p:DebugSymbols=false"
        "-p:DebugType=None"
        "-o"
        $outputPath
    )

    $arguments += "-p:DefaultItemExcludesInProjectFolder=publish*/**"

    if ($NoRestore)
    {
        $arguments += "--no-restore"
    }

    Write-Host "==> Publishing: $runtimeIdentifier"
    Write-Host "    Output: $outputPath"

    & dotnet @arguments

    if ($LASTEXITCODE -ne 0)
    {
        throw "publish 실패: $runtimeIdentifier"
    }
}

Write-Host ""
Write-Host "모든 런타임 publish가 완료되었습니다."
Write-Host "출력 경로: $OutputRoot"
