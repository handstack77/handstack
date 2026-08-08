# Element (syn.uicontrols.$element)

## 이 컨트롤은 무엇인가요?

Element는 TextBox, CheckBox, DropDownList처럼 특정 태그 전용으로 만들어진 컨트롤이 아니라, `<div>`, `<span>`,
`<label>`, `<p>`, `<a>`, `<td>`처럼 아직 전용 컨트롤이 없는 일반 HTML 엘리먼트를 위한 범용/기반(fallback)
컨트롤입니다. `syn.loader.js`는 화면을 스캔할 때 `syn-datafield`, `syn-options`, `syn-events` 속성이 붙은
엘리먼트를 찾아서, 그 태그가 `BUTTON` / `INPUT` / `TEXTAREA` / `SELECT`처럼 전용 컨트롤에 매핑되는 태그가
아니고 `<syn_xxx>` 커스텀 태그도 아니면 자동으로 Element(`element`) 컨트롤로 취급합니다. 즉 새로운 태그를
쓸 필요 없이, 이미 화면에 있는 아무 엘리먼트에 속성만 붙이면 `getValue` / `setValue` / `clear` 같은 공통
API로 값을 주고받을 수 있게 해주는 컨트롤입니다.

값을 어디에 넣고 뺄지는 `content` 옵션으로 결정합니다. `value`(엘리먼트의 `value` 프로퍼티), `html`
(`innerHTML`), `content`(`textContent`), 그리고 기본값인 `innerText` 중에서 고를 수 있습니다. 또한
`dataType`을 `number`/`numeric`으로 지정하면 숫자 포맷(통화 형식)으로, `bool`/`boolean`으로 지정하면
`checkedValue`/`uncheckedValue` 두 값 중 하나로 값을 변환해서 다룹니다. Element는 다른 컨트롤과 달리
전용 CSS 파일이 없습니다(`Element.js` 하나로만 구성됨) — 스타일은 순전히 페이지의 일반 CSS로 처리한다는
뜻입니다.

## 언제 사용하나요?

- 화면에 읽기 전용으로 문구/라벨(예: 처리 상태, 안내 메시지, 집계 결과)을 표시하고, `getValue`/`setValue`로
  그 내용을 스크립트에서 갱신하고 싶을 때
- `<div>`나 `<span>`처럼 폼 컨트롤이 아닌 일반 엘리먼트를 폼 데이터(`syn-datafield`)의 일부로 취급해서,
  폼 제출/데이터 바인딩 로직에 자연스럽게 포함시키고 싶을 때
- 굳이 전용 컨트롤로 감쌀 필요가 없는 단순한 값 표시 영역(합계 금액, 상태 배지, 안내 문구 등)에 공통
  `getValue`/`setValue`/`clear` API를 통일해서 적용하고 싶을 때
- 다른 전용 컨트롤이 아직 없는 새로운 태그를 화면에서 값 바인딩 대상으로 써야 할 때의 임시/기본 대안

CheckBox, TextBox처럼 이미 전용 컨트롤이 있는 태그(`<input type="checkbox">`, `<input type="text">` 등)에는
Element 대신 해당 전용 컨트롤이 자동으로 적용되므로, Element를 의식적으로 지정할 일은 거의 없습니다. Element는
"그 외의 모든 것"을 담당하는 기반 컨트롤이라고 이해하면 됩니다.

## 빠른 시작

가장 단순한 형태는 `syn-datafield`만 지정하는 것입니다. 이 경우 `content` 옵션이 없으므로 기본값인
`innerText`를 읽고 씁니다.

```html
<div id="lblStatus" syn-datafield="StatusText">대기중</div>
```

`content` 옵션으로 어디에 값을 넣고 뺄지 지정할 수 있습니다.

```html
<!-- textContent 로 읽고 쓰기 -->
<span id="spnMessage" syn-datafield="MessageText" syn-options="{content: 'content'}"></span>

<!-- innerHTML 로 읽고 쓰기 (HTML 태그 포함 가능) -->
<div id="divSummary" syn-datafield="SummaryHtml" syn-options="{content: 'html'}"></div>
```

숫자나 참/거짓 값을 다루려면 `dataType`을 함께 지정합니다.

```html
<div id="divTotalAmount" syn-datafield="TotalAmount" syn-options="{content: 'content', dataType: 'number'}"></div>
```

값 변경을 감지하려면 `syn-events`에 이벤트명을 등록하고, 페이지 스크립트(`<페이지파일명>.js`)에
`<엘리먼트ID>_<이벤트명>` 함수를 정의합니다.

```html
<div id="divClickable" syn-datafield="ClickInfo" syn-events="['click']">클릭해 보세요</div>
```

```js
'use strict';
let $mypage = {
    event: {
        divClickable_click(evt) {
            syn.$l.eventLog('divClickable_click', '');
        }
    }
}
```

페이지에는 위 스크립트 외에 다음 한 줄만 있으면 됩니다. `syn.loader.js`가 화면에 있는 컨트롤들을 스캔해서
필요한 CSS/JS를 알아서 불러옵니다.

```html
<script src="/js/syn.loader.js"></script>
```

## 예제 실행하기

`example/` 폴더에 예제가 있습니다. 로컬 서버 실행 후 브라우저에서 아래 경로로 접근해서 확인하세요
(예: `/uicontrols/Element/example/basic.html`).

- basic.html / basic.js — `content` 옵션(`value`/`html`/`content`/기본값)별로 값이 어떻게 표시되는지
  비교해보고, `dataType`(`string`/`number`/`bool`)에 따라 값이 어떻게 변환되는지 확인하는 예제입니다.
  `getValue` / `setValue` / `clear` 버튼으로 각 엘리먼트의 값을 직접 조작해볼 수 있습니다.

## 더 알아보기

옵션, 메서드, 이벤트의 전체 목록과 시그니처는 [API.md](./API.md)를 참고하세요.
