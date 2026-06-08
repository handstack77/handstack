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
- 계약의 `Services`에서 `transaction.functionID`와 같은 `ServiceID`를 찾을 수 있어야 합니다. `X-Workflow-Contract` 헤더가 없으면 해당 서비스에 `WorkflowSteps`가 있어야 합니다.
- 요청 헤더 `X-Workflow-Contract`에 `TransactionInfo` 형식의 JSON을 전달하면 해당 요청에서만 실행할 Workflow 정의로 사용합니다. 기존 계약의 허용 거래, 화면 접근, 권한 검증은 그대로 통과해야 합니다.
- `X-Workflow-Contract` 요청은 BearerToken이 필요하며, `Policy.Claims`에 `DynamicWorkflow=Y`, `DynamicWorkflowTransaction=MOD|MOD010`이 있어야 합니다. 서버의 `module.json` `DynamicWorkflowTransaction`, `DynamicWorkflowServices` 설정이 최종 실행 허용 범위입니다.

### 계약 작성 규칙
- 워크플로 서비스는 `CommandType`을 `W`로 둡니다.
- `WorkflowSteps`는 배열 순서대로 실행됩니다. 마지막으로 성공한 단계의 결과가 최종 응답의 `result.dataSet`이 됩니다.
- `StepID`를 생략하면 `{CommandType}{순번}` 형식으로 자동 생성됩니다. 예: `D01`.
- 단계의 `ApplicationID`, `TransactionProjectID`, `TransactionID`, `ServiceID`를 생략하면 현재 워크플로 계약과 서비스 값을 사용합니다.
- 단계의 `CommandType`이 `W`이면 하위 워크플로를 재귀 실행합니다. 순환 호출은 `ApplicationID|ProjectID|TransactionID|ServiceID` 경로로 감지해 실패 처리합니다.
- 단계의 `CommandType`이 `D`, `G`, `F`, `P`이면 `TransactClient.RequestDataTransactionAsync`로 실행 모듈에 전달합니다.
- 단계의 `ReturnType`, `TransactionScope`, `ServiceOutputs`는 대상 서비스 설정을 단계 단위로 덮어씁니다. `ServiceOutputs`가 없으면 대상 서비스의 `Outputs`를 사용합니다.
- `X-Workflow-Contract` 헤더의 `ServiceID`는 요청의 `transaction.functionID`와 같아야 합니다. 생략하면 `transaction.functionID`로 보정하며, 응답 반환 또는 예외 처리 후 일회성 실행 정의는 초기화됩니다.

### 일회성 Workflow 헤더 예
```http
X-Workflow-Contract: {"ServiceID":"GW01","Authorize":false,"ReturnType":"Json","CommandType":"W","TransactionScope":false,"WorkflowSteps":[{"StepID":"searchIntent","IncludeResult":false,"CommandType":"P","TransactionProjectID":"MOD","TransactionID":"MOD010","ServiceID":"GP01","ReturnType":"Json","OutputMappings":[{"SourceFieldID":"PromptResult","TargetFieldID":"UserIntent","Required":true}],"Assertions":[{"Assert":"NotEmpty","Collection":{"Source":"Step","FieldID":"UserIntent"},"Message":"UserIntent 값이 비어 있습니다"}]},{"StepID":"searchIntentID","CommandType":"P","TransactionProjectID":"MOD","TransactionID":"MOD010","ServiceID":"GP02","ReturnType":"Json","InputMappings":[{"SourceStepID":"searchIntent","SourceFieldID":"UserIntent","TargetFieldID":"UserIntent","Required":true}]}]}
```

BearerToken의 `Policy.Claims` 예:
```json
{
  "DynamicWorkflow": "Y",
  "DynamicWorkflowTransaction": "MOD|MOD010"
}
```

### 입력 매핑
- 각 단계는 직전 단계까지 유지된 `payLoad.dataMapSet`과 `dataMapCount`를 기본 입력으로 전달합니다.
- `InputMappings`가 있으면 기존 `PayLoad`를 유지한 상태에서 매핑 결과를 `TargetInputIndex`와 `TargetFieldID` 위치에 추가하거나 덮어씁니다.
- `SourceStepID`가 비어 있으면 현재 단계까지 유지된 `PayLoad`에서 값을 찾습니다.
- `SourceStepID`가 있으면 해당 이전 단계 결과에서 값을 찾습니다.
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

### 단계 검증
- `Assertions`가 있으면 단계 실행 후 다음 단계로 넘어가기 전에 순서대로 검증합니다.
- 첫 번째 검증 실패에서 워크플로가 실패하며, `Message`가 있으면 `exceptionText`에 해당 메시지를 우선 사용합니다.
- 검증 값의 `Source`는 `Literal`, `Request`, `Step`을 지원합니다. `Step`에서 `SourceStepID`를 생략하면 현재 단계 결과를 참조하고, 지정하면 이전 단계 결과를 참조합니다.
- `Assert`는 `Equal`, `NotEqual`, `True`, `False`, `Null`, `NotNull`, `Contains`, `DoesNotContain`, `Empty`, `NotEmpty`, `Single`, `InRange`, `Throws`, `IsType`, `Same`을 지원합니다.
- `Throws<TException>()`, `IsType<T>()` 형태는 JSON 계약에서 각각 `Assert: "Throws"`와 `ExceptionType`, `Assert: "IsType"`과 `TypeName`으로 표현합니다.

#### 실제 사용 위치
`Contracts/transact/HDS/TST/TST010.json`에서 바로 실행 가능한 예제를 확인할 수 있습니다.

- `GW01`의 `loadServerTime` 단계는 `GD04` 실행 결과의 `ServerName`이 `null` 또는 빈 문자열이 아닌지 확인합니다.
- `GW02`의 `assertValues` 단계는 `GD07` 결과를 대상으로 `Throws`를 제외한 검증 타입을 한 번씩 사용합니다.
- `GW02`의 `assertThrows` 단계는 존재하지 않는 `GD99` 서비스를 호출하고 `Throws`로 실패가 발생했는지 확인합니다. 예상한 실패이면 단계 성공으로 전환되어 다음 단계인 `loadAssertionResult`를 계속 실행합니다.

가장 일반적인 형태는 현재 단계 결과의 필드를 `Step`으로 참조하고, 실패 시 운영자가 바로 원인을 알 수 있도록 `Message`를 지정하는 것입니다.

```json
"Assertions": [
  {
    "Assert": "NotEmpty",
    "Collection": {
      "Source": "Step",
      "FieldID": "ServerName"
    },
    "Message": "ServerName 값이 필요합니다"
  },
  {
    "Assert": "IsType",
    "Value": {
      "Source": "Step",
      "FieldID": "ServerDate"
    },
    "TypeName": "String"
  }
]
```

#### Assertions 옵션
| 옵션 | 의미 |
| --- | --- |
| `Assert` | 실행할 검증 타입입니다. 필수이며 대소문자를 구분하지 않습니다. |
| `Expected` | `Equal`, `NotEqual`, `Same`에서 기대값을 지정합니다. |
| `Actual` | `Equal`, `NotEqual`, `Same`에서 실제 비교값을 지정합니다. |
| `Value` | `True`, `False`, `Null`, `NotNull`, `Contains`, `DoesNotContain`, `InRange`, `IsType`에서 검사할 값을 지정합니다. |
| `Min`, `Max` | `InRange`의 최솟값과 최댓값입니다. 경곗값을 포함합니다. |
| `Collection` | `Contains`, `DoesNotContain`, `Empty`, `NotEmpty`, `Single`에서 검사할 문자열, 배열 또는 객체를 지정합니다. |
| `TypeName` | `IsType`에서 기대하는 JSON 타입입니다. |
| `ExceptionType` | `Throws`에서 선택적으로 확인할 예외 타입 문자열입니다. 비어 있으면 실패 발생 여부만 확인합니다. |
| `Message` | 검증 실패 시 기본 오류 대신 `exceptionText`에 반환할 메시지입니다. |

`Expected`, `Actual`, `Value`, `Min`, `Max`, `Collection`은 모두 같은 값 참조 형식을 사용합니다.

| 값 참조 옵션 | 의미 |
| --- | --- |
| `Source` | `Literal`, `Request`, `Step` 중 하나입니다. 기본값은 `Literal`입니다. |
| `Value` | `Source: "Literal"`일 때 사용할 문자열, 숫자, 불리언, 객체, 배열 또는 `null` 값입니다. |
| `FieldID` | `Request` 또는 `Step`에서 찾을 필드 ID입니다. 필드 이름은 대소문자를 구분하지 않습니다. 객체 값은 `FieldID.Property` 형태로도 참조할 수 있습니다. |
| `SourceStepID` | `Source: "Step"`일 때 이전 단계 결과를 참조하려면 지정합니다. 생략하면 현재 단계 결과를 사용합니다. |

`Source`를 생략하고 `FieldID`만 지정하면 현재 단계 결과를 참조합니다. 예를 들어 `"Collection": { "FieldID": "ServerName" }`은 `"Collection": { "Source": "Step", "FieldID": "ServerName" }`과 같습니다. 명시적으로 적는 편이 계약을 읽기 쉽습니다.

#### 검증 타입
| `Assert` | 사용하는 옵션 | 의미 |
| --- | --- | --- |
| `Equal` | `Expected`, `Actual` | 두 JSON 값이 같은지 확인합니다. |
| `NotEqual` | `Expected`, `Actual` | 두 JSON 값이 다른지 확인합니다. |
| `True`, `False` | `Value` | 불리언 또는 `true`, `false`로 변환 가능한 문자열인지 확인합니다. |
| `Null`, `NotNull` | `Value` | 값이 JSON `null` 또는 undefined인지 확인합니다. 빈 문자열은 `null`이 아닙니다. |
| `Contains`, `DoesNotContain` | `Value`, `Collection` | 문자열 포함 여부, 배열 요소 일치 여부, 객체 속성명 또는 속성값 일치 여부를 확인합니다. 문자열 비교는 대소문자를 구분합니다. |
| `Empty`, `NotEmpty` | `Collection` | 문자열 길이, 배열 요소 수, 객체 속성 수가 0인지 확인합니다. `null`은 빈 값으로 처리하지 않습니다. |
| `Single` | `Collection` | 문자열 길이, 배열 요소 수, 객체 속성 수가 정확히 1인지 확인합니다. |
| `InRange` | `Value`, `Min`, `Max` | 숫자 또는 날짜가 `Min <= Value <= Max` 범위인지 확인합니다. |
| `Throws` | `ExceptionType` | 단계 실행이 실패했는지 확인합니다. `ExceptionType`을 지정하면 오류 타입 또는 오류 메시지에 해당 문자열이 포함되어야 합니다. |
| `IsType` | `Value`, `TypeName` | JSON 토큰 타입을 확인합니다. `String`, `Integer`/`Int`, `Float`, `Number`, `Boolean`/`Bool`, `Object`, `Array`, `Null`을 사용할 수 있습니다. |
| `Same` | `Expected`, `Actual` | 두 값의 내용이 아니라 같은 JSON 토큰 인스턴스인지 확인합니다. 일반적인 값 비교는 `Equal`을 사용합니다. |

아래는 각 검증 타입의 작성 형태를 한 번에 확인하기 위한 예제입니다. `Actual`, `Value`, `Collection`의 `FieldID`는 단계 결과에 맞게 바꿔 사용합니다.

```json
"Assertions": [
  {
    "Assert": "Equal",
    "Expected": { "Source": "Literal", "Value": "OK" },
    "Actual": { "Source": "Step", "FieldID": "ResultCode" },
    "Message": "ResultCode는 OK여야 합니다"
  },
  {
    "Assert": "NotEqual",
    "Expected": { "Source": "Literal", "Value": "ERROR" },
    "Actual": { "Source": "Step", "FieldID": "ResultCode" }
  },
  {
    "Assert": "True",
    "Value": { "Source": "Step", "FieldID": "IsValid" }
  },
  {
    "Assert": "False",
    "Value": { "Source": "Step", "FieldID": "HasError" }
  },
  {
    "Assert": "Null",
    "Value": { "Source": "Step", "FieldID": "DeletedDate" }
  },
  {
    "Assert": "NotNull",
    "Value": { "Source": "Step", "FieldID": "ServerName" }
  },
  {
    "Assert": "Contains",
    "Value": { "Source": "Literal", "Value": "admin" },
    "Collection": { "Source": "Step", "FieldID": "Roles" }
  },
  {
    "Assert": "DoesNotContain",
    "Value": { "Source": "Literal", "Value": "blocked" },
    "Collection": { "Source": "Step", "FieldID": "Tags" }
  },
  {
    "Assert": "Empty",
    "Collection": { "Source": "Step", "FieldID": "Warnings" }
  },
  {
    "Assert": "NotEmpty",
    "Collection": { "Source": "Step", "FieldID": "ServerName" }
  },
  {
    "Assert": "Single",
    "Collection": { "Source": "Step", "FieldID": "Items" }
  },
  {
    "Assert": "InRange",
    "Value": { "Source": "Step", "FieldID": "Score" },
    "Min": { "Source": "Literal", "Value": 0 },
    "Max": { "Source": "Literal", "Value": 100 }
  },
  {
    "Assert": "IsType",
    "Value": { "Source": "Step", "FieldID": "ServerDate" },
    "TypeName": "String"
  },
  {
    "Assert": "Same",
    "Expected": { "Source": "Step", "FieldID": "ServerName" },
    "Actual": { "Source": "Step", "FieldID": "ServerName" }
  }
]
```

`Throws`는 실패가 예상되는 단계에만 사용합니다. 단계가 실제로 실패하고 `ExceptionType`이 비어 있거나 오류 타입/메시지에 포함되면 검증이 성공한 것으로 처리합니다.

```json
"Assertions": [
  {
    "Assert": "Throws",
    "ExceptionType": "InvalidOperationException",
    "Message": "입력 매핑 오류가 발생해야 합니다"
  }
]
```

### TST010 워크플로 계약 예
`Contracts/transact/HDS/TST/TST010.json`의 `GW01` 서비스는 `GD04`를 두 번 호출하는 가장 작은 워크플로 예제입니다. 첫 번째 단계는 서버 시간 정보를 읽어 `ServerDate`, `ServerName`을 단계 결과에 저장하고 Assertions로 `ServerName`을 검증합니다. 두 번째 단계는 첫 번째 단계의 `ServerName`을 입력으로 받아 다시 `GD04`를 호출합니다.

```json
{
  "ServiceID": "GW01",
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
      ],
      "Assertions": [
        {
          "Assert": "NotNull",
          "Value": {
            "Source": "Step",
            "FieldID": "ServerName"
          },
          "Message": "ServerName 값이 필요합니다"
        },
        {
          "Assert": "NotEmpty",
          "Collection": {
            "Source": "Step",
            "FieldID": "ServerName"
          },
          "Message": "ServerName 값이 비어 있습니다"
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
아래 요청은 `HDS/TST/TST010` 계약의 `GW01` 워크플로를 실행합니다. 로컬에서는 `ack`를 `wwwroot,transact,dbclient,function` 모듈과 함께 실행한 뒤 호출합니다.

```powershell
curl -X POST "http://localhost:8421/transact/api/workflow/execute" `
  -H "Content-Type: application/json" `
  -d @workflow-wf01.json
```

```json
{
  "action": "SYN",
  "kind": "BIZ",
  "clientTag": "README-GW01",
  "loadOptions": {
    "work-id": "mainapp",
    "app-id": "HDS"
  },
  "requestID": "README-GW01-001",
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
    "globalID": "README-GW01-001",
    "businessID": "TST",
    "transactionID": "TST010",
    "functionID": "GW01",
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
