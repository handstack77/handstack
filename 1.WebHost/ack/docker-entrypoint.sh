#!/bin/sh
set -eu

HANDSTACK_HOME="${HANDSTACK_HOME:-/handstack}"
APP_DIR="${HANDSTACK_HOME}/app"
MODULES_DIR="${HANDSTACK_HOME}/modules"
CONTRACTS_DIR="${HANDSTACK_HOME}/contracts"
ASSEMBLIES_DIR="${HANDSTACK_HOME}/assemblies"
SEED_HOME_DIR="/opt/seed/handstack"

seed_dir_if_missing_or_empty() {
  src_dir="$1"
  dst_dir="$2"

  if [ ! -d "$src_dir" ]; then
    return 0
  fi

  mkdir -p "$dst_dir"
  if [ -z "$(ls -A "$dst_dir" 2>/dev/null)" ]; then
    cp -a "$src_dir/." "$dst_dir/"
  fi
}

mkdir -p "${HANDSTACK_HOME}"

seed_dir_if_missing_or_empty "${SEED_HOME_DIR}/app" "${APP_DIR}"
seed_dir_if_missing_or_empty "${SEED_HOME_DIR}/modules" "${MODULES_DIR}"
seed_dir_if_missing_or_empty "${SEED_HOME_DIR}/contracts" "${CONTRACTS_DIR}"
seed_dir_if_missing_or_empty "${SEED_HOME_DIR}/assemblies" "${ASSEMBLIES_DIR}"
seed_dir_if_missing_or_empty "${SEED_HOME_DIR}/node_modules" "${HANDSTACK_HOME}/node_modules"

for file_name in install.bat install.ps1 install.sh package.json package-lock.json lib.zip .install.once; do
  src_file="${SEED_HOME_DIR}/${file_name}"
  dst_file="${HANDSTACK_HOME}/${file_name}"
  if [ -f "${src_file}" ] && [ ! -f "${dst_file}" ]; then
    cp -a "${src_file}" "${dst_file}"
  fi
done

mkdir -p "${HANDSTACK_HOME}/log"
mkdir -p "${MODULES_DIR}"
mkdir -p "${CONTRACTS_DIR}"
mkdir -p "${HANDSTACK_HOME}/tenants"
mkdir -p "${HANDSTACK_HOME}/batchs"
mkdir -p "${HANDSTACK_HOME}/tmp/create_apps"

exec dotnet "${APP_DIR}/ack.dll" "$@"
