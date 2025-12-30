# HandStack 2025 연구개발보고서

## 1. 연구과제명
풀스택 비즈니스 애플리케이션 개발 플랫폼 "HandStack 2025" 고도화 및 멀티 런타임 확장 연구

## 2. 연구개발 개요

### 2.1 연구 배경 및 목표
HandStack 프레임워크는 모듈 기반의 확장 가능한 웹 애플리케이션 개발 플랫폼입니다. 본 연구는 다음과 같은 목표를 추구합니다:

- **멀티 런타임 지원**: C#, Node.js, Python 등 다양한 런타임 환경에서 동일한 계약(Contract) 기반으로 비즈니스 로직 실행
- **표준화된 데이터 교환**: DataSet/DataTable 구조를 통한 일관된 데이터 포맷 제공
- **동적 SQL 실행**: XML 기반 매퍼를 통한 안전하고 유연한 데이터베이스 작업
- **모듈러 아키텍처**: 각 기능을 독립된 모듈로 분리하여 유지보수성과 확장성 향상

### 2.2 전체 아키텍처 개요

HandStack의 전체 아키텍처는 다음과 같이 구성됩니다:

![전체 아키텍처 개요 다이어그램](../assets/images/architecture-overview.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/architecture-overview.png)

**주요 구성 요소:**
- **Client Layer**: syn.js, Tabler, Master CSS 기반의 UI 프레임워크
- **WebHost Layer**: ack 호스트 서버, Transact 모듈, Logger
- **Runtime Layer**: C#, Node.js, Python 멀티 런타임 지원
- **Infrastructure Layer**: DbClient, Repository, KeyVault, OpenTelemetry

## 3. 핵심 기술 상세

### 3.1 Transact 모듈 - 트랜잭션 처리 메커니즘

Transact 모듈은 클라이언트 요청을 받아 검증, 라우팅, 실행하는 핵심 컴포넌트입니다.

![Transact 요청 처리 시퀀스](../assets/images/transact-sequence.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/transact-sequence.png)

**처리 흐름:**
1. 클라이언트가 `/transact/api/transaction/execute` 엔드포인트로 요청
2. JSON Schema 기반 페이로드 검증
3. contractId 및 version에 따라 적절한 런타임으로 라우팅
4. 런타임이 비즈니스 로직 실행 (DB 조회, 파일 작업 등)
5. 표준 DataSet 형식으로 결과 반환
6. GlobalID를 통한 요청/응답 로깅

### 3.2 Polyglot 런타임 표준화

다양한 런타임 환경(C#, Node.js, Python)에서 실행된 결과를 표준 DataSet 구조로 변환하는 Standardizer가 핵심입니다.

![Polyglot 런타임 표준화 데이터 흐름](../assets/images/polyglot-standardizer-flow.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/polyglot-standardizer-flow.png)

**표준화 프로세스:**
- 각 런타임의 함수 실행 결과를 수집
- Standardizer를 통해 DataSet/DataTable 구조로 변환
- 스키마 및 메타데이터 포함
- 클라이언트에 일관된 형식으로 응답

### 3.3 DbClient - 멀티 데이터베이스 연동

DbClient 모듈은 XML 기반 SQL 매퍼를 통해 다양한 데이터베이스를 지원합니다.

![DbClient 멀티 DB 연동](../assets/images/dbclient-multi-db.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/dbclient-multi-db.png)

**지원 데이터베이스:**
- Microsoft SQL Server
- Oracle Database
- MySQL / MariaDB
- PostgreSQL
- SQLite

**주요 기능:**
- XML 매퍼를 통한 동적 쿼리 생성 (`<if>`, `<foreach>` 등)
- AES-256 암호화된 연결 문자열
- 커넥션 풀 관리
- 트랜잭션 지원

### 3.4 syn.js - 선언적 데이터 바인딩

syn.js는 HTML 속성 기반의 선언적 데이터 바인딩을 제공하는 클라이언트 라이브러리입니다.

![syn.js 선언적 바인딩 개념도](../assets/images/synjs-binding.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/synjs-binding.png)

**주요 특징:**
- `syn-datafield`: 데이터 필드 선언
- `syn-events`: 이벤트 핸들러 정의
- `syn-options`: 컴포넌트 옵션 설정
- 양방향 데이터 바인딩
- Transact Contract와의 자동 연동

## 4. 개발 및 운영 인프라

### 4.1 CI/CD 파이프라인

HandStack은 완전 자동화된 CI/CD 파이프라인을 통해 품질을 보장합니다.

![CI/CD 파이프라인 개요](../assets/images/cicd-pipeline.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/cicd-pipeline.png)

**파이프라인 단계:**
1. **Developer Commit**: 개발자 코드 커밋
2. **CI Build/Test**: 자동 빌드 및 단위 테스트
3. **Security Scan & SBOM**: 보안 취약점 스캔 및 SBOM 생성
4. **Container Image Sign**: 컨테이너 이미지 서명
5. **CD Deploy**: 자동 배포
6. **Operations**: PM2/Systemd/Kubernetes 기반 운영
7. **Observability**: OpenTelemetry를 통한 모니터링

### 4.2 보안 레이어링

다층 보안 구조를 통해 애플리케이션을 보호합니다.

![보안 레이어링](../assets/images/security-layering.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/security-layering.png)

**보안 계층:**
- **Transport Security**: mTLS/HTTPS
- **Authentication**: OAuth2/OIDC
- **Authorization**: IP 및 역할 기반 접근 제어 (ACL)
- **Code Protection**: Assembly 서명 (.snk), 난독화
- **Secrets Management**: KeyVault Secret (KVS) / KMS

### 4.3 디렉터리 구조

프로젝트는 역할별로 명확히 분리된 구조를 가집니다.

![디렉터리 구조 개념도](../assets/images/directory-structure.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/directory-structure.png)

**구조:**
- **WebHost**: 웹 애플리케이션 진입점
- **Modules**: 기능별 모듈 (dbclient, transact, logger 등)
- **Infrastructure**: 공통 라이브러리 및 유틸리티
- **Tools**: 개발 도구 (CLI 등)
- **Contracts**: 트랜잭션 계약 정의

## 5. 품질 보증 및 테스트

### 5.1 테스트 파이프라인

체계적인 테스트 전략을 통해 코드 품질을 보장합니다.

![테스트 파이프라인](../assets/images/test-pipeline.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/test-pipeline.png)

**테스트 단계:**
1. **Unit Tests**: 개별 함수 및 메서드 테스트
2. **Contract Tests**: Transact 계약 검증 테스트
3. **Integration Tests**: 모듈 간 통합 테스트
4. **E2E Tests**: 전체 시나리오 기반 테스트
5. **Coverage & QA Report**: 커버리지 분석 및 품질 보고서

### 5.2 DataSet 구조 상세

표준 DataSet 구조는 타입 안전성과 메타데이터를 보장합니다.

![DataSet 구조 개념도](../assets/images/dataset-structure.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/dataset-structure.png)

**구조 요소:**
- **DataSet**: 최상위 컨테이너
  - schema: 테이블 스키마 배열
  - data: 테이블별 행 데이터 맵
  - meta: 메타데이터 (globalId, timestamp, source)
- **TableSchema**: 테이블 정의
  - table: 테이블 이름
  - columns: 컬럼 배열
- **Column**: 컬럼 정의
  - name: 컬럼명
  - type: 데이터 타입
  - nullable: null 허용 여부

## 6. 계약 관리 및 버저닝

### 6.1 Contract 버저닝 전략

![계약 버저닝 흐름](../assets/images/contract-versioning.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/contract-versioning.png)

**버저닝 정책:**
- Semantic Versioning 적용 (v1.0, v1.1, v1.2 등)
- 하위 호환성 유지
- Deprecation Policy에 따른 단계적 폐기
- 버전별 병렬 실행 지원

### 6.2 성능 지표 모니터링

운영 중 주요 성능 지표를 실시간으로 모니터링합니다.

![성능 지표 대시보드(개념)](../assets/images/performance-dashboard.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/performance-dashboard.png)

**모니터링 지표:**
- **P95 Latency**: 95 백분위 응답 시간
- **TPS**: 초당 트랜잭션 처리량
- **MTTR**: 평균 복구 시간
- **Test Coverage**: 테스트 커버리지
- **Vulnerability Findings**: 보안 취약점 발견 건수

## 7. 배포 및 패키징

### 7.1 런타임 패키징 및 배포 프로세스

![런타임 패키징 및 배포 흐름](../assets/images/runtime-packaging-deploy.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/runtime-packaging-deploy.png)

**배포 프로세스:**
1. **Function Code**: C#, Node.js, Python 함수 코드 작성
2. **Build & Pack**: OCI(Open Container Initiative) 표준 컨테이너 빌드
3. **Container Registry**: 컨테이너 레지스트리에 푸시
4. **Deploy**: Kubernetes, PM2, Systemd 등을 통한 배포

## 8. 로드맵 및 향후 계획

### 8.1 2025-2026 로드맵

![로드맵 Gantt](../assets/images/roadmap-gantt.png)

[Download PNG](https://raw.githubusercontent.com/handstack77/handstack/master/assets/images/roadmap-gantt.png)

**2025년 계획:**
- **Polyglot Runtime 확장** (1월~6월): 추가 런타임 언어 지원
- **Contract 버저닝/테스트** (2월~8월): 계약 버전 관리 체계 고도화
- **Observability 통합** (3월~9월): OpenTelemetry 완전 통합
- **Security/Supply Chain** (4월~12월): 공급망 보안 강화

**2026년 계획:**
- **WASM/Edge 런타임** (1월~6월): WebAssembly 및 엣지 컴퓨팅 지원
- **온디바이스 AI** (3월~9월): 클라이언트 측 AI 기능 통합
- **멀티 테넌시 강화** (4월~12월): 대규모 멀티 테넌트 환경 지원

## 9. 결론

HandStack 2025는 모듈러 아키텍처, 멀티 런타임 지원, 표준화된 데이터 교환을 통해 현대적인 웹 애플리케이션 개발의 복잡성을 줄이고 생산성을 높이는 플랫폼입니다. 

**주요 성과:**
- 3개 런타임(C#, Node.js, Python) 통합 지원
- 5개 주요 RDBMS 연동
- XML 기반 동적 SQL 매퍼 구현
- 선언적 UI 바인딩 프레임워크 개발
- 완전 자동화된 CI/CD 파이프라인 구축

**기대 효과:**
- 개발 생산성 향상
- 유지보수 비용 절감
- 보안 및 품질 보증
- 확장 가능한 아키텍처

## 10. 참고 자료

### 10.1 이미지 자료
- **이미지 폴더**: `assets/images/`
- **Mermaid 원본**: `diagrams/*.mmd`
- **자동 생성**: GitHub Actions가 Mermaid 소스로부터 PNG를 자동 생성

### 10.2 다운로드 링크
모든 다이어그램은 PNG 형식으로 제공되며, 위의 각 섹션에 포함된 "Download PNG" 링크를 통해 직접 다운로드할 수 있습니다.

### 10.3 기술 문서
- 공식 저장소: https://github.com/handstack77/handstack
- 문서 위키: (추후 제공 예정)
- API 문서: (추후 제공 예정)

---

**작성일**: 2025년 12월  
**작성자**: HandStack 연구개발팀  
**버전**: 1.0
