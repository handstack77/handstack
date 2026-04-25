# HandStack 배포 패키지/업데이트 운영 가이드

## 목적

이 문서는 HandStack 배포와 업데이트 절차를 정리한 운영 문서다.

운영 기준으로 중요한 사실은 다음과 같다.

- 루트 배포 스크립트: `publish.ps1`
- 패키지 생성기: `4.Tool/CLI/publish-package/Program.cs`
- 업데이트 적용기: `4.Tool/CLI/updater/Program.cs`
- 배포 호스트: `1.WebHost/deploy/Program.cs`, `Controllers/*`, `Services/UpdatePackageRepositoryService.cs`
- 런타임 연동: `1.WebHost/ack/Program.cs`, `1.WebHost/ack/Startup.cs`
- 공개 업데이트 메타데이터는 `version.json` 업로드 방식이 아니라 `deploy`가 동적으로 만드는 `/release/manifest.json`이다.
- 업데이트 적용 책임은 별도의 `updater`에 있다.
- `ack`는 자동으로 원격 배포 서버를 폴링하지 않는다. 직접 `updater`를 진입점으로 쓰거나, 실행 중인 `ack`의 `/manifest?launch=true...`를 통해 `updater`를 띄워야 한다.

## 전체 흐름

1. `publish.ps1`로 `../publish/<rid>/handstack` 배포 산출물을 만든다.
2. `publish-package`로 현재 배포 파일 목록(`deploy-filelist.txt`)을 만든다.
3. 필요하면 이전 파일 목록과 비교해 변경분 manifest(`deploy-diff-filelist.txt`)를 만든다.
4. `publish-package compress`로 `deploy-YYYY.MM.NNN.zip`과 같은 이름의 manifest `.txt`를 만든다.
5. `deploy` 호스트에 ZIP을 업로드하면 `storage/update-catalog.json`에 등록되고 공개 경로 `/release/packages/*`로 노출된다.
6. `deploy`는 등록된 카탈로그 기준으로 `/release/manifest.json`을 동적으로 생성한다.
7. `updater`는 `app/version.json`과 공개 manifest를 비교해 자신보다 높은 버전의 ZIP만 순서대로 내려받아 적용한다.
8. `updater`가 업데이트를 끝내면 `ack`를 다시 실행한다.

## 1. 기준 publish 산출물 생성

기본 명령:

```powershell
./publish.ps1 win publish Release x64
```

디버그 빌드만 빠르게 확인할 때:

```powershell
./publish.ps1 win build Debug x64
```

기본 출력 경로:

```text
../publish/win-x64/handstack
```

`publish.ps1`가 만드는 핵심 구조:

```text
handstack/
├─ app/
├─ assemblies/
├─ hosts/
│  ├─ agent/
│  ├─ deploy/
│  └─ forbes/
├─ modules/
│  ├─ checkup/
│  ├─ dbclient/
│  ├─ forwarder/
│  ├─ function/
│  ├─ logger/
│  ├─ repository/
│  ├─ transact/
│  └─ wwwroot/
├─ tools/
│  ├─ bundling/
│  ├─ dbplatform/
│  ├─ dotnet-installer/
│  ├─ edgeproxy/
│  ├─ excludedportrange/
│  ├─ handsonapp/
│  ├─ handstack/
│  ├─ updater/
│  ├─ ports/
│  └─ publish-package/
├─ contracts/
└─ install.*
```

코드상 추가로 수행하는 일:

- `ack`, `agent`, `deploy`, `forbes`는 `dotnet publish` 또는 `dotnet build`로 산출된다.
- CLI 도구들은 `publish` 모드에서 `PublishSingleFile=true`, `self-contained=false`로 `handstack/tools/*` 아래 배치된다.
- 모듈은 `publish` 모드에서도 개별 `dotnet build` 결과를 `handstack/modules/*` 아래에 복사한다.
- `3.Infrastructure/Assemblies`는 `handstack/assemblies`로 미러링된다.
- `HANDSTACK_HOME/contracts`는 `handstack/contracts`로 복사된다.
- `install.*`, `2.Modules/function/package*.*` 파일도 루트에 복사된다.
- `*.staticwebassets.*.json`과 현재 RID가 아닌 `runtimes/*` 하위는 정리된다.

주의:

- `publish-package` 표준 스캔 대상은 `app`, `assemblies`, `hosts`, `tools`, `modules` 다섯 영역뿐이다.
- 따라서 `publish.ps1`가 만들어 둔 `handstack/contracts`, 루트 `install.*`, 기타 루트 파일은 현재 자동 업데이트 ZIP에 포함되지 않는다.

## 2. `publish-package`로 파일 목록과 ZIP 생성

### 2-1. 명령 개요

`publish-package`는 5개의 실사용 명령을 제공한다.

- `make`: 현재 배포 파일 전체 목록 생성
- `deploy-diff`: 이전 전체 목록과 현재 전체 목록 비교
- `runtimes-diff`: `app`, `assemblies`, `hosts`, `tools` 범위만 비교
- `modules-diff`: `modules` 범위만 비교
- `compress`: 전체 또는 diff manifest 기준으로 ZIP 생성

기본 실행 예:

```powershell
dotnet run --project 4.Tool/CLI/publish-package/publish-package.csproj -- make
dotnet run --project 4.Tool/CLI/publish-package/publish-package.csproj -- deploy-diff --makefile=.\deploy-filelist.txt --prevfile=.\previous\deploy-filelist.txt
dotnet run --project 4.Tool/CLI/publish-package/publish-package.csproj -- compress --makefile=.\deploy-diff-filelist.txt
```

### 2-2. publish 루트 해석 규칙

`publish-package`는 내부적으로 `handstack` 루트를 직접 찾아야 동작한다.

- `--publishpath`를 생략하면 현재 작업 디렉터리, 실행 파일 디렉터리, 상위 디렉터리를 따라가며 `../publish/<rid>/handstack`를 자동 탐지한다.
- 현재 OS 기준 기본 RID는 Windows=`win-x64`, Linux=`linux-x64`, macOS=`osx-x64` 또는 `osx-arm64`다.
- `--publishpath`를 명시할 때는 `.../publish/win-x64` 같은 상위 디렉터리가 아니라 `.../publish/win-x64/handstack` 자체를 넘겨야 한다.

예:

```powershell
publish-package make --publishpath=..\publish\win-x64\handstack
```

### 2-3. 파일 목록 형식

생성 파일 한 줄 형식:

```text
작업구분|상대경로|파일크기|MD5|변경일시
```

예:

```text
C|app/ack.dll|123456|A1B2C3D4E5F6|2026-04-02T10:20:30.0000000Z
U|modules/transact/module.json|2048|B1C2D3E4F5A6|2026-04-02T10:21:00.0000000Z
D|tools/updater/old.txt|0|-|-
```

규칙:

- `C`: 신규
- `U`: 변경
- `D`: 삭제
- `make`가 처음 만드는 전체 목록은 모든 항목이 사실상 `C`다.
- diff 비교는 `파일 크기 + MD5`가 같으면 동일 파일로 간주한다.
- 생성 시각은 UTC ISO 8601 `O` 포맷으로 기록된다.

### 2-4. 포함/제외 규칙

`make`와 `compress`에서 아래 옵션을 사용할 수 있다.

- `--includes`: 쉼표 구분 경로 목록
- `--exclude`: 쉼표 구분 glob 패턴 목록
- `--output`: 결과 파일 출력 디렉터리

`--includes` 해석 규칙:

- `app`, `assemblies`, `hosts`, `tools`, `modules`로 시작하면 그대로 사용한다.
- 그 외 경로는 모듈 경로로 보고 `modules/<경로>`로 해석한다.

예:

- `--includes=tools/updater` -> `tools/updater`
- `--includes=transact/Contracts` -> `modules/transact/Contracts`
- `--includes=wwwroot` -> `modules/wwwroot`

`--exclude`는 상대 경로 glob만 허용한다.

- `**/*.log`
- `**/node_modules/**`
- `**/values.dev.yaml`

### 2-5. ZIP 이름과 내부 manifest

`compress` 결과 파일명은 아래 규칙으로 자동 생성된다.

```text
deploy-YYYY.MM.NNN.zip
```

예:

```text
deploy-2026.04.001.zip
deploy-2026.04.002.zip
```

규칙:

- `YYYY.MM`은 현재 로컬 시각의 연/월이다.
- `NNN`은 같은 월에 이미 존재하는 ZIP을 스캔해 001부터 증가한다.
- 같은 이름의 `.txt` 파일도 함께 생성된다.
- `.txt` 파일은 ZIP 내부 루트에도 같이 들어간다.

중요:

- `compress --makefile=deploy-diff-filelist.txt`로 만들면 ZIP 옆의 `.txt`도 diff manifest다.
- 다음 배포의 `--prevfile` 기준으로는 diff manifest가 아니라 전체 목록인 `deploy-filelist.txt`를 별도로 보관해야 한다.

### 2-6. 권장 절차

최초 전체 패키지:

```powershell
publish-package make --publishpath=..\publish\win-x64\handstack --output=.\artifacts\2026.04.001
publish-package compress --publishpath=..\publish\win-x64\handstack --makefile=.\artifacts\2026.04.001\deploy-filelist.txt --output=.\artifacts\2026.04.001
```

이후 증분 패키지:

```powershell
publish-package make --publishpath=..\publish\win-x64\handstack --output=.\artifacts\2026.04.002
publish-package deploy-diff --makefile=.\artifacts\2026.04.002\deploy-filelist.txt --prevfile=.\artifacts\2026.04.001\deploy-filelist.txt --output=.\artifacts\2026.04.002
publish-package compress --publishpath=..\publish\win-x64\handstack --makefile=.\artifacts\2026.04.002\deploy-diff-filelist.txt --output=.\artifacts\2026.04.002
```

운영 포인트:

- `deploy-filelist.txt`는 다음 배포 비교 기준으로 보관한다.
- `runtimes-diff`, `modules-diff`는 검토용 분리 manifest이며 업로드나 적용에 필수는 아니다.

## 3. `deploy` 호스트 운영

### 3-1. 역할

`deploy`는 ZIP 파일 저장소이자 공개 manifest 생성기다.

- ZIP 업로드 수신
- `storage/update-catalog.json` 관리
- 공개 다운로드 경로 노출
- `/release/manifest.json` 동적 생성
- 업데이트 실패 로그 수집

### 3-2. 실행

소스에서 실행:

```powershell
dotnet run --project 1.WebHost/deploy/deploy.csproj
```

publish 산출물에서 실행:

```powershell
Set-Location ..\publish\win-x64\handstack\hosts\deploy
dotnet .\deploy.dll
```

기본 주소:

```text
http://localhost:8520
```

### 3-3. 기본 설정

`1.WebHost/deploy/appsettings.json`의 `Deploy` 섹션:

```json
{
  "Deploy": {
    "ServiceName": "handstack-deploy",
    "ManagementHeaderName": "X-Deploy-Key",
    "ManagementKey": "",
    "StorageRoot": "storage",
    "PublicRootPath": "storage/public",
    "PublicRequestPath": "release",
    "Mandatory": false,
    "MaintenanceMode": false,
    "ReleaseNotes": ""
  }
}
```

실제 사용되는 항목:

- `ManagementHeaderName`: 업로드 API 헤더 이름
- `ManagementKey`: 비어 있지 않으면 `POST /api/update-packages` 보호
- `StorageRoot`: 카탈로그와 오류 로그 저장 루트
- `PublicRootPath`: 공개 정적 파일 루트
- `PublicRequestPath`: 공개 패키지 URL prefix. 기본값 `release`
- `Mandatory`: 공개 manifest에 그대로 노출
- `MaintenanceMode`: 공개 manifest에 그대로 노출
- `ReleaseNotes`: 비어 있지 않으면 최신 manifest 상단의 `releaseNotes` 덮어씀

현재 코드에서 사용하지 않는 항목:

- `DefaultChannel`
- `DefaultPlatform`

이 둘은 옵션 클래스와 설정 파일에는 있지만 현재 `deploy` 컨트롤러와 저장소 서비스에서는 읽지 않는다.

### 3-4. 저장 구조

기본값 기준:

```text
hosts/deploy/
├─ storage/
│  ├─ update-catalog.json
│  ├─ public/
│  │  └─ packages/
│  │     └─ deploy-2026.04.001.zip
│  └─ errors/
│     └─ 20260402/
├─ wwwroot/
│  └─ index.html
└─ log/
   └─ deploy*.log
```

### 3-5. API와 UI

공개 엔드포인트:

- `GET /` : 헬스체크 JSON
- `GET /index.html` : 최소 관리 UI
- `GET /api/update-packages` : 등록된 패키지 목록
- `POST /api/update-packages` : ZIP 업로드
- `GET /release/manifest.json` : updater가 읽는 공개 manifest
- `GET /release/packages/{fileName}` : 실제 ZIP 다운로드
- `POST /deploy-error` : updater 실패 보고

업로드 제약:

- 파일명은 `-(\d+\.\d+\.\d+)\.zip` 정규식에 맞아야 한다.
- 즉 `deploy-2026.04.001.zip`은 유효하다.
- 같은 버전을 다시 업로드하면 기존 카탈로그 항목을 대체한다.
- 업로드 시 ZIP 전체 SHA-256과 파일 크기를 재계산해 카탈로그에 저장한다.

업로드 예:

```powershell
curl.exe `
  -X POST "http://localhost:8520/api/update-packages" `
  -H "X-Deploy-Key: change-this-key" `
  -F "releaseNotes=2026.04 rollout" `
  -F "releaseDate=2026-04-02T09:00:00Z" `
  -F "file=@C:\work\artifacts\2026.04.002\packages\deploy-2026.04.002.zip"
```

### 3-6. 공개 manifest 형식

`deploy`는 카탈로그 전체를 버전 오름차순으로 정렬한 뒤 마지막 항목을 최신 버전으로 사용한다.

예:

```json
{
  "version": "2026.04.002",
  "releaseDate": "2026-04-02T09:00:00Z",
  "packageUri": "http://localhost:8520/release/packages/deploy-2026.04.002.zip",
  "packageSha256": "abcdef...",
  "packageSize": 12345678,
  "mandatory": false,
  "maintenanceMode": false,
  "releaseNotes": "2026.04 rollout",
  "packages": [
    {
      "version": "2026.04.001",
      "releaseDate": "2026-03-30T09:00:00Z",
      "packageUri": "http://localhost:8520/release/packages/deploy-2026.04.001.zip",
      "packageSha256": "....",
      "packageSize": 11111111,
      "releaseNotes": "initial release"
    },
    {
      "version": "2026.04.002",
      "releaseDate": "2026-04-02T09:00:00Z",
      "packageUri": "http://localhost:8520/release/packages/deploy-2026.04.002.zip",
      "packageSha256": "....",
      "packageSize": 12345678,
      "releaseNotes": "2026.04 rollout"
    }
  ]
}
```

운영 포인트:

- 상단 `version`은 최신 패키지 버전이다.
- `packages` 배열은 updater가 현재 버전보다 높은 항목만 골라 순차 적용하는 기준이다.
- 상단 `releaseNotes`는 `Deploy:ReleaseNotes`가 비어 있으면 최신 패키지의 `releaseNotes`를 사용한다.

## 4. `updater`가 업데이트를 적용하는 방식

### 4-1. 기본 동작

`updater`는 HandStack 시작 진입점 역할을 한다.

- 설치 루트 계산
- `app/version.json` 확인 및 자동 생성
- 공개 manifest 조회
- 현재 버전보다 높은 패키지 목록 계산
- ZIP 다운로드, 검증, 적용
- 필요 시 마이그레이션 스크립트 실행
- 성공 시 `ack` 재실행

권장 실행 예:

```powershell
.\tools\updater\updater.exe `
  --manifest-url=http://localhost:8520/release/manifest.json `
  --error-url=http://localhost:8520/deploy-error `
  -- --port=8421 --modules=wwwroot,transact,dbclient,function
```

주요 옵션:

- `--manifest-url`: 공개 manifest URL 또는 로컬 JSON 파일 경로
- `--error-url`: 실패 보고 URL
- `--install-root`: HandStack 설치 루트. 기본값은 `tools/updater` 기준 상위 2단계
- `--ack-path`: 기본값 `app/ack(.exe)`
- `--initial-version`: `version.json`이 없을 때 기본 버전. 기본값 `1.0.0`
- `--wait-for-process-id`: 종료를 기다릴 기존 `ack` PID

### 4-2. 버전 비교와 실패 시 처리

현재 코드 기준 분기:

- `manifest-url`이 없으면 업데이트 확인 없이 바로 `ack` 실행
- manifest 조회 실패 시 업데이트를 건너뛰고 바로 `ack` 실행
- 서버 최신 버전이 현재 버전보다 낮으면 downgrade를 막고 바로 `ack` 실행
- 현재 버전보다 높은 패키지가 없으면 바로 `ack` 실행
- 패키지 적용 중 오류가 나면 `ack`를 다시 실행하지 않고 종료

### 4-3. 적용 순서

실제 적용 단계:

1. `staging/update.lock`으로 잠금을 건다.
2. `staging/apply/<timestamp>/downloads/<version>`에 ZIP을 다운로드한다.
3. `staging/apply/<timestamp>/extracted/<version>`에 ZIP을 압축 해제한다.
4. ZIP 옆 `.txt` manifest를 찾아 읽는다.
5. ZIP 크기와 SHA-256을 검증한다.
   - 단, `maintenanceMode=true`면 SHA-256 검증을 건너뛴다.
6. 대상 파일이 이미 있으면 `backup/<timestamp>/<version>/...` 아래에 백업한다.
7. `C`, `U` 항목은 복사하고 `D` 항목은 삭제한다.
8. 비어 있는 상위 디렉터리는 정리한다.
9. 버전별 마이그레이션 스크립트가 있으면 실행한다.
10. 성공하면 `app/version.json`을 최신 manifest 버전으로 저장한다.
11. 마지막에 `ack`를 다시 시작한다.

### 4-4. 허용 경로

`updater`는 아래 top-level 디렉터리만 설치 대상으로 허용한다.

- `app`
- `assemblies`
- `hosts`
- `tools`
- `modules`
- `data`

주의:

- `updater`는 `data`를 허용하지만, 현재 `publish-package` 표준 대상에는 `data`가 없다.
- 즉 현재 공식 패키지 생성 흐름에서 실제로 생성되는 경로는 `app`, `assemblies`, `hosts`, `tools`, `modules`다.

### 4-5. 마이그레이션 스크립트 규칙

버전별 스크립트 후보:

Windows:

- `tools/migrations/<version>/migration.cmd`
- `tools/migrations/<version>/migration.bat`
- `tools/migrations/<version>/migration.ps1`
- `tools/migrations/<version>.cmd`
- `tools/migrations/<version>.bat`
- `tools/migrations/<version>.ps1`

Linux/macOS:

- `tools/migrations/<version>/migration.sh`
- `tools/migrations/<version>/migration.ps1`
- `tools/migrations/<version>.sh`
- `tools/migrations/<version>.ps1`

### 4-6. 로그와 오류 보고

- 로컬 로그: `log/update/updater.log`
- 실패 보고: `error-url`이 있으면 multipart form으로 `message`, `source=updater`, `version`, `updater.log`를 `POST`한다.

현재 코드 기준 주의 사항:

- manifest의 `mandatory` 값은 모델에는 들어오지만 실제 분기에는 사용되지 않는다.
- `health-url`도 계산되지만 실제로 업데이트 후 헬스체크 호출을 수행하지 않는다.

## 5. `ack`와의 연동

### 5-1. 시작 시 버전 파일 처리

`ack`는 시작할 때 `EntryBasePath/version.json`을 확인하고, 없거나 깨졌으면 기본 버전 `1.0.0`으로 재생성한다.

즉, `ack`를 직접 실행해도 `version.json` 자체는 유지된다.

### 5-2. `/manifest` 엔드포인트

`ack`는 `/manifest`를 제공한다.

기본 조회:

```text
GET /manifest
```

응답 내용:

- 현재 `version.json` 값
- `updatedAt`
- 현재 프로세스 ID
- 현재 실행 파일 경로
- updater 실행 파일 경로

### 5-3. 실행 중인 `ack`에서 updater 기동

아래 쿼리를 주면 `ack`가 `updater`를 새 프로세스로 실행한다.

```text
GET /manifest?launch=true&manifestUrl=http://localhost:8520/release/manifest.json&errorUrl=http://localhost:8520/deploy-error&hostAccessID=<HOST_ACCESS_ID>
```

또는 `launch=true` 대신 `executeLauncher=true`도 허용한다.

이때 `ack`가 `updater`에 넘기는 값:

- `--manifest-url <manifestUrl>`
- `--wait-for-process-id <현재 ack PID>`
- `--error-url <errorUrl>` if provided
- 현재 `ack`가 받고 있던 커맨드라인 인자 전체

중요:

- 이 엔드포인트는 `updater`를 시작만 하고 현재 `ack` 프로세스를 바로 종료하지는 않는다.
- 따라서 실제 교체를 진행하려면 `updater`가 기다리는 동안 기존 `ack`를 종료시켜야 한다.
- 코드상 종료 엔드포인트는 `/stop?hostAccessID=<HOST_ACCESS_ID>`다.

운영 시퀀스 예:

1. `/manifest?launch=true...` 호출
2. `/stop?hostAccessID=...` 호출
3. `updater`가 PID 종료를 감지한 뒤 업데이트 적용
4. `updater`가 `ack` 재시작

### 5-4. 권장 진입점

운영 관점에서 가장 단순한 방법은 `ack` 대신 `updater`를 진입점으로 두는 것이다.

- 신규 기동: `updater -> 필요 시 업데이트 -> ack`
- 실행 중 교체: `ack /manifest?launch=true...` + `ack /stop`

현재 소스 기준으로 `ack` 자체에는 원격 배포 서버를 주기적으로 조회하는 로직이 없다.

## 6. 운영 체크리스트

1. `./publish.ps1 win publish Release x64`로 기준 산출물을 만든다.
2. `publish-package make`로 현재 전체 파일 목록을 만든다.
3. 이전 전체 목록이 있으면 `deploy-diff`로 변경분 manifest를 만든다.
4. `compress`로 `deploy-YYYY.MM.NNN.zip`을 만든다.
5. `deploy`에 ZIP을 업로드한다.
6. `/release/manifest.json`과 `/release/packages/<zip>`이 열리는지 확인한다.
7. `updater`를 진입점으로 기동하거나, 실행 중인 `ack`에 `/manifest?launch=true...`를 호출한다.
8. 적용 후 `app/version.json`, `log/update/updater.log`, `deploy`의 `storage/errors` 유무를 확인한다.

## 7. 현재 구현 기준으로 문서화한 제한 사항

- `contracts/`는 publish 산출물에 존재하지만 표준 업데이트 ZIP에는 포함되지 않는다.
- `DefaultChannel`, `DefaultPlatform`은 설정에 있으나 현재 배포 호스트 동작에는 반영되지 않는다.
- `mandatory`는 manifest에 실리지만 updater의 실행 제어에는 아직 쓰이지 않는다.
- `health-url`은 계산되지만 실제 probe 로직은 없다.
- 실행 중인 `ack`의 `/manifest?launch=true...`는 updater만 기동하며, 현재 프로세스 종료는 별도 `/stop` 또는 외부 프로세스 매니저가 맡아야 한다.
