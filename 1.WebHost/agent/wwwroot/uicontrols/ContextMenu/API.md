# ContextMenu API 참조

싱글턴 객체: `syn.uicontrols.$contextmenu`
소스 파일: `wwwroot/uicontrols/ContextMenu/ContextMenu.js`

## 마크업

```html
<syn_contextmenu id="ctxTreeItem" syn-options="{
    target: '#tvlTreeView',
    delegate: 'span.fancytree-title',
    menu: [
        { title: 'Cut', cmd: 'cut' },
        { title: 'Copy', cmd: 'copy', uiIcon: 'ui-icon-copy' },
        { title: '---' },
        {
            title: 'More', children: [
                { title: 'Sub 1', cmd: 'sub1' },
                { title: 'Sub 2', cmd: 'sub2' }
            ]
        }
    ]
}" syn-events="['beforeOpen', 'select']"></syn_contextmenu>
```

- `id`는 페이지 내에서 유일해야 하며, `syn.uicontrols.$contextmenu`의 각종 메서드에서 이 `id`(elID)를 사용합니다.
- 태그 자체는 `controlLoad` 실행 후 `display:none`으로 숨겨집니다(화면에 그려지는 요소가 아니라 동작 정의용 태그입니다).
- ContextMenu는 자기 자신이 아니라 `target`으로 지정한 다른 요소 위에서 동작합니다. 따라서 `target`이 가리키는 요소가 마크업 상에 반드시 먼저(또는 같은 시점에) 존재해야 합니다.

## Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `target` | string (CSS 셀렉터) | `'targetCSSSelector'` | 컨텍스트 메뉴를 붙일 대상 컨테이너. 이 요소 범위 안에서 우클릭을 감지합니다. |
| `delegate` | string (CSS 셀렉터) | `'delegateCSSSelector'` | `target` 내부에서 실제로 메뉴를 띄울 하위 요소 셀렉터(이벤트 위임). 예: `input[type=button]`, `span.fancytree-title`, `div.node` |
| `autoFocus` | boolean | `true` | 메뉴가 열릴 때 첫 항목에 자동으로 포커스를 줄지 여부 |
| `closeOnWindowBlur` | boolean | `true` | 브라우저 창이 포커스를 잃으면 메뉴를 자동으로 닫을지 여부 |
| `hide` | boolean \| object | `false` | 메뉴가 닫힐 때 애니메이션 효과 (jQuery UI `hide` 옵션) |
| `show` | boolean \| object | `false` | 메뉴가 열릴 때 애니메이션 효과 (jQuery UI `show` 옵션) |
| `menu` | array (메뉴 트리) | 예시 4항목 | 아래 "menu 트리 구조" 참고 |
| `dataType` | string | `'string'` | 다른 컨트롤과 형식을 맞추기 위한 공통 속성(ContextMenu는 값 개념이 없어 실질적으로 사용하지 않음) |
| `belongID` / `getter` / `setter` / `controlText` / `validators` / `transactConfig` / `triggerConfig` | - | `null`/`false` | syn.uicontrols 공통 옵션(값 바인딩·유효성검사·트랜잭션 연동용). ContextMenu는 `getValue`/`setValue`/`clear`를 지원하지 않으므로 대부분 의미가 없습니다. |

### menu 트리 구조

`menu`는 메뉴 항목 객체의 배열입니다. 각 항목은 다음 속성을 가질 수 있습니다.

| 속성 | 설명 |
|---|---|
| `title` | 메뉴에 표시할 텍스트. `'---'`을 쓰면 구분선(separator)이 됩니다. |
| `cmd` | 항목을 식별하는 고유 문자열. `select` 이벤트의 `ui.cmd`로 전달되어 어떤 항목이 클릭됐는지 구분합니다. 구분선/하위메뉴를 여는 부모 항목에는 필요 없습니다. |
| `uiIcon` | jQuery UI 아이콘 클래스명(예: `'ui-icon-copy'`). 목록: https://api.jqueryui.com/theming/icons/ |
| `children` | 하위 메뉴(서브 메뉴) 배열. 같은 구조(`title`/`cmd`/`uiIcon`/`children`)를 재귀적으로 가질 수 있습니다. |
| `disabled` | (jquery-ui-contextmenu 옵션) 항목을 비활성화 상태로 시작하려면 `true` |

예시:

```js
menu: [
    { title: 'Cut', cmd: 'cut' },
    { title: 'Copy', cmd: 'copy', uiIcon: 'ui-icon-copy' },
    { title: '---' },
    {
        title: 'More', children: [
            { title: 'Sub 1', cmd: 'sub1' },
            { title: 'Sub 2', cmd: 'sub2' }
        ]
    }
]
```

## 메서드

`syn.uicontrols.$contextmenu.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getControl(elID)` | 등록된 컨트롤 정보(`{ id, context, config }`)를 반환. `context`는 jquery-ui-contextmenu가 적용된 jQuery 객체입니다. |
| `getValue(elID, meta)` | 지원 안 함(항상 `null` 반환) |
| `setValue(elID, value, meta)` | 지원 안 함(아무 동작 없음) |
| `clear(elID, isControlLoad)` | 지원 안 함(아무 동작 없음) |
| `close(elID)` | 열려 있는 메뉴를 닫습니다. |
| `open(elID, targetOrEvent, extraData)` | 메뉴를 프로그램적으로 엽니다. 버튼 클릭 등으로 강제로 메뉴를 띄울 때 사용합니다. |
| `isOpen(elID)` | 메뉴가 현재 열려 있는지 여부(boolean)를 반환합니다. |
| `enableEntry(elID, cmd, flag)` | 특정 `cmd` 항목을 활성화(`true`)/비활성화(`false`) 합니다. |
| `showEntry(elID, cmd, flag)` | 특정 `cmd` 항목을 보이거나(`true`) 숨깁니다(`false`). |
| `getEntry(elID, cmd)` | 특정 `cmd` 항목의 메뉴 데이터를 가져옵니다. |
| `setEntry(elID, cmd, data)` | 특정 `cmd` 항목의 데이터를 통째로 교체합니다. |
| `updateEntry(elID, cmd, data)` | 특정 `cmd` 항목의 데이터를 갱신(병합)합니다. |
| `setTitle(elID, cmd, title)` | 특정 `cmd` 항목의 표시 텍스트를 변경합니다. |
| `setIcon(elID, cmd, icon)` | 특정 `cmd` 항목의 아이콘을 변경합니다. |
| `getMenu(elID)` | 현재 메뉴 트리 전체 데이터를 반환합니다. |
| `getEntryWrapper(elID, cmd)` | 특정 `cmd` 항목의 DOM 래퍼 요소를 반환합니다. |
| `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 훅(ContextMenu는 별도 구현 없음, 빈 함수) |

> 참고: `getValue`/`setValue`/`clear`는 다른 syn.uicontrols 컨트롤과 인터페이스를 맞추기 위해 존재하는 자리표시자(placeholder)일 뿐, ContextMenu에는 "값" 개념이 없어 실제로 아무 것도 하지 않습니다.

## 이벤트 (syn-events)

`syn-events` 배열에 이름을 넣으면 페이지 스크립트의 `event` 객체에서 `{elID}_{이벤트명}` 함수를 자동으로 연결해 줍니다. (이벤트 핸들러 함수 시그니처는 `(evt, ui)`)

| 이벤트명 | 발생 시점 | 핸들러 인자 |
|---|---|---|
| `create` | 컨텍스트 메뉴가 처음 초기화될 때 1회 | `(evt, ui)` |
| `beforeOpen` | 메뉴가 열리기 직전 | `(evt, ui)` — `ui.target`으로 우클릭된 요소 확인 가능. `enableEntry`/`showEntry`로 항목을 동적으로 켜고 끄기 좋은 시점 |
| `open` | 메뉴가 화면에 열린 직후 | `(evt, ui)` |
| `select` | 메뉴 항목을 클릭(선택)했을 때 | `(evt, ui)` — `ui.cmd`로 어떤 항목이 선택됐는지 판별 |
| `close` | 메뉴가 닫힐 때 | `(evt, ui)` |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        ctxSample_beforeOpen(evt, ui) {
            syn.$l.eventLog('ctxSample_beforeOpen', ui.target ? ui.target.id : '');
        },
        ctxSample_select(evt, ui) {
            syn.$l.eventLog('ctxSample_select', ui.cmd);
        }
    }
}
```

## 참고

- 내부적으로 jQuery의 `.contextmenu(setting)` / `.contextmenu('메서드명', ...)` 호출을 그대로 감싼 구조이므로, 더 자세한 옵션/메서드/이벤트 원본 설명은 jquery-ui-contextmenu 문서를 참고하세요: https://github.com/mar10/jquery-ui-contextmenu
- TreeView(`syn_tree`)나 OrganizationView(`syn_organization`)와 함께 쓸 때는 `beforeOpen` 이벤트에서 `evt.target`(또는 `ui.target`)으로 우클릭된 노드를 찾아 `enableEntry`/`showEntry`로 항목을 동적으로 제어하는 패턴이 자주 쓰입니다.
- 메뉴를 버튼 클릭 등 우클릭이 아닌 방식으로 띄우고 싶다면 `open(elID, targetOrEvent, extraData)` 메서드를 사용하세요.
