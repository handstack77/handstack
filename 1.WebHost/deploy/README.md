# handstack-deploy

`handstack-deploy`는 HandStack 업데이트 패키지(`version.json + ZIP`)를 등록하고 공개 채널로 publish하는 관리 호스트입니다.

## 공개 API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/` | 없음 | 배포 서버 상태 확인용 헬스 체크입니다. |
| `GET` | `/api/releases` | 없음 | 등록된 release 목록을 반환합니다. |
| `GET` | `/api/releases/{releaseId}` | 없음 | release 상세와 패키지 목록을 반환합니다. |
| `POST` | `/api/releases` | 관리 키 | release 초안을 생성합니다. |
| `POST` | `/api/releases/{releaseId}/packages` | 관리 키 | host 또는 module ZIP 패키지를 업로드합니다. |
| `POST` | `/api/releases/{releaseId}/publish` | 관리 키 | 선택한 release를 채널의 `version.json`으로 publish합니다. |
| `GET` | `/updates/{channel}/version.json` | 없음 | 배포 클라이언트가 읽는 업데이트 manifest입니다. |
| `GET` | `/updates/{channel}/packages/{fileName}` | 없음 | 실제 ZIP 다운로드 경로입니다. |

## 설정

`appsettings.json`의 `Deploy` 섹션:

- `ServiceName`: 서비스 표시 이름
- `ManagementHeaderName`: 관리 API 키 헤더명, 기본 `X-Deploy-Key`
- `ManagementKey`: 쓰기 API 보호용 키
- `StorageRoot`: release와 공개 패키지를 저장할 루트 경로
- `DefaultChannel`: 기본 채널명
- `DefaultPlatform`: 기본 플랫폼 값
- `PublicRequestPath`: 공개 업데이트 경로 prefix, 기본 `updates`

## 로컬 실행

```powershell
dotnet run --project 1.WebHost/deploy/deploy.csproj
```

기본 주소:

```text
http://localhost:8520
```

## Docker 배포

```powershell
docker build -f 1.WebHost/deploy/Dockerfile -t handstack-deploy:latest .
```

## 관리 UI

브라우저에서 `/`로 접속하면 release 생성, ZIP 업로드, publish, 이력 조회를 수행할 수 있습니다.
