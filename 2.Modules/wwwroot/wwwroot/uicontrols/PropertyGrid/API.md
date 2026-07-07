# PropertyGrid API 참조

싱글턴 객체: `syn.uicontrols.$propertygrid`
소스 파일: `wwwroot/uicontrols/PropertyGrid/PropertyGrid.js`, `wwwroot/uicontrols/PropertyGrid/PropertyGrid.css`

## 마크업

PropertyGrid는 네이티브 태그가 아니라 `<syn_propertygrid>` 커스텀 태그로 사용합니다.

```html
<syn_propertygrid id="pgSample" syn-options="{
    data: { Name: '홍길동', Age: 32, UseYN: true, FavoriteColor: '#2563eb' },
    meta: {
        Age: { group: 'General', description: '나이(세)' }
    },
    sort: false,
    isCollapsible: false,
    callback: '$mypage.handleChange'
}"></syn_propertygrid>
```

- `id`는 페이지 내에서 유일해야 하며, `syn.uicontrols.$propertygrid`의 각종 메서드에서 이 `id`(elID)를 사용합니다.
- `data`(또는 `value`)에 넣은 객체의 각 속성(key)이 한 줄(행)이 되고, `meta`가 없으면 `autoMeta`가 값의 자바스크립트 타입을 보고 입력 위젯 종류를 자동으로 정합니다.
- `callback`은 함수를 직접 넣거나, `"$페이지스크립트.함수명"`처럼 점(`.`)으로 구분된 경로 문자열을 넣을 수 있습니다. 문자열이면 `controlLoad` 시점에 `window`부터 경로를 따라가며 실제 함수로 해석(`resolveCallback`)됩니다. 값이 바뀔 때마다 `callback(element, name, value, control)` 형태로 호출됩니다.
- `syn-options`는 최초 렌더링에만 적용됩니다. 데이터를 바꿔서 다시 그리려면 `setValue(elID, value, meta)`를 호출하세요.

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `data` | object \| null | `null` | 그리드에 표시할 원본 값. `value`보다 우선합니다. 객체가 아니면(`null`, 배열 등) 빈 객체로 취급합니다. |
| `value` | object \| null | `null` | `data`가 없을 때 사용하는 표시 값(하위 호환용 별칭). |
| `meta` | object \| null | `null` | 속성명별 메타 정보(`{ 속성명: { group, type, options, description, ... } }`). 자세한 내용은 [meta 옵션](#meta-옵션-속성명별-표시-방식) 참고. |
| `customTypes` | object \| null | `null` | `meta.type`으로 참조할 수 있는 사용자 정의 입력 위젯(`{ 타입명: { html, valueFn 또는 makeValueFn } }`). |
| `helpHtml` | string | `'[?]'` | `meta.description`이 있을 때 라벨 옆에 표시되는 도움말 아이콘(툴팁 트리거)의 HTML |
| `sort` | boolean \| function | `false` | 속성 이름 정렬 여부. `true`면 사전순 정렬, 함수를 넣으면 `Array.prototype.sort`의 비교 함수로 사용됩니다. |
| `isCollapsible` | boolean | `false` | `true`면 그룹 제목 행을 클릭해 해당 그룹의 속성 행을 접고 펼 수 있습니다. |
| `defaultGroupName` | string | `'Other'` | `meta.group`을 지정하지 않은 속성이 속하는 기본 그룹명 |
| `mode` | string | `''` | 내부적으로 `'defaultSetting'`을 지정하면 `meta`가 없는 속성에 대해 그룹/설명을 자동 추론합니다(`createDefaultSettingMeta` 참고). 일반적인 사용에서는 비워 둡니다. |
| `autoMeta` | boolean | `true` | `meta.type`이 없을 때 값의 자바스크립트 타입(`boolean`/`number`/`function`/객체·배열·`null`·`undefined` → `json`/`#rrggbb` 형식 문자열 → `color`)을 보고 입력 위젯 타입을 자동으로 정할지 여부 |
| `jsonRows` | number | `5` | `type: 'json'` 또는 `type: 'function'`일 때 기본으로 표시할 `<textarea>` 줄 수(`meta.rows`로 속성별 재정의 가능) |
| `includeFunctions` | boolean | `true` | `false`로 지정하면 값이 함수인 속성은 목록에서 제외합니다. |
| `classNames` | string | `'syn-propertygrid'` | 그리드 최상위 엘리먼트에 추가되는 CSS 클래스 |
| `callback` | function \| string \| null | `null` | 값이 바뀔 때마다 `(element, name, value, control)`로 호출되는 콜백. 문자열이면 점 경로로 함수를 찾아 해석합니다. |
| `dataType` | string | `'object'` | 다른 컨트롤과 형식을 맞추기 위한 공통 속성 |
| `belongID` / `getter` / `setter` / `controlText` / `validators` / `transactConfig` / `triggerConfig` | - | `null`/`false` | syn.uicontrols 공통 옵션(값 바인딩·유효성검사·트랜잭션 연동용) |

### meta 옵션 (속성명별 표시 방식)

`meta`는 `{ 속성명: { ... } }` 형태이며, 각 속성별로 다음 키를 지정할 수 있습니다.

| 속성 | 타입 | 설명 |
|---|---|---|
| `name` | string | 라벨에 표시할 이름. 생략하면 속성명(key) 그대로 표시합니다. |
| `group` | string | 이 속성이 속할 그룹명. 같은 그룹명끼리 묶여서 그룹 제목 행 아래에 표시됩니다. |
| `type` | string | 입력 위젯 종류. 아래 [type별 입력 위젯](#type별-입력-위젯) 참고. 생략하고 `autoMeta: true`이면 값의 타입으로 자동 추론합니다. |
| `options` | array \| object | `type: 'options'`일 때 선택 목록(문자열 배열 또는 `{value, text}` 배열), `type: 'number'`일 때 `{min, max, step}` |
| `description` | string | 라벨 옆 도움말 아이콘(`helpHtml`)에 표시할 툴팁 텍스트 |
| `showHelp` | boolean | `false`로 지정하면 도움말 아이콘 대신 입력 엘리먼트의 `title` 속성으로 설명을 붙입니다. |
| `readonly` / `readOnly` | boolean | 입력 엘리먼트에 `readonly` 속성 부여(둘 중 하나라도 `true`면 적용) |
| `disabled` | boolean | 입력 엘리먼트에 `disabled` 속성 부여 |
| `placeholder` | string | 입력 엘리먼트의 `placeholder` 속성 |
| `browsable` | boolean | `false`로 지정하면 이 속성 행 자체를 렌더링하지 않습니다. |
| `colspan2` | boolean | `true`면 라벨 열 없이 값 입력 엘리먼트가 전체 2칸(colspan)을 차지합니다. |
| `rows` | number | `type: 'json'` / `'function'`일 때 `<textarea>` 줄 수(`jsonRows` 재정의) |

### type별 입력 위젯

| `type` 값 | 입력 위젯 | 비고 |
|---|---|---|
| (생략, `autoMeta: true`) | 값의 자바스크립트 타입에 따라 자동 결정 | `boolean`→체크박스, `number`→숫자, `function`→읽기전용 함수 텍스트, 객체/배열/`null`/`undefined`→JSON, `#rrggbb` 문자열→색상, 그 외→일반 텍스트 |
| `'boolean'` | `<input type="checkbox">` | |
| `'number'` | `<input type="number">` | `options.min`/`max`/`step` 적용 |
| `'options'` | `<select>` | `options` 배열 필요(문자열 배열 또는 `{value, text}` 배열) |
| `'color'` | `<input type="color">` | 값이 `#rrggbb` 형식이 아니면 `#000000`으로 보정 |
| `'label'` | 읽기 전용 `<label>` | 값을 그대로 텍스트로 표시(편집 불가) |
| `'json'` | `<textarea>` | `JSON.stringify`로 표시, 저장 시 `JSON.parse`. 파싱 실패 시 `pgInvalid` 클래스가 붙고 이전 값이 유지됩니다. |
| `'function'` | 읽기 전용 `<textarea>` | 함수 소스코드(`toString()`)를 표시만 하며 값 자체는 원본 함수가 그대로 유지됩니다. |
| 그 외(사용자 정의) | `customTypes[type]` | 아래 [customTypes](#customtypes-사용자-정의-입력-위젯) 참고 |
| (매칭 없음) | `<input type="text">` | 기본값 |

### customTypes (사용자 정의 입력 위젯)

`meta.type`에 표준 타입에 없는 이름을 쓰고 싶다면, `customTypes`에 같은 이름의 정의를 등록합니다.

```js
customTypes: {
    rating: {
        html(elemId, name, value, meta) {
            return `<input type="range" id="${elemId}" min="0" max="5" value="${value || 0}">`;
        },
        valueFn(elemId, name) {
            var element = document.getElementById(elemId);
            return element ? Number(element.value) : 0;
        }
    }
}
```

| 키 | 필수 | 설명 |
|---|---|---|
| `html(elemId, name, value, meta)` | 예 | 입력 엘리먼트의 HTML 문자열(또는 DOM 노드)을 반환합니다. 최상위 엘리먼트가 하나가 아니면 `span.pgCustomValue`로 감쌉니다. |
| `valueFn(elemId, name)` | `makeValueFn`이 없으면 예 | `getValue` 호출 시 현재 값을 읽어오는 함수. 지정하지 않으면 `document.getElementById(elemId).value`를 기본으로 사용합니다. |
| `makeValueFn(elemId, name, value, meta)` | 아니오 | `valueFn` 대신, 렌더링 시점에 클로저로 `valueFn`을 직접 만들어야 할 때 사용합니다. 반환값이 실제 `valueFn`으로 등록됩니다. |

> 주의: `customTypes`로 렌더링한 입력 엘리먼트는 `bindChange`(change/input/keyup/paste 자동 연결)가 적용되지 않습니다. `callback`을 실시간으로 받으려면 `html`에서 만든 엘리먼트에 직접 이벤트를 연결하세요.

## 메서드

`syn.uicontrols.$propertygrid.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| controlLoad | `controlLoad(elID, setting)` | 컨트롤 초기화(생성자 역할). `syn.loader.js`가 화면 스캔 시 자동으로 호출하며, 개발자가 직접 호출할 일은 없습니다. |
| render | `render(elID, value, setting)` | 주어진 `value`/`setting`으로 그리드 테이블을 새로 그립니다. `setValue`가 내부적으로 사용합니다. |
| getValue | `getValue(elID, meta)` | 각 속성의 현재 입력값을 모아 `{ 속성명: 값 }` 객체로 반환합니다. |
| setValue | `setValue(elID, value, meta)` | 기존 `runtimeSetting`(또는 `setting`)을 유지한 채, 새 `value`(와 선택적으로 새 `meta`)로 그리드를 다시 그립니다. |
| clear | `clear(elID, isControlLoad)` | 그리드 내용(테이블 DOM과 내부 `valueFuncs`/`fields`)을 모두 비웁니다. |
| getControl | `getControl(elID)` | 등록된 컨트롤 정보(`{ id, sequence, setting, runtimeSetting, valueFuncs, fields }`)를 반환합니다. |
| createDefaultSettingMeta | `createDefaultSettingMeta(defaultSetting, meta)` | 다른 컨트롤의 `defaultSetting` 객체를 받아, 이 PropertyGrid로 "설정값 편집기"를 만들 때 쓸 `meta`를 자동 생성합니다(그룹/설명 자동 추론, `mode: 'defaultSetting'`). |
| inferType | `inferType(value)` | 값 하나를 보고 `autoMeta`가 사용하는 위젯 타입 문자열을 반환합니다. |
| normalizeSource | `normalizeSource(value)` | 객체가 아니거나 배열이면 빈 객체(`{}`)로 바꿔 반환합니다. |
| resolveCallback | `resolveCallback(callback)` | 함수는 그대로, 점(`.`) 경로 문자열은 `window`부터 따라가며 실제 함수로 변환해 반환합니다. |
| toSerializableSetting | `toSerializableSetting(setting)` | `setting`에서 함수 타입 값을 제외한 사본을 반환합니다(`syn-options` 속성 직렬화용). |
| addModuleList | `addModuleList(el, moduleList, setting, controlType)` | 폼 제출 시 참조할 모듈 목록에 컨트롤 정보를 등록하는 내부용 메서드입니다. 직접 호출하지 않습니다. |
| setLocale | `setLocale(elID, translations, control, options)` | 다국어 처리 훅입니다. PropertyGrid는 현재 별도 구현 없이 빈 함수로 제공됩니다. |

## 이벤트 (syn-events)

PropertyGrid는 `syn-events`로 연결되는 `<elID>_<이벤트명>` 방식의 이벤트 훅을 별도로 선언하지 않습니다. 대신, 값이 바뀔 때마다 `syn-options`의 `callback` 함수가 `(element, name, value, control)` 인자로 직접 호출됩니다.

```html
<syn_propertygrid id="pgEvents" syn-options="{
    data: { NotifyYN: true, Volume: 50 },
    callback: '$this.method.handleChange'
}"></syn_propertygrid>
```

```js
'use strict';
let $mypage = {
    method: {
        handleChange(element, name, value, control) {
            syn.$l.eventLog('pgEvents_change', name + ' = ' + JSON.stringify(value));
        }
    }
}
```

- `element` : 값이 바뀐 입력 엘리먼트(DOM)
- `name` : 속성명(key)
- `value` : 변환된 현재 값(체크박스는 boolean, number는 숫자, json은 파싱된 값 등)
- `control` : `getControl(elID)`가 반환하는 것과 같은 컨트롤 정보 객체

`customTypes`로 만든 사용자 정의 입력 위젯에는 `callback`이 자동으로 연결되지 않으므로, 필요하면 `html`로 만든 엘리먼트에 직접 이벤트 리스너를 붙이세요.

## 참고

- 실행 가능한 예제: `example/basic.html`, `example/options.html`, `example/events.html`
- 초보자용 개요와 사용 시나리오: [README.md](./README.md)
- 스타일 커스터마이징: `PropertyGrid.css`의 `.syn-propertygrid`, `.pgTable`, `.pgGroupRow`, `.pgRow`, `.pgInput`, `.pgInvalid` 클래스를 통해 색상/레이아웃을 재정의할 수 있습니다.
