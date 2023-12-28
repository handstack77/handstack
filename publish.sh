#!/bin/bash

# publish.sh linux build Debug

# win, linux, osx
os_mode=${1:-linux}

# build, publish
action_mode=${2:-build}

# Debug, Release
configuration_mode=${3:-Debug}

# x64, x86, arm64
arch_mode=${4:-x64}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode"

rm -rf ../publish/$os_mode-$arch_mode/handstack
dotnet $action_mode 1.WebHost/ack/ack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/app
dotnet build 2.Modules/dbclient/dbclient.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/dbclient
dotnet build 2.Modules/function/function.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/function
dotnet build 2.Modules/logger/logger.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/logger
dotnet build 2.Modules/repository/repository.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/repository
dotnet build 2.Modules/transact/transact.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/transact
dotnet build 2.Modules/wwwroot/wwwroot.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/wwwroot
rsync -avq 1.WebHost/build/handstack/contracts ../publish/$os_mode-$arch_mode/handstack/contracts
