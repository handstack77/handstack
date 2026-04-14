# command 모듈

## 개요
`command`는 계약 기반으로 CLI 프로세스와 Web URL을 실행하는 HandStack 모듈입니다. `dbclient`처럼 XML 계약을 읽어 `QueryID`에 매핑하고, `/command/api/execution`에서 `DynamicRequest`를 받아 결과를 `DynamicResponse`로 반환합니다.

## 주요 진입점
- `GET /command/api/execution/has`
- `GET /command/api/execution/refresh`
- `GET /command/api/execution/retrieve`
- `GET /command/api/execution/meta`
- `POST /command/api/execution`
- 주요 구현 클래스
  - `ExecutionController`
  - `CommandDataClient`
  - `CommandMapper`
  - `CommandRefreshRequestHandler`

## 계약 파일
계약은 `Contracts/command/{ApplicationID}/{ProjectID}/{TransactionID}.xml`에 둡니다. CLI는 `<commands>/<command>`, Web 요청은 `<requests>/<request>`에 선언합니다. 각 노드의 `id`와 `seq`를 조합해 `CommandID`를 만들며, 최종 `QueryID`는 `ApplicationID|ProjectID|TransactionID|CommandID`입니다.

```xml
<mapper xmlns="contract.xsd">
    <header>
        <application>HDS</application>
        <project>TST</project>
        <transaction>TST010</transaction>
        <use>Y</use>
    </header>
    <commands>
        <command id="GC01" seq="0" use="Y" timeout="30" desc="dotnet 정보 조회">
            <executable>dotnet</executable>
            <arguments>--{#UserID} --user-id={#UserID} --role-id={@RoleID}</arguments>
            <successExitCodes>0</successExitCodes>
            <param id="@UserID" type="String" length="255" value="NULL" />
            <param id="@RoleID" type="String" length="100" value="NULL" />
        </command>
    </commands>
    <requests>
        <request id="GW01" seq="0" use="Y" timeout="30" desc="URL 호출">
            <method>GET</method>
            <url>http://localhost:8421/checkip</url>
            <querystrings>
                <value id="userID">{@UserID}</value>
            </querystrings>
            <headers>
                <header id="Accept">text/plain</header>
            </headers>
            <param id="@UserID" type="String" length="255" value="NULL" />
            <param id="@RoleID" type="String" length="100" value="NULL" />
        </request>
    </requests>
</mapper>
```

## 파라미터 치환
- `<param id="Name" type="String" value="NULL" required="Y" />`로 요청 파라미터를 선언합니다.
- `{@Name}`은 원문 값으로 치환합니다.
- `{#Name}`은 큰따옴표가 포함된 문자열 값으로 치환하고, `\`, `"`, 개행, 탭을 이스케이프합니다.
- 기존 `${Name}`, `#{Name}` 패턴은 하위 호환으로 계속 지원합니다.
- 계약 파라미터가 있고 요청 값이 없으면 `value` 기본값을 사용합니다. 기본값이 `NULL`이고 `required`가 `Y`이면 실패합니다.

## Web 요청 옵션
- `<querystrings>`는 URL query string으로 매핑됩니다. `GET`, `DELETE`, `HEAD`, `POST`, `PUT`, `PATCH` 모두 동일하게 query string에 추가합니다.
- `<authorization type="Basic" username="{@UserID}" password="{@Password}" />`는 Basic Auth 헤더를 생성합니다.
- `<authorization type="Bearer">{@AccessToken}</authorization>`와 `<authorization type="JwtBearer">{@JwtToken}</authorization>`는 `Authorization: Bearer` 헤더를 생성합니다.
- `<authorization type="ApiKey" name="x-api-key" in="Header">{@ApiKey}</authorization>`는 헤더로, `in="Query"`는 query string으로 API Key를 보냅니다.
- `<headers><header id="X-User">{@UserID}</header></headers>`처럼 헤더 이름과 값에 모두 치환 패턴을 사용할 수 있습니다.
- Raw JSON body는 `<body type="raw" contentType="application/json">{"userId":{#UserID}}</body>`처럼 선언합니다.
- Multipart form-data는 `<body type="form-data"><part type="text" name="userId">{@UserID}</part><part type="file" name="upload" path="{@FilePath}" fileName="{@FileName}" /></body>`처럼 선언합니다. 파일 part는 `path` 서버 경로와 `base64` 값을 모두 지원하며, 둘 다 있으면 `path`가 우선입니다.

## 실행 흐름
1. `ExecutionController`가 `DynamicRequest`를 받습니다.
2. 각 `QueryObject.QueryID`로 `CommandMapper`에서 계약을 찾습니다.
3. `<commands>/<command>`는 `ProcessStartInfo`로 shell 없이 실행합니다.
4. `<requests>/<request>`는 `IHttpClientFactory`로 URL을 호출합니다.
5. 결과 배열을 `DynamicResponse.ResultJson`에 담아 반환합니다.

## transact 연동
`transact`에서 호출할 때는 `CommandType`을 `C`로 두고 `RoutingCommandUri`에 `HDS|*|C|D -> http://localhost:8421/command/api/execution`을 설정합니다. `transact`가 만드는 `QueryID`는 `ApplicationID|ProjectID|TransactionID|ServiceID00` 형식이므로, 서비스 ID와 command 계약의 `id`를 맞춥니다.

## 로컬 실행 예
```powershell
dotnet run --project 1.WebHost/ack/ack.csproj -- --port=8421 --modules=wwwroot,transact,dbclient,function,command
```

```powershell
curl -X POST "http://localhost:8421/command/api/execution" `
  -H "Content-Type: application/json" `
  -d @commandTest.json
```

`commandTest.json` 예:
```json
{
  "ClientTag": "README",
  "Version": "1",
  "RequestID": "COMMAND-README-001",
  "Action": "SYN",
  "Environment": "D",
  "ReturnType": 0,
  "GlobalID": "COMMAND-README-001",
  "IsTransaction": false,
  "DynamicObjects": [
    {
      "QueryID": "HDS|TST|TST010|GC0100",
      "Parameters": [
        { "ParameterName": "@UserID", "Value": "tester", "DbType": "String", "Length": 255 },
        { "ParameterName": "@RoleID", "Value": "admin", "DbType": "String", "Length": 100 }
      ]
    }
  ]
}
```

## 빌드
```powershell
dotnet build 2.Modules/command/command.csproj -c Debug
```
