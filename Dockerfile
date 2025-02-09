FROM ubuntu:24.04

SHELL ["/bin/bash", "-c"]

# CLI 도구 설치
RUN apt-get update && \
    apt-get install -y curl wget net-tools iputils-ping vim unzip gnupg sudo bash bash-completion && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# .NET Core SDK 8 설치
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y dotnet-sdk-8.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Node.js LTS 설치
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# npm 글로벌 도구 설치: pm2 및 gulp-cli
RUN npm install -g pm2 gulp-cli

# Anaconda 설치
RUN wget https://repo.anaconda.com/archive/Anaconda3-2023.03-Linux-x86_64.sh -O /tmp/anaconda.sh && \
    bash /tmp/anaconda.sh -b -p /opt/anaconda && \
    rm /tmp/anaconda.sh && \
    /opt/anaconda/bin/conda init bash && \
    /opt/anaconda/bin/conda install -y python=3.11

# Anaconda 가상 환경 생성 및 패키지 설치
RUN /opt/anaconda/bin/conda create -n myenv python=3.11 -y && \
	/opt/anaconda/bin/conda run -n myenv pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict && \
	/opt/anaconda/bin/conda clean -ya

# Handstack 설치
RUN curl -L -o handstack.zip https://github.com/handstack77/handstack/releases/latest/download/linux-x64.zip && \
    unzip handstack.zip -d /opt && \
    rm handstack.zip && \
    tr -d '\r' < /opt/handstack/install.sh > /opt/handstack/install_fixed.sh && mv /opt/handstack/install_fixed.sh /opt/handstack/install.sh && \
    chmod +x /opt/handstack/install.sh

RUN cd /opt/handstack && /opt/handstack/install.sh

# 모듈 및 구성 설치

# 작업 디렉토리 설정
WORKDIR /opt/handstack/app

# 서비스 포트 노출
EXPOSE 8000

# 프로그램 시작
ENTRYPOINT ["dotnet", "ack.dll"]

# 컨테이너를 계속 실행 상태로 유지
# CMD ["tail", "-f", "/dev/null"]

# Docker 빌드 및 실행 명령
# docker build -t myapp:1.0.0 -f Dockerfile .
# docker run -d --name myapp-1.0.0 -v "C:/home/handstack/contracts:/home/handstack/contracts" -v "C:/home/handstack/log:/home/handstack/log" -v "C:/home/handstack/modules:/home/handstack/modules" -v "C:/home/handstack/storage:/home/handstack/storage" -p 8080:8080 myapp:1.0.0
# docker run -d --name myapp-1.0.0 -p 8000:8000 myapp:1.0.0
# docker exec -it myapp-1.0.0 /bin/bash
# docker stop myapp-1.0.0
# docker rm myapp-1.0.0
# docker rmi myapp:1.0.0