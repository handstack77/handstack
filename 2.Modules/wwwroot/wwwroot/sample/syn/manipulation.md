# DOM 조작 사용법 (syn.$m)

## 개요

`$manipulation` 모듈(별칭 `syn.$m`)은 jQuery 스타일의 DOM(Document Object Model) 조작 기능을 제공하는 syn.js의 핵심 유틸리티 모듈입니다. `syn.js` 파일 내 대략 571~1055번째 라인에 정의되어 있으며, 다음과 같은 기능을 제공합니다.

- 요소 탐색(부모/자식/형제 노드 조회)
- 콘텐츠/속성 읽기·쓰기(value, textContent, innerHTML, attribute 등)
- 스타일/클래스 조작(style, className, opacity 애니메이션 등)
- 요소 생성/삽입/삭제(create, append, prepend, insertBefore/After, remove 등)
- 폼 컨트롤 상태 설정(active, selected, checked)

모든 메서드는 첫 번째 인자로 엘리먼트(HTMLElement) 또는 엘리먼트 id 문자열을 받을 수 있으며, 내부적으로 `syn.$l.getElement(el)`을 통해 엘리먼트를 일관되게 조회합니다. 대부분의 setter성 메서드는 메서드 체이닝을 위해 `this`(모듈 자신)를 반환합니다.

## 로드 방법

`syn.js`는 `/js/syn.loader.js`를 통해 로드되며, 페이지에서 다음과 같이 스크립트를 포함하면 `syn.$m` 별칭으로 즉시 사용할 수 있습니다.

```html
<script src="/js/syn.loader.js"></script>
```

samples 디렉토리의 데모 페이지(`manipulation.js`)처럼 `$manipulation` 전역 정의 객체를 사용해 이벤트를 바인딩하는 구조를 그대로 참고할 수 있습니다.

```javascript
'use strict';
let $manipulation = {
    extends: ['parsehtml'],
    hook: {},
    event: {
        btn_example_click() {
            syn.$m.addClass('myElement', 'active');
        }
    }
};
```

## 빠른 시작

```javascript
// id 문자열 또는 엘리먼트 어느 쪽이든 사용 가능
syn.$m.addClass('myDiv', 'highlight');
syn.$m.setStyle('myDiv', 'color', 'red');
syn.$m.innerText('myDiv', '안녕하세요');

// 메서드 체이닝
syn.$m.addClass('myDiv', 'highlight').fade('myDiv', { duration: 1000, to: 0.5 });
```

## 주요 시나리오

### 1. 요소 탐색 (children / parentNode 등)

```javascript
// 자식 노드 목록
var children = syn.$m.children('myList');   // HTMLCollection (text 노드 제외)
var childNodes = syn.$m.childNodes('myList'); // NodeList (text 노드 포함)

// 형제 노드
var nextEl = syn.$m.nextElementSibling('item1');
var siblings = syn.$m.siblings('item1'); // 자신을 제외한 형제 엘리먼트 배열

// 상위 노드 탐색
var parentEl = syn.$m.parentElement('item1');
var namedAncestor = syn.$m.parent('item1', 'containerID'); // 특정 id를 가진 상위 노드
```

`nextSibling`/`previousSibling`/`firstChild`/`lastChild` 계열은 텍스트 노드를 포함하고, `nextElementSibling`/`previousElementSibling`/`firstElementChild`/`lastElementChild` 계열은 엘리먼트만 대상으로 합니다.

### 2. 클래스 / 스타일 조작

```javascript
syn.$m.addClass('myDiv', 'badge active');   // 공백으로 구분된 여러 className 추가
syn.$m.hasClass('myDiv', 'active');         // true/false
syn.$m.toggleClass('myDiv', 'active');
syn.$m.removeClass('myDiv', 'active');      // 인자를 생략하면 className 전체 삭제

syn.$m.setStyle('myDiv', 'color', 'red');
syn.$m.addStyle('myDiv', { backgroundColor: 'blue', border: '1px solid #000' });
syn.$m.addCssText('myDiv', 'padding: 10px; margin: 5px;');
syn.$m.getStyle('myDiv', 'color');            // 인라인 style 값 조회
syn.$m.getComputedStyle('myDiv', 'color');    // 브라우저 계산 값 조회

// opacity 애니메이션
syn.$m.fade('myDiv', { duration: 800, to: 0.2, callback: () => console.log('완료') });
```

### 3. 속성 읽기 / 쓰기

```javascript
syn.$m.setAttribute('myInput', 'placeholder', '입력하세요');
var value = syn.$m.getAttribute('myInput', 'placeholder');
syn.$m.removeAttribute('myInput', 'placeholder');

syn.$m.value('myInput', 'hello world');       // value 속성 조회/설정
syn.$m.textContent('myDiv', '텍스트');
syn.$m.innerHTML('myDiv', '<b>굵게</b>');
var html = syn.$m.outerHTML('myDiv');
```

### 4. 요소 생성 / 삽입 / 삭제

```javascript
// JSON 옵션으로 노드 생성
var el = syn.$m.create({
    tag: 'div',
    className: 'form-control',
    classNames: 'mb-2',
    styles: { color: 'red' },
    attributes: { 'data-id': '1' },
    text: 'hello world'
});

syn.$m.appendChild('myList', el);   // 마지막 자식으로 추가
syn.$m.append('myList', 'li', 'newItemID', { text: 'Grape' }); // 태그명으로 바로 생성 + 추가
syn.$m.prepend(el, 'myList');       // 첫 번째 자식으로 추가

syn.$m.insertBefore(el, 'targetEl'); // 특정 노드 바로 앞에 삽입
syn.$m.insertAfter(el, 'targetEl');  // 특정 노드 바로 뒤에 삽입

var copyEl = syn.$m.copy('myDiv');  // 자식 노드를 포함한 복제본(cloneNode)
syn.$m.remove('myDiv');             // 노드 삭제 (연결된 webform 상태도 함께 정리)
```

### 5. 폼 컨트롤 상태 설정 (setActive / setSelected / setChecked)

```javascript
// active className 토글
syn.$m.setActive('myDiv', true);

// select 옵션 선택 (multiple=true이면 다른 옵션의 선택을 해제하지 않음)
syn.$m.setSelected('optionID', true, true);

// checkbox/radio 상태 설정 (multiple=false이면 동일 name/type의 형제를 모두 해제)
syn.$m.setChecked('checkboxID', true);
```

## 실전 예제 페이지

전체 메서드에 대한 동작 데모는 `manipulation.html` / `manipulation.js`에서 실시간으로 확인할 수 있습니다. 각 항목은 입력값, 버튼, 결과 표시 영역으로 구성되어 있으며 실제 DOM에 변경 사항이 즉시 반영됩니다.

```
2.Modules/wwwroot/wwwroot/sample/syn/manipulation.html
2.Modules/wwwroot/wwwroot/sample/syn/manipulation.js
```

## 주의 사항

- 대부분의 메서드는 첫 번째 인자로 엘리먼트 또는 id 문자열(`syn.$l.getElement`가 처리 가능한 값)을 받습니다. 대상이 존재하지 않으면 대부분 `null`을 반환하거나 아무 동작도 하지 않습니다.
- `removeClass(el)`처럼 두 번째 인자(css)를 생략하면 className 전체를 삭제하므로 의도치 않은 클래스 초기화에 주의해야 합니다.
- `remove(el)`은 `$webform.purge`가 정의되어 있으면 해당 노드에 연결된 webform 상태도 함께 정리합니다. 단순 DOM 삭제 이상의 부수 효과가 있음을 인지해야 합니다.
- `body()`는 `document.body`가 아니라 `document` 객체 자체를 반환합니다. 이름과 실제 반환값이 다르므로 사용 시 유의합니다.
- `setSelected`/`setChecked`의 `multiple` 인자가 `false`(기본값)이면 동일 그룹의 다른 형제 요소 상태를 자동으로 해제하므로, 단일 선택 그룹과 다중 선택 그룹을 구분해서 호출해야 합니다.
- `getClassRegEx`는 className별로 정규식을 캐시하여 재사용하므로 대량의 className을 동적으로 생성하는 경우가 아니라면 메모리 문제는 없습니다.

## 관련 모듈

- API 상세: [`manipulation_api.md`](./manipulation_api.md)
