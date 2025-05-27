@echo off
chcp 65001

REM task.bat copy
REM handstack task --file=C:/projects/qcn.qrame/tools/cli/qrame/task.json --value=module:build

set TASK_COMMAND=%1
if "%TASK_COMMAND%" == "" set TASK_COMMAND=

set TASK_SETTING=%2
if "%TASK_SETTING%" == "" set TASK_SETTING=development

set TASK_ARGUMENTS=%3
if "%TASK_ARGUMENTS%" == "" set TASK_ARGUMENTS=

set WORKING_PATH=%cd%
if "%HANDSTACK_PATH%" == "" set HANDSTACK_PATH=%HANDSTACK_SRC%
if "%HANDSTACK_PATH%" == "" set HANDSTACK_PATH=C:/projects/handstack77/handstack
set HANDSTACK_ACK=%HANDSTACK_PATH%/1.WebHost/build/handstack/app/ack.exe
set HANDSTACK_CLI=%HANDSTACK_PATH%/4.Tool/CLI/handstack/bin/Debug/net8.0/handstack

echo WORKING_PATH: %WORKING_PATH%
echo HANDSTACK_PATH: %HANDSTACK_PATH%
echo HANDSTACK_ACK: %HANDSTACK_ACK%
echo HANDSTACK_CLI: %HANDSTACK_CLI%
echo TASK_COMMAND: %TASK_COMMAND%
echo TASK_SETTING: %TASK_SETTING%

if "%TASK_COMMAND%"=="purge" (
    %HANDSTACK_CLI% purgecontracts --ack=%HANDSTACK_ACK% --directory=%WORKING_PATH%/Contracts
)

if "%TASK_COMMAND%"=="run" (
    %HANDSTACK_CLI% configuration --ack=%HANDSTACK_ACK% --appsettings=%WORKING_PATH%/Settings/ack.%TASK_SETTING%.json
    %HANDSTACK_ACK%
)

if "%TASK_COMMAND%"=="app" (
    %HANDSTACK_CLI% startlog --ack=%HANDSTACK_ACK% --appsettings=%WORKING_PATH%/Settings/ack.%TASK_SETTING%.json
)

if "%TASK_COMMAND%"=="copy" (
    robocopy %WORKING_PATH%/Contracts %HANDSTACK_PATH%/1.WebHost/build/handstack/contracts /e /copy:dat
    robocopy %WORKING_PATH%/Contracts %HANDSTACK_PATH%/1.WebHost/build/handstack/modules/repository/Contracts /e /copy:dat
    robocopy %WORKING_PATH%/wwwroot %HANDSTACK_PATH%/1.WebHost/build/handstack/modules/repository/wwwroot /e /copy:dat
)

if "%TASK_COMMAND%"=="devcert" (
    dotnet dev-certs https -ep %HANDSTACK_HOME%/ack.pfx -p 1234
    dotnet dev-certs https --trust
)

if "%TASK_COMMAND%"=="start" (
    pm2 start %HANDSTACK_ACK% --name ack --no-autorestart
)

if "%TASK_COMMAND%"=="stop" (
    call pm2 stop ack
)

if "%TASK_COMMAND%"=="build" (
    for /f "tokens=*" %%i in ('pm2 id ack 2^>nul') do (
        if not "%%i"=="[]" (
            call pm2 stop ack
        )
    )
    
    dotnet clean
    dotnet build --no-restore --no-incremental
    pm2 start %HANDSTACK_ACK% --name ack --no-autorestart
)