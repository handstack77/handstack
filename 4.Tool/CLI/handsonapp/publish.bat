@echo off
chcp 65001

REM publish.bat win build Debug x64
REM publish.bat linux build Debug x64
REM publish.bat osx build Debug x64
REM publish.bat osx build Debug arm64

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

dotnet publish handsonapp.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output bin/Publish/%os_mode%-%arch_mode% -p:PublishSingleFile=true
