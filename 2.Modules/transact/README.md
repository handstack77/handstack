# transact 모듈

## 개요
`transact`는 HandStack의 핵심 오케스트레이션 모듈입니다. 거래 계약 JSON을 읽고 입력 검증, 라우팅, 캐시, 응답 조립, 거래 로그 기록을 수행한 뒤 `dbclient`, `function` 같은 실행 모듈로 요청을 분배합니다.

## 책임 범위
- 거래 계약 JSON을 메모리에 적재하고 서비스 단위로 해석합니다.
- 입력/출력 검증, 캐시, 응답 헤더 조립, 라우팅을 수행합니다.
- D 타입은 `dbclient`, F 타입은 `function`, P 타입은 `prompter`로 연결합니다.
- W 타입은 `WorkflowController`가 계약의 `WorkflowSteps`를 순서대로 실행합니다.
- 거래 집계와 이력 조회를 제공합니다.
- 계약 파일 변경을 감시해 런타임 캐시를 갱신합니다.

## 주요 진입점
- `GET /transact/api/transaction/has`
- `GET /transact/api/transaction/refresh`
- `GET /transact/api/transaction/retrieve`
- `GET /transact/api/transaction/meta`
- `POST /transact/api/transaction/execute`
- `POST /transact/api/workflow/execute`
- `GET /transact/api/transaction/cache-clear`
- `GET /transact/api/transaction/cache-keys`
- `GET /transact/api/aggregate/transaction-list`
- `GET /transact/api/aggregate/summary`
- `GET /transact/api/aggregate-metric`
- `GET /transact/api/aggregate/last-moved-id`
- `POST /transact/api/aggregate/last-moved-id`
- 주요 구현 클래스
  - `TransactionController`
  - `WorkflowController`
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
- 현재 기본 라우팅은 `D -> dbclient`, `G -> graphclient`, `F -> function`, `P -> prompter`입니다.
- `W`는 외부 모듈 라우팅 값이 아니라 `WorkflowController`의 내부 오케스트레이션 명령입니다. 각 단계의 `CommandType`이 `D`, `G`, `F`, `P`이면 기존 `RoutingCommandUri` 규칙으로 실행 모듈에 전달됩니다.
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

## Workflow 실행
`WorkflowController`는 `POST /transact/api/workflow/execute`에서 `TransactionRequest`를 받아 `CommandType: "W"` 서비스의 `WorkflowSteps`를 순서대로 실행합니다. 워크플로 서비스 자체는 계약 파일에 정의하고, 각 단계는 같은 계약 또는 다른 거래 계약의 서비스를 호출할 수 있습니다.

### 실행 조건
- 요청의 `action`, `kind`, `system`, `transaction`, `payLoad`, `interface`가 필요합니다.
- `transaction.dataFormat`이 비어 있으면 `J`로 처리합니다. `J`와 `T`만 허용합니다.
- `environment`는 `module.json`의 `AvailableEnvironment`에 포함되어야 합니다.
- `AllowRequestTransactions`, `PublicTransactions`, `AccessScreenID` 규칙을 통과해야 합니다.
- 계약의 `Services`에서 `transaction.functionID`와 같은 `ServiceID`를 찾고, 해당 서비스에 `WorkflowSteps`가 있어야 합니다.

### 계약 작성 규칙
- 워크플로 서비스는 `CommandType`을 `W`로 둡니다.
- `WorkflowSteps`는 배열 순서대로 실행됩니다. 마지막으로 성공한 단계의 결과가 최종 응답의 `result.dataSet`이 됩니다.
- `StepID`를 생략하면 `{CommandType}{순번}` 형식으로 자동 생성됩니다. 예: `D01`.
- 단계의 `ApplicationID`, `TransactionProjectID`, `TransactionID`, `ServiceID`를 생략하면 현재 워크플로 계약과 서비스 값을 사용합니다.
- 단계의 `CommandType`이 `W`이면 하위 워크플로를 재귀 실행합니다. 순환 호출은 `ApplicationID|ProjectID|TransactionID|ServiceID` 경로로 감지해 실패 처리합니다.
- 단계의 `CommandType`이 `D`, `G`, `F`, `P`이면 `TransactClient.RequestDataTransactionAsync`로 실행 모듈에 전달합니다.
- 단계의 `ReturnType`, `TransactionScope`, `ServiceOutputs`는 대상 서비스 설정을 단계 단위로 덮어씁니다. `ServiceOutputs`가 없으면 대상 서비스의 `Outputs`를 사용합니다.

### 입력 매핑
- `InputMappings`가 없으면 원 요청의 `payLoad.dataMapSet`과 `dataMapCount`를 그대로 단계 입력으로 전달합니다.
- `InputMappings`가 있으면 매핑 결과만 단계 입력으로 조립합니다.
- `Source`가 비어 있으면 원 요청 입력에서 값을 찾습니다.
- `Source`가 `Step`이거나 `SourceStepID`가 있으면 이전 단계 결과에서 값을 찾습니다.
- `SourceFieldID`는 대소문자를 구분하지 않습니다. 값이 객체이거나 객체 배열이면 `FieldID.Property` 또는 `Property` 형태로도 참조할 수 있습니다.
- `TargetFieldID`가 비어 있으면 `SourceFieldID`를 단계 입력 필드명으로 사용합니다.
- `TargetInputIndex`는 대상 서비스의 `Inputs` 배열 위치입니다. 음수는 0으로 처리합니다.
- `DbType` 기본값은 `String`, `Length` 기본값은 `-1`입니다.
- 값이 없고 `DefaultValue`가 있으면 기본값을 사용합니다.
- 값이 없고 `Required`가 `true`이면 해당 단계는 실패합니다.

### 출력 매핑
- 단계 응답은 `ReturnType`에 따라 `DataMapItem` 목록으로 변환됩니다.
- `Json`은 응답 JSON 배열의 각 항목을 `id`/`value` 또는 `FieldID`/`Value` 기준으로 변환합니다. 배열이 아니면 `Result` 필드에 담습니다.
- `Scalar`는 `Scalar`, `NonQuery`는 `RowsAffected`, `Xml`은 `Xml` 필드로 변환합니다.
- `OutputMappings`가 없으면 단계 결과 전체를 다음 단계에서 참조할 수 있습니다.
- `OutputMappings`가 있으면 지정한 `SourceFieldID` 값을 `TargetFieldID`로 저장합니다. 값이 없을 때는 `DefaultValue` 또는 `Required` 규칙을 적용합니다.
- 최종 응답의 `result.dataSetMeta`는 실행 모듈의 메타 정보가 있으면 그 값을 사용하고, 없으면 최종 `dataSet`의 필드 ID 목록을 사용합니다.
- 요청의 `transaction.compressionYN`이 `Y`이고 최종 값이 객체 또는 배열이면 값을 LZString Base64로 압축합니다.

### TST010 워크플로 계약 예
`Contracts/transact/HDS/TST/TST010.json`의 `WF01` 서비스는 `GD04`를 두 번 호출하는 가장 작은 워크플로 예제입니다. 첫 번째 단계는 서버 시간 정보를 읽어 `ServerDate`, `ServerName`을 단계 결과에 저장하고, 두 번째 단계는 첫 번째 단계의 `ServerName`을 입력으로 받아 다시 `GD04`를 호출합니다.

```json
{
  "ServiceID": "WF01",
  "Authorize": false,
  "ReturnType": "Json",
  "CommandType": "W",
  "TransactionScope": false,
  "WorkflowSteps": [
    {
      "StepID": "loadServerTime",
      "CommandType": "D",
      "TransactionProjectID": "TST",
      "TransactionID": "TST010",
      "ServiceID": "GD04",
      "ReturnType": "Json",
      "OutputMappings": [
        {
          "SourceFieldID": "ServerDate",
          "TargetFieldID": "ServerDate",
          "Required": false
        },
        {
          "SourceFieldID": "ServerName",
          "TargetFieldID": "ServerName",
          "Required": false
        }
      ]
    },
    {
      "StepID": "loadAgain",
      "CommandType": "D",
      "TransactionProjectID": "TST",
      "TransactionID": "TST010",
      "ServiceID": "GD04",
      "ReturnType": "Json",
      "InputMappings": [
        {
          "Source": "Step",
          "SourceStepID": "loadServerTime",
          "SourceFieldID": "ServerName",
          "TargetFieldID": "ServerName",
          "Required": false
        }
      ]
    }
  ],
  "Inputs": [
    {
      "ModelID": "Dynamic",
      "Fields": [],
      "TestValues": [],
      "DefaultValues": [],
      "Type": "Row",
      "BaseFieldMappings": [],
      "ParameterHandling": "Rejected"
    }
  ],
  "Outputs": [
    {
      "ModelID": "Dynamic",
      "Fields": [],
      "Type": "Form"
    }
  ]
}
```

### 워크플로 요청 예
아래 요청은 `HDS/TST/TST010` 계약의 `WF01` 워크플로를 실행합니다. 로컬에서는 `ack`를 `wwwroot,transact,dbclient,function` 모듈과 함께 실행한 뒤 호출합니다.

```powershell
curl -X POST "http://localhost:8421/transact/api/workflow/execute" `
  -H "Content-Type: application/json" `
  -d @workflow-wf01.json
```

```json
{
  "action": "SYN",
  "kind": "BIZ",
  "clientTag": "README-WF01",
  "loadOptions": {
    "work-id": "mainapp",
    "app-id": "HDS"
  },
  "requestID": "README-WF01-001",
  "version": "1",
  "environment": "D",
  "system": {
    "programID": "HDS",
    "moduleID": "transact",
    "version": "1",
    "routes": [],
    "localeID": "ko-KR",
    "hostName": "localhost",
    "pathName": "/transact/api/workflow/execute",
    "deviceID": "README"
  },
  "interface": {
    "devicePlatform": "curl",
    "interfaceID": "README",
    "sourceIP": "127.0.0.1",
    "sourcePort": 0,
    "sourceMAC": "",
    "connectionType": "HTTP",
    "timeout": 180000
  },
  "transaction": {
    "globalID": "README-WF01-001",
    "businessID": "TST",
    "transactionID": "TST010",
    "functionID": "WF01",
    "commandType": "W",
    "simulationType": "P",
    "terminalGroupID": "README",
    "operatorID": "README",
    "screenID": "TST010",
    "startTraceID": "",
    "dataFormat": "J",
    "compressionYN": "N",
    "transactionToken": ""
  },
  "payLoad": {
    "property": {},
    "dataMapInterface": "",
    "dataMapCount": [0],
    "dataMapSet": [[]],
    "dataMapSetRaw": []
  }
}
```

### 응답 확인 포인트
- 성공 시 `acknowledge`는 성공 값이고 `message.mainCode`는 `T200`입니다.
- `result.dataSet`은 마지막 단계인 `loadAgain`의 결과입니다.
- `result.dataSetMeta`는 실행 모듈이 반환한 메타 정보 또는 `dataSet` 필드 목록입니다.
- 실패 시 `exceptionText`에 계약, 단계, 라우팅, 매핑 오류가 들어갑니다. 예: `WorkflowSteps 확인 필요`, `SourceFieldID ... 입력 매핑 확인 필요`, `Workflow 순환 호출 확인 필요`.

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
