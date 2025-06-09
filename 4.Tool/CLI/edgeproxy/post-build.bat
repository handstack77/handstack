@echo off
chcp 65001

if "%BUILD_COMPLETED%"=="true" (
    echo Build already completed, skipping...
    exit /b 0
)
set BUILD_COMPLETED=true

REM post-build.bat win build Debug

REM win, linux, osx
set os_mode=%1
if "%os_mode%" == "" set os_mode=win

REM build, publish
set action_mode=%2
if "%action_mode%" == "" set action_mode=build

REM Debug, Release
set configuration_mode=%3
if "%configuration_mode%" == "" set configuration_mode=Debug

REM x64, x86, arm64
set arch_mode=%4
if "%arch_mode%" == "" set arch_mode=x64

echo os_mode: %os_mode%, action_mode: %action_mode%, configuration_mode: %configuration_mode%, arch_mode: %arch_mode%

dotnet publish edgeproxy.csproj --configuration Release --arch %arch_mode% --os %os_mode% --output %HANDSTACK_SRC%/../build/handstack/app/cli
