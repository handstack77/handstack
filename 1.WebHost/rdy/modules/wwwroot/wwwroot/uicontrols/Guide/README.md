# Guide (syn.uicontrols.$guide)

## 이 컨트롤은 무엇인가요?

Guide는 화면 안내(온보딩) 컨트롤입니다. 화면에 이미 존재하는 다른 요소들(버튼, 입력창, 목록 등)을 순서대로 하이라이트하면서 "이게 뭐고 어떻게 쓰는지"를 설명해 주는 투어 기능을 만들 때 사용합니다.

`syn_guide` 태그 자체는 화면에 아무것도 그리지 않습니다(ContextMenu처럼 로드 후 `display:none` 처리됨). 대신 `syn-options`의 `items` 배열에 "어떤 요소(selector)를 어떤 방식(helpType)으로 안내할지"를 정의해 두면, Guide가 내부적으로 아래 3가지 외부 라이브러리 중 하나를 골라 연결해 줍니다.

- `helpType: 'I'` → [intro.js](https://introjs.com/) 기반 단계별 투어(스포트라이트 + 다음/이전 버튼)
- `helpType: 'T'` → [tippy.js](https://atomiks.github.io/tippyjs/) 기반 툴팁(마우스 올리면 뜨는 설명)
- `helpType: 'P'` → [superplaceholder](https://github.com/fabiospampinato/superplaceholder.js) 기반 입력창 placeholder 타이핑 애니메이션
- `helpType: 'U'` → 프로그램(화면) 도움말 링크/팝업 (별도 "도움말" 버튼 등에서 `openUIHelp`로 호출)

## 언제 사용하나요?

- 신규 사용자에게 화면의 주요 버튼/입력창을 순서대로 소개하는 "처음 사용 가이드"가 필요할 때 (`helpType: 'I'`)
- 특정 항목에 마우스를 올렸을 때 짧은 설명을 보여주고 싶을 때 (`helpType: 'T'`)
- 검색창/입력창에 "이렇게 입력하세요" 같은 예시 문구를 타이핑 애니메이션으로 계속 보여주고 싶을 때 (`helpType: 'P'`)
- 화면 우측 상단 "도움말(?)" 버튼을 눌렀을 때 외부 매뉴얼 링크를 열거나, 팝업 창으로 도움말 본문을 보여주고 싶을 때 (`helpType: 'U'`)

## 빠른 시작

```html
<div id="divRangeButtonGroup">조회 기간 버튼 그룹</div>
<div id="divTransactionDetail">거래 상세 영역</div>

<syn_guide id="hlpDataSource" syn-options="{
    items: [
        { helpType: 'I', selector: '#divRangeButtonGroup', subject: '조회 기간을 설정합니다.', sentence: '오늘/일주일/한달 단위로 조회 기간을 선택할 수 있습니다.', sortingNo: 1 },
        { helpType: 'I', selector: '#divTransactionDetail', subject: '거래 상세 내역입니다.', sentence: '선택한 기간의 거래 내역이 표시됩니다.', sortingNo: 2 }
    ]
}" syn-events="['complete', 'exit']"></syn_guide>

<input type="button" id="btnStartGuide" value="사용법 안내 시작" syn-events="['click']" />
```

```js
'use strict';
let $samplePage = {
    event: {
        btnStartGuide_click() {
            // 버튼을 눌러야 투어가 시작됩니다(페이지 로드시 자동 시작되지 않음).
            syn.uicontrols.$guide.introStart('hlpDataSource');
        },

        hlpDataSource_complete() {
            syn.$l.eventLog('hlpDataSource_complete', '투어를 끝까지 마쳤습니다.');
        },

        hlpDataSource_exit() {
            syn.$l.eventLog('hlpDataSource_exit', '투어를 중간에 닫았습니다.');
        }
    }
}
```

핵심 포인트:

- `items`의 각 항목은 "안내할 방식(`helpType`)"과 "안내 대상(`selector`)", "제목(`subject`)", "본문(`sentence`)"으로 구성됩니다.
- `selector`가 가리키는 요소는 Guide보다 먼저(또는 같은 시점에) 화면에 존재해야 합니다. 존재하지 않으면 해당 단계는 조용히 건너뜁니다.
- `helpType: 'I'` 투어는 자동 시작되지 않습니다. 반드시 `syn.uicontrols.$guide.introStart(elID)`를 버튼 클릭 등에서 직접 호출해야 합니다.
- `sortingNo`로 intro 단계 순서를 정할 수 있습니다.
- 페이지에 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 intro.js, tippy.js, popper.js, superplaceholder와 Guide의 CSS/JS가 모두 자동으로 로드됩니다(추가 `pageLoadFiles` 설정이 필요 없습니다).

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(예: rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `basic.html` : 화면 요소 3개를 순서대로 안내하는 intro.js 투어(`helpType: 'I'`) 예제. 버튼을 눌러 투어를 시작하고, `complete`/`exit` 이벤트를 로그로 확인합니다.
- `help-types.html` : 툴팁(`T`), 입력창 placeholder 애니메이션(`P`), 도움말 링크/팝업(`U`)까지 나머지 3가지 `helpType`을 한 화면에서 비교하는 예제.

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/Guide/Guide.js`, `Guide.css`
- 이 컨트롤은 `wwwroot/sample/uicontrol/` 에 별도 샘플 페이지가 없습니다. 이 문서의 API 내용은 `Guide.js` 소스 코드를 직접 읽고 확정한 것이며, 마크업 형태는 qcn.groupware 프로젝트의 실사용 코드를 참고했습니다.
- intro.js 옵션/API 원본 문서: https://introjs.com/docs/intro/api
- tippy.js 옵션 원본 문서: https://atomiks.github.io/tippyjs/v6/all-props/
- superplaceholder 옵션 원본 문서: https://github.com/fabiospampinato/superplaceholder.js
