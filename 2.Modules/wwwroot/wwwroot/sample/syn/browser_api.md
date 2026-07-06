# syn.$b API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$b` (원본: `context.$browser`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 248~571번째 줄) |
| 예제 페이지 | `/sample/syn/browser.html` |
| 의존 모듈 | `syn.$c`(cryptography, fingerPrint에서 sha256 사용), `syn.$l`(library, eventLog/copyToClipboard) |

## 속성
### `syn.$b.appName`
- 타입: `string`
- 설명: `navigator.appName` 값을 반환합니다.

### `syn.$b.appCodeName`
- 타입: `string`
- 설명: `navigator.appCodeName` 값을 반환합니다.

### `syn.$b.appVersion`
- 타입: `string`
- 설명: `navigator.appVersion` 값을 반환합니다.

### `syn.$b.cookieEnabled`
- 타입: `boolean`
- 설명: `navigator.cookieEnabled` 값을 반환합니다.

### `syn.$b.pdfViewerEnabled`
- 타입: `boolean`
- 설명: `navigator.pdfViewerEnabled` 값을 반환합니다.

### `syn.$b.platform`
- 타입: `string`
- 설명: `navigator.platform` 값을 반환합니다.

### `syn.$b.devicePlatform`
- 타입: `string`
- 설명: 실행 환경(`browser`, `android`, `ios`, `node`)을 반환합니다.

### `syn.$b.userAgent`
- 타입: `string`
- 설명: `navigator.userAgent` 값을 반환합니다.

### `syn.$b.effectiveType`
- 타입: `string | undefined`
- 설명: `navigator.effectiveType`(네트워크 연결 속도 등급) 값을 반환합니다. 대부분의 브라우저에서는 `navigator.connection.effectiveType`을 사용해야 하므로 `undefined`일 수 있습니다.

### `syn.$b.devicePixelRatio`
- 타입: `number`
- 설명: `window.devicePixelRatio` 값을 반환합니다.

### `syn.$b.isExtended`
- 타입: `boolean`
- 설명: `screen.isExtended` 값(외부 모니터 확장 여부)을 반환합니다. 미지원 환경에서는 `false` 입니다.

### `syn.$b.screenWidth`
- 타입: `number`
- 설명: `screen.width` 값을 반환합니다. 미지원 환경에서는 `0` 입니다.

### `syn.$b.screenHeight`
- 타입: `number`
- 설명: `screen.height` 값을 반환합니다. 미지원 환경에서는 `0` 입니다.

### `syn.$b.language`
- 타입: `string`
- 설명: `navigator.language` 또는 `navigator.browserLanguage`, `navigator.userLanguage` 값을 우선순위대로 반환하며 모두 없으면 `'en'`을 반환합니다.

### `syn.$b.isWebkit`
- 타입: `boolean`
- 설명: `navigator.userAgent`에 `AppleWebKit/` 포함 여부입니다.

### `syn.$b.isMac`
- 타입: `boolean`
- 설명: `navigator.appVersion`에 `Mac`/`Macintosh` 또는 `userAgent`에 `Macintosh` 포함 여부입니다.

### `syn.$b.isLinux`
- 타입: `boolean`
- 설명: `navigator.appVersion`에 `Linux` 또는 `X11` 포함 여부입니다.

### `syn.$b.isWindow`
- 타입: `boolean`
- 설명: `navigator.appVersion`에 `Win`/`Windows` 또는 `userAgent`에 `Windows` 포함 여부입니다.

### `syn.$b.isOpera`
- 타입: `boolean`
- 설명: `navigator.appName`이 `'Opera'`이거나 `userAgent`에 `OPR/` 포함 여부입니다.

### `syn.$b.isIE`
- 타입: `boolean`
- 설명: `document.documentMode` 존재 또는 `userAgent`에 `Trident`/`MSIE` 포함 여부입니다.

### `syn.$b.isChrome`
- 타입: `boolean`
- 설명: `window.chrome` 객체가 존재하고 `userAgent`에 `Edg/`가 포함되지 않은 경우 `true` 입니다.

### `syn.$b.isEdge`
- 타입: `boolean`
- 설명: `window.chrome` 객체가 존재하고 `userAgent`에 `Edg/`가 포함된 경우 `true` 입니다.

### `syn.$b.isFF`
- 타입: `boolean`
- 설명: `window.InstallTrigger` 존재 또는 `userAgent`에 `Firefox` 포함 여부입니다.

### `syn.$b.isSafari`
- 타입: `boolean`
- 설명: Safari 전용 객체/속성 존재 여부로 Safari를 판별합니다.

## 메서드
### `syn.$b.getSystemFonts(fontListToCheck = [])`
- 설명: 지정한 폰트 목록(생략 시 기본 내장 폰트 목록)이 현재 브라우저에서 실제로 사용 가능한지 canvas 텍스트 폭 비교 방식으로 검사합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | fontListToCheck | `string[]` | N | 검사할 폰트 이름 목록. 생략 시 내장 기본 폰트 목록(한글 폰트 포함)을 사용합니다. |
- 반환값: `string[]` — 사용 가능한 폰트 이름의 정렬된 목록.
- 예시
  ```js
  const fonts = syn.$b.getSystemFonts();
  ```

### `syn.$b.getCanvas2dRender()`
- 설명: canvas 2d 컨텍스트로 텍스트/그라디언트/도형을 그린 뒤 dataURL을 생성합니다. 브라우저별 렌더링 차이를 이용한 핑거프린팅에 사용됩니다.
- 매개변수: 없음
- 반환값: `string | null` — canvas dataURL 문자열, `document`가 없으면 `null`.
- 예시
  ```js
  const dataUrl = syn.$b.getCanvas2dRender();
  ```

### `syn.$b.getWebglRender()`
- 설명: WebGL 컨텍스트로 삼각형을 렌더링한 뒤 dataURL을 생성합니다. WebGL 미지원 환경에서는 `null`을 반환합니다.
- 매개변수: 없음
- 반환값: `string | null` — canvas dataURL 문자열 또는 `null`.
- 예시
  ```js
  const dataUrl = syn.$b.getWebglRender();
  ```

### `syn.$b.getPlugins()`
- 설명: `navigator.plugins`에 등록된 플러그인 이름과 파일명을 문자열 배열로 반환합니다.
- 매개변수: 없음
- 반환값: `string[]` — `"이름: 파일명"` 형식의 배열.
- 예시
  ```js
  const plugins = syn.$b.getPlugins();
  ```

### `syn.$b.fingerPrint(userID, clientIP)`
- 설명: 브라우저 환경 정보(플러그인, 화면 크기, 폰트, userAgent 등)를 조합하여 SHA-256 해시 기반 고유 식별 문자열을 생성합니다. 내부적으로 `syn.$c.sha256`을 사용합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | userID | `string` | N | 식별값 계산에 포함할 사용자 ID. |
  | clientIP | `string` | N | 식별값 계산에 포함할 클라이언트 IP. |
- 반환값: `Promise<string>` — `해시|원본JSON|날짜형식` 형태의 문자열.
- 예시
  ```js
  const fingerprint = await syn.$b.fingerPrint('user01', '127.0.0.1');
  ```

### `syn.$b.windowWidth()`
- 설명: `window.innerWidth`, `document.documentElement.clientWidth`, `document.body.offsetWidth` 순으로 값을 조회합니다.
- 매개변수: 없음
- 반환값: `number`
- 예시
  ```js
  const width = syn.$b.windowWidth();
  ```

### `syn.$b.windowHeight()`
- 설명: `window.innerHeight`, `document.documentElement.clientHeight`, `document.body.clientHeight` 순으로 값을 조회합니다.
- 매개변수: 없음
- 반환값: `number`
- 예시
  ```js
  const height = syn.$b.windowHeight();
  ```

### `syn.$b.getIpAddress()`
- 설명: `https://api.ipify.org`, 이후 `syn.Config.FindClientIPServer`(기본 `/checkip`) 순서로 요청하여 브라우저의 공인 IP를 조회합니다. 모두 실패하면 `'127.0.0.1'`을 반환합니다.
- 매개변수: 없음
- 반환값: `Promise<string>` — IP 주소 문자열.
- 예시
  ```js
  const ip = await syn.$b.getIpAddress();
  ```

### `syn.$b.canShare(data)`
- 설명: Web Share API(`navigator.share`) 사용 가능 여부와, `data`가 있을 경우 `navigator.canShare(data)` 결과를 함께 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | data | `ShareData` | N | 공유할 데이터(`title`, `text`, `url`, `files` 등). |
- 반환값: `boolean`
- 예시
  ```js
  const canShare = syn.$b.canShare({ title: 'HandStack' });
  ```

### `syn.$b.share(data)`
- 설명: Web Share API로 `data`를 공유합니다. 미지원 환경에서는 `data.url` 또는 `data.text`를 클립보드에 복사한 뒤 예외를 던집니다. 사용자가 공유를 취소한 경우(`AbortError`)에도 예외가 전파됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | data | `ShareData` | Y | 공유할 데이터(`title`, `text`, `url`, `files` 등). |
- 반환값: `Promise<void>`
- 예시
  ```js
  const shareData = {
      title: 'HandStack',
      text: 'HandStack의 목표는 개발자가 좋아하고 기업이 신뢰하는 비즈니스 앱 시스템을 제공하는 것입니다.',
      url: 'https://handstack.kr'
  };
  await syn.$b.share(shareData);
  ```

### `syn.$b.getPerformanceEntries(options = {})`
- 설명: `window.performance`의 항목을 `type`/`name` 조건으로 조회합니다. Performance Timeline API 미지원 시 빈 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | options.type | `string` | N | `'navigation'`, `'resource'`, `'mark'`, `'measure'` 등 조회할 항목 타입. |
  | options.name | `string` | N | 조회할 항목 이름. |
- 반환값: `PerformanceEntry[]`
- 예시
  ```js
  const navigationEntries = syn.$b.getPerformanceEntries({ type: 'navigation' });
  ```

### `syn.$b.markPerformance(markName)`
- 설명: `performance.mark(markName)`을 호출하여 성능 측정 지점을 생성합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | markName | `string` | Y | 생성할 mark의 이름. |
- 반환값: `this` — 메서드 체이닝을 위해 `$browser` 자기 자신을 반환합니다.
- 예시
  ```js
  syn.$b.markPerformance('start-data-processing');
  ```

### `syn.$b.measurePerformance(measureName, startMark, endMark)`
- 설명: `startMark`와 `endMark` 사이의 구간을 측정(`performance.measure`)하고, 생성된 measure 항목 중 가장 마지막 항목을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | measureName | `string` | Y | 생성할 measure의 이름. |
  | startMark | `string` | N | 시작 mark 이름. |
  | endMark | `string` | N | 종료 mark 이름. |
- 반환값: `PerformanceMeasure | null` — 측정 실패 시 `null`.
- 예시
  ```js
  syn.$b.markPerformance('start');
  syn.$b.markPerformance('end');
  const entry = syn.$b.measurePerformance('duration', 'start', 'end');
  console.log(entry.duration);
  ```

### `syn.$b.isMobile()`
- 설명: `navigator.userAgentData.mobile` 또는 `navigator.userAgent`의 모바일 기기 패턴(Android, iPhone, iPad 등)으로 모바일 여부를 판별합니다.
- 매개변수: 없음
- 반환값: `boolean`
- 예시
  ```js
  if (syn.$b.isMobile()) {
      console.log('모바일 기기입니다');
  }
  ```
