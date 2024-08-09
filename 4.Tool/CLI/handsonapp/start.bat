@echo off
chcp 65001

if "%HANDSTACK_HOME%"=="" (
    echo "HANDSTACK_HOME 환경변수가 설정되지 않았습니다. 예) setx HANDSTACK_HOME C:/projects/handstack77/handstack/1.WebHost/build/handstack"
    exit /b 1
)

handsonapp.exe --workingDirectory [startapp]