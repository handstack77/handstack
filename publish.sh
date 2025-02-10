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

# post-build.sh LF 적용 및 실행 권한 부여
tr -d '\r' < 1.WebHost/ack/post-build.sh > 1.WebHost/ack/post-build_fixed.sh && mv 1.WebHost/ack/post-build_fixed.sh 1.WebHost/ack/post-build.sh
chmod +x 1.WebHost/ack/post-build.sh

tr -d '\r' < 2.Modules/dbclient/post-build.sh > 2.Modules/dbclient/post-build_fixed.sh && mv 2.Modules/dbclient/post-build_fixed.sh 2.Modules/dbclient/post-build.sh
chmod +x 2.Modules/dbclient/post-build.sh

tr -d '\r' < 2.Modules/function/post-build.sh > 2.Modules/function/post-build_fixed.sh && mv 2.Modules/function/post-build_fixed.sh 2.Modules/function/post-build.sh
chmod +x 2.Modules/function/post-build.sh

tr -d '\r' < 2.Modules/logger/post-build.sh > 2.Modules/logger/post-build_fixed.sh && mv 2.Modules/logger/post-build_fixed.sh 2.Modules/logger/post-build.sh
chmod +x 2.Modules/logger/post-build.sh

tr -d '\r' < 2.Modules/repository/post-build.sh > 2.Modules/repository/post-build_fixed.sh && mv 2.Modules/repository/post-build_fixed.sh 2.Modules/repository/post-build.sh
chmod +x 2.Modules/repository/post-build.sh

tr -d '\r' < 2.Modules/openapi/post-build.sh > 2.Modules/openapi/post-build_fixed.sh && mv 2.Modules/openapi/post-build_fixed.sh 2.Modules/openapi/post-build.sh
chmod +x 2.Modules/openapi/post-build.sh

tr -d '\r' < 2.Modules/prompter/post-build.sh > 2.Modules/prompter/post-build_fixed.sh && mv 2.Modules/prompter/post-build_fixed.sh 2.Modules/prompter/post-build.sh
chmod +x 2.Modules/prompter/post-build.sh

tr -d '\r' < 2.Modules/transact/post-build.sh > 2.Modules/transact/post-build_fixed.sh && mv 2.Modules/transact/post-build_fixed.sh 2.Modules/transact/post-build.sh
chmod +x 2.Modules/transact/post-build.sh

tr -d '\r' < 2.Modules/wwwroot/post-build.sh > 2.Modules/wwwroot/post-build_fixed.sh && mv 2.Modules/wwwroot/post-build_fixed.sh 2.Modules/wwwroot/post-build.sh
chmod +x 2.Modules/wwwroot/post-build.sh

tr -d '\r' < 4.Tool/CLI/handstack/post-build.sh > 4.Tool/CLI/handstack/post-build_fixed.sh && mv 4.Tool/CLI/handstack/post-build_fixed.sh 4.Tool/CLI/handstack/post-build.sh
chmod +x 4.Tool/CLI/handstack/post-build.sh

dotnet $action_mode 1.WebHost/ack/ack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/app
dotnet $action_mode 1.WebHost/forbes/forbes.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/forbes
dotnet publish 4.Tool/CLI/handstack/handstack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/app/cli

forbes_path=../publish/$os_mode-$arch_mode/handstack/forbes
mv $forbes_path/wwwroot/* $forbes_path
rm -rf $forbes_path/wwwroot
rm -f $forbes_path/*

contracts_path=1.WebHost/build/handstack/contracts
if [ -d "$contracts_path" ]; then
    rm -rf $contracts_path/*
fi

dotnet build 2.Modules/dbclient/dbclient.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/dbclient
dotnet build 2.Modules/function/function.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/function
dotnet build 2.Modules/logger/logger.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/logger
dotnet build 2.Modules/repository/repository.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/repository
dotnet build 2.Modules/transact/transact.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/transact
dotnet build 2.Modules/wwwroot/wwwroot.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/wwwroot
dotnet build 2.Modules/checkup/checkup.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/checkup
dotnet build 2.Modules/openapi/openapi.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/openapi
dotnet build 2.Modules/prompter/prompter.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output ../publish/$os_mode-$arch_mode/handstack/modules/prompter

rsync -avq 1.WebHost/build/handstack/contracts/ ../publish/$os_mode-$arch_mode/handstack/contracts
rsync -av --progress ./install.* ../publish/$os_mode-$arch_mode/handstack
rsync -av --progress 2.Modules/function/package*.* ../publish/$os_mode-$arch_mode/handstack

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

tar -czf ../publish/%os_mode%-%arch_mode%.zip -C ../publish %os_mode%-%arch_mode%
zip_path=$(realpath ../publish/${os_mode}-${arch_mode}.zip)
echo $zip_path
# git archive --format zip --output ../publish/handstack-src.zip master
