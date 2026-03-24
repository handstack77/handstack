# transact 모듈

## 개요
`transact`는 HandStack의 핵심 오케스트레이션 모듈입니다. 거래 계약 JSON을 읽고 입력 검증, 라우팅, 캐시, 응답 조립, 거래 로그 기록을 수행한 뒤 `dbclient`, `function` 같은 실행 모듈로 요청을 분배합니다.

## 책임 범위
- 거래 계약 JSON을 메모리에 적재하고 서비스 단위로 해석합니다.
- 입력/출력 검증, 캐시, 응답 헤더 조립, 라우팅을 수행합니다.
- D 타입은 `dbclient`, F 타입은 `function`으로 연결합니다.
- 거래 집계와 이력 조회를 제공합니다.
- 계약 파일 변경을 감시해 런타임 캐시를 갱신합니다.

## 주요 진입점
- `GET /transact/api/transaction/has`
- `GET /transact/api/transaction/refresh`
- `GET /transact/api/transaction/retrieve`
- `GET /transact/api/transaction/meta`
- `POST /transact/api/transaction/execute`
- `GET /transact/api/transaction/cache-clear`
- `GET /transact/api/transaction/cache-keys`
- `GET /transact/api/aggregate/transaction-list`
- `GET /transact/api/aggregate/summary`
- `GET /transact/api/aggregate-metric`
- `GET /transact/api/aggregate/last-moved-id`
- `POST /transact/api/aggregate/last-moved-id`
- 주요 구현 클래스
  - `TransactionController`
  - `AggregateController`
  - `TransactRequestHandler`
  - `TransactionRefreshRequestHandler`
  - `TransactClient`

## 주요 디렉터리
- `Areas/transact/Controllers`: 거래 실행/집계 API
- `Extensions/TransactClient.cs`: 라우팅, 결과 검증, 계약 실행 핵심
- `Events`: 거래 실행 및 리프레시 핸들러
- `Contracts/transact`: 샘플 거래 계약

## 계약 및 데이터 자산
- 거래 계약은 JSON이며 `ApplicationID`, `ProjectID`, `TransactionID`, `Services`, `Models`를 포함합니다.
- `ServiceID`별로 `CommandType`, `ReturnType`, `TransactionScope`, 입력/출력 모델이 정의됩니다.
- 현재 기본 라우팅은 `D -> dbclient`, `F -> function`, `P -> prompter`입니다.
- `TransactionAggregateBasePath` 아래에 집계 로그가 저장됩니다.

## 설정 포인트
- `AllowRequestTransactions`: 애플리케이션별 허용 프로젝트
- `RoutingCommandUri`: 실제 실행 모듈 라우팅 표
- `IsValidationRequest`: 요청 검증 토큰 사용 여부
- `IsCodeDataCache`, `CodeDataCacheTimeout`: 코드/기초 데이터 캐시
- `IsTransactionLogging`, `LogServerUrl`: 거래 로그 수집 설정
- `IsTransactAggregateRolling`: 주간별 집계 SQLite 롤오버 사용 여부
- `TransactAggregateDeleteOldCronTime`: 비-롤링 모드에서 moved 집계 데이터 삭제 주기(cron)
- `PublicTransactions`, `AvailableEnvironment`: 외부 공개/환경 허용 범위

## 실행 흐름
1. 화면 또는 서버 기능이 거래 요청을 보냅니다.
2. `transact`가 인증, 허용 거래, 입력 기본값, 압축 해제를 처리합니다.
3. 계약 JSON에서 `Services`를 읽고 `CommandType`별 실행 전략을 고릅니다.
4. `TransactClient`가 실제 실행 모듈로 라우팅하고 결과를 검증해 응답을 조립합니다.

## 운영 메모
- `IsValidationRequest`를 켜면 분산 캐시 기반 요청 검증을 수행합니다.
- `AllowRequestTransactions`와 `PublicTransactions`는 외부 호출 허용 범위를 결정하는 핵심 값입니다.
- `IsTransactionLogging=true`면 거래 전문과 응답 전문이 `logger` 모듈로 전달됩니다.

### 기본 라우팅 예
- `HDS|*|D|D -> /dbclient/api/query`
- `HDS|*|F|D -> /function/api/execution`
- `HDS|*|P|D -> /prompter/api/query`

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
