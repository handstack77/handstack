@echo off
chcp 65001 >nul

set "module_name=wwwroot"
set "module_project=wwwroot.csproj"

REM publish.bat win build Release x64
REM publish.bat linux build Release x64
REM publish.bat osx build Release arm64
REM publish.bat win build Release x64 "..\..\..\publish\custom"

set "os_mode=%~1"
if "%os_mode%" == "" set "os_mode=win"

set "action_mode=%~2"
if "%action_mode%" == "" set "action_mode=build"

set "configuration_mode=%~3"
if "%configuration_mode%" == "" set "configuration_mode=Debug"

set "arch_mode=%~4"
if "%arch_mode%" == "" set "arch_mode=x64"

if "%HANDSTACK_SRC%" == "" (
    set "HANDSTACK_SRC=%~dp0..\.."
    for %%I in ("%HANDSTACK_SRC%") do set "HANDSTACK_SRC=%%~fI"
)

if "%HANDSTACK_HOME%" == "" set "HANDSTACK_HOME=%HANDSTACK_SRC%\..\build\handstack"

set "publish_path=%~5"
if "%publish_path%" == "" set "publish_path=%HANDSTACK_SRC%\..\publish\%os_mode%-%arch_mode%"
for %%I in ("%publish_path%") do set "publish_path=%%~fI"

if /I "%configuration_mode%" == "Debug" (
    set "optimize_flag=false"
) else (
    set "optimize_flag=true"
)

set "rid="
if /I "%os_mode%" == "win" (
    if /I "%arch_mode%" == "x64" set "rid=win-x64"
    if /I "%arch_mode%" == "x86" set "rid=win-x86"
    if /I "%arch_mode%" == "arm64" set "rid=win-arm64"
) else if /I "%os_mode%" == "linux" (
    if /I "%arch_mode%" == "x64" set "rid=linux-x64"
    if /I "%arch_mode%" == "arm64" set "rid=linux-arm64"
) else if /I "%os_mode%" == "osx" (
    if /I "%arch_mode%" == "x64" set "rid=osx-x64"
    if /I "%arch_mode%" == "arm64" set "rid=osx-arm64"
)

if "%rid%" == "" (
    echo Unsupported OS or architecture: %os_mode%/%arch_mode%
    exit /b 1
)

set "module_output=%publish_path%\handstack\modules\%module_name%"

echo module_name: %module_name%, os_mode: %os_mode%, action_mode: %action_mode%, configuration_mode: %configuration_mode%, arch_mode: %arch_mode%, optimize: %optimize_flag%, rid: %rid%, publish_path: %publish_path%

if exist "%module_output%" rmdir /s /q "%module_output%"

dotnet build -p:Optimize=%optimize_flag% --configuration %configuration_mode% "%~dp0%module_project%" --output "%module_output%"
if errorlevel 1 exit /b %errorlevel%

set "wwwroot_js_path=%module_output%\wwwroot"

if exist "%wwwroot_js_path%\lib" rmdir /s /q "%wwwroot_js_path%\lib"

del /F /Q "%wwwroot_js_path%\js\syn.bundle.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.bundle.min.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.controls.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.controls.min.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.scripts.js" 2>nul
del /F /Q "%wwwroot_js_path%\js\syn.scripts.min.js" 2>nul

for /r "%module_output%" %%f in (*.staticwebassets.endpoints.json *.staticwebassets.runtime.json) do (
    if exist "%%f" del /F /Q "%%f" 2>nul
)

for /d /r "%module_output%" %%d in (runtimes) do (
    if exist "%%d" (
        for /d %%r in ("%%d\*") do (
            if /I not "%%~nxr"=="%rid%" rmdir /s /q "%%r" 2>nul
        )
        for %%f in ("%%d\*") do (
            if not exist "%%f\" del /F /Q "%%f" 2>nul
        )
    )
)

echo Module publish completed: %module_output%
