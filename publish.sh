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

# x64, x86, arm64
trysignassembly=${5:false}

# Optional custom publish path
default_publish_path="${HANDSTACK_SRC}/../publish/${os_mode}-${arch_mode}"
publish_path=${6:$default_publish_path}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode, publish_path: $publish_path"

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

# 액션 모드에 따른 dotnet 명령어 옵션 설정
if [ "$action_mode" == "publish" ]; then
    dotnet_options="$optimize_flag --configuration $configuration_mode --arch $arch_mode --os $os_mode --runtime $rid --self-contained false"
else
    dotnet_options="$optimize_flag --configuration $configuration_mode --arch $arch_mode --os $os_mode"
fi

echo "운영체제: $os_mode, 액션모드: $action_mode, 구성모드: $configuration_mode, 아키텍처: $arch_mode, RID: $rid, 출력경로: $publish_path"

# 기존 출력 디렉토리 삭제
rm -rf "$publish_path"

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
if [ "trysignassembly" == "true" ]; then
    node signassembly.js true
fi

# WebHost 프로젝트들 빌드/퍼블리시
echo "WebHost 프로젝트 빌드/퍼블리시 중..."
dotnet $action_mode $dotnet_options 1.WebHost/ack/ack.csproj --output "$publish_path/handstack/app"
dotnet $action_mode $dotnet_options 1.WebHost/forbes/forbes.csproj --output "$publish_path/handstack/forbes"
dotnet $action_mode $dotnet_options 4.Tool/CLI/handstack/handstack.csproj --output "$publish_path/handstack/app/cli"
dotnet $action_mode -p:Optimize=true --configuration Release --runtime $rid --self-contained false 4.Tool/CLI/edgeproxy/edgeproxy.csproj --output "$publish_path/handstack/app/cli"

# Forbes 파일 처리
echo "Forbes 파일 처리 중..."
forbes_path="$publish_path/handstack/forbes"
if [ -d "$forbes_path/wwwroot" ]; then
    # wwwroot 내용을 상위 디렉토리로 이동
    if [ "$(ls -A $forbes_path/wwwroot 2>/dev/null)" ]; then
        mv "$forbes_path/wwwroot"/* "$forbes_path/" 2>/dev/null || true
    fi
    rm -rf "$forbes_path/wwwroot"
fi

# Forbes 디렉토리의 불필요한 파일들 삭제 (웹 콘텐츠만 유지)
find "$forbes_path" -maxdepth 1 -type f \( -name "*.dll" -o -name "*.exe" -o -name "*.pdb" -o -name "*.json" -o -name "*.xml" \) -delete 2>/dev/null || true

# Contracts 디렉토리 정리
contracts_path="${HANDSTACK_HOME}/contracts"
if [ -d "$contracts_path" ]; then
    rm -rf "$contracts_path"
fi

# 모듈 프로젝트들 빌드/퍼블리시
echo "모듈 프로젝트 빌드/퍼블리시 중..."
modules=(
    "2.Modules/dbclient/dbclient.csproj:dbclient"
    "2.Modules/function/function.csproj:function"
    "2.Modules/logger/logger.csproj:logger"
    "2.Modules/repository/repository.csproj:repository"
    "2.Modules/transact/transact.csproj:transact"
    "2.Modules/wwwroot/wwwroot.csproj:wwwroot"
    "2.Modules/checkup/checkup.csproj:checkup"
)

# 각 모듈을 순회하며 빌드/퍼블리시 실행
for module in "${modules[@]}"; do
    IFS=':' read -r project_path module_name <<< "$module"
    echo "$module_name 모듈 처리 중..."
    
    dotnet build $dotnet_options "$project_path" --output "$publish_path/handstack/modules/$module_name"
done

echo "Reverting assembly signing to False..."
if [ "trysignassembly" == "true" ]; then
    node signassembly.js false
fi

# 추가 파일들 복사
echo "추가 파일 복사 중..."

# Contracts 폴더가 존재하면 복사
if [ -d "${HANDSTACK_HOME}/contracts" ]; then
    rsync -avq "${HANDSTACK_HOME}/contracts/" "$publish_path/handstack/contracts/"
fi

# 설치 스크립트 파일들 복사
if ls ./install.* 1> /dev/null 2>&1; then
    rsync -av --progress ./install.* "$publish_path/handstack/"
fi

# Package 파일들 복사
if ls 2.Modules/function/package*.* 1> /dev/null 2>&1; then
    rsync -av --progress 2.Modules/function/package*.* "$publish_path/handstack/"
fi

# wwwroot JavaScript 파일 정리
echo "wwwroot JavaScript 파일 정리 중..."
wwwroot_js_path="$publish_path/handstack/modules/wwwroot/wwwroot"

if [ -d "$wwwroot_js_path" ]; then
    # lib 폴더 삭제
    rm -rf "$wwwroot_js_path/lib" 2>/dev/null || true
    
    # 특정 JavaScript 파일들 삭제
    js_files=(
        "syn.bundle.js"
        "syn.bundle.min.js"
        "syn.controls.js"
        "syn.controls.min.js"
        "syn.scripts.base.js"
        "syn.scripts.base.min.js"
        "syn.scripts.js"
        "syn.scripts.min.js"
    )
    
    for js_file in "${js_files[@]}"; do
        rm -f "$wwwroot_js_path/js/$js_file" 2>/dev/null || true
    done
fi

echo "빌드/퍼블리시가 성공적으로 완료되었습니다!"
echo "출력 디렉토리: $publish_path"

# 선택사항: 소스 아카이브 생성
# git archive --format zip --output "$HANDSTACK_SRC/../publish/handstack-src.zip" master