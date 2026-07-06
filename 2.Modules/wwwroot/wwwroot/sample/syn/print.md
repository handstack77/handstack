# 리포트 출력 사용법 (syn.$p)

## 개요
`syn.$p`(원본: `context.$print`)는 Excel/PDF 리포트 서버인 "Reportify"와 연동하기 위한 URL 생성, 그리고 리포트에 데이터를 채워 넣기 위한 작업 항목(workItem) 구성/변환 기능을 제공합니다. 실제 PDF 변환·인쇄·뷰어 렌더링(`generate`, `renderViewer`, `renderPrint`, `getSchemeText`)은 `syn.Config.IsReportifyModule`이 `true`로 설정되고, Reportify 서버(`reportifyServer` + `reportifyPath`)가 실제로 응답할 때만 동작합니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$p`(별칭: `$print`)로 즉시 사용할 수 있습니다. 브라우저 환경에서 `syn.Config.IsReportifyModule`이 `true`이면 `concreate()` 시점에 `pdfobject.min.js`, `print-js`의 `print.min.js`를 지연 로드합니다(둘 다 없으면 URL 생성 이외의 렌더링 기능은 사용할 수 없습니다).

## 빠른 시작
```js
// 1) Reportify 서버 요청 URL 생성 (문자열만 생성, 네트워크 호출 없음)
const url = syn.$p.getReportifyUrl('excel-to-pdf');

// 2) workItem 배열 구성 (메모리 내 데이터, 네트워크 불필요)
const workItems = [];
syn.$p.addWorkItem(workItems, {
    document: 0, worksheet: 'Sheet1', datafield: 'CompanyName',
    bind: 'cell', row: 1, col: 1, type: 'text'
});
```

## 주요 시나리오
### Reportify 서버 URL 생성
`getReportifyUrl(actionName)`은 `${reportifyServer}${reportifyPath}/${actionName}` 형태로, `getDocumentTemplateUrl(reportFileID)`는 `${reportifyServer}${reportifyTemplateUrl}${reportFileID}` 형태로 URL 문자열을 만듭니다. 둘 다 실제 요청을 보내지 않고 문자열만 반환하므로, 백엔드 없이도 결과를 확인할 수 있습니다.
```js
const url = syn.$p.getReportifyUrl('excel-to-pdf');
const templateUrl = syn.$p.getDocumentTemplateUrl('RPT-0001');
```

### workItem 추가/삽입/수정/삭제
`addWorkItem`은 workItems 배열에 새 항목을 추가합니다. 객체 형태로 호출하는 것을 권장합니다.
```js
syn.$p.addWorkItem(workItems, {
    document: 0, worksheet: 'Sheet1', datafield: 'ReportDate',
    bind: 'cell', row: 1, col: 2, type: 'text'
});
```
> 주의: `addWorkItem(workItems, document, worksheet, datafield, bind, row, col, ...)`처럼 두 번째 인자부터 각 필드를 개별 인자로 나열하는 방식은, 현재 소스(약 11296번째 줄)의 필수값 검증 조건이 `if (document || worksheet || bind || row || col)`로 되어 있어(값이 있으면 오히려 경고를 남기는 형태) 정상적인 값이 전달되어도 대부분 경고 로그만 남기고 항목이 추가되지 않습니다. 실사용 시 객체 인자 형태를 사용하십시오.

`addAtWorkItem(workItems, document, worksheet, datafield, target, nextDirection)`은 기존 항목을 기준으로 새 항목을 삽입합니다. 이때 `target.datafield`는 workItems 내에 이미 존재하는(같은 document/worksheet) 항목의 datafield와 일치해야 그 위치를 기준으로 삽입됩니다(동일 필드를 여러 셀에 반복 출력할 때 유용).
```js
syn.$p.addAtWorkItem(workItems, 0, 'Sheet1', 'CompanyName', {
    document: 0, worksheet: 'Sheet1', datafield: 'CompanyName',
    bind: 'cell', row: 1, col: 3, type: 'text'
}, true);
```

`updateWorkItem`/`removeWorkItem`은 document/worksheet/datafield 조합으로 항목을 찾아 각각 속성 병합, 제거를 수행합니다.

### 데이터 소스와 workItems 바인딩
`bindingWorkItems(workItems, dataSource, documentOffset)`은 workItems를 복제한 뒤, dataSource의 각 키(예: `header`, `details`)를 순회하며 `bind`가 `'cell'`이면 단일 값을, `'item'`/`'list'`이면 배열 데이터를 채워 넣습니다.
```js
const dataSource = {
    header: { CompanyName: 'HandStack Inc.', ReportDate: '2026-07-06' },
    details: [{ ProductName: 'Widget A', Qty: 10 }]
};
const bound = syn.$p.bindingWorkItems(workItems, dataSource, 1);
```

### 리포트용 배열/폼 데이터 변환
- `calculateOffsets(totalCount, step)`: 다중 페이지 문서 오프셋 배열 생성.
- `transformWorkData(jsonData, keys)`: JSON 배열의 각 행을 지정 키 순서의 값 배열로 변환.
- `transformFormData(jsonData, offset, padding, defaultKeys)`: JSON 배열을 `필드명+순번` 형태의 평면 객체로 변환(폼 필드 자동 채움에 사용).
- `splitDataChunks(dataList, firstLength, chunkSize)`: 첫 페이지는 firstLength개, 이후는 chunkSize개씩 데이터를 나눔.
```js
const offsets = syn.$p.calculateOffsets(10, 3); // [0, 3, 6, 9]
const formData = syn.$p.transformFormData(list, 1, 5, 'ProductName,Qty:0');
const chunks = syn.$p.splitDataChunks(list, 2, 3);
```

## 실전 예제 페이지
`/sample/syn/print.html` 예제에서 다음 항목을 실습할 수 있습니다.
- getReportifyUrl(), getDocumentTemplateUrl() — 생성된 URL 문자열 확인
- addWorkItem(), addAtWorkItem(), updateWorkItem(), removeWorkItem() — 메모리 내 workItems 배열의 실시간 변화 확인
- calculateOffsets(), bindingWorkItems(), transformWorkData(), transformFormData(), splitDataChunks() — 예제 데이터로 각 변환 결과 확인

## 주의 사항
- 이 예제 페이지는 실제 Reportify 서버와 연동되어 있지 않습니다. `generate()`, `renderViewer()`, `renderPrint()`, `getSchemeText()` 등 실제 PDF/Excel 렌더링·인쇄·다운로드를 수행하는 메서드는 `syn.Config.IsReportifyModule = true` 설정과 실행 중인 Reportify 서버(`syn.$p.reportifyServer`)가 있어야 동작하며, 이 샘플에서는 다루지 않습니다.
- `addWorkItem`을 개별 인자(document, worksheet, ...) 형태로 호출하면 현재 소스의 조건 반전으로 인해 정상 값에도 경고만 남고 추가되지 않습니다. 객체 인자 형태를 사용하십시오.
- `addAtWorkItem`의 `target.datafield`는 반드시 workItems 내 기존 항목(같은 document/worksheet)의 datafield와 일치해야 삽입 위치가 계산됩니다. 일치하는 항목이 없으면 경고 로그만 남고 아무 것도 삽입되지 않습니다.
- Node.js 환경(`devicePlatform === 'node'`)에서는 `renderViewer`, `renderPrint`, `getSchemeText`가 로드 시 제거되어 존재하지 않습니다.

## 관련 모듈
- API 상세: [`print_api.md`](./print_api.md)
