@echo off
chcp 65001

REM run.bat development

REM set setting_name=%1
REM if "%setting_name%" == "" set setting_name=development

REM echo setting_name: %setting_name%

REM if "%setting_name%"=="development" (
REM     echo checkman 모듈 purge contracts...
REM 	#{ackHomePath}/app/cli/handstack purgecontracts --ack=#{ackHomePath}/app/ack.exe --directory=contracts
REM )

REM #{ackHomePath}/app/cli/handstack configuration --ack=#{ackHomePath}/app/ack.exe --appsettings=settings/ack.%setting_name%.json
#{ackHomePath}/app/ack.exe
