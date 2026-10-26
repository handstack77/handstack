# HandStack 테스트

솔루션과 실제 디스크의 `5.Test` 아래를 `1.WebHost`, `2.Modules`, `3.Infrastructure`로 동일하게 분류합니다. 테스트 프로젝트 이름에는 `HandStack.` 접두어를 사용하지 않습니다. 호스트 5개, 모듈 10개, 인프라 3개에 대응하는 .NET 10/xUnit 테스트 프로젝트 18개가 있습니다.

현재 실행 결과는 [VALIDATION.md](VALIDATION.md)에 기록합니다.

```text
5.Test/
├─ 1.WebHost/          # Ack.Tests, Agent.Tests, Deploy.Tests, Forbes.Tests, Rdy.Tests
├─ 2.Modules/         # Command.Tests, DbClient.Tests 등 모듈 테스트 10개
├─ 3.Infrastructure/  # Core.Tests, Data.Tests, Web.Tests
├─ Directory.Build.props
├─ Test.ps1
├─ README.md
└─ VALIDATION.md
```

## 실행

저장소 루트에서 실행합니다. 원본 프로젝트의 PostBuild는 실행 결과와 계약을 복사하므로 전체 실행에는 격리 경로를 설정하는 스크립트를 사용합니다.

```powershell
# 모든 테스트 프로젝트를 순서대로 빌드·실행합니다.
./5.Test/Test.ps1

# 특정 프로젝트의 회귀 테스트를 실행합니다.
./5.Test/Test.ps1 -Project DbClient.Tests

# 테스트 메서드 조건을 추가합니다.
./5.Test/Test.ps1 -Project Transact.Tests -Filter 'FullyQualifiedName~DataMapValidationTests'

# Release 구성으로 실행합니다.
./5.Test/Test.ps1 -Configuration Release

# 개별 프로젝트도 직접 실행할 수 있습니다.
dotnet test 5.Test/3.Infrastructure/Core.Tests/Core.Tests.csproj
```

스크립트는 임시 `HANDSTACK_HOME`과 `RdyWwwrootOutputDir`을 생성하고 기존 환경 변수를 복원합니다. 끝에 프로젝트별 결과와 TRX 저장 경로를 표시하며 빌드·테스트 실패나 결과 파일 누락이 있으면 종료 코드 1을 반환합니다. 결과는 임시 디렉터리에 남깁니다.

`Directory.Build.props`는 공통 패키지, 비배포 설정과 ProjectReference의 격리 출력 기본값을 관리합니다. 개별 프로젝트를 직접 실행해도 참조 프로젝트의 PostBuild는 기본적으로 임시 `handstack-tests/<테스트 프로젝트>` 아래에 복사합니다. 사용자 지정 격리 경로는 `HANDSTACK_TEST_HOME`으로 설정할 수 있습니다. 테스트는 `build.*`의 실행 프로젝트 목록과 `publish.*` 배포 목록에 추가하지 않습니다.

## 프로젝트별 기본 회귀 범위

| 원본 | 테스트 프로젝트 | 검증 범위 |
|---|---|---|
| `1.WebHost/ack` | [Ack.Tests](1.WebHost/Ack.Tests/Ack.Tests.csproj) | MVC 라우팅 값 변환과 누락 값 |
| `1.WebHost/agent` | [Agent.Tests](1.WebHost/Agent.Tests/Agent.Tests.csproj) | 관리 키 인증 거부·공백 처리·헤더 설정 |
| `1.WebHost/deploy` | [Deploy.Tests](1.WebHost/Deploy.Tests/Deploy.Tests.csproj) | 패키지 설치 경로 허용 목록·상위 경로 이탈 거부 |
| `1.WebHost/forbes` | [Forbes.Tests](1.WebHost/Forbes.Tests/Forbes.Tests.csproj) | 실제 임시 파일의 JSON/XML 다중 필터 감지 |
| `1.WebHost/rdy` | [Rdy.Tests](1.WebHost/Rdy.Tests/Rdy.Tests.csproj) | 정적 결합 호스트의 MVC 라우팅 값 변환 |
| `2.Modules/command` | [Command.Tests](2.Modules/Command.Tests/Command.Tests.csproj) | CLI/HTTP 계약 파싱·seq 보존·비활성 계약 |
| `2.Modules/dbclient` | [DbClient.Tests](2.Modules/DbClient.Tests/DbClient.Tests.csproj) | SQL 필터 값 바인딩·미등록 필터 거부 |
| `2.Modules/forwarder` | [Forwarder.Tests](2.Modules/Forwarder.Tests/Forwarder.Tests.csproj) | IP 허용 목록·BearerToken 누락 거부 |
| `2.Modules/function` | [Function.Tests](2.Modules/Function.Tests/Function.Tests.csproj) | 함수 작업 대기·시간 초과·예외 전달 |
| `2.Modules/graphclient` | [GraphClient.Tests](2.Modules/GraphClient.Tests/GraphClient.Tests.csproj) | 조회 결과 컬럼의 클라이언트 메타데이터 |
| `2.Modules/logger` | [Logger.Tests](2.Modules/Logger.Tests/Logger.Tests.csproj) | 로그 SQL 매개변수화·필수 값 검증 |
| `2.Modules/prompter` | [Prompter.Tests](2.Modules/Prompter.Tests/Prompter.Tests.csproj) | 파라미터 접두사와 프롬프트 치환 문법 |
| `2.Modules/repository` | [Repository.Tests](2.Modules/Repository.Tests/Repository.Tests.csproj) | 로컬 파일 덮어쓰기 정책·확장자 필터 |
| `2.Modules/transact` | [Transact.Tests](2.Modules/Transact.Tests/Transact.Tests.csproj) | Form/Grid 입력 형식·업무 검증 식 |
| `2.Modules/wwwroot` | [Wwwroot.Tests](2.Modules/Wwwroot.Tests/Wwwroot.Tests.csproj) | 동기화 요청 정규화·필수 항목 검증 |
| `3.Infrastructure/HandStack.Core` | [Core.Tests](3.Infrastructure/Core.Tests/Core.Tests.csproj) | 네 압축 인코딩의 Unicode·제어 문자 왕복 |
| `3.Infrastructure/HandStack.Data` | [Data.Tests](3.Infrastructure/Data.Tests/Data.Tests.csproj) | 실제 인메모리 SQLite 매개변수·DataTable 조회 |
| `3.Infrastructure/HandStack.Web` | [Web.Tests](3.Infrastructure/Web.Tests/Web.Tests.csproj) | OS 설정의 배열 교체·객체 병합·후속 공급자 우선순위 |

function/logger/wwwroot의 내부 규칙은 지정한 테스트 어셈블리에만 `InternalsVisibleTo`로 공개합니다. 업무 API의 공개 범위는 바뀌지 않습니다. 임시 파일이 필요한 테스트 클래스는 자체 비공개 `TestDirectory`를 포함하며, 테스트 전용 경로를 확인한 뒤 정리합니다.

## 환경 의존 통합 검증

일반 테스트에는 외부 DB, 그래프 서버, 실제 LLM, 클라우드 저장소, 프로세스 시작·중지와 배포 적용을 연결하지 않습니다. 각 환경이 준비된 경우 해당 기능의 통합 검증을 추가합니다. SQLite와 파일 감시 테스트는 테스트가 소유한 로컬 데이터만 사용합니다.
