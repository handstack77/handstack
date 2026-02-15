# AGENTS.md (HandStack + Codex CLI 협업 지침)

> Codex CLI(및 기타 코딩 에이전트)가 **HandStack 레포에서 일관되고 안전하게 작업**하도록 돕는 “에이전트용 README”입니다.  
> 이 문서는 **명령어/테스트/구조/스타일/Git 워크플로/경계(금지 영역)** 를 한 곳에 모아, 불필요한 실수와 과잉 변경을 줄이는 것을 목표로 합니다. :contentReference[oaicite:0]{index=0}

---

## 0) 이 레포의 한 줄 요약

HandStack은 **모듈(Module) 기반의 확장 가능한 웹 앱 프레임워크**이며, `1.WebHost`(호스트) + `2.Modules`(핵심 기능 모듈) + `3.Infrastructure`(공통 라이브러리) + `4.Tool`(CLI) 구조를 따릅니다. :contentReference[oaicite:1]{index=1}

---

## 1) 작업 시작 방식 (Plan → Execute)

에이전트는 “바로 코딩”보다 **명세(스펙) → 계획 → 작은 변경** 순서를 우선합니다. 큰 작업일수록 이 규칙을 강하게 적용합니다. :contentReference[oaicite:2]{index=2}

### 1.1 먼저 “스펙 체크리스트”를 채우고 시작
아래 항목이 빠지면, 코딩 전에 **가정/질문/트레이드오프**를 먼저 표면화합니다.

- **목표(Goal)**: 무엇을/왜 바꾸는가?
- **범위(In scope)** / **비범위(Out of scope)**: 하지 말아야 할 것까지 명시
- **성공 기준(Acceptance Criteria)**: 검증 가능한 형태로
- **영향 범위(Impact)**: 어떤 모듈/호스트/CLI에 영향이 있는가?
- **실행 명령(Commands)**: 빌드/실행/패키징 명령을 스펙 상단에 배치

### 1.2 큰 작업은 “작게 쪼개서” 진행
한 번에 모든 걸 하려 하지 말고, PR/커밋 단위로 리뷰 가능한 크기로 분리합니다.

---

## 2) 프로젝트 필수 전제 (환경/버전/도구)

### 2.1 필수 도구(개발 환경 기준)
- **Node.js**: v20.12.2 LTS 이상 필요
- **gulp CLI**: 설치 필요 (예: `npm i -g gulp-cli`)
- **curl**: 설치 필요
- **.NET SDK**: **10.0** 필요 (ack 타겟: `net10.0`)
- (macOS/Linux) `rsync`를 사용합니다 (스크립트에서 동기화에 활용).
### 2.2 핵심 환경 변수
- `DOTNET_CLI_TELEMETRY_OPTOUT=1` (자동 설정)
- `HANDSTACK_SRC`: 레포 루트 경로
- `HANDSTACK_HOME`: 기본값 `../build/handstack` (레포 상위 폴더 기준)

---

## 3) 자주 쓰는 명령어 (가장 위에 둬야 하는 “실행 가능한 진실”)

> 에이전트는 **실행 가능한 커맨드**를 스펙/지침 상단에서 찾을 수 있을 때 가장 안정적으로 동작합니다.

### 3.1 설치(의존성/환경 구성)
- Windows (CMD):
  - `.\install.bat`
- PowerShell (크로스 플랫폼):
  - `.\install.ps1`
- macOS/Linux:
  - `chmod +x ./install.sh && ./install.sh`
### 3.2 빌드(개발/검증)
- Windows (CMD):
  - `.\build.bat`
- PowerShell:
  - `.\build.ps1`
- macOS/Linux:
  - `chmod +x ./build.sh && ./build.sh`

### 3.3 패키징/배포 출력 만들기 (publish)
- macOS/Linux:
  - 예) `./publish.sh win build Debug x64`  
  - 예) `./publish.sh osx build Debug arm64`
- PowerShell:
  - 예) `.\publish.ps1 win publish Release x64`

> 출력 디렉터리는 기본적으로 `HANDSTACK_SRC/../publish/{os}-{arch}` 쪽을 사용합니다.
---

## 4) 레포 구조 이해 (어디를 어떻게 건드릴지)

### 4.1 상위 폴더 의미
- `1.WebHost/`
  - `ack/`: 주요 ASP.NET Core 호스트
  - `forbes/`: 추가 호스트
- `2.Modules/`
  - `wwwroot/`: 클라이언트 자산/번들링( gulp ) 관련 모듈
  - `dbclient/`, `function/`, `logger/`, `repository/`, `transact/`, `checkup/` 등 핵심 모듈
- `3.Infrastructure/`
  - `HandStack.Core`, `HandStack.Web`, `HandStack.Data` 공통 라이브러리
- `4.Tool/CLI/`
  - `handstack` 포함 CLI 도구들
### 4.2 프론트 자산(번들링) 흐름 주의
- `1.WebHost/ack`와 `2.Modules/wwwroot` 모두 Node/Gulp 의존성이 있으며 번들링이 설치/빌드 과정에 포함됩니다.
- `lib.zip`를 `wwwroot/lib`로 풀어주는 과정이 설치 스크립트에 포함되어 있습니다.

---

## 5) 코딩 스타일 / 규칙 (이 레포의 “형식 계약”)

### 5.1 .editorconfig 준수는 “무조건”
- 기본: **space 4칸**, `end_of_line=crlf`, `.NET/C# 스타일 규칙` 포함
- 에이전트는 “내 취향”으로 포맷/리팩토링하지 말고, **기존 코드 스타일을 그대로 따라야 합니다.**

### 5.2 네이밍/주석
- C#: Microsoft .NET 네이밍 관례 (PascalCase/camelCase 등)
- 주석은 “무엇”이 아니라 “왜”를 설명

---

## 6) 변경 원칙 (불필요한 LLM 실수 방지 핵심)

### 6.1 최소 변경 (Surgical Changes)
- 요청 범위 밖의 리팩토링/정리/포맷 변경 금지
- 인접 코드 “개선” 금지
- 단, **내 변경으로 생긴** 미사용 `using/import/변수`는 제거 가능

### 6.2 단순함 우선 (Simplicity First)
- 요구받지 않은 옵션/추상화/확장성 추가 금지
- 200줄로 썼는데 50줄로 가능하면 다시 단순화

### 6.3 목표 기반 반복 (Goal-Driven Loop)
- “버그 수정”이면 **재현 → 수정 → 재발 방지**(테스트 or 최소 재현 절차 문서화)까지
- “기능 추가”이면 **성공 기준(AC)** 을 만족할 때까지 반복

---

## 7) 테스트/검증 지침 (현실적인 기준)

> 이 레포는 빌드 스크립트가 명확하므로, 최소한 **빌드 성공**은 기본 검증입니다.

- 최소 검증:
  - (가능한 OS에서) `build.(bat|sh|ps1)` 실행하여 빌드 성공 확인
- 테스트 프로젝트/프레임워크가 작업 범위에서 필요해 보이는데 레포에 없거나 불명확하면:
  - **테스트를 “추가”하지 않고**, 대신
    - 재현 절차(입력/환경/기대 결과)
    - 로그/스크린샷 포인트
    - 실패/성공 조건
    를 PR 설명(또는 문서)에 포함합니다.

---

## 8) Git 워크플로 (커밋/PR 규칙)

- 커밋 메시지: **Conventional Commits** 권장 (feat/fix/docs/refactor 등)
- 한 PR/커밋 = 한 가지 목표(작업 단위) 원칙
- 스펙/요구사항 변경이 있으면, 관련 문서(README/가이드/스펙 파일)도 함께 업데이트(가능하면)

---

## 9) 경계(Boundaries) — 절대 건드리지 말 것 / 먼저 물어볼 것

### 9.1 절대 금지
- 비밀/키/토큰/계정정보를 코드/문서에 하드코딩하거나 커밋 금지
- `node_modules/`, 빌드 산출물 디렉터리(예: `../build/handstack`, `../publish/...`)를 소스처럼 수정 금지
- 작업 요청과 무관한 대규모 포맷 변경/리네이밍/폴더 이동 금지

### 9.2 “먼저 확인(Ask First)”이 필요한 경우
- 새 런타임/대규모 의존성 추가(특히 빌드/배포 스크립트 영향)
- 모듈 간 계약(데이터/트랜잭션/로깅) 변경
- `publish.*` / `install.*` / `build.*` 스크립트 변경(전사 영향 큼)

---

## 10) HandStack 작업에 특화된 “스펙 템플릿” (이대로 채우고 시작)

> 아래 템플릿을 이슈/PR 설명 또는 작업 요청에 붙여서 사용합니다.  
> 에이전트는 이 템플릿을 “작업의 단일 진실”로 간주합니다.

### 10.1 SPEC
- **Goal**
  - (예: ack에서 특정 화면 로딩 속도 개선)
- **Context**
  - 관련 모듈/호스트: (예: `1.WebHost/ack`, `2.Modules/wwwroot`)
  - 현재 문제/증상:
- **In Scope**
  - 1)
  - 2)
- **Out of Scope**
  - (예: UI 리디자인, 모듈 구조 리팩토링)
- **Commands**
  - Install:
    - Windows: `.\install.bat`
    - macOS/Linux: `./install.sh`
  - Build:
    - `.\build.ps1` (또는 `./build.sh`)
  - Publish(필요 시):
    - `./publish.sh win build Debug x64`
- **Acceptance Criteria**
  - [ ] 빌드 성공
  - [ ] (기능) A 시나리오에서 B가 동작
  - [ ] (성능/버그) 재현 절차 기준으로 문제 재발 없음
- **Risks / Tradeoffs**
  - (예: 번들링 결과 변경 가능성, 호환성)
- **Notes**
  - (예: 관련 문서 링크/로그 위치)

---

## 11) 에이전트가 “좋게” 일하고 있는 신호

- diff에서 불필요한 변경이 줄어듦
- 과잉 설계/추상화가 줄어듦
- 구현 후에 질문하는 대신, **구현 전에** 모호함을 잡고 확인함
