# HandStack AGENTS Guide

## 목적
이 저장소의 에이전트는 HandStack을 `ack` 호스트 위에 모듈과 계약을 조립하는 플랫폼으로 다룬다. 이 문서는 신규 개발자 1~2주 온보딩, 운영 개발자의 실행/배포/운영 파악, 아키텍트 리뷰어의 호스트-모듈-계약 분석을 동시에 지원한다.

## 작업 프롬프트 규약
큰 작업은 시작 전에 아래 4줄을 먼저 적는다.
- `Goal`: 바꾸려는 기능, 버그, 문서의 단일 목표
- `Constraints`: 변경 금지 범위, 영향 받는 호스트/모듈, 필요한 환경
- `Done`: 빌드, 실행, 문서까지 포함한 완료 판정 기준
- `Persona`: `new-dev` | `ops-dev` | `architect`
`new-dev`: 구조와 읽기 순서를 우선 설명한다.
`ops-dev`: 실행 명령, 설정 파일, 배포 경로, 로그 위치를 우선 다룬다.
`architect`: `ack -> module.json -> ModuleInitializer -> transact/function/dbclient` 흐름과 확장 포인트를 우선 본다.
완료 기준은 측정 가능해야 한다. 신규 개발자는 읽기 순서와 핵심 파일을 따라갈 수 있어야 하고, 운영 개발자는 실행·배포·로그 확인 절차를 재현할 수 있어야 하며, 아키텍트는 확장 인터페이스와 요청 흐름을 파일 단위로 설명할 수 있어야 한다.

## 빠른 개요
- `1.WebHost/ack`: 메인 ASP.NET Core 호스트, 전역 설정과 모듈 로딩 담당
- `1.WebHost/agent`: 여러 `ack` 프로세스 제어 API
- `1.WebHost/forbes`: 별도 웹 호스트
- `2.Modules/wwwroot`: 정적 자산, 공용 UI, 계약 기반 화면
- `2.Modules/transact`: 거래 계약 해석, 검증, 라우팅
- `2.Modules/function`: Node/C#/Python 함수 실행
- `2.Modules/dbclient`: DB 질의 실행
- `2.Modules/repository`, `logger`, `checkup`: 파일, 로그, 운영 기능
- `2.Modules/forwarder`: Playwright 기반 세션 프록시, 기본 빌드/배포 스크립트에는 포함되지 않음
- `3.Infrastructure/HandStack.Web`: `GlobalConfiguration`, 모듈 계약, 런타임 공통 계층
- `4.Tool/CLI/handstack`: 운영 CLI(`start`, `stop`, `configuration`, `task`, `encrypt`, `extract` 등)

## 핵심 아키텍처
- 기본 흐름은 `ack`가 `appsettings.json`의 `LoadModules`를 읽고 `../modules/*/module.json`을 스캔한 뒤 `IModuleInitializer` 구현을 조립하는 구조다.
- 요청 흐름의 중심은 `wwwroot -> transact -> dbclient/function`이다.
- 계약 자산은 소스 기준 `2.Modules/*/Contracts`, 실행 기준 `%HANDSTACK_HOME%/contracts`와 `%HANDSTACK_HOME%/modules/*`에 배치된다.
- 먼저 읽을 파일: `README.md`, `SUMMARY.md`, `1.WebHost/ack/Program.cs`, `1.WebHost/ack/Startup.cs`, `3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs`, `3.Infrastructure/HandStack.Web/Modules/ModuleConfigurationManager.cs`, `1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs`.

## 실행 명령
- 전제 도구: Node.js `20.12.2+`, `gulp-cli`, `curl`, `.NET SDK 10.0`
- 설치: `./install.ps1` (`install.bat`, `install.sh` 대응)
- 기본 빌드: `./build.ps1`
- `ack` 로컬 실행: `dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,dbclient,function`
- `agent` 로컬 실행: `dotnet run --project 1.WebHost/agent/agent.csproj`
- 배포 산출물: `./publish.ps1 win publish Release x64`
- 배포 후 제어: `handstack start --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--port=8421"`, `handstack stop --port=8421`

## 테스트 기대치
- 전용 테스트 프로젝트는 현재 저장소에 없다. 최소 기대치는 관련 프로젝트 빌드 성공과 수동 재현 절차 기록이다.
- 일반 변경은 `build.ps1`로 검증한다.
- `agent`, `forwarder`, `ports`, `dotnet-installer`를 수정했다면 기본 `build.ps1`에 포함되지 않으므로 `dotnet build <csproj>`를 추가로 실행한다.
- `publish.ps1`는 기본적으로 `ack`, `forbes`, 핵심 모듈, `handstack`/`edgeproxy`/`bundling` CLI를 패키징한다. `agent`나 `forwarder`를 배포 대상에 포함할 때는 별도 확인이 필요하다.
- 런타임, 계약, 운영 스크립트 변경은 가능하면 `ack` 기동 후 대상 엔드포인트 또는 CLI까지 스모크 테스트한다.

## 핵심 위치
- 호스트 설정: `1.WebHost/ack/appsettings.json`
- 모듈 설정: `2.Modules/*/module.json`
- 호스트-모듈 연결: `1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs`
- 모듈 계약 인터페이스: `3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs`
- 모듈 검색기: `3.Infrastructure/HandStack.Web/Modules/ModuleConfigurationManager.cs`
- 거래 진입점: `2.Modules/transact/Areas/transact/Controllers/TransactionController.cs`
- 함수 진입점: `2.Modules/function/Areas/function/Controllers/ExecutionController.cs`
- 운영 CLI: `4.Tool/CLI/handstack/Program.cs`

## 참고 문서
- 구조 설명은 `SUMMARY.md`
- `ack` 운영은 `1.WebHost/ack/README.md`
- `agent` 운영은 `1.WebHost/agent/README.md`
- 함수 모듈은 `2.Modules/function/README.md`
- 프록시 모듈은 `2.Modules/forwarder/README.md`
- CLI 명령은 `4.Tool/CLI/handstack/README.md`

## 변경 규칙
- 기본 출력 경로는 `HANDSTACK_HOME=../build/handstack`, 배포 경로는 `../publish/{os}-{arch}/handstack`다.
- 설정은 호스트의 `appsettings.json`, 각 모듈의 `module.json`, 계약 파일 순서로 확인한다.
- 요청 범위를 벗어난 리팩터링, 대규모 포맷팅, 산출물 커밋은 금지한다.
- 새 하위 규칙이 반복해서 생길 때만 해당 디렉터리에 추가 `AGENTS.md`를 만든다.
