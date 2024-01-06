@echo off
chcp 65001

REM publish.bat win build Debug

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

rmdir /s /q ..\publish\%os_mode%-%arch_mode%\handstack
dotnet %action_mode% 1.WebHost/ack/ack.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/app
dotnet build 2.Modules/dbclient/dbclient.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/modules/dbclient
dotnet build 2.Modules/function/function.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/modules/function
dotnet build 2.Modules/logger/logger.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/modules/logger
dotnet build 2.Modules/repository/repository.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/modules/repository
dotnet build 2.Modules/transact/transact.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/modules/transact
dotnet build 2.Modules/wwwroot/wwwroot.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/handstack/modules/wwwroot
robocopy 1.WebHost/build/handstack/contracts ../publish/%os_mode%-%arch_mode%/handstack/contracts /s /e /copy:dat
robocopy . ../publish/%os_mode%-%arch_mode%/handstack install.* /copy:dat
robocopy 2.Modules/function ../publish/%os_mode%-%arch_mode%/handstack package*.* /copy:dat
REM git archive --format zip --output ../publish/handstack-src.zip master