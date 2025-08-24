@echo off
chcp 65001
setlocal

rem Clean previous builds
dotnet restore handstack.sln
dotnet clean handstack.sln

rem Build Infrastructure projects first
echo Enabling assembly signing for build...
node signassembly.js true

echo Building HandStack.Core...
dotnet build "3.Infrastructure\HandStack.Core\HandStack.Core.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building HandStack.Data...
dotnet build "3.Infrastructure\HandStack.Data\HandStack.Data.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building HandStack.Web...
dotnet build "3.Infrastructure\HandStack.Web\HandStack.Web.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Reverting assembly signing to False...
node signassembly.js false

rem Build Modules projects (consider their internal dependencies if any)
echo Building wwwroot...
dotnet build "2.Modules\wwwroot\wwwroot.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building dbclient...
dotnet build "2.Modules\dbclient\dbclient.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building function...
dotnet build "2.Modules\function\function.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building logger...
dotnet build "2.Modules\logger\logger.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building repository...
dotnet build "2.Modules\repository\repository.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building transact...
dotnet build "2.Modules\transact\transact.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building checkup...
dotnet build "2.Modules\checkup\checkup.csproj" -c Debug
if %errorlevel% neq 0 goto :error

rem Build WebHost projects
echo Building ack...
dotnet build "1.WebHost\ack\ack.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building forbes...
dotnet build "1.WebHost\forbes\forbes.csproj" -c Debug
if %errorlevel% neq 0 goto :error

rem Build CLI Tools (consider their internal dependencies)
echo Building handstack CLI...
dotnet build "4.Tool\CLI\handstack\handstack.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building handsonapp CLI...
dotnet build "4.Tool\CLI\handsonapp\handsonapp.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building edgeproxy CLI...
dotnet build "4.Tool\CLI\edgeproxy\edgeproxy.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building excludedportrange CLI...
dotnet build "4.Tool\CLI\excludedportrange\excludedportrange.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo Building bundling CLI...
dotnet build "4.Tool\CLI\bundling\bundling.csproj" -c Debug
if %errorlevel% neq 0 goto :error

echo All projects built successfully.
goto :eof

:error
echo.
echo ERROR: Build failed!
endlocal
exit /b 1