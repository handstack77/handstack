# Guide API 참조

싱글턴 객체: `syn.uicontrols.$guide`
소스 파일: `wwwroot/uicontrols/Guide/Guide.js` (`version: 'v2025.3.1'`), `wwwroot/uicontrols/Guide/Guide.css`

## 마크업

```html
<syn_guide id="hlpDataSource" syn-options="{
    items: [
        { helpType: 'I', selector: '#btnNewDataSource', subject: '신규 데이터 원본을 설정하세요.', sentence: 'SqlServer, Oracle, MySQL & MariaDB, PostgreSQL, SQLite 데이터베이스를 연동하세요.', sortingNo: 1 },
        { helpType: 'I', selector: '#lstDataSource', subject: '연결 가능한 데이터 원본입니다.', sentence: '앱에서 데이터베이스 요청을 실행하는 dbclient 모듈의 계약 정보에 사용하는 DataSourceID 목록입니다.', sortingNo: 2 },
        { helpType: 'T', selector: 'span.badge.bg-primary', subject: '앱에서 사용하는 기본 데이터베이스 입니다.', sentence: '기본 데이터 원본 정보는 제공자와 연결 문자열을 편집할 수 없습니다.', applyDelay: 1000 },
        { helpType: 'P', selector: '#txtConnectionString', subject: '중요', sentence: '개발 및 테스트 목적의 데이터베이스 연결문자열을 입력해야 합니다.' },
        { helpType: 'U', subject: '설치 가이드', sentence: 'https://handstack.kr/docs/startup/install/지원-운영체제', options: '{"contentType": "link"}' }
    ]
}" syn-events="['complete', 'exit']"></syn_guide>
```

- `id`는 페이지 내에서 유일해야 하며, `syn.uicontrols.$guide`의 각종 메서드에서 이 `id`(elID)를 사용합니다.
- 태그 자체는 `controlLoad` 실행 후 `display:none`으로 숨겨집니다(화면에 그려지는 요소가 아니라 안내 동작 정의용 태그입니다). 내부적으로 `<input>`처럼 `value` 속성을 가지므로 `getValue`/`setValue`/`clear`가 존재하지만, 실질적인 값(투어 진행 상태 등)을 담는 용도로 쓰이지는 않습니다.
- Guide는 자기 자신이 아니라 `items[].selector`로 지정한 다른 화면 요소들 위에서 동작합니다. 따라서 각 `selector`가 가리키는 요소는 Guide 태그보다 먼저(또는 같은 시점에) 화면(DOM)에 존재해야 합니다. `controlLoad` 시점에 `selector`로 요소를 찾지 못하면:
  - `helpType: 'I'` 항목은 해당 단계를 건너뜁니다(steps에 추가되지 않음).
  - `helpType: 'T'` 항목은 `applyDelay`가 0이면 건너뛰고, `applyDelay`가 있으면 지연 이후 시점에 다시 셀렉터로 찾아 연결을 시도합니다.
  - `helpType: 'P'` 항목은 해당 항목을 건너뜁니다.
  - `helpType: 'U'` 항목은 `selector`를 사용하지 않으므로 영향이 없습니다.

## Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `items` | array | `[]` | 안내 단계 목록. 아래 "items 배열 구조" 참고 |
| `introOptions` | object | intro.js 기본 옵션(아래) | `helpType: 'I'` 투어 전체에 적용되는 intro.js 옵션. [intro.js 옵션 문서](https://introjs.com/docs/intro/api) 참고 |
| `tooltipOptions` | object | `{ placement: 'top-start', allowHTML: true, animateFill: true, maxWidth: '640px' }` | `helpType: 'T'` 툴팁 전체에 적용되는 tippy.js 기본 옵션 |
| `placeholderOptions` | object | `{ letterDelay: 25, sentenceDelay: 1000, startOnFocus: true, loop: false, shuffle: false, showCursor: true, cursor: '|' }` | `helpType: 'P'` 애니메이션 전체에 적용되는 superplaceholder 기본 옵션 |

### introOptions 기본값

```js
{
    prevLabel: '<svg ... chevron-left ... />',   // 이전 버튼 아이콘(SVG)
    nextLabel: '<svg ... chevron-right ... />',  // 다음 버튼 아이콘(SVG)
    doneLabel: '완료',
    skipLabel: '<svg ... x(닫기) ... />',
    dontShowAgainLabel: '다시 안보기',
    exitOnEsc: true,
    showStepNumbers: true,
    showBullets: false,
    tooltipPosition: 'auto',
    overlayOpacity: 0.2,
    steps: []   // Guide가 items(helpType:'I')로부터 자동 생성하여 채움
}
```

### items 배열 구조 (`itemTemplate`)

| 속성 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `helpType` | string | 필수 | 안내 방식. `'I'`(intro.js 투어) / `'T'`(tippy 툴팁) / `'P'`(superplaceholder) / `'U'`(도움말 링크·팝업) 중 하나 |
| `selector` | string (CSS 셀렉터) | `I`/`T`/`P`에 필수, `U`는 미사용 | 안내 대상 요소를 찾는 셀렉터(`syn.$l.querySelector` 사용) |
| `subject` | string (HTML 가능) | 선택 | 제목. `I`는 스텝 제목, `T`는 툴팁 상단에 `<strong>`으로 굵게 표시, `P`는 문장 앞에 `[제목] `으로 붙음, `U`는 팝업 제목(`<h1>`) |
| `sentence` | string \| array (HTML 가능) | 선택 | 본문. `I`/`T`는 문자열, `P`는 문자열 또는 문자열 배열(여러 문구를 순환 타이핑), `U`는 `contentType:'link'`일 때 이동할 URL, 그 외엔 팝업에 표시할 HTML 본문 |
| `options` | string (JSON 문자열, HTML 엔티티 이스케이프 가능) | 선택 | 해당 항목에만 적용할 추가 옵션. `I`는 `introOptions`에, `T`는 `tooltipOptions`에, `P`는 `placeholderOptions`에 병합됨. `U`는 `{"contentType":"link"}` 또는 `{"contentType":"html"}` 지정에 사용(내부에서 `$string.toCharHtml`로 언이스케이프 후 `JSON.parse`) |
| `sortingNo` | number | 선택(기본 0) | `helpType: 'I'` 단계 순서 정렬 기준(`$array.objectSort`로 오름차순 정렬) |
| `applyDelay` | number (ms) | `T`에서만 사용 | 지정 시 해당 시간(ms) 후에 tippy를 지연 연결. 아직 DOM에 없는 요소(동적 렌더링)에 툴팁을 붙일 때 사용 |

> `helpType: 'U'`는 실제로는 하나의 "도움말" 링크/본문 역할만 하며, 여러 개를 넣어도 `openUIHelp`는 `items`에서 첫 번째로 발견되는 `helpType:'U'` 항목만 사용합니다.

## 메서드

`syn.uicontrols.$guide.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `introStart(elID)` | `helpType:'I'` 로 구성된 intro.js 투어를 시작합니다(`intro.start()`). 페이지 로드시 자동 시작되지 않으므로 버튼 클릭 등에서 직접 호출해야 합니다. |
| `openUIHelp(elID)` | `items`에서 첫 번째 `helpType:'U'` 항목을 찾아 도움말을 엽니다. `options.contentType === 'link'`이면 `sentence`(URL)를 새 창(`window.open(url, 'help')`)으로 열고, 그 외에는 `subject`/`sentence`로 구성한 HTML을 팝업 창에 출력합니다. 팝업이 차단되면 `syn.$w.alert`로 안내합니다. |
| `getGuideControl(elID)` | 내부 등록 정보 `{ id, items, tooltip, intro, placeholder }`를 반환합니다(디버깅/직접 제어용). `tooltip`은 tippy 인스턴스 배열, `intro`는 introJs 인스턴스, `placeholder`는 superplaceholder 인스턴스 배열입니다. |
| `dataRefresh(elID, items)` | 기존 안내 구성(tooltip/intro/placeholder)을 모두 정리(`clear`)한 뒤, 전달한 새 `items` 배열로 다시 구성합니다. 서버 응답 등으로 안내 항목을 동적으로 교체할 때 사용합니다. |
| `getValue(elID)` | `syn.$l.get(elID).value`를 반환(다른 컨트롤과 인터페이스를 맞추기 위한 자리표시자, Guide 고유 값 개념 없음) |
| `setValue(elID, value)` | `elID` 요소의 `value`를 설정(위와 동일한 이유의 자리표시자) |
| `clear(elID)` | `value`를 비우고, 등록된 tippy 인스턴스를 모두 `destroy()`, intro.js 투어를 `exit()`, superplaceholder 인스턴스를 모두 `destroy()`합니다. |
| `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 훅(Guide는 별도 구현 없음, 빈 함수) |

## 이벤트 (syn-events)

`syn-events` 배열에 이름을 넣으면 페이지 스크립트의 `event` 객체에서 `{elID}_{이벤트명}` 함수를 자동으로 연결해 줍니다. 이 이벤트들은 `helpType: 'I'`(intro.js) 투어에만 연결됩니다. `T`/`P`/`U` 항목에는 `syn-events` 훅이 연결되지 않습니다(Guide.js 소스상 `intros.on...` 호출만 존재).

| 이벤트명 | intro.js API | 발생 시점 |
|---|---|---|
| `complete` | `intro.oncomplete(fn)` | 마지막 단계에서 "완료" 버튼을 눌러 투어를 정상적으로 끝냈을 때 |
| `exit` | `intro.onexit(fn)` | 투어가 (완료 여부와 관계없이) 종료될 때 — ESC, 닫기(X) 버튼, `clear()` 호출 등 |
| `beforeexit` | `intro.onbeforeexit(fn)` | 투어가 종료되기 직전 |
| `change` | `intro.onchange(fn)` | 스텝이 전환된 직후 |
| `beforechange` | `intro.onbeforechange(fn)` | 스텝이 전환되기 직전 |
| `afterchange` | `intro.onafterchange(fn)` | 스텝 전환 애니메이션까지 끝난 직후 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        hlpDataSource_complete() {
            syn.$l.eventLog('hlpDataSource_complete', '투어 완료');
        },
        hlpDataSource_exit() {
            syn.$l.eventLog('hlpDataSource_exit', '투어 종료');
        }
    }
}
```

각 콜백의 인자 형태(예: `change`/`beforechange`/`afterchange`가 전달하는 대상 엘리먼트 등)는 intro.js 원본 API 문서를 따릅니다: https://introjs.com/docs/intro/api

## 참고

- 이 컨트롤은 `wwwroot/sample/uicontrol/`에 별도 샘플 페이지가 없습니다. 위 Options/메서드/이벤트 표는 모두 `wwwroot/uicontrols/Guide/Guide.js` 소스 코드(`defaultSetting`, `itemTemplate`, `controlLoad`, `introStart`, `openUIHelp`, `dataRefresh`, `clear` 함수)를 직접 읽고 확정한 내용입니다.
- 마크업 형태(`items` 배열에 `helpType`/`selector`/`subject`/`sentence`를 넣는 방식)는 실사용 프로젝트인 qcn.groupware의 코드 패턴을 참고했습니다.
- `helpType: 'I'`/`'T'`/`'P'`가 동작하려면 각각 `window.introJs`, `window.tippy`, `window.superplaceholder`가 로드되어 있어야 합니다. `syn.loader.js`가 `syn_guide` 태그를 인식하면 `intro.js`, `tippy.js`(+`popper.js`), `superplaceholder`, `Guide.js`/`Guide.css`를 자동으로 함께 로드하므로 별도 설정 없이 사용할 수 있습니다.
- intro.js 옵션/API 원본 문서: https://introjs.com/docs/intro/api
- tippy.js 옵션 원본 문서: https://atomiks.github.io/tippyjs/v6/all-props/
- superplaceholder 옵션 원본 문서: https://github.com/fabiospampinato/superplaceholder.js
