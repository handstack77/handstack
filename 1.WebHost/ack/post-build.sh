#!/bin/bash
# chmod +x post-build.sh
# post-build.sh $(TargetDir)

target_dir=${1}

echo "target_dir: $target_dir"

if [ ! -d build/handstack/app ]; then 
    mkdir -p build/handstack/app
fi
    
rsync -av --delete $target_dir build/handstack/app
