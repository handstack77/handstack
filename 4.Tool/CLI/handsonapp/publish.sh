#!/bin/bash

# tr -d '\r' < install.sh > install_fixed.sh && mv install_fixed.sh install.sh && chmod +x install.sh
# publish.sh win build Debug x64
# publish.sh linux build Debug x64
# publish.sh osx build Debug x64
# publish.sh osx build Debug arm64

# win, linux, osx
os_mode=${1:-linux}

# build, publish
action_mode=${2:-build}

# Debug, Release
configuration_mode=${3:-Debug}

# x64, x86, arm64
arch_mode=${4:-x64}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode"

dotnet publish handsonapp.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output bin/Publish/%os_mode%-%arch_mode% -p:PublishSingleFile=true
