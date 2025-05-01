#!/bin/bash

# Node.js 설치 확인
if ! command -v node 2> ~/null; then
    echo "Node.js v20.12.2 LTS 이상 버전을 설치 해야 합니다."
    echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-nodejs-설치"
    exit
fi

# Gulp 설치 확인
if ! command -v gulp 2> ~/null; then
    echo "Node.js 기반 gulp CLI 도구를 설치 해야 합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치"
    fi
    exit
fi

# Curl 설치 확인
if ! command -v curl 2> ~/null; then
    echo "curl CLI 를 설치 해야 합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치"
    fi
    exit
fi

current_path=$(pwd)

# 개발 환경 설정 (ack.csproj 존재 시)
if [ -f "$current_path/1.WebHost/ack/ack.csproj" ]; then
    # .NET Core 설치 및 버전 확인
    dotnet --version > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo ".NET Core 8.0 버전을 설치 해야 합니다."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
        else
            echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치"
        fi
        exit
    fi

    MAJOR_VERSION=$(dotnet --version | cut -d. -f1)
    if [ $MAJOR_VERSION -lt 8 ]; then
        echo ".NET Core 8.0 버전을 설치 해야 합니다."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
        else
            echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치"
        fi
        exit
    fi
    
    # 환경 변수 설정
    sudo sed -i '/export HANDSTACK_SRC=/d' /etc/profile
    echo "export HANDSTACK_SRC=\"$current_path\"" | sudo tee -a /etc/profile
    export HANDSTACK_SRC="$current_path"
    source /etc/profile
    
    sudo sed -i '/export HANDSTACK_HOME=/d' /etc/profile
    echo "export HANDSTACK_HOME=\"$current_path/1.WebHost/build/handstack\"" | sudo tee -a /etc/profile
    export HANDSTACK_HOME="$current_path/1.WebHost/build/handstack"
    source /etc/profile

    mkdir -p $current_path/1.WebHost/build/handstack
    
    # syn.js 번들링 (ack 프로젝트)
    echo "current_path: $current_path 개발 환경 설치 확인 중..."
    if [ ! -d "$current_path/1.WebHost/ack/node_modules" ]; then
        echo "syn.js 번들링 $current_path/package.json 설치를 시작합니다..."
        cd $current_path/1.WebHost/ack
        npm install
        gulp
    fi
    
    cd $current_path
    # lib.zip 압축 해제
    if [ ! -d "$current_path/2.Modules/wwwroot/wwwroot/lib" ]; then
        echo "lib.zip 파일을 해제합니다..."
        unzip -q -o $current_path/lib.zip -d $current_path/2.Modules/wwwroot/wwwroot/lib
    fi
    
    # libman 확인 및 자동 설치, 라이브러리 복원
    cd $current_path/2.Modules/wwwroot

    if ! command -v libman &> /dev/null; then
        echo "libman 설치를 시도합니다..."
        dotnet tool install --global Microsoft.Web.LibraryManager.Cli
    fi
    
    # libman 확인 및 자동 설치, 라이브러리 복원
    echo "$current_path/2.Modules/wwwroot 디렉토리에서 libman restore를 실행합니다..."
    libman restore
    
    # wwwroot 모듈 node_modules 설치 및 gulp 실행
    if [ ! -d "$current_path/2.Modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/2.Modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/2.Modules/wwwroot
        npm install
        mkdir -p $current_path/1.WebHost/build/handstack/modules/wwwroot/wwwroot/lib
        rsync -av --delete wwwroot/lib/ $current_path/1.WebHost/build/handstack/modules/wwwroot/wwwroot/lib/
        echo "syn.controls, syn.scripts, syn.bundle 번들링을 시작합니다..."
        gulp
    fi
    
    # 솔루션 빌드 및 Function 모듈 설치
    cd $current_path
    echo "current_path: $current_path"
    build_path=$current_path/1.WebHost/build/handstack

    echo build.sh, post-build.sh 스크립트에 실행 권한을 부여합니다...
    module_paths=("$current_path/1.WebHost/ack" "$current_path/1.WebHost/forbes" "$current_path/2.Modules/checkup" "$current_path/2.Modules/dbclient" "$current_path/2.Modules/function" "$current_path/2.Modules/logger" "$current_path/2.Modules/openapi" "$current_path/2.Modules/repository" "$current_path/2.Modules/transact" "$current_path/2.Modules/wwwroot" "$current_path/4.Tool/CLI/handstack")

    for module_path in "${module_paths[@]}"
    do
        tr -d '\r' < $module_path/post-build.sh > $module_path/post-build_fixed.sh && mv $module_path/post-build_fixed.sh $module_path/post-build.sh
        chmod +x $module_path/post-build.sh
    done
    
    tr -d '\r' < $current_path/4.Tool/CLI/handstack/build.sh > $current_path/4.Tool/CLI/handstack/build_fixed.sh && mv $current_path/4.Tool/CLI/handstack/build_fixed.sh $current_path/4.Tool/CLI/handstack/build.sh
    chmod +x $current_path/4.Tool/CLI/handstack/build.sh

    dotnet build handstack.sln

    cd $current_path
    cp $current_path/2.Modules/function/package*.* $current_path/1.WebHost/build/handstack/
    if [ ! -d "$current_path/1.WebHost/build/handstack/node_modules" ]; then
        echo "node.js Function 모듈 $current_path/1.WebHost/build/handstack/package.json 설치를 시작합니다..."
        cd $current_path/1.WebHost/build/handstack
        npm install
        rsync -av --progress --exclude='*' --include='index.js' $current_path/1.WebHost/ack/wwwroot/assets/js $current_path/1.WebHost/build/handstack/node_modules/syn
    fi

    cd $current_path
    rsync -av --progress --exclude='*' --include='index.js' $current_path/1.WebHost/ack/wwwroot/assets/js/ $HANDSTACK_HOME/node_modules/syn/

    echo "HandStack 개발 환경 설치가 완료되었습니다. Visual Studio 개발 도구로 handstack.sln 를 실행 후 컴파일 하거나 터미널에서 dotnet build handstack.sln 명령으로 솔루션을 컴파일 하세요."
    exit
fi

# 실행 환경 설정 (ack.dll 존재 시)
if [ -f "$current_path/app/ack.dll" ]; then
    echo "current_path: $current_path ack 실행 환경 설치 확인 중..."
    
    # 환경 변수 설정
    sudo sed -i '/export HANDSTACK_HOME=/d' /etc/profile
    echo "export HANDSTACK_HOME=\"$current_path\"" | sudo tee -a /etc/profile
    export HANDSTACK_HOME="$current_path"
    source /etc/profile
    
    # 루트 node_modules 설치
    if [ ! -d "$current_path/node_modules" ]; then
        echo "function 모듈 $current_path/package.json 설치를 시작합니다..."
        npm install
        cp $current_path/app/wwwroot/assets/js node_modules/syn/index.js
    fi
    
    # app/node_modules 설치
    if [ ! -d "$current_path/app/node_modules" ]; then
        echo "syn.js 번들링 모듈 $current_path/app/package.json 설치를 시작합니다..."
        cd $current_path/app
        npm install
    fi
    
    # lib.zip 다운로드 및 해제
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
    
    # libman 확인 및 자동 설치, 라이브러리 복원
    cd $current_path/modules/wwwroot

    if ! command -v libman &> /dev/null; then
        echo "libman 설치를 시도합니다..."
        dotnet tool install --global Microsoft.Web.LibraryManager.Cli
    fi
    
    # libman 확인 및 자동 설치, 라이브러리 복원
    echo "$current_path/modules/wwwroot 디렉토리에서 libman restore를 실행합니다..."
    libman restore
    
    # modules/wwwroot/node_modules 설치 및 gulp 실행
    if [ ! -d "$current_path/modules/wwwroot/node_modules" ]; then
        echo "syn.bundle.js 모듈 $current_path/modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/modules/wwwroot
        npm install
        gulp
    fi
    
    # 완료 메시지
    cd $current_path
    echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $current_path/app/ack"
    exit
fi