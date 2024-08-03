@echo off
chcp 65001

REM run.bat development

if "%HANDSTACK_HOME%"=="" (
    echo "HANDSTACK_HOME 환경변수가 설정되지 않았습니다. 예) setx HANDSTACK_HOME C:\projects\handstack77\handstack\1.WebHost\build\handstack"
    exit /b 1
)

set current_path=%cd%

if "%setting_name%" == "" set setting_name=%1
if "%setting_name%" == "" set setting_name=development

echo current_path: %current_path%
echo setting_name: %setting_name% 

if "%setting_name%"=="development" (
    echo webapp 모듈 purge contracts...
	%HANDSTACK_HOME%/app/cli/handstack purgecontracts --ack=%HANDSTACK_HOME%/app/ack.exe --directory=%current_path%/contracts
)

%HANDSTACK_HOME%/app/cli/handstack configuration --ack=%HANDSTACK_HOME%/app/ack.exe --appsettings=%current_path%/settings/ack.%setting_name%.json
%HANDSTACK_HOME%/app/ack.exe
