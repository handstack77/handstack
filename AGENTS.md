# HandStack AGENTS Guide

## 목적
이 저장소의 에이전트는 HandStack을 .NET 10 기반 호스트에 모듈, 계약, 정적 자산과 운영 도구를 조립하는 플랫폼으로 다룬다. 이 문서는 신규 개발자 1~2주 온보딩, 운영 개발자의 실행·배포·운영 파악, 아키텍트 리뷰어의 호스트-모듈-계약 분석을 동시에 지원한다.

정확성의 우선순위는 실제 소스와 프로젝트 파일, `appsettings.json`/`module.json`, 빌드·배포 스크립트, README/SUMMARY 순서다. 문서와 구현이 다르면 추측하지 말고 실행 경로를 따라 확인한 뒤 문서도 함께 바로잡는다.

## 작업 프롬프트 규약
큰 작업은 시작 전에 아래 4줄을 먼저 적는다.
- `Goal`: 바꾸려는 기능, 버그, 문서의 단일 목표
- `Constraints`: 변경 금지 범위, 영향 받는 호스트/모듈, 필요한 환경
- `Done`: 빌드, 실행, 문서까지 포함한 완료 판정 기준
- `Persona`: `new-dev` | `ops-dev` | `architect`
`new-dev`: 구조와 읽기 순서를 우선 설명한다.
`ops-dev`: 실행 명령, 설정 파일, 배포 경로, 로그 위치를 우선 다룬다.
`architect`: `ack/rdy -> module.json -> ModuleInitializer -> transact -> 실행 모듈` 흐름과 확장 포인트를 우선 본다.
완료 기준은 측정 가능해야 한다. 신규 개발자는 읽기 순서와 핵심 파일을 따라갈 수 있어야 하고, 운영 개발자는 실행·배포·로그 확인 절차를 재현할 수 있어야 하며, 아키텍트는 확장 인터페이스와 요청 흐름을 파일 단위로 설명할 수 있어야 한다.

## Codex 작업 절차
- 시작 전에 현재 디렉터리에 적용되는 `AGENTS.md`와 `git status --short`를 확인한다. 기존 변경과 생성 파일은 사용자의 작업으로 보고 덮어쓰거나 정리하지 않는다.
- 탐색은 `rg --files`, `rg`를 우선 사용하고, 한 가지 설명만 믿지 말고 진입점·설정·프로젝트 파일·스크립트를 함께 대조한다.
- 변경은 요청과 직접 관련된 최소 범위로 제한한다. 기존 `Startup`/MVC/모듈 패턴을 존중하며 별도 요청 없이 호스팅 모델이나 계약 형식을 대규모로 바꾸지 않는다.
- 빌드 전에 대상 프로젝트의 PostBuild가 `HANDSTACK_HOME`을 지우거나 덮어쓰는지 확인한다. 이 저장소의 호스트, 모듈, 여러 CLI 프로젝트는 빌드 결과를 `HANDSTACK_HOME/app`, `modules/*`, `tools/*`로 동기화한다.
- 검증은 영향받은 가장 작은 프로젝트에서 시작하고, 호스트·계약·운영 스크립트 변경이면 관련 호스트 기동과 엔드포인트/CLI 스모크 테스트까지 확장한다.
- 완료 보고에는 변경 파일, 실행한 검증과 결과, 실행하지 못한 검증과 이유, 연계 문서 반영 여부를 적는다.

## 빠른 개요
- `1.WebHost/ack`: 기본 포트 8421의 메인 ASP.NET Core 호스트. 선택한 모듈 DLL을 런타임에 동적으로 로드한다.
- `1.WebHost/rdy`: 기본 모듈을 ProjectReference로 정적 결합하고, 그 밖의 선택 모듈은 `ack` 방식으로 동적 로드하는 단일 호스트다. `ack`와 코드가 유사하지만 별도 검증 대상이다.
- `1.WebHost/agent`: 기본 포트 8422의 관리 API. 여러 `ack` 프로세스의 시작·중지·재시작, 설정/모듈 설정, 로그와 호스트 통계를 다룬다.
- `1.WebHost/deploy`: 기본 포트 8520의 자동 업데이트 패키지/manifest 호스트다.
- `1.WebHost/forbes`: 기본 포트 8420의 정적 파일 및 Contracts 동기화 호스트다.
- `2.Modules/wwwroot`: 정적 자산, 공용 UI, `/view` 계약 화면과 파일 동기화 API를 제공한다.
- `2.Modules/transact`: 거래 계약 해석, 요청 검증, 라우팅, 워크플로, 응답 조립을 담당한다.
- `2.Modules/dbclient`, `graphclient`: 각각 SQL DB와 Neo4j/Memgraph Cypher 계약을 실행한다.
- `2.Modules/function`, `command`, `prompter`: 각각 Node/C#/Python 함수, CLI/Web 명령, LLM 프롬프트 계약을 실행한다.
- `2.Modules/repository`, `logger`, `checkup`: 파일 저장소, 공통 로그 수집, 운영 관리 기능을 제공한다.
- `2.Modules/forwarder`: 화이트리스트 기반 HTTP 포워드 프록시다.
- `3.Infrastructure/HandStack.Core|Data|Web`: 공통 확장, 데이터 접근, `GlobalConfiguration`과 모듈 계약을 제공한다. 소비 프로젝트는 기본적으로 `3.Infrastructure/Assemblies/{Debug|Release}`의 DLL을 참조한다.
- `4.Tool/CLI`: `handstack`, `handsonapp`, `bundling`, `edgeproxy`, `dbplatform`, `dotnet-installer`, `ports`, `updater`, `publish-package` 등 개발·운영·배포 도구를 포함한다.

## 핵심 아키텍처
- `ack/Program.cs`는 기본 `appsettings.json`, `ACK_ENVIRONMENT`에 따른 환경별 JSON, 환경 변수를 합치고 `--modules` 또는 `AppSettings:LoadModules`로 로드 대상을 결정한다. `--modules`를 주면 기본 목록을 대체한다.
- `Startup.ConfigureServices`가 `LoadModuleBasePath`를 해석하고 `ServiceCollectionExtensions.AddModules()`를 호출한다. `ModuleConfigurationManager`는 선택된 이름과 일치하는 `../modules/<module>/module.json`을 읽고, `ack`는 해당 폴더의 DLL을 `AssemblyLoadContext`로 로드한다.
- 각 DLL에서 `IModuleInitializer` 구현을 찾아 `ConfigureServices`를 호출하고 DI에 등록한 뒤, `Startup.Configure`에서 각 모듈의 `Configure`를 호출한다. MVC 컨트롤러는 ApplicationPart로 합성된다. 런타임 설정 반영을 지원하는 모듈은 `IModuleRuntimeConfiguration`도 구현할 수 있다.
- `rdy`도 `module.json`을 읽고 `command`, `dbclient`, `function`, `graphclient`, `logger`, `prompter`, `repository`, `transact`, `wwwroot`의 정적 어셈블리를 우선 연결한다. `AppSettings:LoadModules`에 있으나 정적 사전에 없는 모듈은 `ack`와 같이 모듈 디렉터리의 DLL을 `AssemblyLoadContext.Default`로 동적 로드한다.
- 기본 업무 흐름은 `브라우저/화면 -> wwwroot -> /transact/api/transaction/execute -> 실행 모듈`이다. `transact/module.json`의 기본 라우팅은 `D -> dbclient`, `G -> graphclient`, `F -> function`, `C -> command`, `P -> prompter`이며 `W`는 `WorkflowController` 내부 오케스트레이션이다.
- 계약 자산은 소스에서 주로 `2.Modules/*/Contracts`에 있고 빌드 결과의 모듈 폴더에 포함된다. 실행 시 모듈 설정과 `IsCopyContract`/`IsPurgeContract` 정책에 따라 `%HANDSTACK_HOME%/contracts`와 `%HANDSTACK_HOME%/modules/*`를 사용한다.
- 기본 `ack/appsettings.json`의 로드 모듈은 `wwwroot`, `transact`, `dbclient`, `graphclient`, `function`, `command`, `prompter`, `repository`, `logger`, `checkup`, `forwarder`다.

## 권장 읽기 순서
1. `README.md`, `SUMMARY.md`, `handstack.sln`
2. `1.WebHost/ack/Program.cs`, `ApplicationManager.cs`, `Startup.cs`, `appsettings.json`
3. `3.Infrastructure/HandStack.Web/GlobalConfiguration.cs`, `Modules/IModuleInitializer.cs`, `Modules/ModuleConfigurationManager.cs`
4. `1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs`와 대상 모듈의 `module.json`, `ModuleInitializer.cs`
5. `2.Modules/transact/Areas/transact/Controllers/TransactionController.cs`, `WorkflowController.cs`, `Extensions/TransactClient.cs`
6. 라우팅 대상 모듈의 `Areas/*/Controllers`와 `Contracts`
7. `build.*`, `publish.*`, `4.Tool/CLI/handstack/Command/HandstackCommandRegistry.cs`

## 실행 명령
- 전제 도구: Node.js `20.12.2+`, `gulp-cli`, `curl`, .NET SDK `10.0+`. `install.ps1`는 필요하면 `Microsoft.Web.LibraryManager.Cli`를 전역 설치한다.
- 환경 설정/설치: `./env.ps1`, `./install.ps1` (`.bat`, `.sh` 대응). 기본값은 `HANDSTACK_SRC=<저장소>`, `HANDSTACK_HOME=../build/handstack`다.
- 공통 인프라 DLL 재생성: `./assemblies.ps1`. `HandStack.Core`, `Data`, `Web`을 Debug/Release로 다시 만들고 `3.Infrastructure/Assemblies`를 교체하므로 인프라 변경 시에만 실행하고 diff를 확인한다.
- PowerShell 기본 빌드: `./build.ps1`. 솔루션 전체 restore/clean 후 명시된 프로젝트를 Debug로 빌드한다.
- `ack` 로컬 실행: `dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,dbclient,graphclient,function,command,prompter`
- 기타 호스트: `dotnet run --project 1.WebHost/agent/agent.csproj`, `dotnet run --project 1.WebHost/deploy/deploy.csproj`, `dotnet run --project 1.WebHost/forbes/forbes.csproj`
- `rdy` 실행: `dotnet run --project 1.WebHost/rdy/rdy.csproj -- --port=8421`. 정적 포함 모듈, `AppSettings:LoadModules`, `LoadModuleBasePath` 아래의 `module.json`과 추가 모듈 DLL을 함께 확인한다.
- `rdy` 설정 포트 일괄 변경: Windows는 `1.WebHost\rdy\task.bat 8420 9420` 또는 `pwsh 1.WebHost/rdy/task.ps1 8420 9420`, macOS/Ubuntu는 `sh 1.WebHost/rdy/task.sh 8420 9420`을 사용한다. Unix 계열에서는 PowerShell 7 이상(`pwsh`)이 필요하다.
- `rdy` Windows x64 출력 복사본: `1.WebHost\rdy\publish.bat [출력 디렉터리] [publish|build]`. 기본 `publish`는 Release framework-dependent single-file 결과를, `build`는 Debug RID 지정 rebuild 결과를 대상 디렉터리에 미러링한다. publish에서도 `SyncRdyWwwroot`가 `modules/wwwroot/wwwroot`를 동기화하고 `syn.config.json`의 포트를 반영한다. publish 루트의 전이 `Contracts`, `Prompts`, `Settings`, `SQL`, `libSkiaSharp.pdb`, 모듈 개발·테스트 보조 파일(`gulpfile.js`, `libman.json`, `node.config.json`, `featureTest.*`, `function.dll.config`), 모든 `.github` 디렉터리, `wwwroot/_content` 및 `.br`·`.gz` 압축 자산은 제거하고 `modules/*` 내부의 실행 자산은 유지한다.
- Windows x64 Release 배포: `./publish.ps1 win publish Release x64`. 기본 결과는 `../publish/win-x64/handstack`이다.
- 배포 후 제어: `handstack start --ack=%HANDSTACK_HOME%/app/ack.exe --arguments="--port=8421"`, `handstack stop --port=8421`

## 빌드·배포 스크립트의 현재 범위
- `build.ps1`은 10개 모듈(`forwarder` 제외), `ack/agent/deploy/forbes`, 9개 CLI를 빌드한다. `rdy`, `forwarder`, `excludedportrange`, `node-cli`는 별도 검증이 필요하다.
- OS별 스크립트 목록은 현재 완전히 같지 않다. `build.sh`는 `forwarder`를 포함하지만 `publish-package`를 제외하고, `build.bat`은 둘 다 제외한다. 스크립트를 수정할 때 `.ps1/.bat/.sh`의 의도된 동등성을 함께 검토한다.
- `publish.ps1`은 `ack`, 11개 모듈 전체, `bundling/dotnet-installer/edgeproxy/dbplatform/handsonapp/updater/handstack/ports/publish-package`를 패키징한다. `agent`, `deploy`, `forbes` 구문은 주석 상태이며 `rdy`, `excludedportrange`, `node-cli`도 포함하지 않는다.
- `publish.bat`/`publish.sh`는 현재 `publish-package`를 포함하지 않는다. 배포 검증은 실제 대상 OS의 스크립트를 기준으로 하고, 다른 변형과 차이가 의도된 것인지 기록한다.
- `publish.*`는 대상 publish 디렉터리를 먼저 지우고, 빌드 과정은 `HANDSTACK_HOME/contracts`와 모듈/도구 출력에도 영향을 줄 수 있다. 실행 전 절대 경로와 사용자 변경 유무를 확인한다.

## 테스트 기대치
- 전용 .NET 테스트 프로젝트는 현재 없다. 최소 기준은 관련 프로젝트 빌드 성공, 정적 검사, 수동 재현 또는 스모크 테스트 절차 기록이다.
- 일반 C# 변경은 우선 `dotnet build <관련 csproj> -c Debug`로 검증한다. 여러 모듈/호스트에 걸치면 `./build.ps1`로 확장한다.
- `3.Infrastructure` 변경은 `./assemblies.ps1`로 Debug/Release 공통 DLL을 재생성한 뒤 영향받는 모듈과 호스트를 다시 빌드한다. 생성된 DLL/서명 상태와 의도하지 않은 바이너리 변경을 확인한다.
- `rdy`, `forwarder`, `excludedportrange`, `node-cli` 또는 스크립트 기본 목록에서 빠진 프로젝트를 수정하면 해당 프로젝트/도구를 직접 빌드하거나 실행한다.
- `ack`, `module.json`, `ModuleInitializer`, 계약, 라우팅 변경은 `ack`를 필요한 모듈로 기동하고 `/checkip` 및 대상 API를 확인한다. 거래 변경은 가능하면 `/transact/api/transaction/execute`에서 실제 실행 모듈까지 확인한다.
- `agent`는 기본 8422 포트의 상태/대상 API, `deploy`는 8520의 `/release/manifest.json`, `forbes`는 8420의 정적 파일/동기화 경로를 스모크 테스트한다.
- CLI 변경은 `dotnet run --project <cli.csproj> -- <args>` 또는 빌드된 실행 파일로 해당 명령을 검증한다. `handstack stop`을 인자 없이 실행하면 여러 프로세스를 종료할 수 있으므로 테스트에서 사용하지 않는다.
- 정적 자산이나 Gulp 작업 변경은 해당 `npm`/`gulp` 빌드를 실행하고 산출물을 확인한다. 배포/업데이트 변경은 실제 대상 OS의 `publish.*`와 필요 시 `publish-package`/`updater` 흐름까지 확인한다.

## 핵심 위치
- 호스트 설정: `1.WebHost/ack/appsettings.json`
- 모듈 설정: `2.Modules/*/module.json`
- 동적 호스트-모듈 연결: `1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs`
- 정적 우선·동적 확장 호스트-모듈 연결: `1.WebHost/rdy/rdy.csproj`, `1.WebHost/rdy/Extensions/ServiceCollectionExtensions.cs`
- 모듈 계약 인터페이스: `3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs`
- 모듈 검색기: `3.Infrastructure/HandStack.Web/Modules/ModuleConfigurationManager.cs`
- 거래 진입점: `2.Modules/transact/Areas/transact/Controllers/TransactionController.cs`
- 워크플로 진입점: `2.Modules/transact/Areas/transact/Controllers/WorkflowController.cs`
- 실행 라우팅: `2.Modules/transact/Extensions/TransactClient.cs`, `2.Modules/transact/module.json`
- SQL/그래프/명령/프롬프트 진입점: `2.Modules/dbclient/Areas/dbclient/Controllers/QueryController.cs`, `2.Modules/graphclient/Areas/graphclient/Controllers/QueryController.cs`, `2.Modules/command/Areas/command/Controllers/ExecutionController.cs`, `2.Modules/prompter/Areas/prompter/Controllers/QueryController.cs`
- 함수 진입점: `2.Modules/function/Areas/function/Controllers/ExecutionController.cs`
- 운영 CLI 등록: `4.Tool/CLI/handstack/Program.cs`, `4.Tool/CLI/handstack/Command/HandstackCommandRegistry.cs`
- 빌드/배포: `assemblies.*`, `build.*`, `publish.*`, 각 프로젝트의 PostBuild Target

## 참고 문서
- 구조 설명은 `SUMMARY.md`
- `ack` 운영은 `1.WebHost/ack/README.md`
- `agent` 운영은 `1.WebHost/agent/README.md`
- 업데이트 배포 호스트는 `1.WebHost/deploy/README.md`
- 정적/계약 동기화 호스트는 `1.WebHost/forbes/README.md`
- 함수 모듈은 `2.Modules/function/README.md`
- 프록시 모듈은 `2.Modules/forwarder/README.md`
- CLI 명령은 `4.Tool/CLI/handstack/README.md`

## 연계 문서 자동 동기화
- HandStack 소스코드와 실제 동작을 기준으로 문서를 유지한다. 모든 프롬프트 실행과 코딩 작업은 시작할 때 아래 연계 디렉터리의 영향 범위를 확인하고, 기능·인터페이스·설정·계약·명령·경로·화면 동작이 바뀌면 별도 요청을 기다리지 말고 영향받는 문서와 예제를 같은 작업에서 함께 수정한다.
- `C:\projects\handstack77\handstack-docs\docs\`: 주요 기능, 아키텍처, 설치·실행, 설정, API, 운영 절차와 코드/명령 예제를 최신 소스에 맞춘다.
- `C:\projects\handstack77\handstack-docs\static\sample\`: 계약 스키마, API, 설정, 디렉터리 구조가 바뀌면 실행 가능한 샘플과 샘플 자산을 함께 갱신한다.
- `C:\projects\handstack77\handstack-docs\static\slides\`: 교육 흐름, 구조도, 명령, 코드 예제가 바뀌면 원본 Markdown을 수정하고, 해당되는 경우 `marp-slide.js`의 기존 절차로 HTML도 다시 생성한다.
- `C:\projects\handstack77\handstack-docs\static\uicontrols\`: UI 컨트롤의 API, 옵션, 이벤트, 사용법 또는 정적 자산이 바뀌면 컨트롤별 가이드와 데모를 함께 갱신한다.
- 특히 모듈 로딩, 요청 흐름, 계약 형식, CLI, 빌드·배포, 런타임 요구 사항, UI 컨트롤 변경은 연계 문서 반영 여부를 필수로 점검한다. 분석이나 문서 작업 중 기존 설명이 현재 소스와 다름을 발견한 경우에도 작업 범위에 관련된 불일치는 바로잡는다.
- 문서는 구현을 추측해 작성하지 않고 실제 소스, 설정 기본값, 실행 결과를 확인해 반영한다. 링크, 파일 경로, 명령, 예제의 일관성을 검토하고 가능하면 `handstack-docs`의 관련 빌드나 렌더링으로 검증한다.
- 영향이 없으면 연계 디렉터리를 불필요하게 수정하지 않는다. 완료 보고에는 수정한 연계 /문서 파일과 검증 결과를 포함하고, 수정하지 않은 경우에는 문서 영향이 없다고 판단한 근거를 남긴다. 연계 저장소가 없거나 쓰기·검증이 불가능하면 누락 사실과 후속 조치를 명시한다.
- 연계 문서 수정 시에도 요청 범위를 벗어난 대규모 재작성이나 포맷팅은 하지 않고, 소스 변경과 직접 관련된 최소 범위만 수정한다.

## 변경 규칙
- 설정 문제는 호스트 `appsettings*.json`과 환경 변수, `AppSettings:LoadModules`, 각 모듈 `module.json`, 런타임 계약 파일, 코드 기본값 순서로 추적한다.
- 비밀 키, 실제 계정, 운영 연결 문자열을 소스나 문서에 추가하지 않는다. 예시는 명백한 placeholder를 사용한다.
- 요청 범위를 벗어난 리팩터링, 대규모 포맷팅, 자동 생성 파일의 무관한 변경을 금지한다.
- `bin`, `obj`, `node_modules`, `.vs`, 로그, 임시/로컬 빌드 디렉터리는 수정·커밋하지 않는다. `3.Infrastructure/Assemblies`는 저장소가 추적하는 예외이므로 인프라 DLL을 의도적으로 갱신한 경우에만 포함한다.
- `module.json`의 ModuleID, 계약 경로, 라우팅 키, DTO/계약 필드를 바꾸면 생산자와 소비자, 샘플 계약, 문서를 함께 검색한다.
- 새 프로젝트나 모듈을 추가·삭제하면 `handstack.sln`, `ack/appsettings.json`, `rdy` 정적 참조 여부, `build.*`, `publish.*`, 설치 스크립트와 연계 문서를 함께 검토한다.
- 새 하위 규칙이 반복해서 생길 때만 해당 디렉터리에 추가 `AGENTS.md`를 만든다.
