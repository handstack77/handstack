@echo off
chcp 65001

REM publish.bat win build Debug x64
REM publish.bat linux build Debug x64
REM publish.bat osx build Debug x64
REM publish.bat osx build Debug arm64
REM publish.bat win build Debug x64 ..\custom-path

REM win, linux, osx
set os_mode=%1
if "%os_mode%" == "" set os_mode=win

REM build, publish
set action_mode=%2
if "%action_mode%" == "" set action_mode=build

REM Debug, Release
set configuration_mode=%3
if "%configuration_mode%" == "" set configuration_mode=Release

REM x64, x86, arm64
set arch_mode=%4
if "%arch_mode%" == "" set arch_mode=x64

REM 사용자 지정 publish 경로
set publish_path=%5
if "%publish_path%" == "" set publish_path=%HANDSTACK_SRC%\..\publish\%os_mode%-%arch_mode%

REM 설정에 따라 Optimize 옵션 설정
if "%configuration_mode%" == "Debug" (
    set optimize_flag=false
) else (
    set optimize_flag=true
)

REM Runtime Identifier 설정
if "%os_mode%" == "win" (
    if "%arch_mode%" == "x64" set rid=win-x64
    if "%arch_mode%" == "x86" set rid=win-x86
    if "%arch_mode%" == "arm64" set rid=win-arm64
) else if "%os_mode%" == "linux" (
    if "%arch_mode%" == "x64" set rid=linux-x64
    if "%arch_mode%" == "arm64" set rid=linux-arm64
) else if "%os_mode%" == "osx" (
    if "%arch_mode%" == "x64" set rid=osx-x64
    if "%arch_mode%" == "arm64" set rid=osx-arm64
)

REM dotnet 명령어 옵션 설정
if "%action_mode%" == "publish" (
    set dotnet_options=-p:Optimize=%optimize_flag% --configuration %configuration_mode% --runtime %rid% --self-contained false
) else (
    set dotnet_options=-p:Optimize=%optimize_flag% --configuration %configuration_mode% --arch %arch_mode% --os %os_mode%
)

echo os_mode: %os_mode%, action_mode: %action_mode%, configuration_mode: %configuration_mode%, arch_mode: %arch_mode%, optimize: %optimize_flag%, rid: %rid%, publish_path: %publish_path%

rmdir /s /q %publish_path%

REM WebHost 프로젝트들 빌드/퍼블리시
dotnet %action_mode% %dotnet_options% 1.WebHost\ack\ack.csproj --output %publish_path%\handstack\app
dotnet %action_mode% %dotnet_options% 1.WebHost\forbes\forbes.csproj --output %publish_path%\handstack\forbes
dotnet %action_mode% %dotnet_options% 4.Tool\CLI\handstack\handstack.csproj --output %publish_path%\handstack\app\cli

if "%action_mode%" == "publish" (
    dotnet %action_mode% -p:Optimize=%optimize_flag% --configuration %configuration_mode% --runtime %rid% --self-contained false 4.Tool\CLI\edgeproxy\edgeproxy.csproj --output %publish_path%\handstack\app\cli
) else (
    dotnet %action_mode% -p:Optimize=%optimize_flag% --configuration %configuration_mode% --arch %arch_mode% --os %os_mode% 4.Tool\CLI\edgeproxy\edgeproxy.csproj --output %publish_path%\handstack\app\cli
)

REM Forbes 파일 정리
set forbes_path=%publish_path%\handstack\forbes
if exist "%forbes_path%\wwwroot" (
    robocopy %forbes_path%\wwwroot %forbes_path% /E /MOVE
)
for %%f in ("%forbes_path%\*") do (
    if /i not "%%~nxf" == "wwwroot" (
        if exist "%%f" (
            if "%%~nxf" neq "." if "%%~nxf" neq ".." (
                del /F /Q "%%f" 2>nul
            )
        )
    )
)

REM Contracts 폴더 정리
set contracts_path=%HANDSTACK_HOME%\contracts
if exist "%contracts_path%" (
    rmdir /s /q "%contracts_path%"
)

REM 모듈 빌드 (빌드 모드에서만, 퍼블리시는 위에서 처리됨)
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\dbclient\dbclient.csproj --output %publish_path%\handstack\modules\dbclient
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\function\function.csproj --output %publish_path%\handstack\modules\function
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\logger\logger.csproj --output %publish_path%\handstack\modules\logger
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\repository\repository.csproj --output %publish_path%\handstack\modules\repository
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\transact\transact.csproj --output %publish_path%\handstack\modules\transact
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\wwwroot\wwwroot.csproj --output %publish_path%\handstack\modules\wwwroot
dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% 2.Modules\checkup\checkup.csproj --output %publish_path%\handstack\modules\checkup

REM 파일 복사
if exist "%HANDSTACK_HOME%\contracts" (
    robocopy %HANDSTACK_HOME%\contracts %publish_path%\handstack\contracts /s /e /copy:dat
)
robocopy . %publish_path%\handstack install.* /copy:dat
robocopy 2.Modules\function %publish_path%\handstack package*.* /copy:dat

REM wwwroot 정리
set wwwroot_js_path=%publish_path%\handstack\modules\wwwroot\wwwroot

if exist "%wwwroot_js_path%\lib" (
    rmdir /s /q "%wwwroot_js_path%\lib"
)

del /F /Q "%wwwroot_js_path%\js\syn.bundle.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.bundle.min.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.controls.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.controls.min.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.scripts.base.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.scripts.base.min.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.scripts.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.scripts.min.js" 2>nul

for /r "%publish_path%\handstack" %%f in (*.staticwebassets.endpoints.json *.staticwebassets.runtime.json) do (
    if exist "%%f" (
        del /F /Q "%%f" 2>nul
    )
)

REM runtimes 디렉토리 정리: win-x64 linux-x64 osx-x64만 유지
for /d /r "%publish_path%\handstack" %%d in (runtimes) do (
    if exist "%%d" (
        for /d %%r in (%%d\*) do (
            if /I not "%%~nxr"=="win-x64" if /I not "%%~nxr"=="linux-x64" if /I not "%%~nxr"=="osx-x64" (
                rmdir /s /q "%%r" 2>nul
            )
        )
        for %%f in (%%d\*) do (
            if not exist "%%f\" del /F /Q "%%f" 2>nul
        )
    )
)

robocopy %HANDSTACK_SRC%/3.Infrastructure/Assemblies %publish_path%/handstack/assemblies /MIR /NFL /NDL /NJH /NJS /NC /NS /NP

echo "빌드/퍼블리시가 성공적으로 완료되었습니다!"
echo "출력 디렉토리: %publish_path%"

REM git archive --format zip --output %HANDSTACK_SRC%\..\publish\handstack-src.zip master
