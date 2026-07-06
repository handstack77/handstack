# reflection ($object) 사용법

## 개요
`reflection` 페이지는 `$object`(전역 객체, `syn.$` 형태의 별도 alias 없음)가 제공하는 타입 확인/복제 등 리플렉션 관련 확장 함수를 보여주는 예제입니다. `$object`는 `syn.js` 내부에서 `$number`, `$string`과 같은 위치(약 4165~4385번째 줄)에 정의되어 있으며, `extension_object.html`과 완전히 동일한 모듈을 다루는 별도의(더 오래된) 데모 페이지입니다.

> 참고: 이 페이지는 `$w.initializeScript({ ... })` 형태의 레거시(구형) 스크립트 등록 방식을 의도적으로 그대로 유지합니다. `extension_object.html`, `template.html` 등 대부분의 최신 예제 페이지는 `let $x = { extends, hook, event, method }` 형태의 객체를 선언하는 새 방식을 사용하지만, HandStack은 두 방식을 모두 지원하며 `reflection.html`은 그 대안/구형 등록 관례를 보여주기 위한 목적으로 남겨둔 페이지입니다.

## 로드 방법
```html
<script src="/lib/highlight.js/highlight.min.js"></script>
<script src="/lib/showdown/showdown.min.js"></script>
<script src="/js/syn.loader.js"></script>
```
`syn.loader.js`가 페이지의 `moduleScript`(파일명 기준 `reflection`)를 읽어 `reflection.js`를 로드하고, 그 안의 `$w.initializeScript({...})` 호출로 이벤트 핸들러를 등록합니다.

## 빠른 시작
```javascript
$w.initializeScript({
    btnGetType_click() {
        syn.$l.get('txtGetType').value = $object.getType('txtGetType')
    },
    // ...
})
```
각 키는 `{id}_{이벤트명}` 규칙으로 대응되는 HTML 엘리먼트의 이벤트에 자동으로 바인딩됩니다.

## 주요 시나리오 / 사용 방법
- 타입 판별: `getType`, `isDefined`, `isNull`, `isArray`, `isDate`, `isString`, `isNumber`, `isFunction`, `isObject`, `isObjectEmpty`, `isBoolean`, `isEmpty`
- 객체 복제: `clone`

## 실전 예제 페이지
- `reflection.html` / `reflection.js` (본 페이지, 레거시 등록 방식)
- `extension_object.html` / `extension_object.js` (동일한 `$object` 모듈을 최신 등록 방식으로 보여주는 페이지)

## 주의 사항
- `reflection.js`는 의도적으로 `$w.initializeScript` 스타일을 유지합니다. 새 예제 페이지를 작성할 때는 `template.html`/`template.js`를 스캐폴드로 참고해 `let $x = { extends, hook, event, method }` 형태의 최신 방식을 사용하는 것을 권장합니다.
- `$object`에는 `syn.$` 형태의 별도 alias가 없습니다. 항상 전역 `$object`로 접근합니다.

## 관련 모듈
- `extension_object` — 동일한 `$object` 모듈의 최신 등록 방식 데모
- `parsehtml` — 이 페이지에서 markdown/코드 하이라이트 렌더링에 사용하는 mixin
