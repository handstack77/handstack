@echo off
chcp 65001

REM 필수 프로그램 설치 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
	echo Node.js v20.12.2 LTS 이상 버전을 설치 해야 합니다.
	start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-nodejs-설치"
	goto :EOF
)

where gulp >nul 2>nul
if %errorlevel% neq 0 (
	echo Node.js 기반 gulp CLI 도구를 설치 해야 합니다.
	start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#gulp-설치하기"
	goto :EOF
)

where curl >nul 2>nul
if %errorlevel% neq 0 (
	echo curl CLI 를 설치 해야 합니다.
	start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-curl-설치"
	goto :EOF
)

set current_path=%cd%

for %%i in ("%current_path%") do set "PARENT_DIR=%%~dpi"
set "PARENT_DIR=%PARENT_DIR:~0,-1%"

REM 환경 변수 설정
setx DOTNET_CLI_TELEMETRY_OPTOUT 1
set DOTNET_CLI_TELEMETRY_OPTOUT=1

setx HANDSTACK_HOME "%PARENT_DIR%\build\handstack" >nul
set "HANDSTACK_HOME=%PARENT_DIR%\build\handstack"

echo HANDSTACK_HOME: %HANDSTACK_HOME%

if not exist "%HANDSTACK_HOME%" mkdir "%HANDSTACK_HOME%"

REM 개발 환경 설정 (ack.csproj 존재 시)
if exist %current_path%\1.WebHost\ack\ack.csproj (
	REM .NET Core 10.0 확인
	where dotnet >nul 2>nul
	if %errorlevel% neq 0 (
		echo .NET Core 10.0 버전을 설치 해야 합니다.
		start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치"
		goto :EOF
	)

	dotnet --version | findstr /R "^10\." >nul 2>nul
	if %errorlevel% neq 0 (
		echo .NET Core 10.0 버전을 설치 해야 합니다.
		start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#winget-을-이용한-net-core-설치"
		goto :EOF
	)

	REM ack 프로젝트 node_modules 설치 및 gulp 실행
	if not exist %current_path%\1.WebHost\ack\node_modules (
		echo syn.js 번들링 %current_path%\package.json 설치를 시작합니다...
		cd %current_path%\1.WebHost\ack
		call npm install
		gulp
	)

	REM 솔루션 빌드
	cd %current_path%
	echo current_path: %current_path%

	call build.bat

	REM CLI 빌드 및 lib.zip 해제
	cd %current_path%
	if not exist %current_path%\2.Modules\wwwroot\wwwroot\lib (
		echo handstack CLI 도구를 빌드합니다...
		dotnet publish %current_path%\4.Tool\CLI\handstack\handstack.csproj --configuration Debug --arch x64 --os win --output ../publish/win-x64/app/cli

		echo lib.zip 파일을 해제합니다...
		..\publish\win-x64\app\cli\handstack extract --file=%current_path%\lib.zip --directory=%current_path%\2.Modules\wwwroot\wwwroot\lib
	)

	REM libman 확인 및 자동 설치, 라이브러리 복원
	echo libman 도구 확인 및 라이브러리 복원을 시작합니다...
	cd %current_path%\2.Modules\wwwroot

	REM libman 명령어가 PATH에 있는지 확인합니다.
	where libman >nul 2>nul
	REM %errorlevel%가 0이 아니면 libman이 설치되지 않은 것입니다.
	if %errorlevel% neq 0 (
		echo libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다...
		REM dotnet tool install 명령을 실행하여 libman을 전역으로 설치합니다.
		call dotnet tool install --global Microsoft.Web.LibraryManager.Cli
	)

	REM libman이 설치되어 있거나 방금 설치가 완료되었으므로 restore 명령을 실행합니다.
	REM echo "libman restore 명령을 실행합니다 (%cd%)..."
	REM call libman restore

	REM wwwroot 모듈 node_modules 설치 및 gulp 실행
	if not exist %current_path%\2.Modules\wwwroot\node_modules (
		echo syn.bundle.js 모듈 %current_path%\2.Modules\wwwroot\package.json 설치를 시작합니다...
		cd %current_path%\2.Modules\wwwroot
		call npm install
		robocopy wwwroot\lib %HANDSTACK_HOME%\modules\wwwroot\wwwroot\lib /MIR
		echo syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다...
		gulp
	)

	cd %current_path%
	robocopy %current_path%\2.Modules\function %HANDSTACK_HOME% package*.* /copy:dat
	if not exist %HANDSTACK_HOME%\node_modules (
		echo node.js Function 모듈 %HANDSTACK_HOME%\package.json 설치를 시작합니다...
		cd %HANDSTACK_HOME%
		call npm install
		robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %HANDSTACK_HOME%\node_modules\syn index.js /copy:dat
	)

	cd %current_path%
	robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %HANDSTACK_HOME%\node_modules\syn index.js /copy:dat

	echo HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr 를 참고하세요.
)

REM 실행 환경 설정 (ack.exe 존재 시)
if exist %current_path%\app\ack.exe (
	echo current_path: %current_path% ack 실행 환경 설치 확인 중...

	REM 루트 node_modules 설치
	if not exist %current_path%\node_modules (
		echo function 모듈 %current_path%\package.json 설치를 시작합니다...
		call npm install
		robocopy %current_path%\app\wwwroot\assets\js node_modules\syn index.js /copy:dat
	)

	REM app/node_modules 설치
	if not exist %current_path%\app\node_modules (
		echo syn.js 번들링 모듈 %current_path%\app\package.json 설치를 시작합니다...
		cd %current_path%\app
		call npm install
	)

	REM lib.zip 다운로드 및 해제
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

	REM libman 확인 및 자동 설치, 라이브러리 복원
	echo libman 도구 확인 및 라이브러리 복원을 시작합니다...
	cd %current_path%\modules\wwwroot

	REM libman 명령어가 PATH에 있는지 확인합니다.
	where libman >nul 2>nul
	REM %errorlevel%가 0이 아니면 libman이 설치되지 않은 것입니다.
	if %errorlevel% neq 0 (
		echo libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다...
		REM dotnet tool install 명령을 실행하여 libman을 전역으로 설치합니다.
		call dotnet tool install --global Microsoft.Web.LibraryManager.Cli
	)

	REM libman이 설치되어 있거나 방금 설치가 완료되었으므로 restore 명령을 실행합니다.
	REM echo "libman restore 명령을 실행합니다 (%cd%)..."
	REM call libman restore

	REM modules/wwwroot/node_modules 설치 및 gulp 실행
	if not exist %current_path%\modules\wwwroot\node_modules (
		echo syn.bundle.js 모듈 %current_path%\modules\wwwroot\package.json 설치를 시작합니다...
		cd %current_path%\modules\wwwroot
		call npm install
		gulp
	)

	REM 완료 메시지
	cd %current_path%
	echo ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. %current_path%\app\ack.exe
)