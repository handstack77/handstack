# CheckBox API 참조

`syn.uicontrols.$checkbox` (버전: `v2025.10.1`)

소스: `uicontrols/CheckBox/CheckBox.js`, `uicontrols/CheckBox/CheckBox.css`

## 마크업

CheckBox는 커스텀 태그가 아니라 네이티브 `<input type="checkbox">`를 강화(enhancement)하는 방식입니다.

```html
<input id="elId" type="checkbox" syn-datafield="Field"
    syn-options="{checkedValue: 'Y', uncheckedValue: 'N', textContent: '사용 여부'}"
    syn-events="['change']">
```

- `id` : 컨트롤 식별자(필수). 메서드 호출 시 `elID`로 사용합니다.
- `syn-datafield` : 폼 전송/바인딩 시 사용할 필드명.
- `syn-options` : `defaultSetting`을 덮어쓸 JSON(객체 리터럴) 문자열. 생략하면 기본값이 적용됩니다.
- `syn-events` : 페이지 스크립트의 `<elID>_<eventName>` 핸들러와 연결할 이벤트명 배열.
- `checked` : 초기 체크 상태는 네이티브 `checked` 속성으로 지정합니다(HTML 표준 방식 그대로).
- `disabled` : 네이티브 `disabled` 속성 또는 `syn-options`의 `disabled` 값으로 지정할 수 있습니다.

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `contents` | string | `''` | 다른 컨트롤과 공통으로 쓰이는 예약 필드입니다. CheckBox 내부 로직에서는 실제로 참조되지 않습니다. |
| `toSynControl` | boolean | `false` | `true`로 설정하면 원본 `<input>`을 숨기고(`_hidden` 접미사 부여) `span.form-control` 래퍼 안에 새 `<input class="ui_checkbox">`와 `<label>`을 자동 생성해 렌더링합니다. `false`면 원본 `<input>`에 `syn-options`만 부여하고 그대로 사용합니다. |
| `disabled` | boolean | `false` | 체크박스 비활성화 여부. `toSynControl: true`일 때는 새로 생성되는 `<input>`의 `disabled` 속성에 반영됩니다. |
| `checkedValue` | string | `'1'` | 체크되었을 때 `getValue`가 반환할 값이자, `setValue` 호출 시 이 값과 일치하면 체크 상태로 처리하는 기준값입니다. |
| `uncheckedValue` | string | `'0'` | 체크 해제되었을 때 `getValue`가 반환할 값입니다. |
| `dataType` | string | `'string'` | 값의 데이터 타입 힌트(다른 컨트롤과 공통 스키마). |
| `belongID` | string \| null | `null` | 상위 컨테이너/그룹 식별자(공통 스키마). |
| `controlText` | any \| null | `null` | 공통 스키마에 포함된 예약 필드로, CheckBox 내부 로직에서는 실제로 사용되지 않습니다. |
| `textContent` | string | `''` | `toSynControl: true`일 때 체크박스 옆에 표시할 `<label>` 텍스트입니다. |
| `validators` | object \| null | `null` | 유효성 검증 설정(공통 스키마). |
| `transactConfig` | object \| null | `null` | 트랜잭션(서버 호출) 연동 설정(공통 스키마). `triggerEvent`를 지정하면 해당 이벤트 발생 시 자동으로 트랜잭션이 실행됩니다. |
| `triggerConfig` | object \| null | `null` | 트리거 연동 설정(공통 스키마). |

## 메서드

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| controlLoad | `controlLoad(elID, setting)` | 컨트롤 초기화(생성자 역할). `syn.loader.js`가 화면 스캔 시 자동으로 호출하며, 개발자가 직접 호출할 일은 없습니다. |
| getValue | `getValue(elID, meta)` | 체크 상태에 따라 `checkedValue` 또는 `uncheckedValue`를 반환합니다. `syn-options`가 없으면 `checked` 여부에 따라 `'1'`/`'0'`을 반환합니다. |
| setValue | `setValue(elID, value, meta)` | `value`를 대문자 문자열로 변환한 뒤, `checkedValue`와 일치하는지(또는 `true`/`'TRUE'`/`'Y'`/`'1'`인지) 비교해 `checked` 상태를 설정합니다. `value`가 falsy(빈 문자열, `null` 등)면 무조건 체크 해제합니다. |
| toggleValue | `toggleValue(elID)` | 현재 체크 상태를 반전시킵니다(체크→해제, 해제→체크). |
| clear | `clear(elID, isControlLoad)` | 체크 상태를 `false`(미체크)로 초기화합니다. |
| getGroupNames | `getGroupNames()` | 현재 화면(document) 안의 모든 `input[type='checkbox']`가 가진 `name` 속성 값을 중복 제거해서 배열로 반환합니다. |
| setLocale | `setLocale(elID, translations, control, options)` | 다국어 처리 훅입니다. CheckBox는 현재 별도 구현 없이 빈 함수로 제공됩니다. |
| addModuleList | `addModuleList(el, moduleList, setting, controlType)` | 폼 제출 시 참조할 모듈 목록에 컨트롤 정보를 등록하는 내부용 메서드입니다. 직접 호출하지 않습니다. |

## 이벤트 (syn-events)

CheckBox는 별도의 `eventHooks` 배열을 선언하지 않는 컨트롤입니다. 네이티브 `<input type="checkbox">`를 그대로
사용하기 때문에, `syn-events` 속성에 등록한 이벤트명은 `syn.$l.addEvent(elID, eventName, handler)`를 통해
표준 DOM 이벤트로 그대로 연결됩니다. 즉 브라우저가 지원하는 어떤 이벤트명이든 등록할 수 있지만, 실무에서는
아래 이벤트가 주로 사용됩니다.

| 이벤트명 | 핸들러 시그니처 | 설명 | 발생 시점 |
|---|---|---|---|
| `change` | `<elID>_change(evt)` | 체크 상태가 사용자 조작(클릭, 키보드 스페이스 등)으로 바뀌었을 때 발생하는 표준 DOM `change` 이벤트입니다. | 체크박스의 체크 여부가 바뀌고 포커스가 유지된 상태에서 값이 확정될 때 |
| `click` | `<elID>_click(evt)` | 체크박스를 클릭했을 때 발생하는 표준 DOM `click` 이벤트입니다. | 체크박스 영역(또는 연결된 `<label>`) 클릭 시 |

핸들러는 `evt` 인자(네이티브 Event 객체) 하나만 전달받습니다. 현재 값을 확인하려면 핸들러 안에서
`syn.uicontrols.$checkbox.getValue(elID)`를 호출하면 됩니다.

## 참고

- 실행 가능한 예제: `example/basic.html`, `example/options.html`, `example/events.html`
- 초보자용 개요와 사용 시나리오: [README.md](./README.md)
- 스타일 커스터마이징: `CheckBox.css`의 `.syn-checkbox` 클래스를 통해 색상 등을 재정의할 수 있습니다.
