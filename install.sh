#!/bin/bash
# chmod +x /home/handstack/install.sh
# 빌드된 프로그램 기본 디렉토리에서 ack 프로그램을 실행

echo "dotnet 및 node.js 설치 확인 중..."
if ! dotnet --version | grep -q "^8\.0\."
then
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    sudo apt-get update
    sudo apt-get install -y apt-transport-https
    sudo apt-get update
    sudo apt-get install -y dotnet-sdk-8.0
fi

if ! node --version | grep -q "^v20\."
then
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
    sudo apt-get update
    sudo apt-get install -y nodejs
fi

echo "node.js 기반 pm2, gulp, uglifyjs 설치 확인 중..."
if ! pm2 --version | grep -q "^5\."
then
    echo "call install -g pm2"
    npm install -g pm2
fi

if ! gulp --version | grep -q "^CLI version"
then
    echo "install -g gulp"
    npm install -g gulp
fi

if ! uglifyjs --version | grep -q "^uglify-js"
then
    echo "install -g uglify-js"
    npm install -g uglify-js
fi

echo "node.js 기반 package.json 설치 확인 중..."
current_path=$(pwd)
echo "current_path: $current_path"

if [ -f "$current_path/app/ack.dll" ]; then
    if [ ! -d "$current_path/node_modules" ]; then
        echo "function 모듈 $current_path/package.json 설치"
        npm install
        rsync -av --progress --exclude='*' --include='index.js' %current_path%/app/wwwroot/assets/js/ node_modules/syn/
    fi

    if [ ! -d "$current_path/app/node_modules" ]; then
        echo "syn.js 번들링 모듈 $current_path/app/package.json 설치"
        cd $current_path/app
        npm install
    fi

    if [ ! -d "$current_path/modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/modules/wwwroot/package.json 설치"
        cd $current_path/modules/wwwroot
        npm install
    fi

    # cd $current_path
    # dotnet $current_path/app/ack.dll
fi
