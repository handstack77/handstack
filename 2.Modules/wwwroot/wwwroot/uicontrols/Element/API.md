# Element API 참조

`syn.uicontrols.$element` (버전: `v2025.12.25`)

소스: `uicontrols/Element/Element.js` (전용 CSS 없음)

## 마크업

Element는 커스텀 태그가 아니라, 전용 컨트롤이 없는 임의의 네이티브 태그(`div`, `span`, `label`, `p`, `a`,
`td` 등)를 강화(enhancement)하는 방식입니다. `syn.loader.js`가 화면을 스캔할 때 `BUTTON` / `INPUT` /
`TEXTAREA` / `SELECT`처럼 전용 컨트롤에 매핑되는 태그가 아니고 `<syn_xxx>` 커스텀 태그도 아닌 경우, 자동으로
Element 컨트롤로 취급합니다.

```html
<div id="elId" syn-datafield="Field"
    syn-options="{content: 'content', dataType: 'number'}"
    syn-events="['click']">초기 표시값</div>
```

- `id` : 컨트롤 식별자(필수). 메서드 호출 시 `elID`로 사용합니다.
- `syn-datafield` : 폼 전송/바인딩 시 사용할 필드명.
- `syn-options` : `defaultSetting`을 덮어쓸 JSON(객체 리터럴) 문자열. 생략하면 `getValue`/`setValue`/`clear`가
  모두 `el.value`를 기준으로 동작합니다(일반 엘리먼트는 `value` 프로퍼티가 없으므로 이 경우 값이 정상적으로
  읽고 쓰이지 않을 수 있습니다). 값을 화면 텍스트/HTML에 반영하려면 `content` 옵션을 명시적으로 지정하는 것을
  권장합니다.
- `syn-events` : 페이지 스크립트의 `<elID>_<eventName>` 핸들러와 연결할 이벤트명 배열.

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `disabled` | boolean | `false` | 비활성화 여부(공통 스키마). Element 자체 로직에서는 별도로 참조하지 않습니다. |
| `checkedValue` | string | `'1'` | `dataType: 'bool'`(또는 `'boolean'`)일 때, 값이 참으로 판정되면 `getValue`가 반환할 값입니다. |
| `uncheckedValue` | string | `'0'` | `dataType: 'bool'`(또는 `'boolean'`)일 때, 값이 거짓으로 판정되면 `getValue`가 반환할 값입니다. |
| `dataType` | string | `'string'` | 값의 데이터 타입. `'string'`(그대로), `'number'`/`'numeric'`(숫자 문자열로 변환), `'bool'`/`'boolean'`(참/거짓 판정 후 `checkedValue`/`uncheckedValue`로 치환) 중 하나입니다. |
| `belongID` | string \| null | `null` | 상위 컨테이너/그룹 식별자(공통 스키마). |
| `getter` | boolean | `false` | 값을 가져올 때 사용할 커스텀 훅 지정 여부(공통 스키마). Element 내부 로직에서는 실제로 분기 처리하지 않습니다. |
| `setter` | boolean | `false` | 값을 설정할 때 사용할 커스텀 훅 지정 여부(공통 스키마). Element 내부 로직에서는 실제로 분기 처리하지 않습니다. |
| `controlText` | any \| null | `null` | 공통 스키마에 포함된 예약 필드로, Element 내부 로직에서는 실제로 사용되지 않습니다. |
| `content` | string \| null | `null` | 값을 어디에 읽고 쓸지 결정합니다. `'value'`(`el.value`), `'html'`(`el.innerHTML`), `'content'`(`el.textContent`), 그 외(생략 포함, 기본 동작)는 `el.innerText`를 사용합니다. |
| `validators` | object \| null | `null` | 유효성 검증 설정(공통 스키마). |
| `transactConfig` | object \| null | `null` | 트랜잭션(서버 호출) 연동 설정(공통 스키마). |
| `triggerConfig` | object \| null | `null` | 트리거 연동 설정(공통 스키마). |

## 메서드

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| controlLoad | `controlLoad(elID, setting)` | 컨트롤 초기화(생성자 역할). `defaultSetting`과 `syn-options`를 병합해 엘리먼트의 `syn-options` 속성에 다시 저장하고, `bindingID`가 있으면 `syn.uicontrols.$data.bindingSource`를 호출합니다. `syn.loader.js`가 화면 스캔 시 자동으로 호출하며, 개발자가 직접 호출할 일은 없습니다. |
| getValue | `getValue(elID, meta)` | `syn-options`의 `content` 값에 따라 `el.value` / `el.innerHTML` / `el.textContent` / `el.innerText` 중 하나를 읽습니다. 이어서 `dataType`이 `number`/`numeric`이면 숫자 문자열로, `bool`/`boolean`이면 `checkedValue`/`uncheckedValue` 중 하나로 변환합니다. `syn-options`가 없으면 `el.value`를 그대로 반환하고, 엘리먼트 자체가 없으면 빈 문자열(`''`)을 반환합니다. |
| setValue | `setValue(elID, value, meta)` | `value`가 `null`/`undefined`가 아닐 때만 동작합니다. `dataType`이 `number`/`numeric`이고 값이 숫자면 통화 형식(`$string.toCurrency`)으로 변환한 뒤, `content` 옵션에 따라 `el.value` / `el.innerHTML` / `el.textContent` / `el.innerText` 중 하나에 씁니다. `syn-options`가 없으면 `el.value`에 씁니다. |
| clear | `clear(elID, isControlLoad)` | `content` 옵션에 따라 값을 빈 문자열로 초기화합니다(`value`/`html`/`content`는 각각 `el.value`/`el.innerHTML`/`el.textContent`를 비우고, 그 외에는 `el.value`를 비웁니다). `syn-options`가 없으면 `el.value`를 비웁니다. |
| setLocale | `setLocale(elID, translations, control, options)` | 다국어 처리 훅입니다. `control.elID`가 있으면 해당 엘리먼트를, 없으면 `[tag][i18n-key]` 셀렉터로 엘리먼트를 찾아 번역된 텍스트를 지정된 바인딩 프로퍼티에 반영합니다. |
| addModuleList | `addModuleList(el, moduleList, setting, controlType)` | 폼 제출 시 참조할 모듈 목록에 컨트롤 정보(`id`, `formDataFieldID`, `field`, `module`, `type`)를 등록하는 내부용 메서드입니다. 직접 호출하지 않습니다. |

## 이벤트 (syn-events)

Element는 별도의 `eventHooks` 배열을 선언하지 않는 컨트롤입니다. 네이티브 엘리먼트를 그대로 사용하기 때문에,
`syn-events` 속성에 등록한 이벤트명은 표준 DOM 이벤트로 그대로 연결됩니다. 즉 브라우저가 지원하는 어떤
이벤트명이든 등록할 수 있으며, 실무에서는 아래 이벤트가 주로 사용됩니다.

| 이벤트명 | 핸들러 시그니처 | 설명 | 발생 시점 |
|---|---|---|---|
| `click` | `<elID>_click(evt)` | 엘리먼트를 클릭했을 때 발생하는 표준 DOM `click` 이벤트입니다. | 엘리먼트 영역 클릭 시 |
| `dblclick` | `<elID>_dblclick(evt)` | 엘리먼트를 더블클릭했을 때 발생하는 표준 DOM `dblclick` 이벤트입니다. | 엘리먼트 영역 더블클릭 시 |

핸들러는 `evt` 인자(네이티브 Event 객체) 하나만 전달받습니다. 현재 값을 확인하려면 핸들러 안에서
`syn.uicontrols.$element.getValue(elID)`를 호출하면 됩니다.

## 참고

- 실행 가능한 예제: `example/basic.html`
- 초보자용 개요와 사용 시나리오: [README.md](./README.md)
- Element는 전용 CSS 파일이 없으므로, 표시 스타일은 페이지의 일반 CSS로 자유롭게 지정하면 됩니다.
