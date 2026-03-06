# repository 모듈

## 개요
`repository`는 파일 저장소 추상화 모듈입니다. 파일 업로드/다운로드뿐 아니라 메타데이터 저장, 의존 ID 변경, 파일명 변경, 가상 경로 다운로드, 썸네일 생성까지 담당합니다.

## 책임 범위
- 저장소 선언 JSON을 읽어 업로드/다운로드 정책을 적용합니다.
- 로컬 파일 시스템과 클라우드 스토리지를 공통 인터페이스로 노출합니다.
- 파일 메타데이터를 거래 계약이나 모듈 내부 SQL 실행으로 관리합니다.
- MediatR 요청으로 들어온 저장소 작업을 처리합니다.
- 저장소 계약 파일 변경을 감시해 런타임 캐시를 갱신합니다.

## 주요 진입점
- `GET /repository/api/storage/refresh`
- `GET /repository/api/storage/action-handler`
- `GET /repository/api/storage/get-repository`
- `POST /repository/api/storage/upload-file`
- `POST /repository/api/storage/upload-files`
- `POST /repository/api/storage/download-file`
- `GET /repository/api/storage/http-download-file`
- `GET /repository/api/storage/virtual-download-file`
- `GET /repository/api/storage/virtual-delete-file`
- `POST /repository/api/storage/remove-item`
- `POST /repository/api/storage/remove-items`
- 주요 구현 클래스
  - `StorageController`
  - `StorageProviderFactory`
  - `RepositoryRequestHandler`
  - `StorageRefreshRequestHandler`

## 주요 디렉터리
- `Areas/repository/Controllers/StorageController.cs`: 업로드/다운로드/삭제/조회 API
- `Extensions`: 저장소 공급자, 저장소 경로 계산, 모듈 API 클라이언트
- `Services/StorageProviderFactory.cs`: 저장소 구현 선택
- `Contracts/repository`: 저장소 선언 JSON
- `Contracts/dbclient`, `Contracts/transact`: 메타데이터 저장/조회용 보조 계약

## 계약 및 데이터 자산
- `Contracts/repository/*.json`이 저장소 선언 계약입니다.
- `DatabaseContractPath`로 연결된 `dbclient` 계약이 파일 메타데이터 테이블을 관리합니다.
- `Contracts/transact`는 저장소 메타데이터 조작을 일반 거래처럼 호출할 수 있게 해 줍니다.
- 지원 저장소 타입은 `FileSystem`, `AzureBlob`, `AWS_S3`, `GoogleCloudStorage`입니다.

## 설정 포인트
- `FileServerUrl`: 외부 다운로드 기본 URL
- `ContractBasePath`: 저장소 선언 계약 루트
- `DatabaseContractPath`: 메타데이터 SQL 계약 루트
- `XFrameOptions`, `ContentSecurityPolicy`: 프레임 임베드/보안 정책
- `ModuleLogFilePath`: 저장소 모듈 로그 위치

## 실행 흐름
1. 클라이언트는 `repositoryID`와 `dependencyID`를 기준으로 업로드/다운로드를 요청합니다.
2. `StorageController`는 저장소 정의 JSON에서 정책과 저장소 타입을 찾습니다.
3. `StorageProviderFactory`가 실제 저장소 구현체를 선택해 바이너리를 저장합니다.
4. 파일 메타데이터는 `dbclient`/`transact` 계약 또는 모듈 내부 SQL 실행으로 기록됩니다.

## 운영 메모
- `IsContractFileWatching=true`이면 저장소 정의 JSON 수정이 런타임에 반영됩니다.
- 로컬 파일 저장과 클라우드 저장을 같은 API 표면으로 노출할 수 있습니다.
- SkiaSharp를 사용하므로 이미지 처리 네이티브 라이브러리 배포가 필요합니다.

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
