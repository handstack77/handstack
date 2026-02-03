@echo off
chcp 65001

REM assemblies.bat

rmdir /s /q 3.Infrastructure\Assemblies

echo Enabling assembly signing for build...
node signassembly.js true

REM Infrastructure 프로젝트들 빌드/퍼블리시
dotnet build --configuration Debug 3.Infrastructure\HandStack.Core\HandStack.Core.csproj --output 3.Infrastructure\Assemblies\Debug
dotnet build --configuration Debug 3.Infrastructure\HandStack.Data\HandStack.Data.csproj --output 3.Infrastructure\Assemblies\Debug
dotnet build --configuration Debug 3.Infrastructure\HandStack.Web\HandStack.Web.csproj --output 3.Infrastructure\Assemblies\Debug
dotnet build --configuration Release 3.Infrastructure\HandStack.Core\HandStack.Core.csproj --output 3.Infrastructure\Assemblies\Release
dotnet build --configuration Release 3.Infrastructure\HandStack.Data\HandStack.Data.csproj --output 3.Infrastructure\Assemblies\Release
dotnet build --configuration Release 3.Infrastructure\HandStack.Web\HandStack.Web.csproj --output 3.Infrastructure\Assemblies\Release

echo Reverting assembly signing to False...
node signassembly.js false
