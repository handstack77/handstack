# dbclient 모듈

## 개요
`dbclient`는 XML 계약 기반 SQL 실행 모듈입니다. `DynamicRequest`를 받아 SQLite, SQL Server, Oracle, MySQL, PostgreSQL을 공통 인터페이스로 실행하고 `Json`, `Scalar`, `NonQuery`, `Xml` 형태로 반환합니다.

## 책임 범위
- XML statement map을 메모리에 적재하고 공급자별 SQL 실행 경로를 제공합니다.
- 데이터 원본 정의(`DataSource`)와 계약 경로(`ContractBasePath`)를 관리합니다.
- `transact`에서 라우팅된 D 타입 거래를 실제 DB 실행으로 변환합니다.
- 계약 파일 변경을 감시해 런타임 캐시를 갱신합니다.
- 필요 시 Mediator 이벤트로 들어온 DB 요청도 직접 처리합니다.

## 주요 진입점
- `GET /dbclient/api/query/has`
- `GET /dbclient/api/query/refresh`
- `GET /dbclient/api/query/retrieve`
- `GET /dbclient/api/query/meta`
- `GET /dbclient/api/query/reports`
- `POST /dbclient/api/query`
- 주요 구현 클래스
  - `QueryController`
  - `QueryDataClient`
  - `DbClientRequestHandler`
  - `ManagedRequestHandler`
  - `QueryRefreshRequestHandler`

## 주요 디렉터리
- `Areas/dbclient/Controllers`: `/dbclient/api/query/*`와 관리 API
- `DataClient/QueryDataClient.cs`: 계약 해석, 파라미터 바인딩, SQL 실행 핵심 구현
- `Events`: Mediator 요청/리프레시 처리기
- `Profiler`: 실행 프로파일 수집
- `NativeParameters`, `Parameter`: 공급자별 파라미터 보조 구현
- `Contracts/dbclient`: 샘플 XML 계약

## 계약 및 데이터 자산
- XML 헤더에는 `application`, `project`, `transaction`, `datasource`가 들어갑니다.
- `statement id`는 보통 `GD01`, `LD01`, `MD01`, `DD01`처럼 서비스 단위로 분리됩니다.
- 각 statement는 `param` 정의를 통해 입력을 선언하고 `DatabaseMapper`가 런타임에 파라미터를 매핑합니다.
- 현재 모듈 루트의 `Contracts/dbclient`는 샘플이고, 실제 업무 계약은 보통 `../contracts/dbclient` 또는 테넌트 앱 계약 디렉터리에 위치합니다.

## JSON 배열 필터 SQL

SQL의 `WHERE` 필수 조건 뒤에 `<filters>`를 선언하면 해당 위치에 `AND (...)` 조건을 생성합니다. 요청의 `Filters`는 객체 배열을 JSON으로 직렬화한 문자열입니다. SQL을 직접 전달하지 않습니다.

```xml
SELECT M.* FROM [Message] M WHERE M.IsDeleted = 0

<filters parameter="Filters" groupLogic="AND">
    <field groupID="user" column="M.UserID" type="String" operators="eq,ne" />
    <field groupID="content" column="M.MarkdownText" type="String"
           operators="eq,ne,startsWith,endsWith,contains" />
    <field groupID="createdAt" column="M.CreatedAt" type="DateTime" operators="eq,ne,lte,gte" />
</filters>
<param id="@Filters" type="String" length="-1" value="NULL" />
```

XML 계약의 SQL 본문은 기존 예제와 같이 CDATA 안에 작성하고, `<filters>`는 CDATA 밖에 선언합니다. `column`에는 별칭을 포함한 단일 컬럼 식별자만 선언합니다. 함수, SQL 식, 정렬문은 허용하지 않습니다. 인용된 컬럼의 각 부분은 대상 DB 문법으로 변환합니다. 예를 들어 `M.[Display.Name]`은 SQL Server에서 그대로, Oracle·PostgreSQL·SQLite에서는 `M."Display.Name"`, MySQL/MariaDB에서는 M.`Display.Name`이 됩니다. 인용하지 않은 이름은 그대로 두므로 DB의 기본 대소문자 접기 규칙이 적용됩니다. SQL 본문의 테이블명과 별칭은 이 변환의 대상이 아닙니다.

```javascript
const filters = [
    { groupID: 'user', logic: 'AND', operator: 'eq', key: 'user001', value: '사용자 1' },
    { groupID: 'user', logic: 'OR', operator: 'eq', key: 'user002', value: '사용자 2' },
    { groupID: 'content', logic: 'AND', operator: 'contains', key: 'HandStack', value: 'HandStack' }
];

// DynamicObjects[].Parameters에 전달할 항목
const parameter = {
    ParameterName: 'Filters', DbType: 'String', Length: -1,
    Value: JSON.stringify(filters)
};
```

위 배열은 다음 형태의 조건과 세 개의 바인딩 매개변수로 변환합니다.

```sql
AND (
    (M.UserID = @Filter_main_0 OR M.UserID = @Filter_main_1)
    AND (M.MarkdownText LIKE @Filter_main_2 ESCAPE '!')
)
```

각 매개변수 값은 `user001`, `user002`, `%HandStack%`입니다. Oracle의 생성 SQL은 `@` 대신 `:` 접두사를 사용합니다. 예시 SQL은 가독성을 위해 줄바꿈과 중복 괄호를 정리한 형태입니다.

| 설정 | 의미 |
| --- | --- |
| `parameter` | 입력 매개변수 이름. 기본값 `Filters`. `@Filters`와 같이 접두사를 붙인 입력 이름도 인식 |
| `groupLogic` | 그룹 사이 연결. `AND`(기본) 또는 `OR` |
| `field.groupID` | 요청 조건의 `groupID`와 일치하는 고유한 그룹 이름. 대소문자 구분 |
| `field.column` | 서버 계약에서 허용하는 실제 컬럼 |
| `field.type` | 비교할 `key`의 DB 타입. 기본값 `String` |
| `field.operators` | 쉼표로 구분한 허용 연산자. 기본값 `eq` |
| `field.guidFormat` | `Guid` 타입의 물리 저장 형식. `Default`(기본), `String36`, `String32`, `Binary16`, `Binary16BigEndian` |
| `field.booleanFormat` | `Boolean` 타입의 물리 저장 형식. `Default`(기본), `Native`, `Numeric` |

지원 타입은 `String`, `AnsiString`, `Int16`, `Int32`, `Int64`, `Decimal`, `Double`, `Single`, `Boolean`, `Date`, `DateTime`, `DateTime2`, `DateTimeOffset`, `Guid`입니다. 숫자는 소수점 `.`을 쓰는 invariant 형식입니다. `Date`·`DateTime`·`DateTime2`는 `yyyy-MM-dd` 또는 시간대 없는 `yyyy-MM-ddTHH:mm:ss[.fffffff]` 형식이며 `Date`는 시간 부분을 제거합니다. `DateTimeOffset`은 `2026-10-14T21:34:56.123456+09:00`처럼 명시적인 오프셋이나 `Z`가 필요하며 UTC로 정규화합니다. 서버의 로컬 시간대에 의존하는 날짜 변환은 하지 않습니다. `Boolean`은 `true`/`false` 또는 `1`/`0`을 받습니다.

| 연산자 | 생성 조건 |
| --- | --- |
| `eq`, `ne` | `=`, `<>` |
| `lte`, `gte` | `<=`, `>=` |
| `startsWith` | `LIKE '값%'`에 해당하는 매개변수 |
| `endsWith` | `LIKE '%값'`에 해당하는 매개변수 |
| `contains` | `LIKE '%값%'`에 해당하는 매개변수 |

문자열 검색은 `String`·`AnsiString` 타입에서 지원합니다. `%`, `_`, `!`는 실제 문자로 검색하도록 이스케이프하며, SQL Server의 `[`도 처리합니다. `contains`는 `FREETEXT` 검색과 다릅니다. 값의 작은따옴표는 SQL에 치환하지 않고 그대로 바인딩합니다.

- 매개변수 누락, 실제 `null`, 빈 문자열, 공백 문자열, JSON `null`, `[]`는 조건을 추가하지 않습니다.
- 잘못된 JSON, 배열이 아닌 값, 미등록 그룹, 허용되지 않은 연산자, 타입 변환 실패, 같은 그룹·키의 중복 조건은 오류입니다. SQL 하나에서 생성할 수 있는 필터 조건은 최대 1000개입니다.
- 같은 그룹은 배열에 나타난 순서대로 결합하고 첫 항목의 `logic`은 사용하지 않습니다. `A OR B AND C`는 선택 순서에 따라 `((A OR B) AND C)`로 처리합니다. 그룹 전체를 다시 괄호로 묶으므로 `OR`로 기존 필수 조건을 우회하지 않습니다.
- `key`가 비교값입니다. DropDownTextList의 `value`는 표시명이므로 SQL 생성에 사용하지 않습니다. `groupID`는 UI 분류를 자동으로 SQL 컬럼으로 바꾸는 값이 아니라, 계약에서 등록한 검색 필드의 식별자입니다.
- 원본 `Filters` JSON은 DB로 바인딩하지 않습니다. 생성한 매개변수는 요청별로 관리하고 기존 `StatementMap`·`QueryObject`는 변경하지 않습니다. 생성 이름 `Filter_main_*`, `Filter_pre_*`를 업무 매개변수로 사용하면 충돌 오류가 발생합니다.
- `<if>`·`<foreach>` 내부와 `<pretreatment>`에서도 사용할 수 있습니다. 선언 위치가 실제로 렌더링될 때만 해당 필터를 처리합니다.
- 기존 코드에서 `DatabaseMapper.Find`를 직접 호출하면서 활성 필터를 사용한다면 `(statementMap, queryObject, dynamicParameters, databaseProvider)` 오버로드를 사용합니다. `FindPretreatment`도 같은 추가 인자를 받습니다.

예제는 `Contracts/dbclient/HDS/TST/TST010.xml`의 `GD06`과 `GD08`입니다. `GD06`은 기존 SQL Server 업무 쿼리를 유지하며, `GD08`은 SQLite의 상수 데이터만 조회하므로 테이블 생성이나 데이터 변경 없이 실행할 수 있습니다.

### 공급자별 SQL·바인딩 규칙

일반 실행과 `NativeDataClient` 모두 실제 공급자의 `DbParameter`를 생성합니다. Oracle은 `BindByName=true`를 설정하므로 필터 매개변수와 기존 매개변수가 추가된 순서에 영향을 받지 않습니다. 이름은 모든 공급자에서 유효하도록 영문자로 시작합니다.

| 논리 타입/기능 | SQL Server | Oracle | MySQL/MariaDB | PostgreSQL | SQLite |
| --- | --- | --- | --- | --- | --- |
| 매개변수 | `@Filter_main_0` | `:Filter_main_0` | `@Filter_main_0` | `@Filter_main_0` | `@Filter_main_0` |
| 인용 식별자 | `[Name]` | `"Name"` | `` `Name` `` | `"Name"` | `"Name"` |
| `String` | `NVarChar` | `NVarchar2` | `VarChar` | `Text` | `String` |
| `AnsiString` | `VarChar` | `Varchar2` | `VarChar` | `Text` | `AnsiString` |
| `Boolean` | `bit` | `NUMBER(1)`에 0/1 | Boolean/tinyint | `boolean` | 0/1 |
| `Date` | `date` | `DATE` | `DATE` | `date` | 연결의 날짜 저장 형식 |
| `DateTime` / `DateTime2` | `datetime2` | `TIMESTAMP` | `DATETIME` | `timestamp without time zone` | 연결의 날짜 저장 형식 |
| `DateTimeOffset` | UTC `datetimeoffset` | UTC `TIMESTAMP WITH TIME ZONE` | UTC 시각의 `DATETIME` | UTC `timestamptz` | UTC 시각, 연결의 날짜 저장 형식 |
| 기본 `Guid` | `uniqueidentifier` | `RAW(16)`, .NET 바이트 순서 | 연결의 `GuidFormat` | `uuid` | 연결의 `BinaryGUID` 설정 |
| `Double` / `Single` | `Float` / `Real` | `BINARY_DOUBLE` / `BINARY_FLOAT` | `Double` / `Float` | `double precision` / `real` | `Double` / `Single` |

`Int16`·`Int32`·`Int64`·`Decimal`도 각 드라이버의 대응 숫자 타입으로 바인딩합니다. MySQL과 MariaDB는 기존 dbclient와 동일한 MySqlConnector 경로를 사용합니다.

GUID 컬럼의 물리 형식이 기본값과 다르면 계약에서 지정합니다.

```xml
<field groupID="id" column="M.ItemID" type="Guid" guidFormat="String36" operators="eq,ne" />
```

- `String36`: 하이픈을 포함한 소문자 UUID 문자열, 예: `00112233-4455-6677-8899-aabbccddeeff`.
- `String32`: 하이픈 없는 소문자 32자리 문자열.
- `Binary16`: `Guid.ToByteArray()`의 .NET 바이트 순서. 위 UUID는 `33221100554477668899AABBCCDDEEFF`.
- `Binary16BigEndian`: RFC UUID 바이트 순서. 위 UUID는 `00112233445566778899AABBCCDDEEFF`. Oracle `HEXTORAW`로 이 순서를 저장했다면 이 형식을 지정합니다.

Oracle의 빈 문자열 `key`는 `eq`일 때 `IS NULL`, `ne`일 때 `IS NOT NULL`로 변환하며 DB 매개변수를 추가하지 않습니다. 빈 문자열의 `lte`·`gte`는 오류이고 문자열 검색은 `%` 패턴 규칙을 따릅니다. **Filters 매개변수 자체가 비어 조건을 무시하는 동작과는 별개입니다.**

Oracle의 기본 `MAX_STRING_SIZE=STANDARD`와 두 국가 문자셋을 함께 고려해 `String`은 2000 UTF-16 코드 단위 및 CESU-8 4000바이트 이내, `AnsiString`은 UTF-8 4000바이트 이내로 제한합니다. SQL Server의 `LIKE` 패턴은 이스케이프·와일드카드를 포함해 Unicode 4000자 또는 ANSI UTF-8 8000바이트 이내입니다. 이보다 긴 검색은 오류로 처리하며 자동으로 잘라내거나 LOB로 바꾸지 않습니다. NUL 문자는 모든 공급자에서 거부합니다. Unicode 검색에는 `String`을 사용하고 MySQL/MariaDB 연결·컬럼의 문자셋도 UTF-8에 맞춥니다.

서버 실행 결과의 대소문자·악센트 비교는 컬럼 collation, 날짜의 정밀도는 실제 컬럼 precision, NULL 비교는 DB 규칙을 따릅니다. MySQL/MariaDB·SQLite에서 `DateTimeOffset`을 검색하는 컬럼은 UTC 시각을 저장해야 합니다. SQLite의 `DateTimeFormat`·`BinaryGUID`, MySQL/MariaDB의 `GuidFormat`은 기존 데이터 저장 형식과 일치해야 합니다. Oracle의 기본 `Boolean`은 19c/21c와도 호환되는 숫자 컬럼을 기준으로 합니다. 23c 이상 SQL BOOLEAN 컬럼은 `booleanFormat="Native"`로 지정합니다. 다른 공급자의 기본값은 네이티브 Boolean이며, 정수 0/1 컬럼을 사용한다면 `booleanFormat="Numeric"`을 지정합니다. 전체 업무 SQL을 다른 DB 문법으로 번역하거나 collation·저장 형식을 자동 변경하는 기능은 아닙니다.

Boolean 컬럼에 맞춘 선언 예시는 다음과 같습니다. 허용 연산자는 업무 의미에 맞게 `eq,ne`로 제한할 수 있습니다.

```xml
<!-- Oracle 23c 이상 SQL BOOLEAN 컬럼 -->
<field groupID="enabled" column="M.Enabled" type="Boolean" booleanFormat="Native" operators="eq,ne" />
<!-- 숫자 0/1 컬럼 -->
<field groupID="enabled" column="M.Enabled" type="Boolean" booleanFormat="Numeric" operators="eq,ne" />
```

### 공급자별 실행 예제

`Contracts/dbclient/HDS/TST/TST011.xml`은 공급자별 상수 데이터만 조회하는 계약입니다. 기존 테이블을 조회하거나 생성·변경하지 않습니다. 새 dbclient DLL과 계약을 배포한 뒤 데이터 원본을 구성하고 실행합니다. 각 statement는 `POST /dbclient/api/query` 요청의 `DynamicObjects[].QueryID`로 실행합니다.

| QueryID 끝부분 | 대상 | 계약의 datasource |
| --- | --- | --- |
| `GD0100` | SQL Server | `DB02` |
| `GD0200` | Oracle | `DB03` |
| `GD0300` | MySQL 또는 MariaDB | `DB04` |
| `GD0400` | PostgreSQL | `DB05` |
| `GD0500` | SQLite | `DB01` |

테스트 전용 DataSource를 추가하고 필요하면 각 statement의 `datasource`를 해당 ID로 바꿉니다. fixture의 MySQL/MariaDB는 `GuidFormat=Char36`, SQLite는 `DateTimeFormat=ISO8601`을 사용합니다. 기존 업무 데이터 원본의 저장 설정을 바꾸지 않습니다.

예를 들어 Oracle 계약은 다음 요청으로 실행합니다. 접근 제어 설정에 따라 `AuthorizationKey` 헤더를 지정합니다.

```json
{
  "Action": "SYN",
  "ReturnType": 0,
  "DynamicObjects": [
    {
      "QueryID": "HDS|TST|TST011|GD0200",
      "JsonObject": 1,
      "Parameters": [
        {
          "ParameterName": "Filters",
          "DbType": "String",
          "Length": -1,
          "Value": "[{\"groupID\":\"user\",\"logic\":\"AND\",\"operator\":\"eq\",\"key\":\"user001\",\"value\":\"사용자 1\"}]"
        }
      ]
    }
  ]
}
```

위 요청은 `user001` 한 행을 반환합니다. `Filters`의 `Value`를 `"[]"`, `null`, 빈 문자열로 바꾸거나 매개변수를 생략하면 삭제되지 않은 `user001`·`user002` 두 행을 반환합니다. 다른 공급자는 위 표에 맞춰 QueryID를 변경합니다. MariaDB는 MySQL과 별도의 연결로 같은 `GD0300` 계약을 사용합니다.

Native 실행은 테스트 계약 statement의 `native="true"` 설정을 적용한 뒤 같은 요청을 보냅니다. 실제 업무 테이블에 연결할 때는 collation, 문자열 길이, 날짜 소수초 정밀도, GUID 저장 형식도 대조합니다.

공급자 규칙의 근거: [Oracle BindByName](https://docs.oracle.com/en/database/oracle/oracle-database/26/odpnt/ConnectionBindByName.html), [Oracle Unicode 크기](https://docs.oracle.com/en/database/oracle/oracle-database/21/nlspg/supporting-multilingual-databases-with-unicode.html), [Npgsql 날짜 매핑](https://www.npgsql.org/doc/types/datetime.html), [MySqlConnector 지원 타입](https://mysqlconnector.net/troubleshooting/parameter-types/), [SQL Server LIKE](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/like-transact-sql), [MariaDB LIKE](https://mariadb.com/docs/server/reference/sql-functions/string-functions/like), [SQLite 표현식](https://sqlite.org/lang_expr.html).

## 설정 포인트
- `ContractBasePath`: XML 계약 루트 목록
- `DataSource`: 공급자/연결 문자열/암호화 여부 정의
- `DefaultCommandTimeout`: 기본 SQL 타임아웃
- `IsContractFileWatching`: 계약 hot reload 여부
- `IsTransactionLogging`, `IsProfileLogging`: 거래 로그와 프로파일 로그 분리 여부
- `LogServerUrl`, `ModuleLogFilePath`, `ProfileLogFilePath`: 로그 위치와 수집 서버

## 실행 흐름
1. 화면 또는 서버 기능이 `transact`로 거래를 요청합니다.
2. `transact`는 D 타입 서비스를 `/dbclient/api/query`로 라우팅합니다.
3. `dbclient`는 `DatabaseMapper`에서 해당 XML 계약과 statement를 찾습니다.
4. `QueryDataClient`가 `DataSourceID`에 맞는 연결을 열고 SQL을 실행한 뒤 계약 형식으로 결과를 반환합니다.

### 결과 변환과 메모리 사용

- 일반 결과는 `ExecuteReader` → `DataTableHelper.DataReaderToDataSet` → 관계/메타 처리 → `FormJson`, `GridJson`, `ChartGridJson`, `DataTableJson` 순서로 처리합니다. 다중 결과 집합, 열 이름·타입·문자열 길이, 행 순서와 `DBNull`을 유지합니다. 반환된 DataSet은 호출자가 해제합니다.
- `IgnoreResult=true`이면 현재 결과 집합을 끝까지 읽고 형식을 검증하면서 후속 `BaseFieldMappings`에 필요한 행만 보관합니다. `Json`, `Scalar`, `NonQuery`, `Xml`은 마지막 행을, `SchemeOnly`, `SQLText`는 첫 행을 사용합니다. 첫 행을 보관할 때는 검증용 행 하나를 추가로 재사용하며, 이 경로에서 다음 결과 집합으로 직접 이동하지 않습니다.
- `NonQuery`의 `IgnoreResult` 분기는 기존과 같이 첫 `Read` 전에 `RecordsAffected`를 누적합니다. 트랜잭션과 Reader 종료는 기존 실행 경로가 담당합니다.
- Form 변환은 첫 행의 값을 사용하며, 이후 행에서 불필요한 배열 복사를 줄입니다. Grid/Chart 변환은 결과 크기로 컬렉션 용량을 지정하고, DataTable 래퍼는 원본 테이블을 그대로 참조합니다.
- 파일별 검토, 보류 사유, 비교 측정과 검증 범위는 [2026-09-24 최적화 검토 기록](../../docs/optimization/2026-09-24/report.md)에 있습니다. 측정치는 해당 변환 단계의 결과이며 서버 전체 응답 시간 개선율을 뜻하지 않습니다.

## 운영 메모
- `SubscribeAction`에 `dbclient.Events.DbClientRequest`, `dbclient.Events.ManagedRequest`가 등록되어 있어 다른 모듈이 Mediator로 DB 실행을 위임할 수 있습니다.
- 기본 `DataSource`에는 `CHECKUPDB`, `DB01~DB05`가 포함되어 있어 멀티 DB 샘플 환경을 바로 띄울 수 있습니다.

### 개발용 DB 컨테이너 예시
```powershell
# SQL Server 2022
docker run -d -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=handstack~!@34" -p 1433:1433 --name mssql --hostname mssql mcr.microsoft.com/mssql/server:2022-latest

# MariaDB
docker run -d -e "MARIADB_USER=ack" -e "MARIADB_PASSWORD=ack~!@34" -e "MARIADB_ROOT_PASSWORD=handstack~!@34" -p 3306:3306 --name mariadb --hostname mariadb mariadb:latest --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

# Oracle XE
docker run -d -e "ORACLE_SID=XE" -e "ORACLE_PDB=ORCLPDB" -e "ORACLE_PWD=handstack~!@34" -p 1521:1521 -p 5500:5500 --name oracle-xe --hostname oracle-xe container-registry.oracle.com/database/express:21.3.0-xe

# PostgreSQL
docker run -d -e "TZ=Asia/Seoul" -e "POSTGRES_PASSWORD=handstack~!@34" -p 5432:5432 --name postgresql --hostname postgresql postgres:latest
```

### 참고 링크
- SQL Server: `http://www.connectionstrings.com/sql-server-2008`
- Oracle: `http://www.connectionstrings.com/oracle`
- MySQL: `http://www.connectionstrings.com/mysql`
- IBM DB2: `http://www.connectionstrings.com/ibm-db2`
- Excel 2007: `http://www.connectionstrings.com/excel-2007`
- Textfile: `http://www.connectionstrings.com/textfile`
- Access 2007: `http://www.connectionstrings.com/access-2007`
- SQL Azure: `http://www.connectionstrings.com/sql-azure`
- OLAP / Analysis Services: `http://www.connectionstrings.com/olap-analysis-services`

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
