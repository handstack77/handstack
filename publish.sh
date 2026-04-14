#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

os_mode="${1:-win}"
action_mode="${2:-build}"
configuration_mode="${3:-Release}"
arch_mode="${4:-x64}"

HANDSTACK_SRC="${HANDSTACK_SRC:-$SCRIPT_DIR}"
HANDSTACK_HOME="${HANDSTACK_HOME:-$(cd "$HANDSTACK_SRC/../build/handstack" 2>/dev/null && pwd || printf '%s\n' "$HANDSTACK_SRC/../build/handstack")}"
publish_path="${5:-$HANDSTACK_SRC/../publish/${os_mode}-${arch_mode}}"

optimize_flag="true"
if [[ "$configuration_mode" == "Debug" ]]; then
    optimize_flag="false"
fi

resolve_rid() {
    local target_os="$1"
    local target_arch="$2"

    case "$target_os" in
        win)
            case "$target_arch" in
                x64) printf '%s\n' "win-x64" ;;
                x86) printf '%s\n' "win-x86" ;;
                arm64) printf '%s\n' "win-arm64" ;;
                *) return 1 ;;
            esac
            ;;
        linux)
            case "$target_arch" in
                x64) printf '%s\n' "linux-x64" ;;
                arm64) printf '%s\n' "linux-arm64" ;;
                *) return 1 ;;
            esac
            ;;
        osx)
            case "$target_arch" in
                x64) printf '%s\n' "osx-x64" ;;
                arm64) printf '%s\n' "osx-arm64" ;;
                *) return 1 ;;
            esac
            ;;
        *)
            return 1
            ;;
    esac
}

rid="$(resolve_rid "$os_mode" "$arch_mode")" || {
    echo "지원하지 않는 OS/아키텍처 조합입니다: $os_mode/$arch_mode" >&2
    exit 1
}

invoke_dotnet() {
    dotnet "$@"
}

copy_glob_if_exists() {
    local destination_dir="$1"
    shift

    mkdir -p "$destination_dir"
    local matched=0
    local path
    for path in "$@"; do
        if [[ -e "$path" ]]; then
            cp -f "$path" "$destination_dir/"
            matched=1
        fi
    done
    return 0
}

remove_if_exists() {
    local target="$1"
    if [[ -e "$target" ]]; then
        rm -rf "$target"
    fi
}

echo "os_mode: $os_mode, action_mode: $action_mode, configuration_mode: $configuration_mode, arch_mode: $arch_mode, optimize: $optimize_flag, rid: $rid, publish_path: $publish_path"

remove_if_exists "$publish_path"

if [[ "$action_mode" == "publish" ]]; then
    dotnet_options=(-p:Optimize="$optimize_flag" --configuration "$configuration_mode" --runtime "$rid" --self-contained false)
else
    dotnet_options=(-p:Optimize="$optimize_flag" --configuration "$configuration_mode")
fi

invoke_dotnet "$action_mode" "${dotnet_options[@]}" 1.WebHost/ack/ack.csproj --output "$publish_path/handstack/app"
invoke_dotnet "$action_mode" "${dotnet_options[@]}" 1.WebHost/agent/agent.csproj --output "$publish_path/handstack/hosts/agent"
invoke_dotnet "$action_mode" "${dotnet_options[@]}" 1.WebHost/deploy/deploy.csproj --output "$publish_path/handstack/hosts/deploy"
invoke_dotnet "$action_mode" "${dotnet_options[@]}" 1.WebHost/forbes/forbes.csproj --output "$publish_path/handstack/hosts/forbes"

cli_projects=(
    "4.Tool/CLI/bundling/bundling.csproj:bundling"
    "4.Tool/CLI/dotnet-installer/dotnet-installer.csproj:dotnet-installer"
    "4.Tool/CLI/edgeproxy/edgeproxy.csproj:edgeproxy"
    "4.Tool/CLI/excludedportrange/excludedportrange.csproj:excludedportrange"
    "4.Tool/CLI/handsonapp/handsonapp.csproj:handsonapp"
    "4.Tool/CLI/handstack/handstack.csproj:handstack"
    "4.Tool/CLI/ports/ports.csproj:ports"
    "4.Tool/CLI/updater/updater.csproj:updater"
)

for item in "${cli_projects[@]}"; do
    project_path="${item%%:*}"
    project_name="${item##*:}"

    if [[ "$action_mode" == "publish" ]]; then
        invoke_dotnet "$action_mode" \
            -p:Optimize="$optimize_flag" \
            -p:PublishSingleFile=true \
            --configuration "$configuration_mode" \
            --runtime "$rid" \
            --self-contained false \
            "$project_path" \
            --output "$publish_path/handstack/tools/$project_name"
    else
        invoke_dotnet "$action_mode" \
            -p:Optimize="$optimize_flag" \
            --configuration "$configuration_mode" \
            "$project_path" \
            --output "$publish_path/handstack/tools/$project_name"
    fi
done

contracts_path="$HANDSTACK_HOME/contracts"
remove_if_exists "$contracts_path"

module_projects=(
    "2.Modules/checkup/checkup.csproj:checkup"
    "2.Modules/command/command.csproj:command"
    "2.Modules/dbclient/dbclient.csproj:dbclient"
    "2.Modules/forwarder/forwarder.csproj:forwarder"
    "2.Modules/function/function.csproj:function"
    "2.Modules/logger/logger.csproj:logger"
    "2.Modules/repository/repository.csproj:repository"
    "2.Modules/transact/transact.csproj:transact"
    "2.Modules/wwwroot/wwwroot.csproj:wwwroot"
)

for item in "${module_projects[@]}"; do
    project_path="${item%%:*}"
    module_name="${item##*:}"

    invoke_dotnet build \
        -p:Optimize="$optimize_flag" \
        --configuration "$configuration_mode" \
        "$project_path" \
        --output "$publish_path/handstack/modules/$module_name"
done

if [[ -d "$HANDSTACK_HOME/contracts" ]]; then
    mkdir -p "$publish_path/handstack/contracts"
    rsync -a "$HANDSTACK_HOME/contracts/" "$publish_path/handstack/contracts/"
fi

copy_glob_if_exists "$publish_path/handstack" "$SCRIPT_DIR"/install.*
copy_glob_if_exists "$publish_path/handstack" "$SCRIPT_DIR"/2.Modules/function/package*.*

wwwroot_js_path="$publish_path/handstack/modules/wwwroot/wwwroot"
remove_if_exists "$wwwroot_js_path/lib"

for js_file in \
    syn.bundle.js \
    syn.bundle.min.js \
    syn.controls.js \
    syn.controls.min.js \
    syn.scripts.base.js \
    syn.scripts.base.min.js \
    syn.scripts.js \
    syn.scripts.min.js; do
    rm -f "$wwwroot_js_path/js/$js_file"
done

find "$publish_path/handstack" -type f \( -name '*.staticwebassets.endpoints.json' -o -name '*.staticwebassets.runtime.json' \) -exec rm -f {} +

while IFS= read -r runtimes_dir; do
    while IFS= read -r runtime_child; do
        if [[ "$(basename "$runtime_child")" != "$rid" ]]; then
            rm -rf "$runtime_child"
        fi
    done < <(find "$runtimes_dir" -mindepth 1 -maxdepth 1 -type d)

    find "$runtimes_dir" -mindepth 1 -maxdepth 1 -type f -exec rm -f {} +
done < <(find "$publish_path/handstack" -type d -name runtimes)

if [[ -d "$HANDSTACK_SRC/3.Infrastructure/Assemblies" ]]; then
    mkdir -p "$publish_path/handstack/assemblies"
    rsync -a --delete "$HANDSTACK_SRC/3.Infrastructure/Assemblies/" "$publish_path/handstack/assemblies/"
fi

echo "빌드/퍼블리시가 성공적으로 완료되었습니다!"
echo "출력 디렉토리: $publish_path"

