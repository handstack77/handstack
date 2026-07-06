# syn.$p API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$p` (원본: `context.$print`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 11135~11614번째 줄) |
| 예제 페이지 | `/sample/syn/print.html` |
| 의존 모듈 | `syn.$l`(eventLog), `syn.$object`(isNumber, isObject, isNullOrUndefined), `syn.$string`(isNullOrEmpty, toBoolean), `syn.$w`(proxyBasePath, loadScript) — 실제 렌더링 시 `syn.$r`(httpRequest, createBlobUrl), `PDFObject`, `printJS`도 필요 |
| 활성화 조건 | `syn.Config.IsReportifyModule`이 `true`여야 PDF 뷰어/인쇄 스크립트(`pdfobject.min.js`, `print-js`)가 로드됩니다. 이 문서에서 다루는 workItem 구성/변환 메서드는 이 설정과 무관하게 항상 사용할 수 있습니다. |

## 속성
| 이름 | 기본값 | 설명 |
|---|---|---|
| `reportName` | ``report-${today}.pdf`` | 생성될 리포트 파일 이름. |
| `datetimeFormat` | `'yyyy-MM-dd'` | 리포트 내 날짜 표시 형식. |
| `boolTrue` / `boolFalse` | `'○'` / `'×'` | 리포트 내 불리언 값 표시 문자. |
| `workItems` / `workActions` | `[]` | `generate()` 호출 시 기본으로 사용하는 작업 항목/액션 배열(전역 상태). 페이지별로 별도 배열을 만들어 관리하는 것을 권장합니다. |
| `reportifyServer` | `''` (Node: `http://localhost:8421`) | Reportify 서버 origin. |
| `reportifyPath` | ``${proxyBasePath}/reportify/api/brief`` | Reportify API 기본 경로. `getReportifyUrl()`에 사용됩니다. |
| `reportifyTemplateUrl` | ``${proxyBasePath}/reportify/api/index/download-template?reportFileID=`` | 문서 템플릿 다운로드 경로. `getDocumentTemplateUrl()`에 사용됩니다. |
| `pageExportScheme` / `pageExcelToPdf` | `'export-scheme'` / `'excel-to-pdf'` | `getReportifyUrl()`에 전달할 대표 액션 이름 상수. |
| `overwriteFontName` | `null` | 리포트 생성 시 강제로 사용할 폰트 이름. |

## 메서드

### `syn.$p.getReportifyUrl(actionName)`
- 설명: Reportify 서버 API 요청 URL을 생성합니다(네트워크 호출 없음).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | actionName | `string` | Y | Reportify API 액션 이름(예: `'excel-to-pdf'`, `'export-scheme'`). |
- 반환값: `string` — ``${reportifyServer}${reportifyPath}/${actionName}``
- 예시
  ```js
  const url = syn.$p.getReportifyUrl('excel-to-pdf');
  ```

### `syn.$p.getDocumentTemplateUrl(reportFileID)`
- 설명: 문서 템플릿 다운로드 URL을 생성합니다(네트워크 호출 없음).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | reportFileID | `string` | Y | 다운로드할 리포트 템플릿 파일 ID. |
- 반환값: `string` — ``${reportifyServer}${reportifyTemplateUrl}${reportFileID}``
- 예시
  ```js
  const url = syn.$p.getDocumentTemplateUrl('RPT-0001');
  ```

### `syn.$p.addWorkItem(workItems, document, worksheet, datafield, bind, row, col, type, data, overtake, step)`
- 설명: workItems 배열에 새 작업 항목(문서/시트/필드와 값 바인딩 정보)을 추가합니다. 두 번째 인자 타입에 따라 두 가지 호출 방식을 지원합니다.
  - 두 번째 인자가 숫자(document)이면 이후 인자들을 개별 필드로 받는 위치 인자 방식입니다. 단, 현재 소스(약 11228번째 줄)의 검증 조건이 `if (document || worksheet || bind || row || col)`로 되어 있어, 정상적인(참 값) 인자를 넘겨도 매번 `Warning` 로그만 남고 실제로는 추가되지 않는 결함이 있습니다.
  - 두 번째 인자가 객체이면 `{ document, worksheet, datafield, bind, row, col, type, data, overtake, step }` 형태로 한 번에 전달합니다. 이 방식은 `!workObject.document || !workObject.worksheet || !workObject.bind || !workObject.row || !workObject.col` 검증을 통과하면 정상적으로 추가됩니다. 실사용 시 이 방식을 권장합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | workItems | `Array` | Y | 항목을 추가할 대상 배열. |
  | document | `number \| object` | Y | 숫자면 문서 번호, 객체면 `{ document, worksheet, datafield, bind, row, col, type, data, overtake, step }` 전체. |
  | worksheet, datafield, bind, row, col, type, data, overtake, step | 다양 | N (객체 호출 시 무시됨) | 위치 인자 방식에서 사용하는 개별 필드. |
- 반환값: 없음(`workItems`를 직접 변경). 필수값 누락 시 `syn.$l.eventLog`로 `Warning` 로그만 남깁니다.
- 예시
  ```js
  syn.$p.addWorkItem(workItems, {
      document: 0, worksheet: 'Sheet1', datafield: 'CompanyName',
      bind: 'cell', row: 1, col: 1, type: 'text'
  });
  ```

### `syn.$p.addAtWorkItem(workItems, document, worksheet, datafield, target, nextDirection)`
- 설명: 기존 항목을 기준으로 새 항목을 삽입합니다. 먼저 `document`/`worksheet`/`datafield`로 workItems 내에 항목이 존재하는지 확인(가드)한 뒤, `target.document`/`target.worksheet`/`target.datafield`와 일치하는 기존 항목을 다시 찾아 그 위치를 기준으로 `target` 정보로 만든 새 항목을 삽입합니다. 따라서 `target.datafield`는 workItems 내 이미 존재하는 항목의 datafield와 같아야 합니다(예: 동일 필드를 다른 셀 위치에 반복 배치).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | workItems | `Array` | Y | 대상 배열. |
  | document, worksheet, datafield | 다양 | Y | 존재 확인용 기준 항목의 키. |
  | target | `object` | Y | `{ document, worksheet, datafield, bind, row, col, type, data, overtake }` — 새로 삽입할 항목 정보. `datafield`는 workItems 내 기존 항목과 일치해야 합니다. |
  | nextDirection | `boolean` | N | `true`(기본값)이면 찾은 위치 다음에, `false`이면 그 위치에(앞에) 삽입합니다. |
- 반환값: 없음(`workItems`를 직접 변경). 두 조건 중 하나라도 찾지 못하면 `Warning` 로그만 남기고 아무 것도 삽입하지 않습니다.
- 예시
  ```js
  syn.$p.addAtWorkItem(workItems, 0, 'Sheet1', 'CompanyName', {
      document: 0, worksheet: 'Sheet1', datafield: 'CompanyName',
      bind: 'cell', row: 1, col: 3, type: 'text'
  }, true);
  ```

### `syn.$p.removeWorkItem(workItems, document, worksheet, datafield)`
- 설명: document/worksheet/datafield가 일치하는 첫 번째 항목을 workItems에서 제거합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | workItems | `Array` | Y | 대상 배열. |
  | document | `number` | Y | 문서 번호. |
  | worksheet | `string` | Y | 워크시트 이름. |
  | datafield | `string \| Array` | Y | 필드 이름. |
- 반환값: 없음(`workItems`를 직접 변경). 일치 항목이 없으면 `Warning` 로그만 남깁니다.
- 예시
  ```js
  syn.$p.removeWorkItem(workItems, 0, 'Sheet1', 'ReportDate');
  ```

### `syn.$p.updateWorkItem(workItems, document, worksheet, datafield, updates)`
- 설명: document/worksheet/datafield가 일치하는 항목을 찾아 `updates` 객체의 속성을 `Object.assign`으로 병합합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | workItems | `Array` | Y | 대상 배열. |
  | document, worksheet, datafield | 다양 | Y | 항목을 찾기 위한 키. |
  | updates | `object` | Y | 덮어쓸 속성들. |
- 반환값: 없음(`workItems`를 직접 변경). 일치 항목이 없으면 `Warning` 로그만 남깁니다.
- 예시
  ```js
  syn.$p.updateWorkItem(workItems, 0, 'Sheet1', 'ReportDate', { data: '2026-07-07' });
  ```

### `syn.$p.calculateOffsets(totalCount, step)`
- 설명: `0`부터 `totalCount` 미만까지 `step` 간격으로 증가하는 오프셋 배열을 생성합니다. 다중 페이지/시트를 순회할 때 각 페이지의 시작 인덱스를 구하는 데 사용합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | totalCount | `number` | Y | 전체 개수. |
  | step | `number` | Y | 증가 간격. |
- 반환값: `number[]`
- 예시
  ```js
  const offsets = syn.$p.calculateOffsets(10, 3); // [0, 3, 6, 9]
  ```

### `syn.$p.bindingWorkItems(workItems, dataSource, documentOffset)`
- 설명: `workItems`를 깊은 복제한 뒤, `dataSource`의 각 키를 순회하며 각 항목의 `bind` 값에 따라 데이터를 채웁니다. `bind`가 `'cell'`(생략 시 기본값)이면 `dataItem[item.datafield]` 단일 값을, `bind`가 `'item'` 또는 `'list'`이고 `dataItem`이 배열이면 `item.datafield`(배열)의 각 필드를 매핑한 2차원 배열을 채웁니다. `bind`에 `'cell:key'`처럼 콜론으로 특정 dataSource 키를 한정할 수 있습니다. 처리 후 `item.bind`는 콜론 앞부분만 남도록 정규화됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | workItems | `Array` | Y | 원본 작업 항목 배열(변경되지 않음, 복제본을 반환). |
  | dataSource | `object` | Y | 키별로 단일 객체(cell 바인딩) 또는 배열(item/list 바인딩)을 담은 데이터 소스. |
  | documentOffset | `number` | N | 지정하면(0 이상) 모든 항목의 `document` 값을 이 값으로 덮어씁니다. |
- 반환값: `Array` — 데이터가 채워진 새 workItems 배열(복제본).
- 예시
  ```js
  const dataSource = {
      header: { CompanyName: 'HandStack Inc.', ReportDate: '2026-07-06' },
      details: [{ ProductName: 'Widget A', Qty: 10 }]
  };
  const bound = syn.$p.bindingWorkItems(workItems, dataSource, 1);
  ```

### `syn.$p.transformWorkData(jsonData, keys)`
- 설명: JSON 배열의 각 행 객체를 `keys` 순서에 맞춘 값 배열로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | jsonData | `Array<object>` | Y | 변환할 행 데이터 배열. |
  | keys | `string[]` | Y | 값을 추출할 필드 이름 순서. |
- 반환값: `Array<Array>` — 각 행이 `keys` 순서의 값 배열로 변환된 2차원 배열.
- 예시
  ```js
  const workData = syn.$p.transformWorkData(data, ['DETAIL_CONTENTS', 'RESULTS']);
  ```

### `syn.$p.transformFormData(jsonData, offset, padding, defaultKeys)`
- 설명: JSON 배열을 `필드명 + 순번` 형태의 평면 객체(폼 컨트롤 자동 바인딩용)로 변환합니다. `defaultKeys`(문자열 `'key1,key2:기본값'` 또는 배열)로 항상 포함할 키와 기본값을 지정할 수 있고, 실제 데이터의 키도 자동으로 병합됩니다. `padding`이 데이터 길이보다 크면 남는 순번은 기본값으로 채웁니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | jsonData | `Array<object>` | Y | 변환할 행 데이터 배열. |
  | offset | `number` | N | 순번 시작값. 기본값 `1`. |
  | padding | `number` | N | 최소 보장 행 수. 기본값 `0`(패딩 없음). |
  | defaultKeys | `string \| string[]` | N | 항상 포함할 키 목록. `'key:기본값'` 형태로 기본값 지정 가능. |
- 반환값: `object` — 예: `{ ProductName1: 'Widget A', Qty1: 10, ProductName2: '', Qty2: '0', ... }`
- 예시
  ```js
  const formData = syn.$p.transformFormData(data, 1, 5, 'ProductName,Qty:0');
  ```

### `syn.$p.splitDataChunks(dataList, firstLength, chunkSize)`
- 설명: 배열을 첫 페이지 `firstLength`개, 이후 `chunkSize`개씩 나눈 배열의 배열로 분할합니다. `chunkSize` 생략 시 `firstLength`와 동일하게 사용합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | dataList | `Array` | Y | 분할할 원본 배열. |
  | firstLength | `number` | Y | 첫 청크(페이지)의 길이. |
  | chunkSize | `number` | N | 이후 청크의 길이. 생략 시 `firstLength`. |
- 반환값: `Array<Array>` — 분할된 청크 배열.
- 예시
  ```js
  const chunkDatas = syn.$p.splitDataChunks(dataList, 2, 3);
  ```
