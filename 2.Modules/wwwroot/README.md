# wwwroot 모듈

## 개요
`wwwroot`는 정적 화면과 계약 파일을 서비스하는 모듈입니다. 업무 앱의 HTML/JS/CSS 자산을 서빙하고 계약 기반 화면 경로(`/view`)를 열어 주며 파일 동기화 API와 HTMX 샘플까지 포함합니다.

## 책임 범위
- 정적 화면과 공용 자산을 HTTP 경로로 노출합니다.
- 계약 기반 화면 경로와 실제 자산 경로를 분리해 서비스합니다.
- `dbclient`, `graphclient`, `transact`, `function`, `wwwroot` 계약 파일 동기화 API를 제공합니다.
- `syn.loader.*` 캐시 정책과 대소문자 무시 정적 파일 제공을 처리합니다.
- HTMX 샘플과 내부 거래 직접 호출 유틸리티를 제공합니다.

## 주요 진입점
- `POST /wwwroot/api/sync/upload`
- `GET /wwwroot/api/sync/refresh`
- `GET /wwwroot/api/htmx/*`
- `GET /wwwroot/api/index/*`
- 주요 구현 클래스
  - `ModuleInitializer`
  - `SyncController`
  - `HtmxController`
  - `ModuleApiClient`

## 주요 디렉터리
- `Areas/wwwroot/Controllers`: 정적 파일 보조 API, 동기화 API, HTMX 샘플
- `Extensions/ModuleApiClient.cs`: 거래 직접 호출 래퍼
- `Contracts/wwwroot`: 계약 기반 화면/자산 매핑
- `wwwroot`: 실제 정적 자산과 샘플 화면

## 계약 및 데이터 자산
- `ContractBasePath` 아래 계약 파일을 기본 `/view` 경로로 노출합니다.
- `WWWRootBasePath` 아래 실제 정적 파일을 그대로 서비스합니다.
- `SyncController`는 `dbclient`, `graphclient`, `transact`, `function`, `wwwroot` 모듈 계약만 동기화 대상으로 허용합니다.

## 설정 포인트
- `ContractRequestPath`: 계약 기반 정적 경로, 기본값 `view`
- `ContractBasePath`: 계약 파일 루트
- `WWWRootBasePath`: 실제 정적 파일 루트
- `FileSyncTokens`: 파일 동기화 Basic 토큰 목록
- `ModuleLogFilePath`: 정적/동기화 모듈 로그 위치

## 실행 흐름
1. `ModuleInitializer`가 `ContractBasePath`와 `WWWRootBasePath`를 기준으로 정적 파일 미들웨어를 구성합니다.
2. 계약 자산은 `/{ContractRequestPath}`로, 실제 자산은 모듈 루트 경로로 노출됩니다.
3. `SyncController`는 Basic 토큰을 검증한 뒤 계약 파일을 저장하거나 대상 모듈에 refresh 요청을 전달합니다.
4. `syn.loader.*` 파일은 no-cache 정책으로 내려 앱 셸 변경이 바로 반영되도록 합니다.

## 운영 메모
- `FileSyncTokens`를 비워 두면 `SyncController`는 모든 동기화 요청을 거부합니다.
- `ContractRequestPath`와 `WWWRootBasePath`는 충돌 없이 분리해야 합니다.
- 정적 파일 캐시 전략은 `syn.loader`만 예외 처리하고 나머지는 일반 캐시 정책을 따릅니다.
- 테넌트 앱의 `WithOrigin`, `WithReferer`는 `ModuleInitializer`가 메모리에 적재해 CORS 응답에 반영합니다.

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
