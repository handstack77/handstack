#!/bin/bash

# tr -d '\r' < assemblies.sh > publish_fixed.sh && mv publish_fixed.sh assemblies.sh && chmod +x assemblies.sh
# assemblies.sh win x64
# assemblies.sh linux x64
# assemblies.sh osx x64
# assemblies.sh osx arm64
# assemblies.sh win x64

# win, linux, osx
os_mode=${1:-linux}

# x64, x86, arm64
arch_mode=${2:-x64}

optimize_flag="-p:Optimize=true"
if [ "$configuration_mode" == "Debug" ]; then
    optimize_flag="-p:Optimize=false"
fi

# 운영체제와 아키텍처에 따른 Runtime Identifier 설정
case "$os_mode" in
    "win")
        case "$arch_mode" in
            "x64") rid="win-x64" ;;
            "x86") rid="win-x86" ;;
            "arm64") rid="win-arm64" ;;
            *) rid="win-x64" ;;
        esac
        ;;
    "linux")
        case "$arch_mode" in
            "x64") rid="linux-x64" ;;
            "arm64") rid="linux-arm64" ;;
            *) rid="linux-x64" ;;
        esac
        ;;
    "osx")
        case "$arch_mode" in
            "x64") rid="osx-x64" ;;
            "arm64") rid="osx-arm64" ;;
            *) rid="osx-x64" ;;
        esac
        ;;
    *)
        rid="linux-x64"
        ;;
esac

echo "os_mode: $os_mode, arch_mode: $arch_mode, rid: $rid"

# 기존 출력 디렉토리 삭제
rm -rf "3.Infrastructure/Assemblies"

# post-build 스크립트의 줄바꿈 문자 수정 및 실행 권한 부여 함수
fix_post_build_script() {
    local script_path="$1"
    if [ -f "$script_path" ]; then
        tr -d '\r' < "$script_path" > "${script_path}_fixed.sh"
        mv "${script_path}_fixed.sh" "$script_path"
        chmod +x "$script_path"
    fi
}

# 모든 post-build 스크립트 수정
echo "Post-build 스크립트 줄바꿈 문자 수정 중..."
fix_post_build_script "1.WebHost/ack/post-build.sh"
fix_post_build_script "2.Modules/dbclient/post-build.sh"
fix_post_build_script "2.Modules/function/post-build.sh"
fix_post_build_script "2.Modules/logger/post-build.sh"
fix_post_build_script "2.Modules/repository/post-build.sh"
fix_post_build_script "2.Modules/transact/post-build.sh"
fix_post_build_script "2.Modules/wwwroot/post-build.sh"
fix_post_build_script "4.Tool/CLI/handstack/post-build.sh"

echo "Enabling assembly signing for build..."
node signassembly.js true

# Infrastructure 프로젝트들 빌드/퍼블리시
dotnet build --configuration Debug --arch $arch_mode --os $os_mode 3.Infrastructure/HandStack.Core/HandStack.Core.csproj --output 3.Infrastructure/Assemblies/Debug
dotnet build --configuration Debug --arch $arch_mode --os $os_mode 3.Infrastructure/HandStack.Data/HandStack.Data.csproj --output 3.Infrastructure/Assemblies/Debug
dotnet build --configuration Debug --arch $arch_mode --os $os_mode 3.Infrastructure/HandStack.Web/HandStack.Web.csproj --output 3.Infrastructure/Assemblies/Debug
dotnet build --configuration Release --arch $arch_mode --os $os_mode 3.Infrastructure/HandStack.Core/HandStack.Core.csproj --output 3.Infrastructure/Assemblies/Release
dotnet build --configuration Release --arch $arch_mode --os $os_mode 3.Infrastructure/HandStack.Data/HandStack.Data.csproj --output 3.Infrastructure/Assemblies/Release
dotnet build --configuration Release --arch $arch_mode --os $os_mode 3.Infrastructure/HandStack.Web/HandStack.Web.csproj --output 3.Infrastructure/Assemblies/Release

echo "Reverting assembly signing to False..."
node signassembly.js false
