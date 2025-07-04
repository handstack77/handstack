#!/bin/bash

# tr -d '\r' < build.sh > build_fixed.sh && mv build_fixed.sh build.sh && chmod +x build.sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Cleaning previous builds..."
dotnet clean handstack.sln

echo "Building Infrastructure projects..."
dotnet build "3.Infrastructure/HandStack.Core/HandStack.Core.csproj" -c Debug
dotnet build "3.Infrastructure/HandStack.Data/HandStack.Data.csproj" -c Debug
dotnet build "3.Infrastructure/HandStack.Web/HandStack.Web.csproj" -c Debug

echo "Building Modules projects..."
dotnet build "2.Modules/wwwroot/wwwroot.csproj" -c Debug
dotnet build "2.Modules/dbclient/dbclient.csproj" -c Debug
dotnet build "2.Modules/function/function.csproj" -c Debug
dotnet build "2.Modules/logger/logger.csproj" -c Debug
dotnet build "2.Modules/repository/repository.csproj" -c Debug
dotnet build "2.Modules/transact/transact.csproj" -c Debug
dotnet build "2.Modules/checkup/checkup.csproj" -c Debug
dotnet build "2.Modules/openapi/openapi.csproj" -c Debug
dotnet build "2.Modules/prompter/prompter.csproj" -c Debug

echo "Building WebHost projects..."
dotnet build "1.WebHost/ack/ack.csproj" -c Debug
dotnet build "1.WebHost/forbes/forbes.csproj" -c Debug

echo "Building CLI Tools..."
dotnet build "4.Tool/CLI/handstack/handstack.csproj" -c Debug
dotnet build "4.Tool/CLI/handsonapp/handsonapp.csproj" -c Debug
dotnet build "4.Tool/CLI/edgeproxy/edgeproxy.csproj" -c Debug
dotnet build "4.Tool/CLI/excludedportrange/excludedportrange.csproj" -c Debug
dotnet build "4.Tool/CLI/bundling/bundling.csproj" -c Debug

echo "All projects built successfully."