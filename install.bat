@echo off
chcp 65001

where winget >nul 2>nul
if %errorlevel% neq 0 (
    echo winget 패키지 관리자를 설치 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/패키지-관리자-설치하기#windows-에-winget-설치하기"
    exit /b
)

where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo .NET Core 8.0 버전이 필요합니다. 기존 dotnet 버전을 업데이트 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치"
    exit /b
)

dotnet --version | findstr /R "^8\." >nul 2>nul
if %errorlevel% neq 0 (
    echo .NET Core 8.0를 설치 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치"
    exit /b
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js v20.12.2 LTS 를 설치 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-nodejs-설치"
    exit /b
)

node --version | findstr /R "^v20\." >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js v20.12.2 LTS 가 필요합니다. 기존 node 버전을 업데이트 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-nodejs-설치"
    exit /b
)

where gulp >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js 기반 gulp CLI 도구를 설치 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#gulp-설치하기"
    exit /b
)

where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo curl CLI 를 설치 해야합니다.
    start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-curl-설치"
    exit /b
)

set current_path=%cd%
if exist %current_path%\1.WebHost\ack\ack.csproj (
    set HANDSTACK_SRC=%current_path%
    setx HANDSTACK_SRC %current_path%

    mkdir %current_path%\1.WebHost\build\handstack
    set HANDSTACK_HOME=%current_path%\1.WebHost\build\handstack
    setx HANDSTACK_HOME %current_path%\1.WebHost\build\handstack

    echo current_path: %current_path% HandStack 개발 환경 설치 확인 중...
    if not exist %current_path%\1.WebHost\ack\node_modules (
        echo syn.js 번들링 %current_path%\package.json 설치를 시작합니다...
        cd %current_path%\1.WebHost\ack
        call npm install
        gulp
        robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %current_path%\1.WebHost\build\handstack\node_modules\syn index.js /copy:dat
    )

    cd %current_path%
    robocopy %current_path%\2.Modules\function %current_path%\1.WebHost\build\handstack package*.* /copy:dat
    if not exist %current_path%\1.WebHost\build\handstack\node_modules (
        echo node.js Function 모듈 %current_path%\1.WebHost\build\handstack\package.json 설치를 시작합니다...
        cd %current_path%\1.WebHost\build\handstack
        call npm install
        robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %current_path%\1.WebHost\build\handstack\node_modules\syn index.js /copy:dat
    )
    
    cd %current_path%
    if not exist %current_path%\2.Modules\wwwroot\wwwroot\lib (
        echo handstack CLI 도구를 빌드합니다...
        dotnet publish %current_path%\4.Tool\CLI\handstack\handstack.csproj --configuration Debug --arch x64 --os win --output ../publish/win-x64/app/cli

        echo lib.zip 파일을 해제합니다...
        ..\publish\win-x64\app\cli\handstack extract --file=%current_path%\lib.zip --directory=%current_path%\2.Modules\wwwroot\wwwroot\lib
    )

    if not exist %current_path%\2.Modules\wwwroot\node_modules (
        echo syn.bundle.js 모듈 %current_path%\2.Modules\wwwroot\package.json 설치를 시작합니다...
        cd %current_path%\2.Modules\wwwroot
        call npm install
        robocopy wwwroot\lib ..\..\1.WebHost\build\handstack\modules\wwwroot\wwwroot\lib /MIR
        echo syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다...
        gulp
    )
    
    cd %current_path%
	echo current_path: %current_path%

    dotnet build handstack.sln
    
    echo HANDSTACK_SRC: %HANDSTACK_SRC%
    echo HANDSTACK_HOME: %HANDSTACK_HOME%

    echo HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr 를 참고하세요.
)

if exist %current_path%\app\ack.exe (
    echo current_path: %current_path% ack 실행 환경 설치 확인 중...
    set HANDSTACK_HOME=%current_path%
    setx HANDSTACK_HOME %current_path%

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

    if not exist %current_path%\modules\wwwroot\wwwroot\lib (
        echo 클라이언트 라이브러리 %current_path%\modules\wwwroot\wwwroot\lib 설치를 시작합니다...
        cd %current_path%\modules\wwwroot\wwwroot
        if not exist %current_path%\modules\wwwroot\wwwroot\lib.zip (
            echo lib.zip 파일을 다운로드 합니다...
            call curl -L -O https://github.com/handstack77/handstack/raw/master/lib.zip
        )
        echo lib.zip 파일을 해제합니다...
        %current_path%\app\cli\handstack extract --file=%current_path%\modules\wwwroot\wwwroot\lib.zip --directory=%current_path%\modules\wwwroot\wwwroot\lib
    )

    if not exist %current_path%\modules\wwwroot\node_modules (
        echo syn.bundle.js 모듈 %current_path%\modules\wwwroot\package.json 설치를 시작합니다...
        cd %current_path%\modules\wwwroot
        call npm install
        gulp
    )
    
    echo HANDSTACK_HOME: %HANDSTACK_HOME%

    echo ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. %current_path%\app\ack.exe
    cd %current_path%
) else (
    echo ack 실행 환경 설치 경로 확인이 필요합니다. current_path: %current_path%
    start "" "https://handstack.kr/docs/startup/빠른-시작"
)