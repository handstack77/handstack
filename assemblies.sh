#!/bin/bash

# tr -d '\r' < assemblies.sh > publish_fixed.sh && mv publish_fixed.sh assemblies.sh && chmod +x assemblies.sh
# assemblies.sh

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
dotnet build --configuration Debug 3.Infrastructure/HandStack.Core/HandStack.Core.csproj --output 3.Infrastructure/Assemblies/Debug
dotnet build --configuration Debug 3.Infrastructure/HandStack.Data/HandStack.Data.csproj --output 3.Infrastructure/Assemblies/Debug
dotnet build --configuration Debug 3.Infrastructure/HandStack.Web/HandStack.Web.csproj --output 3.Infrastructure/Assemblies/Debug
dotnet build --configuration Release 3.Infrastructure/HandStack.Core/HandStack.Core.csproj --output 3.Infrastructure/Assemblies/Release
dotnet build --configuration Release 3.Infrastructure/HandStack.Data/HandStack.Data.csproj --output 3.Infrastructure/Assemblies/Release
dotnet build --configuration Release 3.Infrastructure/HandStack.Web/HandStack.Web.csproj --output 3.Infrastructure/Assemblies/Release

echo "Reverting assembly signing to False..."
node signassembly.js false
