#!/bin/bash

# tr -d '\r' < publish.sh > publish_fixed.sh && mv publish_fixed.sh publish.sh && chmod +x publish.sh
# publish.sh win build Debug x64
# publish.sh linux build Debug x64
# publish.sh osx build Debug x64
# publish.sh osx build Debug arm64
# publish.sh win build Debug x64 ../output/path

# win, linux, osx
os_mode=${1:-linux}

# build, publish
action_mode=${2:-build}

# Debug, Release
configuration_mode=${3:-Release}

# x64, x86, arm64
arch_mode=${4:-x64}

# Optional custom publish path
default_publish_path="${HANDSTACK_SRC}/../publish/${os_mode}-${arch_mode}"
publish_path=${5:-$default_publish_path}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode, publish_path: $publish_path"

optimize_flag="-p:Optimize=true"
if [ "$configuration_mode" == "Debug" ]; then
    optimize_flag="-p:Optimize=false"
fi

rm -rf "$publish_path"

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

dotnet $action_mode $optimize_flag 1.WebHost/ack/ack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/app"
dotnet $action_mode $optimize_flag 1.WebHost/forbes/forbes.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/forbes"
dotnet $action_mode $optimize_flag 4.Tool/CLI/handstack/handstack.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/app/cli"
dotnet $action_mode -p:Optimize=true 4.Tool/CLI/edgeproxy/edgeproxy.csproj --configuration Release --arch $arch_mode --os $os_mode --output "$publish_path/handstack/app/cli"

forbes_path="$publish_path/handstack/forbes"
mv $forbes_path/wwwroot/* $forbes_path
rm -rf $forbes_path/wwwroot
rm -f $forbes_path/*

contracts_path=${HANDSTACK_HOME}/contracts
if [ -d "$contracts_path" ]; then
    rm -rf $contracts_path/*
fi

dotnet build $optimize_flag 2.Modules/dbclient/dbclient.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/dbclient"
dotnet build $optimize_flag 2.Modules/function/function.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/function"
dotnet build $optimize_flag 2.Modules/logger/logger.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/logger"
dotnet build $optimize_flag 2.Modules/repository/repository.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/repository"
dotnet build $optimize_flag 2.Modules/transact/transact.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/transact"
dotnet build $optimize_flag 2.Modules/wwwroot/wwwroot.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/wwwroot"
dotnet build $optimize_flag 2.Modules/checkup/checkup.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/checkup"
dotnet build $optimize_flag 2.Modules/openapi/openapi.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/openapi"
dotnet build $optimize_flag 2.Modules/prompter/prompter.csproj --configuration $configuration_mode --arch $arch_mode --os $os_mode --output "$publish_path/handstack/modules/prompter"

rsync -avq ${HANDSTACK_HOME}/contracts/ "$publish_path/handstack/contracts"
rsync -av --progress ./install.* "$publish_path/handstack"
rsync -av --progress 2.Modules/function/package*.* "$publish_path/handstack"

wwwroot_js_path="$publish_path/handstack/modules/wwwroot/wwwroot"

rm -rf "$wwwroot_js_path/lib"
rm -f "$wwwroot_js_path/js/syn.bundle.js"
rm -f "$wwwroot_js_path/js/syn.bundle.min.js"
rm -f "$wwwroot_js_path/js/syn.controls.js"
rm -f "$wwwroot_js_path/js/syn.controls.min.js"
rm -f "$wwwroot_js_path/js/syn.scripts.base.js"
rm -f "$wwwroot_js_path/js/syn.scripts.base.min.js"
rm -f "$wwwroot_js_path/js/syn.scripts.js"
rm -f "$wwwroot_js_path/js/syn.scripts.min.js"

# git archive --format zip --output $HANDSTACK_SRC/../publish/handstack-src.zip master
