# API 참조

## 모듈 정보
- 변수: `$parsehtml` (mixin 객체, `2.Modules/wwwroot/wwwroot/sample/syn/parsehtml.js`)
- 실행 가능한 독립 페이지가 아니며, 다른 페이지 스크립트의 `extends: ['parsehtml']`을 통해서만 사용됩니다.
- 외부 의존성: `/lib/showdown/showdown.min.js`, `/lib/highlight.js/highlight.min.js` (+ `/lib/highlight.js/styles/atom-one-dark.min.css`)

## 속성/메서드

| 구분 | 이름 | 설명 |
|---|---|---|
| `prop` | `converter` | `showdown.Converter` 인스턴스. 초기값 `null`이며, `hook.extendLoad`에서 `window.showdown`이 존재할 때만 생성되어 저장됩니다. |
| `hook` | `extendLoad($this)` | 이 mixin을 `extends`한 페이지가 로드될 때 호출되는 라이프사이클 훅. 다음을 수행합니다: (1) `showdown.Converter`를 `{ tables: true, tasklists: true, underline: true, strikethrough: true, simplifiedAutoLink: true, simpleLineBreaks: true, emoji: true }` 옵션으로 생성해 `$this.prop.converter`에 저장, (2) 페이지 내 모든 `<text>` 태그를 찾아 `converter.makeHtml(item.innerHTML)` 결과로 `outerHTML`을 교체, (3) `window.hljs`가 있으면 페이지 내 모든 `<code>` 태그를 찾아 `hljs.highlight(item.innerHTML, { language: item.getAttribute('language') || 'text' }).value` 결과로 `outerHTML`을 교체. `showdown`/`hljs`가 없으면 각각 `syn.$l.eventLog('extendLoad', ..., 'Warning')`로 경고 로그만 남기고 건너뜁니다. |

이 mixin은 `extend`/`event`/`method` 같은 다른 표준 섹션을 정의하지 않고 `prop`과 `hook.extendLoad`만 노출합니다.
