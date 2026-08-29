# wwwroot 모듈

## 개요
`wwwroot`는 정적 화면과 계약 파일을 서비스하는 모듈입니다. 업무 앱의 HTML/JS/CSS 자산을 서빙하고 계약 기반 화면 경로(`/view`)를 열어 주며, `shared_files.json` 카탈로그에 등록한 호스트 파일을 지정 URL로 제공하고 파일 동기화 API와 HTMX 샘플까지 포함합니다.

## 책임 범위
- 정적 화면과 공용 자산을 HTTP 경로로 노출합니다.
- 계약 기반 화면 경로와 실제 자산 경로를 분리해 서비스합니다.
- 공통 파일 카탈로그의 요청 경로를 호스트 파일에 연결해 기존 정적 파일 루트 밖의 파일을 서비스합니다.
- `dbclient`, `graphclient`, `transact`, `function`, `wwwroot` 계약 파일 동기화 API를 제공합니다.
- `syn.loader.*` 캐시 정책과 대소문자 무시 정적 파일 제공을 처리합니다.
- HTMX 샘플과 내부 거래 직접 호출 유틸리티를 제공합니다.

## 주요 진입점
- `POST /wwwroot/api/sync/upload`
- `GET /wwwroot/api/sync/refresh`
- `GET /wwwroot/api/htmx/*`
- `GET /wwwroot/api/index/*`
- `GET`/`POST /wwwroot/api/dev-account/sign-in`
- `GET /shared-files/manifest`
- 주요 구현 클래스
  - `ModuleInitializer`
  - `SharedFileServingMiddleware`
  - `SyncController`
  - `HtmxController`
  - `ModuleApiClient`

## 주요 디렉터리
- `Areas/wwwroot/Controllers`: 정적 파일 보조 API, 동기화 API, HTMX 샘플
- `Extensions/ModuleApiClient.cs`: 거래 직접 호출 래퍼
- `Extensions/SharedFileServingMiddleware.cs`: 카탈로그의 요청 경로와 호스트 파일을 연결하는 미들웨어
- `Entity/SharedFileCatalog.cs`: `shared_files.json`의 `items[].requestPath/hostFilePath` 스키마
- `wwwroot/js/syn.loader.js`: manifest를 조회해 공통 CSS/JS와 기타 텍스트 자산을 화면 초기화 과정에 합류시키는 브라우저 로더
- `Contracts/wwwroot`: 계약 기반 화면/자산 매핑
- `wwwroot`: 실제 정적 자산과 샘플 화면

## 계약 및 데이터 자산
- `ContractBasePath` 아래 계약 파일을 기본 `/view` 경로로 노출합니다.
- `WWWRootBasePath` 아래 실제 정적 파일을 그대로 서비스합니다.
- `SharedFileConfigPath`가 가리키는 JSON 카탈로그의 호스트 파일을 등록된 요청 경로로 서비스합니다.
- `SyncController`는 `dbclient`, `graphclient`, `transact`, `function`, `wwwroot` 모듈 계약만 동기화 대상으로 허용합니다.

## 설정 포인트
- `ContractRequestPath`: 계약 기반 정적 경로, 기본값 `view`
- `ContractBasePath`: 계약 파일 루트
- `WWWRootBasePath`: 실제 정적 파일 루트
- `SharedFileConfigPath`: 공통 파일 카탈로그 JSON 경로. 빈 값이면 기능을 사용하지 않습니다.
- `FileSyncTokens`: 파일 동기화 Basic 토큰 목록
- `ModuleLogFilePath`: 정적/동기화 모듈 로그 위치
- `CreateIDPolicy`: `GET`/`POST /wwwroot/api/index/create-id` GlobalID 발급 접근 정책
- `DevAutoSignIn`: GET 개발 자동 로그인에 사용할 고정 테스트 계정. POST 개발 로그인 요청은 이 값 대신 본문의 사용자 정보를 사용합니다.

### 공통 파일 서빙

`module.json`에서 카탈로그 파일을 지정합니다. 상대경로와 환경 변수는 ack 실행 기준 경로인 `GlobalConfiguration.EntryBasePath`에서 해석됩니다.

```json
"SharedFileConfigPath": "../config/shared_files.json"
```

카탈로그는 다음 형식입니다.

```json
{
  "items": [
    {
      "requestPath": "/assets/common.css",
      "hostFilePath": "../shared-files/common.css"
    },
    {
      "requestPath": "/assets/common.js",
      "hostFilePath": "../shared-files/common.js"
    },
    {
      "requestPath": "/assets/settings.json",
      "hostFilePath": "../shared-files/settings.json"
    },
    {
      "requestPath": "/assets/fragment.html",
      "hostFilePath": "../shared-files/fragment.html"
    }
  ]
}
```

- `requestPath`: `HttpContext.Request.Path`와 대소문자를 무시하고 정확히 비교합니다. `/`로 시작하는 경로를 사용하며 쿼리 문자열은 비교에 포함되지 않습니다.
- `hostFilePath`: 서빙할 파일의 절대경로 또는 ack 실행 기준 상대경로입니다. 카탈로그 파일이 있는 디렉터리가 기준이 아닙니다.
- `requestPath` 또는 `hostFilePath`가 비어 있는 항목은 적재하지 않습니다.
- 같은 `requestPath`가 여러 개면 카탈로그에서 먼저 읽은 항목을 사용합니다.
- 대상 파일이 없으면 응답을 직접 만들지 않고 다음 미들웨어로 요청을 전달합니다.
- 응답 `Content-Type`은 파일 확장자로 결정하며 알 수 없는 확장자는 `application/octet-stream`을 사용합니다.
- 카탈로그는 wwwroot 모듈 초기화 시 한 번 메모리에 적재하므로 변경 후 ack를 다시 시작해야 합니다.

`GET /shared-files/manifest`는 적재된 항목의 `requestPath`만 JSON 배열로 반환하고 `hostFilePath`는 노출하지 않습니다. `syn.loader.js`는 화면 시작 시 이 manifest를 `no-cache`로 조회하고 다음 규칙으로 처리합니다.

| 확장자 | 브라우저 처리 |
|---|---|
| `.css` | 기존 스타일 로드 목록에 추가 |
| `.js` | 기존 스크립트 로드 목록에 추가 |
| `.html`, `.htm` | `type="text/html"` 텍스트 자산으로 `<head>`에 추가 |
| `.json` | `type="application/json"` 텍스트 자산으로 `<head>`에 추가 |
| `.xml` | `type="application/xml"` 텍스트 자산으로 `<head>`에 추가 |
| `.md` | `type="text/markdown"` 텍스트 자산으로 `<head>`에 추가 |
| `.txt` | `type="text/plain"` 텍스트 자산으로 `<head>`에 추가 |
| `.csv` | `type="text/csv"` 텍스트 자산으로 `<head>`에 추가 |
| 그 외 | `type="text/plain"` 텍스트 자산으로 `<head>`에 추가 |

텍스트 자산 ID는 마지막 확장자를 제거한 파일명에서 만들며 영문·숫자·밑줄 이외의 문자를 `_`로 바꿉니다. 예를 들어 `settings.json`은 `shared_settings`, `fragment.html`은 `shared_fragment`가 됩니다.

```javascript
const settings = JSON.parse(document.getElementById('shared_settings').textContent);
const fragment = document.getElementById('shared_fragment').innerHTML;
```

CSS/JS 분기 비교는 대소문자를 구분하므로 파일 확장자는 소문자로 작성합니다. 서로 다른 경로라도 확장자를 제외한 파일명이 같으면 DOM ID가 중복될 수 있으므로 고유한 파일명을 사용합니다. manifest 또는 텍스트 파일 로딩 예외는 로더 로그에 남고 나머지 화면 초기화는 계속됩니다.

이 미들웨어와 manifest는 세션·인증 미들웨어보다 먼저 실행하며 자체 인증·권한 검사를 하지 않습니다. manifest가 요청 경로 목록도 공개하므로 카탈로그 쓰기 권한을 신뢰할 수 있는 운영 주체로 제한하고 비밀 키, 설정 파일, 개인정보 파일을 등록하지 마세요.

### CreateID 발급 정책

`module.json`의 `ModuleConfig.CreateIDPolicy`로 GlobalID 발급 API를 제한합니다.

```json
"CreateIDPolicy": {
  "Enabled": false,
  "AllowedScreens": [ "login", "logout" ],
  "AuthorizationKeys": [
    {
      "Key": "Strong@Passw0rd",
      "AllowedIPs": [ "127.0.0.1", "::1" ]
    }
  ]
}
```

- `Enabled`: `true`면 정책을 강제합니다. 기본값은 `false`입니다.
- `AllowedScreens`: 로그인·로그아웃처럼 인증 전에 발급이 필요한 화면 ID 목록입니다. 여기에 등록한 화면은 사용자·토큰 권한 검증 없이 발급할 수 있습니다.
- `AuthorizationKeys`: 서버 간 호출 키와 허용 원격 IP 목록입니다. 요청의 `AuthorizationKey` 헤더와 접속 IP가 모두 일치해야 합니다. `Key`는 현재 요구사항에 따라 원문으로 저장되므로 설정 파일의 접근 권한을 제한해야 합니다.

## 실행 흐름
1. `ModuleInitializer`가 `SharedFileConfigPath`의 카탈로그를 읽어 공통 파일 목록을 메모리에 적재합니다.
2. `SharedFileServingMiddleware`가 manifest를 제공하고 정확히 일치하는 요청 경로를 호스트 파일에서 먼저 서빙합니다.
3. 브라우저의 `syn.loader.js`가 manifest의 CSS/JS와 기타 텍스트 자산을 화면 로딩 과정에 합류시킵니다.
4. `ModuleInitializer`가 `ContractBasePath`와 `WWWRootBasePath`를 기준으로 정적 파일 미들웨어를 구성합니다.
5. 계약 자산은 `/{ContractRequestPath}`로, 실제 자산은 모듈 루트 경로로 노출됩니다.
6. `SyncController`는 Basic 토큰을 검증한 뒤 계약 파일을 저장하거나 대상 모듈에 refresh 요청을 전달합니다.
7. `syn.loader.*` 파일은 no-cache 정책으로 내려 앱 셸 변경이 바로 반영되도록 합니다.

## 운영 메모
- `FileSyncTokens`를 비워 두면 `SyncController`는 모든 동기화 요청을 거부합니다.
- `CreateIDPolicy.Enabled`를 `true`로 바꾸기 전에 실제 로그인·로그아웃 화면 ID와 서버 호출 IP·인증키를 환경에 맞게 교체합니다.
- `SharedFileConfigPath`가 비어 있으면 공통 파일 목록은 비어 있으며, 파일이 없거나 JSON을 읽을 수 없으면 경고 로그를 남기고 공통 파일 서빙을 건너뜁니다.
- manifest는 대상 파일의 존재 여부와 관계없이 적재된 요청 경로를 반환합니다. 대상 파일이 없으면 실제 파일 요청은 다음 미들웨어로 넘어갑니다.
- 공통 파일 카탈로그 항목 변경은 자동 재적재되지 않으므로 ack 재시작 절차에 포함합니다. 이미 등록된 대상 파일의 내용 변경은 다음 요청부터 반영됩니다.
- `ContractRequestPath`와 `WWWRootBasePath`는 충돌 없이 분리해야 합니다.
- 정적 파일 캐시 전략은 `syn.loader`만 예외 처리하고 나머지는 일반 캐시 정책을 따릅니다.
- 테넌트 앱의 `WithOrigin`, `WithReferer`는 `ModuleInitializer`가 메모리에 적재해 CORS 응답에 반영합니다.

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
