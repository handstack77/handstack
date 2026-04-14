@echo off
chcp 65001 >nul

setlocal EnableExtensions EnableDelayedExpansion

set "CONFIG=Debug"

set PROJECTS=^
"2.Modules\wwwroot\wwwroot.csproj" ^
"2.Modules\dbclient\dbclient.csproj" ^
"2.Modules\function\function.csproj" ^
"2.Modules\command\command.csproj" ^
"2.Modules\logger\logger.csproj" ^
"2.Modules\repository\repository.csproj" ^
"2.Modules\transact\transact.csproj" ^
"2.Modules\checkup\checkup.csproj" ^
"1.WebHost\ack\ack.csproj" ^
"1.WebHost\agent\agent.csproj" ^
"1.WebHost\deploy\deploy.csproj" ^
"1.WebHost\forbes\forbes.csproj" ^
"4.Tool\CLI\bundling\bundling.csproj" ^
"4.Tool\CLI\dotnet-installer\dotnet-installer.csproj" ^
"4.Tool\CLI\edgeproxy\edgeproxy.csproj" ^
"4.Tool\CLI\excludedportrange\excludedportrange.csproj" ^
"4.Tool\CLI\handsonapp\handsonapp.csproj" ^
"4.Tool\CLI\handstack\handstack.csproj" ^
"4.Tool\CLI\ports\ports.csproj" ^
"4.Tool\CLI\updater\updater.csproj"

echo Restoring solution packages...
dotnet restore handstack.sln
if errorlevel 1 goto :error

echo Cleaning solution...
dotnet clean handstack.sln
if errorlevel 1 goto :error

for %%P in (!PROJECTS!) do (
    for %%F in (%%~nP) do set "PROJECT_NAME=%%F"
    echo Building !PROJECT_NAME!...
    dotnet build %%~P -c %CONFIG%
    if errorlevel 1 goto :error
)

echo All projects built successfully.
goto :eof

:error
echo.
echo ERROR: Build failed!
exit /b 1


