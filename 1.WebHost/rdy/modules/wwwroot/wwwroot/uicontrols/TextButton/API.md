# TextButton API 참조

- 네임스페이스: `syn.uicontrols.$button`
- 소스 파일: `/uicontrols/TextButton/TextButton.js`, `/uicontrols/TextButton/TextButton.css`
- 버전(소스에 표기된 값): `v2025.3.1`

## 마크업

TextButton은 커스텀 태그가 아니라 네이티브 `<input>` 요소를 인핸스하는 컨트롤입니다. `js/syn.loader.js`의 컨트롤 판별 로직 기준으로 아래 세 가지 `type` 값이 모두 TextButton(`button` 모듈)으로 로드됩니다.

- `type="button"`
- `type="submit"`
- `type="reset"`

```html
<input
    type="button"
    id="btnSave"
    value="저장"
    syn-datafield="Save"
    syn-options="{toSynControl: true, color: 'primary'}"
    syn-events="['click']" />
```

- `id` : 필수. 컨트롤을 조회/제어할 때 사용하는 식별자(`elID`)입니다.
- `value` : 버튼에 표시되는 라벨이자, `getValue`/`setValue`/`clear`가 다루는 값입니다.
- `syn-options` : `defaultSetting`을 덮어쓸 JSON 문자열(선택).
- `syn-datafield` : 폼 데이터 바인딩용 필드명(선택). `closest('form')`의 `syn-datafield`와 함께 모듈 목록(`addModuleList`)에 등록됩니다.
- `syn-events` : 페이지 스크립트의 `event.<id>_<eventName>` 핸들러와 연결할 이벤트 이름 배열. 예: `['click']`.

CSS 클래스 `ui_textbutton` (및 `.small`, `.searchButton` 변형)이 `TextButton.css`에 정의되어 있지만, `TextButton.js` 코드는 이 클래스를 자동으로 붙여주지 않습니다. 필요하면 마크업에 직접 `class="ui_textbutton small"` 등으로 추가해야 합니다.

## Options (defaultSetting)

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `color` | `'default'` | `toSynControl: true`일 때 버튼에 붙는 클래스 접미사. `btn-{color}` 형태로 클래스가 생성됩니다 (예: `color: 'primary'` → `btn-primary`). |
| `toSynControl` | `false` | `true`로 설정하면 컨트롤 로드 시 요소에 `btn` 클래스와 `btn-{color}` 클래스를 자동으로 추가합니다(이미 해당 색상 클래스가 없을 때만). 부트스트랩류 버튼 스타일 클래스를 자동 적용하고 싶을 때 사용합니다. |
| `dataType` | `'string'` | 이 컨트롤이 다루는 값의 데이터 타입 표기(다른 컨트롤과의 공통 규약용 메타 정보). |
| `belongID` | `null` | 소속 그룹/컨테이너 식별자(공통 규약용 메타 정보). |
| `getter` | `false` | 값 조회 시 커스텀 로직을 연결하기 위한 훅 플래그(공통 규약, TextButton 자체 로직에서는 직접 사용되지 않음). |
| `setter` | `false` | 값 설정 시 커스텀 로직을 연결하기 위한 훅 플래그(공통 규약, TextButton 자체 로직에서는 직접 사용되지 않음). |
| `controlText` | `null` | 다국어/커스텀 라벨 텍스트 지정용 공통 옵션(공통 규약, TextButton 자체 로직에서는 직접 사용되지 않음. `setLocale`도 빈 함수라 현재 구현에서는 동작하지 않습니다). |
| `validators` | `null` | 유효성 검사 규칙(공통 규약용, `syn.$v` 밸리데이터와 연동되는 다른 컨트롤에서 주로 사용). |
| `transactConfig` | `null` | 트랜잭션 연동 설정(공통 규약용 메타 정보). |
| `triggerConfig` | `null` | 트리거 연동 설정(공통 규약용 메타 정보). |

주의: 위 옵션 중 `color`, `toSynControl`을 제외한 나머지는 `defaultSetting`에 선언만 되어 있을 뿐, `TextButton.js`의 `controlLoad`/`getValue`/`setValue`/`clear` 로직 안에서 실제로 분기 처리되지 않습니다. 다른 `syn.uicontrols` 컨트롤들과 설정 스키마를 통일하기 위한 공통 필드로 보입니다.

## 메서드

| 메서드 | 시그니처 | 설명 |
| --- | --- | --- |
| `controlLoad` | `controlLoad(elID, setting)` | 컨트롤 초기화. `syn.loader.js`가 해당 `<input>`을 발견하면 자동으로 호출합니다. `setting`을 `defaultSetting`과 병합하고, 페이지 스크립트에 `hook.controlInit(elID, setting)`이 정의되어 있으면 그 결과도 병합합니다. `toSynControl: true`이면 `btn`/`btn-{color}` 클래스를 추가하고, 최종 설정을 `syn-options` 속성에 다시 기록합니다. `setting.bindingID`가 있고 `syn.uicontrols.$data`가 로드되어 있으면 데이터 소스 바인딩도 수행합니다. |
| `getValue` | `getValue(elID, meta)` | `elID` 요소의 `value` 속성 값을 그대로 반환합니다. |
| `setValue` | `setValue(elID, value, meta)` | `elID` 요소의 `value` 속성에 값을 설정합니다(버튼 라벨이 변경됩니다). |
| `clear` | `clear(elID, isControlLoad)` | `elID` 요소의 `value`를 빈 문자열로 초기화합니다(버튼 라벨이 지워집니다). |
| `setLocale` | `setLocale(elID, translations, control, options)` | 다국어 처리용 훅이지만, 현재 구현은 빈 함수(no-op)입니다. |
| `addModuleList` | `addModuleList(el, moduleList, setting, controlType)` | 폼 전체 컨트롤 목록을 수집하는 내부 유틸리티. `id`, 소속 폼의 `syn-datafield`, 자신의 `syn-datafield`, 모듈명, 컨트롤 타입을 `moduleList` 배열에 push합니다. 페이지 스크립트에서 직접 호출할 일은 거의 없습니다. |

## 이벤트 (syn-events)

TextButton 자체는 자신만의 전용 이벤트를 정의하지 않습니다. `syn-events="['click']"`처럼 표준 DOM 이벤트 이름을 배열로 지정하면, `syn` 프레임워크의 공통 이벤트 바인딩 로직이 페이지 스크립트의 `event.<elID>_<eventName>` 함수를 자동으로 연결합니다.

| 이벤트 이름 | 핸들러 예시 | 설명 |
| --- | --- | --- |
| `click` | `event.btnSave_click(args)` | 버튼 클릭 시 호출됩니다. 대부분의 TextButton 사용 사례에서 필요한 유일한 이벤트입니다. |

`change`, `focus`, `blur` 등 다른 표준 DOM 이벤트도 동일한 방식(`syn-events`에 이름 추가)으로 연결할 수 있지만, 버튼 요소 특성상 `click` 외에는 거의 사용되지 않습니다.

## 참고

이 문서는 `/sample/uicontrol/` 폴더와 `qcn.groupware` 등 실사용 코드베이스를 조사했으나 TextButton(`type="button"` 인핸스) 전용 샘플이나 실사용 예시를 찾지 못해, 오직 `TextButton.js`, `TextButton.css` 소스코드 정독만을 근거로 작성되었습니다. 다른 컨트롤 샘플(`checkbox.html`/`checkbox.js` 등)에서 반복적으로 등장하는 `<input type="button" ... syn-events="['click']" />` 패턴을 교차 확인하여 마크업 형태의 신뢰도를 보강했습니다.
