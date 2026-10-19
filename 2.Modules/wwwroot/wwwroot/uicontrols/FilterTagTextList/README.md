# FilterTagTextList

Tom Select 2.6.2 기반 검색·조건 태그 컨트롤입니다. 키·표시값을 검색하고 그룹별 후보를 선택합니다. 태그를 클릭하면 AND/OR와 비교 연산자를 편집합니다.

```html
<syn_filtertagtextlist id="animals" syn-datafield="Conditions"
    syn-events="['initialize','change']"
    syn-options="{
        optgroups:[{value:'mammal',label:'Mammal'},{value:'bird',label:'Bird'}],
        optgroupField:'class',valueField:'value',labelField:'name'
    }"></syn_filtertagtextlist>
```

```javascript
const control = syn.uicontrols.$filtertagtextlist;
control.setValue('animals', [
    {class:'mammal',value:'dog',name:'Dog'},
    {class:'mammal',value:'cat',name:'Cat'},
    {class:'bird',value:'duck',name:'Duck'}
]);
control.addItem('animals', 'dog');
const saved = control.getValue('animals');
// [{groupID:'mammal',logic:'AND',operator:'eq',key:'dog',value:'Dog'}]
control.clear('animals');
control.setValue('animals', saved);
```

## 반환값과 식별

선택 태그는 기본적으로(`groupDisplay:'tooltip'`) 항목 이름만 보여주고, 그룹 이름(`optgroups.label`, 그룹이 등록되지 않았다면 그룹 ID, 그룹 ID도 비어 있으면 `기타`)은 태그에 마우스를 올렸을 때의 툴팁(`title`)과 접근성 이름으로 제공합니다. `groupDisplay:'inline'`을 지정하면 편집 버튼 왼쪽에 그룹 이름을 함께 표시하고, `groupDisplay:'badge'`를 지정하면(`hideLogicBadge:false`일 때만) `AND`/`OR` 배지 뒤에 그룹 이름을 이어서 보여줍니다(`AND · 직원 명`, 일반 텍스트의 key 표시와 같은 방식이며 길면 그룹 이름 부분만 줄임표로 자르고 그룹 ID가 비어 있는 후보는 `AND`/`OR`만 표시). `range` 그룹의 범위 태그는 `groupDisplay` 값과 관계없이 항상 값만 보여주고 그룹 이름은 툴팁으로 제공합니다. 그룹 이름(`inline`일 때)과 편집 버튼은 클릭 또는 Enter/Space/F2로 같은 태그를 선택하고 편집창에 포커스를 이동합니다. 편집창은 선택한 태그 아래에 표시하며 화면 아래 공간이 부족하면 위로 이동하고, 오른쪽 경계를 벗어나지 않도록 조정합니다. 스크롤·창 크기 변경 시 위치를 다시 계산합니다. 취소·Escape·적용 후에는 해당 태그의 편집 버튼으로 포커스를 돌려줍니다. 적용·취소 버튼은 Tabler `btn-group`(적용은 `btn btn-primary`, 취소는 `btn`)이며 높이는 콤보박스와 같은 34px입니다.

`hideLogicBadge:false`이면 AND/OR를 왼쪽 상단 배지로 보여주고(기본값 `true`는 배지를 만들지 않아 AND/OR는 툴팁과 편집창으로만 확인), 비교 조건은 왼쪽 테두리로 구분합니다. 배지를 숨기면 컨테이너에 `dttl-hide-badge` 클래스가 붙어 배지가 튀어나올 자리로 둔 태그 위쪽 여백(`margin-top`)이 0이 되고 줄 간격(`row-gap`)이 5px로 줄어듭니다. 이 설정은 초기화 때 한 번만 반영합니다. 편집창의 `연결`·`비교` 선택값과 목록 항목도 같은 Tabler 색상을 사용하며 글자색은 흰색입니다. 전체 조건은 태그에 마우스를 올리거나 편집 버튼의 접근성 이름으로 확인할 수 있습니다.

| 구분 | 값 | Tabler 색상 |
| --- | --- | --- |
| 연결 | AND / OR | blue / red |
| 비교 | 같음 (`eq`) | blue |
| 비교 | 작게 (`lt`) | green |
| 비교 | 같거나작게 (`lte`) | cyan |
| 비교 | 크게 (`gt`) | pink |
| 비교 | 같거나크게 (`gte`) | orange |
| 비교 | 다름 (`neq`) | red |
| 비교 | 시작함 (`begins_with`) | gray-600 (회색) |
| 비교 | 끝남 (`ends_with`) | purple |
| 비교 | 포함 (`contains`) | teal |
| 비교 | 미포함 (`not_contains`) | indigo |

색상은 컨트롤 CSS의 `data-dttl-logic`·`data-dttl-operator` 규칙에서 공통 관리하며 `--tblr-*` 변수를 사용합니다. 그룹 추가·제거 시 선택 태그의 그룹 표시도 갱신합니다.

`getValue()`는 선택 순서의 새 객체 배열을 반환하며 빈 선택은 `[]`입니다. `maxItems:1`이어도 배열입니다.

| 필드 | 의미 |
| --- | --- |
| `groupID` | `optgroupField` 속성값. 생략된 후보 그룹은 빈 문자열 |
| `logic` | `AND` 또는 `OR`. `setValue`에서 생략하면 `defaultLogic`(기본 `OR`) |
| `operator` | `eq`, `lt`, `lte`, `gt`, `gte`, `neq`, `begins_with`, `ends_with`, `contains`, `not_contains`. `setValue`에서 생략하면 `defaultOperator`(기본 `contains`) |
| `key` | `valueField` 속성값. 빈 문자열(`''`)도 허용 |
| `value` | `labelField` 속성값. 사용자가 별도로 입력하는 비교값이 아님 |

연산자는 각각 같음, 작게, 같거나작게, 크게, 같거나크게, 다름, 시작함, 끝남, 포함, 미포함입니다. 컨트롤은 조건을 수집하며 조건 평가나 SQL 생성은 수행하지 않습니다.

그룹·키는 대소문자를 구분하는 문자열로 정규화합니다. 후보의 `valueField` 값은 `''`(빈 문자열)도 허용하므로 `{class:'PositionName', value:'', name:'전체'}`처럼 값이 없는 후보를 둘 수 있습니다. 숫자·문자열이 아닌 값(`null`, `undefined`, 객체)이나 `valueField`가 없는 후보는 `TypeError`입니다. 빈 key 후보는 다른 후보와 같은 일반 조건으로 선택되어 `getValue()`에 `key:''`, `value:'전체'`로 포함되며 이름 검색(`전체`)으로 찾을 수 있습니다. 그룹마다 하나씩 둘 수 있고 같은 그룹에 빈 key가 둘이면 같은 그룹·키이므로 하나로 합쳐집니다. 입력창의 빈 문자열은 계속 무시합니다. 빈 key를 서버로 보낼지는 화면 코드에서 결정합니다(`contains ''`는 사실상 모든 행에 일치). 같은 그룹·키는 한 번만 선택할 수 있습니다. 다른 그룹에 같은 키가 있으면 `addItem({groupID:'mammal',key:'dog'})`처럼 참조 객체를 전달해야 합니다. 모호한 문자열 키는 오류입니다. DOM을 반환하는 메서드는 실제 `HTMLElement`를 반환합니다.

`options`의 후보에 `selected:true`를 지정하면 처음부터 선택된 상태로 시작합니다(예: `{class:'PositionName', value:'M00', name:'부장', selected:true}`). 초기화 때 한 번만 반영하며 `maxItems`를 넘는 후보는 선택되지 않습니다. 조건은 `defaultLogic`·`defaultOperator`를 사용하고 이벤트는 초기화 중이므로 발생하지 않습니다. 기반 요소의 값(`syn-datafield`)에는 반영되므로 이후 화면의 조회(`transactionAction`)에 함께 전달됩니다. 설정 `items`를 지정하면 `items`가 우선하며 `selected`는 무시합니다. 일반 텍스트와 범위 조건은 `options`에 없으므로 대상이 아닙니다.

## 기본 조건과 편집

조건을 지정하지 않고 선택한 항목(후보 선택, 일반 텍스트 입력, `setValue`·`setNormalText`에서 `logic`·`operator`를 생략한 항목)은 `defaultLogic`·`defaultOperator`를 사용합니다. 기본값은 `OR`·`contains`이며 `defaultLogic`은 `AND`·`OR`, `defaultOperator`는 `operators`의 키만 허용하고 그 외에는 초기화 때 `TypeError`입니다. 초기화 때 한 번만 반영합니다.

`conditionEditable:false`이면 태그를 클릭하거나 Enter·Space·F2를 눌러도 연결·비교 편집창이 열리지 않으므로 모든 조건이 기본 조건으로 고정됩니다. 삭제(×) 버튼은 그대로 동작하고, 태그는 클릭 가능한 모양(손가락 커서, 편집 `role`·접근성 이름)을 쓰지 않습니다. 코드의 `setValue`·`setNormalText`에서 `logic`·`operator`를 직접 지정하는 것은 막지 않습니다. `range` 조건은 영향을 받지 않으며 `AND`와 `gte`/`lt`로 고정이고 범위 편집창은 계속 열립니다.

```html
<!-- 같은 그룹은 OR(하나라도 일치), 비교는 포함으로 고정하고 편집창을 사용하지 않음 -->
<syn_filtertagtextlist id="keywords" syn-options="{defaultLogic:'OR', defaultOperator:'contains', conditionEditable:false}"></syn_filtertagtextlist>
```

서버(dbclient)와 그리드는 같은 그룹 안에서 첫 항목의 `logic`을 무시하고 나머지를 각 항목의 `logic`으로 연결하며 그룹 사이는 `groupLogic`으로 결합합니다. 기본 `OR`이면 같은 그룹에서 여러 항목을 고르면 하나라도 일치하는 행이 조회됩니다. 서버 field의 `operators`에는 `defaultOperator`를 포함해야 합니다.

## setValue 구분

| 입력 | 동작 |
| --- | --- |
| 후보 객체 배열 | 후보 목록 교체. 남아 있는 그룹·키의 선택 조건 유지 및 표시값 갱신. 사라진 후보 선택 해제 |
| `{groupID,logic,operator,key,value}` 배열 | 전체 선택 복원. 없는 후보는 등록하고 중복 조건은 첫 항목만 선택 |
| 문자열 또는 문자열 배열 | 기존 후보의 키로 선택 재설정. 알 수 없는 키는 오류 |
| `[]` | 선택만 해제. 후보는 유지 |

혼합 배열이나 잘못된 조건은 변경 전에 오류를 발생시킵니다. 조건 객체는 `groupID`, `key`가 필요하고 `value`는 후보가 없을 때 표시값으로 사용하며, `logic`과 `operator`를 생략하면 `defaultLogic`, `defaultOperator`(기본 `OR`, `contains`)를 적용합니다. 후보 스키마의 `optgroupField`가 `groupID`이거나 `valueField`가 `key`이면 후보와 조건 객체를 구분할 수 없으므로 이때는 `logic` 또는 `operator`가 있는 객체만 조건으로 보고, 생략하려면 `addOptions()`로 후보를 공급한 뒤 `addItem()`을 사용합니다.

`silent:true`는 컨트롤 `change` 및 기반 select의 change 이벤트를 억제합니다. `item_add`, `item_remove`, `clear` 등 개별 이벤트는 발생할 수 있습니다. 변경이 없는 선택 재설정은 `change`를 발생시키지 않습니다. HandStack 거래 setter가 전달하는 세 번째 인자의 메타데이터 객체는 silent로 처리하지 않습니다.

## 메서드

모듈 호출은 `syn.uicontrols.$filtertagtextlist.method(elID, ...args)`입니다. `getControl(elID)`로 받은 인스턴스에서는 elID 없이 호출합니다.

| 메서드 | 동작 |
| --- | --- |
| `addOption(data,user_created=false)`, `addOptions(data[],user_created=false)` | 후보 추가. 동일 그룹·키는 유지하며 드롭다운은 자동 갱신하지 않음 |
| `updateOption(ref,data)` | 후보와 선택 태그 갱신. 그룹·키 변경 시 기존 후보와 충돌하면 오류 |
| `removeOption(ref)` | 후보와 해당 선택 제거 |
| `getOption(ref,create=false)` | 후보 DOM 반환. 필요 시 렌더링 |
| `getAdjacent(element,direction)` | 이전(-1)/다음(1) 후보 DOM |
| `refreshOptions(triggerDropdown)` | 검색 목록 갱신 |
| `clearOptions(clearFilter?)` | 선택하지 않은 후보 제거. 콜백이 true인 후보와 선택된 후보는 유지 |
| `clearFilter(option,ref)` | 기본 유지 판단: 현재 선택된 후보이면 true |
| `clear(silent)` | 선택 전체 해제 |
| `getItem(ref)` | 선택 태그 DOM |
| `addItem(ref\|text,silent)` | 캐럿 위치에 선택 추가. 후보에 없는 문자열은 `create:true`일 때 일반 텍스트로 추가 |
| `removeItem(ref\|HTMLElement,silent)` | 선택 해제 |
| `createItem(value,callback?)` | create 설정으로 선택. 후보의 키·표시값과 같으면 그 후보, 아니면 일반 텍스트 생성 |
| `refreshItems()` | 선택 태그 다시 렌더링 |
| `addOptionGroup(id,data)`, `removeOptionGroup(id)`, `clearOptionGroups()` | 그룹 추가·제거. 그룹 제거 자체는 후보를 삭제하지 않음 |
| `on(event,handler)`, `off(event,handler?)`, `trigger(event,...args)` | 이벤트 구독·해제·실행 |
| `open()`, `close()`, `positionDropdown()` | 드롭다운 열기·닫기·위치 갱신 |
| `focus()`, `blur()` | 입력 포커스 이동 |
| `lock()`, `unlock()` | 포커스 가능한 입력 잠금·해제. 태그 편집·삭제도 잠금 |
| `disable()`, `enable()` | 포커스를 포함한 사용자 조작 비활성화·활성화 |
| `getValue()`, `setValue(value,silent)` | 후보 조건 조회·데이터 공급·선택 복원. 일반 텍스트는 제외 |
| `getGroupConditions(list)` | `[{operator,value,logic}]` 목록을 `operator`와 `logic`이 같은 것끼리 묶어 `[{name,args,logic}]`로 반환하는 정적 함수(컨트롤 인스턴스에는 없음). 아래 "조건 묶음 변환" 절 참고 |
| `getSummaryText(options?)` | 선택한 조건을 사용자에게 보여줄 텍스트로 반환. 아래 "조건 요약 텍스트" 절 참고 |
| `getNormalText()`, `setNormalText(items,silent)` | 일반 텍스트 `[{logic,operator,key,value}]` 조회·교체. 아래 "일반 텍스트" 절 참고 |
| `setRange(groupID,start,end)`, `getRange(groupID)` | `range` 그룹의 시작·끝 범위 설정·조회. 아래 "범위 입력" 절 참고 |
| `setCaret(index)`, `isFull()` | 캐럿 이동·선택 한도 도달 여부 |
| `clearCache()`, `setTextboxValue(str)` | 렌더링 캐시 초기화·검색 문자열 설정 |
| `load(query)` | load 콜백 호출. 최신 요청만 반영 |
| `sync()` | `source` select의 후보·선택을 읽고 기존 조건 메타데이터 유지 |
| `destroy()` | 이벤트·팝오버·DOM·컨트롤 레지스트리 정리. 같은 요소 재초기화 가능 |

`ref`는 문자열 키 또는 `{groupID,key}`입니다. `clearOptions` 콜백 인자는 원래 후보 데이터와 ref입니다. `persist:false`이면 user_created 후보는 선택 해제 시 제거됩니다(일반 텍스트는 설정과 관계없이 제거). `getControl().source`는 내부 기반 select이며 option의 value는 `JSON.stringify([groupID,key])`, text는 표시값입니다. 외부에서 이 select를 수정한 후 `sync()`를 호출할 수 있습니다. 화면의 `syn-datafield` 값은 공개 getValue/setValue를 사용합니다.

## 이벤트

초기화 전에 `onInitialize`, `onChange` 등 Tom Select 이름의 콜백 옵션을 제공하거나 `syn-events`와 페이지 `event.<elID>_<event>`를 사용합니다. 초기화 후에는 인스턴스 `on`을 사용합니다. 핸들러의 `this`는 컨트롤 인스턴스입니다.

| 이벤트 | 인자 |
| --- | --- |
| `initialize`, `focus`, `blur`, `clear`, `option_clear`, `optgroup_clear`, `destroy` | 없음 |
| `change` | 조건 객체 배열, 일반 텍스트 객체 배열(`getValue()`, `getNormalText()`). 논리·연산자 편집도 포함 |
| `item_add`, `item_remove` | 선택한 항목 하나 `{groupID,logic,operator,key,value}`(일반 텍스트는 `{normal:true,logic,operator,key,value}`), 태그 HTMLElement. 조건이 지정되지 않은 항목은 `defaultLogic`, `defaultOperator`(기본 `logic:'AND'`, `operator:'contains'`)로 전달 |
| `item_select` | 태그 HTMLElement |
| `option_add` | `{groupID,key}`, 원래 후보 데이터(일반 텍스트는 `{normal:true,logic,operator,key,value}` 두 인자 모두) |
| `option_remove` | `{groupID,key}`(일반 텍스트는 `{normal:true,logic,operator,key,value}`) |
| `option_change` | 조건 편집창의 `적용`으로 논리·연산자가 바뀐 항목 하나(`conditionEditable:false`이면 편집창이 없으므로 발생하지 않음) `{groupID,logic,operator,key,value}`(일반 텍스트는 `{normal:true,logic,operator,key,value}`), 변경 전 `{logic,operator}`. `change` 다음에 호출. 범위 편집창의 변경에는 발생하지 않음 |
| `optgroup_add` | id, 그룹 데이터 |
| `optgroup_remove` | id |
| `dropdown_open`, `dropdown_close` | 드롭다운 HTMLElement |
| `type` | 검색 문자열 |
| `suggest_select` | 추천 팝업에서 값을 고른 뒤 `{groupID,key,value}`. 일반 텍스트 `item_add`와 `change` 다음에 호출 |
| `load` | 원래 후보 데이터 배열 |

페이지 핸들러와 DOM 이벤트의 중복 호출을 막기 위해 컨트롤 이벤트는 초기화 시 직접 연결합니다. `destroy`에서 원래 `syn-events`를 복원합니다.

## 옵션과 비동기 제공자

드롭다운 크기는 입력 영역의 `width`와 별도로 설정합니다.

| 옵션 | 기본값 | 설정값 |
| --- | --- | --- |
| `dropdownWidth` | `'100%'`: 컨트롤 폭 | `'auto'`: 현재 표시 목록·그룹 제목에 맞춤, 숫자 또는 `'320px'`: 고정 너비 |
| `dropdownHeight` | `'auto'`: 내용에 맞춤, 목록 영역 최대 200px | 숫자 또는 `'180px'`: 드롭다운 전체의 고정 높이 |

숫자는 양수 픽셀값입니다. 기본 너비는 컨트롤 폭(`'100%'`)이며, 기본 높이는 기존 Tom Select의 크기 스타일을 유지합니다. `dropdownWidth:'auto'`는 검색·후보 갱신·비동기 조회·창 크기 변경 시 다시 계산하며 화면 오른쪽을 넘지 않도록 제한합니다. 고정 높이에서 내용이 넘치면 목록 내부를 스크롤합니다. `null`도 해당 옵션의 기본값으로 처리합니다. 후보 목록을 세로로 스크롤하면 현재 그룹의 헤더(`.optgroup-header`)가 목록 상단에 고정되고 다음 그룹의 헤더가 올라오면 밀려납니다. 목록에 그려진 그룹이 둘 이상이면 목록 위쪽에 그룹 이름 버튼 줄(`div.dttl-group-nav`, Tabler `btn-group`)이 나타나고, 버튼을 누르면 해당 그룹의 헤더가 상단에 오도록 부드럽게 스크롤합니다. 버튼을 눌러도 입력 포커스는 유지되며(`tabindex="-1"`) 목록을 스크롤하면 상단에 닿은 그룹의 버튼이 활성(`active`)으로 표시됩니다. 검색으로 그룹이 바뀌면 버튼도 다시 만들고, 그룹이 하나뿐이거나 후보가 없는 그룹(범위 그룹)은 버튼에 포함하지 않습니다. 버튼이 많으면 가로로 스크롤하며 `dropdownHeight`를 고정했을 때는 버튼 줄 높이만큼 목록 높이를 줄입니다. `groupNav:false`이면 버튼 줄을 만들지 않습니다. 운영체제의 "동작 줄이기" 설정이면 즉시 이동합니다.

`groupNavMode`는 그룹 버튼의 위치와 동작입니다. `'scroll'`은 위에서 설명한 대로 드롭다운 위쪽 버튼 줄에서 해당 그룹 헤더로 스크롤합니다. `'menu'`(기본값)는 `div.dttl-group-nav` 버튼 줄을 **입력 영역(텍스트 박스) 안쪽 왼쪽 첫 칸에 고정**하고, 버튼을 누르면 **그 버튼 바로 아래에 해당 그룹의 후보만** 목록으로 표시합니다. 그룹이 하나뿐이어도 버튼을 만들며 `rangeLayout:'nav'`의 범위 버튼도 같은 줄에 두어 누르면 그 버튼 아래에 범위 편집창을 엽니다. 열린 버튼은 `active` 클래스·`aria-expanded="true"`와 위쪽 화살표로 표시하고, 같은 버튼을 다시 누르면 닫고 다른 버튼을 누르면 목록을 그 그룹으로 바꿉니다. 입력창에 입력한 검색어와 ↑↓·Enter 선택은 열린 그룹 안에서만 동작하며 후보를 선택해도 목록은 열려 있습니다(선택한 후보는 목록에서 빠짐). 목록이 닫히면 다음에 입력창을 눌러 열리는 목록은 모든 그룹을 보여주고, 선택하지 않은 후보가 없는 그룹의 버튼은 비활성이 됩니다. 그룹 이름은 버튼에 있으므로 이때 목록의 그룹 헤더는 숨깁니다. 그룹 버튼으로 연 목록이 있는 동안에는 `suggest` 추천 팝업을 띄우지 않으며 입력한 글자는 그 목록 안에서 찾습니다. `'scroll'`·`'menu'` 이외의 값은 `TypeError`이며 초기화 때 한 번만 반영합니다.

`selectedDisplay`는 선택한 항목의 표시 방식입니다. `'tag'`는 지금처럼 `div.dttl-item.item` 태그로 보여주고, `'text'`(기본값)는 `groupNavMode:'menu'`(와 `groupNav:true`)에서만 사용할 수 있으며(아니면 `TypeError`) 그룹 버튼이 있는 후보와 범위 조건은 태그를 숨기고 **그룹 버튼의 글자로** 보여줍니다. 선택 값 자체는 그대로 저장되므로 `getValue()`와 `item_add`·`item_remove` 이벤트는 `'tag'`와 같습니다.

- 후보 그룹 버튼: 선택한 값만 선택 순서대로 콤마(`, `)로 이어 붙여 `팀장, 부장`처럼 보여주고, 그룹 이름을 포함한 전체 글자(`직위 명: 팀장, 부장`)는 툴팁(`title`)과 접근성 이름으로 제공합니다. 선택한 값이 있으면 파란 강조(`dttl-has-value`)를 줍니다. 값이 없으면 그룹 이름(`직위 명`)을 보여줍니다. 빈 값 후보(`value:''`)도 표시 이름(`전체`)으로 보여줍니다.
- 범위 버튼: 선택한 범위의 값만 `2026-01-01 ~ 2026-01-31`(시작만 있으면 `2026-01-01 ~`, 끝만 있으면 `~ 2026-01-31`)로 보여주고 그룹 이름을 포함한 전체 글자(`입사 일: 2026-01-01 ~ 2026-01-31`)는 툴팁(`title`)과 접근성 이름으로 제공합니다. 범위를 해제하면 `입사 일 · 년월일`로 돌아갑니다.
- 버튼 높이는 28px로 고정이며 글자가 길면 버튼 최대 폭(18rem)에서 줄임표로 자릅니다.
- 해제: 선택한 후보는 목록에 남고 Tabler Icons의 check(굵은 선, 파란색) 아이콘으로 표시되며 다시 누르거나(클릭·Enter) 해제합니다. 이 모드에서는 `hideSelected`를 쓰지 않으며 선택한 일반 텍스트·범위 조건은 후보 목록에서 제외합니다.
- `groupSelectAll:true`(`selectedDisplay:'text'`에서만 사용 가능, 아니면 `TypeError`)이면 목록에서 그룹의 빈 key 후보(예: `{value:'', name:'전체'}`)를 누를 때(클릭·Enter) 그 그룹의 후보(빈 key 후보 포함)가 **모두 선택되어 있으면 모두 해제**하고, **하나라도 선택되지 않았으면 모두 선택**합니다. 다른 그룹의 선택은 건드리지 않으며 후보를 하나씩 선택·해제할 때와 같은 `item_add`·`item_remove`·`change` 이벤트가 발생합니다. 이미 선택한 후보 일부가 있으면 나머지를 선택해 모두 선택 상태로 만듭니다(`maxItems`를 넘는 후보는 선택되지 않음). 이 옵션을 쓰지 않으면 빈 key 후보도 다른 후보처럼 개별로 선택·해제합니다.
- `groupChangeClearsText:true`(`groupNavMode:'menu'`에서만 사용 가능, 아니면 `TypeError`)이면 그룹 버튼 아래 목록에서 후보를 선택·해제하거나(`groupSelectAll`의 `전체` 토글 포함) **범위 편집창에서 범위를 적용·해제**하면 기존 **일반 텍스트 태그를 모두 지웁니다**. 후보와 범위 조건은 지우지 않고, 입력창에 입력 중인 글자도 그대로입니다. 일반 텍스트마다 `item_remove` 이벤트가 발생하므로 화면 코드가 이 이벤트로 필터를 해제할 수 있습니다(HRM010은 그리드 컬럼 필터가 풀립니다). 그룹 목록이 열려 있지 않을 때의 선택(입력창 검색 후보 선택)과 `setValue`·`addItem`·`setRange`·`setNormalText` 같은 코드 호출, 초기 선택(`selected`)은 대상이 아닙니다. 확인 창 없이 바로 지워지며 되돌릴 수 없습니다.
- `dropdownByButtonOnly:true`(`groupNavMode:'menu'`에서만 사용 가능, 아니면 `TypeError`)이면 후보 드롭다운(Tom Select 기본 목록)은 **그룹 버튼을 눌렀을 때만** 열립니다. 입력·포커스·↓ 키·일반 텍스트 태그를 만든 뒤에는 열리지 않으므로, 일치하는 데이터가 없는 글자를 입력해도 전체 후보 목록이나 `일반 텍스트 추가` 행이 나타나지 않습니다. 그룹 버튼으로 연 목록 안에서 검색어를 입력해 거르는 동작과 Enter로 키 없는 일반 텍스트를 만드는 동작, 추천 팝업은 그대로입니다. 키보드만으로는 후보 목록을 열 수 없습니다.
- 일반 텍스트(`create`로 만든 항목과 추천 팝업으로 고른 값)는 어느 그룹 버튼에도 속하지 않으므로 이전처럼 태그로 보여줍니다.
- 숨긴 태그가 보이지 않게 지워지지 않도록 입력창이 비어 있을 때 Backspace는 마지막 일반 텍스트 태그만 지우고 Delete·←·→·Ctrl+A는 동작하지 않습니다.
- 숨긴 태그는 조건 편집창을 열 수 없습니다(HRM010처럼 `conditionEditable:false`이면 영향 없음).

그룹 버튼 줄(`div.dttl-group-nav.dttl-nav-inline`)은 입력 영역 안의 DOM 맨 뒤에 있고 CSS `order:-1`로 맨 앞에 보입니다. TomSelect가 입력 영역 안에서 앞쪽 형제 요소의 개수로 항목 위치(삭제·캐럿)를 계산하므로 항목보다 앞에 요소를 두면 엉뚱한 항목이 지워집니다.


```html
<!-- 기본값: 컨트롤 폭, 기존 높이 -->
<syn_filtertagtextlist id="defaultSize" syn-options="{}"></syn_filtertagtextlist>
<!-- 목록에 맞춘 너비, 기본 높이 -->
<syn_filtertagtextlist id="autoSize" syn-options="{dropdownWidth:'auto'}"></syn_filtertagtextlist>
<!-- 드롭다운 전체 크기 고정 -->
<syn_filtertagtextlist id="fixedSize" syn-options="{dropdownWidth:320,dropdownHeight:180}"></syn_filtertagtextlist>
```

기본값은 `maxItems:null`, `hideSelected:true`(`selectedDisplay:'text'`에서는 무시), `clearAfterSelect:true`, `persist:true`, `create:true`, `openOnFocus:false`(`true`이면 포커스만으로 후보 목록을 엶), `groupDisplay:'badge'`(`'tooltip'`: 그룹 이름을 툴팁으로, `'inline'`: 태그 안에 표시, `'badge'`: AND/OR 배지 뒤에 표시, 배지를 표시할 때만 동작), `hideLogicBadge:true`(`false`이면 태그 왼쪽 위에 AND/OR 배지를 표시), `groupNav:true`(그룹 이동 버튼, 아래 설명), `groupNavMode:'menu'`(`'scroll'`이면 드롭다운 위쪽 버튼 줄에서 그룹 헤더로 스크롤, 아래 설명), `selectedDisplay:'text'`(`'tag'`이면 선택한 값을 태그로 표시, `'text'`는 그룹 버튼 글자로 표시, 아래 설명), `groupSelectAll:true`(그룹의 `전체` 후보로 그룹 전체를 선택·해제, 아래 설명), `groupChangeClearsText:true`(그룹 목록·범위 변경 시 일반 텍스트 삭제, 아래 설명), `dropdownByButtonOnly:true`(후보 드롭다운을 그룹 버튼으로만 열기, 아래 설명), `useParam:false`(`true`이면 서버 param으로 그룹별 값을 전송, "서버 param 전송" 절 참고), `defaultLogic:'OR'`·`defaultOperator:'contains'`(조건이 지정되지 않은 항목의 연결·비교, "기본 조건과 편집" 절 참고), `conditionEditable:false`(`true`이면 조건 편집창을 열 수 있음), `suggest:null`(입력 텍스트 추천 제공자 함수, "추천 팝업" 절 참고), `suggestLevel:1`(`2`이면 그룹과 값 목록의 2단 팝업), `suggestEnterFirst:true`(1단 팝업에서 Enter로 첫 행을 자동 선택), `rangeLayout:'nav'`(범위 버튼을 그룹 이동 버튼 줄에 배치, `'inline'`이면 입력 영역 오른쪽에 배치, "범위 입력" 절 참고), `loadThrottle:200`, `preload:false`입니다. 기본값은 `groupNavMode:'menu'` 방식을 기준으로 합니다. `groupNavMode:'scroll'`을 쓰면 이에 의존하는 `dropdownByButtonOnly`·`groupChangeClearsText`·`selectedDisplay:'text'`는 오류 없이 꺼지고(`selectedDisplay`는 `'tag'`), `groupSelectAll`은 `selectedDisplay:'text'`가 아니면, `suggestEnterFirst`는 `suggestLevel:1`이 아니면 꺼집니다. 기존 방식으로 쓰려면 `groupNavMode:'scroll'`, `rangeLayout:'inline'`, `create:false`, `defaultLogic:'AND'`, `conditionEditable:true`, `groupDisplay:'tooltip'`, `openOnFocus:true`, `suggestLevel:2`를 지정합니다. `create:true`로 만든 항목은 그룹 없이 일반 텍스트가 되며 `defaultGroupID`는 더 이상 사용하지 않습니다. 자세한 규칙은 "일반 텍스트" 절을 참고합니다.

함수 옵션은 페이지 `hook.controlInit` 또는 `controlLoad`에서 제공합니다.

```javascript
syn.uicontrols.$filtertagtextlist.controlLoad('animals', {
    create(input, callback) {
        callback({class:'custom',value:input,name:input});
    },
    load(query, callback) {
        // applicationSearch는 애플리케이션에서 구현하는 데이터 제공자입니다.
        applicationSearch(query).then(callback).catch(() => callback([]));
    }
});
```

`create`는 객체 반환, callback 또는 Promise를 지원하며 결과는 일반 텍스트(`valueField`는 key, `labelField`는 value, 그룹은 무시)가 됩니다. `load`는 후보 배열 반환, callback 또는 Promise를 지원하며 callback의 두 번째 인자로 그룹 배열을 전달할 수 있습니다. callback 방식은 완료 시 한 번 호출하고 데이터를 직접 반환하지 않습니다. 예외·Promise 거절은 잠금/로딩 상태를 해제하고 콘솔에 기록합니다. callback 방식은 실패 시에도 `callback()`을 호출해야 합니다. 데이터 교체·초기화·파괴 이후 오래된 응답과 이전 검색 응답은 무시합니다.

## 일반 텍스트 (options에 없는 입력)

`create:true`이면 후보에 없는 텍스트를 입력하고 Enter(또는 드롭다운의 `일반 텍스트 추가`)로 확정할 수 있습니다. 후보에 없는 입력은 모두 **일반 텍스트**이며 `getValue()`에는 포함되지 않고 `getNormalText()`로 따로 받습니다. 일반 텍스트 태그는 점선 테두리로 후보 태그와 구분합니다. `hideLogicBadge:false`이면 `AND`/`OR` 배지 뒤에 key를 이어서 보여주고(`AND · 직원 명`, key가 없으면 `AND`만), 배지를 숨기면(기본값) 후보의 그룹 이름처럼 `groupDisplay`를 따라 `groupDisplay:'inline'`일 때만 key가 있는 일반 텍스트의 key를 태그 안의 그룹 이름 영역에 보여주고, 그 외에는 툴팁으로만 제공합니다. 배지 색은 후보 태그와 같이 `AND`/`OR`에 따르며 긴 key는 key 부분만 줄임표로 자르고 전체는 태그에 마우스를 올리면 툴팁으로 확인합니다. 배지를 표시할 때는 그룹 이름 영역을 표시하지 않습니다.

| 입력 | key | value |
| --- | --- | --- |
| `블라블라` | `''` | `블라블라` |
| `키 이름:블라블라` | `키 이름` | `블라블라` |
| `시각:09:30` | `시각` | `09:30` |

- 첫 `:` 기준으로 앞은 key, 뒤는 value이며 항상 나눕니다. `:`가 들어간 검색어는 이스케이프할 수 없고 key와 value로 나뉩니다. 앞뒤 공백은 제거하며 value가 비면(`abc:`) 만들지 않습니다.
- 입력이 후보의 `key` 또는 표시값(`value`)과 정확히 같으면 일반 텍스트를 만들지 않고 그 후보를 선택합니다. 같은 후보가 여러 개면 아직 선택하지 않은 첫 후보를 우선합니다.
- 일반 텍스트에도 AND/OR와 비교 연산자 편집창을 사용하며 기본값은 `defaultLogic`, `defaultOperator`(기본 `OR`, `contains`)입니다. key·value 텍스트는 편집창에서 바꾸지 않습니다.
- `addItem('텍스트')`, `createItem('텍스트')`도 같은 규칙으로 일반 텍스트를 만듭니다. 후보 키와 같으면 후보를 선택하며, `addItem`은 잠금 상태에서도 코드로 추가할 수 있습니다.
- `create`를 함수로 지정해도 결과는 일반 텍스트이며 반환한 `groupID`는 무시합니다. `valueField`가 key, `labelField`가 value가 되고, `labelField`가 없거나 `valueField`와 같으면 key 없이 value만 사용합니다. 후보와 같은 입력은 함수를 호출하지 않고 그 후보를 선택합니다.
- 해제한 일반 텍스트는 `persist` 설정과 관계없이 후보 목록에 남지 않습니다. `defaultGroupID`는 더 이상 사용하지 않습니다.

`getNormalText()`는 선택 순서의 `[{logic, operator, key, value}]`를 반환하며 `groupID`는 없습니다. `setNormalText(items, silent)`는 일반 텍스트 선택만 교체하며 항목은 같은 형식의 객체이거나 `'value'`, `'key:value'` 문자열입니다. `logic`·`operator`를 생략하면 `defaultLogic`·`defaultOperator`(기본 `OR`·`contains`)이고 잘못된 항목이면 `TypeError`이며 기존 선택은 유지합니다. `maxItems`를 넘기면 오류입니다.

```javascript
control.createItem('작업실');            // 후보 표시값과 같으면 후보 선택, 아니면 일반 텍스트
control.addItem('이름:홍길동');
control.getValue();                       // 후보 조건만 (일반 텍스트 제외)
control.getNormalText();                  // [{logic:'AND', operator:'contains', key:'이름', value:'홍길동'}]
control.setNormalText([{logic:'OR', operator:'begins_with', key:'', value:'블라블라'}, '비고:확인 필요']);
```

- `setValue()`와 `setNormalText()`는 서로의 선택을 건드리지 않습니다. 후보 데이터 교체(`setValue(options)`)도 일반 텍스트를 유지하며 `clear()`는 둘 다 해제합니다. `getValue()`와 `getNormalText()`를 저장해 복원하려면 `setValue`와 `setNormalText`를 각각 호출합니다.
- `change` 이벤트는 `(getValue(), getNormalText())`를 인자로 받으며 일반 텍스트만 바뀌어도 발생합니다. `item_add`·`item_remove`·`option_add`·`option_remove`는 일반 텍스트에 `{normal:true, logic, operator, key, value}`를 전달합니다.
- `syn-datafield`에 기록되는 값은 `getValue()` 결과뿐입니다. 일반 텍스트는 `getNormalText()`를 화면 코드에서 읽어 서버의 별도 매개변수(예: LIKE 검색어)로 전달합니다.

## 추천 팝업 (입력 텍스트가 포함된 값을 그룹별로 찾기)

`suggest` 옵션에 함수를 제공하면 입력창에 텍스트를 입력할 때마다 그 함수를 호출하고, 결과를 2단 팝업으로 보여줍니다. 1차 팝업은 그룹(예: 그리드 컬럼)과 일치 개수, 2차 팝업은 마우스를 올리거나 선택한 그룹의 값 목록이며 입력한 글자는 `<mark>`로 강조합니다. 함수 옵션이므로 페이지 `hook.controlInit`(또는 `controlLoad`)에서 제공합니다.

```javascript
hook: {
    controlInit(elID) {
        if (elID === 'ddtConditions') {
            return {
                suggest(query) {
                    // [{label, key?, id?, count?, items:[값 | {value}]}]를 반환하거나 Promise로 돌려줍니다.
                    return [{ label: '직원 명', items: ['이정민', '이수진'] }, { label: '직위 명', items: ['이사'] }];
                }
            };
        }
    }
}
```

| 그룹 필드 | 의미 |
| --- | --- |
| `label` | 1차 팝업에 표시하는 그룹 이름 (필수) |
| `key` | 선택했을 때 일반 텍스트의 key. 생략하면 `label` |
| `id` | 그룹 식별자. 생략하면 순번 |
| `count` | 1차 팝업의 개수 표시. 생략하면 `items.length` (목록을 잘라 보여줄 때 전체 개수를 지정) |
| `items` | 값 목록. 문자열·숫자 또는 `{value}`. 비어 있는 값은 무시하며 `items`가 비면 그룹을 표시하지 않음 |

- 값을 고르면 `key`(그룹의 `key`)와 `value`의 **일반 텍스트**가 추가됩니다. `getNormalText()`로 읽으며 `{logic, operator, key, value}`이고 `defaultLogic`·`defaultOperator`를 사용합니다. `create:false`여도 추천으로 선택한 값은 일반 텍스트가 됩니다. 이미 선택한 값은 비활성으로 표시하고 `maxItems`에 도달하면 선택되지 않습니다.
- 선택하면 `item_add`(일반 텍스트)와 `change` 다음에 `suggest_select`가 호출됩니다. 입력창은 비워지고 포커스를 유지합니다.
- 제공자가 그룹을 하나도 돌려주지 않으면 팝업을 표시하지 않고 기존 후보 드롭다운이 열립니다. 그룹이 있으면 팝업이 떠 있는 동안 후보 드롭다운은 열지 않으며(같은 자리를 가리지 않기 위해), 입력창에서 Enter를 누르면 기존처럼 입력한 텍스트가 일반 텍스트(`create:true`일 때)가 됩니다.
- 입력할 때마다 동기 호출하며 Promise를 돌려주면 가장 최근 입력의 결과만 반영합니다. 예외·거절은 콘솔에 기록하고 팝업을 표시하지 않습니다. 한글 입력 중에도 입력 즉시 갱신하므로 제공자는 가볍게 유지합니다. 매우 큰 목록은 제공자에서 개수를 제한합니다.
- 입력창이 비거나 포커스를 잃거나 Esc·Tab, 항목 추가, 조건·범위 편집창 열기, 잠금·비활성 상태에서는 팝업을 닫습니다. 팝업은 입력 영역 아래에 표시하며 공간이 부족하면 위로 이동하고 화면 오른쪽 경계를 벗어나지 않도록 조정합니다.

| 키 | 동작 |
| --- | --- |
| ↓ (입력창) | 1차 팝업으로 이동 |
| ↑·↓ (1차) | 그룹 이동. 2차 팝업이 같이 바뀜 |
| →·Enter (1차) | 2차 팝업(값 목록)으로 이동 |
| ↑·↓ (2차) | 값 이동 |
| ← (2차) | 1차 팝업으로 복귀 |
| Enter (2차) | 값 선택 |
| Esc | 팝업 닫기 (입력한 텍스트는 유지) |

활성 행은 입력창의 `aria-activedescendant`로 알리며 두 팝업은 `role="listbox"`, 행은 `role="option"`입니다.

### 1단 팝업 (`suggestLevel:1`)

`suggestLevel:1`(기본값)이면 2차 팝업(값 목록) 없이 그룹 목록(1차 팝업)만 **입력 중인 글자가 시작되는 입력창의 왼쪽 아래**에 보여줍니다(`2`는 위에서 설명한 2단 팝업이며 입력 영역의 왼쪽 아래). 행에는 그룹 이름(`label`)만 표시하고 개수는 표시하지 않습니다. 제공자는 `items` 없이 `[{label, key?, id?}]`만 돌려주면 됩니다(`items`는 무시). 그룹을 선택하면(클릭, ↓ 후 ↑↓·Enter) **입력한 텍스트가 value**, 그룹의 `key`(생략하면 `label`)가 key인 일반 텍스트가 추가됩니다. 그룹 이름과 입력 텍스트가 같은 일반 텍스트를 이미 선택했으면 그 행은 비활성입니다. 마우스를 올려도 목록이 바뀌지 않으며 →·← 키는 사용하지 않습니다. 선택 후 입력창은 비워지고 `suggest_select` 이벤트(`value`는 입력한 텍스트)가 발생합니다. 값이 허용되지 않은 `suggestLevel`은 `TypeError`입니다.

`suggestEnterFirst:true`(`suggestLevel:1`에서만 사용 가능, 아니면 `TypeError`)이면 팝업이 떠 있을 때 행을 고르지 않고 입력창에서 바로 Enter를 눌러도 **첫 번째 행이 선택**됩니다. 이미 선택한 행(비활성)은 건너뛰어 그다음 선택 가능한 행을 고르며, 선택 가능한 행이 없으면 아무 동작도 하지 않습니다. ↓로 행에 들어가 이동한 뒤 Enter를 누르면 그 행이 선택됩니다. 일치하는 그룹이 없어 팝업이 없을 때의 Enter는 기존처럼 키 없는 일반 텍스트를 만듭니다(팝업이 있을 때만 키 없는 일반 텍스트를 만들 수 없음). 한글 조합 중의 Enter는 무시합니다.

HRM010의 `검색 키워드`는 `suggestLevel:1`로 `grdGrid1`의 표시 컬럼(`getColumnInfoList`의 `visible`) 중 입력 텍스트가 포함된 값이 있는 컬럼만 1단 팝업에 보여줍니다(`suggestGridColumns`). 필터 이전의 전체 데이터(`AUIGrid.getOrgGridData`)를 사용하며, 컬럼의 `headerText`를 key로 선택하면 `applyConditionFilter`가 일반 텍스트의 key로 컬럼을 찾아 입력 텍스트의 포함(`contains`) 필터를 그리드에 적용합니다.

## 조건 요약 텍스트

`getSummaryText(options?)`는 현재 선택한 조건(후보, 일반 텍스트, 범위)을 사용자에게 보여줄 한 줄 텍스트로 반환합니다. 선택이 없으면 `''`입니다. 순수 텍스트이므로 HTML에 넣을 때는 이스케이프하거나 `textContent`를 사용합니다.

```javascript
control.getSummaryText();
// (이름 같음 "홍길동" 또는 이름 포함 "김") 그리고 부서 포함 "작업실" 그리고 이름 포함 텍스트 "최" 그리고 작성일 2026-10-01 ~ 2026-10-31
```

- 같은 그룹(`groupID`)의 조건은 선택 순서대로 나열하고, 두 번째 조건부터 그 조건의 `logic`(`그리고`·`또는`)으로 앞 조건과 연결합니다. 서버의 dbclient 필터가 같은 그룹을 각 항목의 `logic`으로, 그룹 사이를 `groupLogic`으로 묶는 방식과 같습니다.
- 각 조건은 `그룹 이름 연산자 "값"`입니다. 그룹 이름은 `optgroups.label`(없으면 그룹 ID, 비어 있으면 `기타`)이고 값에 `"`가 있으면 `\"`로 바꿉니다. 일반 텍스트는 key를 그룹 이름으로 쓰며 key가 없으면 `텍스트`이고 key가 있으면 후보 그룹과 구분되도록 값 앞에 `텍스트`를 붙여 `이름 포함 텍스트 "최"`로 표현하며, key가 같은 일반 텍스트끼리 한 그룹입니다.
- 범위 그룹의 시작·끝 조건은 한 항목으로 합칩니다. `작성일 2026-10-01 ~ 2026-10-31`, 한쪽만 있으면 `작성일 2026-10-01 부터`, `작성일 2026-10-31 까지`입니다.
- 그룹이 둘 이상이고 한 그룹에 조건이 둘 이상이면 그 그룹을 괄호로 묶습니다.

| 옵션 | 기본값 | 의미 |
| --- | --- | --- |
| `groupLogic` | `'AND'` | 그룹 사이 연결. `'AND'` 또는 `'OR'`. 서버 계약의 `groupLogic`과 맞춥니다 |
| `logicLabels` | `{AND:'그리고', OR:'또는'}` | 연결어 문구. 일부만 지정해도 됩니다 |
| `includeNormalText` | `true` | `false`이면 일반 텍스트를 제외 |
| `normalTextLabel` | `'텍스트'` | key가 있는 일반 텍스트의 값 앞에 붙는 문구. `''`이면 붙이지 않음 |
| `parentheses` | `true` | `false`이면 그룹 괄호를 쓰지 않음 |

컨트롤은 서버 계약을 알지 못하므로 `<field logic>`처럼 서버에서 그룹 결합을 덮어쓰는 설정은 요약에 반영하지 않습니다. `groupLogic`이 `OR`이면 `{groupLogic:'OR'}`를 전달합니다. `groupLogic`이 `AND`·`OR`가 아니면 `TypeError`입니다.

## 조건 묶음 변환

`syn.uicontrols.$filtertagtextlist.getGroupConditions(list)`는 `[{operator, value, logic}]` 목록(예: `getNormalText()` 결과)을 `operator`와 `logic`이 모두 같은 항목끼리 묶어 `[{name, args, logic}]`로 바꿉니다. 묶음 순서는 처음 나타난 순서이고 `args`는 `value`의 순서를 유지합니다. `operator` 이름은 변환하지 않으므로 대상 컨트롤이 쓰는 이름으로 바꿔야 하면 결과의 `name`을 직접 바꿉니다.

```javascript
syn.uicontrols.$filtertagtextlist.getGroupConditions([
    {operator:'contains', value:'홍', logic:'AND'},
    {operator:'contains', value:'김', logic:'AND'},
    {operator:'neq', value:'테스트', logic:'OR'}
]);
// [{name:'contains', args:['홍','김'], logic:'AND'}, {name:'neq', args:['테스트'], logic:'OR'}]
```

## 범위 입력 (년월일·년월·시간)

`optgroups`의 항목에 `range`를 지정하면 그 그룹은 후보 목록 대신 시작·끝 범위를 입력하는 그룹이 됩니다. 그룹마다 `작성일 · 년월일` 같은 범위 버튼이 입력 영역 오른쪽 안에 나란히 배치되며(컨트롤 폭이 좁으면 입력 영역 아래로 내려감), 버튼이나 범위 태그를 누르면 편집창에서 시작·끝을 입력합니다. 시작과 끝은 각각 비울 수 있습니다. 범위 편집창의 `적용`·`해제`·`취소`는 조건 편집창과 같은 Tabler `btn-group`(적용은 `btn btn-primary`, 나머지는 `btn`)이며 높이는 입력 상자와 같은 34px입니다. 선택한 범위가 없으면 편집창의 시작·끝은 현재 날짜·월·시각(브라우저 로컬 시간)이 기본값입니다.

`rangeLayout`은 범위 버튼의 배치입니다. `'inline'`은 입력 영역 오른쪽 안에 겹쳐 배치하고 폭이 좁으면 아래로 내립니다. `'nav'`(기본값)는 입력 영역에는 버튼을 두지 않고, 드롭다운 위쪽의 그룹 이동 버튼 줄(`div.dttl-group-nav`)의 `btn-group` 끝에 `작성일 · 년월일` 같은 범위 버튼(`button.dttl-nav-range`)을 넣습니다. 버튼을 누르면 드롭다운이 닫히고 입력 영역 아래에 범위 편집창이 열리며, 취소·적용 후에는 입력창으로 포커스를 돌려줍니다. 범위가 선택된 그룹의 버튼은 `dttl-range-active`(파란 테두리)와 `aria-pressed="true"`로 표시합니다. `nav`에서는 range 그룹이 있으면 그룹이 하나뿐이거나 `groupNav:false`여도 버튼 줄을 표시하며, 이때 그룹 이동 버튼은 그룹이 둘 이상이고 `groupNav`가 `false`가 아닐 때만 포함합니다. `'inline'`·`'nav'` 이외의 값은 `TypeError`이며 초기화 때 한 번만 반영합니다.

```html
<syn_filtertagtextlist id="periods" syn-datafield="Periods" syn-events="['change']"
    syn-options="{
        optgroups:[
            {value:'createdAt',label:'작성일',range:'date',min:'2026-01-01',max:'2026-12-31'},
            {value:'closingMonth',label:'마감월',range:'month',min:'2026-01',max:'2026-12'},
            {value:'workTime',label:'근무시간',range:'time',min:'00:00',max:'23:59'}
        ],
        optgroupField:'class',valueField:'value',labelField:'name'
    }"></syn_filtertagtextlist>
```

| `range` | 입력 | 시작 → 조건 | 끝 → 조건 |
| --- | --- | --- | --- |
| `date` (년월일) | `yyyy-MM-dd` | `gte 2026-10-01` | `lt 2026-11-01` (끝 `2026-10-31`의 다음 날) |
| `month` (년월) | `yyyy-MM` | `gte 2026-10` | `lt 2027-01` (끝 `2026-12`의 다음 달) |
| `time` (시간, 하루 중 시각) | `HH:mm` | `gte 09:30` | `lt 10:01` (끝 `10:00`의 다음 분). 끝이 `23:59`이면 `lte 23:59:59.9999999` |

`min`·`max`는 선택할 수 있는 범위를 제한하는 선택 옵션이며 `range`와 같은 형식(`date`는 `yyyy-MM-dd`, `month`는 `yyyy-MM`, `time`은 `HH:mm`)입니다. 한쪽만 지정해도 되고 둘 다 생략하면 제한이 없습니다. 편집창의 입력창에 `min`·`max`를 적용하고 `setRange`도 같은 범위를 검사합니다. 범위를 벗어난 시작·끝은 `TypeError`이며 편집창에 안내 메시지를 표시합니다. 형식이 잘못되었거나 `min`이 `max`보다 늦으면 그룹 등록 시 `TypeError`입니다. `setValue()`로 복원하는 조건은 `min`·`max`로 검사하지 않습니다.

끝을 포함하는 입력(`2026-10-31`까지)을 서버의 `lt` 비교로 바꾸기 위해 다음 단위로 변환합니다. 이 방식은 `DateTime` 컬럼의 정밀도와 무관하게 해당 날짜·월·분 전체를 포함합니다. `yyyy-MM` 값은 서버가 해당 월 1일 00:00으로 해석합니다.

`getValue()`에는 일반 조건과 같은 형식으로 포함되며 `value`는 표시명(`2026-10-01 부터`, `2026-10-31 까지`)입니다. 두 조건의 `logic`은 `AND`입니다. 같은 그룹을 시작·끝 한 쌍으로 결합하므로 이 조건의 `logic`을 `OR`로 바꾸지 않습니다. 범위 조건 태그는 시작·끝을 함께 편집하는 범위 편집창으로 열리며 `AND/OR`·비교 연산자 편집창은 사용하지 않습니다.

```javascript
const control = syn.uicontrols.$filtertagtextlist;
control.setRange('periods', 'createdAt', '2026-10-01', '2026-10-31'); // gte + lt
control.setRange('periods', 'createdAt', '2026-10-15', '');           // 시작만: gte
control.getRange('periods', 'createdAt');                              // {start:'2026-10-15', end:''}
control.setRange('periods', 'createdAt', '', '');                      // 해제
```

- `setRange`는 `min`·`max`를 벗어난 값도 거부합니다. 같은 그룹의 기존 범위 조건을 교체하고 `change`를 발생시킵니다. 형식이 잘못되었거나(`2026-02-30`, `24:00`) 시작이 끝보다 늦으면(시간은 자정을 넘는 범위 `22:00~02:00` 포함) `TypeError`를 던지며 기존 선택은 유지합니다. `range`가 없는 그룹은 오류입니다.
- `date` 끝은 `9999-12-30`, `month` 끝은 `9999-11`까지입니다.
- `maxItems`가 범위 조건 수(시작·끝 각 1개)보다 작으면 오류입니다.
- `getValue()`의 범위 조건을 `setValue()`로 복원할 수 있습니다. 컨트롤은 표시명의 `부터`·`까지` 접미사와 `gte`/`lt`(`lte`)로 범위 조건을 식별하므로 `value`를 바꾸지 않습니다.
- `range`는 `date`, `month`, `time`만 허용하며 다른 값은 `TypeError`입니다. 범위 조건은 일반 후보 목록에 남지 않고 선택을 해제하면 사라집니다.
- `type="month"`와 `type="time"` 입력을 지원하지 않는 브라우저(데스크톱 Firefox·Safari 등)에서는 일반 텍스트 입력으로 나타나며 `yyyy-MM`, `HH:mm`으로 직접 입력합니다. 형식이 맞지 않으면 편집창에 안내 메시지를 표시합니다.

서버 계약에는 그룹마다 대응하는 `<field>`를 선언합니다.

```xml
<filters parameter="Filters" groupLogic="AND">
    <field groupID="createdAt" column="M.CreatedAt" type="DateTime" operators="gte,lt,lte" />
    <field groupID="closingMonth" column="M.ClosingMonth" type="Date" operators="gte,lt" />
    <field groupID="workTime" column="M.WorkTime" type="Time" operators="gte,lt,lte" />
</filters>
```

`Time`은 `HH:mm[:ss[.fffffff]]`(00:00 이상 24:00 미만)를 받습니다. SQL Server·MySQL/MariaDB·PostgreSQL은 `time` 컬럼과 직접 비교합니다. SQLite는 시각을 텍스트(`HH:mm:ss`)로 저장하므로 문자열로 비교하고, Oracle에는 시각만 저장하는 타입이 없어 `timeFormat="String"`(`VARCHAR2`의 `HH:mm:ss` 저장)을 명시해야 합니다. 자세한 규칙은 `2.Modules/dbclient/readme.md`를 참고합니다.

## dbclient 필터 연결

`getValue()`의 결과를 `JSON.stringify()`로 직렬화해 dbclient의 `Filters` 문자열 매개변수에 전달합니다.

```javascript
const parameter = {
    ParameterName: 'Filters', DbType: 'String', Length: -1,
    Value: JSON.stringify(syn.uicontrols.$filtertagtextlist.getValue('animals'))
};
```

서버 SQL 계약에는 `<filters parameter="Filters" groupLogic="AND">`와 `<field groupID="..." column="..." type="String" operators="eq,neq" />`를 선언합니다. `groupID`는 서버에 등록한 검색 필드, `key`는 비교값, `value`는 표시명입니다. 컨트롤이 만드는 조건의 기본 `operator`는 `contains`이므로, 화면에서 연산자를 지정하지 않고 보낼 필드는 `operators`에 `contains`를 포함해야 합니다(포함하지 않으면 서버가 허용하지 않은 연산자로 거부). 동물 데모의 `mammal`·`bird`·`reptile`을 사용할 때도 대상 테이블의 컬럼 매핑을 계약에 등록해야 합니다. `GD06`의 `user`·`content`·`createdAt`·`conversation` 그룹을 사용하려면 UI 후보의 그룹과 키도 그 검색 필드에 맞춰 공급합니다.

빈 선택은 `[]`로 전달되어 조건을 추가하지 않습니다. 같은 그룹은 선택 순서의 AND/OR로 묶고 첫 항목의 연결은 무시하며, 그룹 사이는 `groupLogic`으로 결합합니다. 날짜는 시간대 없는 `DateTime`과 명시적 오프셋을 갖는 `DateTimeOffset`을 구분합니다. GUID 저장 형식이 다르면 서버 field의 `guidFormat`을 지정합니다. 자세한 공급자별 설정과 재현 절차는 `2.Modules/dbclient/readme.md`의 JSON 배열 필터 SQL을 참고합니다.

### 서버 param 전송 (`useParam`)

기본(`useParam:false`)은 `syn-datafield`(예: `Conditions`) **요청 항목 하나**에 `getValue()` 배열을 실어 dbclient의 `<filters parameter="Conditions">`가 WHERE를 만들게 합니다. `useParam:true`이면 `Conditions` 대신 **`optgroups`의 `value`마다 요청 항목(`dataMapSet`의 `id`) 하나**를 보내고, 서버 계약에서는 같은 이름의 `<param id="@PositionName" …>`로 받습니다. 연산자·연결(`logic`)은 전달되지 않고 key 값만 가므로 SQL은 `IN`/`CHARINDEX` 같은 같음 기준으로 직접 작성합니다.

| 그룹 | 요청 항목 `id` | 값 |
| --- | --- | --- |
| 후보 그룹(`PositionName`) | `PositionName` | 선택한 key를 선택 순서대로 쉼표로 이은 문자열(`M00,N00`). 선택이 없으면 빈 문자열 |
| 후보 그룹에서 빈 key 후보(`전체`)를 선택 | 같음 | 빈 문자열(그 그룹은 제한 없음). 다른 key를 함께 선택해도 빈 문자열 |
| 범위 그룹(`JoinedDate`, `range` 지정) | `JoinedDateStart`, `JoinedDateEnd` | 사용자가 입력한 시작·끝 값(`2026-01-01`). 끝은 변환하지 않은 입력값이며 비어 있으면 빈 문자열 |

- 일반 텍스트는 `optgroups`에 속하지 않으므로 전송하지 않습니다(`getValue()`에도 포함되지 않음).
- key에는 쉼표가 없어야 합니다(구분자와 구분할 수 없음).
- **요청 항목은 컨트롤이 로드될 때 `syn-options`에 쓴 `optgroups`로 등록**하므로 `optgroups`는 `syn-options`에 직접 적습니다(`hook.controlInit`이나 `addOptionGroup`으로 나중에 추가한 그룹은 전송되지 않음). 이 모드에서는 `Conditions` 항목을 보내지 않으며 `syn-datafield`가 없으면 사용할 수 없습니다.
- 요청 항목 이름(그룹 value, 범위는 `Start`·`End` 접미어)은 같은 폼의 다른 컨트롤 `syn-datafield`와 겹치면 안 됩니다. 프레임워크가 같은 이름의 컨트롤이 둘이면 값을 읽지 못하므로(저장 등 다른 거래도 영향) 이름이 겹치면 그룹 value를 바꿉니다. HRM010은 재직 상태 그룹을 `EmployeeStatus` 대신 `EmployeeStatusName`으로 씁니다.
- `getValue(elID)`는 이 모드에서도 조건 배열을 반환하고, 프레임워크가 `meta`(`{fieldID}`)를 넘길 때만 그 그룹의 문자열을 반환합니다.

```xml
<!-- HRM010.dbc LD01: useParam:true와 useParam:false(filters)를 함께 지원 -->
AND (ISNULL(@PositionName, '') = '' OR CHARINDEX(',' + E.PositionID + ',', ',' + @PositionName + ',') > 0)
AND (ISNULL(@JoinedDateStart, '') = '' OR E.JoinedDate >= @JoinedDateStart)
AND (ISNULL(@JoinedDateEnd, '') = '' OR E.JoinedDate < DATEADD(DAY, 1, CONVERT(DATE, @JoinedDateEnd)))
<param id="@PositionName" type="String" length="1000" value="" />
<param id="@JoinedDateStart" type="String" length="10" value="" />
<param id="@JoinedDateEnd" type="String" length="10" value="" />
```


## 유지보수 구조

기존 UI 컨트롤과 같이 `$filtertagtextlist.extend({...})`에 메서드를 직접 선언합니다. `controlLoad`가 설정을 병합하고 `addControlSetting`에서 생성한 상태를 `textListControls`에 보관한 다음 `initialize` 이벤트를 발생시킵니다.

공개 메서드는 `(elID, ...)` 형태로 컨트롤을 조회하여 처리합니다. `getControl(elID)`가 반환하는 객체의 동일한 메서드는 기존 인스턴스 호출을 유지하기 위한 연결 함수입니다. 동작을 변경할 때는 모듈의 해당 메서드를 수정합니다.

후보·조건 변환은 `getValueType`, `normalize`, `condition`, `resolve`에서, 이벤트 연결은 `eventCallbacks`, `relay`, `on/off/trigger`에서 관리합니다. `createItem/load`의 비동기 완료 콜백은 파괴 여부와 요청 순번을 확인하므로 이 검사를 유지합니다.

## 빌드와 검증

`2.Modules/wwwroot`에서 `dotnet libman restore`로 고정된 Tom Select 자산을 복원하고 `node node_modules/gulp/bin/gulp.js`로 번들을 생성합니다. 라이브러리는 기존 저장소 규약대로 libman.json으로 관리합니다.

샘플: `/sample/uicontrol/filtertagtextlist.html`. 개별 로딩 및 Development/Production 번들에서 확인합니다.
