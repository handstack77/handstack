# GEMINI.md (HandStack + Gemini 협업 지침)

> Gemini가 **HandStack 레포지토리에서 일관되고 안전하게 작업**하도록 돕는 “에이전트용 README”입니다.
> 이 문서는 **명령어/테스트/구조/스타일/Git 워크플로/경계(금지 영역)** 를 정의하여, Gemini가 불필요한 실수와 과잉 변경을 줄이고 프로젝트의 컨텍스트를 정확히 파악하는 것을 목표로 합니다.

---

## 0) 이 레포의 한 줄 요약

HandStack은 **모듈(Module) 기반의 확장 가능한 웹 앱 프레임워크**이며, `1.WebHost`(호스트) + `2.Modules`(핵심 기능 모듈) + `3.Infrastructure`(공통 라이브러리) + `4.Tool`(CLI) 구조를 따릅니다.

---

## 1) 작업 시작 방식 (Analyze → Plan → Execute)

Gemini는 즉시 코드를 작성하기보다 **명세(스펙) 분석 → 계획 수립 → 작은 단위의 변경** 순서를 우선합니다.

### 1.1 “스펙 체크리스트” 작성 및 확인
작업 전 아래 항목을 확인하고, 불명확한 부분은 **가정/질문/트레이드오프**로 정리하여 사용자에게 확인합니다.

- **Goal**: 무엇을/왜 바꾸는가?
- **Scope**: 작업 범위(In scope)와 건드리지 말아야 할 범위(Out of scope) 명시
- **Acceptance Criteria**: 검증 가능한 성공 기준
- **Impact**: 변경이 영향을 미치는 모듈/호스트/CLI 식별
- **Commands**: 빌드 및 실행에 사용할 명령어 확보

### 1.2 단계적 진행
복잡한 작업은 한 번에 처리하지 않고, 논리적인 단계(Step-by-step)로 나누어 진행합니다.

---

## 2) 프로젝트 필수 전제 (환경/버전/도구)

### 2.1 필수 도구(개발 환경 기준)
- **Node.js**: v20.12.2 LTS 이상
- **gulp CLI**: 전역 설치 필요 (`npm i -g gulp-cli`)
- **curl**: 설치 필요
- **.NET SDK**: **10.0** 필요 (Target framework: `net10.0`)
- **rsync**: macOS/Linux 환경에서 동기화 스크립트에 사용

### 2.2 핵심 환경 변수
- `DOTNET_CLI_TELEMETRY_OPTOUT=1` (자동 설정됨)
- `HANDSTACK_SRC`: 레포 루트 경로
- `HANDSTACK_HOME`: 기본값 `../build/handstack` (레포 상위 폴더 기준)

---

## 3) 자주 쓰는 명령어 (실행 가능한 진실)

> Gemini는 아래의 **검증된 커맨드**를 최우선으로 사용하여 작업을 수행하고 검증해야 합니다.

### 3.1 설치(의존성/환경 구성)
- **Windows (CMD)**: `.\install.bat`
- **PowerShell**: `.\install.ps1`
- **macOS/Linux**: `chmod +x ./install.sh && ./install.sh`

### 3.2 빌드(개발/검증)
- **Windows (CMD)**: `.\build.bat`
- **PowerShell**: `.\build.ps1`
- **macOS/Linux**: `chmod +x ./build.sh && ./build.sh`

### 3.3 패키징/배포 (Publish)
- **macOS/Linux 예시**: `./publish.sh win build Debug x64`
- **PowerShell 예시**: `.\publish.ps1 win publish Release x64`
> 출력 위치: `HANDSTACK_SRC/../publish/{os}-{arch}`

---

## 4) 레포 구조 이해 (Context Map)

### 4.1 상위 폴더 의미
- `1.WebHost/`
  - `ack/`: 주요 ASP.NET Core 호스트 (메인 진입점)
  - `forbes/`: 추가 호스트
- `2.Modules/`
  - `wwwroot/`: 클라이언트 자산 및 Gulp 번들링 로직 포함
  - `dbclient/`, `function/`, `logger/`, `repository/` 등: 핵심 비즈니스 로직 모듈
- `3.Infrastructure/`
  - `HandStack.Core/Web/Data`: 공통 기반 라이브러리
- `4.Tool/CLI/`: `handstack` CLI 도구 소스

### 4.2 주의사항
- `1.WebHost/ack`와 `2.Modules/wwwroot`는 Node/Gulp 의존성이 강하게 연결되어 있습니다.
- 설치 스크립트 실행 시 `lib.zip`이 `wwwroot/lib`로 해제되는 과정이 포함됩니다.

---

## 5) 코딩 스타일 / 규칙 (Format Contract)

### 5.1 .editorconfig 준수
- **들여쓰기**: Space 4칸
- **줄바꿈**: CRLF (`end_of_line=crlf`)
- **규칙**: 기존 코드의 스타일을 엄격히 따르며, Gemini 임의의 포맷팅(Prettier 등) 적용 금지.

### 5.2 네이밍 및 주석
- **C#**: PascalCase, camelCase 등 Microsoft .NET 관례 준수
- **주석**: 코드의 동작(What)보다는 의도와 이유(Why)를 설명

---

## 6) 변경 원칙 (Anti-Hallucination)

### 6.1 외과수술식 변경 (Surgical Changes)
- 요청된 목표 달성에 필요한 최소한의 코드만 수정합니다.
- 관련 없는 인접 코드의 스타일 변경이나 리팩토링을 금지합니다.

### 6.2 단순함 우선 (Simplicity First)
- 요청받지 않은 과도한 추상화, 디자인 패턴 도입, 옵션 추가를 지양합니다.
- 코드는 가능한 한 직관적이고 단순하게 유지합니다.

### 6.3 목표 기반 반복
- 버그 수정 시: **재현 → 수정 → 검증** 사이클 준수
- 기능 추가 시: **AC(성공 기준)** 만족 여부 확인

---

## 7) 테스트/검증 지침

> 최소한 **빌드 스크립트의 성공**은 필수 검증 조건입니다.

- **최소 검증**: 운영체제에 맞는 `build.(bat|sh|ps1)` 실행 및 성공 확인.
- **테스트 부재 시**: 새로운 테스트 프로젝트를 임의로 생성하지 말고, **재현 절차(Steps to Reproduce)** 와 **기대 결과**를 명확히 문서화하거나 로그를 통해 검증합니다.

---

## 8) Git 워크플로

- **커밋 메시지**: Conventional Commits 권장 (feat, fix, docs, refactor 등)
- **단일 책임**: 하나의 변경 요청(PR)에는 하나의 목표만 포함합니다.
- **문서 동기화**: 코드 변경으로 인해 스펙이나 가이드가 달라진 경우 관련 문서를 함께 업데이트합니다.

---

## 9) 경계(Boundaries) — 건드리지 말 것

### 9.1 절대 금지
- **보안**: 비밀번호, API 키, 토큰 하드코딩 금지.
- **자동 생성물**: `node_modules/`, `bin/`, `obj/`, `../build/`, `../publish/` 등 빌드 산출물 직접 수정 금지.
- **구조 변경**: 요청과 무관한 파일 이동, 폴더 구조 변경 금지.

### 9.2 사전 확인 필요 (Ask First)
- 새로운 런타임이나 무거운 의존성 추가.
- `publish.*`, `install.*`, `build.*` 등 핵심 스크립트 로직 변경.
- 모듈 간 데이터 계약(Contract) 변경.

---

## 10) HandStack 작업 스펙 템플릿

> Gemini는 작업 시작 전 이 템플릿을 기준으로 컨텍스트를 파악합니다.

### 10.1 SPEC
- **Goal**: (예: ack 호스트의 시작 속도 개선)
- **Context**:
  - 관련 모듈: `1.WebHost/ack`
  - 현재 문제:
- **In Scope**:
  - 1)
  - 2)
- **Out of Scope**:
  - (예: UI 전체 리팩토링)
- **Commands**:
  - Install: `.\install.bat` (Win) / `./install.sh` (Mac/Linux)
  - Build: `.\build.bat` (Win) / `./build.sh` (Mac/Linux)
- **Acceptance Criteria**:
  - [ ] 빌드 성공
  - [ ] 기능 정상 동작 확인
- **Risks**:
  - (예: 기존 모듈 호환성)

---

## 11) Gemini가 올바르게 작동하고 있다는 신호

- **Clean Diffs**: 변경 사항이 요청한 내용에만 집중되어 있다.
- **No Over-Engineering**: 불필요한 클래스나 인터페이스가 추가되지 않았다.
- **Proactive Confirmation**: 구현 전 모호한 부분에 대해 명확히 질문한다.