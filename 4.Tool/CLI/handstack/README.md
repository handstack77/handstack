# handstack CLI

`handstack`는 HandStack 운영/개발 자동화를 위한 통합 CLI입니다. `ack` 프로세스 제어, 암복호화, 압축, 템플릿 생성, 배치 작업 실행까지 포함합니다.

## 사전 조건

- .NET SDK 10.0+
- `3.Infrastructure/Assemblies/<Configuration>/HandStack.Core.dll` 존재
- 일부 명령(`start`, `configuration`, `purgecontracts`)은 `ack` 경로/환경 필요

## 빌드

```powershell
dotnet build .\handstack\handstack.csproj
```

프로젝트 내 스크립트:

```powershell
.\handstack\build.ps1
```

## 실행

```powershell
dotnet run --project .\handstack -- <command> [options]
```

배포 실행 파일:

```powershell
handstack <command> [options]
```

## 루트 옵션

- `--debug`: 디버거 연결 대기
- `--port`: 루트 실행 시 포트 값(일부 시나리오)
- `--modules`: 로드 모듈 문자열
- `--options`: 명령별 추가 옵션 문자열

## 명령어 요약

| 명령어 | 설명 | 주요 옵션 |
| --- | --- | --- |
| `list` | 실행 중인 `ack` 프로세스 조회 | 없음 |
| `configuration` | ack/모듈 환경 설정 파일 반영 | `--ack`, `--appsettings` |
| `purgecontracts` | 중복 contract 파일 삭제 | `--ack`, `--directory` |
| `encryptcontracts` | Contracts 암호화 | `--file`(DLL), `--directory` |
| `startlog` | ack 시작 명령 문자열만 출력 | `--ack`, `--arguments`, `--appsettings` |
| `start` | ack 프로세스 시작 | `--ack`, `--arguments`, `--appsettings` |
| `stop` | ack 프로세스 종료 | `--pid` 또는 `--port` |
| `encrypt` | 값 인코딩/암호화 | `--format`, `--value`, `--key`, `--options` |
| `decrypt` | 값 디코딩/복호화 | `--format`, `--value`, `--key` |
| `compress` | 디렉터리 ZIP 압축 | `--directory`, `--file` |
| `extract` | ZIP 압축 해제 | `--file`, `--directory`, `--options` |
| `create` | 템플릿 ZIP 기반 프로젝트 생성 | `--file`, `--directory`, `--find`, `--replace` |
| `replacetext` | 텍스트 치환 | `--file`, `--find`, `--replace` |
| `task` | `task.json` 정의 배치 실행 | `--file`, `--value` |
| `synusage` | syn 함수/컨트롤 사용량 스캔 | `--directory`, `--value` |
| `publickey` | .NET DLL 공개키 정보 출력 | `--file` |

## encrypt/decrypt format

지원 포맷:

- `base64`
- `suid`
- `sqids`
- `aes256`
- `syn`
- `sha256`
- `connectionstring`

추가 규칙:

- `encrypt --format=base64`에서 `--options=string|file` 지원
- `sqids`는 `--key`를 alphabet으로 사용(미지정 시 기본 alphabet)

## 실행 예시

```powershell
handstack list
handstack startlog --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--modules=wwwroot,transact" --appsettings=ack.localhost.json
handstack start --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--port=8421"
handstack stop --port=8421

handstack encrypt --format=base64 --value="hello"
handstack decrypt --format=base64 --value="aGVsbG8="
handstack encrypt --format=connectionstring --value="Server=..."

handstack compress --directory=C:/tmp/myapp --file=C:/tmp/myapp.zip
handstack extract --file=C:/tmp/myapp.zip --directory=C:/tmp/unzip --options=true

handstack create --file=C:/tmp/template.zip --directory=C:/tmp/newapp --find=handstack --replace=myapp
handstack replacetext --file=C:/tmp/appsettings.json --find=localhost --replace=prod-host

handstack task --file=task.json --value=checkup:run
handstack task --file=task.json --value=*:copy

handstack synusage --directory="%HANDSTACK_HOME%/modules/wwwroot/wwwroot/view" --value=uicontrols > result.csv
handstack publickey --file="C:/projects/MyLib/bin/Release/net10.0/MyLib.dll"
```

## task 명령 참고

- 기본 입력 파일: `handstack/task.json`
- `--value` 형식:
  - 단일/다중: `module:task;module:task`
  - 전체 모듈: `*:task`

## 주의사항

- `stop`을 인자 없이 실행하면 검색된 `ack`/관련 `dotnet` 프로세스를 모두 종료할 수 있으므로 운영 환경에서 주의하세요.
- `purgecontracts`는 대상 파일을 삭제하는 명령이므로 실행 전 경로를 반드시 검증하세요.
