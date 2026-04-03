# publish-package CLI

`publish-package`는 `publish.ps1`로 생성한 HandStack 배포 산출물에서 파일 목록, 변경분 목록, 업데이트 ZIP 패키지를 만드는 .NET 10 기반 CLI 도구입니다.

기본 기준 경로는 실행 OS/아키텍처에 맞는 `../publish/<rid>/handstack`를 자동 탐지하며, 필요하면 `--publishpath`로 `handstack` 루트 또는 그 상위 publish 경로를 직접 지정할 수 있습니다.
기본 출력 경로는 명령을 실행한 작업 디렉터리이며, 필요하면 `--output`으로 별도 디렉터리를 지정할 수 있습니다.

## 주요 기능

- `deploy-filelist.txt` 생성
- `deploy-diff-filelist.txt` 생성
- `runtimes-diff-filelist.txt` 생성
- `modules-diff-filelist.txt` 생성
- `deploy-<yyyy.MM.rollingno>.zip` 생성
- ZIP과 함께 같은 이름의 기준 manifest `.txt` 생성

`rollingno`는 같은 월(`yyyy.MM`)과 같은 대상(`deploy`) 기준으로 출력 디렉터리 아래 `packages`의 기존 ZIP을 스캔해 3자리 증가값으로 계산합니다. 예: `deploy-2026.04.001.zip`

## 사전 조건

- `.NET SDK 10.0+`
- `publish.ps1` 실행으로 생성된 배포 루트

기본 배포 루트 구조:

```text
../publish/win-x64/handstack/
├─ app/
├─ assemblies/
├─ hosts/
├─ modules/
└─ tools/
```

## 빌드

```powershell
dotnet build .\publish-package\publish-package.csproj
```

## 실행

```powershell
dotnet run --project .\publish-package -- <command> [options]
```

배포된 실행 파일 사용 시:

```powershell
publish-package <command> [options]
```

## 파일 목록 형식

생성되는 파일 목록 한 줄은 아래 형식입니다.

```text
작업구분|파일상대경로|파일크기|MD5|변경일시
```

- `작업구분`: `C`, `U`, `D`
- `make`가 만드는 전체 목록의 기본값은 `C`
- `변경일시`는 UTC ISO 8601 (`O`) 형식

예:

```text
C|app/alpha.txt|8|113C830CA554CB68AD4F62B15AFAB3B1|2026-04-01T23:41:15.0432614+00:00
U|modules/module-a.txt|9|72BF531F25FF4AAF9DA14FD85C808372|2026-04-01T23:41:35.8045026+00:00
D|tools/keep.txt|7|11E0B78F5D4FB9067EA20CE8D4FA8BD9|2026-04-01T23:41:15.0522878+00:00
```

## 명령어

### 파일 목록 생성

```powershell
publish-package make
publish-package make --ack=..\publish\win-x64\handstack\app\ack.exe
publish-package make --publishpath=..\publish\win-x64\handstack
publish-package make --includes=tools/publish-package,transact/Contracts
publish-package make --exclude=**/*.log,**/secrets*,**/node_modules,**/values.dev.yaml,LICENSE,README.md
publish-package make --output=.\artifacts
```

- 기본 대상은 `deploy`이며 `app`, `assemblies`, `hosts`, `tools`, `modules` 하위 전체 파일을 `deploy-filelist.txt`로 생성
- 대상 루트 경로는 `--ack` 또는 `--publishpath`로 지정할 수 있으며, 둘 다 지정하면 `--ack`를 우선 적용
- `--ack`는 `ack.exe` 또는 `ack.dll`의 전체 경로를 받으며, `.../app` 부모를 handstack 루트로 해석
- `--includes`는 배포 루트 기준 상대 하위 디렉터리 경로를 받음
- `transact`, `transact/Contracts`처럼 모듈 루트를 생략하면 `modules/transact`, `modules/transact/Contracts`로 해석
- 예: `--includes=tools/publish-package,transact/Contracts`면 `tools/publish-package`, `modules/transact/Contracts`만 포함
- `--exclude`는 쉼표(,)로 구분한 glob 패턴을 적용하며 파일 스캔과 `--makefile` 로딩 둘 다에 반영
- 지정한 하위 디렉터리가 실제로 없으면 예외 없이 건너뜀
- 생성되는 파일 목록은 기본적으로 현재 작업 디렉터리에 저장

### 변경분 배포 파일 목록 생성

```powershell
publish-package deploy-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt
publish-package deploy-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt --output=.\artifacts
publish-package deploy-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt --exclude=**/*.log,**/secrets*
publish-package runtimes-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt
publish-package runtimes-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt --exclude=tools/tmp/**
publish-package modules-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt
publish-package modules-diff --makefile=.\deploy-filelist.txt --prevfile=.\packages\deploy-2026.04.001.txt --exclude=modules/sample/**
```

- `--prevfile`을 기준으로 `--makefile`의 현재 목록을 비교
- `--exclude`를 지정하면 현재 목록과 이전 목록 모두에서 일치 항목을 제외한 뒤 diff를 계산
- 신규 파일은 `C`, 내용 변경 파일은 `U`, 제거 파일은 `D`로 출력
- `deploy-diff`는 통합 manifest 기준으로 `deploy-diff-filelist.txt`를 생성
- `runtimes-diff`, `modules-diff`는 `deploy-filelist.txt`와 `deploy-*.txt`를 입력으로 받아도 해당 범위만 자동 필터링
- 결과 파일은 기본적으로 현재 작업 디렉터리의 `deploy-diff-filelist.txt`, `runtimes-diff-filelist.txt`, `modules-diff-filelist.txt`

### ZIP 패키지 생성

```powershell
publish-package compress
publish-package compress --ack=..\publish\win-x64\handstack\app\ack.exe
publish-package compress --makefile=.\deploy-diff-filelist.txt
publish-package compress --includes=tools/publish-package,transact/Contracts
publish-package compress --exclude=**/*.log,**/secrets*,**/node_modules,**/values.dev.yaml,LICENSE,README.md
publish-package compress --publishpath=..\publish\win-x64\handstack
publish-package compress --output=.\artifacts
```

- 결과 ZIP은 기본적으로 현재 작업 디렉터리의 `packages` 디렉터리에 생성
- `--output`을 지정하면 해당 디렉터리 아래 `packages` 디렉터리에 생성
- 대상 루트 경로는 `--ack` 또는 `--publishpath`로 지정할 수 있으며, 둘 다 지정하면 `--ack`를 우선 적용
- `--includes`를 지정하면 ZIP 대상과 `--makefile` 로딩 결과를 같은 기준으로 다시 제한
- `--exclude`를 지정하면 ZIP 대상과 `--makefile` 로딩 결과에서 일치 항목을 제외
- `--makefile`이 있으면 목록 파일 기준으로 ZIP 대상을 제한하고, 해당 파일도 ZIP 루트에 함께 포함
- `D` 항목은 ZIP에 포함하지 않음
- ZIP 생성 시 같은 이름의 기준 manifest `.txt`를 함께 생성

예:

```text
artifacts/
├─ deploy-filelist.txt
└─ packages/
   ├─ deploy-2026.04.001.zip
   └─ deploy-2026.04.001.txt
```

`packages/*.txt`는 해당 ZIP을 만든 시점의 전체 기준 파일 목록이므로, 다음 배포의 `--prevfile` 입력으로 그대로 사용할 수 있습니다.

## 옵션

- `--publishpath`: 배포 루트 `handstack` 경로 또는 그 상위 publish 경로
- `--ack`: `ack.exe` 또는 `ack.dll` 전체 파일 경로. `make`, `compress`에서 대상 루트 해석에 사용하며 `--publishpath`보다 우선
- `--makefile`: 압축 또는 diff 계산에 사용할 파일 목록 경로
- `--includes`: `make`, `compress`에서 사용할 배포 루트 기준 하위 디렉터리 경로 목록. 쉼표(,)로 구분
- `--exclude`: `make`, `compress`, `deploy-diff`, `runtimes-diff`, `modules-diff`에서 제외할 glob 패턴 목록. 쉼표(,)로 구분
- `--prevfile`: 이전 배포 기준 파일 목록 경로
- `--output`: 생성 파일 출력 디렉터리 경로. 생략 시 명령 실행 작업 디렉터리

## 진행률 출력

- `make`, `compress` 실행 중 파일 처리 진행률을 콘솔 한 줄 갱신 형태로 표시합니다.
- 출력 형식: `진행 중 (진행 건수/총 건수)`
- 예:

```text
진행 중 (128/1024)
```

## 로그

로그는 콘솔과 파일에 동시에 기록되며 파일 경로는 `./log/publish-package.log`입니다. `rollingInterval=Day` 설정 때문에 실제 생성 파일명은 `publish-package20260402.log` 형식으로 기록됩니다.
각 명령의 주요 진행 구간과 예외 stack trace도 같은 파일 로그에 함께 남습니다.

## 출력 예시

```text
[09:13:24 INF] 파일 목록을 생성했습니다. Target=deploy, PublishPath=C:\publish\win-x64\handstack, Includes=(all), Excludes=(none), FileCount=120, Output=C:\work\deploy-filelist.txt
[09:13:34 INF] ZIP 패키지를 생성했습니다. Target=deploy, PublishPath=C:\publish\win-x64\handstack, Includes=(all), Excludes=(none), FileCount=48, Output=C:\work\packages\deploy-2026.04.001.zip, Manifest=C:\work\packages\deploy-2026.04.001.txt, Size=204800
[09:14:00 INF] 변경분 파일 목록을 생성했습니다. Target=deploy, CurrentFile=C:\work\deploy-filelist.txt, PrevFile=C:\work\packages\deploy-2026.04.001.txt, FileCount=3, Output=C:\work\deploy-diff-filelist.txt
```
