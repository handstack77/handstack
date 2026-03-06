# checkup 모듈

## 개요
`checkup`은 HandStack 운영 관리 모듈입니다. 관리자 계정 초기화, 테넌트 앱 생성/배포, 자산 파일 편집, 데이터베이스 백업/복원, JWT 기반 로그인 진입점을 제공하는 운영 콘솔 역할을 맡습니다.

## 책임 범위
- `module.json`과 테넌트 `settings.json`을 읽어 운영 설정과 `WithOrigin/WithReferer` 캐시를 초기화합니다.
- 관리자 계정 시드와 비밀번호 키 재발급을 수행합니다.
- 테넌트 앱 생성, 삭제, 패키지 업로드, 배포, 자산 파일 탐색/편집, DB 백업/복원을 처리합니다.
- checkup 전용 테스트 함수 실행 경로를 제공합니다.
- `repository.Events.RepositoryRequest`와 연결해 로고/프로필 같은 저장소 메타데이터를 함께 관리합니다.

## 주요 진입점
- `GET /checkup/api/managed/initialize-settings`
- `GET /checkup/api/managed/reset-administrator-key`
- `GET /checkup/api/account/login`
- `GET /checkup/api/account/sign-in`
- `GET/POST /checkup/api/tenant-app/*`
- `POST /checkup/api/function/execute`
- 주요 구현 클래스
  - `ModuleInitializer`
  - `ManagedController`
  - `AccountController`
  - `TenantAppController`
  - `FunctionController`

## 주요 디렉터리
- `Areas/checkup/Controllers`: 운영 API와 로그인/배포/자산 관리 진입점
- `Contracts/dbclient`, `Contracts/function`, `Contracts/repository`, `Contracts/transact`: checkup 자체 관리 기능 계약
- `Services`: `JwtManager`, `UserAccountService`
- `Settings`: 모듈 설정 샘플
- `wwwroot/checkup`: 운영 콘솔 화면, 모듈 설정 UI

## 계약 및 데이터 자산
- 내부적으로 `SYS.SYS010.*`, `SYS.USR010.*` 같은 계약을 사용해 관리자 계정과 기본 테이블을 제어합니다.
- `Contracts` 폴더가 `dbclient`, `function`, `repository`, `transact`로 나뉘어 있어 운영 기능도 일반 업무 앱과 같은 계약 체계로 관리됩니다.
- `featureTest.json`과 `featureMain.cs`는 운영 콘솔에서 기능 실행을 시험할 때 사용됩니다.

## 설정 포인트
- `ManagedAccessKey`: 외부 자동화/운영 API 보호 키
- `EncryptionAES256Key`: 로그인 링크 및 내부 암호화 키
- `ModuleConfigurationUrl`: 초기 설정 동기화 경로
- `BusinessServerUrl`: 내부 거래 서버
- `ConnectionString`: checkup 자체 SQLite 또는 암호화된 연결 문자열
- `ModuleBasePath`, `WWWRootBasePath`, `ModuleLogFilePath`: 운영 경로와 로그 위치

## 실행 흐름
1. `ModuleInitializer`가 `module.json`과 테넌트 `settings.json`을 읽어 메모리 캐시를 구성합니다.
2. `ManagedController.InitializeSettings`가 관리자 계정과 기본 테이블을 준비합니다.
3. 운영자가 `TenantAppController`를 통해 앱/패키지/자산/DB를 관리합니다.
4. 생성된 업무 앱은 이후 `wwwroot`, `transact`, `dbclient`, `function`, `repository` 모듈 조합으로 실제 서비스를 수행합니다.

## 운영 메모
- `ManagedAccessKey`, `AuthorizationKey`, `EncryptionAES256Key`는 외부 자동화와 관리자 링크 보안의 핵심 값입니다.
- `ConnectionString`은 암호화 문자열도 허용하며 `DecryptConnectionString`으로 복호화합니다.
- `TenantAppController`는 파일 시스템과 SQLite를 직접 다루므로 운영 계정 권한과 경로 격리가 중요합니다.
- 테넌트 CORS/Referer 캐시는 앱 생성/배포 후 다시 계산되므로 운영 중 `RefreshOriginApp`, `RefreshRefererApp` 호출 경로를 염두에 두는 편이 좋습니다.

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
