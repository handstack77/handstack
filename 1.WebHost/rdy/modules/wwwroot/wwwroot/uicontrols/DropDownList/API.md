# DropDownList API 참조

`syn.uicontrols.$select`

DropDownList는 네이티브 `<select>` 태그를 [tail.select](https://github.com/pytesNET/tail.select) 플러그인으로 감싸서 확장한 컨트롤입니다. 아래 내용은 `1.WebHost/rdy/modules/wwwroot/wwwroot/uicontrols/DropDownList/DropDownList.js` 소스 코드를 기준으로 정리했습니다.

## 마크업

```html
<select id="ddlGender" syn-options="{
    placeholder: '전체',
    storeSourceID: 'CMM002',
    local: true,
    toSynControl: true,
    required: false
}" style="width: 200px;"></select>
```

- 태그는 반드시 네이티브 `<select>` 여야 합니다.
- `syn-options` 속성 값은 JavaScript 객체 리터럴(JSON과 유사한 형태) 문자열이며, `defaultSetting`을 덮어씁니다.
- 값 변경 등 이벤트를 페이지 스크립트에서 받으려면 `syn-events="['change']"` 속성을 추가합니다.

## Options (defaultSetting)

| 옵션 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `elID` | string | `''` | 컨트롤이 적용될 엘리먼트 id. `controlLoad` 실행 시 자동으로 채워집니다. |
| `placeholder` | string | `'전체'` | `required`가 `false`일 때 목록 맨 앞에 추가되는 안내용 옵션 텍스트 (value는 빈 문자열). |
| `required` | boolean | `false` | `true`면 placeholder 옵션을 추가하지 않습니다(필수 선택 항목이므로 빈 값 옵션을 넣지 않음). |
| `animate` | boolean | `false` | tail.select 드롭다운 열림/닫힘 애니메이션 사용 여부. |
| `local` | boolean | `true` | `true`면 로컬 캐시 JSON(`code/{storeSourceID}.json`)에서 데이터소스를 읽고, `false`면 `syn.$w.getDataSource`로 원격 조회합니다. |
| `search` | boolean | `false` | 드롭다운 내부에 검색창 표시 여부. |
| `multiSelectAll` | boolean | `false` | 다중 선택 시 "전체 선택" 옵션 표시 여부(다중 선택 UI에서 사용). |
| `width` | number \| null | `null` | 드롭다운 너비(px). 지정하지 않으면 옵션 텍스트 길이에 맞춰 자동 조정됩니다. |
| `classNames` | string | `'border-0 form-select'` | picker의 select 엘리먼트에 추가되는 CSS 클래스. |
| `dataSourceID` | string \| null | `null` | 원격 데이터소스 조회 시 사용하는 소스 ID(예: 서버측 코드 그룹 조회 키). |
| `storeSourceID` | string \| null | `null` | 데이터를 캐시할 때 사용하는 키. 지정하지 않으면 `dataSourceID` 값을 그대로 사용합니다. |
| `parameters` | string \| null | `null` | 원격 데이터소스 조회 시 전달할 파라미터. `@ParameterValue:HELLO WORLD;` 형태 문자열. |
| `selectedValue` | string \| null | `null` | 데이터 로드가 끝난 뒤 자동으로 선택할 값. |
| `toSynControl` | boolean | `true` | `true`면 tail.select로 감싸 스타일이 적용된 컨트롤로 만들고, `false`면 네이티브 `<select>` 모양 그대로 사용합니다. |
| `sharedAssetUrl` | string | `''` | 로컬 JSON을 읽어올 기준 경로. 비어 있으면 `syn.Config.SharedAssetUrl`(기본 `/assets/shared/`)을 사용합니다. |
| `dataType` | string | `'string'` | 값의 데이터 타입. |
| `belongID` | string \| null | `null` | 상위 화면/그룹 식별용 부가 정보. |
| `getter` / `setter` | boolean | `false` | 값 조회/설정 시 커스텀 훅 사용 여부. |
| `controlText` | string \| null | `null` | 컨트롤에 표시할 고정 텍스트(용도별 커스텀). |
| `validators` | object \| null | `null` | 유효성 검사 규칙. |
| `transactConfig` / `triggerConfig` | object \| null | `null` | 트랜잭션/트리거 연동 설정. |

## 메서드

| 메서드 | 설명 |
| --- | --- |
| `controlLoad(elID, setting)` | 컨트롤 초기화. 로컬/원격 데이터소스를 읽어 옵션을 구성하고 tail.select로 감쌉니다. 보통 페이지 로더가 자동으로 호출하므로 직접 호출할 일은 거의 없습니다. |
| `loadData(elID, dataSource, required)` | 이미 가지고 있는 데이터(`{ CodeColumnID, ValueColumnID, DataSource: [...] }` 형태)로 옵션 목록을 즉시 채웁니다. |
| `dataRefresh(elID, setting, callback)` | 데이터소스를 다시 조회해서 옵션을 갱신합니다. `setting.deleteCache`가 `true`(기본값)면 기존 캐시를 지우고 새로 조회합니다. |
| `controlReload(elID)` | tail.select picker의 화면(UI)만 다시 그립니다. 값이나 옵션 자체를 바꾸지는 않습니다. |
| `getValue(elID, meta)` | 현재 선택된 `<select>`의 값을 반환합니다. |
| `setValue(elID, value, meta)` | 값을 코드값 기준으로 설정하고 화면을 갱신합니다. |
| `clear(elID, isControlLoad)` | 선택값을 비웁니다(`value = ''`). |
| `getSelectedIndex(elID)` | 선택된 옵션의 인덱스를 반환합니다. |
| `setSelectedIndex(elID, index)` | 인덱스로 옵션을 선택합니다. |
| `getSelectedValue(elID)` | 선택된 옵션의 value를 반환합니다(`getValue`와 유사). |
| `setSelectedValue(elID, value)` | value 값과 일치하는 옵션을 찾아 선택합니다. |
| `getSelectedText(elID)` | 선택된 옵션의 표시 텍스트를 반환합니다. |
| `setSelectedText(elID, text)` | 표시 텍스트와 일치하는 옵션을 찾아 선택합니다. |
| `disabled(elID, value)` | 컨트롤 활성/비활성 상태를 설정합니다. |
| `setSelectedDisabled(elID, value)` | `true`로 설정하면 현재 선택된 값을 제외한 나머지 옵션을 모두 비활성화(선택 불가) 처리합니다. |
| `getControl(elID)` | 내부 상태 객체(`{ id, picker, setting }`)를 반환합니다. `picker`는 tail.select 인스턴스이며, 이를 통해 [tail.select 자체 API](https://github.com/pytesNET/tail.select/wiki)를 사용할 수 있습니다. |
| `setLocale(elID, translations, control, options)` | 다국어(로케일) 텍스트 적용용 훅(현재 구현은 비어 있음). |

## 이벤트 (syn-events)

DropDownList는 네이티브 `<select>`이므로, HTML에 `syn-events` 속성을 지정하면 브라우저 표준 이벤트를 그대로 사용할 수 있습니다. 가장 많이 쓰는 이벤트는 다음과 같습니다.

| 이벤트 | 설명 |
| --- | --- |
| `change` | 사용자가 옵션을 선택해 값이 바뀔 때 발생합니다. |
| `focus` | 컨트롤에 포커스가 들어올 때 발생합니다. |
| `blur` | 컨트롤에서 포커스가 빠져나갈 때 발생합니다. |

사용 예:

```html
<select id="ddlGender" syn-events="['change']" syn-options="{...}"></select>
```

```js
event: {
    ddlGender_change(evt) {
        syn.$l.eventLog('ddlGender_change', syn.uicontrols.$select.getSelectedValue('ddlGender'));
    }
}
```

## 참고: 로컬 vs 원격 데이터소스

`local` 옵션 값에 따라 옵션 목록을 채우는 방식이 달라집니다.

- 로컬 (`local: true`, 기본값): `setting.sharedAssetUrl + 'code/{storeSourceID}.json'` 경로(기본 `/assets/shared/code/{storeSourceID}.json`)의 정적 JSON 파일을 `syn.$w.loadJson`으로 읽어옵니다. 서버 API 호출 없이 미리 배포된 캐시 파일만으로 동작하므로, 자주 바뀌지 않는 공통 코드값(성별, 지역 등)에 적합합니다.
- 원격 (`local: false`): `syn.$w.getDataSource(dataSourceID, parameters, callback)`를 호출해 서버에서 실시간으로 코드값을 조회합니다. `parameters`로 조건을 넘길 수 있어(`@GROUPCODE:MS001;` 형태), 조건에 따라 목록이 달라져야 하는 경우에 적합합니다.

두 경우 모두, 한 번 읽어온 데이터는 페이지 스크립트의 `mod.config.dataSource[storeSourceID]`에 캐시되어 동일한 `storeSourceID`를 다시 사용할 때 재조회 없이 재사용됩니다. 캐시를 무시하고 강제로 다시 읽고 싶다면 `dataRefresh(elID, { deleteCache: true, ... })`를 호출하세요.

데이터소스(JSON) 형식은 공통으로 다음 구조를 따릅니다.

```json
{
    "CodeColumnID": "CodeID",
    "ValueColumnID": "CodeValue",
    "DataSource": [
        { "CodeID": "1", "CodeValue": "남자" },
        { "CodeID": "2", "CodeValue": "여자" }
    ]
}
```
