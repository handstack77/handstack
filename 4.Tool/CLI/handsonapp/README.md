# handsonapp CLI

`handsonapp`은 모듈 개발용 로컬 호스트 + 계약 파일 동기화 도구입니다.

- 현재 작업 디렉터리의 `wwwroot`, `contracts`를 감시
- 필요 시 `HANDSTACK_HOME` 경로로 파일 복사 동기화
- 필요 시 HandStack 서버 URL로 변경 파일 업로드 동기화

## 사전 조건

- .NET SDK 10.0+
- 실행 기준 디렉터리에 아래 폴더 존재
  - `wwwroot`
  - `contracts`

선택 조건:

- 로컬 파일 복사 동기화 사용 시: `HANDSTACK_HOME` 또는 `--handstackPath` 설정
- URL 업로드 동기화 사용 시: `--handstackUrl`, `--hostAccessID` 설정

## 설정 우선순위

1. CLI 인자
2. `appsettings.json`
3. 환경 변수(`HANDSTACK_HOME` 등)

## appsettings.json 주요 키

- `SyncModuleName`
- `Port`
- `UseContractFileSync`
- `UseContractUrlSync`
- `HandStackUrl`
- `HandStackHostAccessID`

## 빌드

```powershell
dotnet build .\handsonapp\handsonapp.csproj
```

## 실행

```powershell
dotnet run --project .\handsonapp -- [options]
```

배포 실행 파일:

```powershell
handsonapp [options]
```

## 옵션

- `--debug`: 시작 전 10초 대기
- `--port <int>`: 서비스 포트
- `--moduleID <string>`: 동기화 대상 모듈 ID
- `--handstackPath <path>`: HandStack 홈 경로
- `--contractFileSync <true|false>`: 파일 복사 동기화 사용
- `--contractUrlSync <true|false>`: HTTP 업로드 동기화 사용
- `--handstackUrl <url>`: 업로드 엔드포인트
- `--hostAccessID <string>`: 업로드 요청 헤더(`hostAccessID`)
- `--workingDirectory <path>`: 실행 기준 디렉터리

## 실행 예시

```powershell
handsonapp --workingDirectory C:/projects/mymodule --moduleID checkup --port 8090
handsonapp --moduleID checkup --contractFileSync true --handstackPath C:/build/handstack
handsonapp --moduleID checkup --contractUrlSync true --handstackUrl http://localhost:8421/contractsync --hostAccessID HANDSTACK_HOSTACCESSID
```

## 동기화 대상 파일 패턴

- `contracts/dbclient`: `*.xml`
- `contracts/function`: `featureMain.cs|featureMain.js|featureMeta.json|featureSQL.xml`
- `contracts/transact`: `*.json`
- `wwwroot/<moduleID>`: `*.html|*.css|*.js|*.json`

## 참고 스크립트

- `run.bat`: 개발 실행 흐름 예시(사전 계약 정리 포함)
- `publish.bat`, `publish.sh`: 단일 파일 publish 예시
- `start.bat`: 실행 파일 호출 예시
