# ports CLI

`ports`는 현재 LISTEN 중인 포트와 프로세스를 조회하고, 특정 포트 프로세스를 종료할 수 있는 CLI입니다.

## 주요 기능

- 포트/프로세스 목록 조회
- 특정 포트 프로세스 종료
- 사용자 경로가 확인되는 항목만 필터링

## 지원 환경

- Windows: `netstat -ano` 기반
- Linux/macOS: `lsof` 기반

## 빌드

```powershell
dotnet build .\ports\ports.csproj
```

## 실행

```powershell
ports [option]
```

또는

```powershell
dotnet run --project .\ports -- [option]
```

## 사용법

- 인자 없음: 포트 목록 출력
- `bye <port>`: 해당 포트를 점유한 프로세스 종료
- `-u`, `--user`: 경로 정보가 있는 사용자 항목 위주 출력
- `-v`, `--version`: 버전 출력

## 예시

```powershell
ports
ports --user
ports bye 8080
ports --version
```

## 출력 컬럼

- `port`: 포트 번호
- `process`: 프로세스명
- `path`: 실행 경로(또는 `-`)

Node 프로세스는 가능한 경우 `package.json`의 `name` 값을 프로세스명으로 표시합니다.

## 주의사항

- 프로세스 종료(`bye`)는 권한이 필요할 수 있으며 실패 시 관리자 권한으로 재시도해야 합니다.
- Unix 계열에서는 `lsof`가 설치되어 있어야 정확한 조회가 가능합니다.
