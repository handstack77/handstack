@echo off
chcp 65001

REM publish.bat win build Debug x64
REM publish.bat linux build Debug x64
REM publish.bat osx build Debug x64
REM publish.bat osx build Debug arm64
REM publish.bat win build Debug x64 ..\custom-path

REM win, linux, osx
set os_mode=%1
if "%os_mode%" == "" set os_mode=win

REM build, publish
set action_mode=%2
if "%action_mode%" == "" set action_mode=build

REM Debug, Release
set configuration_mode=%3
if "%configuration_mode%" == "" set configuration_mode=Release

REM x64, x86, arm64
set arch_mode=%4
if "%arch_mode%" == "" set arch_mode=x64

REM 사용자 지정 publish 경로
set publish_path=%5
if "%publish_path%" == "" set publish_path=%HANDSTACK_SRC%\..\publish\%os_mode%-%arch_mode%

REM 설정에 따라 Optimize 옵션 설정
if "%configuration_mode%" == "Debug" (
    set optimize_flag=false
) else (
    set optimize_flag=true
)

echo os_mode: %os_mode%, action_mode: %action_mode%, configuration_mode: %configuration_mode%, arch_mode: %arch_mode%, optimize: %optimize_flag%, publish_path: %publish_path%

rmdir /s /q %publish_path%
dotnet %action_mode% -p:Optimize=%optimize_flag% 1.WebHost\ack\ack.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\app
dotnet %action_mode% -p:Optimize=%optimize_flag% 1.WebHost\forbes\forbes.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\forbes
dotnet %action_mode% -p:Optimize=%optimize_flag% 4.Tool\CLI\handstack\handstack.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\app\cli
dotnet %action_mode% -p:Optimize=%optimize_flag% 4.Tool\CLI\edgeproxy\edgeproxy.csproj --configuration Release --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\app\cli

set forbes_path=%publish_path%\handstack\forbes
robocopy %forbes_path%\wwwroot %forbes_path% /E /MOVE
del /F /Q "%forbes_path%\*"

set contracts_path=1.WebHost\build\handstack\contracts
if exist "%contracts_path%" (
    rd /S /Q "%contracts_path%"
)

dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\dbclient\dbclient.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\dbclient
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\function\function.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\function
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\logger\logger.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\logger
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\repository\repository.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\repository
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\transact\transact.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\transact
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\wwwroot\wwwroot.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\wwwroot
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\checkup\checkup.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\checkup
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\openapi\openapi.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\openapi
dotnet %action_mode% -p:Optimize=%optimize_flag% 2.Modules\prompter\prompter.csproj --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% --output %publish_path%\handstack\modules\prompter

robocopy 1.WebHost\build\handstack\contracts %publish_path%\handstack\contracts /s /e /copy:dat
robocopy . %publish_path%\handstack install.* /copy:dat
robocopy 2.Modules\function %publish_path%\handstack package*.* /copy:dat

set wwwroot_js_path=%publish_path%\handstack\modules\wwwroot\wwwroot

rd /S /Q "%wwwroot_js_path%\lib"
del /F /Q "%wwwroot_js_path%\js\syn.bundle.js"
del /F /Q "%wwwroot_js_path%\js\syn.bundle.min.js"
del /F /Q "%wwwroot_js_path%\js\syn.controls.js"
del /F /Q "%wwwroot_js_path%\js\syn.controls.min.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.base.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.base.min.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.js"
del /F /Q "%wwwroot_js_path%\js\syn.scripts.min.js"

REM git archive --format zip --output %HANDSTACK_SRC%\..\publish\handstack-src.zip master
