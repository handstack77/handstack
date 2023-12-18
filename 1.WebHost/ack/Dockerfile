FROM mcr.microsoft.com/dotnet/sdk:8.0

# 서비스 포트 설정
EXPOSE 8080

# 변수 선언 (전달 예: docker build --tag handstack:1.0.0 --build-arg NODE_MAJOR=20 .)
ARG NODE_MAJOR=20

# Install Node.js 20.x 및 필수 도구 설치 
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install nodejs -y

RUN apt-get install -y procps net-tools iputils-ping vim

# 호스트 디렉토리 파일을 베이스 handstack 디렉토리에 복사
WORKDIR /home/handstack
COPY . .

# npm 패키지 설치
RUN npm i

# 프로그램 시작
# RUN chmod +x preference.sh
WORKDIR /home/handstack/app
ENTRYPOINT ["dotnet", "ack.dll"]

# dockerlize 빌드 및 확인
# docker build --tag handstack:1.0.0 --build-arg NODE_MAJOR=20 .
# docker run -d --name ack-pg-1.0.0 -v "C:/home/handstack/contracts:/home/handstack/contracts" -v "C:/home/handstack/log:/home/handstack/log" -v "C:/home/handstack/modules:/home/handstack/modules" -v "C:/home/handstack/storage:/home/handstack/storage" -p 8080:8080 handstack:1.0.0
# docker run -d --name ack-pg-1.0.0 --net host handstack:1.0.0
# docker exec -it ack-pg-1.0.0 /bin/bash
# docker stop ack-pg-1.0.0
# docker rm ack-pg-1.0.0
# docker rmi handstack:1.0.0