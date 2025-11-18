#!/bin/bash

# tr -d '\r' < env.sh > env_fixed.sh && mv env_fixed.sh env.sh && chmod +x env.sh

current_path=$(pwd)

# 환경 변수 설정
if [[ "$OSTYPE" == "darwin"* ]]; then
    sudo chown -R $(whoami) ~/.npm
    PROFILE_FILE="$HOME/.zshrc"
else
    PROFILE_FILE="$HOME/.bashrc"
fi

# DOTNET_CLI_TELEMETRY_OPTOUT 설정
export DOTNET_CLI_TELEMETRY_OPTOUT=1
if ! grep -q "DOTNET_CLI_TELEMETRY_OPTOUT" "$PROFILE_FILE"; then
    echo 'export DOTNET_CLI_TELEMETRY_OPTOUT=1' >> "$PROFILE_FILE"
fi

# HANDSTACK_SRC 설정 (중복 제거 후 추가)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/export HANDSTACK_SRC=/d' "$PROFILE_FILE"
else
    sed -i '/export HANDSTACK_SRC=/d' "$PROFILE_FILE"
fi
echo "export HANDSTACK_SRC=\"$current_path\"" >> "$PROFILE_FILE"
export HANDSTACK_SRC="$current_path"

# PARENT_DIR 계산
PARENT_DIR="$(dirname "$current_path")"

# HANDSTACK_HOME 설정
HANDSTACK_HOME="$PARENT_DIR/build/handstack"
mkdir -p "$HANDSTACK_HOME"

# HANDSTACK_HOME 환경 변수 설정 (중복 제거 후 추가)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/export HANDSTACK_HOME=/d' "$PROFILE_FILE"
else
    sed -i '/export HANDSTACK_HOME=/d' "$PROFILE_FILE"
fi
echo "export HANDSTACK_HOME=\"$HANDSTACK_HOME\"" >> "$PROFILE_FILE"
export HANDSTACK_HOME="$HANDSTACK_HOME"

echo "HANDSTACK_SRC: $HANDSTACK_SRC"
echo "HANDSTACK_HOME: $HANDSTACK_HOME"