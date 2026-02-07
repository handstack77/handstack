@echo off
chcp 65001

REM cd C:\projects\handstack77\handstack
set current_path=%cd%

for %%i in ("%current_path%") do set "PARENT_DIR=%%~dpi"
set "PARENT_DIR=%PARENT_DIR:~0,-1%"

REM 환경 변수 설정
setx DOTNET_CLI_TELEMETRY_OPTOUT 1
set DOTNET_CLI_TELEMETRY_OPTOUT=1

setx HANDSTACK_SRC "%current_path%" >nul
set "HANDSTACK_SRC=%current_path%"

setx HANDSTACK_HOME "%PARENT_DIR%\build\handstack" >nul
set "HANDSTACK_HOME=%PARENT_DIR%\build\handstack"

echo HANDSTACK_SRC: %HANDSTACK_SRC%
echo HANDSTACK_HOME: %HANDSTACK_HOME%

REM winget install --id Microsoft.Powershell --source winget
REM pwsh
REM $targetFiles = @("post-build.sh", "build.sh", "task.sh", "setting.sh", "publish.sh", "install.sh", "env.sh")
REM Get-ChildItem -Path . -Recurse -Include $targetFiles | ForEach-Object {
REM     $content = Get-Content $_.FullName -Raw
REM     $content = $content -replace "`r`n", "`n"
REM     Set-Content -Path $_.FullName -Value $content -NoNewline -Encoding UTF8
REM     Write-Host "Converted: $($_.FullName)"
REM }