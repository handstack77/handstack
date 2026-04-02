# publish-package CLI

`publish-package`는 `publish.ps1`로 생성한 HandStack 배포 산출물에서 파일 목록, 변경분 목록, 업데이트 ZIP 패키지를 만드는 .NET 10 기반 CLI 도구입니다.

기본 기준 경로는 실행 OS/아키텍처에 맞는 `../publish/<rid>/handstack`를 자동 탐지하며, 필요하면 `--publishpath`로 `handstack` 루트 또는 그 상위 publish 경로를 직접 지정할 수 있습니다.
기본 출력 경로는 명령을 실행한 작업 디렉터리이며, 필요하면 `--output`으로 별도 디렉터리를 지정할 수 있습니다.

## 주요 기능

- `runtimes-filelist.txt` 생성
- `modules-filelist.txt` 생성
- `runtimes-diff-filelist.txt` 생성
- `modules-diff-filelist.txt` 생성
- `runtimes-<yyyy.MM.rollingno>.zip` 생성
- `modules-<yyyy.MM.rollingno>.zip` 생성
- ZIP과 함께 같은 이름의 기준 manifest `.txt` 생성

`rollingno`는 같은 월(`yyyy.MM`)과 같은 대상(`runtimes`, `modules`) 기준으로 출력 디렉터리 아래 `packages`의 기존 ZIP을 스캔해 3자리 증가값으로 계산합니다. 예: `runtimes-2026.04.001.zip`

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
publish-package make --target=runtimes
publish-package make --target=modules
publish-package make --target=runtimes --publishpath=..\publish\win-x64\handstack
publish-package make --target=runtimes --includes=app,assemblies,transact
publish-package make --target=modules --includes=app,assemblies,transact
publish-package make --target=modules --output=.\artifacts
```

- `runtimes`: `app`, `assemblies`, `hosts`, `tools` 하위 전체 파일을 `runtimes-filelist.txt`로 생성
- `modules`: `modules` 하위 전체 파일을 `modules-filelist.txt`로 생성
- `--includes`를 지정하면 `runtimes`는 루트 1차 디렉터리(`app`, `assemblies`, `hosts`, `tools`)만, `modules`는 `modules/<name>` 1차 디렉터리만 대상으로 제한
- 예: `--target=runtimes --includes=app,assemblies,transact`면 `app`, `assemblies`만 포함되고 `transact`는 건너뜀. `--target=modules --includes=app,assemblies,transact`면 `modules/transact`만 포함
- 지정한 하위 디렉터리가 실제로 없으면 예외 없이 건너뜀
- 생성되는 파일 목록은 기본적으로 현재 작업 디렉터리에 저장

### 변경분 배포 파일 목록 생성

```powershell
publish-package runtimes-diff --makefile=.\runtimes-filelist.txt --prevfile=.\packages\runtimes-2026.04.001.txt
publish-package modules-diff --makefile=.\modules-filelist.txt --prevfile=.\packages\modules-2026.04.001.txt
publish-package runtimes-diff --makefile=.\runtimes-filelist.txt --prevfile=.\packages\runtimes-2026.04.001.txt --output=.\artifacts
```

- `--prevfile`을 기준으로 `--makefile`의 현재 목록을 비교
- 신규 파일은 `C`, 내용 변경 파일은 `U`, 제거 파일은 `D`로 출력
- 결과 파일은 기본적으로 현재 작업 디렉터리의 `runtimes-diff-filelist.txt`, `modules-diff-filelist.txt`

### ZIP 패키지 생성

```powershell
publish-package compress --target=runtimes
publish-package compress --target=runtimes --makefile=.\runtimes-diff-filelist.txt
publish-package compress --target=modules
publish-package compress --target=modules --makefile=.\modules-diff-filelist.txt
publish-package compress --target=runtimes --includes=app,assemblies,transact
publish-package compress --target=modules --makefile=.\modules-diff-filelist.txt --includes=app,assemblies,transact
publish-package compress --target=modules --publishpath=..\publish\win-x64\handstack
publish-package compress --target=modules --output=.\artifacts
```

- 결과 ZIP은 기본적으로 현재 작업 디렉터리의 `packages` 디렉터리에 생성
- `--output`을 지정하면 해당 디렉터리 아래 `packages` 디렉터리에 생성
- `--includes`를 지정하면 ZIP 대상과 `--makefile` 로딩 결과를 같은 기준으로 다시 제한
- `--makefile`이 있으면 목록 파일 기준으로 ZIP 대상을 제한하고, 해당 파일도 ZIP 루트에 함께 포함
- `D` 항목은 ZIP에 포함하지 않음
- ZIP 생성 시 같은 이름의 기준 manifest `.txt`를 함께 생성

예:

```text
artifacts/
├─ runtimes-filelist.txt
└─ packages/
   ├─ runtimes-2026.04.001.zip
   └─ runtimes-2026.04.001.txt
```

`packages/*.txt`는 해당 ZIP을 만든 시점의 전체 기준 파일 목록이므로, 다음 배포의 `--prevfile` 입력으로 그대로 사용할 수 있습니다.

## 옵션

- `--target`: `runtimes` 또는 `modules`
- `--publishpath`: 배포 루트 `handstack` 경로 또는 그 상위 publish 경로
- `--makefile`: 압축 또는 diff 계산에 사용할 파일 목록 경로
- `--includes`: `make`, `compress`에서 사용할 첫 번째 하위 디렉터리 이름 목록. 쉼표(,)로 구분
- `--prevfile`: 이전 배포 기준 파일 목록 경로
- `--output`: 생성 파일 출력 디렉터리 경로. 생략 시 명령 실행 작업 디렉터리

## 로그

`bundling`과 동일하게 `appsettings.json` 기반 Serilog 구성을 사용하며 기본 파일 로그 경로는 `../log/app.log`입니다. `rollingInterval=Day` 설정 때문에 실제 생성 파일명은 `app20260402.log` 형식으로 기록됩니다.
각 명령의 주요 진행 구간과 예외 stack trace도 같은 파일 로그에 함께 남습니다.

## 출력 예시

```text
[09:13:24 INF] 파일 목록을 생성했습니다. Target=runtimes, PublishPath=C:\publish\win-x64\handstack, FileCount=120, Output=C:\work\runtimes-filelist.txt
[09:13:34 INF] ZIP 패키지를 생성했습니다. Target=modules, PublishPath=C:\publish\win-x64\handstack, FileCount=48, Output=C:\work\packages\modules-2026.04.001.zip, Manifest=C:\work\packages\modules-2026.04.001.txt, Size=204800
[09:14:00 INF] 변경분 파일 목록을 생성했습니다. Target=runtimes, CurrentFile=C:\work\runtimes-filelist.txt, PrevFile=C:\work\packages\runtimes-2026.04.001.txt, FileCount=3, Output=C:\work\runtimes-diff-filelist.txt
```
