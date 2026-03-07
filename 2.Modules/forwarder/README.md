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

## Playwright Chromium 수동 설치
`forwarder`는 Playwright Chromium 실행 파일이 없으면 자동 설치를 시도합니다. 다만 서버의 외부망 차단, 프록시 정책, 파일 권한 문제 때문에 자동 설치가 실패할 수 있으므로 수동 설치 절차를 함께 운영하는 것이 안전합니다.

### 수동 설치가 필요한 증상
- 로그에 `Executable doesn't exist ... chrome-headless-shell.exe`가 출력됩니다.
- `ForwardProxyService/EnsureBrowserAsync` 또는 `ForwardProxyService/LaunchChromiumAsync`에서 초기화 실패가 발생합니다.
- `GET /forwarder/api/proxy/pipe?requestKey=...` 요청이 브라우저 초기화 오류로 실패합니다.

### 설치 전에 확인할 것
1. `playwright.ps1`, `Microsoft.Playwright.dll`, `.playwright` 폴더가 같은 디렉터리에 있어야 합니다.
2. 위 파일이 없다면 먼저 `.\build.ps1`로 `forwarder` 모듈을 빌드합니다.
3. 명령은 가능하면 **실제로 호스트가 로드하는 forwarder 모듈 폴더**에서 실행합니다.

### 실행 위치
다음 두 위치 중 하나에서 실행하면 됩니다.

개발 출력 폴더:
```powershell
Set-Location .\bin\Debug\net10.0
```

호스트 동기화 폴더 권장:
```powershell
Set-Location ..\..\build\handstack\modules\forwarder
```

`HANDSTACK_HOME` 환경 변수를 이미 사용 중이면 아래처럼 이동해도 됩니다.
```powershell
Set-Location "$env:HANDSTACK_HOME\modules\forwarder"
```

### 기본 수동 설치 명령
아래 명령이 `forwarder`에서 사용하는 Playwright Chromium 계열 브라우저를 설치합니다.

```powershell
pwsh .\playwright.ps1 install chromium
```

Windows에서는 이 명령으로 다음 구성요소가 함께 설치됩니다.
- Chromium
- Chromium Headless Shell
- FFmpeg
- `winldd`

### 설치 결과 확인
설치 후 현재 Playwright 버전 기준으로 어떤 브라우저가 등록되었는지 확인합니다.

```powershell
pwsh .\playwright.ps1 install --list
```

그 다음, 방금 실패했던 `forwarder` 프록시 요청을 다시 호출해 브라우저 초기화 오류가 사라졌는지 확인합니다.

### 재설치가 필요한 경우
브라우저 캐시가 깨졌거나 Playwright 패키지 버전이 바뀐 뒤에도 같은 오류가 계속되면 강제 재설치를 수행합니다.

```powershell
pwsh .\playwright.ps1 install --force chromium
```

### 운영상 주의사항
- 최초 설치는 브라우저 다운로드가 포함되므로 시간이 다소 걸릴 수 있습니다.
- 실행 계정 기준 사용자 프로필 아래 `ms-playwright` 캐시에 브라우저가 저장됩니다.
- 서버에서 외부 다운로드가 막혀 있으면 수동 설치도 실패할 수 있으므로 Playwright 다운로드 도메인 접근 정책을 먼저 확인해야 합니다.

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
