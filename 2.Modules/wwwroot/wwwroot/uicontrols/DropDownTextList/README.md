# DropDownTextList

Tom Select 2.6.2 기반 검색·조건 태그 컨트롤입니다. 키·표시값을 검색하고 그룹별 후보를 선택합니다. 태그를 클릭하면 AND/OR와 비교 연산자를 편집합니다.

```html
<syn_dropdowntextlist id="animals" syn-datafield="Conditions"
    syn-events="['initialize','change']"
    syn-options="{
        optgroups:[{value:'mammal',label:'Mammal'},{value:'bird',label:'Bird'}],
        optgroupField:'class',valueField:'value',labelField:'name'
    }"></syn_dropdowntextlist>
```

```javascript
const control = syn.uicontrols.$dropdowntextlist;
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

선택 태그는 편집 버튼 왼쪽에 `optgroups.label`을 표시합니다. 그룹이 등록되지 않았다면 그룹 ID를, 그룹 ID도 비어 있으면 `기타`를 표시합니다. 그룹 이름과 편집 버튼은 클릭 또는 Enter/Space/F2로 같은 태그를 선택하고 편집창에 포커스를 이동합니다. 편집창은 선택한 태그 아래에 표시하며 화면 아래 공간이 부족하면 위로 이동하고, 오른쪽 경계를 벗어나지 않도록 조정합니다. 스크롤·창 크기 변경 시 위치를 다시 계산합니다. 취소·Escape·적용 후에는 해당 태그의 편집 버튼으로 포커스를 돌려줍니다.

AND/OR는 왼쪽 상단 배지로, 비교 조건은 왼쪽 테두리로 구분합니다. 편집창의 `연결`·`비교` 선택값과 목록 항목도 같은 Tabler 색상을 사용하며 글자색은 흰색입니다. 전체 조건은 태그에 마우스를 올리거나 편집 버튼의 접근성 이름으로 확인할 수 있습니다.

| 구분 | 값 | Tabler 색상 |
| --- | --- | --- |
| 연결 | AND / OR | blue / red |
| 비교 | 같음 (`eq`) | blue |
| 비교 | 같거나작게 (`lte`) | cyan |
| 비교 | 같거나크게 (`gte`) | orange |
| 비교 | 다름 (`ne`) | red |
| 비교 | 시작함 (`startsWith`) | gray-600 (회색) |
| 비교 | 끝남 (`endsWith`) | purple |
| 비교 | 포함 (`contains`) | teal |

색상은 컨트롤 CSS의 `data-dttl-logic`·`data-dttl-operator` 규칙에서 공통 관리하며 `--tblr-*` 변수를 사용합니다. 그룹 추가·제거 시 선택 태그의 그룹 표시도 갱신합니다.

`getValue()`는 선택 순서의 새 객체 배열을 반환하며 빈 선택은 `[]`입니다. `maxItems:1`이어도 배열입니다.

| 필드 | 의미 |
| --- | --- |
| `groupID` | `optgroupField` 속성값. 생략된 후보 그룹은 빈 문자열 |
| `logic` | `AND` 또는 `OR`, 기본 `AND` |
| `operator` | `eq`, `lte`, `gte`, `ne`, `startsWith`, `endsWith`, `contains` |
| `key` | `valueField` 속성값 |
| `value` | `labelField` 속성값. 사용자가 별도로 입력하는 비교값이 아님 |

연산자는 각각 같음, 같거나작게, 같거나크게, 다름, 시작함, 끝남, 포함입니다. 컨트롤은 조건을 수집하며 조건 평가나 SQL 생성은 수행하지 않습니다.

그룹·키는 대소문자를 구분하는 문자열로 정규화합니다. 같은 그룹·키는 한 번만 선택할 수 있습니다. 다른 그룹에 같은 키가 있으면 `addItem({groupID:'mammal',key:'dog'})`처럼 참조 객체를 전달해야 합니다. 모호한 문자열 키는 오류입니다. DOM을 반환하는 메서드는 실제 `HTMLElement`를 반환합니다.

## setValue 구분

| 입력 | 동작 |
| --- | --- |
| 후보 객체 배열 | 후보 목록 교체. 남아 있는 그룹·키의 선택 조건 유지 및 표시값 갱신. 사라진 후보 선택 해제 |
| `{groupID,logic,operator,key,value}` 배열 | 전체 선택 복원. 없는 후보는 등록하고 중복 조건은 첫 항목만 선택 |
| 문자열 또는 문자열 배열 | 기존 후보의 키로 선택 재설정. 알 수 없는 키는 오류 |
| `[]` | 선택만 해제. 후보는 유지 |

혼합 배열이나 잘못된 조건은 변경 전에 오류를 발생시킵니다. 조건 객체는 위의 5개 필드를 모두 제공해야 합니다. 후보 스키마에 같은 필드를 전부 사용하는 경우 `addOptions()`로 후보를 공급하여 구분합니다.

`silent:true`는 컨트롤 `change` 및 기반 select의 change 이벤트를 억제합니다. `item_add`, `item_remove`, `clear` 등 개별 이벤트는 발생할 수 있습니다. 변경이 없는 선택 재설정은 `change`를 발생시키지 않습니다. HandStack 거래 setter가 전달하는 세 번째 인자의 메타데이터 객체는 silent로 처리하지 않습니다.

## 메서드

모듈 호출은 `syn.uicontrols.$dropdowntextlist.method(elID, ...args)`입니다. `getControl(elID)`로 받은 인스턴스에서는 elID 없이 호출합니다.

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
| `addItem(ref,silent)` | 캐럿 위치에 선택 추가 |
| `removeItem(ref\|HTMLElement,silent)` | 선택 해제 |
| `createItem(value,callback?)` | create 설정으로 생성 후 선택 |
| `refreshItems()` | 선택 태그 다시 렌더링 |
| `addOptionGroup(id,data)`, `removeOptionGroup(id)`, `clearOptionGroups()` | 그룹 추가·제거. 그룹 제거 자체는 후보를 삭제하지 않음 |
| `on(event,handler)`, `off(event,handler?)`, `trigger(event,...args)` | 이벤트 구독·해제·실행 |
| `open()`, `close()`, `positionDropdown()` | 드롭다운 열기·닫기·위치 갱신 |
| `focus()`, `blur()` | 입력 포커스 이동 |
| `lock()`, `unlock()` | 포커스 가능한 입력 잠금·해제. 태그 편집·삭제도 잠금 |
| `disable()`, `enable()` | 포커스를 포함한 사용자 조작 비활성화·활성화 |
| `getValue()`, `setValue(value,silent)` | 조건 조회·데이터 공급·선택 복원 |
| `setCaret(index)`, `isFull()` | 캐럿 이동·선택 한도 도달 여부 |
| `clearCache()`, `setTextboxValue(str)` | 렌더링 캐시 초기화·검색 문자열 설정 |
| `load(query)` | load 콜백 호출. 최신 요청만 반영 |
| `sync()` | `source` select의 후보·선택을 읽고 기존 조건 메타데이터 유지 |
| `destroy()` | 이벤트·팝오버·DOM·컨트롤 레지스트리 정리. 같은 요소 재초기화 가능 |

`ref`는 문자열 키 또는 `{groupID,key}`입니다. `clearOptions` 콜백 인자는 원래 후보 데이터와 ref입니다. `persist:false`이면 user_created 후보는 선택 해제 시 제거됩니다. `getControl().source`는 내부 기반 select이며 option의 value는 `JSON.stringify([groupID,key])`, text는 표시값입니다. 외부에서 이 select를 수정한 후 `sync()`를 호출할 수 있습니다. 화면의 `syn-datafield` 값은 공개 getValue/setValue를 사용합니다.

## 이벤트

초기화 전에 `onInitialize`, `onChange` 등 Tom Select 이름의 콜백 옵션을 제공하거나 `syn-events`와 페이지 `event.<elID>_<event>`를 사용합니다. 초기화 후에는 인스턴스 `on`을 사용합니다. 핸들러의 `this`는 컨트롤 인스턴스입니다.

| 이벤트 | 인자 |
| --- | --- |
| `initialize`, `focus`, `blur`, `clear`, `option_clear`, `optgroup_clear`, `destroy` | 없음 |
| `change` | 조건 객체 배열. 논리·연산자 편집도 포함 |
| `item_add`, `item_remove` | `{groupID,key}`, 태그 HTMLElement |
| `item_select` | 태그 HTMLElement |
| `option_add` | `{groupID,key}`, 원래 후보 데이터 |
| `option_remove` | `{groupID,key}` |
| `optgroup_add` | id, 그룹 데이터 |
| `optgroup_remove` | id |
| `dropdown_open`, `dropdown_close` | 드롭다운 HTMLElement |
| `type` | 검색 문자열 |
| `load` | 원래 후보 데이터 배열 |

페이지 핸들러와 DOM 이벤트의 중복 호출을 막기 위해 컨트롤 이벤트는 초기화 시 직접 연결합니다. `destroy`에서 원래 `syn-events`를 복원합니다.

## 옵션과 비동기 제공자

드롭다운 크기는 입력 영역의 `width`와 별도로 설정합니다.

| 옵션 | 기본값 | 설정값 |
| --- | --- | --- |
| `dropdownWidth` | `'auto'`: 현재 표시 목록·그룹 제목에 맞춤 | `'100%'`: 컨트롤 폭, 숫자 또는 `'320px'`: 고정 너비 |
| `dropdownHeight` | `'auto'`: 내용에 맞춤, 목록 영역 최대 200px | 숫자 또는 `'180px'`: 드롭다운 전체의 고정 높이 |

숫자는 양수 픽셀값입니다. 기본 너비는 현재 표시 목록에 맞추며, 기본 높이는 기존 Tom Select의 크기 스타일을 유지합니다. 자동 너비는 검색·후보 갱신·비동기 조회·창 크기 변경 시 다시 계산하며 화면 오른쪽을 넘지 않도록 제한합니다. 고정 높이에서 내용이 넘치면 목록 내부를 스크롤합니다. `null`도 해당 옵션의 기본값으로 처리합니다.

```html
<!-- 기본값: 목록에 맞춘 너비, 기존 높이 -->
<syn_dropdowntextlist id="defaultSize" syn-options="{}"></syn_dropdowntextlist>
<!-- 목록에 맞춘 너비, 기본 높이 -->
<syn_dropdowntextlist id="autoSize" syn-options="{dropdownWidth:'auto'}"></syn_dropdowntextlist>
<!-- 드롭다운 전체 크기 고정 -->
<syn_dropdowntextlist id="fixedSize" syn-options="{dropdownWidth:320,dropdownHeight:180}"></syn_dropdowntextlist>
```

기본값은 `maxItems:null`, `hideSelected:true`, `clearAfterSelect:true`, `create:false`, `persist:true`, `loadThrottle:300`, `preload:false`입니다. 사용자 생성의 기본 그룹은 `defaultGroupID:''`입니다.

함수 옵션은 페이지 `hook.controlInit` 또는 `controlLoad`에서 제공합니다.

```javascript
syn.uicontrols.$dropdowntextlist.controlLoad('animals', {
    create(input, callback) {
        callback({class:'custom',value:input,name:input});
    },
    load(query, callback) {
        // applicationSearch는 애플리케이션에서 구현하는 데이터 제공자입니다.
        applicationSearch(query).then(callback).catch(() => callback([]));
    }
});
```

`create`는 객체 반환, callback 또는 Promise를 지원합니다. `load`는 후보 배열 반환, callback 또는 Promise를 지원하며 callback의 두 번째 인자로 그룹 배열을 전달할 수 있습니다. callback 방식은 완료 시 한 번 호출하고 데이터를 직접 반환하지 않습니다. 예외·Promise 거절은 잠금/로딩 상태를 해제하고 콘솔에 기록합니다. callback 방식은 실패 시에도 `callback()`을 호출해야 합니다. 데이터 교체·초기화·파괴 이후 오래된 응답과 이전 검색 응답은 무시합니다.

## dbclient 필터 연결

`getValue()`의 결과를 `JSON.stringify()`로 직렬화해 dbclient의 `Filters` 문자열 매개변수에 전달합니다.

```javascript
const parameter = {
    ParameterName: 'Filters', DbType: 'String', Length: -1,
    Value: JSON.stringify(syn.uicontrols.$dropdowntextlist.getValue('animals'))
};
```

서버 SQL 계약에는 `<filters parameter="Filters" groupLogic="AND">`와 `<field groupID="..." column="..." type="String" operators="eq,ne" />`를 선언합니다. `groupID`는 서버에 등록한 검색 필드, `key`는 비교값, `value`는 표시명입니다. 동물 데모의 `mammal`·`bird`·`reptile`을 사용할 때도 대상 테이블의 컬럼 매핑을 계약에 등록해야 합니다. `GD06`의 `user`·`content`·`createdAt`·`conversation` 그룹을 사용하려면 UI 후보의 그룹과 키도 그 검색 필드에 맞춰 공급합니다.

빈 선택은 `[]`로 전달되어 조건을 추가하지 않습니다. 같은 그룹은 선택 순서의 AND/OR로 묶고 첫 항목의 연결은 무시하며, 그룹 사이는 `groupLogic`으로 결합합니다. 날짜는 시간대 없는 `DateTime`과 명시적 오프셋을 갖는 `DateTimeOffset`을 구분합니다. GUID 저장 형식이 다르면 서버 field의 `guidFormat`을 지정합니다. 자세한 공급자별 설정과 재현 절차는 `2.Modules/dbclient/readme.md`의 JSON 배열 필터 SQL을 참고합니다.

## 유지보수 구조

기존 UI 컨트롤과 같이 `$dropdowntextlist.extend({...})`에 메서드를 직접 선언합니다. `controlLoad`가 설정을 병합하고 `addControlSetting`에서 생성한 상태를 `textListControls`에 보관한 다음 `initialize` 이벤트를 발생시킵니다.

공개 메서드는 `(elID, ...)` 형태로 컨트롤을 조회하여 처리합니다. `getControl(elID)`가 반환하는 객체의 동일한 메서드는 기존 인스턴스 호출을 유지하기 위한 연결 함수입니다. 동작을 변경할 때는 모듈의 해당 메서드를 수정합니다.

후보·조건 변환은 `getValueType`, `normalize`, `condition`, `resolve`에서, 이벤트 연결은 `eventCallbacks`, `relay`, `on/off/trigger`에서 관리합니다. `createItem/load`의 비동기 완료 콜백은 파괴 여부와 요청 순번을 확인하므로 이 검사를 유지합니다.

## 빌드와 검증

`2.Modules/wwwroot`에서 `dotnet libman restore`로 고정된 Tom Select 자산을 복원하고 `node node_modules/gulp/bin/gulp.js`로 번들을 생성합니다. 라이브러리는 기존 저장소 규약대로 libman.json으로 관리합니다.

샘플: `/sample/uicontrol/dropdowntextlist.html`. 개별 로딩 및 Development/Production 번들에서 확인합니다.
