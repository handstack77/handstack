# CodePicker API 참조

`syn.uicontrols.$codepicker`

CodePicker는 코드값 검색 팝업 패턴을 구현한 컨트롤입니다. 아래 내용은 `1.WebHost/rdy/modules/wwwroot/wwwroot/uicontrols/CodePicker/CodePicker.js` 소스 코드를 기준으로 정리했습니다.

## 마크업

```html
<syn_codepicker id="chpCompanyID" syn-datafield="CompanyID" syn-options="{
    belongID: 'LD01',
    dataSourceID: 'BDLCHP011',
    local: false,
    codeElementClass: 'hidden',
    isMultiSelect: false,
    textBelongID: ['LD01'],
    textDataFieldID: 'CompanyName',
    controlText: '업체 명'
}"></syn_codepicker>
```

`controlLoad`가 실행되면 원래의 `<syn_codepicker id="chpCompanyID">` 태그는 `id="chpCompanyID_hidden"`으로 이름이 바뀌고 `display: none`으로 숨겨진 뒤, 그 자리에 다음 3개의 실제 엘리먼트가 순서대로 생성됩니다.

| 엘리먼트 id | 역할 |
| --- | --- |
| `<id>_Code` | 코드값(실제 값)을 담는 `<input type="text">`. `syn-datafield`가 지정되어 있으면 이 값이 폼 데이터 필드와 연결됩니다. |
| `<id>_Text` | 코드값에 대응하는 이름(텍스트)을 보여주는 `<input type="text">`. `textDataFieldID`가 있으면 그 필드와 연결됩니다. |
| `<id>_Button` | 돋보기 아이콘 버튼(`<button>`). 클릭하면 검색 팝업이 열립니다. |

- `codeElementClass: 'hidden'`처럼 지정하면 `_Code` 입력창을 화면에서 숨기고 `_Text`만 보여주는 형태로 구성할 수 있습니다(값은 여전히 `_Code`에 저장됨).
- `getValue`/`setValue`는 항상 `_Code`(코드값) 기준으로 동작하고, 화면에 보이는 이름은 `setText`로 별도 제어합니다.
- `syn-options`는 JavaScript 객체 리터럴 문자열이며 `defaultSetting`을 덮어씁니다.

## Options (defaultSetting)

| 옵션 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `dataSourceID` | string \| null | `null` | 검색 팝업이 조회할 데이터소스 ID. 필수값이며, 지정하지 않으면 `find()` 호출 시 콘솔에 디버그 로그만 남기고 팝업이 열리지 않습니다. |
| `storeSourceID` | string \| null | `null` | 데이터 캐시 키. 지정하지 않으면 `dataSourceID` 값을 그대로 사용합니다. |
| `local` | boolean | `true` | 팝업(코드도움 화면) 쪽에서 로컬/원격 데이터소스 여부를 판단하는 데 사용되는 값입니다. |
| `parameters` | string | `''` | 검색 팝업에 전달할 조회 조건 문자열(`@Key:Value;` 형태). `@ApplicationID`, `@CompanyNo`, `@LocaleID`는 지정하지 않아도 `find()`가 자동으로 앞에 추가합니다. |
| `label` / `labelWidth` | string | `''` | 라벨 텍스트 및 너비(용도별 커스텀 표시에 사용). |
| `codeElementID` | string | `''` | `_Code` 엘리먼트 id. `find()` 호출 시 내부적으로 `<elID>_Code`로 자동 설정됩니다. |
| `codeElementWidth` | string | `''` | `_Code` 입력창 너비(CSS 값, 예: `'120px'`). |
| `codeElementClass` | string | `''` | `_Code` 입력창에 추가할 CSS 클래스(예: `'hidden'`으로 지정하면 코드값 입력창을 화면에서 숨김). |
| `textElementID` | string | `''` | `_Text` 엘리먼트 id. `find()` 호출 시 내부적으로 `<elID>_Text`로 자동 설정됩니다. |
| `textElementWidth` | string | `''` | `_Text` 입력창 너비(CSS 값). |
| `textElementClass` | string | `''` | `_Text` 입력창에 추가할 CSS 클래스. |
| `required` | boolean | `false` | `true`면 `_Code`, `_Text` 입력창에 `required` 속성을 추가합니다. |
| `readonly` | boolean | `false` | `true`면 `_Code`, `_Text` 입력창을 읽기 전용으로 만듭니다(팝업은 여전히 열 수 있음). |
| `disabled` | boolean | `false` | `true`면 `_Code`, `_Text` 입력창을 비활성화합니다. |
| `textBelongID` | string \| string[] \| null | `null` | `_Text` 입력창 내부 textbox 컨트롤의 `belongID`(다국어/그룹 식별용). 배열도 지정 가능합니다. |
| `textDataFieldID` | string \| null | `null` | `_Text` 입력창에 연결할 `syn-datafield` 이름(코드명을 저장할 폼 필드). |
| `searchValue` / `searchText` | string | `''` | 팝업을 열 때 초기 검색어로 전달되는 값(코드값/코드명). 버튼 클릭 시 현재 `_Code`/`_Text` 값으로 자동 갱신됩니다. |
| `isMultiSelect` | boolean | `false` | `true`면 팝업에서 여러 항목을 선택할 수 있고, 선택 결과가 콤마(`,`)로 연결된 문자열로 `_Code`/`_Text`에 채워집니다. |
| `isAutoSearch` | boolean | `true` | 팝업 화면 자체의 자동 검색 여부(코드도움 화면 쪽 동작에 사용되는 전달값). |
| `isSingleAutoReturn` | boolean | `true` | 단일 결과일 때 팝업에서 바로 자동으로 선택 처리할지 여부(코드도움 화면 쪽 동작에 사용되는 전달값). |
| `isOnlineData` | boolean | `false` | 온라인(실시간) 데이터 여부 플래그(코드도움 화면 쪽 동작에 사용되는 전달값). |
| `viewType` | string | `''` | 선택 결과를 어디에 반영할지 지정. `find()` 내부에서 폼 컨트롤이면 `'form'`, WebGrid 셀이면 `'grid'`, AUIGrid 셀이면 `'auigrid'`로 자동 설정됩니다. |
| `sharedAssetUrl` | string | `''` | 공용 자원 기준 경로. 비어 있으면 `syn.Config.SharedAssetUrl`을 사용합니다. |
| `dataType` | string | `'string'` | 값의 데이터 타입. |
| `belongID` | string \| string[] \| null | `null` | `_Code` 입력창 내부 textbox 컨트롤의 `belongID`(다국어/그룹 식별용). 배열도 지정 가능합니다. |
| `getter` / `setter` | boolean | `false` | 값 조회/설정 시 커스텀 훅 사용 여부. |
| `controlText` | string \| null | `null` | 검색 팝업 다이얼로그의 제목(`caption`)에 사용됩니다. 지정하지 않으면 `columnText` → `headerText` → `dataSourceID` 순으로 대체됩니다. |
| `validators` | object \| null | `null` | 유효성 검사 규칙. |
| `transactConfig` / `triggerConfig` | object \| null | `null` | 트랜잭션/트리거 연동 설정. |

## 메서드

| 메서드 | 설명 |
| --- | --- |
| `controlLoad(elID, setting)` | 컨트롤 초기화. `_Code`/`_Text`/`_Button` 엘리먼트를 생성하고 이벤트를 바인딩합니다. 보통 페이지 로더가 자동으로 호출하므로 직접 호출할 일은 거의 없습니다. |
| `find(setting, callback)` | 검색 팝업(코드도움 다이얼로그)을 엽니다. `dataSourceID`가 없으면 동작하지 않습니다. 팝업에서 선택이 끝나면 `viewType`에 따라 `_Code`/`_Text`(form), WebGrid 셀(grid), AUIGrid 셀(auigrid)에 결과를 반영하고 `callback(result)`을 호출합니다. 돋보기 버튼 클릭 시 내부적으로 자동 호출됩니다. |
| `open(elID)` | 돋보기 버튼(`<elID>_Button`) 클릭을 코드로 트리거해서 검색 팝업을 엽니다. |
| `getValue(elID, meta)` | `<elID>_Code`의 현재 값(코드값)을 반환합니다. |
| `setValue(elID, value, meta)` | `<elID>_Code`에 코드값을 직접 설정합니다. (코드명 `_Text`는 함께 바뀌지 않으므로 필요하면 `setText`를 같이 호출) |
| `setText(elID, value, meta)` | `<elID>_Text`에 코드명(표시 텍스트)을 직접 설정합니다. |
| `clear(elID, isControlLoad)` | `_Code`와 `_Text` 값을 모두 빈 문자열로 초기화합니다. |
| `toParameterString(jsonObject)` | `{ Key: 'Value' }` 형태의 객체를 `'@Key:Value;'` 형태의 파라미터 문자열로 변환합니다. |
| `toParameterObject(parameters)` | `'@Key:Value;'` 형태의 파라미터 문자열을 `{ Key: 'Value' }` 객체로 변환합니다. |
| `setLocale(elID, translations, control, options)` | 다국어(로케일) 텍스트 적용용 훅(현재 구현은 비어 있음). |

## 이벤트 (syn-events)

CodePicker는 컨트롤 자체에 별도의 커스텀 이벤트 시스템을 두지 않고, 페이지 스크립트의 `event` 객체에 정의한 핸들러를 컨트롤 내부 로직이 직접 찾아서 호출하는 방식으로 동작합니다.

| 핸들러 이름 | 호출 시점 | 인자 |
| --- | --- | --- |
| `<elID>_change(elID, inputValue, inputText, result)` | `_Code`/`_Text` 입력창에서 값이 바뀌었을 때(Enter가 아닌 일반 변경), 또는 검색 팝업에서 선택을 완료했을 때 | `elID`: 컨트롤 id, `inputValue`: 코드값, `inputText`: 코드명, `result`: 팝업에서 선택 완료 시 선택된 원본 데이터 배열(직접 입력으로 바뀐 경우는 `null`) |
| `<elID>_buttonClick(elID, synOptions)` | 돋보기 버튼을 클릭해서 팝업이 열리기 직전 | `elID`: 컨트롤 id, `synOptions`: 팝업에 전달될 설정값(현재 `_Code`/`_Text` 값 포함) |

또한 `mod.hook.frameEvent(eventName, jsonObject)` 훅이 정의되어 있으면 다음 시점에 호출됩니다.

| eventName | 호출 시점 |
| --- | --- |
| `'codeInit'` | `find()` 실행 직전, 팝업에 전달할 설정을 보완할 수 있는 시점 |
| `'codeReturn'` | 팝업에서 선택을 완료해 결과가 반영된 직후 (`{ elID, result }` 전달) |

일반적인 `_Code`/`_Text` 입력창은 `keydown`, `change` 이벤트가 항상 바인딩되어 있으며, 페이지 마크업의 `syn-events` 속성에 지정한 이벤트가 있으면 그대로 추가됩니다.

```html
<syn_codepicker id="chpCompanyID" syn-events="['change']" syn-options="{...}"></syn_codepicker>
```

```js
event: {
    chpCompanyID_change(elID, inputValue, inputText, result) {
        syn.$l.eventLog('chpCompanyID_change', JSON.stringify({ elID, inputValue, inputText, result }));
    },

    chpCompanyID_buttonClick(elID, synOptions) {
        syn.$l.eventLog('chpCompanyID_buttonClick', elID);
    }
}
```

## 참고: 팝업 콜백/선택 결과 처리 방식

1. 사용자가 돋보기 버튼(`<elID>_Button`)을 클릭하거나 `_Code`/`_Text` 입력창에서 Enter를 누르면 `_Button`의 `click` 이벤트가 발생합니다.
2. `click` 핸들러는 `<elID>_hidden` 엘리먼트의 `syn-options`를 읽어 현재 설정값(`synOptions`)을 만들고, `elID`, `viewType: 'form'`, `codeElementID`, `textElementID`, 그리고 현재 `_Code`/`_Text` 값을 채워 넣습니다.
3. `mod.event[<elID>_buttonClick]`이 있으면 먼저 호출됩니다.
4. `syn.uicontrols.$codepicker.find(synOptions, callback)`가 실행되어 `syn.$w.showUIDialog`로 검색 팝업(`codeHelpUrl` + `?parameterID=...`)을 엽니다. 이때 `@ApplicationID`, `@CompanyNo`, `@LocaleID` 파라미터가 `parameters`에 자동으로 추가됩니다.
5. 팝업에서 사용자가 항목을 선택하고 닫으면, `showUIDialog`의 콜백으로 선택된 배열(`result`, 각 원소는 `{ value, text, ... }` 형태)이 전달됩니다.
   - `isMultiSelect: false`이면 `result[0]`의 `value`/`text`만 사용합니다.
   - `isMultiSelect: true`이면 모든 항목의 `value`/`text`를 콤마(`,`)로 이어붙입니다.
6. `viewType`이 `'form'`이면 `_Code`/`_Text` 입력창에 값을 바로 채워 넣습니다(`'grid'`/`'auigrid'`이면 해당 그리드 셀에 반영).
7. `mod.event[<elID>_change]`가 있으면 `(elID, inputValue, inputText, result)`와 함께 호출되고, `mod.hook.frameEvent`가 있으면 `'codeReturn'` 이벤트로도 알림을 받습니다.
8. 마지막으로 `find()`의 3번째 인자로 넘긴 `callback(result)`이 호출됩니다.

팝업 화면(`index2.html`) 자체는 서버에 등록된 `dataSourceID`가 실제 데이터를 반환해야 정상적으로 목록이 표시됩니다. 개발 환경에서 데이터소스가 구성되어 있지 않다면, 팝업 대신 `setValue`/`setText`로 값을 직접 넣어 화면 흐름만 확인할 수 있습니다.
