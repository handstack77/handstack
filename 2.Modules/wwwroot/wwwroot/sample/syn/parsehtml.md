# parsehtml 사용법

## 개요
`parsehtml`은 실행 가능한 독립 예제 페이지가 아니라, 다른 예제 페이지가 `extends: ['parsehtml']`로 가져다 쓰는 재사용 가능한 mixin(믹스인) 객체입니다 (`2.Modules/wwwroot/wwwroot/sample/syn/parsehtml.js`). 페이지 로드 시 `showdown.Converter`를 초기화해 `<text>` 태그로 감싼 markdown을 HTML로 렌더링하고, `highlight.js`를 이용해 `<code>` 태그의 내용에 코드 하이라이트를 적용합니다.

## 로드 방법
`parsehtml`을 사용하려면 페이지에서 다음 두 외부 스크립트를 함께 로드해야 합니다.
```html
<link rel="stylesheet" href="/lib/highlight.js/styles/atom-one-dark.min.css">
...
<script src="/lib/highlight.js/highlight.min.js"></script>
<script src="/lib/showdown/showdown.min.js"></script>
<script src="/js/syn.loader.js"></script>
```
스크립트가 없으면 `parsehtml`은 렌더링을 건너뛰고 `syn.$l.eventLog`로 `Warning` 레벨 로그를 남깁니다 (아래 주의 사항 참고).

## 빠른 시작
페이지 스크립트에서 `extends` 배열에 `'parsehtml'`을 추가하면 됩니다.
```javascript
'use strict';
let $mypage = {
    extends: [
        'parsehtml'
    ],
    // ...
};
```
그 후 페이지 HTML에 다음과 같이 markdown/코드 블록을 작성합니다.
```html
<pre><text>
# 제목
markdown 내용
</text></pre>

<pre><code language="js">
console.log('hello');
</code></pre>
```

## 주요 시나리오 / 사용 방법
- `hook.extendLoad($this)` 라이프사이클 훅에서 `showdown.Converter`를 다음 옵션으로 생성합니다: `tables`, `tasklists`, `underline`, `strikethrough`, `simplifiedAutoLink`, `simpleLineBreaks`, `emoji` 모두 `true`.
- 생성된 컨버터는 `$this.prop.converter`에 저장되며, 페이지 내 `<text>` 태그를 찾아 `converter.makeHtml(...)` 결과로 `outerHTML`을 교체합니다.
- `window.hljs`가 있으면 페이지 내 `<code>` 태그를 찾아 `hljs.highlight(...)` 결과로 `outerHTML`을 교체합니다. 이때 `<code language="js">`처럼 `language` 속성으로 하이라이트 언어를 지정할 수 있으며, 지정하지 않으면 `'text'`로 처리됩니다.

## 실전 예제 페이지 (parsehtml은 없음 — 대신 이를 사용하는 페이지 목록)
`.js`에서 `extends: ['parsehtml']`을 사용하는 페이지:
- `template.js`
- `library.js`
- `webforms.js`
- `validate.js`
- `requests.js`
- `manipulation.js`
- `keyboard.js`
- `extension_string.js`
- `extension_object.js`
- `extension_number.js`
- `extension_date.js`
- `extension_array.js`
- `dimension.js`
- `cryptography.js`
- `browser.js`

## 주의 사항
- `parsehtml.html` 페이지는 존재하지 않으며 만들 필요도 없습니다. 이 모듈은 항상 다른 페이지의 `extends`를 통해서만 사용됩니다.
- `showdown.min.js` 또는 `highlight.min.js`가 로드되지 않은 상태에서 페이지를 열면 markdown/코드 블록이 렌더링되지 않고 콘솔에 경고 로그만 남습니다. 반드시 두 스크립트를 `<head>`/`<body>` 하단에 포함해야 합니다.

## 관련 모듈
- 이 mixin을 사용하는 모든 예제 페이지 (`template`, `extension_object` 등)
