# 브라우저 정보 사용법 (syn.$b)

## 개요
`syn.$b`는 현재 실행 중인 웹 브라우저/디바이스의 환경 정보(브랜드, 플랫폼, 화면 크기, 네트워크 상태 등)를 조회하고, 브라우저 고유값 생성, 공유(Web Share API), 성능 측정 등의 기능을 제공합니다. 브라우저 분기 처리, 반응형 레이아웃 계산, 사용자 식별(fingerprint), 성능 모니터링에 주로 사용됩니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$b`(별칭: `$browser`)로 즉시 사용할 수 있습니다.

## 빠른 시작
```js
if (syn.$b.isMobile()) {
    console.log('모바일 환경입니다');
}

console.log(syn.$b.windowWidth(), syn.$b.windowHeight());
```

## 주요 시나리오
### 브라우저/플랫폼 분기 처리
`isChrome`, `isEdge`, `isFF`, `isSafari`, `isIE`, `isMac`, `isWindow`, `isLinux` 등의 속성으로 실행 환경을 판별합니다.
```js
if (syn.$b.isIE) {
    alert('Internet Explorer는 지원하지 않습니다.');
}
```

### 브라우저 고유 식별값 생성
`fingerPrint(userID, clientIP)`는 폰트/플러그인/화면 정보 등을 조합해 해시된 고유 ID를 생성합니다.
```js
const uniqueID = await syn.$b.fingerPrint('user01', '127.0.0.1');
```

### 콘텐츠 공유
`canShare(data)`로 Web Share API 지원 여부를 확인한 뒤 `share(data)`를 호출합니다. 미지원 환경에서는 자동으로 클립보드 복사로 대체됩니다.
```js
const shareData = { title: 'HandStack', text: '설명', url: 'https://handstack.kr' };
if (syn.$b.canShare(shareData)) {
    await syn.$b.share(shareData);
}
```

### 성능 측정
`markPerformance`, `measurePerformance`, `getPerformanceEntries`로 특정 구간의 처리 시간을 측정합니다.
```js
syn.$b.markPerformance('start-data-processing');
// ... 데이터 처리 로직 ...
syn.$b.markPerformance('end-data-processing');
syn.$b.measurePerformance('data-processing-time', 'start-data-processing', 'end-data-processing');
const [measureEntry] = syn.$b.getPerformanceEntries({ type: 'measure', name: 'data-processing-time' });
if (measureEntry) {
    console.log(`데이터 처리 시간: ${measureEntry.duration.toFixed(2)}ms`);
}
```

## 실전 예제 페이지
`/sample/syn/browser.html` 예제에서 다음 항목을 실습할 수 있습니다.
- appName, appCodeName, appVersion, cookieEnabled, pdfViewerEnabled, platform, devicePlatform, userAgent, effectiveType, devicePixelRatio, isExtended, screenWidth, screenHeight, language, isWebkit, isMac, isLinux, isWindow, isOpera, isIE, isChrome, isEdge, isFF, isSafari 속성 확인
- getSystemFonts(), getCanvas2dRender(), getWebglRender(), getPlugins(), fingerPrint(), windowWidth(), windowHeight(), getIpAddress(), canShare(), share(), getPerformanceEntries(), markPerformance(), measurePerformance(), isMobile() 메서드 실습

## 주의 사항
- `getIpAddress()`, `share()`는 외부 서버/브라우저 권한에 의존하므로 네트워크 차단 환경이나 HTTPS가 아닌 환경에서는 실패할 수 있습니다.
- `getWebglRender()`는 WebGL을 지원하지 않는 브라우저/설정에서는 `null`을 반환합니다.
- `fingerPrint()`는 내부적으로 `syn.$c.sha256`(cryptography 모듈)과 `syn.$l`(library 모듈)에 의존합니다.
- `isMobile`은 실제로는 함수(메서드)이므로 `syn.$b.isMobile()`처럼 호출해야 하며, 값 자체를 참조하면 함수 객체가 반환됩니다.

## 관련 모듈
- API 상세: [`browser_api.md`](./browser_api.md)
