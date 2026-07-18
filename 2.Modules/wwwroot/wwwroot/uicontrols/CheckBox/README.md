# CheckBox (syn.uicontrols.$checkbox)

## 이 컨트롤은 무엇인가요?

CheckBox는 브라우저 네이티브 `<input type="checkbox">` 엘리먼트를 그대로 사용하면서, 여기에 `syn-datafield`,
`syn-options`, `syn-events` 속성을 붙여 체크 여부에 따라 원하는 값(문자열, 코드값 등)을 폼 데이터로 주고받을 수 있게
"강화(enhancement)"해주는 컨트롤입니다. 다른 컨트롤들(DropDownList, TreeView 등)처럼 커스텀 태그(`<syn_xxx>`)를
쓰는 것이 아니라, 이미 있는 `<input type="checkbox">` 태그에 속성만 추가하면 되므로 가장 가볍고 배우기 쉬운
컨트롤입니다.

체크박스 자체의 boolean 상태(체크됨/안됨)는 그대로 두되, 실제로 서버에 저장하거나 화면 로직에서 쓰는 값은
`checkedValue`(기본 `'1'`) / `uncheckedValue`(기본 `'0'`)로 자유롭게 매핑할 수 있는 것이 핵심 기능입니다.
예를 들어 체크되면 `'Y'`, 안되면 `'N'`을 넘기고 싶다면 옵션만 바꾸면 되고, HTML이나 페이지 스크립트를 따로
고칠 필요가 없습니다.

## 언제 사용하나요?

- 사용 여부(`UseYN`), 동의 여부(`AgreeYN`) 처럼 On/Off 두 가지 상태를 표현할 때
- 목록 화면에서 여러 항목을 각각 체크해서 일괄 처리(선택 삭제, 선택 다운로드 등)할 때
- 폼에서 "이용약관에 동의합니다"와 같이 단일 항목의 동의/거부를 받을 때
- 여러 개의 체크박스를 같은 `name`으로 묶어 그룹을 이루고, `getGroupNames()`로 화면에 존재하는 체크박스 그룹
  이름들을 한 번에 조회하고 싶을 때

CheckBox는 "여러 개 중 하나만" 고를 때 쓰는 RadioButton과 다릅니다. RadioButton은 같은 그룹 내에서 상호
배타적으로 하나만 선택되지만, CheckBox는 각 항목이 독립적으로 켜지고 꺼집니다. 또한 선택지가 많거나 목록
데이터를 기반으로 다중 선택 UI를 구성해야 한다면(콤보박스 형태의 드롭다운에 체크박스 목록을 넣는 경우)
DropDownCheckList처럼 리스트 데이터 바인딩을 지원하는 컨트롤을 쓰는 것이 더 적합합니다. 화면에 이미 고정된
개수의 체크박스를 하나하나 배치하는 경우라면 CheckBox로 충분합니다.

## 빠른 시작

가장 단순한 형태는 `syn-datafield`만 지정하면 됩니다.

```html
<input id="chkAgree" type="checkbox" syn-datafield="AgreeYN">
<label for="chkAgree">이용약관에 동의합니다</label>
```

체크/미체크 값을 직접 지정하고 라벨을 자동으로 붙이고 싶다면 `syn-options`를 추가합니다.

```html
<input id="chkUseYN" type="checkbox" syn-datafield="UseYN"
    syn-options="{checkedValue: 'Y', uncheckedValue: 'N', textContent: '사용 여부'}">
```

값 변경을 감지하려면 `syn-events`에 `change`를 등록하고, 페이지 스크립트(`<페이지파일명>.js`)에
`<엘리먼트ID>_change` 함수를 정의합니다.

```html
<input id="chkNotify" type="checkbox" syn-datafield="NotifyYN" syn-events="['change']">
```

```js
'use strict';
let $mypage = {
    event: {
        chkNotify_change(evt) {
            var value = syn.uicontrols.$checkbox.getValue('chkNotify');
            syn.$l.eventLog('chkNotify_change', 'value: ' + value);
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

`example/` 폴더에 3가지 예제가 있습니다. 로컬 서버 실행 후 브라우저에서 아래 경로로 접근해서 확인하세요
(예: `/uicontrols/CheckBox/example/basic.html`).

- basic.html / basic.js — 옵션 없이 가장 단순하게 사용하는 기본 체크박스와, `checked` 속성으로
  기본 체크 상태를 지정하는 예제입니다.
- options.html / options.js — `checkedValue` / `uncheckedValue`로 커스텀 값(`Y`/`N`, `ACTIVE`/`INACTIVE`
  등)을 지정하는 방법, `disabled`로 비활성화하는 방법, 같은 `name`으로 여러 체크박스를 묶어 배치하고
  `getGroupNames()`로 그룹명을 조회하는 방법을 보여줍니다.
- toggledependent.html / toggledependent.js — 실무 패턴: 체크 여부에 따라 옆의 DatePicker에 오늘 날짜를 자동으로 채우거나 비우고, `getValue`가 반환하는 값이 boolean이 아니라 `checkedValue`/`uncheckedValue` 문자열임을 보여줌
- events.html / events.js — `syn-events="['change']"`로 변경 이벤트를 감지하고, 버튼을 눌러
  `getValue` / `setValue` / `toggleValue` / `clear` 메서드를 직접 호출해보는 예제입니다.

## 더 알아보기

옵션, 메서드, 이벤트의 전체 목록과 시그니처는 [API.md](./API.md)를 참고하세요.
