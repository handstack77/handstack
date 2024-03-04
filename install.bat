@echo off
chcp 65001

REM 빌드된 프로그램 기본 디렉토리에서 ack 프로그램을 실행

echo winget 설치 확인 중...
where winget.exe >nul 2>nul
if %errorlevel% neq 0 (
    echo start.bat 파일은 Windows 10 버전 1809 이상에서만 사용할 수 있습니다.
    exit /b
)

where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo .NET Core 8 설치를 시작합니다...
   winget install Microsoft.DotNet.SDK.8 -e --silent
) else (
   dotnet --version | findstr /R "^8\.0\." >nul 2>nul
   if %errorlevel% neq 0 (
      echo .NET Core 8 설치를 시작합니다...
      winget install Microsoft.DotNet.SDK.8 -e --silent
   )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js 20 설치를 시작합니다...
    winget install OpenJS.NodeJS.LTS -e --silent
) else (
   node --version | findstr /R "^v20\." >nul 2>nul
   if %errorlevel% neq 0 (
      echo Node.js 20 설치를 시작합니다...
      winget install OpenJS.NodeJS.LTS -e --silent
   )
)

where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js 기반 pm2 설치를 시작합니다...
    call npm install -g pm2
)

where gulp >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js 기반 gulp 설치를 시작합니다...
    call npm install -g gulp
)

where uglifyjs >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js 기반 uglifyjs 설치를 시작합니다...
    npm install -g uglify-js
)

set current_path=%cd%
echo current_path: %current_path% package.json 설치 확인 중...

if exist %current_path%/app/ack.dll (
   if not exist %current_path%/node_modules (
        echo function 모듈 %current_path%/package.json 설치를 시작합니다...
        call npm install
        robocopy %current_path%/app/wwwroot/assets/js node_modules/syn index.js /copy:dat
   )

   if not exist %current_path%/app/node_modules (
        echo syn.js 번들링 모듈 %current_path%/app/package.json 설치를 시작합니다...
        cd %current_path%/app
        call npm install
   )

   if not exist %current_path%/modules/wwwroot/node_modules (
        echo syn.bundle.js 모듈 %current_path%/modules/wwwroot/package.json 설치를 시작합니다...
        cd %current_path%/modules/wwwroot
        call npm install
        echo 클라이언트 라이브러리 설치를 시작합니다...
        dotnet tool install -g Microsoft.Web.LibraryManager.Cli
        libman restore
   )

   echo HandStack 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. %current_path%/app/ack.exe
)