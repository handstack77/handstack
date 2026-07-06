# ContextMenu (syn.uicontrols.$contextmenu)

## 이 컨트롤은 무엇인가요?

ContextMenu는 마우스 오른쪽 버튼 클릭(우클릭) 시 나타나는 메뉴를 만드는 컨트롤입니다.
내부적으로는 [jquery-ui-contextmenu](https://github.com/mar10/jquery-ui-contextmenu) 플러그인을 감싸서 `syn.uicontrols.$contextmenu` 싱글턴 객체로 제공합니다.

다른 컨트롤들과 다르게 ContextMenu 자체는 화면에 아무것도 그리지 않습니다. 대신 `target`(메뉴가 뜰 대상)과 `delegate`(그 대상 안에서 실제로 우클릭을 감지할 하위 요소 셀렉터)를 지정해 두면, 사용자가 해당 요소를 우클릭했을 때 미리 정의한 `menu` 트리(항목/구분선/하위 메뉴)를 팝업으로 보여줍니다.

## 언제 사용하나요?

- 트리 구조 컨트롤(TreeView, OrganizationView 등)의 노드를 우클릭해서 "추가/이름변경/삭제" 같은 동작을 실행할 때
- 그리드(AUIGrid 등)의 행/셀을 우클릭해서 "복사/붙여넣기/행 삭제" 같은 동작을 제공할 때
- 일반 `div`, `span` 같은 임의의 화면 영역에 우클릭 메뉴를 붙이고 싶을 때

실제로는 TreeView(`syn_tree`)나 OrganizationView(`syn_organization`)와 함께 쓰이는 경우가 많습니다. `target`에 트리/조직도 컨테이너 셀렉터를, `delegate`에 노드 타이틀 요소 셀렉터(예: `span.fancytree-title`, `div.node`)를 지정하는 방식입니다.

## 빠른 시작

```html
<div id="divTarget">
    <input type="button" value="여기를 우클릭 해보세요" />
</div>

<syn_contextmenu id="ctxSample" syn-options="{
    target: '#divTarget',
    delegate: 'input[type=button]',
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

```js
'use strict';
let $samplePage = {
    event: {
        ctxSample_select(evt, ui) {
            syn.$l.eventLog('ctxSample_select', ui.cmd);
        }
    }
}
```

핵심 포인트:
- 마크업은 `<syn_contextmenu>` 커스텀 태그로 작성하고, `syn-options`에 `target`/`delegate`/`menu`를 JSON으로 넣습니다.
- 페이지에 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 나머지 CSS/JS는 자동으로 로드됩니다.
- 메뉴 클릭 결과는 `select` 이벤트의 `ui.cmd` 값으로 구분합니다.

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(예: rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `basic.html` : 일반 `div`에 우클릭 메뉴를 붙이는 가장 단순한 예제
- `nested-menu.html` : `children`으로 하위 메뉴(서브 메뉴)를 구성하는 예제
- `events.html` : `beforeOpen`/`select` 등 이벤트를 로그로 확인하는 예제

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/ContextMenu/ContextMenu.js`, `ContextMenu.css`
- 기존 샘플: `wwwroot/sample/uicontrol/contextmenu.html`, `wwwroot/sample/uicontrol/treeview.html` (TreeView와 함께 쓰는 예)
- jquery-ui-contextmenu 원본 문서: https://github.com/mar10/jquery-ui-contextmenu
- 아이콘 클래스 목록(`uiIcon`): https://api.jqueryui.com/theming/icons/
