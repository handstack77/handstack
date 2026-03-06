# forwarder 모듈

## 개요
`forwarder`는 Playwright 기반 세션 유지형 포워드 프록시 모듈입니다. 사용자별 브라우저 컨텍스트를 재사용해 쿠키, 로컬 스토리지, IndexedDB를 유지한 채 외부 사이트 요청을 대신 수행합니다.

## 책임 범위
- 요청 키(`requestKey`) 기반 화이트리스트 프록시를 제공합니다.
- 브라우저형/프로그램형 요청을 분리해 세션 지속 전략을 다르게 적용합니다.
- 세션 스토리지를 사용자별 SQLite 파일로 보존합니다.
- HTML 응답에 `<base>` 태그를 주입해 상대 경로 리소스가 원본 기준으로 동작하게 만듭니다.
- 상위 프록시와 HTTPS 예외, 타임아웃, 리다이렉트 정책을 한곳에서 제어합니다.

## 주요 진입점
- `GET /forwarder/api/proxy/get-client-ip`
- `* /forwarder/api/proxy/pipe?requestKey=...`
- `GET /forwarder/api/forward-proxy-lab/*`
- 주요 구현 클래스
  - `ProxyController`
  - `ForwardProxyService`
  - `SQLiteForwardProxySessionStore`
  - `ForwardProxyLabController`

## 주요 디렉터리
- `Areas/forwarder/Controllers/ProxyController.cs`: 프록시 엔드포인트
- `Areas/forwarder/Controllers/ForwardProxyLabController.cs`: 실험용 대상 페이지와 응답
- `Services/ForwardProxyService.cs`: Playwright 실행과 세션 재사용 핵심
- `Services/SQLiteForwardProxySessionStore.cs`: 사용자 세션 저장소
- `Models`, `Entity`: 요청/응답 및 설정 모델

## 계약 및 데이터 자산
- 직접 사용하는 거래 계약이나 SQL 계약은 없습니다.
- 세션 상태는 `SessionStorageBasePath` 아래 SQLite 파일로 저장됩니다.
- `ForwardUrls` 설정이 사실상 이 모듈의 실행 계약 역할을 합니다.

## 설정 포인트
- `ForwardUrls`: `requestKey -> targetUrl` 화이트리스트
- `UseProxy`, `ProxyServer`, `ProxyUsername`, `ProxyPassword`, `ProxyBypass`: 상위 프록시 체인 설정
- `IgnoreHTTPSErrors`: 테스트 환경 TLS 예외 허용 여부
- `RequestTimeoutMS`, `MaxRedirects`, `BrowserIdleTimeoutSecond`: 리소스/응답 제어
- `SessionStorageBasePath`: 사용자 세션 저장소 위치

## 실행 흐름
1. 클라이언트는 BearerToken과 `requestKey`를 전달합니다.
2. `ProxyController`가 BearerToken을 검증하고 `ForwardUrls`에서 대상 URL을 찾습니다.
3. `ForwardProxyService`가 요청 유형에 따라 브라우저 컨텍스트를 재사용하거나 새로 생성합니다.
4. 응답 후 스토리지 상태를 저장해 다음 요청에서 같은 로그인 세션을 이어받습니다.

## 운영 메모
- `ForwardUrls`에 등록된 키만 프록시할 수 있습니다.
- `SessionStorageBasePath` 아래에 사용자별 SQLite 파일이 생성되므로 보관 주기와 디스크 정리 정책이 필요합니다.
- `BrowserIdleTimeoutSecond`를 너무 길게 두면 컨텍스트 재사용률은 좋아지지만 메모리 점유가 늘어납니다.

### 기본 샘플 키
- `sample-api`
- `lab-html`
- `lab-json`
- `lab-echo`
- `lab-redirect`
- `lab-cookie-set`
- `lab-cookie-read`
- `lab-slow`

## 빌드 및 작업 명령
```powershell
.\build.ps1
```
