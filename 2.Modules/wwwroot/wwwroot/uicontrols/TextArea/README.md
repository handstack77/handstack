# TextArea (syn.uicontrols.$textarea)

## 이 컨트롤은 무엇인가요?

`TextArea`는 네이티브 `<textarea>` 요소를 향상(enhancement)시키는 syn.uicontrols 컨트롤입니다.

`syn-options` 속성에 지정한 옵션 값(`toSynControl: true`, 기본값)에 따라 내부적으로 [CodeMirror](https://codemirror.net/5/) 에디터로 변환되어, 줄 번호(line number) 표시, 들여쓰기 단위 지정 등 코드 편집에 가까운 UI를 제공합니다. `toSynControl: false`로 설정하면 CodeMirror 변환 없이 순수 HTML `<textarea>` 그대로 동작하며, `maxlength`(또는 `maxlengthB`) 속성에 의한 글자 수(바이트 수) 초과 알림 기능만 덧붙습니다.

컨트롤이 로드되면 페이지 스크립트 안에서 `syn.uicontrols.$textarea`의 메서드(`getValue`, `setValue`, `clear` 등)로 값을 읽고 쓸 수 있고, `syn-events` 속성에 등록한 이벤트 이름에 대응하는 `event.<엘리먼트ID>_<이벤트명>` 핸들러가 자동으로 연결됩니다.

## 언제 사용하나요?

- 여러 줄(멀티라인)의 텍스트를 입력받아야 할 때 (예: 메모, 설명, 소스 코드, 쿼리문 등)
- 입력 글자 수(또는 바이트 수) 제한과 초과 알림이 필요할 때 (`maxlength` / `maxlengthB`)
- 줄 번호를 보여주며 소스 코드나 정형화된 텍스트를 편집해야 할 때 (`toSynControl: true`, 기본값)

TextBox와의 차이

| 구분 | TextBox | TextArea |
| --- | --- | --- |
| 입력 형태 | 한 줄(single-line) 입력 | 여러 줄(multi-line) 입력 |
| 기반 요소 | `<input>` | `<textarea>` |
| 편집기 확장 | 없음 | `toSynControl: true`일 때 CodeMirror 기반 에디터로 확장 (줄 번호, 들여쓰기 등) |
| 대표 용도 | 이름, 코드값 등 짧은 문자열 | 메모, 설명, 소스 코드 등 긴 텍스트 |

## 빠른 시작

```html
<textarea id="txtMemo" syn-options="{width: '100%', height: '200px'}" syn-events="[]"></textarea>
```

페이지가 로드되면 syn 프레임워크가 `id="txtMemo"` 요소를 자동으로 찾아 `syn.uicontrols.$textarea`로 초기화합니다. 별도의 JS 초기화 코드를 작성할 필요가 없습니다.

값을 읽고 쓸 때는 페이지 스크립트에서 다음과 같이 사용합니다.

```js
// 값 읽기
var text = syn.uicontrols.$textarea.getValue('txtMemo');

// 값 쓰기
syn.uicontrols.$textarea.setValue('txtMemo', '안녕하세요');

// 값 지우기
syn.uicontrols.$textarea.clear('txtMemo');
```

## 예제 실행하기

아래 예제는 `/uicontrols/TextArea/example/` 경로에서 직접 열어 확인할 수 있습니다.

- `example/basic.html` — 기본 사용법, getValue/setValue/clear 버튼 데모
- `example/validation.html` — `maxlength` / `maxlengthB`를 이용한 글자 수(바이트 수) 제한 데모
- `example/events.html` — `syn-events`로 CodeMirror 이벤트(change 등)를 연결하는 데모
- `example/memo.html` — 실무 메모/설명 필드 관례: CodeMirror 모드 대신 순수 textarea(`toSynControl: false`) + `belongID` + 실제 서비스에서 흔한 `maxlength`(4000) 범위

각 예제 html은 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 되며, 나머지 CSS/JS는 로더가 자동으로 주입합니다.

## 더 알아보기

자세한 옵션, 메서드, 이벤트 목록은 같은 폴더의 [API.md](./API.md) 문서를 참고하세요.
