@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "OUT_DIR=%~1"
if "%OUT_DIR%"=="" set "OUT_DIR=C:\tmp\rdy\app"
set "ACTION_MODE=%~2"
if "%ACTION_MODE%"=="" set "ACTION_MODE=publish"

if /I "%ACTION_MODE%"=="publish" (
    set "SOURCE_DIR=bin\Release\net10.0\win-x64\publish"
) else if /I "%ACTION_MODE%"=="build" (
    set "SOURCE_DIR=bin\Debug\net10.0\win-x64"
) else (
    echo Unsupported ACTION_MODE: %ACTION_MODE%. Use publish or build.
    exit /b 2
)

pushd "%~dp0"

if /I "%ACTION_MODE%"=="publish" (
    echo [1/2] dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true
    dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true
) else (
    echo [1/2] dotnet build -c Debug -t:Rebuild -r win-x64 -p:IncludeNativeLibrariesForSelfExtract=true
    dotnet build -c Debug -t:Rebuild -r win-x64 -p:IncludeNativeLibrariesForSelfExtract=true
)

if errorlevel 1 (
    echo %ACTION_MODE% failed.
    popd
    exit /b 1
)

echo [2/2] robocopy %SOURCE_DIR% -^> "%OUT_DIR%"
robocopy "%SOURCE_DIR%" "%OUT_DIR%" /MIR
set "RC=%ERRORLEVEL%"

popd

if %RC% GEQ 8 (
    echo Copy failed with robocopy exit code %RC%.
    exit /b 1
)

echo Done. Output: %OUT_DIR%
exit /b 0
