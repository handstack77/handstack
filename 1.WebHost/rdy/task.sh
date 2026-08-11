#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(
    CDPATH= cd -P "$(dirname "$0")" >/dev/null 2>&1
    pwd
)

if ! command -v pwsh >/dev/null 2>&1; then
    echo "오류: PowerShell 7 이상(pwsh)이 필요합니다." >&2
    exit 127
fi

exec pwsh -NoLogo -NoProfile -File "$SCRIPT_DIR/task.ps1" "$@"
