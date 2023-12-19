@echo off
chcp 65001

REM 빌드된 프로그램 기본 디렉토리(C:/home/handstack)에서 ack 프로그램을 실행

echo winget 설치 확인 중...
where winget.exe >nul 2>nul
if %errorlevel% neq 0 (
    echo start.bat 파일은 Windows 10 버전 1809 이상에서만 사용할 수 있습니다.
    exit /b
)

echo dotnet 및 node.js 설치 확인 중...

dotnet --version | findstr /R "^8\.0\." >nul 2>nul
if %errorlevel% neq 0 (
	winget install Microsoft.DotNet.SDK.8 -e --silent
)

node --version | findstr /R "^v20\." >nul 2>nul
if %errorlevel% neq 0 (
    winget install OpenJS.NodeJS.LTS -e --silent
)

echo node.js 기반 pm2, gulp, uglifyjs 설치 확인 중...
pm2 --version | findstr /R "^5\." >nul 2>nul
if %errorlevel% neq 0 (
	echo call install -g pm2
    call npm install -g pm2
)

gulp --version | findstr /R "^CLI version" >nul 2>nul
if %errorlevel% neq 0 (
    echo install -g gulp
    npm install -g gulp
)

uglifyjs --version | findstr /R "^uglify-js" >nul 2>nul
if %errorlevel% neq 0 (
    echo install -g uglify-js
    npm install -g uglify-js
)

echo node.js 기반 package.json 설치 확인 중...

set current_path=%cd%

echo current_path: %current_path%

if exist %current_path%/app/ack.dll (
	if not exist %current_path%/node_modules (
		echo function 모듈 %current_path%/package.json 설치
		call npm install
	)

	if not exist %current_path%/app/node_modules (
		echo syn.js 번들링 모듈 %current_path%/app/package.json 설치
		cd %current_path%/app
		call npm install
	)

	if not exist %current_path%/modules/wwwroot/node_modules (
		echo syn.bundle.js 모듈 %current_path%/modules/wwwroot/package.json 설치
		cd %current_path%/modules/wwwroot
		call npm install
	)

	cd %current_path%
	call dotnet %current_path%/app/ack.dll
)