@echo off
setlocal EnableExtensions

if /I "%~1"=="/?" goto :help
if /I "%~1"=="-h" goto :help
if /I "%~1"=="--help" goto :help

set "FORBES_URL=http://localhost:8420/index.html"
set "CUSTOM_DESKTOP_DIR="
set "URL_SET="

:parse_args
if "%~1"=="" goto :args_done

if /I "%~1"=="--desktop" (
    if "%~2"=="" (
        echo [ERROR] --desktop option requires a directory path.
        exit /b 1
    )
    set "CUSTOM_DESKTOP_DIR=%~2"
    shift
    shift
    goto :parse_args
)

if /I "%~1"=="-d" (
    if "%~2"=="" (
        echo [ERROR] -d option requires a directory path.
        exit /b 1
    )
    set "CUSTOM_DESKTOP_DIR=%~2"
    shift
    shift
    goto :parse_args
)

if defined URL_SET (
    echo [ERROR] Unknown option or duplicate URL: "%~1"
    echo         Use --help for usage.
    exit /b 1
)

set "FORBES_URL=%~1"
set "URL_SET=1"
shift
goto :parse_args

:args_done
for %%I in ("%cd%") do set "WORK_DIR=%%~fI"

set "EXE_PATH=%WORK_DIR%\forbes.exe"
if not exist "%EXE_PATH%" (
    echo [ERROR] forbes.exe was not found in current directory.
    echo         Path: "%EXE_PATH%"
    echo         Run this script from the forbes.exe directory.
    exit /b 1
)

set "LAUNCHER_PATH=%WORK_DIR%\run-forbes-with-browser.bat"
set "SHORTCUT_NAME=HandStack Forbes.lnk"
set "SHORTCUT_DIR="

if defined CUSTOM_DESKTOP_DIR (
    for %%I in ("%CUSTOM_DESKTOP_DIR%") do set "SHORTCUT_DIR=%%~fI"
)
set "PS1_PATH=%TEMP%\forbes-shortcut-%RANDOM%%RANDOM%.ps1"
set "RESULT_PATH=%TEMP%\forbes-shortcut-result-%RANDOM%%RANDOM%.txt"

(
    echo @echo off
    echo setlocal EnableExtensions
    echo cd /d "%WORK_DIR%"
    echo start "" "%EXE_PATH%"
    echo timeout /t 2 /nobreak ^>nul
    echo start "" "%FORBES_URL%"
    echo endlocal
) > "%LAUNCHER_PATH%"

> "%PS1_PATH%" echo $ErrorActionPreference = 'Stop'
>> "%PS1_PATH%" echo try {
>> "%PS1_PATH%" echo     $customShortcutDir = '%SHORTCUT_DIR%'
>> "%PS1_PATH%" echo     if ([string]::IsNullOrWhiteSpace($customShortcutDir)) {
>> "%PS1_PATH%" echo         $shortcutDir = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
>> "%PS1_PATH%" echo         if ([string]::IsNullOrWhiteSpace($shortcutDir)) {
>> "%PS1_PATH%" echo             $shortcutDir = (Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders' -Name Desktop -ErrorAction SilentlyContinue).Desktop
>> "%PS1_PATH%" echo             if (-not [string]::IsNullOrWhiteSpace($shortcutDir)) {
>> "%PS1_PATH%" echo                 $shortcutDir = [Environment]::ExpandEnvironmentVariables($shortcutDir)
>> "%PS1_PATH%" echo             }
>> "%PS1_PATH%" echo         }
>> "%PS1_PATH%" echo         if ([string]::IsNullOrWhiteSpace($shortcutDir)) {
>> "%PS1_PATH%" echo             $shortcutDir = (Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders' -Name Desktop -ErrorAction SilentlyContinue).Desktop
>> "%PS1_PATH%" echo         }
>> "%PS1_PATH%" echo         if ([string]::IsNullOrWhiteSpace($shortcutDir)) {
>> "%PS1_PATH%" echo             try { $shortcutDir = (New-Object -ComObject WScript.Shell).SpecialFolders.Item('Desktop') } catch {}
>> "%PS1_PATH%" echo         }
>> "%PS1_PATH%" echo         if ([string]::IsNullOrWhiteSpace($shortcutDir)) { throw 'Failed to resolve real desktop directory path.' }
>> "%PS1_PATH%" echo         $shortcutDir = [System.IO.Path]::GetFullPath($shortcutDir)
>> "%PS1_PATH%" echo     } else {
>> "%PS1_PATH%" echo         $shortcutDir = [System.IO.Path]::GetFullPath($customShortcutDir)
>> "%PS1_PATH%" echo     }
>> "%PS1_PATH%" echo.
>> "%PS1_PATH%" echo     $shortcutPath = Join-Path $shortcutDir '%SHORTCUT_NAME%'
>> "%PS1_PATH%" echo     $launcherPath = '%LAUNCHER_PATH%'
>> "%PS1_PATH%" echo     $workingDir = '%WORK_DIR%'
>> "%PS1_PATH%" echo     $iconPath = '%EXE_PATH%,0'
>> "%PS1_PATH%" echo     $resultPath = '%RESULT_PATH%'
>> "%PS1_PATH%" echo     [System.IO.Directory]::CreateDirectory($shortcutDir) ^| Out-Null
>> "%PS1_PATH%" echo     if (Test-Path -LiteralPath $shortcutPath) { Remove-Item -LiteralPath $shortcutPath -Force -ErrorAction Stop }
>> "%PS1_PATH%" echo     $wsh = New-Object -ComObject WScript.Shell
>> "%PS1_PATH%" echo     $shortcut = $wsh.CreateShortcut($shortcutPath)
>> "%PS1_PATH%" echo     $shortcut.TargetPath = $launcherPath
>> "%PS1_PATH%" echo     $shortcut.WorkingDirectory = $workingDir
>> "%PS1_PATH%" echo     $shortcut.IconLocation = $iconPath
>> "%PS1_PATH%" echo     $shortcut.Description = 'Launch forbes and open index page'
>> "%PS1_PATH%" echo     $shortcut.Save()
>> "%PS1_PATH%" echo     if (-not $?) { throw 'Shortcut save returned a failure status.' }
>> "%PS1_PATH%" echo     if (-not (Test-Path -LiteralPath $shortcutPath)) { throw 'Shortcut file was not created.' }
>> "%PS1_PATH%" echo     Set-Content -Path $resultPath -Value $shortcutPath -Encoding Oem
>> "%PS1_PATH%" echo } catch {
>> "%PS1_PATH%" echo     Write-Error $_
>> "%PS1_PATH%" echo     exit 1
>> "%PS1_PATH%" echo }

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1_PATH%"
set "PS_ERROR=%ERRORLEVEL%"
del /q "%PS1_PATH%" >nul 2>&1

if not "%PS_ERROR%"=="0" (
    echo [ERROR] Failed to create desktop shortcut.
    del /q "%RESULT_PATH%" >nul 2>&1
    exit /b 1
)

if exist "%RESULT_PATH%" (
    set /p SHORTCUT_PATH=<"%RESULT_PATH%"
    del /q "%RESULT_PATH%" >nul 2>&1
)

if "%SHORTCUT_PATH%"=="" (
    echo [ERROR] Failed to resolve shortcut path.
    exit /b 1
)

echo [OK] Desktop shortcut was created.
echo      Shortcut: "%SHORTCUT_PATH%"
echo      URL: "%FORBES_URL%"
echo      Launcher: "%LAUNCHER_PATH%"
exit /b 0

:help
echo Usage:
echo   shortcut.bat [URL] [--desktop "DIR"]
echo   shortcut.bat --desktop "DIR" [URL]
echo.
echo Examples:
echo   shortcut.bat
echo   shortcut.bat http://localhost:8420/index.html
echo   shortcut.bat --desktop "%USERPROFILE%\Desktop"
echo   shortcut.bat --desktop "%USERPROFILE%\Desktop" http://localhost:8420/index.html
exit /b 0
