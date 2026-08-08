# ColorPicker API 참조

`syn.uicontrols.$colorpicker` (버전: `v2025.10.1`)

## 마크업

```html
<syn_colorpicker id="clpColor" syn-datafield="Color" syn-options="{
    defaultColor: 'FF0000',
    defineColors: ['FF0000', '00FF00', '0000FF']
}"></syn_colorpicker>
```

`controlLoad` 실행 시 원본 `<syn_colorpicker>` 엘리먼트는 `id`가 `<elID>_hidden`으로 바뀌고 화면에서 숨겨지며(`display:none`), 실제로 화면에 보이는 것은 새로 생성되는 다음 두 엘리먼트입니다.

| 엘리먼트 ID | 설명 |
|---|---|
| `<elID>` | 색상 코드(`#RRGGBB`)를 직접 입력하는 텍스트 입력창. 내부적으로 `syn.uicontrols.$textbox.controlLoad(elID)`로 로드되어 `#SSSSSS` 마스크가 적용된 TextBox 컨트롤입니다. |
| `<elID>_Button` | 클릭하면 색상 팔레트 팝업을 여는 버튼 |

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `elID` | string | `''` | 내부적으로 자동 설정되는 엘리먼트 ID (직접 지정할 필요 없음) |
| `defaultColor` | string \| null | `null` | 초기 색상값. `#` 없이 6자리 16진수 문자열(예: `'FF0000'`)로 지정 |
| `defineColors` | string[] | 20개 사전 정의 색상(`#` 없는 6자리 16진수 배열) | 팔레트 팝업에 표시할 색상 스와치 목록 |
| `dataType` | string | `'string'` | 값의 데이터 타입 |
| `belongID` | string \| string[] \| null | `null` | 이 필드가 속한 트랜잭션 함수 ID |
| `getter` | boolean \| function | `false` | 값을 가져올 때 커스텀 변환 함수 |
| `setter` | boolean \| function | `false` | 값을 설정할 때 커스텀 변환 함수 |
| `controlText` | string \| null | `null` | 컨트롤 라벨/설명 텍스트(검증 메시지 등에 사용) |
| `validators` | array \| null | `null` | 값 검증 규칙 |
| `transactConfig` | object \| null | `null` | 트랜잭션 관련 설정 |
| `triggerConfig` | object \| null | `null` | 다른 컨트롤에 의해 트리거되는 동작 설정 |

## 메서드

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `controlLoad` | `controlLoad(elID, setting)` | 컨트롤 초기화(마크업 상 `<syn_colorpicker>`가 자동으로 호출) |
| `getValue` | `getValue(elID, meta)` | 현재 선택된 색상 코드(`#RRGGBB`) 문자열 반환 |
| `setValue` | `setValue(elID, value, meta)` | 색상 코드(`#RRGGBB`)를 지정 |
| `clear` | `clear(elID, isControlLoad)` | 선택된 색상을 초기화 |
| `getControl` | `getControl(elID)` | 내부 컨트롤 레지스트리 항목(`{ id, picker, setting }`) 반환. `picker`는 CP 라이브러리 인스턴스 |
| `colorConvert` | `colorConvert(convertType, value)` | CP 라이브러리의 색상 변환 유틸리티 호출(예: `'_HSV2HEX'`) — 내부 구현 세부사항이며 일반적인 사용에서는 잘 쓰이지 않음 |
| `setLocale` | `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 (현재 구현은 빈 함수) |

## 이벤트 (syn-events)

ColorPicker는 다른 컨트롤들과 달리 `eventHooks` 목록을 정의하지 않으며, `syn-events`를 통한 `<elID>_<eventName>` 자동 이벤트 와이어링을 지원하지 않습니다.

색상이 바뀌는 시점을 감지하고 싶다면, 화면에 실제로 렌더링되는 텍스트 입력창(`id="<elID>"`)이 TextBox 컨트롤로도 등록되어 있음을 이용하세요. 즉 마크업에 `syn-events="['change']"`를 추가하면 `<elID>_change(evt)` 핸들러가 TextBox의 네이티브 `change` 이벤트로 호출됩니다(색상 코드를 직접 입력하거나 팔레트에서 선택해 코드란 값이 갱신될 때 발생).

## 참고

- 팔레트 팝업은 CP 라이브러리(`/js/color-picker/color-picker.js`, 로더가 자동 주입)가 그리며, `defineColors`에 지정한 색상 스와치 20개가 그 아래에 표시됩니다.
- `getValue`/`setValue` 내부 코드의 지역 변수명이 `dateControl`로 되어 있는데, 이는 다른 날짜류 컨트롤 코드를 복사하면서 남은 이름으로 보이며 실제 동작(색상 값 읽기/쓰기)에는 영향이 없습니다.
- `belongID`를 지정하면 내부 텍스트 입력창(`<elID>`)에도 동일하게 전달되어 트랜잭션 전송 시 값이 포함됩니다.
