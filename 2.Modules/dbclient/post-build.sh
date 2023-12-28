#!/bin/bash
# chmod +x post-build.sh
# post-build.sh $(TargetDir)

target_dir=${1}
configuration_name=${2}
platform_name=${3}
project_dir=${4}

echo "target_dir: $target_dir, configuration_name: $configuration_name, platform_name: $platform_name, project_dir: $project_dir"

if [ ! -d ../../1.WebHost/publish/handstack/modules/dbclient ]; then 
    mkdir -p ../../1.WebHost/publish/handstack/modules/dbclient
fi

rsync -avq "$target_dir"Contracts/ ../../1.WebHost/publish/handstack/contracts
rm -f $TargetDir/HandStack.*
rsync -avq $target_dir ../../1.WebHost/publish/handstack/modules/dbclient