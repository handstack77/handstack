# forwarder 모듈

## 개요
`forwarder`는 `requestKey` 기반 화이트리스트 포워드 프록시 모듈입니다. 등록된 대상 URL로 서버 사이드 HTTP 요청을 전달하고, 상위 프록시, HTTPS 예외, 타임아웃, 리다이렉트 정책을 모듈 설정에서 제어합니다.

## 책임 범위
- 요청 키(`requestKey`) 기반 화이트리스트 프록시를 제공합니다.
- 허용된 대상 URL에 대해서만 HTTP 요청을 전달합니다.
- HTML 응답에 `<base>` 태그를 주입해 상대 경로 리소스가 원본 기준으로 동작하게 만듭니다.
- 상위 프록시와 HTTPS 예외, 타임아웃, 리다이렉트 정책을 한곳에서 제어합니다.

## 주요 진입점
- `GET /forwarder/api/proxy/get-client-ip`
- `* /forwarder/api/proxy/pipe?requestKey=...`
- `GET /forwarder/api/forward-proxy-lab/*`
- 주요 구현 클래스
  - `ProxyController`
  - `ForwardProxyService`
  - `ForwardProxyLabController`

## 주요 디렉터리
- `Areas/forwarder/Controllers/ProxyController.cs`: 프록시 엔드포인트
- `Areas/forwarder/Controllers/ForwardProxyLabController.cs`: 실험용 대상 페이지와 응답
- `Services/ForwardProxyService.cs`: `HttpClient` 기반 프록시 실행 핵심
- `Models`, `Entity`: 요청/응답 및 설정 모델

## 계약 및 데이터 자산
- 직접 사용하는 거래 계약이나 SQL 계약은 없습니다.
- `ForwardUrls` 설정이 이 모듈의 실행 계약 역할을 합니다.

## 설정 포인트
- `ForwardUrls`: `requestKey -> targetUrl`을 담는 단일 JSON 객체 화이트리스트
- `AuthorizationKey`: API 호출 인증 키입니다. 비워두면 `<SystemID><실행 환경><호스트명>`을 기본값으로 사용합니다.
- `UseProxy`, `ProxyServer`, `ProxyUsername`, `ProxyPassword`, `ProxyBypass`: 상위 프록시 체인 설정
- `IgnoreHTTPSErrors`: 테스트 환경 TLS 예외 허용 여부
- `RequestTimeoutMS`, `MaxRedirects`: 응답 시간과 리다이렉트 제어
- `AllowClientIP`: 호출 허용 IP 목록

## 실행 흐름
1. 클라이언트는 `requestKey`를 전달합니다. BearerToken은 선택 사항이며, 전달된 경우에만 검증해 로그에 남길 사용자 정보로 사용합니다(검증에 실패해도 요청 자체는 차단하지 않습니다).
2. `ProxyController`가 호출자 IP가 `AllowClientIP`에 해당하는지 확인한 뒤 `ForwardUrls`에서 `requestKey`에 해당하는 대상 URL을 찾습니다.
3. `ForwardProxyService`가 `HttpClient`로 대상 URL에 요청을 전달합니다.
4. HTML 응답이면 `ProxyController`가 `<base>` 태그를 주입한 뒤 응답을 반환합니다.

## 운영 메모
- `ForwardUrls`에 등록된 키만 프록시할 수 있으며, `AuthorizationKey`가 일치하거나 `AllowClientIP`에 허용된 요청만 프록시할 수 있습니다.
- BearerToken 검증 실패는 요청을 차단하지 않으며, `AllowClientIP`와 `requestKey` 화이트리스트가 실제 접근 통제 기준입니다.
- 브라우저 쿠키, localStorage, IndexedDB를 서버에서 저장하거나 복원하지 않습니다.
- `UseProxy`를 켠 경우 `ProxyServer`가 비어 있으면 모듈 초기화 중 오류가 발생합니다.
- `IgnoreHTTPSErrors`는 테스트 환경에서만 사용하고 운영에서는 대상 인증서 문제를 먼저 해결하는 것이 안전합니다.

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
- 저장소 공통 `build.ps1`/`build.bat`는 `forwarder`를 빌드 대상에서 제외합니다(`build.sh`는 포함). 별도로 빌드하려면 프로젝트를 직접 지정합니다.
```powershell
dotnet build 2.Modules\forwarder\forwarder.csproj
```
- 모듈 단위 게시는 `2.Modules\forwarder\publish.bat`를 사용합니다.
```cmd
2.Modules\forwarder\publish.bat win build Debug x64
```
