# JQGrid — $jqgrid (jQuery jqGrid 기반, 레거시)

## 이 컨트롤은 무엇인가요?

`jqGrid.js`는 jQuery jqGrid(레거시) 기반의 그리드 컨트롤입니다. `syn.uicontrols.$jqgrid` 싱글턴 객체로 노출되며, `syn.uicontrols.$xxx` 공통 패턴을 따릅니다.

이 폴더는 원래 `WebGrid` 폴더 안에 다른 그리드 엔진들과 함께 있었으나, 별도 디렉토리로 분리되었습니다. 다른 엔진은 [WebGrid](../WebGrid/README.md)(`$grid`), [AUIGrid](../AUIGrid/README.md)(`$auigrid`), [AUIPivot](../AUIPivot/README.md)(`$auipivot`), [OpenGrid](../OpenGrid)(`$opengrid`)를 참고하세요.

jQuery UI 기반의 오래된 그리드로, 이 저장소에는 벤더 라이브러리 파일 자체가 포함되어 있지 않습니다(별도 확보 필요). 신규 개발보다는 기존 화면 유지보수 목적입니다.

## 빠른 시작

중요: `syn.loader.js`에는 `jqgrid`(→ `syn_jqgrid`) 자동주입 케이스가 없습니다. jQuery jqGrid 벤더 라이브러리(이 저장소에는 포함되어 있지 않으므로 별도로 확보해서 `/lib/jqgrid/` 등에 배치)와 `jqGrid.js`/`jqGrid.css`를 페이지의 `pageLoadFiles` 훅으로 직접 등록해야 합니다.

```html
<table id="grdLegacy"></table>
<script>
    function pageLoadFiles(styleFiles, jsFiles, templateFiles) {
        window.afterLoadFiles = [];
        afterLoadFiles.push('/lib/jqgrid/css/ui.jqgrid.min.css');
        afterLoadFiles.push('/lib/jqgrid/js/jquery.jqgrid.min.js');
        afterLoadFiles.push('/uicontrols/JQGrid/jqGrid.css');
        afterLoadFiles.push('/uicontrols/JQGrid/jqGrid.js');
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

## 예제 실행하기

`example/` 폴더의 HTML 파일을 handstack의 wwwroot 정적 서버(rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `jqgridbasic.html` / `.js` : `$jqgrid` 기본 사용법 (벤더 스크립트 수동 주입 예시 포함)

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/JQGrid/jqGrid.js`, `jqGrid.css`
- 로더 자동주입 정의: 없음 — `pageLoadFiles` 훅으로 수동 주입 필요
- jqGrid(free-jqgrid 계열) 문서: https://free-jqgrid.github.io/
