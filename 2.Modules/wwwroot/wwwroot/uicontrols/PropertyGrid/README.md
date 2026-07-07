# PropertyGrid (syn.uicontrols.$propertygrid)

## 이 컨트롤은 무엇인가요?

PropertyGrid는 자바스크립트 객체 하나를 "속성명 / 값" 두 칸짜리 표 형태로 보여주고, 값의 타입에 맞는 입력 위젯(텍스트, 숫자, 체크박스, 색상, 드롭다운, JSON 편집 등)을 자동으로 만들어 주는 컨트롤입니다. Visual Studio나 여러 디자인 툴에서 흔히 보는 "속성(Properties)" 패널과 같은 역할을 합니다.

값의 타입만 보고도 대부분의 입력 위젯을 자동으로 골라주기(`autoMeta`) 때문에 `meta`를 전혀 지정하지 않아도 바로 쓸 수 있고, 필요하면 `meta`로 그룹 묶음·표시 이름·전용 위젯 타입·도움말·읽기전용 여부 등을 속성별로 세밀하게 조정할 수 있습니다.

## 언제 사용하나요?

- 다른 컨트롤(차트, 그리드, 커스텀 위젯 등)의 옵션 객체(`defaultSetting`)를 화면에서 직접 편집하게 하고 싶을 때 — `createDefaultSettingMeta`로 그룹/설명이 자동으로 붙은 `meta`를 만들 수 있습니다.
- 관리자 화면에서 "설정(config)" 객체처럼 속성 개수나 종류가 미리 정해지지 않은 데이터를 편집해야 할 때
- 폼 컨트롤을 하나하나 배치하기보다, 객체 하나를 통째로 넘겨서 표 형태 편집 UI를 빠르게 만들고 싶을 때
- 속성을 그룹으로 묶어서 보여주거나(`meta.group`), 그룹 단위로 접고 펼치는(`isCollapsible`) UI가 필요할 때

이미 화면 레이아웃이 고정되어 있고 입력 항목 종류가 소수로 정해져 있다면, TextBox/DropDownList/CheckBox 같은 개별 컨트롤을 직접 배치하는 편이 더 간단합니다. PropertyGrid는 "객체의 속성 구성 자체가 가변적이거나 많을 때" 진가를 발휘합니다.

## 빠른 시작

가장 단순한 형태는 `data`에 객체만 넘기면 됩니다. `meta`가 없으면 값의 타입을 보고 위젯이 자동으로 결정됩니다.

```html
<syn_propertygrid id="pgBasic" syn-options="{
    data: {
        Name: '홍길동',
        Age: 32,
        UseYN: true,
        FavoriteColor: '#2563eb'
    }
}"></syn_propertygrid>
```

속성을 그룹으로 묶고, 각 속성의 표시 방식을 지정하고 싶다면 `meta`를 추가합니다.

```html
<syn_propertygrid id="pgOptions" syn-options="{
    sort: true,
    isCollapsible: true,
    data: {
        Width: 240,
        Mode: 'edit',
        ThemeColor: '#16a34a'
    },
    meta: {
        Width: { group: 'Layout', type: 'number', options: { min: 0, max: 999, step: 10 } },
        Mode: { group: 'Behavior', type: 'options', options: ['view', 'edit', 'readonly'] },
        ThemeColor: { group: 'Layout', type: 'color' }
    }
}"></syn_propertygrid>
```

값이 바뀔 때마다 알림을 받고 싶다면 `callback`에 페이지 스크립트 함수를 점(`.`) 경로 문자열로 지정합니다.

```html
<syn_propertygrid id="pgEvents" syn-options="{
    data: { NotifyYN: true, Volume: 50 },
    callback: '$this.method.handleChange'
}"></syn_propertygrid>
```

```js
'use strict';
let $mypage = {
    method: {
        handleChange(element, name, value, control) {
            syn.$l.eventLog('pgEvents_change', name + ' = ' + JSON.stringify(value));
        }
    }
}
```

페이지에는 위 스크립트 외에 다음 한 줄만 있으면 됩니다. `syn.loader.js`가 화면에 있는 컨트롤들을 스캔해서 필요한 CSS/JS를 알아서 불러옵니다.

```html
<script src="/js/syn.loader.js"></script>
```

값을 조회하거나 다시 채워 넣을 때는 `getValue`/`setValue`를 사용합니다.

```js
var value = syn.uicontrols.$propertygrid.getValue('pgBasic');
syn.uicontrols.$propertygrid.setValue('pgBasic', { Name: '김철수', Age: 28, UseYN: false, FavoriteColor: '#dc2626' });
syn.uicontrols.$propertygrid.clear('pgBasic');
```

## 예제 실행하기

`example/` 폴더에 3가지 예제가 있습니다. 로컬 서버 실행 후 브라우저에서 아래 경로로 접근해서 확인하세요 (예: `/uicontrols/PropertyGrid/example/basic.html`).

- basic.html / basic.js — `meta` 없이 `data`만 넘겨 문자열/숫자/불리언/색상 값이 각각 어떤 위젯으로 자동 표시되는지 보여주는 기본 예제이며, `getValue`/`setValue`/`clear` 메서드도 함께 확인합니다.
- options.html / options.js — `meta`로 그룹(`group`)·타입(`type`)·선택 목록(`options`)·설명(`description`)을 지정하고, `sort`/`isCollapsible`로 정렬과 그룹 접기·펼치기를 사용하는 예제입니다.
- events.html / events.js — `callback`으로 값 변경을 실시간으로 감지하고, 버튼을 눌러 `getValue`/`setValue`/`clear` 메서드를 직접 호출해보는 예제입니다.

## 더 알아보기

옵션, `meta`/`customTypes` 세부 규칙, 메서드, 콜백 시그니처의 전체 목록은 [API.md](./API.md)를 참고하세요.
