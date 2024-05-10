#!/bin/bash

if ! command -v dotnet 2> ~/null; then
    echo ".NET Core 8.0를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치"
    fi
    exit
fi

dotnet_version=$(dotnet --version | grep -E "^8\.")
if [ -z "$dotnet_version" ]; then
    dotnet --version
    echo ".NET Core 8.0 버전이 필요합니다. 기존 dotnet 버전을 업데이트 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치"
    fi
    exit
fi

if ! command -v node 2> ~/null; then
    echo "Node.js v20.12.2 LTS 를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-nodejs-설치"
    fi
    exit
fi

node_version=$(node --version | grep -E "^v20\.")
if [ -z "$node_version" ]; then
    echo "Node.js v20.12.2 LTS 가 필요합니다. 기존 node 버전을 업데이트 해야합니다."
    echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#gulp-설치하기"
    exit
fi

if ! command -v gulp 2> ~/null; then
    echo "Node.js 기반 gulp CLI 도구를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치"
    fi
    exit
fi

if ! command -v curl 2> ~/null; then
    echo "curl CLI 를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치"
    fi
    exit
fi

current_path=$(pwd)
if [ -f "$current_path/1.WebHost/ack/ack.csproj" ]; then
    mkdir -p $current_path/1.WebHost/build/handstack
    cd $current_path/1.WebHost/ack
    echo "current_path: $current_path 개발 환경 설치 확인 중..."
    if [ ! -d "$current_path/node_modules" ]; then
        echo "syn.js 번들링 $current_path/package.json 설치를 시작합니다..."
        npm install
        gulp
        rsync -av --progress --exclude='*' --include='index.js' $current_path/1.WebHost/ack/wwwroot/assets/js $current_path/1.WebHost/build/handstack/node_modules/syn
    fi

    cd $current_path
    cp $current_path/2.Modules/function/package*.* $current_path/1.WebHost/build/handstack/
    if [ ! -d "$current_path/1.WebHost/build/handstack/node_modules" ]; then
        echo "node.js Function 모듈 $current_path/1.WebHost/build/handstack/package.json 설치를 시작합니다..."
        cd $current_path/1.WebHost/build/handstack
        npm install
    fi
    
    cd $current_path
    if [ ! -d "$current_path/2.Modules/wwwroot/wwwroot/lib" ]; then
        echo "lib.zip 파일을 해제합니다..."
        unzip -q -o $current_path/lib.zip -d $current_path/2.Modules/wwwroot/wwwroot/lib
    fi

    if [ ! -d "$current_path/2.Modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/2.Modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/2.Modules/wwwroot
        npm install
        mkdir -p $current_path/1.WebHost/build/handstack/modules/wwwroot/wwwroot/lib
        rsync -av --delete wwwroot/lib/ $current_path/1.WebHost/build/handstack/modules/wwwroot/wwwroot/lib/
        echo "syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다..."
        gulp
    fi
    
    cd $current_path

    echo post-build.sh 스크립트에 실행 권한을 부여합니다...
    module_paths=("$current_path/1.WebHost/ack" "$current_path/1.WebHost/forbes" "$current_path/2.Modules/checkup" "$current_path/2.Modules/dbclient" "$current_path/2.Modules/function" "$current_path/2.Modules/logger" "$current_path/2.Modules/openapi" "$current_path/2.Modules/repository" "$current_path/2.Modules/transact" "$current_path/2.Modules/wwwroot")

    for module_path in "${module_paths[@]}"
    do
        tr -d '\r' < $module_path/post-build.sh > $module_path/post-build_fixed.sh && mv $module_path/post-build_fixed.sh $module_path/post-build.sh
        chmod +x $module_path/post-build.sh
    done

    dotnet build handstack.sln

    build_path=$current_path/1.WebHost/build/handstack
    cd $build_path
    echo "function 모듈 $build_path/package.json 설치를 시작합니다..."
    npm install
    rsync -av --progress --exclude='*' --include='index.js' $current_path/1.WebHost/ack/wwwroot/assets/js/ $build_path/node_modules/syn/
    echo "HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행 후 컴파일 하거나 터미널에서 dotnet build handstack.sln 명령으로 솔루션을 컴파일 하세요."
fi

if [ -f "$current_path/app/ack.dll" ]; then
    echo "current_path: $current_path ack 실행 환경 설치 확인 중..."
    if [ ! -d "$current_path/node_modules" ]; then
        echo "function 모듈 $current_path/package.json 설치를 시작합니다..."
        npm install
        cp $current_path/app/wwwroot/assets/js node_modules/syn/index.js
    fi

    if [ ! -d "$current_path/app/node_modules" ]; then
        echo "syn.js 번들링 모듈 $current_path/app/package.json 설치를 시작합니다..."
        cd $current_path/app
        npm install
    fi

    if [ ! -d "$current_path/modules/wwwroot/wwwroot/lib" ]; then
        echo "클라이언트 라이브러리 $current_path/modules/wwwroot/wwwroot/lib 설치를 시작합니다..."
        cd $current_path/modules/wwwroot/wwwroot
        if [ ! -f "$current_path/modules/wwwroot/wwwroot/lib.zip" ]; then
            echo "lib.zip 파일을 다운로드 합니다..."
            curl -L -O https://github.com/handstack77/handstack/raw/master/lib.zip
        fi
        echo "lib.zip 파일을 해제합니다..."
        unzip -q -o lib.zip -d lib
    fi

    if [ ! -d "$current_path/modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/modules/wwwroot
        npm install
        gulp
    fi

    echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $current_path/app/ack"
    cd $current_path
fi

if [ ! -f "$current_path/app/ack.dll" ]; then
    echo "ack 실행 환경 설치 경로 확인이 필요합니다. current_path: $current_path"
    echo "참고: https://handstack.kr/docs/startup/빠른-시작"
fi