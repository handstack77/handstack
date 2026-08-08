# GridList (syn.uicontrols.$list)

## 이 컨트롤은 무엇인가요?

GridList는 [DataTables](https://datatables.net/)를 감싸서 만든 "목록 표시용" 그리드 컨트롤입니다. HTML 마크업에서는 `<syn_list>` 태그와 `syn-options` 속성을 사용하고, JavaScript 코드에서는 `syn.uicontrols.$list.메서드명(...)` 형태로 호출합니다. 소스 파일 이름은 `GridList.js`이지만, 실제 등록되는 모듈 이름은 `syn.uicontrols.$list` 입니다.

WebGrid(`$grid`, Handsontable 기반)와의 차이가 가장 헷갈리기 쉬운 부분입니다.

- WebGrid (`$grid`): 셀 단위로 값을 직접 입력/수정할 수 있는 "편집 가능한 스프레드시트형" 그리드입니다. 엑셀처럼 셀을 클릭해서 값을 고치고, 행 추가/삭제, 셀 유효성 검사 등을 지원합니다. 입력 폼을 대신하는 대량 데이터 편집 화면에 적합합니다.
- GridList (`$list`): 셀 편집 기능이 없는 "읽기 전용 목록 표시" 그리드입니다. 정렬, 검색(컬럼별 필터), 페이징, 체크박스를 이용한 다중 선택(행 선택) 정도만 지원하며, 값을 바꾸려면 `setValue`로 데이터 전체를 통째로 교체해야 합니다. 목록 조회 화면, 검색 결과 표시, 체크박스로 여러 건을 골라 일괄 처리하는 화면에 적합합니다.

즉, "셀을 직접 고쳐야 하면 WebGrid, 목록만 보여주고 행 단위로 선택/클릭만 하면 되면 GridList"라고 이해하면 됩니다.

## 언제 사용하나요?

- 검색 조건에 맞는 데이터 목록을 표 형태로 보여줄 때
- 여러 행을 체크박스로 선택해서 일괄 삭제/승인 등 후속 처리를 해야 할 때
- 행을 클릭하거나 더블클릭했을 때 상세 화면으로 이동하거나 팝업을 띄워야 할 때
- 컬럼별 검색, 정렬, 페이징이 필요한 단순 조회성 그리드가 필요할 때

셀 값을 사용자가 직접 입력/수정해야 하는 화면이라면 GridList 대신 WebGrid를 사용하세요.

## 빠른 시작

1. 페이지에 `<syn_list>` 태그를 배치하고 `id`, `syn-options`(컬럼 정의 포함) 속성을 지정합니다.

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

2. 페이지 하단에 `syn.loader.js` 스크립트 한 줄만 추가하면, 로더가 필요한 CSS/JS(`GridList.js`, `GridList.css`, DataTables 관련 라이브러리 등)를 자동으로 주입하고 컨트롤을 초기화합니다.

```html
<script src="/js/syn.loader.js"></script>
```

3. 값을 읽거나 설정할 때는 페이지 스크립트에서 `syn.uicontrols.$list`를 사용합니다.

```js
// 전체 행 데이터 조회
var rows = syn.uicontrols.$list.getValue('lstDataTable');

// 데이터 전체 교체(기존 데이터를 지우고 새 배열로 다시 채움)
syn.uicontrols.$list.setValue('lstDataTable', dataArray);

// 체크박스로 선택된 행의 값 조회 (checkbox: true 옵션일 때)
var checked = syn.uicontrols.$list.getControl('lstDataTable').table.column(0).checkboxes.selected().toArray();
```

## 예제 실행하기

이 폴더의 `example` 디렉토리에 초보자용 실행 예제가 있습니다. 웹 서버를 통해 `/uicontrols/GridList/example/*.html` 경로로 접속해서 바로 확인할 수 있습니다.

- `basic.html`: 체크박스 없이 목록을 표시하고, 컬럼별 검색/정렬/페이징만 사용하는 가장 단순한 예제
- `checkbox.html`: `checkbox: true` 옵션으로 여러 행을 체크박스로 다중 선택하는 예제
- `events.html`: `select`/`deselect`/`dblclick` 이벤트와 `getValue`/`setValue`/`clear` API를 함께 보여주는 예제

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하도록 만들어졌습니다.

## 더 알아보기

- 전체 옵션(Options), 메서드, 이벤트 목록은 같은 폴더의 [API.md](./API.md) 문서를 참고하세요.
- 실제 소스 코드는 `GridList.js`, `GridList.css` 파일에서 확인할 수 있습니다(내부 파일명은 유지되지만 실제 등록 이름은 `syn.uicontrols.$list` 입니다).
- GridList는 내부적으로 [DataTables](https://datatables.net/)를 그대로 사용하므로, `getControl(elID).table`로 얻은 객체를 통해 [DataTables API](https://datatables.net/reference/api/)를 직접 호출할 수도 있습니다.
- 체크박스 다중 선택은 [DataTables Checkboxes 확장](https://github.com/gyrocode/jquery-datatables-checkboxes) 플러그인을 사용합니다.
