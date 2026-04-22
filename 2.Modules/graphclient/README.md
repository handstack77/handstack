# graphclient 모듈

## 개요
`graphclient`는 XML 계약 기반 Cypher 실행 모듈입니다. `dbclient`와 같은 API 외형과 계약 캐시/refresh 패턴을 유지하되, 실제 실행은 Neo4j와 Memgraph만 지원합니다.

## 지원 범위
- 지원 provider: `Neo4j`, `Memgraph`
- 지원 URI: `bolt://`, `neo4j://`
- 지원 ReturnType: `Json`, `Scalar`, `NonQuery`, `SchemeOnly`, `CodeHelp`
- 미지원 ReturnType: `SQLText`, `Xml`  
  요청 시 명시적 실패 응답을 반환합니다.
- 거래 라우팅: `transact`의 `G` CommandType

## 주요 진입점
- `GET /graphclient/api/query/has`
- `GET /graphclient/api/query/refresh`
- `GET /graphclient/api/query/retrieve`
- `GET /graphclient/api/query/meta`
- `GET /graphclient/api/query/reports`
- `POST /graphclient/api/query/execute`

## 핵심 구현
- `Areas/graphclient/Controllers/QueryController.cs`
- `DataClient/GraphDataClient.cs`
- `Extensions/GraphMapper.cs`
- `Events/GraphClientRequestHandler.cs`
- `Events/ManagedRequestHandler.cs`
- `Events/QueryRefreshRequestHandler.cs`

## 실행 흐름
1. `ack`가 `module.json`을 로드하고 `GraphMapper`가 `../contracts/graphclient`의 XML 계약을 캐시합니다.
2. `transact`는 `G` CommandType을 `/graphclient/api/query`로 라우팅합니다.
3. `graphclient`는 `GraphDataSource`와 statement 메타데이터를 찾고 Bolt 세션을 엽니다.
4. `GraphDataClient`가 Cypher를 실행하고 결과를 HandStack 직렬화 가능 값으로 변환합니다.

## 로컬 실행
```powershell
dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,graphclient,function
```

### Neo4j 샘플
```powershell
docker run -d --name neo4j-local -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/local-password neo4j:5
```

### Memgraph 샘플
```powershell
docker run -d --name memgraph-local -p 7444:7444 -p 7688:7687 memgraph/memgraph:latest
```

## GraphDataSource 예시
```json
{
  "ApplicationID": "HDS",
  "ProjectID": "*",
  "DataSourceID": "GRAPH01",
  "GraphProvider": "Neo4j",
  "ConnectionString": "bolt://localhost:7687",
  "UserName": "neo4j",
  "Password": "local-password",
  "Database": "neo4j",
  "IsEncryption": "N",
  "Comment": "로컬 Neo4j"
}
```

## 샘플 계약
기본 샘플 계약은 [Contracts/graphclient/HDS/TST/TST010.xml](./Contracts/graphclient/HDS/TST/TST010.xml)에 있습니다.

- `GM0100`: `MATCH`
- `GC0100`: `CREATE`
- `GG0100`: `MERGE`

`execute` 요청의 `QueryID`는 `ApplicationID|ProjectID|TransactionID|StatementID` 형식이며, 예를 들어 `HDS|TST|TST010|GM0100`처럼 statement의 seq까지 포함한 최종 ID를 사용합니다.

## 직접 API 예시
```powershell
$body = @{
  AccessToken = ""
  Action = "Execute"
  ClientTag = "graphclient-smoke"
  Environment = "D"
  GlobalID = [guid]::NewGuid().ToString("N")
  RequestID = [guid]::NewGuid().ToString("N")
  ReturnType = "Json"
  DynamicObjects = @(
    @{
      QueryID = "HDS|TST|TST010|GM0100"
      Parameters = @()
      JsonObject = "GridJson"
      JsonObjects = @("GridJson")
      BaseFieldMappings = @()
      BaseFieldRelations = @()
      IgnoreResult = $false
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri "http://localhost:8421/graphclient/api/query/execute" -ContentType "application/json" -Body $body
```

## transact 연계 예시
기본 라우팅은 아래 3개를 사용합니다.

- `HDS|*|G|D -> http://localhost:8421/graphclient/api/query`
- `HDS|*|G|P -> http://localhost:8421/graphclient/api/query`
- `HDS|*|G|T -> http://localhost:8421/graphclient/api/query`

거래 계약 예시는 다음처럼 작성합니다.

```json
{
  "ServiceID": "G01",
  "CommandType": "G",
  "ReturnType": "Json",
  "TransactionScope": false,
  "Inputs": [ "GraphInput" ],
  "Outputs": [ "GraphOutput" ]
}
```

## 운영 메모
- 계약 파일 감시는 `IsContractFileWatching`으로 제어합니다.
- `SubscribeAction` 기본값은 `graphclient.Events.GraphClientRequest`, `graphclient.Events.ManagedRequest`입니다.
- 테넌트 앱은 `settings.json`의 `GraphDataSource` 배열로 추가 데이터소스를 주입할 수 있습니다.
- `GraphMapper`는 SQL 전용 DbType/방향성 처리 없이 named parameter(`$name`) 바인딩만 사용합니다.

## 빌드 명령
```powershell
dotnet build 2.Modules/graphclient/graphclient.csproj
.\build.ps1
```
