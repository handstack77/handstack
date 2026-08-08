@echo off
setlocal EnableExtensions DisableDelayedExpansion

where pwsh.exe >nul 2>&1
if errorlevel 1 goto :windowsPowerShell

pwsh.exe -NoLogo -NoProfile -File "%~dp0task.ps1" "%~1" "%~2"
goto :complete

:windowsPowerShell
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0task.ps1" "%~1" "%~2"

:complete
set "TASK_EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %TASK_EXIT_CODE%
