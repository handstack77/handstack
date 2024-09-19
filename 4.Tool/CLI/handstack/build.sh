#!/bin/bash

# build.sh linux build Debug

# win, linux, osx
os_mode=${1:-linux}

# build, publish
action_mode=${2:-build}

# Debug, Release
configuration_mode=${3:-Debug}

# x64, x86, arm64
arch_mode=${4:-x64}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode"

rm -rf ~/publish/$os_mode-$arch_mode/handstack/app/cli
dotnet $action_mode handstack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ~/publish/$os_mode-$arch_mode/handstack/app/cli
