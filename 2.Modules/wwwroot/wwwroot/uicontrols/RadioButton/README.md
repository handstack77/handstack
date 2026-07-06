# RadioButton (syn.uicontrols.$radio)

## 이 컨트롤은 무엇인가요?

RadioButton은 HTML이 기본으로 제공하는 `<input type="radio">` 태그를 "강화(enhancement)"하는 컨트롤입니다.
다른 syn.uicontrols 컨트롤들(예: TreeView, DropDownList)은 커스텀 태그(`<syn-xxx>`)나 별도 위젯 라이브러리를 새로 그려 넣는 방식이지만,
RadioButton은 원래 있던 `<input type="radio">` 엘리먼트를 그대로 사용하면서 다음 기능만 덧붙여 줍니다.

- `syn-options` 속성으로 선언한 설정값을 읽어 컨트롤로 등록
- `syn-datafield`를 이용한 폼 데이터 바인딩(`getValue`/`setValue`/`clear`)
- `syn-events`에 적어둔 이벤트 이름(`change` 등)을 페이지 스크립트의 `event.<엘리먼트ID>_<이벤트이름>` 핸들러에 자동 연결
- 같은 `name`을 공유하는 라디오 그룹 단위로 선택값을 조회/설정하는 헬퍼 메서드(`getGroupNames`, `getSelectedByValue` 등)

즉 화면에는 여러분이 직접 작성한 `<input type="radio">` 마크업이 그대로 보이고, `syn.uicontrols.$radio`는 그 뒤에서
값 관리와 이벤트 연결만 대신 해주는 얇은 래퍼(wrapper)라고 이해하면 됩니다.

## 언제 사용하나요?

라디오버튼은 "여러 선택지 중 정확히 하나만" 고르게 할 때 사용합니다. 비슷한 역할을 하는 다른 컨트롤과 헷갈리기 쉬우므로 차이를 정리합니다.

| 상황 | 추천 컨트롤 |
| --- | --- |
| 여러 선택지 중 정확히 1개만 선택 (예: 성별, 사용여부, 배송 방법) | RadioButton |
| 여러 선택지 중 0개 이상 여러 개를 선택 (예: 관심사, 알림 수신 항목) | CheckBox |
| 선택지가 많아서 드롭다운으로 접어두고 그 중 1개를 선택 (예: 국가, 부서 목록) | DropDownList |

정리하면, 선택지 개수가 적고(보통 2~5개) 화면에 항상 노출해서 한눈에 비교하며 고르게 하고 싶다면 RadioButton을,
선택지가 많거나 화면 공간을 아껴야 한다면 DropDownList를, 다중 선택이 필요하다면 CheckBox를 사용하세요.

## 빠른 시작

가장 단순한 사용 방법은 네이티브 `<input type="radio">` 여러 개에 같은 `name`을 지정하고, 각각에 `syn-options`를 붙이는 것입니다.

```html
<form autocomplete="off" id="form1" syn-datafield="MainForm">
    <input id="rdoUseYn1" name="rdoUseYn" type="radio" syn-datafield="UseYn" value="Y"
        checked="checked" syn-events="['change']" syn-options="{textContent: '사용', toSynControl: true}">
    <input id="rdoUseYn2" name="rdoUseYn" type="radio" syn-datafield="UseYn" value="N"
        syn-events="['change']" syn-options="{textContent: '미사용', toSynControl: true}">
</form>

<script src="/js/syn.loader.js"></script>
```

페이지 스크립트(`.js`)에서는 이렇게 값을 읽고 씁니다.

```js
'use strict';
let $mypage = {
    event: {
        rdoUseYn1_change() {
            console.log('선택 여부:', syn.uicontrols.$radio.getValue('rdoUseYn1'));
        }
    }
}
```

- `syn.loader.js`가 페이지의 라디오 엘리먼트를 스캔해서 RadioButton 컨트롤에 필요한 CSS/JS를 자동으로 불러와 주므로,
  개발자가 별도의 `<script>`/`<link>` 태그를 더 추가할 필요가 없습니다.
- `syn-options`의 `toSynControl: true`는 "라벨(label)까지 자동으로 그려 달라"는 옵션입니다. 이미 직접 `<label>`을 작성해두었다면
  `toSynControl`을 생략(기본값 `false`)해도 됩니다.

## 예제 실행하기

실습용 예제는 `/uicontrols/RadioButton/example/` 아래에 있습니다. 브라우저로 아래 경로를 열어 직접 동작을 확인해 보세요.

- `/uicontrols/RadioButton/example/basic.html` — 라디오 그룹 기본 마크업과 라벨 자동 생성(toSynControl) 예제
- `/uicontrols/RadioButton/example/getset.html` — `getValue`/`setValue`/`clear`/`selectedValue` 등 값 다루기 예제
- `/uicontrols/RadioButton/example/events.html` — `change` 이벤트 처리와 그룹 조회 메서드(`getGroupNames`, `getSelectedByValue` 등) 예제

각 예제는 `/js/syn.loader.js` 한 줄만으로 필요한 리소스를 자동 로드하므로, HTML 파일과 짝을 이루는 `.js` 파일을 함께 열어 보면
실제 페이지 스크립트를 어떻게 작성하는지 확인할 수 있습니다.

## 더 알아보기

옵션, 메서드, 이벤트의 전체 목록과 상세 설명은 [API.md](./API.md) 문서를 참고하세요.
