# logger 모듈

## 개요
`logger`는 HandStack 공통 로그 수집 모듈입니다. 다른 모듈이 남긴 프로그램 로그와 거래 로그를 저장하고, 조회 API와 주기 삭제 백그라운드 작업을 제공합니다.

## 책임 범위
- 로그 적재, 목록 조회, 상세 조회 API를 제공합니다.
- MediatR 알림 이벤트를 `LogMessage`로 변환해 저장합니다.
- 애플리케이션별 로그 데이터 소스를 선택하거나 필요 시 자동 생성합니다.
- 오래된 로그를 주기적으로 정리합니다.
- 운영 중 장애 추적을 위한 공통 조회 창구를 제공합니다.

## 주요 진입점
- `GET|POST /logger/api/log/insert`
- `GET /logger/api/log/list`
- `GET /logger/api/log/detail`
- 주요 구현 클래스
  - `LogController`
  - `LoggerRequestHandler`
  - `LogDeleteService`

## 주요 디렉터리
- `Areas/logger/Controllers`: `/logger/api/log/*`
- `Events/LoggerRequestHandler.cs`: 이벤트 기반 로그 저장
- `Services/LogDeleteService.cs`: 주기 삭제 백그라운드 서비스
- `SQL`: 로그 스키마/쿼리 관련 리소스

## 계약 및 데이터 자산
- 직접적인 `Contracts` 디렉터리는 없고 `module.json`의 `DataSource`가 로그 저장 계약 역할을 합니다.
- 기본 샘플은 `ApplicationID=HDS`, `TableName=TransactLog`, SQLite 저장소입니다.
- 다른 모듈이 `LogServerUrl`로 이 모듈을 호출하는 구조이므로 사실상 공용 로그 수집 엔드포인트입니다.

## 설정 포인트
- `IsSQLiteCreateOnNotSettingRequest`: 없는 애플리케이션 저장소 자동 생성 여부
- `DataSource`: 애플리케이션별 로그 저장소와 보관 기간
- `DataSource.Schema`: 설정 시 고정 SQL 템플릿 대신 컬럼 정의와 역할 매핑으로 insert/list/detail 쿼리와 최초 DDL을 생성
- `LogDeleteRepeatSecond`: 백그라운드 삭제 주기
- `BusinessServerUrl`: 내부 거래 서버 연결

### 동적 Schema 예시
`Schema`가 없으면 기존 `SQL/*/{Provider}.txt` 경로를 그대로 사용합니다. `Schema`가 있으면 테이블이 없을 때만 아래 정의로 생성하고, 기존 테이블에는 `ALTER`/`DROP`을 수행하지 않습니다.

```json
{
    "ApplicationID": "HDS",
    "TableName": "TransactLog",
    "DataProvider": "SQLite",
    "RemovePeriod": -30,
    "ConnectionString": "URI=file:../sqlite/HDS/logger/transact.db;Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;",
    "IsEncryption": "N",
    "Schema": {
        "Columns": [
            { "ColumnName": "LogNo", "LogicalType": "Long", "Nullable": false },
            { "ColumnName": "ApplicationID", "LogicalType": "String", "Length": 32, "SourceType": "LogMessage", "SourceKey": "ApplicationID", "Required": true },
            { "ColumnName": "GlobalID", "LogicalType": "String", "Length": 50, "SourceType": "LogMessage", "SourceKey": "GlobalID" },
            { "ColumnName": "Message", "LogicalType": "Text", "SourceType": "LogMessage", "SourceKey": "Message" },
            { "ColumnName": "Properties", "LogicalType": "Text", "SourceType": "LogMessage", "SourceKey": "Properties" },
            { "ColumnName": "TraceID", "LogicalType": "String", "Length": 80, "SourceType": "Payload", "SourceKey": "traceId" },
            { "ColumnName": "CreatedAt", "LogicalType": "DateTime", "SourceType": "System", "SourceKey": "NowLocal", "Required": true }
        ],
        "Roles": {
            "PrimaryKey": "LogNo",
            "CreatedAt": "CreatedAt",
            "Message": "Message",
            "Properties": "Properties",
            "GlobalID": "GlobalID"
        }
    }
}
```

`SourceType`은 `LogMessage`, `Payload`, `System`, `Constant`를 지원합니다. `Payload`는 `POST application/json` 요청에서 기존 `LogMessage` 필드가 아닌 추가 JSON 필드만 대상으로 합니다.

## 실행 흐름
1. `dbclient`, `function`, `transact` 같은 모듈이 `/logger/api/log/insert`로 로그를 보냅니다.
2. `logger`는 `ApplicationID` 기준 데이터 소스를 결정합니다.
3. 필요하면 SQLite 저장소를 생성한 뒤 로그를 적재합니다.
4. `LogDeleteService`가 주기적으로 오래된 로그를 삭제합니다.

## 운영 메모
- `ApplicationIDCircuitBreakers`에 등록되지 않은 애플리케이션 로그는 거부됩니다.
- 장기 보관 정책은 `RemovePeriod`와 `LogDeleteRepeatSecond`를 함께 조정해야 합니다.

### 실시간 모니터링 명령
#### PowerShell
```powershell
Get-Content -Path "$env:HANDSTACK_HOME\log\app$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
Get-Content -Path "$env:HANDSTACK_HOME\log\dbclient\module$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
Get-Content -Path "$env:HANDSTACK_HOME\log\dbclient\profile$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
Get-Content -Path "$env:HANDSTACK_HOME\log\transact\module$(Get-Date -Format 'yyyyMMdd').log" -Encoding UTF8 -Wait -Tail 300
```

#### 일반 터미널에서 실행
```batch
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\app$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\dbclient\module$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\dbclient\profile$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path \"$env:HANDSTACK_HOME\log\transact\module$(Get-Date -Format 'yyyyMMdd').log\" -Encoding UTF8 -Wait -Tail 300"
```

#### Unix / Linux
```bash
tail -n 300 -f "$HANDSTACK_HOME/log/app$(date +%Y%m%d).log"
tail -n 300 -f "$HANDSTACK_HOME/log/dbclient/module$(date +%Y%m%d).log"
tail -n 300 -f "$HANDSTACK_HOME/log/dbclient/profile$(date +%Y%m%d).log"
tail -n 300 -f "$HANDSTACK_HOME/log/transact/module$(date +%Y%m%d).log"
```

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
