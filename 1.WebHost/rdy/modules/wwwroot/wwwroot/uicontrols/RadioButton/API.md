# RadioButton API 참조

`syn.uicontrols.$radio` (`v2025.10.1` 기준, `RadioButton.js` 참고)

## 마크업

RadioButton은 네이티브 `<input type="radio">` 엘리먼트를 그대로 사용합니다. 같은 라디오 그룹으로 묶을 항목들은
반드시 동일한 `name` 속성 값을 가져야 합니다.

```html
<input id="rdoUseYn1" name="rdoUseYn" type="radio" syn-datafield="UseYn" value="Y"
    checked="checked" syn-events="['change']" syn-options="{textContent: '사용', toSynControl: true}">
<input id="rdoUseYn2" name="rdoUseYn" type="radio" syn-datafield="UseYn" value="N"
    syn-events="['change']" syn-options="{textContent: '미사용', toSynControl: true}">
```

| 속성 | 설명 |
| --- | --- |
| `id` | 컨트롤을 식별하는 고유 ID. `getValue`/`setValue` 등 개별 라디오 항목을 다루는 메서드의 대상이 됩니다. |
| `name` | 라디오 그룹을 묶는 값. 같은 `name`을 가진 항목들 중 하나만 선택됩니다. `getGroupNames`/`selectedValue` 등 그룹 단위 메서드가 이 값을 사용합니다. |
| `syn-datafield` | 폼 데이터 바인딩 시 사용할 필드명입니다. |
| `syn-events` | 자동 연결할 이벤트 이름 배열(JS 배열 리터럴 문자열)입니다. 예: `"['change']"` |
| `syn-options` | RadioButton의 옵션(아래 `Options` 표 참고)을 JS 객체 리터럴 문자열로 지정합니다. |
| `value` / `checked` | 표준 HTML 라디오 속성과 동일하게 동작합니다. |

## Options (defaultSetting)

`syn-options`에 지정할 수 있는 항목입니다. 지정하지 않으면 아래 기본값이 적용됩니다.

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `contents` | `''` | 예약된 콘텐츠 설정값(현재 버전에서는 별도 렌더링에 사용되지 않음). |
| `toSynControl` | `false` | `true`이면 원본 `<input>`을 숨김 처리(`id`를 `_hidden`으로 변경)하고, `textContent`로 지정한 라벨과 함께 새 `<span class="form-control">` 래퍼를 자동 생성해 화면에 보여줍니다. `false`이면 마크업을 그대로 사용하며(순수 enhancement), 라벨은 개발자가 직접 작성해야 합니다. |
| `dataType` | `'string'` | 값의 데이터 타입 힌트입니다. |
| `belongID` | `null` | 소속 컨테이너/그룹 식별자(다른 컨트롤과의 연계용)입니다. |
| `getter` | `false` | 값을 읽어올 때 사용할 커스텀 처리 지정 여부입니다. |
| `setter` | `false` | 값을 설정할 때 사용할 커스텀 처리 지정 여부입니다. |
| `controlText` | `null` | 컨트롤에 표시할 텍스트(구현체별 사용처가 다를 수 있음)입니다. |
| `textContent` | *(defaultSetting에는 없으나 `toSynControl: true`일 때 사용)* | 자동 생성되는 `<label>`에 표시할 문자열입니다. |
| `validators` | `null` | 값 검증 규칙입니다. |
| `transactConfig` | `null` | 트랜잭션(서버 통신) 관련 설정입니다. |
| `triggerConfig` | `null` | 다른 컨트롤/이벤트와 연동하기 위한 트리거 설정입니다. |

> 참고: `toSynControl: true`로 생성된 화면상의 `<input>`은 원래 선언했던 `id`를 그대로 물려받고, 원본 엘리먼트는
> `id + '_hidden'`으로 이름이 바뀐 채 `display: none` 처리됩니다. `getSelectedByValue`/`getSelectedByText`/`getSelectedByID`
> 메서드는 이 `_hidden` 엘리먼트를 결과에서 제외하도록 구현되어 있습니다.

## 메서드

| 메서드 | 시그니처 | 설명 |
| --- | --- | --- |
| `controlLoad` | `controlLoad(elID, setting)` | 컨트롤 초기화(생성자 역할). `syn.loader.js`가 자동으로 호출하므로 직접 호출할 일은 거의 없습니다. |
| `getValue` | `getValue(elID, meta)` | 지정한 라디오 항목 하나의 `checked` 상태(`true`/`false`)를 반환합니다. |
| `setValue` | `setValue(elID, value, meta)` | 지정한 라디오 항목 하나의 `checked` 상태를 설정합니다. |
| `clear` | `clear(elID, isControlLoad)` | 지정한 라디오 항목의 선택을 해제합니다(`checked = false`). |
| `setLocale` | `setLocale(elID, translations, control, options)` | 다국어(로케일) 적용 훅입니다(현재 버전은 별도 동작 없음). |
| `getGroupNames` | `getGroupNames()` | 화면에 존재하는 모든 라디오 그룹의 `name` 목록을 중복 없이 반환합니다. |
| `getSelectedByValue` | `getSelectedByValue(group)` | 지정한 그룹(`name`)에서 선택된 라디오의 `value`를 반환합니다. |
| `getSelectedByText` | `getSelectedByText(group)` | 지정한 그룹에서 선택된 라디오의 라벨 텍스트(다음 형제 엘리먼트의 텍스트)를 반환합니다. |
| `getSelectedByID` | `getSelectedByID(group)` | 지정한 그룹에서 선택된 라디오의 `id`를 반환합니다. |
| `selectedValue` | `selectedValue(group, value)` | 지정한 그룹에서 `value`와 일치하는 라디오 항목을 선택 상태로 만듭니다. |

## 이벤트 (syn-events)

RadioButton 자체가 별도로 발생시키는 커스텀 이벤트는 없으며, 네이티브 `<input type="radio">`가 발생시키는
브라우저 표준 이벤트를 `syn-events`에 등록해 사용합니다.

| 이벤트 | 설명 |
| --- | --- |
| `change` | 라디오 선택 상태가 바뀌었을 때 발생합니다. 실무에서 가장 많이 사용하는 이벤트입니다. |
| `click` | 라디오 항목을 클릭했을 때 발생합니다. |
| `focus` / `blur` | 라디오 항목이 포커스를 받거나 잃었을 때 발생합니다. |

이벤트를 받으려면 `syn-events="['change']"`처럼 배열로 이벤트 이름을 선언하고, 페이지 스크립트에
`event.<엘리먼트ID>_<이벤트이름>` 형태의 핸들러 함수를 작성하면 자동으로 연결됩니다.

```js
let $mypage = {
    event: {
        rdoUseYn1_change(evt) {
            console.log('변경됨:', syn.uicontrols.$radio.getValue('rdoUseYn1'));
        }
    }
}
```

## 참고

- 원본 소스: `1.WebHost/rdy/modules/wwwroot/wwwroot/uicontrols/RadioButton/RadioButton.js`
- 스타일 정의: `1.WebHost/rdy/modules/wwwroot/wwwroot/uicontrols/RadioButton/RadioButton.css` (`.syn-radio` 클래스)
- 사용 예제: [`./example`](./example) 폴더, 그리고 [README.md](./README.md)의 "빠른 시작" 절
