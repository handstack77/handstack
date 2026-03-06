# dbclient 모듈

## 개요
`dbclient`는 XML 계약 기반 SQL 실행 모듈입니다. `DynamicRequest`를 받아 SQLite, SQL Server, Oracle, MySQL, PostgreSQL을 공통 인터페이스로 실행하고 `Json`, `Scalar`, `NonQuery`, `Xml` 형태로 반환합니다.

## 책임 범위
- XML statement map을 메모리에 적재하고 공급자별 SQL 실행 경로를 제공합니다.
- 데이터 원본 정의(`DataSource`)와 계약 경로(`ContractBasePath`)를 관리합니다.
- `transact`에서 라우팅된 D 타입 거래를 실제 DB 실행으로 변환합니다.
- 계약 파일 변경을 감시해 런타임 캐시를 갱신합니다.
- 필요 시 MediatR 이벤트로 들어온 DB 요청도 직접 처리합니다.

## 주요 진입점
- `GET /dbclient/api/query/has`
- `GET /dbclient/api/query/refresh`
- `GET /dbclient/api/query/retrieve`
- `GET /dbclient/api/query/meta`
- `GET /dbclient/api/query/reports`
- `POST /dbclient/api/query/execute`
- 주요 구현 클래스
  - `QueryController`
  - `QueryDataClient`
  - `DbClientRequestHandler`
  - `ManagedRequestHandler`
  - `QueryRefreshRequestHandler`

## 주요 디렉터리
- `Areas/dbclient/Controllers`: `/dbclient/api/query/*`와 관리 API
- `DataClient/QueryDataClient.cs`: 계약 해석, 파라미터 바인딩, SQL 실행 핵심 구현
- `Events`: MediatR 요청/리프레시 처리기
- `Profiler`: 실행 프로파일 수집
- `NativeParameters`, `Parameter`: 공급자별 파라미터 보조 구현
- `Contracts/dbclient`: 샘플 XML 계약

## 계약 및 데이터 자산
- XML 헤더에는 `application`, `project`, `transaction`, `datasource`가 들어갑니다.
- `statement id`는 보통 `GD01`, `LD01`, `MD01`, `DD01`처럼 서비스 단위로 분리됩니다.
- 각 statement는 `param` 정의를 통해 입력을 선언하고 `DatabaseMapper`가 런타임에 파라미터를 매핑합니다.
- 현재 모듈 루트의 `Contracts/dbclient`는 샘플이고, 실제 업무 계약은 보통 `../contracts/dbclient` 또는 테넌트 앱 계약 디렉터리에 위치합니다.

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

## 운영 메모
- `SubscribeAction`에 `dbclient.Events.DbClientRequest`, `dbclient.Events.ManagedRequest`가 등록되어 있어 다른 모듈이 MediatR로 DB 실행을 위임할 수 있습니다.
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
