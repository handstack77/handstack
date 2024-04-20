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

rmdir /s /q ..\publish\%os_mode%-%arch_mode%\handstack
dotnet %action_mode% 1.WebHost/ack/ack.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/app
dotnet %action_mode% 1.WebHost/forbes/forbes.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/forbes
dotnet publish 4.Tool/CLI/handstack/handstack.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/app/cli

set forbes_path=..\publish\%os_mode%-%arch_mode%\forbes
robocopy %forbes_path%/wwwroot %forbes_path% /E /MOVE
del /F /Q "%forbes_path%\*"

set contracts_path=1.WebHost\build\handstack\contracts
rd /S /Q "%contracts_path%"

dotnet build 2.Modules/dbclient/dbclient.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/dbclient
dotnet build 2.Modules/function/function.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/function
dotnet build 2.Modules/logger/logger.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/logger
dotnet build 2.Modules/repository/repository.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/repository
dotnet build 2.Modules/transact/transact.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/transact
dotnet build 2.Modules/wwwroot/wwwroot.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/wwwroot
dotnet build 2.Modules/checkup/checkup.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/checkup
dotnet build 2.Modules/openapi/openapi.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output ../publish/%os_mode%-%arch_mode%/modules/openapi

robocopy 1.WebHost/build/handstack/contracts ../publish/%os_mode%-%arch_mode%/contracts /s /e /copy:dat
robocopy . ../publish/%os_mode%-%arch_mode% install.* /copy:dat
robocopy 2.Modules/function ../publish/%os_mode%-%arch_mode% package*.* /copy:dat

set wwwroot_js_path=../publish/%os_mode%-%arch_mode%/modules/wwwroot/wwwroot

rd /S /Q "%wwwroot_js_path%\lib"
del /F /Q "%wwwroot_js_path%\js\syn.bundle.js"
del /F /Q "%wwwroot_js_path%\js\syn.bundle.min.js"
del /F /Q "%wwwroot_js_path%\js\syn.controls.js"
del /F /Q "%wwwroot_js_path%\js\syn.controls.min.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.base.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.base.min.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.min.js"

REM git archive --format zip --output ../publish/handstack-src.zip master