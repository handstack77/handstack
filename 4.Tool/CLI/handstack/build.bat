@echo off
chcp 65001

REM build.bat win build Debug

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

rmdir /s /q C:\publish\%os_mode%-%arch_mode%\handstack\app\cli\handstack
dotnet %action_mode% handstack.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output C:/publish/%os_mode%-%arch_mode%/handstack/app/cli
