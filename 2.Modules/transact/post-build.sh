#!/bin/bash
# chmod +x post-build.sh
# post-build.sh $(TargetDir)

target_dir=${1}
configuration_name=${2}
platform_name=${3}
project_dir=${4}

echo "HANDSTACK_HOME: $HANDSTACK_HOME"
echo "target_dir: $target_dir"
echo "configuration_name: $configuration_name"
echo "platform_name: $platform_name"
echo "project_dir: $project_dir"

if [ ! -d $HANDSTACK_SRC/../build/handstack/modules/transact ]; then 
    mkdir -p $HANDSTACK_SRC/../build/handstack/modules/transact
fi

rm -f $target_dir/HandStack.*
rsync -avq --delete $target_dir $HANDSTACK_SRC/../build/handstack/modules/transact