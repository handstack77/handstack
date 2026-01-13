@echo off
chcp 65001

REM assemblies.bat win x64
REM assemblies.bat linux x64
REM assemblies.bat osx x64
REM assemblies.bat osx arm64
REM assemblies.bat win x64

REM win, linux, osx
set os_mode=%1
if "%os_mode%" == "" set os_mode=win

REM x64, x86, arm64
set arch_mode=%2
if "%arch_mode%" == "" set arch_mode=x64

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

echo os_mode: %os_mode%, arch_mode: %arch_mode%, optimize: %optimize_flag%, rid: %rid%

rmdir /s /q 3.Infrastructure\Assemblies

echo Enabling assembly signing for build...
node signassembly.js true

REM Infrastructure 프로젝트들 빌드/퍼블리시
dotnet build --configuration Debug --arch %arch_mode% --os %os_mode% 3.Infrastructure\HandStack.Core\HandStack.Core.csproj --output 3.Infrastructure\Assemblies\Debug
dotnet build --configuration Debug --arch %arch_mode% --os %os_mode% 3.Infrastructure\HandStack.Data\HandStack.Data.csproj --output 3.Infrastructure\Assemblies\Debug
dotnet build --configuration Debug --arch %arch_mode% --os %os_mode% 3.Infrastructure\HandStack.Web\HandStack.Web.csproj --output 3.Infrastructure\Assemblies\Debug
dotnet build --configuration Release --arch %arch_mode% --os %os_mode% 3.Infrastructure\HandStack.Core\HandStack.Core.csproj --output 3.Infrastructure\Assemblies\Release
dotnet build --configuration Release --arch %arch_mode% --os %os_mode% 3.Infrastructure\HandStack.Data\HandStack.Data.csproj --output 3.Infrastructure\Assemblies\Release
dotnet build --configuration Release --arch %arch_mode% --os %os_mode% 3.Infrastructure\HandStack.Web\HandStack.Web.csproj --output 3.Infrastructure\Assemblies\Release

echo Reverting assembly signing to False...
node signassembly.js false
