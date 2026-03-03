# edgeproxy CLI

`edgeproxy`는 YARP 기반 리버스 프록시 프로세스이며, 필요 시 `ack` 프로세스를 같이 올리고 종료 시 정리하는 역할을 합니다.

## 동작 개요

- `HANDSTACK_HOME/app/ack(.exe)` 존재 여부 확인
- 기존 `ack` 프로세스가 없으면 `ack` 자동 실행(기본 동작)
- Kestrel + YARP 설정(`edgeproxy.appsettings.json`)으로 프록시 구동
- `--ackexit=true`이면 edgeproxy 종료 시 `ack`도 종료

## 사전 조건

- .NET SDK 10.0+
- `HANDSTACK_HOME` 환경변수 설정
- `${HANDSTACK_HOME}/app/ack` 또는 `ack.exe` 파일 존재

## 빌드

```powershell
dotnet build .\edgeproxy\edgeproxy.csproj
```

## 실행

```powershell
dotnet run --project .\edgeproxy -- [options]
```

또는 배포 실행 파일:

```powershell
edgeproxy [options]
```

## 옵션

- `--d` 또는 `--daemon`: 서비스 모드(Windows Service / systemd) 활성화
- `--ackrun=<true|false>`: 시작 시 `ack` 자동 실행 여부 (기본 `true`)
- `--arguments="..."`: `ack` 실행 시 추가 인자
- `--ackexit=<true|false>`: edgeproxy 종료 시 `ack` 종료 여부 (기본 `true`)

`--arguments`는 내부적으로 `--pname=edgeproxy-ack`가 자동으로 추가됩니다.

## 설정 파일

파일: `edgeproxy/edgeproxy.appsettings.json`

기본값:

- 수신 주소: `http://*:8080`
- 프록시 대상: `http://localhost:8421`

필요 시 `Kestrel.Endpoints`와 `ReverseProxy` 섹션을 프로젝트 환경에 맞게 수정하세요.

## 실행 예시

```powershell
edgeproxy
edgeproxy --ackrun=false
edgeproxy --arguments="--modules=wwwroot,transact --port=8421"
edgeproxy --ackrun=true --ackexit=false
edgeproxy --daemon
```

## 운영 주의사항

- `HANDSTACK_HOME` 미설정 또는 `ack` 파일 미존재 시 즉시 종료됩니다.
- 이미 실행 중인 `ack` 프로세스가 있으면 해당 프로세스를 재사용합니다.
