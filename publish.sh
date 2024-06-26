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

rm -rf ../publish/$os_mode-$arch_mode
dotnet $action_mode 1.WebHost/ack/ack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/app
dotnet $action_mode 1.WebHost/forbes/forbes.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/forbes
dotnet publish 4.Tool/CLI/handstack/handstack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/app/cli

forbes_path=../publish/$os_mode-$arch_mode/handstack/forbes
mv $forbes_path/wwwroot $forbes_path
rm -f $forbes_path/*

contracts_path=1.WebHost/build/handstack/contracts
rm -rf $contracts_path/*

dotnet build 2.Modules/dbclient/dbclient.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/dbclient
dotnet build 2.Modules/function/function.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/function
dotnet build 2.Modules/logger/logger.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/logger
dotnet build 2.Modules/repository/repository.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/repository
dotnet build 2.Modules/transact/transact.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/transact
dotnet build 2.Modules/wwwroot/wwwroot.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/wwwroot
dotnet build 2.Modules/checkup/checkup.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/checkup
dotnet build 2.Modules/openapi/openapi.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/openapi
dotnet build 2.Modules/prompter/prompter.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/modules/prompter

rsync -avq 1.WebHost/build/handstack/contracts/ ../publish/$os_mode-$arch_mode/contracts
rsync -av --progress ./install.* ../publish/$os_mode-$arch_mode
rsync -av --progress 2.Modules/function/package*.* ../publish/$os_mode-$arch_mode

wwwroot_js_path="../publish/${os_mode}-${arch_mode}/handstack/modules/wwwroot/wwwroot"

rm -rf $wwwroot_js_path/lib
rm -f $wwwroot_js_path/js/syn.bundle.js
rm -f $wwwroot_js_path/js/syn.bundle.min.js
rm -f $wwwroot_js_path/js/syn.controls.js
rm -f $wwwroot_js_path/js/syn.controls.min.js
rm -f $wwwroot_js_path/js/syn.scripts.base.js
rm -f $wwwroot_js_path/js/syn.scripts.base.min.js
rm -f $wwwroot_js_path/js/syn.scripts.js
rm -f $wwwroot_js_path/js/syn.scripts.min.js

# git archive --format zip --output ../publish/handstack-src.zip master