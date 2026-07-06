# WebGrid — 4개 그리드 엔진 ($grid / $auigrid / $jqgrid / $auipivot)

## 이 컨트롤은 무엇인가요?

`WebGrid` 폴더에는 이름은 같지만 서로 완전히 다른 4개의 그리드 엔진이 들어 있습니다. 레거시 UI 프레임워크가 오랜 기간 유지보수되면서, 시기별로 채택한 그리드 라이브러리가 그대로 누적된 결과입니다.

| 소스 파일 | 싱글턴 객체 | 내부 라이브러리 | 성격 |
|---|---|---|---|
| `WebGrid.js` | `syn.uicontrols.$grid` | [Handsontable](https://handsontable.com/) | 엑셀형 그리드, 로더 자동주입 |
| `AUIGrid.js` | `syn.uicontrols.$auigrid` | [AUIGrid](https://www.auisoft.net/) (상용) | 업무용 그리드, 로더 자동주입, 실무 주력 엔진 |
| `jqGrid.js` | `syn.uicontrols.$jqgrid` | jQuery jqGrid (레거시, 벤더 파일 미포함) | 레거시 화면 유지보수용 |
| `AUIPivot.js` | `syn.uicontrols.$auipivot` | AUIGrid 기반 피벗 테이블 | 다차원 집계/피벗 리포트 |

네 엔진 모두 `syn.uicontrols.$xxx` 싱글턴 객체 패턴(`defaultSetting` 성격의 옵션 객체 + `controlLoad`/`getValue`/`setValue`/`clear`/`setLocale`)을 따르지만, 내부적으로 완전히 다른 서드파티 그리드 위에서 동작하므로 옵션/메서드/이벤트 이름이 엔진마다 다릅니다. 어떤 화면에서 그리드를 다루고 있는지 먼저 확인하고, 그 엔진에 맞는 API를 사용해야 합니다.

실무(qcn.groupware 기준)에서는 `$auigrid`(AUIGrid.js)가 압도적으로 많이 쓰입니다(300회 이상 실사용). `$grid`(Handsontable)는 비상용 라이선스 기반의 대안 엔진이고, `$jqgrid`/`$auipivot`은 예전 화면을 유지보수할 때만 만나게 되는 레거시 엔진입니다.

## 언제 어떤 엔진을 사용하나요?

| 상황 | 권장 엔진 |
|---|---|
| 신규 화면에서 CRUD 그리드가 필요할 때 | `$auigrid` (실무 표준, 상용 라이선스 포함, 기능이 가장 풍부) |
| 상용 라이선스 없이 빠르게 프로토타입만 만들 때 | `$grid` (Handsontable, `non-commercial-and-evaluation` 라이선스 키로 즉시 사용 가능) |
| 여러 값의 합계/평균 등을 행·열로 교차 집계해야 할 때 | `$auipivot` (피벗 테이블 전용) |
| 이미 `$jqgrid`로 작성된 기존 화면을 수정해야 할 때 | `$jqgrid` (신규 개발에는 권장하지 않음) |

엔진별 장단점:

- `$grid` (Handsontable) : 엑셀과 유사한 조작감(복사/붙여넣기, 자동완성 드롭다운, 필터), `licenseKey: 'non-commercial-and-evaluation'`로 기본 제공되어 별도 계약 없이 사용 가능. 다만 상용 환경에서는 Handsontable 라이선스 정책을 별도로 확인해야 합니다.
- `$auigrid` (AUIGrid) : 컬럼 병합, 그룹핑, 고정 컬럼/행, 코드헬프 팝업, 스파크라인 등 업무 화면에 필요한 기능이 가장 폭넓게 내장되어 있습니다. 상용 라이선스 벤더 라이브러리(`/lib/auigrid/`)가 필요합니다.
- `$jqgrid` (jqGrid) : jQuery UI 기반의 오래된 그리드로, 이 저장소에는 벤더 라이브러리 파일 자체가 포함되어 있지 않습니다(별도 확보 필요). 신규 개발보다는 기존 화면 유지보수 목적입니다.
- `$auipivot` (AUIPivot) : `$auigrid`와 같은 AUIGrid 계열이지만 행/열/값/필터 필드를 드래그로 배치하는 피벗 리포트 전용 컨트롤입니다.

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

### $auigrid (AUIGrid 기반, 실무 주력)

```html
<syn_auigrid id="grdMain" syn-options="{
    height: 320,
    columns: [
        ['ProdID', '제품코드', 120, true, 'text', false, 'left'],
        ['ProdName', '제품명', 200, false, 'text', false, 'left'],
        ['UseYN', '사용여부', 80, false, 'checkbox', false, 'center']
    ]
}" syn-events="['afterSelectionEnd']"></syn_auigrid>
<script src="/js/syn.loader.js"></script>
```

```js
syn.uicontrols.$auigrid.setValue('grdMain', [
    { ProdID: 'P001', ProdName: '모니터', UseYN: true },
    { ProdID: 'P002', ProdName: '키보드', UseYN: false }
]);
```

### $jqgrid (jQuery jqGrid 기반, 레거시)

중요: `syn.loader.js`에는 `jqgrid`(→ `syn_jqgrid`) 자동주입 케이스가 없습니다. jQuery jqGrid 벤더 라이브러리(이 저장소에는 포함되어 있지 않으므로 별도로 확보해서 `/lib/jqgrid/` 등에 배치)와 `jqGrid.js`/`jqGrid.css`를 페이지의 `pageLoadFiles` 훅으로 직접 등록해야 합니다.

```html
<table id="grdLegacy"></table>
<script>
    function pageLoadFiles(styleFiles, jsFiles, templateFiles) {
        window.afterLoadFiles = [];
        afterLoadFiles.push('/lib/jqgrid/css/ui.jqgrid.min.css');
        afterLoadFiles.push('/lib/jqgrid/js/jquery.jqgrid.min.js');
        afterLoadFiles.push('/uicontrols/WebGrid/jqGrid.css');
        afterLoadFiles.push('/uicontrols/WebGrid/jqGrid.js');
    }
</script>
<script src="/js/syn.loader.js"></script>
```

```js
'use strict';
let $samplePage = {
    hook: {
        pageLoad() {
            syn.uicontrols.$jqgrid.controlLoad('grdLegacy', {
                colModels: [
                    { name: 'ProdID', label: '제품코드', width: 120 },
                    { name: 'ProdName', label: '제품명', width: 200 }
                ]
            });
        }
    }
}
```

### $auipivot (AUIGrid 기반 피벗 테이블, 레거시)

`syn.loader.js`에는 `auipivot`(→ `syn_auipivot`) 자동주입 케이스가 없으므로, `$auigrid`와 같은 AUIGrid 벤더 스크립트를 `pageLoadFiles` 훅으로 직접 로드해야 합니다.

```html
<syn_auipivot id="pvtSales" syn-options="{ height: 400 }"></syn_auipivot>
<script>
    function pageLoadFiles(styleFiles, jsFiles, templateFiles) {
        window.afterLoadFiles = [];
        afterLoadFiles.push('/lib/auigrid/dist/AUIGridLicense.js');
        afterLoadFiles.push('/lib/auigrid/dist/AUIGrid.js');
        afterLoadFiles.push('/uicontrols/WebGrid/AUIPivot.css');
        afterLoadFiles.push('/uicontrols/WebGrid/AUIPivot.js');
    }
</script>
<script src="/js/syn.loader.js"></script>
```

```js
'use strict';
let $samplePage = {
    hook: {
        pageLoad() {
            syn.uicontrols.$auipivot.setValue('pvtSales', [
                { Region: '서울', Model: 'A', Total: 1000 },
                { Region: '부산', Model: 'B', Total: 800 }
            ]);
        }
    }
}
```

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `gridbasic.html` / `.js` : `$grid`(Handsontable) 기본 CRUD(조회/추가/삭제/getValue/setValue)
- `auigridbasic.html` / `.js` : `$auigrid` 기본 사용법 — text/dropdown/checkbox/date 등 다양한 `editType` 컬럼 구성
- `auigridevents.html` / `.js` : `$auigrid`의 `insertRow`/`removeRow`/`getFlag`/`setFlag`와 이벤트(`afterSelectionEnd`, `cellEditEnd`) 연동 데모
- `jqgridbasic.html` / `.js` : `$jqgrid` 기본 사용법 (벤더 스크립트 수동 주입 예시 포함)
- `auipivotbasic.html` / `.js` : `$auipivot` 기본 피벗 리포트 구성(행/열/값 필드 배치)

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요(엔진별로 섹션이 나뉘어 있습니다).
- 실제 소스: `wwwroot/uicontrols/WebGrid/WebGrid.js`, `AUIGrid.js`, `jqGrid.js`, `AUIPivot.js`
- 기존 샘플: `wwwroot/sample/uicontrol/webgrid.html`(`$grid`), `webgrid2.html`(`$auigrid`)
- 로더 자동주입 정의: `wwwroot/js/syn.loader.js`의 `'grid'`, `'auigrid'` case (jqgrid/auipivot은 케이스 없음 — 수동 주입 필요)
- AUIGrid 벤더 공식 문서: https://www.auisoft.net/documentation/auigrid/ , https://www.auisoft.net/documentation/auipivot/
- Handsontable 공식 문서: https://handsontable.com/docs/
