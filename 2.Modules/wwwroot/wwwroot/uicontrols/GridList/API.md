# GridList API 참조

`syn.uicontrols.$list`

GridList는 [DataTables](https://datatables.net/)를 감싸서 만든 읽기 전용 목록 그리드 컨트롤입니다. 소스 파일 이름은 `GridList.js`이지만, 실제 등록되는 모듈 이름은 `syn.uicontrols.$list` 입니다. 아래 내용은 `1.WebHost/rdy/modules/wwwroot/wwwroot/uicontrols/GridList/GridList.js` 소스 코드를 기준으로 정리했습니다.

## 마크업

```html
<syn_list id="lstDataTable" syn-options="{
    checkbox: true,
    pageLength: 50,
    columns: [
        { title: 'ID', data: 'id', visible: true, width: '30px' },
        { title: 'Name', data: 'name', width: '200px' },
        { title: 'Position', data: 'position', width: '100px' }
    ]
}" syn-events="['select']" style="width: 100%; border: 1px solid;"></syn_list>
```

- 태그는 반드시 `<syn_list>` 커스텀 태그여야 하며, `id` 속성이 필수입니다.
- `syn-options` 속성 값은 JavaScript 객체 리터럴(JSON과 유사한 형태) 문자열이며, `defaultSetting`을 덮어씁니다. `columns` 배열은 반드시 지정해야 합니다.
- `controlLoad` 실행 시 원래의 `<syn_list>` 엘리먼트는 `id + '_hidden'`으로 이름이 바뀌고 화면에서 숨겨지며, 그 자리에 실제 `<table>` 마크업을 담은 `<div class="list-container">` 래퍼가 새로 삽입됩니다. 이후 코드에서 원본 엘리먼트를 `id`로 다시 찾으려 하면 찾을 수 없으니 주의하세요(값 조회/조작은 항상 `syn.uicontrols.$list`의 메서드를 통해서 합니다).
- 값 변경 등 이벤트를 페이지 스크립트에서 받으려면 `syn-events="['select']"`처럼 배열 형태의 문자열 속성을 추가합니다(지원되는 이벤트 목록은 아래 참고).

## Options (defaultSetting)

| 옵션 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `columns` | array | (필수, 기본값 없음) | 컬럼 정의 배열. 각 항목은 `{ title, data, visible, width }` 형태이며, `title`은 헤더 텍스트로 사용된 뒤 내부적으로 배열에서 제거됩니다(DataTables 컬럼 옵션에는 `title`을 남기지 않음). |
| `checkbox` | boolean | `false` | `true`면 첫 번째 컬럼에 체크박스 선택 컬럼을 추가하고, `select`를 `{ style: 'multi' }`로 강제 설정합니다. 체크박스 모드에서는 `sScrollY`, `fnDrawCallback` 옵션이 자동으로 제거됩니다. |
| `width` / `height` | string | `'100%'` / `'300px'` | 그리드를 감싸는 `<div class="list-container">` 래퍼의 크기. `<syn_list>` 태그에 인라인 `style.width/height`가 있으면 그 값이 우선합니다. |
| `paging` | boolean | `true` | 페이징 사용 여부. |
| `pageLength` | number | `50` | 페이지당 표시 행 수. |
| `lengthChange` | boolean | `false` | 페이지당 행 수를 사용자가 바꿀 수 있는 select 표시 여부(기본은 숨김, CSS에서도 `.dataTables_length`를 감춤). |
| `ordering` | boolean | `true` | 컬럼 헤더 클릭 정렬 사용 여부. |
| `order` | array | `[]` | 초기 정렬 기준(`[[컬럼인덱스, 'asc'|'desc']]` 형태). |
| `info` | boolean | `true` | 하단 "N개 중 N개 표시" 정보 표시 여부. |
| `searching` | boolean | `true` | 컬럼별 검색창 표시 여부. `true`면 헤더 행이 복제되어 두 번째 헤더 행에 텍스트 입력창이 생기고, 입력값으로 해당 컬럼을 `keyup`/`change` 시 필터링합니다(`checkbox: true`인 경우 체크박스 컬럼의 검색창은 자동으로 숨김 처리됩니다). |
| `select` | boolean \| object | `true` | 행 선택 사용 여부/방식. `checkbox: true`이면 내부적으로 `{ style: 'multi' }`로 덮어써집니다. |
| `autoWidth` | boolean | `true` | 컬럼 너비 자동 조정 여부. |
| `orderCellsTop` | boolean | `true` | 정렬 시 클릭 대상을 복제된(검색창이 있는) 헤더가 아니라 원래 헤더로 고정. |
| `fixedHeader` | boolean | `true` | 스크롤 시 헤더 고정 여부. |
| `responsive` | boolean | `true` | 화면 크기에 따라 컬럼을 자동으로 접는 반응형 레이아웃 사용 여부. |
| `sScrollY` | string | `'0px'` | 세로 스크롤 영역 높이(레거시 DataTables 옵션명). `checkbox: true`이면 자동 제거됩니다. |
| `footerCallback` | function | (합계 등 커스텀 로직을 넣는 훅, 기본은 빈 처리) | 페이지가 다시 그려질 때마다 호출되는 콜백으로, `<tfoot>` 영역에 합계 등을 표시하고 싶을 때 오버라이드합니다. |
| `fnDrawCallback` | function | (그리드 높이 재계산 로직) | 그리드가 다시 그려질 때마다 호출되어 스크롤 영역 높이를 부모 패널 크기에 맞춰 재조정합니다. `checkbox: true`이면 자동 제거됩니다. |
| `language` | object | 한글 메시지 세트(`emptyTable`, `info`, `search`, `paginate` 등) | DataTables 문구 다국어 설정. |
| `dataType` | string | `'string'` | 값의 데이터 타입. |
| `belongID` | string \| null | `null` | 상위 화면/그룹 식별용 부가 정보. |
| `getter` / `setter` | boolean | `false` | 값 조회/설정 시 커스텀 훅 사용 여부. |
| `controlText` | string \| null | `null` | 컨트롤에 표시할 고정 텍스트(용도별 커스텀). |
| `validators` | object \| null | `null` | 유효성 검사 규칙. |
| `transactConfig` / `triggerConfig` | object \| null | `null` | 트랜잭션/트리거 연동 설정. |
| `bindingID` | string | (미지정) | 지정하면 `controlLoad` 완료 후 `syn.uicontrols.$data.bindingSource(elID, bindingID)`를 호출해 데이터소스와 자동 연동합니다. |

## 메서드

| 메서드 | 설명 |
| --- | --- |
| `controlLoad(elID, setting)` | 컨트롤 초기화. `<syn_list>` 엘리먼트를 숨기고 실제 `<table>` 마크업으로 교체한 뒤 DataTables를 적용합니다. 보통 페이지 로더가 자동으로 호출하므로 직접 호출할 일은 거의 없습니다. |
| `getValue(elID, meta)` | 현재 그리드에 표시된 전체 행 데이터를 배열로 반환합니다(`table.data().toArray()`). |
| `setValue(elID, value, meta)` | 기존 데이터를 모두 지운 뒤(`fnClearTable`), 넘겨받은 배열(`value`)로 데이터를 다시 채웁니다(`fnAddData`). 즉 항상 "전체 교체" 동작입니다. |
| `clear(elID, isControlLoad)` | 그리드의 모든 데이터를 지우고, 컬럼별 검색 조건과 검색창 입력값도 함께 초기화합니다. |
| `getControl(elID)` | 내부 상태 객체(`{ id, table, list, config, value }`)를 반환합니다. `table`은 DataTables 1.10+ API 객체, `list`는 레거시(`fnXXX`) API 객체입니다. 체크박스 선택값은 `getControl(elID).table.column(0).checkboxes.selected().toArray()`로 조회합니다. |
| `setCellData(elID, row, col, value)` | 특정 셀 값을 프로그램적으로 갱신합니다(사용자 편집 UI는 없지만, 코드에서 특정 셀만 갱신하고 싶을 때 사용). `col`에 컬럼명을 문자열로 넘기면 내부적으로 `propToCol`을 통해 인덱스로 변환합니다. |
| `propToCol(elID, columnName)` | `columns` 설정에서 `data` 속성 값이 `columnName`과 일치하는 컬럼의 인덱스를 반환합니다. 찾지 못하면 `-1`. |
| `setLocale(elID, translations, control, options)` | 다국어(로케일) 텍스트 적용용 훅(현재 구현은 비어 있음). |

## 이벤트 (syn-events)

GridList는 `syn-events` 속성에 나열된 이벤트 이름 중 다음 세 가지만 실제로 연결됩니다(그 외 이름을 적어도 아무 동작도 하지 않습니다).

| 이벤트 | 설명 | 핸들러 인자 |
| --- | --- | --- |
| `select` | 행(또는 셀)이 선택될 때 발생합니다(DataTables Select 확장 기반). 선택된 행에는 `custom-selected` CSS 클래스가 추가됩니다. | 선택 타입이 `'row'`일 때만 페이지 핸들러가 호출되며, `(data, e, dt, type, indexes)`를 전달합니다(`data`는 선택된 행들의 데이터). |
| `deselect` | 행 선택이 해제될 때 발생합니다. | `(e, dt, type, indexes)` |
| `dblclick` | 데이터 행을 더블클릭할 때 발생합니다. | `(this, data)` — `this`는 클릭된 `<tr>` DOM 엘리먼트, `data`는 해당 행의 데이터. |

사용 예:

```html
<syn_list id="lstDataTable" syn-events="['select', 'dblclick']" syn-options="{...}"></syn_list>
```

```js
event: {
    lstDataTable_select(data, e, dt, type, indexes) {
        syn.$l.eventLog('lstDataTable_select', JSON.stringify(data));
    },

    lstDataTable_dblclick(row, data) {
        syn.$l.eventLog('lstDataTable_dblclick', JSON.stringify(data));
    }
}
```

## 참고

### getValue vs setValue는 "행 단위 부분 수정"을 지원하지 않습니다

GridList는 편집 그리드가 아니므로, `setValue(elID, value)`를 호출하면 기존 데이터를 전부 지우고 넘겨받은 배열로 통째로 다시 그립니다. 특정 행 하나만 값을 바꾸고 싶다면 `getValue`로 전체 배열을 받아와 원하는 항목만 수정한 뒤 `setValue`로 다시 넣거나, `setCellData(elID, row, col, value)`로 셀 하나만 직접 갱신하세요.

### 체크박스 다중 선택

`checkbox: true`로 설정하면 첫 번째 컬럼이 체크박스 선택 컬럼이 되고, `select`가 `{ style: 'multi' }`로 강제 설정됩니다. 선택된 행들의 데이터는 `syn.uicontrols.$list.getControl(elID).table.column(0).checkboxes.selected().toArray()`로 조회할 수 있습니다(이 값은 보통 각 행의 식별자, 예: `id` 값의 배열입니다).

### checkbox + searching 조합 시 알려진 제약

`checkbox: true`이면서 `searching`(기본값 `true`)도 함께 켜져 있을 때, 소스 코드는 체크박스 컬럼의 검색창을 숨기기 위해 `$('#lstDataTable thead tr:eq(1) th:first-child input').hide()`처럼 `lstDataTable`이라는 엘리먼트 id를 그대로 하드코딩해 사용합니다. 따라서 `<syn_list>`의 `id`가 `lstDataTable`이 아니면(예: 이 예제의 `lstCheckbox`) 체크박스 컬럼 위에 의미 없는 검색 입력창이 그대로 남아 있을 수 있습니다. 실제 화면에서는 CSS로 해당 입력창을 숨기거나(`checkbox` 컬럼의 검색 `<th>`를 직접 스타일링), `searching: false`로 컬럼별 검색 자체를 끄는 방식으로 우회하세요.

### DataTables API 직접 사용하기

`getControl(elID).table`은 DataTables 1.10 이상의 API 객체이므로, GridList가 제공하지 않는 세부 기능(컬럼 검색, 다시 그리기, 페이지 이동 등)이 필요하면 [DataTables API 문서](https://datatables.net/reference/api/)를 참고해 `table.column(i).search(...)`, `table.page(n).draw()` 같은 코드를 직접 작성할 수 있습니다.
