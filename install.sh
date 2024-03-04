#!/bin/bash
# chmod +x /home/handstack/install.sh
# 빌드된 프로그램 기본 디렉토리에서 ack 프로그램을 실행

dotnet_path=$(which dotnet)
if [ ! -n "$dotnet_path" ]; then
    echo ".NET Core 8 설치를 시작합니다..."
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    sudo apt-get update
    sudo apt-get install -y apt-transport-https
    sudo apt-get update
    sudo apt-get install -y dotnet-sdk-8.0
else
    dotnet_version=$(dotnet --version | grep -E "^8\.")
    if [ ! -n "$dotnet_version" ]; then
        echo ".NET Core 8 설치를 시작합니다..."
        wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
        sudo dpkg -i packages-microsoft-prod.deb
        sudo apt-get update
        sudo apt-get install -y apt-transport-https
        sudo apt-get update
        sudo apt-get install -y dotnet-sdk-8.0
    fi
fi

node_path=$(which node)
if [ ! -n "$node_path" ]; then
    echo "Node.js 20 설치를 시작합니다..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
    sudo apt-get update
    sudo apt-get install -y nodejs
else
    node_version=$(node --version | grep -E "^v20\.")
    if [ ! -n "$node_version" ]; then
        echo "Node.js 20 설치를 시작합니다..."
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
        echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
        sudo apt-get update
        sudo apt-get install -y nodejs
    fi
fi

pm2_path=$(which pm2)
if [ ! -n "pm2_path" ]; then
    echo "Node.js 기반 pm2 설치를 시작합니다..."
    npm install -g pm2
fi

gulp_path=$(which gulp)
if [ ! -n "gulp_path" ]; then
    echo "Node.js 기반 gulp 설치를 시작합니다..."
    npm install -g gulp
fi

uglifyjs_path=$(which uglifyjs)
if [ ! -n "uglifyjs_path" ]; then
    echo "Node.js 기반 uglifyjs 설치를 시작합니다..."
    npm install -g uglify-js
fi

current_path=$(pwd)
echo "current_path: $current_path node.js 기반 package.json 설치 확인 중..."

if [ -f "$current_path/app/ack.dll" ]; then
    if [ ! -d "$current_path/node_modules" ]; then
        echo "function 모듈 $current_path/package.json 설치를 시작합니다..."
        npm install
        rsync -av --progress --exclude='*' --include='index.js' %current_path%/app/wwwroot/assets/js/ node_modules/syn/
    fi

    if [ ! -d "$current_path/app/node_modules" ]; then
        echo "syn.js 번들링 모듈 $current_path/app/package.json 설치를 시작합니다..."
        cd $current_path/app
        npm install
    fi

    if [ ! -d "$current_path/modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/modules/wwwroot
        npm install
        echo "클라이언트 라이브러리 설치를 시작합니다..."
        dotnet tool install -g Microsoft.Web.LibraryManager.Cli
        libman restore
    fi

    echo "HandStack 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $current_path/app/ack"
fi