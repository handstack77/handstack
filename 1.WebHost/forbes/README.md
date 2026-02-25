# forbes 프로그램 사용 가이드

`forbes`는 정적 파일 제공과 계약(Contracts) 파일 동기화를 지원하는 ASP.NET Core 호스트 프로그램입니다.

## 1) 실행 환경

- .NET SDK `10.0` 이상
- (선택) `curl` - API 테스트 시 사용
- `CodeMergeMethod=GitHub` 사용 시 GitHub Personal Access Token 필요

## 2) 빠른 시작

현재 폴더(`1.WebHost/forbes`)에서 실행합니다.

```powershell
dotnet restore .\forbes.csproj
dotnet build .\forbes.csproj
dotnet run --project .\forbes.csproj
```

- 기본 주소: `http://localhost:8420`
- 기본 정적 파일 루트: `.\wwwroot`

레포 전체 설치/빌드가 필요한 경우(레포 루트 기준):

```powershell
.\install.ps1
.\build.ps1
```

## 3) 실행 옵션

- `--debug`: 디버거 연결 대기 모드 사용
- `--delay <seconds>`: 디버거 대기 시간(초), 기본값 `10`

예시:

```powershell
dotnet run --project .\forbes.csproj -- --debug --delay 20
```

## 4) 설정 파일

### `appsettings.json`

- `ContractsBasePath`: 계약 파일 기본 경로
- `WWWRootBasePath`: 정적 파일 루트 경로
- `CodeMergeMethod`: `Manual` | `FileSync` | `GitHub`
- `Kestrel:Endpoints:Http:Url`: 서비스 바인딩 주소

### `sync-secrets.json`

- `UserName`, `UserEmail`: GitHub 커밋 메시지 작성자 정보
- `FileSyncServer`, `FileSyncAccessToken`: FileSync 동기화용
- `GitHubPersonalAccessToken`: GitHub API 호출 토큰
- `GitHubRepositoryOwner`, `GitHubRepositoryName`, `GitHubRepositoryBranch`
- `GitHubRepositoryBasePath`: 원격 저장소 기준 경로(기본 `Contracts`)

예:

- 토큰은 파일에 직접 커밋하지 말고 환경 변수로 주입하는 방식을 권장합니다.

```json
{
    "UserEmail": "",
    "UserName": "",
    "FileSyncServer": "http://localhost:8421",
    "FileSyncAccessToken": "",
    "GitHubPersonalAccessToken": "...",
    "GitHubRepositoryOwner": "...",
    "GitHubRepositoryName": "forbes-project",
    "GitHubRepositoryBranch": "main",
    "GitHubRepositoryBasePath": "Contracts"
}

```

## 5) 동기화 모드

- `Manual`: 파일 동기화 비활성화
- `FileSync`: 로컬 변경 파일을 `FileSyncServer`로 전송
- `GitHub`: 시작 시 원격/로컬 동기화 후 파일 변경을 GitHub에 반영

모니터링 대상(Contracts 하위):

- `dbclient`: `*.xml`
- `function`: `featureMain*`, `featureMeta.json`, `featureSQL.xml`
- `transact`: `*.json`
- `wwwroot`: 모든 파일

## 6) API 사용법

기본 베이스 URL: `http://localhost:8420`

### 6.1 repository_dispatch 트리거

```bash
curl -X POST "http://localhost:8420/api/dispatch/repository" \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"sync_config\",\"clientPayload\":{\"source\":\"external\",\"changedBy\":\"erp\"}}"
```

### 6.2 workflow_dispatch 트리거

```bash
curl -X POST "http://localhost:8420/api/dispatch/workflow" \
  -H "Content-Type: application/json" \
  -d "{\"workflowId\":\".github/workflows/manual.yml\",\"ref\":\"main\",\"inputs\":{\"name\":\"erp\"}}"
```

## 7) 로그 위치

- 로그 폴더: `<EntryDirectoryPath>\tracelog`
- 로그 파일: `trace-YYYY-MM-DD.log`

`EntryDirectoryPath`를 설정하지 않으면 실행 파일 기준 경로를 사용합니다.

## 8) 문제 해결 체크리스트

- 8420 포트 충돌 시 `appsettings.json`의 Kestrel URL 변경
- 정적 파일 미노출 시 `WWWRootBasePath` 경로 확인
- GitHub 동기화/디스패치 실패 시 저장소 정보, 토큰, 브랜치명 확인 후 `tracelog` 점검
