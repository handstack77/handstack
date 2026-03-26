# HandStack 배포/업데이트 운영 가이드

## 목적

이 문서는 HandStack 업데이트 체계의 운영 절차를 정리한다.

- `publish.ps1`로 배포 산출물 생성
- `publish-update.ps1`로 업데이트 ZIP 패키지 생성
- `deploy` 호스트에 release 등록 및 publish
- `ack`가 업데이트를 내려받고 적용했는지 확인

현재 문서는 저장소에 구현된 실제 동작만 기준으로 작성했다.

- 패키지 형식: `version.json + ZIP`
- 업데이트 적용 방식: `ack` 시작 시 확인 후 별도 `updater` 프로세스로 교체
- 기본 대상 플랫폼: `win-x64`
- 기본 채널: `stable`

## 전체 흐름

1. 소스에서 HandStack 배포 산출물을 만든다.
2. 배포 산출물에서 host/app ZIP, module ZIP, 참고용 `version.json`을 만든다.
3. `deploy` 서버에 release를 만들고 ZIP을 업로드한다.
4. `deploy` 서버에서 release를 publish해 `/updates/stable/version.json`을 노출한다.
5. 대상 `ack` 인스턴스가 시작되면 해당 `version.json`을 읽고 필요한 패키지만 내려받는다.
6. `updater`가 `app` 또는 `modules/<name>` 단위로 교체하고 `ack`를 재시작한다.

## 사전 조건

- PowerShell 7 이상
- .NET SDK 10.0
- `curl`
- HandStack 저장소 루트에서 작업

권장 작업 위치:

```powershell
Set-Location C:\projects\handstack77\handstack
```

## 산출물 구조

`publish.ps1` 실행 후 기본 출력:

```text
../publish/win-x64/handstack/
├─ app/
├─ modules/
├─ updater/
├─ deploy/
├─ forbes/
├─ contracts/
└─ assemblies/
```

`publish-update.ps1` 실행 후 기본 출력:

```text
../publish/win-x64/updates/stable/
├─ version.json
└─ packages/
   ├─ ack-win-x64-<version>.zip
   ├─ modules-wwwroot-<version>.zip
   ├─ modules-transact-<version>.zip
   ├─ modules-dbclient-<version>.zip
   └─ ...
```

중요한 점:

- `publish-update.ps1`가 생성한 `version.json`은 참고용 산출물이다.
- 현재 `deploy` 서버는 `version.json` 파일을 직접 업로드받지 않는다.
- 실제 공개용 `version.json`은 `deploy` 서버가 release publish 시 다시 생성한다.

## 1. 배포 산출물 생성

릴리스용 HandStack 산출물을 먼저 만든다.

```powershell
./publish.ps1 win publish Release x64
```

기본 출력 경로:

```text
../publish/win-x64/handstack
```

주요 확인 포인트:

- `../publish/win-x64/handstack/app/ack.exe`
- `../publish/win-x64/handstack/updater/updater.exe`
- `../publish/win-x64/handstack/modules/wwwroot/module.json`
- `../publish/win-x64/handstack/deploy/deploy.exe` 또는 `deploy.dll`

로컬 빌드만 빠르게 확인하려면:

```powershell
./publish.ps1 win build Debug x64
```

## 2. 업데이트 패키지 생성

배포 산출물에서 업데이트용 ZIP 패키지를 만든다.

```powershell
./publish-update.ps1 win Release x64
```

특정 publish 경로를 기준으로 만들려면:

```powershell
./publish-update.ps1 win Release x64 "../publish/win-x64"
```

생성 결과:

- `../publish/win-x64/updates/stable/version.json`
- `../publish/win-x64/updates/stable/packages/*.zip`

이 스크립트가 하는 일:

- `handstack/app` 전체를 host ZIP으로 압축
- `handstack/modules/<name>` 각각을 module ZIP으로 압축
- 각 ZIP의 `SHA256` 계산
- 참고용 `version.json` 생성

생성 후 확인 예시:

```powershell
Get-ChildItem ../publish/win-x64/updates/stable/packages
Get-Content ../publish/win-x64/updates/stable/version.json
```

## 3. deploy 서버 실행

### 3-1. 소스에서 실행

```powershell
dotnet run --project 1.WebHost/deploy/deploy.csproj
```

기본 주소:

```text
http://localhost:8520
```

### 3-2. publish 결과에서 실행

```powershell
Set-Location ../publish/win-x64/handstack/deploy
dotnet .\deploy.dll
```

또는 self-contained publish가 아니라면 환경에 따라 `deploy.exe` 대신 `dotnet deploy.dll`을 사용한다.

### 3-3. deploy 설정

`deploy`의 기본 설정 파일:

- `1.WebHost/deploy/appsettings.json`
- publish 후에는 `<deploy-root>/appsettings.json`

핵심 설정:

```json
{
  "Deploy": {
    "ServiceName": "handstack-deploy",
    "ManagementHeaderName": "X-Deploy-Key",
    "ManagementKey": "",
    "StorageRoot": "storage",
    "DefaultChannel": "stable",
    "DefaultPlatform": "win-x64",
    "PublicRequestPath": "updates"
  }
}
```

권장 운영값:

- `ManagementKey`: 쓰기 API 보호용 키를 반드시 설정
- `StorageRoot`: 배포 데이터 보관 경로. 기본값이면 `<deploy-root>/storage`
- `PublicRequestPath`: 기본 `updates`

### 3-4. deploy 확인

헬스 체크:

```powershell
Invoke-RestMethod http://127.0.0.1:8520/
```

관리 UI:

```text
http://127.0.0.1:8520/index.html
```

기본 로그 파일:

```text
<deploy-root>/log/deploy.log
```

## 4. release 등록과 package 업로드

두 가지 방식이 있다.

- 웹 UI 사용
- API 호출 사용

### 4-1. 웹 UI로 처리

1. 브라우저에서 `http://127.0.0.1:8520/index.html` 접속
2. 필요하면 `X-Deploy-Key` 입력
3. `Create Release`로 초안 release 생성
4. 생성된 `Release ID`를 기준으로 host ZIP 업로드
5. 필요한 module ZIP 업로드
6. `Publish` 버튼 실행
7. 상태 메시지에 `/updates/stable/version.json` 노출 여부 확인

업로드 기준:

- host 패키지: `packageType=host`, `targetId` 비움
- module 패키지: `packageType=module`, `targetId=<module 이름>`
- `version`은 ZIP에 포함된 실제 버전과 맞춰 입력

### 4-2. API로 release 생성

PowerShell 예시:

```powershell
$deployBaseUrl = 'http://127.0.0.1:8520'
$deployKey = 'change-this-key'

$release = Invoke-RestMethod `
  -Uri "$deployBaseUrl/api/releases" `
  -Method Post `
  -Headers @{ 'X-Deploy-Key' = $deployKey } `
  -ContentType 'application/json' `
  -Body (@{
      Channel = 'stable'
      Platform = 'win-x64'
      Notes = '2026-03 release'
  } | ConvertTo-Json)

$releaseId = $release.item.ReleaseId
$releaseId
```

### 4-3. API로 host ZIP 업로드

```powershell
$hostZip = Resolve-Path '../publish/win-x64/updates/stable/packages/ack-win-x64-1.0.0.zip'

curl.exe `
  -X POST "$deployBaseUrl/api/releases/$releaseId/packages" `
  -H "X-Deploy-Key: $deployKey" `
  -F "packageType=host" `
  -F "version=1.0.0" `
  -F "file=@$hostZip"
```

### 4-4. API로 module ZIP 업로드

```powershell
$moduleZip = Resolve-Path '../publish/win-x64/updates/stable/packages/modules-wwwroot-1.0.0.zip'

curl.exe `
  -X POST "$deployBaseUrl/api/releases/$releaseId/packages" `
  -H "X-Deploy-Key: $deployKey" `
  -F "packageType=module" `
  -F "targetId=wwwroot" `
  -F "version=1.0.0" `
  -F "file=@$moduleZip"
```

### 4-5. 참고용 version.json 기준으로 반복 업로드

`publish-update.ps1`가 만든 `version.json`을 읽어 ZIP 업로드 대상을 자동으로 순회할 수 있다.

```powershell
$deployBaseUrl = 'http://127.0.0.1:8520'
$deployKey = 'change-this-key'
$packageRoot = Resolve-Path '../publish/win-x64/updates/stable'
$manifest = Get-Content (Join-Path $packageRoot 'version.json') -Raw | ConvertFrom-Json
$platform = $manifest.platforms.'win-x64'

$release = Invoke-RestMethod `
  -Uri "$deployBaseUrl/api/releases" `
  -Method Post `
  -Headers @{ 'X-Deploy-Key' = $deployKey } `
  -ContentType 'application/json' `
  -Body (@{
      Channel = $manifest.channel
      Platform = 'win-x64'
      Notes = $manifest.releaseId
  } | ConvertTo-Json)

$releaseId = $release.item.ReleaseId

if ($null -ne $platform.host) {
    $hostZipPath = Join-Path $packageRoot $platform.host.downloadUrl
    curl.exe `
      -X POST "$deployBaseUrl/api/releases/$releaseId/packages" `
      -H "X-Deploy-Key: $deployKey" `
      -F "packageType=host" `
      -F "version=$($platform.host.version)" `
      -F "file=@$hostZipPath"
}

$platform.modules.PSObject.Properties | ForEach-Object {
    $moduleId = $_.Name
    $module = $_.Value
    $moduleZipPath = Join-Path $packageRoot $module.downloadUrl

    curl.exe `
      -X POST "$deployBaseUrl/api/releases/$releaseId/packages" `
      -H "X-Deploy-Key: $deployKey" `
      -F "packageType=module" `
      -F "targetId=$moduleId" `
      -F "version=$($module.version)" `
      -F "file=@$moduleZipPath"
}

Invoke-RestMethod `
  -Uri "$deployBaseUrl/api/releases/$releaseId/publish" `
  -Method Post `
  -Headers @{ 'X-Deploy-Key' = $deployKey }
```

## 5. publish 결과 확인

### 5-1. API 확인

등록된 release 목록:

```powershell
Invoke-RestMethod "$deployBaseUrl/api/releases"
```

특정 release 상세:

```powershell
Invoke-RestMethod "$deployBaseUrl/api/releases/$releaseId"
```

공개 manifest 확인:

```powershell
Invoke-RestMethod "$deployBaseUrl/updates/stable/version.json"
```

host ZIP 다운로드 확인:

```powershell
Invoke-WebRequest "$deployBaseUrl/updates/stable/packages/ack-win-x64-1.0.0.zip" -OutFile .\ack-test.zip
```

### 5-2. 파일 시스템 확인

기본 `StorageRoot=storage`라면 deploy 서버 내부 파일은 다음 위치에 생긴다.

```text
<deploy-root>/storage/
├─ releases/
│  └─ <releaseId>/
│     ├─ release.json
│     └─ packages/
│        └─ *.zip
└─ public/
   └─ stable/
      ├─ version.json
      └─ packages/
         └─ *.zip
```

의미:

- `releases/<releaseId>`: 초안 및 업로드 원본 보관
- `public/stable`: 실제 외부 공개 경로

## 6. ack 업데이트 클라이언트 설정

대상 `ack` 설치본의 `appsettings.json`에서 `Update` 섹션을 설정한다.

기본 위치:

- 소스 실행 시: `1.WebHost/ack/appsettings.json`
- publish 설치본: `<install-root>/app/appsettings.json`

예시:

```json
{
  "Update": {
    "Enabled": true,
    "CheckOnStartup": true,
    "AllowAutoApply": true,
    "StartupDelaySeconds": 0,
    "Channel": "stable",
    "BaseUrl": "http://127.0.0.1:8520/updates/stable",
    "PackageRoot": "../update/packages",
    "TempRoot": "../update/temp",
    "StateFilePath": "../update/state.json",
    "UpdaterPath": "../updater/updater.exe"
  }
}
```

주의:

- `BaseUrl`은 채널 루트 URL을 권장한다.
- 현재 구현은 `BaseUrl + /version.json`을 읽는다.
- `BaseUrl`에 `version.json` 전체 URL을 직접 넣어도 동작한다.
- `UpdaterPath`는 `ack` 실행 기준 경로에서 접근 가능해야 한다.
- `publish.ps1` 산출물은 기본적으로 `<install-root>/updater/updater.exe`를 포함한다.

## 7. ack 실행과 업데이트 확인

### 7-1. ack 실행

예시:

```powershell
dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,dbclient,function
```

또는 publish 설치본에서:

```powershell
Set-Location <install-root>\app
.\ack.exe --port=8421 --modules=wwwroot,transact,dbclient,function
```

### 7-2. ack가 하는 일

시작 시 `ack`는 다음 순서로 동작한다.

1. `Update.BaseUrl`에서 `version.json` 조회
2. 현재 host/app 버전과 module 버전 비교
3. 필요한 ZIP만 `<install-root>/update/packages/<version>/` 아래로 다운로드
4. `SHA256` 검증
5. `<install-root>/update/temp/manifests/`에 pending manifest 작성
6. `updater` 실행 후 현재 `ack` 프로세스 종료
7. `updater`가 `app` 또는 `modules/<name>` 교체
8. `ack`를 기존 실행 인자로 재시작

### 7-3. ack 확인 파일

기본 경로:

```text
<install-root>/update/
├─ packages/
├─ temp/
│  └─ manifests/
├─ backups/
└─ state.json
```

주요 확인 대상:

- `state.json`: 마지막 확인/적용 결과
- `packages/`: 다운로드된 ZIP
- `backups/`: 교체 전 백업
- `logs/updater.log`: updater 적용 단계 로그
- `app.log`: `ack` 실행 로그

기본 로그 파일:

```text
<install-root>/log/app.log
```

```text
<install-root>/update/logs/updater.log
```

### 7-4. state.json 확인

```powershell
Get-Content <install-root>\update\state.json
```

주요 필드:

- `LastCheckedAtUtc`: 마지막 확인 시각
- `LastStatus`: `None`, `NoUpdate`, `Pending`, `Applied`, `Failed`
- `LastErrorMessage`: 실패 메시지
- `LastAttemptedReleaseId`: 마지막 시도 release
- `LastAppliedReleaseId`: 마지막 적용 완료 release
- `LastPackages`: 마지막으로 처리한 host/module 목록

정상 적용 예:

```json
{
  "LastStatus": "Applied",
  "LastAppliedReleaseId": "rel-20260326120000-abcd",
  "LastPackages": [
    { "Target": "app", "Version": "1.0.1" },
    { "Target": "modules/wwwroot", "Version": "1.0.1" }
  ]
}
```

## 8. 운영 확인 체크리스트

### 8-1. deploy 쪽

- `GET /api/releases`에 release가 보이는가
- `GET /updates/stable/version.json`이 열리는가
- `version.json`의 `platforms.win-x64.host`가 존재하는가
- 필요한 module이 `platforms.win-x64.modules` 아래에 들어있는가
- ZIP 다운로드 URL이 실제로 열리는가

### 8-2. ack 쪽

- `Update.Enabled=true`인가
- `Update.BaseUrl`이 `deploy` 공개 URL과 맞는가
- `UpdaterPath` 파일이 실제로 존재하는가
- `state.json`의 `LastStatus`가 `Applied`인가
- `log/app.log`에 재시작 후 정상 기동 로그가 남았는가
- 설치 디렉터리 `app`, `modules/<name>` 파일이 교체되었는가

## 9. 장애 대응

### 9-1. `updater 실행 파일을 찾을 수 없습니다`

원인:

- `Update.UpdaterPath`가 잘못됨
- 설치본에 `updater`가 누락됨

조치:

- `<install-root>/updater/updater.exe` 존재 여부 확인
- `appsettings.json`의 `Update.UpdaterPath` 수정

### 9-2. `SHA256 검증 실패`

원인:

- 업로드한 ZIP과 manifest 정보 불일치
- 배포 파일 손상

조치:

- `publish-update.ps1`를 다시 실행
- ZIP을 다시 업로드하고 release를 다시 publish

### 9-3. 같은 release가 자동 재시도되지 않음

현재 구현은 `Failed` 상태에서 같은 `ReleaseId`를 다시 자동 시도하지 않는다.

조치:

- 새 release를 다시 생성하고 publish
- 또는 문제를 수정한 뒤 다른 `ReleaseId`로 다시 배포

### 9-4. module만 갱신되지 않음

확인 포인트:

- `ack`의 `AppSettings:LoadModules`에 해당 module이 포함돼 있는가
- `deploy`의 `version.json`에 해당 module이 들어있는가
- 업로드 시 `packageType=module`, `targetId=<module 이름>`으로 넣었는가

### 9-5. 롤백 확인

적용 중 실패하면 `updater`는 이번 실행에서 바꾼 경로를 `backups` 기준으로 복원한다.

백업 위치:

```text
<install-root>/update/backups/<releaseId>-<timestamp>/
```

복원 후 `state.json`은 `Failed`로 남는다.

## 10. 권장 운영 순서

실제 운영에서는 아래 순서를 권장한다.

1. `publish.ps1`로 배포 산출물 생성
2. `publish-update.ps1`로 ZIP과 참고용 `version.json` 생성
3. 테스트용 `deploy` 서버에 먼저 업로드
4. `GET /updates/stable/version.json`과 ZIP 다운로드 확인
5. 테스트용 `ack`에서 `state.json`이 `Applied`가 되는지 확인
6. 검증 후 운영 `deploy` 서버에 동일 절차 반영

## 11. 자주 쓰는 명령 모음

배포 산출물 생성:

```powershell
./publish.ps1 win publish Release x64
```

업데이트 패키지 생성:

```powershell
./publish-update.ps1 win Release x64
```

deploy 실행:

```powershell
dotnet run --project 1.WebHost/deploy/deploy.csproj
```

deploy release 목록 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8520/api/releases
```

공개 manifest 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8520/updates/stable/version.json
```

ack 로컬 실행:

```powershell
dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,dbclient,function
```
