# PropertyGrid 사용법

`PropertyGrid`는 `2.Modules/wwwroot/wwwroot/uicontrols` 아래 컨트롤들의 `defaultSetting` 객체를 조회하고 수정하기 위한 설정 편집 컨트롤이다. `jqPropertyGrid` 예제를 기반으로 했지만 jQuery, jQuery UI, Spectrum 의존성은 없다.

## 대상 데이터

주 관리 대상은 각 컨트롤 모듈의 `defaultSetting`이다.

```javascript
syn.uicontrols.$textbox.defaultSetting
syn.uicontrols.$select.defaultSetting
syn.uicontrols.$codepicker.defaultSetting
syn.uicontrols.$fileclient.defaultSetting
```

`defaultSetting`에는 문자열, 숫자, 불리언뿐 아니라 `null`, `undefined`, 배열, 중첩 객체, 함수가 섞여 있다. PropertyGrid는 이를 자동 추론해서 편집 UI로 바꾼다.

## 파일 로딩

개별 페이지에서 직접 사용할 때는 다음 순서로 로딩한다.

```html
<link rel="stylesheet" href="/uicontrols/PropertyGrid/PropertyGrid.css">
<script src="/js/syn.js"></script>
<script src="/uicontrols/PropertyGrid/PropertyGrid.js"></script>
```

번들로 사용할 때는 `2.Modules/wwwroot/gulpfile.js`의 `controls`, `styles`, `basestyles` 목록에 등록되어 있으므로 빌드 후 `syn.controls.js`와 CSS 번들에 포함된다.

## defaultSetting 편집

```html
<div id="propGrid"></div>
```

```javascript
var setting = syn.uicontrols.$textbox.defaultSetting;
var meta = syn.uicontrols.$propertygrid.createDefaultSettingMeta(setting, {
    editType: { type: 'options', options: ['text', 'number', 'date', 'email'] },
    dataType: { type: 'options', options: ['string', 'number', 'boolean', 'object'] },
    validators: { rows: 6 },
    transactConfig: { rows: 6 },
    triggerConfig: { rows: 6 }
});

syn.uicontrols.$propertygrid.controlLoad('propGrid', {
    value: setting,
    meta: meta,
    mode: 'defaultSetting',
    isCollapsible: true,
    sort: true
});

var editedSetting = syn.uicontrols.$propertygrid.getValue('propGrid');
```

`mode: 'defaultSetting'`은 속성명을 기준으로 `General`, `Behavior`, `Layout`, `Data Source`, `Binding`, `Advanced` 그룹을 자동 지정한다.

## 자동 타입 추론

| 값 | 기본 타입 | UI |
| --- | --- | --- |
| `boolean` | `boolean` | 체크박스 |
| `number` | `number` | 숫자 입력 |
| `#RRGGBB` 문자열 | `color` | 색상 입력 |
| `null`, `undefined`, 배열, 객체 | `json` | JSON textarea |
| `function` | `function` | 읽기 전용 textarea |
| 그 외 문자열 | text | 텍스트 입력 |

`json` 타입은 `JSON.parse`로 값을 복원한다. 잘못된 JSON을 입력하면 필드에 오류 스타일을 표시하고 이전 값을 유지한다.

## 설정 옵션

| 옵션 | 설명 |
| --- | --- |
| `value` 또는 `data` | 화면에 표시할 객체 |
| `meta` | 속성별 표시 이름, 그룹, 타입, 설명 정의 |
| `mode` | `defaultSetting`이면 컨트롤 설정용 그룹/설명을 자동 보강 |
| `autoMeta` | 타입 자동 추론 여부, 기본값 `true` |
| `customTypes` | 기본 타입 외 사용자 렌더러 |
| `helpHtml` | 설명 툴팁 옆에 표시할 HTML 또는 텍스트 |
| `sort` | `true` 또는 정렬 함수 |
| `isCollapsible` | 그룹 접기/펼치기 사용 여부 |
| `jsonRows` | `json`/`function` textarea 기본 줄 수 |
| `includeFunctions` | 함수 속성 표시 여부, 기본값 `true` |
| `callback` | 값 변경 시 호출할 함수 또는 전역 함수 경로 문자열 |
| `defaultGroupName` | 그룹이 없는 속성의 기본 그룹명 |

## meta 속성

| 속성 | 설명 |
| --- | --- |
| `browsable` | `false`면 해당 속성을 숨긴다 |
| `group` | 그룹 헤더명 |
| `name` | 표시 이름 |
| `type` | `boolean`, `number`, `color`, `options`, `json`, `function`, `label` 또는 custom type |
| `options` | `number`의 `min/max/step`, `options` 타입의 선택 목록 |
| `rows` | `json`/`function` textarea 줄 수 |
| `description` | 툴팁 설명 |
| `showHelp` | `false`면 도움말 표시 대신 값 요소의 `title`로 설명을 둔다 |
| `colspan2` | `true`면 이름 칸 없이 값 영역이 두 칸을 차지한다 |
| `readonly` 또는 `readOnly` | 입력 요소를 읽기 전용으로 만든다 |
| `disabled` | 입력 요소를 비활성화한다 |
| `placeholder` | 입력 요소 placeholder |

## 함수와 undefined

`defaultSetting`에는 `footerCallback`, `fileChangeHandler`처럼 JSON으로 표현할 수 없는 값이 있을 수 있다.

- 함수는 기본적으로 읽기 전용 textarea로 표시하고 `getValue`에서는 원래 함수 참조를 반환한다.
- `undefined`는 textarea에 `undefined`로 표시하고 `getValue`에서도 `undefined`를 반환한다.
- 실제 JSON 파일로 저장할 때는 함수와 `undefined`를 제외하거나 별도 문자열 규칙으로 치환해야 한다.

## customTypes

```javascript
var customTypes = {
    textarea: {
        html: function (elemId, name, value, meta) {
            return '<textarea id="' + elemId + '">' + value.join('\n') + '</textarea>';
        },
        makeValueFn: function (elemId) {
            return function () {
                return document.getElementById(elemId).value.split('\n');
            };
        }
    }
};
```

`html(elemId, name, value, meta)`는 문자열 또는 DOM `Node`를 반환할 수 있다. `makeValueFn` 또는 `valueFn`을 제공하면 `getValue`에서 해당 값을 읽는다.

## 메서드

| 메서드 | 설명 |
| --- | --- |
| `controlLoad(elID, setting)` | 컨트롤 초기화 |
| `render(elID, value, setting)` | 같은 컨테이너에 다시 렌더링 |
| `getValue(elID)` | 현재 입력값 객체 반환 |
| `setValue(elID, value, meta)` | 값 객체로 다시 렌더링 |
| `clear(elID)` | 컨테이너 내용 제거 |
| `getControl(elID)` | 내부 컨트롤 상태 조회 |
| `createDefaultSettingMeta(defaultSetting, meta)` | `defaultSetting`용 메타 자동 생성 |

## 예제 실행

`ack` 정적 파일 서버를 실행한 뒤 아래 URL로 확인한다.

```text
http://localhost:8421/uicontrols/PropertyGrid/example/index.html
```

브라우저에서 `2.Modules/wwwroot/wwwroot/uicontrols/PropertyGrid/example/index.html` 파일을 직접 열어도 상대 경로로 동작한다.
