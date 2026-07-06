# 다국어(i18n) 리소스 사용법 (syn.$res)

## 개요
`syn.$res`(원본: `context.$resource`)는 화면에 표시되는 텍스트를 로케일별 번역 문자열로 치환하는 다국어(i18n) 기능을 제공합니다. HTML 엘리먼트에 `syn-i18n` 속성으로 번역 키를 지정하면, 페이지 로드 시 자동으로 스캔되어 번역 대상 목록(`translateControls`)에 등록되고, `translations` 저장소에 등록된 값으로 화면에 반영할 수 있습니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$res`(별칭: `$resource`)로 즉시 사용할 수 있습니다. `[syn-i18n]` 속성이 있는 엘리먼트는 페이지 로드가 완료된 시점(`syn.$w.isPageLoad`)에 자동으로 스캔되어 `translateControls`에 등록됩니다.

## 빠른 시작
```html
<div id="greetingText" syn-i18n="greeting">Hello</div>
```
```js
syn.$res.add('greeting', '안녕하세요!');
syn.$res.translatePage();
// greetingText의 textContent가 '안녕하세요!'로 바뀝니다.
```

## 주요 시나리오
### syn-i18n 속성으로 번역 대상 지정
`syn-i18n` 값이 단순 문자열이면 그 값이 번역 키(key)가 되고 bindSource는 기본값 `'content'`(textContent)로 처리됩니다. 객체 리터럴 문자열(`{key: '...', options: {...}}`) 형태로 지정하면 `options.bindSource`로 `text`/`content`/`html`/`url`/`placeholder`/`control`/`value` 중 하나를 지정할 수 있습니다.
```html
<div syn-i18n="greeting">Hello</div>
<input syn-i18n="{key: 'placeholderDemo', options: { bindSource: 'placeholder' }}" />
```

### 번역 데이터 등록/삭제
`add(id, val)`로 번역 키-값을 `translations` 저장소에 등록하고, `remove(id)`로 제거합니다.
```js
syn.$res.add('greeting', '안녕하세요, HandStack!');
syn.$res.remove('greeting');
```

### 화면 전체/개별 요소 번역 반영
`translatePage()`는 등록된 모든 `[syn-i18n]` 요소를 현재 `translations` 값으로 갱신하고, `translateElement(el, options)`는 지정한 엘리먼트 하나만 갱신합니다. 내부적으로 `getControl(el)`로 컨트롤 설명 객체를 찾아 `translateControl(control, options)`을 호출하며, 실제 반영될 텍스트 계산은 `translateText(control, options)`가 담당합니다.
```js
syn.$res.translatePage();
syn.$res.translateElement('greetingText');
```

### 플레이스홀더 치환
`interpolate(message, interpolations)`는 `#{key}` 형태의 플레이스홀더가 포함된 문자열에서 `interpolations` 객체의 값으로 치환하는 순수 문자열 함수입니다. 화면 요소와 무관하게 단독으로 사용할 수 있습니다.
```js
const text = syn.$res.interpolate('환영합니다, #{name}님!', { name: '홍길동' });
```

### bindSource와 실제 DOM 속성 매핑
`getBindSource(control)`은 `control.bindSource`(text/content/html/url/placeholder/control/value) 값을 실제 DOM 속성 이름(innerText/textContent/innerHTML/src/placeholder/controlText/value)으로 변환합니다.

## 실전 예제 페이지
`/sample/syn/resources.html` 예제에서 다음 항목을 실습할 수 있습니다.
- `syn-i18n` 속성이 지정된 content 바인딩 요소(`demo_greeting`), placeholder 바인딩 요소(`demo_placeholder`)
- add(), remove(), interpolate() — 번역 데이터 등록/삭제/치환
- getControl(), translatePage(), translateElement(), translateControl(), translateText(), getBindSource() — 컨트롤 조회와 화면 반영

## 주의 사항
- `translateText(control, options)`는 번역 문자열에 `#{key}` 형태의 플레이스홀더가 포함되어 있으면(정규식 매치 시) 무조건 `syn.$w.getSSOInfo()`를 호출합니다. 이 함수는 `syn.domain.js`(별도 모듈)에서 정의되며, `syn.js`만 로드하는 환경(이 샘플 포함)에서는 정의되어 있지 않아 `TypeError`가 발생할 수 있습니다. 플레이스홀더가 포함된 번역을 `translatePage()`/`translateElement()`/`translateControl()` 경로로 반영해야 한다면 `syn.domain.js`가 로드되어 있는지 먼저 확인하십시오. 화면 요소와 무관하게 단순 문자열만 치환하려면 `interpolate()`를 직접 사용하십시오(이 경로는 `getSSOInfo()`를 호출하지 않아 안전합니다).
- `setLocale(localeID)`(비공개 목록 외 참고 메서드)는 `syn.Config.LocaleAssetUrl` 또는 `SharedAssetUrl + 'language/'` 경로에서 `{localeID}.json` 파일을 실제로 fetch합니다. 이 샘플 트리에는 해당 로케일 파일이 없으므로 실패하지만, 내부적으로 오류를 잡아(catch) `Warning` 로그만 남기고 페이지가 깨지지는 않습니다.
- `[syn-i18n]` 스캔은 페이지 로드 완료(`syn.$w.isPageLoad`) 이후 비동기로 수행되므로, 페이지 진입 직후 바로 `getControl()`을 호출하면 아직 등록되지 않았을 수 있습니다.

## 관련 모듈
- API 상세: [`resources_api.md`](./resources_api.md)
