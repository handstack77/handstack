#!/bin/bash
# chmod +x /home/handstack/install.sh

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

echo "dotnet tool libman 설치를 시작합니다..."
dotnet tool install -g Microsoft.Web.LibraryManager.Cli

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

if [ -f "$current_path/1.WebHost/ack/ack.csproj" ]; then
    mkdir -p $current_path/1.WebHost/build/handstack
    cd $current_path/1.WebHost/ack
    echo "current_path: $current_path a개발 환경 설치 확인 중..."
    if [ ! -d "$current_path/node_modules" ]; then
        echo "syn.js 번들링 $current_path/package.json 설치를 시작합니다..."
        npm install
        gulp
        rsync -av --progress --exclude='*' --include='index.js' $current_path/1.WebHost/ack/wwwroot/assets/js $current_path/1.WebHost/build/handstack/node_modules/syn
    fi

    cd $current_path
    if [ ! -d "$current_path/1.WebHost/build/handstack/node_modules" ]; then
        echo "node.js Function 모듈 $current_path/1.WebHost/build/handstack/package.json 설치를 시작합니다..."
        cd $current_path/1.WebHost/build/handstack
        npm install
    fi
    
    cd $current_path
    if [ ! -d "$current_path/2.Modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/2.Modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/2.Modules/wwwroot
        npm install
        echo "클라이언트 라이브러리 설치를 시작합니다..."
        libman restore
        echo "syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다... 호스트 사양에 따라 2~3분 정도 소요됩니다."
        gulp
        gulp base
        gulp bundle
    fi
    
    dotnet build handstack.sln

    build_path=$current_path/1.WebHost/build/handstack
    cd $build_path
    echo "function 모듈 $build_path/package.json 설치를 시작합니다..."
    call npm install
    rsync -av --progress --exclude='*' --include='index.js' $current_path/1.WebHost/ack/wwwroot/assets/js/ $build_path/node_modules/syn/
    echo "HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행하세요. 자세한 정보는 https://handstack.kr 를 참고하세요."
fi

if [ -f "$current_path/app/ack.dll" ]; then
    echo "current_path: $current_path ack 실행 환경 설치 확인 중..."
    if [ ! -d "$current_path/node_modules" ]; then
        echo "function 모듈 $current_path/package.json 설치를 시작합니다..."
        npm install
        rsync -av --progress --exclude='*' --include='index.js' $current_path/app/wwwroot/assets/js/ node_modules/syn/
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
        libman restore
        echo "syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다..."
        gulp
        gulp base
        gulp bundle
    fi

    echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $current_path/app/ack"
    cd $current_path/app
fi