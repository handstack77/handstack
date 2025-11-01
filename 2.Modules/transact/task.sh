#!/bin/bash
# tr -d '\r' < task.sh > task_fixed.sh && mv task_fixed.sh task.sh
# chmod +x task.sh
# ./task.sh copy
# ./handstack task --file=~/projects/qcn.qrame/tools/cli/qrame/task.json --value=module:build

TASK_COMMAND=$1
if [ -z "$TASK_COMMAND" ]; then
    TASK_COMMAND=""
fi

TASK_SETTING=$2
if [ -z "$TASK_SETTING" ]; then
    TASK_SETTING="development"
fi

TASK_ARGUMENTS=$3
if [ -z "$TASK_ARGUMENTS" ]; then
    TASK_ARGUMENTS=""
fi

if [ -z "$WORKING_PATH" ]; then
    WORKING_PATH=$(pwd)
fi

if [ -z "$HANDSTACK_PATH" ]; then
    HANDSTACK_PATH="$HANDSTACK_SRC"
fi

if [ -z "$HANDSTACK_PATH" ]; then
    HANDSTACK_PATH="~/projects/handstack77/handstack"
fi

if [ -z "$HANDSTACK_ACK" ]; then
    HANDSTACK_ACK="$HANDSTACK_HOME/app/ack"
fi

if [ -z "$HANDSTACK_CLI" ]; then
    HANDSTACK_CLI="$HANDSTACK_PATH/4.Tool/CLI/handstack/bin/Debug/net8.0/handstack"
fi

echo "WORKING_PATH: $WORKING_PATH"
echo "HANDSTACK_PATH: $HANDSTACK_PATH"
echo "HANDSTACK_ACK: $HANDSTACK_ACK"
echo "HANDSTACK_CLI: $HANDSTACK_CLI"
echo "TASK_COMMAND: $TASK_COMMAND"
echo "TASK_SETTING: $TASK_SETTING"

if [ "$TASK_COMMAND" == "purge" ]; then
    $HANDSTACK_CLI purgecontracts --ack=$HANDSTACK_ACK --directory=$WORKING_PATH/Contracts
fi

if [ "$TASK_COMMAND" == "run" ]; then
    $HANDSTACK_CLI configuration --ack=$HANDSTACK_ACK --appsettings=$WORKING_PATH/Settings/ack.$TASK_SETTING.json
    $HANDSTACK_ACK
fi

if [ "$TASK_COMMAND" == "copy" ]; then
    rsync -av $WORKING_PATH/Contracts/ $HANDSTACK_HOME/contracts/
    rsync -av $WORKING_PATH/Contracts/ $HANDSTACK_HOME/modules/transact/Contracts/
    rsync -av $WORKING_PATH/wwwroot/ $HANDSTACK_HOME/modules/transact/wwwroot/
fi

if [ "$TASK_COMMAND" == "devcert" ]; then
    dotnet dev-certs https -ep $HANDSTACK_HOME/ack.pfx -p 1234
    dotnet dev-certs https --trust
fi

if [ "$TASK_COMMAND" == "start" ]; then
    pm2 start $HANDSTACK_ACK --name ack --no-autorestart
fi

if [ "$TASK_COMMAND" == "stop" ]; then
    pm2 stop ack
fi

if [ "$TASK_COMMAND" == "build" ]; then
    if [ "$(pm2 id ack 2>/dev/null)" != "[]" ]; then
        pm2 stop ack
    fi
    
    dotnet clean
    dotnet build --no-restore --no-incremental
    pm2 start $HANDSTACK_ACK --name ack --no-autorestart
fi

if [ "$TASK_COMMAND" == "publish" ]; then
    dotnet build -p:Optimize=true --configuration Release
fi