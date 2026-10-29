@echo off
chcp 65001

set current_path=%cd%

REM 필수 프로그램 확인 및 자동 설치
REM 누락된 Node.js, gulp-cli, curl, .NET SDK 10 은 install.ps1 -PrerequisitesOnly 가 설치하며,
REM 관리자 권한이 필요한 설치는 UAC 확인을 한 번만 요청합니다. --check-only 를 주면 필수 프로그램을 자동 설치하지 않고 확인만 합니다.
set "PREREQUISITE_OPTIONS=-PrerequisitesOnly"
if /i "%~1"=="--check-only" set "PREREQUISITE_OPTIONS=-PrerequisitesOnly -CheckOnly"

if not exist "%current_path%\install.ps1" (
	echo install.ps1 파일을 찾을 수 없습니다. install.bat 이 있는 디렉토리에서 실행하세요.
	start "" "https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#공식-설치-안내"
	exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%current_path%\install.ps1" %PREREQUISITE_OPTIONS%
if errorlevel 1 (
	echo 필수 프로그램 설치를 완료하지 못했습니다. 출력된 오류를 확인한 뒤 다시 실행하세요.
	exit /b 1
)

REM 방금 설치한 프로그램을 이 cmd 세션에서 바로 사용하도록 레지스트리의 PATH 를 다시 읽어 현재 PATH 와 합칩니다.
for /f "usebackq delims=" %%p in (`powershell.exe -NoProfile -Command "$e=New-Object System.Collections.Generic.List[string]; foreach($v in @([Environment]::GetEnvironmentVariable('Path','Machine'),[Environment]::GetEnvironmentVariable('Path','User'),$env:Path)){ if($v){ foreach($i in $v.Split(';')){ $t=$i.Trim(); if($t -and -not $e.Contains($t)){ $e.Add($t) } } } }; [string]::Join(';',$e)"`) do set "PATH=%%p"

for %%i in ("%current_path%") do set "PARENT_DIR=%%~dpi"
set "PARENT_DIR=%PARENT_DIR:~0,-1%"

REM 환경 변수 설정
setx DOTNET_CLI_TELEMETRY_OPTOUT 1
set DOTNET_CLI_TELEMETRY_OPTOUT=1

REM 실행 모드 판별과 환경 변수 정의는 괄호 블록 밖의 한 줄 if 로 처리합니다.
REM 블록 안에서 set 한 변수를 같은 블록에서 %VAR% 로 읽으면 파싱 시점 값(클린 설치에서는 빈 값)으로 치환됩니다.
set "IS_DEV="
set "IS_RUN="
if exist "%current_path%\1.WebHost\ack\ack.csproj" set "IS_DEV=1"
if exist "%current_path%\app\ack.exe" set "IS_RUN=1"

if defined IS_DEV set "HANDSTACK_SRC=%current_path%"
if defined IS_DEV set "HANDSTACK_HOME=%PARENT_DIR%\build\handstack"
if defined IS_RUN set "HANDSTACK_HOME=%current_path%"

REM 개발 환경 설정 (ack.csproj 존재 시)
if defined IS_DEV (
    echo HANDSTACK_SRC: %HANDSTACK_SRC%
    echo HANDSTACK_HOME: %HANDSTACK_HOME%

	setx HANDSTACK_SRC "%HANDSTACK_SRC%" >nul
	setx HANDSTACK_HOME "%HANDSTACK_HOME%" >nul

	if not exist "%HANDSTACK_HOME%" mkdir "%HANDSTACK_HOME%"

	REM ack 프로젝트 node_modules 설치 및 gulp 실행
	echo syn.js 번들링 %current_path%\package.json 설치를 시작합니다...
	cd %current_path%\1.WebHost\ack
	call npm install
	call gulp

	REM 솔루션 빌드
	cd %current_path%
	echo current_path: %current_path%

	call build.bat

	REM CLI 빌드 및 lib.zip 해제
	cd %current_path%
	echo handstack CLI 도구를 빌드합니다...
	dotnet build %current_path%\4.Tool\CLI\handstack\handstack.csproj

	echo lib.zip 파일을 해제합니다...
	%HANDSTACK_HOME%\tools\handstack\handstack extract --file=%current_path%\lib.zip --directory=%current_path%\2.Modules\wwwroot\wwwroot\lib

	REM libman 확인 및 자동 설치, 라이브러리 복원
	echo libman 도구 확인 및 라이브러리 복원을 시작합니다...
	cd %current_path%\2.Modules\wwwroot

	REM libman 명령어가 PATH에 있는지 확인합니다.
	where libman >nul 2>nul
	REM %errorlevel%가 0이 아니면 libman이 설치되지 않은 것입니다.
	if errorlevel 1 (
		echo libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다...
		REM dotnet tool install 명령을 실행하여 libman을 전역으로 설치합니다.
		call dotnet tool install --global Microsoft.Web.LibraryManager.Cli
	)

	REM libman이 설치되어 있거나 방금 설치가 완료되었으므로 restore 명령을 실행합니다.
	REM echo "libman restore 명령을 실행합니다 (%cd%)..."
	REM call libman restore

	REM wwwroot 모듈 node_modules 설치 및 gulp 실행
	echo syn.bundle.js 모듈 %current_path%\2.Modules\wwwroot\package.json 설치를 시작합니다...
	cd %current_path%\2.Modules\wwwroot
	call npm install
	robocopy wwwroot\lib %HANDSTACK_HOME%\modules\wwwroot\wwwroot\lib /MIR
	echo syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다...
	call gulp

	cd %current_path%
	robocopy %current_path%\2.Modules\function %HANDSTACK_HOME% package*.* /copy:dat

	echo node.js Function 모듈 %HANDSTACK_HOME%\package.json 설치를 시작합니다...
	cd %HANDSTACK_HOME%
	call npm install
	robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %HANDSTACK_HOME%\node_modules\syn index.js /copy:dat

	cd %current_path%
	robocopy %current_path%\1.WebHost\ack\wwwroot\assets\js %HANDSTACK_HOME%\node_modules\syn index.js /copy:dat

	echo HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr/docs/startup/install/개발-환경-설정하기#빌드와-확인 를 참고하세요.
)

REM 실행 환경 설정 (ack.exe 존재 시)
if defined IS_RUN (
	echo current_path: %current_path% ack 실행 환경 설치 확인 중...

	echo HANDSTACK_HOME: %HANDSTACK_HOME%
	setx HANDSTACK_HOME "%HANDSTACK_HOME%" >nul

	REM 루트 node_modules 설치
	echo function 모듈 %current_path%\package.json 설치를 시작합니다...
	call npm install
	robocopy %current_path%\app\wwwroot\assets\js node_modules\syn index.js /copy:dat

	REM app/node_modules 설치
	echo syn.js 번들링 모듈 %current_path%\app\package.json 설치를 시작합니다...
	cd %current_path%\app
	call npm install

	REM lib.zip 다운로드 및 해제
	echo 클라이언트 라이브러리 %current_path%\modules\wwwroot\wwwroot\lib 설치를 시작합니다...
	if not exist %current_path%\modules\wwwroot\wwwroot\lib.zip (
		echo lib.zip 파일을 다운로드 합니다...
		cd %current_path%\modules\wwwroot\wwwroot
		call curl -L -O https://github.com/handstack77/handstack/raw/master/lib.zip
	)
	echo lib.zip 파일을 해제합니다...
	%HANDSTACK_HOME%\tools\handstack\handstack extract --file=%current_path%\modules\wwwroot\wwwroot\lib.zip --directory=%current_path%\modules\wwwroot\wwwroot\lib

	REM libman 확인 및 자동 설치, 라이브러리 복원
	echo libman 도구 확인 및 라이브러리 복원을 시작합니다...
	cd %current_path%\modules\wwwroot

	REM libman 명령어가 PATH에 있는지 확인합니다.
	where libman >nul 2>nul
	REM %errorlevel%가 0이 아니면 libman이 설치되지 않은 것입니다.
	if errorlevel 1 (
		echo libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다...
		REM dotnet tool install 명령을 실행하여 libman을 전역으로 설치합니다.
		call dotnet tool install --global Microsoft.Web.LibraryManager.Cli
	)

	REM libman이 설치되어 있거나 방금 설치가 완료되었으므로 restore 명령을 실행합니다.
	REM echo "libman restore 명령을 실행합니다 (%cd%)..."
	REM call libman restore

	REM modules/wwwroot/node_modules 설치 및 gulp 실행
	echo syn.bundle.js 모듈 %current_path%\modules\wwwroot\package.json 설치를 시작합니다...
	cd %current_path%\modules\wwwroot
	call npm install
	call gulp

	REM 완료 메시지
	cd %current_path%
	echo ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. %current_path%\app\ack.exe
)
