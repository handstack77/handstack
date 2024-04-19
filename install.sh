#!/bin/bash
# cd /home/[사용자 ID]/handstack/
# chmod +x /install.sh
# /install.sh

if ! command -v dotnet &> /dev/null
then
    echo ".NET Core 8.0를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치"
    fi
    exit
fi

if [[ $(dotnet --version) != 8.* ]]
then
    echo ".NET Core 8.0를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-net-core-설치"
    fi
    exit
fi

if ! command -v node &> /dev/null
then
    echo "Node.js v20.12.2 LTS 를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-net-core-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-nodejs-설치"
    fi
    exit
fi

if [[ $(node --version) != v20.* ]]
then
    echo "Node.js v20.12.2 LTS 를 설치 해야합니다."
    echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#gulp-설치하기"
    exit
fi

if ! command -v gulp &> /dev/null
then
    echo "Node.js 기반 gulp CLI 도구를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치"
    fi
    exit
fi

if ! command -v curl &> /dev/null
then
    echo "curl CLI 를 설치 해야합니다."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#homebrew-를-이용한-curl-설치"
    else
        echo "참고: https://handstack.kr/docs/startup/install/필수-프로그램-설치하기#apt-를-이용한-curl-설치"
    fi
    exit
fi

current_path=$(pwd)
if [ -f "$current_path/app/ack.dll" ]
then
    echo "current_path: $current_path ack 실행 환경 설치 확인 중..."
    if [ ! -d "$current_path/node_modules" ]
    then
        echo "function 모듈 $current_path/package.json 설치를 시작합니다..."
        npm install
        cp $current_path/app/wwwroot/assets/js node_modules/syn/index.js
    fi

    if [ ! -d "$current_path/app/node_modules" ]
    then
        echo "syn.js 번들링 모듈 $current_path/app/package.json 설치를 시작합니다..."
        cd $current_path/app
        npm install
    fi

    if [ ! -d "$current_path/modules/wwwroot/wwwroot/lib" ]
    then
        echo "클라이언트 라이브러리 $current_path/modules/wwwroot/wwwroot/lib 설치를 시작합니다..."
        cd $current_path/modules/wwwroot/wwwroot
        if [ ! -f "$current_path/modules/wwwroot/wwwroot/lib.zip" ]
        then
            echo "lib.zip 파일을 다운로드 합니다..."
            curl -L -O https://github.com/handstack77/handstack/raw/master/lib.zip
        fi
        echo "lib.zip 파일을 해제합니다..."
        unzip lib.zip -d lib
    fi

    if [ ! -d "$current_path/modules/wwwroot/node_modules" ]
    then
        echo "syn.bundle.js 모듈 $current_path/modules/wwwroot/package.json 설치를 시작합니다..."
        cd $current_path/modules/wwwroot
        npm install
        gulp
    fi

    echo "ack 실행 환경 설치가 완료되었습니다. 터미널에서 다음 경로의 프로그램을 실행하세요. $current_path/app/ack"
    cd $current_path
else
    echo "ack 실행 환경 설치 경로 확인이 필요합니다. current_path: $current_path"
    echo "참고: https://handstack.kr/docs/startup/빠른-시작"
fi