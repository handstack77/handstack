# ack 서버 운영 가이드

`ack`는 HandStack의 메인 웹 호스트 서버입니다. 이 문서는 `ack`의 실행, 환경설정, Docker 운영, 점검/장애 대응 절차를 정리합니다.

## 1) 위치와 역할

- 프로젝트 경로: `1.WebHost/ack`
- 실행 파일(배포 기준): `${HANDSTACK_HOME}/app/ack` 또는 `${HANDSTACK_HOME}/app/ack.dll`
- 기본 포트: `8421`

## 2) 사전 조건

- .NET SDK `10.0` 이상
- `HANDSTACK_HOME` 환경 변수 설정
- (선택) `HANDSTACK_SRC` 환경 변수 설정

예시 (PowerShell):

```powershell
$env:HANDSTACK_SRC='C:\projects\handstack77\handstack'
$env:HANDSTACK_HOME='C:\projects\handstack77\build\handstack'
```

## 3) 실행/중지

로컬 실행:

```powershell
dotnet run --project 1.WebHost/ack/ack.csproj
```

옵션 실행:

```powershell
dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,dbclient,function
```

`handstack` CLI로 실행/중지:

```powershell
handstack start --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--port=8421"
handstack stop --port=8421
```

직접 종료 API:

```powershell
curl "http://localhost:8421/stop?hostAccessID=<HOST_ACCESS_ID_HASH>"
```

## 4) 주요 런타임 옵션

- `--port`: 수신 포트 (기본값 `8421`)
- `--modules`: 시작 시 로드할 모듈 목록
- `--key`, `--appsettings`: 암호화된 설정 입력 시 사용
- `--showenv`: 시작 시 적용 환경 설정 출력
- `--debug`, `--delay`: 디버깅 지연 실행

## 5) 환경설정

기본 설정 파일:

- `1.WebHost/ack/appsettings.json`

주요 설정 항목:

- `AppSettings:HostAccessID`: 관리 API 인증 키 원본 값
- `AppSettings:LoadModules`: 초기 로드 모듈
- `AppSettings:LoadModuleBasePath`: 모듈 기본 경로
- `AppSettings:ContractRequestPath`: 계약 파일 요청 경로
- `AppSettings:TenantAppBasePath`
- `AppSettings:BatchProgramBasePath`
- `AppSettings:ForbesBasePath`
- `Serilog:WriteTo`: 로그 출력 경로/형식

주요 환경 변수:

- `HANDSTACK_HOME`: HandStack 홈 경로
- `ACK_ENVIRONMENT`: `appsettings.{환경}.json` 로드에 사용
- `ASPNETCORE_ENVIRONMENT`: ASP.NET Core 환경

환경 변수 오버라이드 예시:

```powershell
$env:AppSettings__HostAccessID='CHANGE-ME'
$env:AppSettings__RunningEnvironment='P'
```

## 6) 헬스체크 및 운영 API

기본 점검:

```powershell
curl -I http://localhost:8421
curl http://localhost:8421/checkip
```

진단 정보:

```powershell
curl "http://localhost:8421/diagnostics?hostAccessID=<HOST_ACCESS_ID_HASH>"
```

런타임 설정 조회/반영:

```powershell
curl "http://localhost:8421/globalconfiguration?hostAccessID=<HOST_ACCESS_ID_HASH>"
curl -X POST "http://localhost:8421/globalconfiguration/apply?hostAccessID=<HOST_ACCESS_ID_HASH>" -H "Content-Type: application/json" -d "{\"values\":{\"AppSettings:RunningEnvironment\":\"P\"}}"
```

모듈 MediatR 설정 조회/반영:

```powershell
curl "http://localhost:8421/moduleconfiguration/mediatr?hostAccessID=<HOST_ACCESS_ID_HASH>"
curl -X POST "http://localhost:8421/moduleconfiguration/mediatr/wwwroot/apply?hostAccessID=<HOST_ACCESS_ID_HASH>" -H "Content-Type: application/json" -d "{\"eventActions\":[],\"subscribeActions\":[]}"
```

`HOST_ACCESS_ID_HASH` 생성 예시 (PowerShell):

```powershell
$plain = 'HANDSTACK_HOSTACCESSID'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($plain)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
(-join ($hash | ForEach-Object { $_.ToString('x2') }))
```

주의:

- `AppSettings:HostAccessID`의 평문이 아니라, SHA-256 해시 문자열을 관리 API에 전달해야 합니다.
- Docker 컨테이너에서도 동일하게 해시 문자열 기준으로 검증됩니다.

## 7) 로그 확인

기본 로그 경로:

- `appsettings.json` 기준 `../log/app.log` (일 단위 롤링)
- 배포 구조 기준 실제 경로: `${HANDSTACK_HOME}/log/app*.log`

Windows (PowerShell):

```powershell
Get-ChildItem "$env:HANDSTACK_HOME\\log" -Filter "app*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 3 FullName,LastWriteTime,Length
Get-Content (Get-ChildItem "$env:HANDSTACK_HOME\\log" -Filter "app*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName -Tail 200 -Wait
```

Linux/macOS:

```bash
ls -lt "$HANDSTACK_HOME/log"/app*.log | head -n 3
tail -n 200 -f "$(ls -t "$HANDSTACK_HOME/log"/app*.log | head -n 1)"
```

Docker 로그:

```powershell
docker logs --tail 300 -f handstack-ack
```

## 8) Docker 사용법

관련 파일:

- `1.WebHost/ack/Dockerfile`
- `1.WebHost/ack/docker-compose.yml`
- `1.WebHost/ack/docker-entrypoint.sh`

이미지 빌드:

```powershell
docker build -f 1.WebHost/ack/Dockerfile -t handstack-ack:latest .
```

실행:

```powershell
docker compose -f 1.WebHost/ack/docker-compose.yml up -d --build
```

중지/정리:

```powershell
docker compose -f 1.WebHost/ack/docker-compose.yml down
```

볼륨 공유:

- 컨테이너 `HANDSTACK_HOME`: `/handstack`
- 호스트 공유 경로: `HANDSTACK_HOME_HOST` 환경 변수로 필수 입력

예시:

```powershell
$env:HANDSTACK_HOME_HOST='C:\projects\my-handstack-home'
docker compose -f 1.WebHost/ack/docker-compose.yml up -d --build
```

마운트 확인:

```powershell
docker inspect handstack-ack --format "{{json .Mounts}}"
```

## 9) 장애 대응 Runbook

### 9.1 서버 응답 없음

1. 포트 확인:

```powershell
curl -I http://localhost:8421
```

2. 프로세스/컨테이너 상태 확인:

```powershell
Get-Process ack -ErrorAction SilentlyContinue
docker ps --filter name=handstack-ack
```

3. 로그 확인:

```powershell
docker logs --tail 300 handstack-ack
```

4. 재시작:

```powershell
docker compose -f 1.WebHost/ack/docker-compose.yml restart
```

### 9.2 포트 충돌

1. 충돌 프로세스 확인:

```powershell
netstat -ano | findstr :8421
```

2. 다른 포트로 실행:

```powershell
dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8521
```

3. Docker 포트 매핑 변경 시 `docker-compose.yml`의 `8421:8421` 수정 후 재기동.

### 9.3 관리 API 401 오류

1. 전달한 `hostAccessID`가 SHA-256 해시 문자열인지 확인.
2. `AppSettings:HostAccessID` 원본 변경 여부 확인.
3. 컨테이너 재기동 후 재시도:

```powershell
docker compose -f 1.WebHost/ack/docker-compose.yml up -d --build
```

### 9.4 `HANDSTACK_HOME` 관련 오류

증상 예시:

- 로그에 `HANDSTACK_HOME 환경변수 확인 필요` 출력
- 계약 동기화(`/contractsync`) 실패

점검:

```powershell
docker inspect handstack-ack --format "{{json .Mounts}}"
```

조치:

1. 호스트 공유 경로 존재 여부 확인.
2. `HANDSTACK_HOME_HOST` 재설정.
3. `docker compose ... up -d --build` 재실행.

### 9.5 계약 동기화(`/contractsync`) 실패

확인 항목:

1. `AppSettings:UseContractSync=true` 여부
2. `hostAccessID` 값 일치 여부
3. `HANDSTACK_HOME` 경로 유효성
4. 요청 폼 데이터 (`moduleID`, `contractType`, `destFilePath`, `changeType`, `file`)

## 10) 운영 점검 체크리스트

1. `curl -I http://localhost:8421`가 `200`을 반환하는지 확인
2. 최신 `app*.log`에 치명 오류가 없는지 확인
3. `HANDSTACK_HOME/modules`, `contracts`, `log` 경로 접근 가능 여부 확인
4. 변경 후 `diagnostics`에서 모듈/성능 지표 정상 여부 확인
