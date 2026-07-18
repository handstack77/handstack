# AUIGrid — $auigrid (AUIGrid 기반, 실무 주력)

## 이 컨트롤은 무엇인가요?

`AUIGrid.js`는 [AUIGrid](https://www.auisoft.net/)(상용) 기반의 업무용 그리드 컨트롤입니다. `syn.uicontrols.$auigrid` 싱글턴 객체로 노출되며, `syn.uicontrols.$xxx` 공통 패턴(`defaultSetting` 성격의 옵션 객체 + `controlLoad`/`getValue`/`setValue`/`clear`/`setLocale`)을 따릅니다.

이 폴더는 원래 `WebGrid` 폴더 안에 다른 그리드 엔진들과 함께 있었으나, 별도 디렉토리로 분리되었습니다. 다른 엔진은 [WebGrid](../WebGrid/README.md)(`$grid`), [AUIPivot](../AUIPivot/README.md)(`$auipivot`), [JQGrid](../JQGrid/README.md)(`$jqgrid`), [OpenGrid](../OpenGrid)(`$opengrid`)를 참고하세요.

실무(qcn.groupware 기준)에서는 `$auigrid`가 압도적으로 많이 쓰입니다(300회 이상 실사용). 컬럼 병합, 그룹핑, 고정 컬럼/행, 코드헬프 팝업, 스파크라인 등 업무 화면에 필요한 기능이 가장 폭넓게 내장되어 있습니다. 상용 라이선스 벤더 라이브러리(`/lib/auigrid/`)가 필요합니다.

신규 화면에서 CRUD 그리드가 필요할 때 우선적으로 고려하는 실무 표준 엔진입니다(상용 라이선스 포함, 기능이 가장 풍부).

## 빠른 시작

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

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `auigridbasic.html` / `.js` : `$auigrid` 기본 사용법 — text/dropdown/checkbox/date 등 다양한 `editType` 컬럼 구성
- `auigridevents.html` / `.js` : `$auigrid`의 `insertRow`/`removeRow`/`getFlag`/`setFlag`와 이벤트(`afterSelectionEnd`, `cellEditEnd`) 연동 데모

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/AUIGrid/AUIGrid.js`, `AUIGrid.css`
- 로더 자동주입 정의: `wwwroot/js/syn.loader.js`의 `'auigrid'` case
- AUIGrid 벤더 공식 문서: https://www.auisoft.net/documentation/auigrid/
