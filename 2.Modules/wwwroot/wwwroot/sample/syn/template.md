# template 사용법

## 개요
`template` 페이지(`template.html` / `template.js`)는 특정 `syn.js` 모듈의 API를 시연하는 페이지가 아니라, 새 예제 페이지를 만들 때 참고할 수 있는 시작점 스캐폴드입니다. `parsehtml` mixin을 이용한 markdown/코드 하이라이트 렌더링 데모를 포함하고 있어, 새 페이지 작성 시 최소 구조와 `parsehtml` 사용법을 함께 확인할 수 있습니다.

## 로드 방법
```html
<link rel="stylesheet" href="/lib/highlight.js/styles/atom-one-dark.min.css">
...
<script src="/lib/highlight.js/highlight.min.js"></script>
<script src="/lib/showdown/showdown.min.js"></script>
<script src="/js/syn.loader.js"></script>
```

## 빠른 시작
새 예제 페이지를 만들 때 필요한 최소 구조는 다음과 같습니다.

`<name>.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/lib/highlight.js/styles/atom-one-dark.min.css">
</head>
<body style="visibility: hidden;">
    <div class="container">
        <div class="row">
            <div class="col-12">
                <!-- 예제 마크업 -->
            </div>
        </div>
    </div>
    <script src="/lib/highlight.js/highlight.min.js"></script>
    <script src="/lib/showdown/showdown.min.js"></script>
    <script src="/js/syn.loader.js"></script>
</body>
</html>
```

`<name>.js`:
```javascript
'use strict';
let $name = {
    extends: [
        'parsehtml'
    ],
    hook: {
        pageLoad() {
            // 페이지 로드 시 1회 실행되는 초기화 코드
        }
    },
    event: {
        // 'id_이벤트명' 형태로 HTML 엘리먼트 이벤트를 바인딩
    },
};
```

## 주요 시나리오 / 사용 방법
- `extends: ['parsehtml']`을 선언하면 `<pre><text>...</text></pre>` 블록의 markdown과 `<pre><code language="js">...</code></pre>` 블록의 코드가 자동으로 렌더링/하이라이트됩니다 (자세한 내용은 `parsehtml.md` 참고).
- `hook.pageLoad()`에서 초기 값 세팅 등 페이지 진입 시 필요한 로직을 작성합니다.
- `event` 객체의 각 키는 `{요소 id}_{이벤트명}` 규칙으로 해당 HTML 엘리먼트의 이벤트에 자동 바인딩됩니다 (`syn-events="['click']"` 속성과 함께 사용).

## 실전 예제 페이지
- `template.html` / `template.js` (본 스캐폴드)
- `parsehtml`을 사용하는 다른 모든 예제 페이지 (`parsehtml.md`의 목록 참고)

## 주의 사항
- 이 페이지는 특정 모듈의 API 전체를 시연하지 않습니다. 실제 API 데모가 필요하면 해당 모듈 전용 예제 페이지(`cryptography.html`, `extension_object.html` 등)를 참고하세요.
- 과거 버전에는 FingerprintJS 데모(주석 처리)와 `$cryptography.base64Encode` 버튼이 포함되어 있었으나, 전자는 미사용 주석이라 제거했고 후자는 `cryptography.html`에서 이미 정식으로 시연하므로 중복을 제거했습니다.

## 관련 모듈
- `parsehtml` — 이 스캐폴드가 사용하는 markdown/코드 하이라이트 mixin
