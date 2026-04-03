# updater CLI

`updater`는 HandStack 시작 시 현재 설치 버전과 서버 manifest를 비교하고, 필요하면 현재 프로세스에서 직접 패키지를 적용한 뒤 `ack`를 올리는 진입점입니다.

`ack` 자체에는 업데이트 전용 HTTP 엔드포인트를 두지 않고, 업데이트 책임은 updater에만 둡니다.

## 역할

- `app/version.json` 확인 및 없으면 자동 생성
- `/release/manifest.json` 조회
- downgrade 방지
- 현재 버전보다 높은 패키지를 순차 적용 대상으로 계산
- 업데이트 필요 시 패키지 다운로드/검증/적용/마이그레이션 직접 수행
- 업데이트 불필요 시 `ack` 실행

## 실행 예시

```powershell
dotnet run --project 4.Tool/CLI/updater/updater.csproj -- `
  --manifest-url=http://localhost:8520/release/manifest.json `
  --error-url=http://localhost:8520/deploy-error
```

## 옵션

- `--manifest-url`: 공개 manifest 주소. 미지정 시 `appsettings.json`의 `HandstackUpdateManifestUrl`
- `--error-url`: 실패 보고 주소. 미지정 시 `appsettings.json`의 `HandstackUpdateErrorUrl`
- `--install-root`: HandStack 설치 루트. 기본값은 `tools/updater` 기준 상위 2단계
- `--ack-path`: ack 실행 파일 경로. 기본값은 `app/ack(.exe)`
- `--health-url`: 업데이트 컨텍스트에 기록할 헬스체크 주소. 기본값은 `http://localhost:<port>/checkip`
- `--initial-version`: `version.json`이 없을 때 기록할 기본 버전. 기본값 `1.0.0`
- `--ack-process-id`: Mandatory 업데이트 시 강제 종료할 ack 프로세스 ID

## 설정 파일

`updater/appsettings.json`

```json
{
  "HandstackUpdateManifestUrl": "http://localhost:8520/release/manifest.json",
  "HandstackUpdateErrorUrl": "http://localhost:8520/deploy-error"
}
```

## 실행 원칙

- 사용자는 `ack` 대신 `updater`를 진입점으로 실행합니다.
- 업데이트가 필요하면 updater가 잠금/검증/적용을 직접 수행합니다.
- 업데이트 적용이 성공하면 updater가 최종적으로 `ack`를 올립니다.
- 업데이트 적용이 실패하면 `ack`를 기동하지 않고 종료합니다.
