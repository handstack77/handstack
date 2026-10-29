#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --prerequisites-only: 필수 프로그램 확인·자동 설치만 수행합니다. install.ps1 이 macOS·Linux 에서 이 모드로 호출합니다.
# --check-only: 누락된 필수 프로그램을 설치하지 않고 확인만 합니다. HANDSTACK_SKIP_PREREQUISITES=1 과 같습니다.
PREREQUISITES_ONLY=0
CHECK_ONLY=0
for argument in "$@"; do
    case "$argument" in
        --prerequisites-only) PREREQUISITES_ONLY=1 ;;
        --check-only) CHECK_ONLY=1 ;;
        *)
            echo "알 수 없는 옵션입니다: $argument" >&2
            echo "사용법: install.sh [--prerequisites-only] [--check-only]" >&2
            exit 1
            ;;
    esac
done

if [[ "${HANDSTACK_SKIP_PREREQUISITES:-}" == "1" ]]; then
    CHECK_ONLY=1
fi

readonly NODE_URL_MAC="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly NODE_URL_LINUX="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly CURL_URL_MAC="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly CURL_URL_LINUX="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly GULP_URL="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly DOTNET_URL_MAC="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly DOTNET_URL_LINUX="https://handstack.kr/docs/startup/install/%ED%95%84%EC%88%98-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%84%A4%EC%B9%98%ED%95%98%EA%B8%B0#%EA%B3%B5%EC%8B%9D-%EC%84%A4%EC%B9%98-%EC%95%88%EB%82%B4"
readonly LIB_ZIP_URL="https://github.com/handstack77/handstack/raw/master/lib.zip"
readonly NODE_MIN_VERSION="20.12.2"
readonly NODE_UPGRADE_VERSION="24.0.0"
readonly NODE_BREW_FORMULA="node@24"
readonly DOTNET_CHANNEL="10.0"
readonly USER_DOTNET_ROOT="$HOME/.dotnet"

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

ensure_profile_line() {
    local line="$1"
    local file
    file="$(profile_file)"
    mkdir -p "$(dirname "$file")"
    touch "$file"
    if ! grep -Fqx "$line" "$file"; then
        printf '\n%s\n' "$line" >> "$file"
    fi
}

add_path_entry() {
    local directory="$1"
    case ":$PATH:" in
        *":$directory:"*) ;;
        *) export PATH="$directory:$PATH" ;;
    esac
}

version_at_least() {
    local -a actual_parts required_parts
    IFS=. read -r -a actual_parts <<< "$1"
    IFS=. read -r -a required_parts <<< "$2"
    local index actual_part required_part
    for index in 0 1 2; do
        actual_part="${actual_parts[index]:-0}"
        actual_part="${actual_part%%[!0-9]*}"
        required_part="${required_parts[index]:-0}"
        if (( 10#${actual_part:-0} > 10#$required_part )); then
            return 0
        fi
        if (( 10#${actual_part:-0} < 10#$required_part )); then
            return 1
        fi
    done
    return 0
}

node_version() {
    if ! command -v node >/dev/null 2>&1; then
        return 0
    fi

    local output
    output="$(node --version 2>/dev/null || true)"
    output="${output%%$'\n'*}"
    printf '%s\n' "${output#v}"
}

dotnet_list() {
    if command -v dotnet >/dev/null 2>&1; then
        dotnet "$1" 2>/dev/null || true
    fi
}

has_dotnet_sdk_10() {
    local sdks
    sdks="$(dotnet_list --list-sdks)"
    grep -Eq '^10\.0\.[0-9]+ ' <<< "$sdks"
}

has_dotnet_runtime_10() {
    local runtimes
    runtimes="$(dotnet_list --list-runtimes)"
    grep -Eq '^Microsoft\.NETCore\.App 10\.0\.[0-9]+ ' <<< "$runtimes" &&
        grep -Eq '^Microsoft\.AspNetCore\.App 10\.0\.[0-9]+ ' <<< "$runtimes"
}

# 개발 환경은 빌드에 SDK 10 이 필요하고, 실행 환경은 net10.0 framework-dependent 배포본이므로 런타임 10 이 필요합니다.
dotnet_requirement_met() {
    if [[ "$REQUIRE_DOTNET_SDK" == "1" ]]; then
        has_dotnet_sdk_10
    else
        has_dotnet_runtime_10
    fi
}

activate_user_dotnet() {
    if [[ -x "$USER_DOTNET_ROOT/dotnet" ]] && ! dotnet_requirement_met; then
        export DOTNET_ROOT="$USER_DOTNET_ROOT"
        export PATH="$USER_DOTNET_ROOT:$PATH"
        hash -r
    fi
}

can_run_as_root() {
    [[ ${EUID} -eq 0 ]] || command -v sudo >/dev/null 2>&1
}

run_as_root() {
    if [[ ${EUID} -eq 0 ]]; then
        "$@"
    elif command -v sudo >/dev/null 2>&1; then
        sudo "$@"
    else
        echo "root 권한이 필요하지만 sudo 를 찾을 수 없습니다: $*" >&2
        return 1
    fi
}

APT_UPDATED=0
apt_update_once() {
    if [[ "$APT_UPDATED" == "0" ]]; then
        run_as_root env DEBIAN_FRONTEND=noninteractive apt-get update
        APT_UPDATED=1
    fi
}

apt_install() {
    apt_update_once
    run_as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
}

ensure_homebrew() {
    if command -v brew >/dev/null 2>&1; then
        return 0
    fi

    local brew_binary
    for brew_binary in /opt/homebrew/bin/brew /usr/local/bin/brew; do
        if [[ -x "$brew_binary" ]]; then
            eval "$("$brew_binary" shellenv)"
            return 0
        fi
    done

    if ! xcode-select -p >/dev/null 2>&1; then
        fail_with_guide "Homebrew 설치에 필요한 Xcode Command Line Tools 가 없습니다. 'xcode-select --install' 로 설치를 마친 뒤 다시 실행하세요." "$(guide_url "$NODE_URL_MAC" "$NODE_URL_LINUX")"
    fi

    echo "Homebrew 를 설치합니다..."
    sudo -v
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    for brew_binary in /opt/homebrew/bin/brew /usr/local/bin/brew; do
        if [[ -x "$brew_binary" ]]; then
            eval "$("$brew_binary" shellenv)"
            ensure_profile_line "eval \"\$($brew_binary shellenv)\""
            return 0
        fi
    done

    fail_with_guide "Homebrew 설치 후 brew 실행 파일을 찾을 수 없습니다." "$(guide_url "$NODE_URL_MAC" "$NODE_URL_LINUX")"
}

nvm_directory() {
    printf '%s\n' "${NVM_DIR:-$HOME/.nvm}"
}

# nvm 이 설치되어 있고 현재 node 가 nvm 에서 실행되면 nvm 으로 설치·전환해야 PATH 앞의 이전 버전이 바뀝니다.
node_uses_nvm() {
    local directory node_path
    directory="$(nvm_directory)"
    if [[ ! -s "$directory/nvm.sh" ]]; then
        return 1
    fi

    node_path="$(command -v node 2>/dev/null || true)"
    [[ -z "$node_path" || "$node_path" == "$directory/"* ]]
}

install_node_with_nvm() {
    local major="${NODE_UPGRADE_VERSION%%.*}"
    local status=0
    echo "nvm 으로 Node.js $major LTS 최신 패치를 설치하고 기본 버전으로 지정합니다..."

    # nvm.sh 는 set -eu 상태에서 정상 동작하지 않으므로 nvm 호출 동안만 해제합니다.
    set +eu
    NVM_DIR="$(nvm_directory)"
    export NVM_DIR
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    nvm install "$major" && nvm alias default "$major"
    status=$?
    set -eu

    if [[ "$status" -ne 0 ]]; then
        echo "경고: nvm 으로 Node.js $major 설치에 실패했습니다 (종료 코드 $status)." >&2
    fi
    hash -r
}

install_node() {
    if node_uses_nvm; then
        install_node_with_nvm
        return 0
    fi

    echo "Node.js 24 LTS 최신 패치를 설치합니다..."
    if is_macos; then
        ensure_homebrew
        if brew list --versions "$NODE_BREW_FORMULA" >/dev/null 2>&1; then
            if [[ -n "$(brew outdated --quiet "$NODE_BREW_FORMULA")" ]]; then
                brew upgrade "$NODE_BREW_FORMULA"
            fi
        else
            brew install "$NODE_BREW_FORMULA"
        fi
        local node_binary_directory
        node_binary_directory="$(brew --prefix "$NODE_BREW_FORMULA")/bin"
        export PATH="$node_binary_directory:$PATH"
        ensure_profile_line "export PATH=\"$node_binary_directory:\$PATH\""
    elif command -v apt-get >/dev/null 2>&1 && can_run_as_root; then
        apt_install ca-certificates curl gnupg
        local setup_script
        setup_script="$(mktemp)"
        curl -fsSL https://deb.nodesource.com/setup_24.x -o "$setup_script"
        run_as_root bash "$setup_script"
        rm -f "$setup_script"
        apt_install nodejs
    else
        echo "이 환경에서는 Node.js 를 자동 설치할 수 없습니다." >&2
    fi
    hash -r
}

install_dotnet_sdk() {
    # 기존 dotnet 이 없는 apt 환경은 배포판 패키지를 우선 사용하고, 그 밖에는 사용자 디렉터리에 설치합니다.
    if ! is_macos && ! command -v dotnet >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1 && can_run_as_root; then
        apt_update_once
        if apt-cache show "dotnet-sdk-$DOTNET_CHANNEL" >/dev/null 2>&1; then
            echo ".NET SDK $DOTNET_CHANNEL 을 apt 패키지로 설치합니다..."
            apt_install "dotnet-sdk-$DOTNET_CHANNEL"
            hash -r
            if has_dotnet_sdk_10; then
                return 0
            fi
        fi
    fi

    echo ".NET SDK $DOTNET_CHANNEL 을 $USER_DOTNET_ROOT 에 설치합니다..."
    if command -v dotnet >/dev/null 2>&1 && [[ "$(command -v dotnet)" != "$USER_DOTNET_ROOT/dotnet" ]]; then
        echo "기존 dotnet($(command -v dotnet)) 보다 $USER_DOTNET_ROOT 를 PATH 앞에 둡니다."
    fi

    local install_script
    install_script="$(mktemp)"
    curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$install_script"
    bash "$install_script" --channel "$DOTNET_CHANNEL" --quality ga --install-dir "$USER_DOTNET_ROOT"
    rm -f "$install_script"

    export DOTNET_ROOT="$USER_DOTNET_ROOT"
    export PATH="$USER_DOTNET_ROOT:$USER_DOTNET_ROOT/tools:$PATH"
    set_profile_export "DOTNET_ROOT" "$USER_DOTNET_ROOT"
    ensure_profile_line 'export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"'
    hash -r
}

install_gulp() {
    echo "gulp-cli 를 설치합니다..."
    local prefix
    prefix="$(npm prefix --global 2>/dev/null || true)"

    local writable=0
    if [[ -n "$prefix" ]]; then
        if [[ -d "$prefix/lib/node_modules" && -w "$prefix/lib/node_modules" ]]; then
            writable=1
        elif [[ ! -d "$prefix/lib/node_modules" && -w "$prefix" ]]; then
            writable=1
        fi
    fi

    # NodeSource 처럼 전역 prefix 가 /usr 인 경우에만 root 권한으로 설치합니다.
    if [[ "$writable" == "1" ]] || ! can_run_as_root; then
        npm install --global gulp-cli
    else
        run_as_root "$(command -v npm)" install --global gulp-cli
    fi

    if [[ -n "$prefix" ]]; then
        add_path_entry "$prefix/bin"
    fi
    hash -r
}

install_missing_prerequisites() {
    local current_node="$1"
    local targets=""
    local need_curl=0 need_rsync=0 need_node=0 need_dotnet=0 need_gulp=0 need_root_node=0

    if ! command -v curl >/dev/null 2>&1; then
        need_curl=1
        targets="$targets curl"
    fi
    if [[ "$REQUIRE_RSYNC" == "1" ]] && ! command -v rsync >/dev/null 2>&1; then
        need_rsync=1
        targets="$targets rsync"
    fi
    if [[ -z "$current_node" ]] || ! version_at_least "$current_node" "$NODE_UPGRADE_VERSION"; then
        if [[ -n "$current_node" ]]; then
            echo "Node.js v$current_node 를 감지했습니다. 기존 환경에 영향을 줄 수 있는 Node.js 24 LTS 업그레이드를 진행합니다."
        fi
        need_node=1
        targets="$targets node"
        if ! node_uses_nvm; then
            need_root_node=1
        fi
    fi
    if ! dotnet_requirement_met; then
        need_dotnet=1
        targets="$targets dotnet-sdk-$DOTNET_CHANNEL"
    fi
    if ! command -v gulp >/dev/null 2>&1; then
        need_gulp=1
        targets="$targets gulp-cli"
    fi

    if [[ -z "$targets" ]]; then
        return 0
    fi

    echo "자동 설치 대상:$targets"

    # 비밀번호가 필요한 sudo 인증은 설치를 시작하기 전에 한 번만 받습니다.
    if ! is_macos && [[ ${EUID} -ne 0 ]] && command -v sudo >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
        if [[ "$need_curl$need_rsync$need_root_node" != "000" ]] || { [[ "$need_dotnet" == "1" ]] && ! command -v dotnet >/dev/null 2>&1; }; then
            sudo -v
        fi
    fi

    if is_macos; then
        if [[ "$need_curl" == "1" || "$need_rsync" == "1" ]]; then
            ensure_homebrew
        fi
        if [[ "$need_curl" == "1" ]]; then
            brew install curl
            add_path_entry "$(brew --prefix curl)/bin"
            ensure_profile_line "export PATH=\"$(brew --prefix curl)/bin:\$PATH\""
        fi
        if [[ "$need_rsync" == "1" ]]; then
            brew install rsync
        fi
    elif command -v apt-get >/dev/null 2>&1 && can_run_as_root; then
        local packages=""
        if [[ "$need_curl" == "1" ]]; then
            packages="$packages ca-certificates curl"
        fi
        if [[ "$need_rsync" == "1" ]]; then
            packages="$packages rsync"
        fi
        if [[ -n "$packages" ]]; then
            # shellcheck disable=SC2086
            apt_install $packages
        fi
    fi
    hash -r

    if [[ "$need_node" == "1" ]]; then
        install_node
        local installed_node
        installed_node="$(node_version)"
        if [[ -z "$installed_node" ]] || ! version_at_least "$installed_node" "$NODE_UPGRADE_VERSION"; then
            fail_with_guide "Node.js 24 설치 후에도 실행 버전이 24 미만입니다. 설치 오류와 PATH 또는 버전 관리 도구 설정을 확인하세요." "$(guide_url "$NODE_URL_MAC" "$NODE_URL_LINUX")"
        fi
    fi
    if [[ "$need_dotnet" == "1" ]] && command -v curl >/dev/null 2>&1; then
        install_dotnet_sdk
    fi
    if [[ "$need_gulp" == "1" ]] && command -v npm >/dev/null 2>&1; then
        install_gulp
    fi
}

assert_prerequisites() {
    local current_node
    current_node="$(node_version)"
    if [[ -z "$current_node" ]] || ! version_at_least "$current_node" "$NODE_MIN_VERSION" || ! command -v npm >/dev/null 2>&1; then
        fail_with_guide "Node.js v$NODE_MIN_VERSION LTS 이상 버전을 설치 해야 합니다." "$(guide_url "$NODE_URL_MAC" "$NODE_URL_LINUX")"
    fi
    require_command "gulp" "Node.js 기반 gulp CLI 도구를 설치 해야 합니다." "$GULP_URL"
    require_command "curl" "curl CLI 를 설치 해야 합니다." "$(guide_url "$CURL_URL_MAC" "$CURL_URL_LINUX")"
    if [[ "$REQUIRE_RSYNC" == "1" ]]; then
        require_command "rsync" "rsync 가 필요합니다." "$(guide_url "$CURL_URL_MAC" "$CURL_URL_LINUX")"
    fi

    if ! dotnet_requirement_met; then
        if [[ "$REQUIRE_DOTNET_SDK" == "1" ]]; then
            fail_with_guide ".NET SDK 10.0 버전을 설치 해야 합니다." "$(guide_url "$DOTNET_URL_MAC" "$DOTNET_URL_LINUX")"
        fi
        fail_with_guide ".NET 10.0 런타임(Microsoft.AspNetCore.App 10.0) 또는 .NET SDK 10.0 버전을 설치 해야 합니다." "$(guide_url "$DOTNET_URL_MAC" "$DOTNET_URL_LINUX")"
    fi

    if [[ "$REQUIRE_DOTNET_SDK" == "1" ]]; then
        echo "필수 프로그램 확인 완료: Node.js v$current_node, gulp-cli, curl, rsync, .NET SDK 10"
    else
        echo "필수 프로그램 확인 완료: Node.js v$current_node, gulp-cli, curl, .NET 런타임 10"
    fi
}

ensure_prerequisites() {
    activate_user_dotnet

    local current_node
    current_node="$(node_version)"

    if [[ "$CHECK_ONLY" == "0" ]]; then
        install_missing_prerequisites "$current_node"
    fi

    assert_prerequisites
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
    add_path_entry "$HOME/.dotnet/tools"
    if command -v libman >/dev/null 2>&1; then
        return
    fi

    # libman restore 는 현재 사용하지 않으므로 libman 설치 실패는 경고만 남기고 계속 진행합니다.
    if [[ -z "$(dotnet_list --list-sdks)" ]]; then
        echo "경고: .NET SDK 가 없어 libman CLI 도구 설치를 건너뜁니다." >&2
        return
    fi

    local installed_tools
    installed_tools="$(dotnet tool list --global 2>/dev/null || true)"
    if grep -Eqi '^microsoft\.web\.librarymanager\.cli ' <<< "$installed_tools"; then
        return
    fi

    echo "libman CLI 도구가 설치되어 있지 않습니다. 지금 .NET 전역 도구로 설치합니다..."
    if ! dotnet tool install --global Microsoft.Web.LibraryManager.Cli; then
        echo "경고: libman 설치 실패. libman restore 를 사용하지 않으므로 계속 진행합니다." >&2
    fi
}

handstack_cli_path() {
    local base_path="$1"
    local candidates=(
        "$base_path/tools/handstack/handstack"
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
    chmod +x "$cli_path"
    "$cli_path" extract "--file=$zip_path" "--directory=$output_dir"
}

CURRENT_PATH="$SCRIPT_DIR"
PARENT_DIR="$(dirname "$CURRENT_PATH")"
HANDSTACK_HOME="$PARENT_DIR/build/handstack"

ACK_CSPROJ="$CURRENT_PATH/1.WebHost/ack/ack.csproj"
RUNTIME_ACK_DLL="$CURRENT_PATH/app/ack.dll"
RUNTIME_ACK_BINARY="$CURRENT_PATH/app/ack"

if [[ -f "$ACK_CSPROJ" ]]; then
    REQUIRE_DOTNET_SDK=1
    REQUIRE_RSYNC=1
elif [[ -f "$RUNTIME_ACK_DLL" || -f "$RUNTIME_ACK_BINARY" ]]; then
    REQUIRE_DOTNET_SDK=0
    REQUIRE_RSYNC=0
else
    echo "개발 환경(1.WebHost/ack/ack.csproj) 또는 실행 환경(app/ack.dll, app/ack)을 찾지 못했습니다." >&2
    exit 1
fi

echo "필수 프로그램 설치 확인 중..."
ensure_prerequisites

if [[ "$PREREQUISITES_ONLY" == "1" ]]; then
    exit 0
fi

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

    ACK_DIR="$CURRENT_PATH/1.WebHost/ack"
    echo "syn.js 번들링 $CURRENT_PATH/package.json 설치를 시작합니다..."
    (
        cd "$ACK_DIR"
        npm install
        gulp
    )

    echo "current_path: $CURRENT_PATH"
    chmod +x "$CURRENT_PATH/build.sh"
    ./build.sh

    WWWROOT_LIB="$CURRENT_PATH/2.Modules/wwwroot/wwwroot/lib"
    echo "handstack CLI 도구를 빌드합니다..."
    dotnet build "$CURRENT_PATH/4.Tool/CLI/handstack/handstack.csproj"

    echo "lib.zip 파일을 해제합니다..."
    HANDSTACK_CLI="$(handstack_cli_path "$HANDSTACK_HOME")"
    extract_lib_zip "$HANDSTACK_CLI" "$CURRENT_PATH/lib.zip" "$WWWROOT_LIB"

    echo "libman 도구 확인 및 라이브러리 복원을 시작합니다..."
    (
        cd "$CURRENT_PATH/2.Modules/wwwroot"
        ensure_libman
    )

    WWWROOT_MODULE_DIR="$CURRENT_PATH/2.Modules/wwwroot"
    echo "syn.bundle.js 모듈 $CURRENT_PATH/2.Modules/wwwroot/package.json 설치를 시작합니다..."
    (
        cd "$WWWROOT_MODULE_DIR"
        npm install
        sync_dir_contents "$WWWROOT_MODULE_DIR/wwwroot/lib" "$HANDSTACK_HOME/modules/wwwroot/wwwroot/lib"
        echo "syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다..."
        gulp
    )

    copy_if_exists "$CURRENT_PATH/2.Modules/function/package.json" "$HANDSTACK_HOME/package.json"
    copy_if_exists "$CURRENT_PATH/2.Modules/function/package-lock.json" "$HANDSTACK_HOME/package-lock.json"

    echo "node.js Function 모듈 $HANDSTACK_HOME/package.json 설치를 시작합니다..."
    (
        cd "$HANDSTACK_HOME"
        npm install
    )

    copy_if_exists "$CURRENT_PATH/1.WebHost/ack/wwwroot/assets/js/index.js" "$HANDSTACK_HOME/node_modules/syn/index.js"

    echo "HandStack 개발 환경 설치가 완료되었습니다. Visual Studio Code 또는 터미널에서 소스를 계속 작업하세요. 자세한 정보는 https://handstack.kr/docs/startup/install/%EA%B0%9C%EB%B0%9C-%ED%99%98%EA%B2%BD-%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0#%EB%B9%8C%EB%93%9C%EC%99%80-%ED%99%95%EC%9D%B8 를 참고하세요."
    exit 0
fi

if [[ -f "$RUNTIME_ACK_DLL" || -f "$RUNTIME_ACK_BINARY" ]]; then
    HANDSTACK_HOME="$CURRENT_PATH"
    export HANDSTACK_HOME
    set_profile_export "HANDSTACK_HOME" "$HANDSTACK_HOME"

    echo "current_path: $CURRENT_PATH ack 실행 환경 설치 확인 중..."
    echo "HANDSTACK_SRC: ${HANDSTACK_SRC:-}"
    echo "HANDSTACK_HOME: $HANDSTACK_HOME"

    echo "function 모듈 $CURRENT_PATH/package.json 설치를 시작합니다..."
    npm install
    copy_if_exists "$CURRENT_PATH/app/wwwroot/assets/js/index.js" "$CURRENT_PATH/node_modules/syn/index.js"

    echo "syn.js 번들링 모듈 $CURRENT_PATH/app/package.json 설치를 시작합니다..."
    (
        cd "$CURRENT_PATH/app"
        npm install
    )

    RUNTIME_LIB_DIR="$CURRENT_PATH/modules/wwwroot/wwwroot/lib"
    RUNTIME_LIB_ZIP="$CURRENT_PATH/modules/wwwroot/wwwroot/lib.zip"
    echo "클라이언트 라이브러리 $RUNTIME_LIB_DIR 설치를 시작합니다..."
    mkdir -p "$CURRENT_PATH/modules/wwwroot/wwwroot"

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

    echo "libman 도구 확인 및 라이브러리 복원을 시작합니다..."
    (
        cd "$CURRENT_PATH/modules/wwwroot"
        ensure_libman
    )

    echo "syn.bundle.js 모듈 $CURRENT_PATH/modules/wwwroot/package.json 설치를 시작합니다..."
    (
        cd "$CURRENT_PATH/modules/wwwroot"
        npm install
        gulp
    )

    if [[ -f "$RUNTIME_ACK_BINARY" ]]; then
        echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $RUNTIME_ACK_BINARY"
    else
        echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $RUNTIME_ACK_DLL"
    fi
    exit 0
fi
