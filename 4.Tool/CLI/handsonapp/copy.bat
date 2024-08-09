@echo off
chcp 65001

if "%HANDSTACK_HOME%"=="" (
    echo "HANDSTACK_HOME 환경변수가 설정되지 않았습니다. 예) setx HANDSTACK_HOME C:/projects/handstack77/handstack/1.WebHost/build/handstack"
    exit /b 1
)

set current_path=%cd%

robocopy contracts %HANDSTACK_HOME%/contracts /e /copy:dat
robocopy wwwroot %HANDSTACK_HOME%/modules/checkup/wwwroot /e /copy:dat
robocopy wwwroot/checkup/wwwroot/view %HANDSTACK_HOME%/modules/wwwroot/wwwroot/view /e /copy:dat