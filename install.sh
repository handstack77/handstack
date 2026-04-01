#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

readonly NODE_URL_MAC="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#homebrew-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-nodejs-%EC%84%A4%EC%B9%98"
readonly NODE_URL_LINUX="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#apt-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-nodejs-%EC%84%A4%EC%B9%98"
readonly CURL_URL_MAC="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#homebrew-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-curl-%EC%84%A4%EC%B9%98"
readonly CURL_URL_LINUX="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#apt-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-curl-%EC%84%A4%EC%B9%98"
readonly GULP_URL="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#gulp-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0"
readonly DOTNET_URL_MAC="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#homebrew-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-net-core-%EC%84%A4%EC%B9%98"
readonly DOTNET_URL_LINUX="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#apt-%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-net-core-%EC%84%A4%EC%B9%98"
readonly LIB_ZIP_URL="https://github.com/handstack77/handstack/raw/master/lib.zip"

is_macos() {
    [[ "$(uname -s)" == "Darwin" ]]
}

guide_url() {
    local mac_url="$1"
    local linux_url="$2"
    if is_macos; then
        printf '%s\n' "$mac_url"
    else
        printf '%s\n' "$linux_url"
    fi
}

fail_with_guide() {
    local message="$1"
    local url="$2"
    echo "$message" >&2
    echo "참고: $url" >&2
    exit 1
}

require_command() {
    local command_name="$1"
    local message="$2"
    local url="$3"
    if ! command -v "$command_name" >/dev/null 2>&1; then
        fail_with_guide "$message" "$url"
    fi
}

ensure_major_version_at_least() {
    local command_name="$1"
    local required_major="$2"
    local version_output
    version_output="$("$command_name" --version 2>/dev/null | head -n 1)"
    local major="${version_output%%.*}"
    if [[ -z "$major" || ! "$major" =~ ^[0-9]+$ || "$major" -lt "$required_major" ]]; then
        fail_with_guide ".NET Core 10.0 버전을 설치 해야 합니다. 현재 버전: ${version_output:-unknown}" "$(guide_url "$DOTNET_URL_MAC" "$DOTNET_URL_LINUX")"
    fi
}

profile_file() {
    if [[ -n "${SHELL:-}" && "${SHELL##*/}" == "zsh" ]]; then
        printf '%s\n' "$HOME/.zshrc"
    elif is_macos; then
        printf '%s\n' "$HOME/.zshrc"
    else
        printf '%s\n' "$HOME/.bashrc"
    fi
}

set_profile_export() {
    local name="$1"
    local value="$2"
    local file
    file="$(profile_file)"
    mkdir -p "$(dirname "$file")"
    touch "$file"

    local temp_file
    temp_file="$(mktemp)"

    awk -v name="$name" -v value="$value" '
        BEGIN {
            line = "export " name "=\"" value "\""
            replaced = 0
        }
        $0 ~ "^[[:space:]]*export " name "=" {
            if (!replaced) {
                print line
                replaced = 1
            }
            next
        }
        { print }
        END {
            if (!replaced) {
                print line
            }
        }
    ' "$file" > "$temp_file"

    mv "$temp_file" "$file"
}

sync_dir_contents() {
    local source_dir="$1"
    local destination_dir="$2"
    mkdir -p "$destination_dir"
    rsync -a --delete "$source_dir/" "$destination_dir/"
}

copy_if_exists() {
    local source_path="$1"
    local destination_path="$2"
    if [[ -f "$source_path" ]]; then
        mkdir -p "$(dirname "$destination_path")"
        cp -f "$source_path" "$destination_path"
    fi
}

ensure_libman() {
    if command -v libman >/dev/null 2>&1; then
        return
    fi

    echo "libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다..."
    dotnet tool install --global Microsoft.Web.LibraryManager.Cli
}

handstack_cli_path() {
    local base_path="$1"
    local candidates=(
        "$base_path/tools/handstack/handstack"
        "$base_path/tools/handstack/handstack.exe"
        "$base_path/app/cli/handstack"
        "$base_path/app/cli/handstack.exe"
    )

    local candidate
    for candidate in "${candidates[@]}"; do
        if [[ -f "$candidate" ]]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done

    return 1
}

extract_lib_zip() {
    local cli_path="$1"
    local zip_path="$2"
    local output_dir="$3"
    mkdir -p "$output_dir"
    "$cli_path" extract "--file=$zip_path" "--directory=$output_dir"
}

CURRENT_PATH="$SCRIPT_DIR"
PARENT_DIR="$(dirname "$CURRENT_PATH")"
HANDSTACK_HOME="$PARENT_DIR/handstack"

ACK_CSPROJ="$CURRENT_PATH/1.WebHost/ack/ack.csproj"
RUNTIME_ACK_DLL="$CURRENT_PATH/app/ack.dll"
RUNTIME_ACK_BINARY="$CURRENT_PATH/app/ack"

echo "필수 프로그램 설치 확인 중..."
require_command "node" "Node.js v20.12.2 LTS 이상 버전을 설치 해야 합니다." "$(guide_url "$NODE_URL_MAC" "$NODE_URL_LINUX")"
require_command "gulp" "Node.js 기반 gulp CLI 도구를 설치 해야 합니다." "$GULP_URL"
require_command "curl" "curl CLI 를 설치 해야 합니다." "$(guide_url "$CURL_URL_MAC" "$CURL_URL_LINUX")"
require_command "rsync" "rsync 가 필요합니다." "$(guide_url "$CURL_URL_MAC" "$CURL_URL_LINUX")"

export DOTNET_CLI_TELEMETRY_OPTOUT=1
set_profile_export "DOTNET_CLI_TELEMETRY_OPTOUT" "1"

if [[ -f "$ACK_CSPROJ" ]]; then
    export HANDSTACK_SRC="$CURRENT_PATH"
    export HANDSTACK_HOME="$HANDSTACK_HOME"

    echo "HANDSTACK_HOME: $HANDSTACK_HOME"
    echo "HANDSTACK_SRC: $HANDSTACK_SRC"

    set_profile_export "HANDSTACK_SRC" "$HANDSTACK_SRC"
    set_profile_export "HANDSTACK_HOME" "$HANDSTACK_HOME"

    mkdir -p "$HANDSTACK_HOME"

    require_command "dotnet" ".NET Core 10.0 버전을 설치 해야 합니다." "$(guide_url "$DOTNET_URL_MAC" "$DOTNET_URL_LINUX")"
    ensure_major_version_at_least "dotnet" 10

    ACK_DIR="$CURRENT_PATH/1.WebHost/ack"
    if [[ ! -d "$ACK_DIR/node_modules" ]]; then
        echo "syn.js 번들링 $CURRENT_PATH/package.json 설치를 시작합니다..."
        (
            cd "$ACK_DIR"
            npm install
            gulp
        )
    fi

    echo "current_path: $CURRENT_PATH"
    ./build.sh

    WWWROOT_LIB="$CURRENT_PATH/2.Modules/wwwroot/wwwroot/lib"
    if [[ ! -d "$WWWROOT_LIB" ]]; then
        echo "handstack CLI 도구를 빌드합니다..."
        dotnet build "$CURRENT_PATH/4.Tool/CLI/handstack/handstack.csproj"

        echo "lib.zip 파일을 해제합니다..."
        HANDSTACK_CLI="$(handstack_cli_path "$HANDSTACK_HOME")"
        extract_lib_zip "$HANDSTACK_CLI" "$CURRENT_PATH/lib.zip" "$WWWROOT_LIB"
    fi

    echo "libman 도구 확인 및 라이브러리 복원을 시작합니다..."
    (
        cd "$CURRENT_PATH/2.Modules/wwwroot"
        ensure_libman
    )

    WWWROOT_MODULE_DIR="$CURRENT_PATH/2.Modules/wwwroot"
    if [[ ! -d "$WWWROOT_MODULE_DIR/node_modules" ]]; then
        echo "syn.bundle.js 모듈 $CURRENT_PATH/2.Modules/wwwroot/package.json 설치를 시작합니다..."
        (
            cd "$WWWROOT_MODULE_DIR"
            npm install
            sync_dir_contents "$WWWROOT_MODULE_DIR/wwwroot/lib" "$HANDSTACK_HOME/modules/wwwroot/wwwroot/lib"
            echo "syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다..."
            gulp
        )
    fi

    copy_if_exists "$CURRENT_PATH/2.Modules/function/package.json" "$HANDSTACK_HOME/package.json"
    copy_if_exists "$CURRENT_PATH/2.Modules/function/package-lock.json" "$HANDSTACK_HOME/package-lock.json"

    if [[ ! -d "$HANDSTACK_HOME/node_modules" ]]; then
        echo "node.js Function 모듈 $HANDSTACK_HOME/package.json 설치를 시작합니다..."
        (
            cd "$HANDSTACK_HOME"
            npm install
        )
    fi

    copy_if_exists "$CURRENT_PATH/1.WebHost/ack/wwwroot/assets/js/index.js" "$HANDSTACK_HOME/node_modules/syn/index.js"

    echo "HandStack 개발 환경 설치가 완료되었습니다. Visual Studio Code 또는 터미널에서 소스를 계속 작업하세요. 자세한 정보는 https://handstack.kr 를 참고하세요."
    exit 0
fi

if [[ -f "$RUNTIME_ACK_DLL" || -f "$RUNTIME_ACK_BINARY" ]]; then
    HANDSTACK_HOME="$CURRENT_PATH"
    export HANDSTACK_HOME

    echo "current_path: $CURRENT_PATH ack 실행 환경 설치 확인 중..."
    echo "HANDSTACK_SRC: ${HANDSTACK_SRC:-}"
    echo "HANDSTACK_HOME: $HANDSTACK_HOME"

    if [[ ! -d "$CURRENT_PATH/node_modules" ]]; then
        echo "function 모듈 $CURRENT_PATH/package.json 설치를 시작합니다..."
        npm install
        copy_if_exists "$CURRENT_PATH/app/wwwroot/assets/js/index.js" "$CURRENT_PATH/node_modules/syn/index.js"
    fi

    if [[ ! -d "$CURRENT_PATH/app/node_modules" ]]; then
        echo "syn.js 번들링 모듈 $CURRENT_PATH/app/package.json 설치를 시작합니다..."
        (
            cd "$CURRENT_PATH/app"
            npm install
        )
    fi

    RUNTIME_LIB_DIR="$CURRENT_PATH/modules/wwwroot/wwwroot/lib"
    RUNTIME_LIB_ZIP="$CURRENT_PATH/modules/wwwroot/wwwroot/lib.zip"
    if [[ ! -d "$RUNTIME_LIB_DIR" ]]; then
        echo "클라이언트 라이브러리 $RUNTIME_LIB_DIR 설치를 시작합니다..."
        mkdir -p "$CURRENT_PATH/modules/wwwroot/wwwroot"

        if [[ -n "${HANDSTACK_SRC:-}" && -f "$HANDSTACK_SRC/lib.zip" && ! -f "$RUNTIME_LIB_ZIP" ]]; then
            cp -f "$HANDSTACK_SRC/lib.zip" "$RUNTIME_LIB_ZIP"
        fi

        if [[ ! -f "$RUNTIME_LIB_ZIP" ]]; then
            echo "lib.zip 파일을 다운로드 합니다..."
            (
                cd "$CURRENT_PATH/modules/wwwroot/wwwroot"
                curl -L -o lib.zip "$LIB_ZIP_URL"
            )
        fi

        echo "lib.zip 파일을 해제합니다..."
        HANDSTACK_CLI="$(handstack_cli_path "$HANDSTACK_HOME")"
        extract_lib_zip "$HANDSTACK_CLI" "$RUNTIME_LIB_ZIP" "$RUNTIME_LIB_DIR"
    fi

    echo "libman 도구 확인 및 라이브러리 복원을 시작합니다..."
    (
        cd "$CURRENT_PATH/modules/wwwroot"
        ensure_libman
    )

    if [[ ! -d "$CURRENT_PATH/modules/wwwroot/node_modules" ]]; then
        echo "syn.bundle.js 모듈 $CURRENT_PATH/modules/wwwroot/package.json 설치를 시작합니다..."
        (
            cd "$CURRENT_PATH/modules/wwwroot"
            npm install
            gulp
        )
    fi

    if [[ -f "$RUNTIME_ACK_BINARY" ]]; then
        echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $RUNTIME_ACK_BINARY"
    else
        echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $RUNTIME_ACK_DLL"
    fi
    exit 0
fi

echo "개발 환경(1.WebHost/ack/ack.csproj) 또는 실행 환경(app/ack.dll, app/ack)을 찾지 못했습니다." >&2
exit 1
