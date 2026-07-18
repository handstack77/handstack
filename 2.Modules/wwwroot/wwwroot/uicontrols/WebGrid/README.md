# WebGrid — $grid (Handsontable 기반)

## 이 컨트롤은 무엇인가요?

`WebGrid.js`는 [Handsontable](https://handsontable.com/) 기반의 엑셀형 그리드 컨트롤입니다. `syn.uicontrols.$grid` 싱글턴 객체로 노출되며, `syn.uicontrols.$xxx` 공통 패턴(`defaultSetting` 성격의 옵션 객체 + `controlLoad`/`getValue`/`setValue`/`clear`/`setLocale`)을 따릅니다.

과거에는 이 폴더에 `AUIGrid`/`jqGrid`/`AUIPivot`/`OpenGrid`까지 함께 있었지만, 각각 별도 디렉토리로 분리되었습니다.

| 그리드 | 위치 | 내부 라이브러리 | 성격 |
|---|---|---|---|
| `$grid` (WebGrid.js) | 이 폴더 | Handsontable | 엑셀형 그리드, 로더 자동주입, 비상용 라이선스 기반 대안 엔진 |
| `$auigrid` | [../AUIGrid](../AUIGrid/README.md) | AUIGrid (상용) | 업무용 그리드, 로더 자동주입, 실무 주력 엔진(300회 이상 실사용) |
| `$jqgrid` | [../JQGrid](../JQGrid/README.md) | jQuery jqGrid (레거시) | 레거시 화면 유지보수용 |
| `$auipivot` | [../AUIPivot](../AUIPivot/README.md) | AUIGrid 기반 피벗 테이블 | 다차원 집계/피벗 리포트 |
| `$opengrid` | [../OpenGrid](../OpenGrid) | 자체 구현 그리드 | 신규 예제 다수(`example/` 참고, 문서는 별도 정리 예정) |

어떤 화면에서 그리드를 다루고 있는지 먼저 확인하고, 그 엔진에 맞는 폴더의 문서를 참고하세요. 신규 화면에서 CRUD 그리드가 필요하면 `$auigrid`가 실무 표준이고, 상용 라이선스 없이 빠르게 프로토타입만 만들 때는 `$grid`(Handsontable, `licenseKey: 'non-commercial-and-evaluation'`로 기본 제공)를 사용합니다.

## 빠른 시작

### $grid (Handsontable 기반)

```html
<syn_grid id="grdBasic" syn-options="{
    columns: [
        ['ProdID', '제품코드', 120, true, 'text', false, 'left'],
        ['ProdName', '제품명', 200, false, 'text', false, 'left']
    ]
}" syn-events="['afterSelectionEnd']"></syn_grid>
<script src="/js/syn.loader.js"></script>
```

```js
syn.uicontrols.$grid.setValue('grdBasic', [
    { Flag: 'R', ProdID: 'P001', ProdName: '모니터' },
    { Flag: 'R', ProdID: 'P002', ProdName: '키보드' }
]);
```

- 엑셀과 유사한 조작감(복사/붙여넣기, 자동완성 드롭다운, 필터), `licenseKey: 'non-commercial-and-evaluation'`로 기본 제공되어 별도 계약 없이 사용 가능. 다만 상용 환경에서는 Handsontable 라이선스 정책을 별도로 확인해야 합니다.

## 예제 실행하기

`example/` 폴더의 HTML 파일을 handstack의 wwwroot 정적 서버(rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `gridbasic.html` / `.js` : `$grid`(Handsontable) 기본 CRUD(조회/추가/삭제/getValue/setValue)

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/WebGrid/WebGrid.js`, `WebGrid.css`
- 다른 엔진: [AUIGrid](../AUIGrid/README.md), [AUIPivot](../AUIPivot/README.md), [JQGrid](../JQGrid/README.md), [OpenGrid](../OpenGrid)
- 기존 샘플: `wwwroot/sample/uicontrol/webgrid.html`(`$grid`), `webgrid2.html`(`$auigrid`)
- 로더 자동주입 정의: `wwwroot/js/syn.loader.js`의 `'grid'` case
- Handsontable 공식 문서: https://handsontable.com/docs/
