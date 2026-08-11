@echo off
setlocal

set "OUT_DIR=%~1"
if "%OUT_DIR%"=="" set "OUT_DIR=C:\tmp\rdy\app"

pushd "%~dp0"

echo [1/2] dotnet build -c Debug -t:Rebuild -r win-x64 -p:IncludeNativeLibrariesForSelfExtract=true
dotnet build -c Debug -t:Rebuild -r win-x64 -p:IncludeNativeLibrariesForSelfExtract=true
if errorlevel 1 (
    echo Build failed.
    popd
    exit /b 1
)

echo [2/2] robocopy bin\Debug\net10.0\win-x64 -^> "%OUT_DIR%"
robocopy "bin\Debug\net10.0\win-x64" "%OUT_DIR%" /MIR
set "RC=%ERRORLEVEL%"

popd

if %RC% GEQ 8 (
    echo Copy failed with robocopy exit code %RC%.
    exit /b 1
)

echo Done. Output: %OUT_DIR%
exit /b 0
