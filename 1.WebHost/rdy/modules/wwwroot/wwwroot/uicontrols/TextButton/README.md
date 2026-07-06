# TextButton (syn.uicontrols.$button)

## 이 컨트롤은 무엇인가요?

TextButton은 `<input type="button">` (또는 `type="submit"`, `type="reset"`) 요소를 `syn.uicontrols` 프레임워크가 인식하는 표준 컨트롤로 만들어주는 가장 단순한 컨트롤입니다.

버튼 자체에 새로운 태그나 화려한 UI를 추가하지는 않습니다. 대신 다음 두 가지 역할을 합니다.

1. `syn-options` 속성에 적힌 설정값을 읽어 버튼에 적용하고, 필요하면 `btn`, `btn-{color}` 같은 클래스를 자동으로 붙여줍니다.
2. 다른 컨트롤들과 동일한 방식(`getValue`, `setValue`, `clear`)으로 버튼의 `value` 값을 다루게 해줍니다. 즉, 폼에 있는 텍스트박스나 체크박스와 완전히 동일한 API로 버튼을 제어할 수 있습니다.

내부적으로는 `syn.uicontrols.$button`이라는 이름의 싱글턴 객체이며, 소스 파일명은 `TextButton.js`이지만 실제 코드에서 사용하는 네임스페이스는 `$button`입니다.

## 언제 사용하나요?

- 폼 안에서 "조회", "저장", "취소" 같은 동작을 트리거하는 버튼을 만들 때
- 버튼의 라벨(`value`)을 스크립트에서 동적으로 읽거나 바꾸고 싶을 때 (`getValue` / `setValue`)
- 버튼에 `btn btn-primary` 같은 부트스트랩 계열 클래스를 옵션으로 자동 부여하고 싶을 때 (`toSynControl` + `color` 옵션)
- 다른 컨트롤(TextBox, CheckBox 등)과 함께 폼을 구성하면서, 버튼도 동일한 `syn-events` 이벤트 바인딩 규칙을 따르게 하고 싶을 때

일반 HTML `<button>` 만으로 충분한 단순 페이지라면 이 컨트롤을 강제로 쓸 필요는 없습니다. TextButton은 "폼 컨트롤 생태계 안에서 버튼도 일관되게 다루고 싶을 때" 쓰는 도구입니다.

## 빠른 시작

```html
<form autocomplete="off" id="form1" syn-datafield="MainForm">
    <input type="button" id="btnSave" value="저장" syn-events="['click']" />
</form>
<script src="/js/syn.loader.js"></script>
```

```js
// btnSave.js (페이지 스크립트, 파일명은 HTML과 동일해야 합니다)
'use strict';
let $btnSave = {
    event: {
        btnSave_click() {
            syn.$l.eventLog('btnSave_click', '저장 버튼이 클릭되었습니다.');
        }
    }
}
```

`syn.loader.js`는 `<input type="button">` 요소를 자동으로 감지해서 `TextButton.css`, `TextButton.js`를 주입하므로, 페이지에서 별도로 컨트롤 스크립트를 `<script>` 태그로 추가할 필요가 없습니다.

## 예제 실행하기

`/uicontrols/TextButton/example/` 폴더에 두 개의 실행 가능한 예제가 있습니다.

- `basic.html` — 버튼 클릭 이벤트를 로그로 확인하고, `getValue` / `setValue` / `clear` 메서드로 버튼 라벨을 조작하는 가장 기본적인 예제
- `styled.html` — `syn-options`의 `toSynControl`, `color` 옵션으로 버튼에 `btn`, `btn-{color}` 클래스가 자동으로 붙는 것을 확인하는 예제

각 `.html` 파일을 웹 서버(rdy 등)를 통해 열면 됩니다. 파일을 더블클릭해서 `file://`로 여는 방식은 `/js/syn.loader.js` 등 절대 경로 리소스를 불러오지 못하므로 반드시 웹 서버 경유로 접속하세요.

## 더 알아보기

- API 상세(옵션/메서드/이벤트 표)는 같은 폴더의 `API.md`를 참고하세요.
- 이 컨트롤은 기존 샘플(`/sample/uicontrol/`)이나 실사용 예시가 발견되지 않아, `TextButton.js` 소스코드만을 근거로 문서화되었습니다. 실제 프로젝트에 적용하기 전에 `TextButton.js`, `TextButton.css` 원본을 함께 확인하는 것을 권장합니다.
