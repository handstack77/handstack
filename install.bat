@echo off
chcp 65001

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

echo dotnet tool libman 설치를 시작합니다...
dotnet tool install -g Microsoft.Web.LibraryManager.Cli

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

if exist %current_path%\1.WebHost\ack\ack.csproj (
    mkdir %current_path%\1.WebHost\build\handstack
    cd %current_path%\1.WebHost\ack
    echo current_path: %current_path% HandStack 개발 환경 설치 확인 중...
    if not exist %current_path%\node_modules (
        echo syn.js 번들링 %current_path%\package.json 설치를 시작합니다...
        call npm install
        gulp
        robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %current_path%\1.WebHost\build\handstack\node_modules\syn index.js /copy:dat
    )

    cd %current_path%
    if not exist %%current_path%\1.WebHost\build\handstack\node_modules (
        robocopy %current_path%\2.Modules\function %current_path%\1.WebHost\build\handstack package*.* /copy:dat
        echo node.js Function 모듈 %current_path%\1.WebHost\build\handstack\package.json 설치를 시작합니다...
        cd %current_path%\1.WebHost\build\handstack
        call npm install
    )
    
    cd %current_path%
    if not exist %current_path%\2.Modules\wwwroot\node_modules (
        echo syn.bundle.js 모듈 %current_path%\2.Modules\wwwroot\package.json 설치를 시작합니다...
        cd %current_path%\2.Modules\wwwroot
        call npm install
        libman restore
        echo syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다...
        gulp
        gulp base
        gulp bundle
    )
    
    cd %current_path%
    dotnet build handstack.sln

    set build_path=%current_path%\1.WebHost\build\handstack
    cd %build_path%
    echo function 모듈 %build_path%\package.json 설치를 시작합니다...
    call npm install
    robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %build_path%\node_modules\syn index.js /copy:dat
    echo HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr 를 참고하세요.
)

echo %current_path%
if exist %current_path%\app\ack.dll (
    echo current_path: %current_path% ack 실행 환경 설치 확인 중...
    if not exist %current_path%\node_modules (
        echo function 모듈 %current_path%\package.json 설치를 시작합니다...
        call npm install
        robocopy %current_path%\app\wwwroot\assets\js node_modules\syn index.js /copy:dat
    )

    if not exist %current_path%\app\node_modules (
        echo syn.js 번들링 모듈 %current_path%\app\package.json 설치를 시작합니다...
        cd %current_path%\app
        call npm install
    )

    if not exist %current_path%\modules\wwwroot\node_modules (
        echo syn.bundle.js 모듈 %current_path%\modules\wwwroot\package.json 설치를 시작합니다...
        cd %current_path%\modules\wwwroot
        call npm install
        libman restore
        echo syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다... 호스트 사양에 따라 2~3분 정도 소요됩니다.
        gulp
        gulp base
        gulp bundle
    )

    echo ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. %current_path%\app\ack.exe
    cd %current_path%\app
)