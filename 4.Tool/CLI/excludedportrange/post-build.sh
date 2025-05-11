#!/bin/bash
# chmod +x post-build.sh
# ./post-build.sh win build Debug x64

if [ "$BUILD_COMPLETED" == "true" ]; then
    echo "Build already completed, skipping..."
    exit 0
fi
export BUILD_COMPLETED=true

# os_mode: win, linux, osx
os_mode=${1:-win}

# action_mode: build, publish
action_mode=${2:-build}

# configuration_mode: Debug, Release
configuration_mode=${3:-Debug}

# arch_mode: x64, x86, arm64
arch_mode=${4:-x64}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode"

dotnet publish excludedportrange.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../../../1.WebHost/build/handstack/app/cli