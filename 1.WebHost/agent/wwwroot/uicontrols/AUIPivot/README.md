# AUIPivot — $auipivot (AUIGrid 기반 피벗 테이블, 레거시)

## 이 컨트롤은 무엇인가요?

`AUIPivot.js`는 `$auigrid`와 같은 AUIGrid 계열이지만 행/열/값/필터 필드를 드래그로 배치하는 피벗 리포트 전용 컨트롤입니다. `syn.uicontrols.$auipivot` 싱글턴 객체로 노출되며, `syn.uicontrols.$xxx` 공통 패턴을 따릅니다.

이 폴더는 원래 `WebGrid` 폴더 안에 다른 그리드 엔진들과 함께 있었으나, 별도 디렉토리로 분리되었습니다. 다른 엔진은 [WebGrid](../WebGrid/README.md)(`$grid`), [AUIGrid](../AUIGrid/README.md)(`$auigrid`), [OpenGrid](../OpenGrid)(`$opengrid`)를 참고하세요.

여러 값의 합계/평균 등을 행·열로 교차 집계해야 할 때 사용하는 피벗 테이블 전용 엔진입니다. 예전 화면을 유지보수할 때만 만나게 되는 레거시 엔진입니다.

## 빠른 시작

중요: `syn.loader.js`에는 `auipivot`(→ `syn_auipivot`) 자동주입 케이스가 없고, 이 저장소에는 `window.AUIPivot`을 제공하는 AUIPivot 벤더 엔진도 포함되어 있지 않습니다. 라이선스에 맞는 벤더 자산과 `AUIPivot.js` 래퍼를 `pageLoadFiles` 훅으로 직접 로드해야 합니다.

```html
<syn_auipivot id="pvtSales" syn-options="{ height: 400 }"></syn_auipivot>
<script>
    function pageLoadFiles(jsFiles, styleFiles, templateFiles) {
        // 먼저 라이선스에 맞는 AUIPivot 벤더 CSS/JS를 추가합니다.
        // 벤더가 window.AUIPivot을 노출한 뒤 HandStack 래퍼를 로드해야 합니다.
        styleFiles.push('/uicontrols/AUIPivot/AUIPivot.css');
        jsFiles.push('/uicontrols/AUIPivot/AUIPivot.js');
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

`example/` 폴더의 HTML 파일을 handstack의 wwwroot 정적 서버(rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `auipivotbasic.html` / `.js` : `$auipivot` 기본 피벗 리포트 구성(별도 벤더 필요)
- `binding.html` / `.js` : `syn.$bind` 행 배열 양방향 바인딩. 벤더가 없으면 모델 흐름만 오류 없이 확인

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/AUIPivot/AUIPivot.js`, `AUIPivot.css`
- 로더 자동주입 정의: 없음 — `pageLoadFiles` 훅으로 수동 주입 필요
- AUIPivot 벤더 공식 문서: https://www.auisoft.net/documentation/auipivot/
