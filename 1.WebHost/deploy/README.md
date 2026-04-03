# handstack-deploy

`handstack-deploy`는 `publish-package`가 만든 `deploy-<yyyy.MM.rollingno>.zip` 패키지를 저장하고, updater/updater가 읽는 공개 manifest를 제공하는 관리 호스트입니다.

## 자동 업데이트 API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/release/manifest.json` | 없음 | updater가 읽는 최신 업데이트 manifest입니다. |
| `GET` | `/release/packages/{fileName}` | 없음 | 실제 ZIP 다운로드 경로입니다. |
| `POST` | `/api/update-packages` | 관리 키 | `publish-package` ZIP을 업로드하고 카탈로그에 등록합니다. |
| `GET` | `/api/update-packages` | 없음 | 등록된 업데이트 ZIP 목록을 반환합니다. |
| `POST` | `/deploy-error` | 없음 | updater 실패 로그를 저장합니다. |

## manifest 형식

공개 manifest 예:

```json
{
  "version": "2026.05.001",
  "releaseDate": "2026-04-02T09:00:00Z",
  "packageUri": "http://localhost:8520/release/packages/deploy-2026.05.001.zip",
  "packageSha256": "a1b2c3...",
  "packageSize": 25478123,
  "mandatory": false,
  "maintenanceMode": false,
  "releaseNotes": "",
  "packages": [
    {
      "version": "2026.04.002",
      "releaseDate": "2026-04-02T09:00:00Z",
      "packageUri": "http://localhost:8520/release/packages/deploy-2026.04.002.zip",
      "packageSha256": "....",
      "packageSize": 1024,
      "releaseNotes": ""
    }
  ]
}
```

- `version`: 서버 최신 버전
- `packages`: 클라이언트가 현재 버전보다 높은 항목만 골라 순차 적용할 패키지 목록
- `maintenanceMode=true`: updater가 SHA-256 검증을 건너뜁니다.

## 설정

`appsettings.json`의 `Deploy` 섹션:

- `ServiceName`: 서비스 표시 이름
- `ManagementHeaderName`: 관리 API 키 헤더명, 기본 `X-Deploy-Key`
- `ManagementKey`: 쓰기 API 보호용 키
- `StorageRoot`: 패키지, 카탈로그, 오류 로그 저장 루트
- `PublicRootPath`: 공개 정적 파일 루트, 상대 경로면 deploy 호스트 ContentRoot 기준
- `PublicRequestPath`: 공개 패키지 경로 prefix, 기본 `release`
- `Mandatory`: 강제 업데이트 여부
- `MaintenanceMode`: 점검 모드 여부
- `ReleaseNotes`: 최신 manifest 기본 릴리스 노트

패키지는 `PublicRootPath/packages`, 카탈로그는 `StorageRoot/update-catalog.json`, 오류 보고는 `StorageRoot/errors` 아래에 저장됩니다.

## 업로드 예시

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8520/api/update-packages `
  -Headers @{ 'X-Deploy-Key' = 'your-key' } `
  -Form @{
      file = Get-Item .\packages\deploy-2026.05.001.zip
      releaseNotes = 'May rollout'
      releaseDate = '2026-05-01T09:00:00Z'
  }
```

## 로컬 실행

```powershell
dotnet run --project 1.WebHost/deploy/deploy.csproj
```

기본 주소:

```text
http://localhost:8520
```
