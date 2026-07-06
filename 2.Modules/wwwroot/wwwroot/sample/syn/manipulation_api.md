# DOM 조작 API 참조 (syn.$m)

## 모듈 정보

| 항목 | 내용 |
| --- | --- |
| 모듈명 | $manipulation |
| 별칭 | syn.$m |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 571 ~ 1055번째 라인) |
| 공개 속성 | 없음 (메서드만 제공) |
| 공개 메서드 수 | 51개 |
| 의존 모듈 | syn.$l(라이브러리 헬퍼, getElement 등), syn.$string(toValue/toBoolean 등), syn.$object(isObject 등) |

## 탐색 (Traversal)

### body()

문서(document) 객체를 반환합니다. 이름과 달리 `document.body`가 아니라 `document` 자체를 반환합니다.

매개변수

없음

반환값

| 타입 | 설명 |
| --- | --- |
| Document | 현재 document 객체 |

예시

```javascript
var doc = syn.$m.body();
console.log(doc.nodeName); // "#document"
```

### documentElement()

문서의 최상위 요소(`<html>`)를 반환합니다.

매개변수

없음

반환값

| 타입 | 설명 |
| --- | --- |
| HTMLElement \| undefined | document.documentElement |

예시

```javascript
var htmlEl = syn.$m.documentElement();
console.log(htmlEl.nodeName); // "HTML"
```

### childNodes(el)

지정된 노드의 자식 노드 목록(text 노드 포함)을 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| NodeList \| null | 자식 노드 목록. el이 없으면 null |

예시

```javascript
var nodes = syn.$m.childNodes('myList');
```

### children(el)

지정된 노드의 자식 엘리먼트 목록(text 노드 제외)을 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| HTMLCollection \| null | 자식 엘리먼트 목록 |

예시

```javascript
var children = syn.$m.children('myList');
```

### firstChild(el)

첫 번째 자식 노드(text 노드 포함)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Node \| null | 첫 번째 자식 노드 |

예시

```javascript
syn.$m.firstChild('myList');
```

### firstElementChild(el)

첫 번째 자식 엘리먼트(text 노드 제외)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Element \| null | 첫 번째 자식 엘리먼트 |

예시

```javascript
syn.$m.firstElementChild('myList');
```

### lastChild(el)

마지막 자식 노드(text 노드 포함)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Node \| null | 마지막 자식 노드 |

예시

```javascript
syn.$m.lastChild('myList');
```

### lastElementChild(el)

마지막 자식 엘리먼트(text 노드 제외)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Element \| null | 마지막 자식 엘리먼트 |

예시

```javascript
syn.$m.lastElementChild('myList');
```

### nextSibling(el)

바로 다음 형제 노드(text 노드 포함)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Node \| null | 다음 형제 노드 |

예시

```javascript
syn.$m.nextSibling('item1');
```

### nextElementSibling(el)

바로 다음 형제 엘리먼트(text 노드 제외)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Element \| null | 다음 형제 엘리먼트 |

예시

```javascript
syn.$m.nextElementSibling('item1');
```

### previousSibling(el)

바로 이전 형제 노드(text 노드 포함)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Node \| null | 이전 형제 노드 |

예시

```javascript
syn.$m.previousSibling('item2');
```

### previousElementSibling(el)

바로 이전 형제 엘리먼트(text 노드 제외)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Element \| null | 이전 형제 엘리먼트 |

예시

```javascript
syn.$m.previousElementSibling('item2');
```

### siblings(el)

지정된 노드를 제외한 형제 엘리먼트 배열을 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Element[] \| null | 자신을 제외한 형제 엘리먼트 배열. 부모가 없으면 null |

예시

```javascript
var siblingELs = syn.$m.siblings('item1');
```

### parentNode(el)

부모 노드(text 노드 포함 트리 기준)를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Node \| null | 부모 노드 |

예시

```javascript
syn.$m.parentNode('item1');
```

### parentElement(el)

부모 엘리먼트를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Element \| null | 부모 엘리먼트 |

예시

```javascript
syn.$m.parentElement('item1');
```

## 콘텐츠 / 속성

### value(el, value)

노드의 `value` 속성을 조회하거나 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| value | any (선택) | 설정할 값. 생략 시 조회만 수행 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | 설정 또는 조회된 value 값 |

예시

```javascript
syn.$m.value('txt_name', 'hello world');
var v = syn.$m.value('txt_name');
```

### textContent(el, value)

노드의 `textContent` 속성을 조회하거나 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| value | any (선택) | 설정할 텍스트. 생략 시 조회만 수행 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | textContent 값 |

예시

```javascript
syn.$m.textContent('div1', 'hello world');
```

### innerText(el, value)

노드의 `innerText` 속성을 조회하거나 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| value | any (선택) | 설정할 텍스트. 생략 시 조회만 수행 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | innerText 값 |

예시

```javascript
syn.$m.innerText('div1', 'hello world');
```

### innerHTML(el, value)

노드의 `innerHTML` 속성을 조회하거나 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| value | any (선택) | 설정할 HTML 문자열. 생략 시 조회만 수행 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | innerHTML 값 |

예시

```javascript
syn.$m.innerHTML('div1', '<b>hello</b>');
```

### outerHTML(el)

노드의 `outerHTML` 값을 조회합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | outerHTML 값 |

예시

```javascript
var html = syn.$m.outerHTML('div1');
```

### className(el)

노드의 `className` 값을 조회합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | className 값 |

예시

```javascript
var cls = syn.$m.className('div1');
```

### removeAttribute(el, prop)

노드의 attribute를 삭제합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| prop | string | 삭제할 attribute 이름 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.removeAttribute('txt1', 'readonly');
```

### getAttribute(el, prop)

노드의 attribute 값을 조회합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| prop | string | 조회할 attribute 이름 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | attribute 값 |

예시

```javascript
var val = syn.$m.getAttribute('txt1', 'placeholder');
```

### setAttribute(el, prop, val)

노드에 attribute 값을 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| prop | string | 설정할 attribute 이름 |
| val | string | 설정할 값 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.setAttribute('txt1', 'placeholder', '입력하세요');
```

### appendChild(el, node)

노드의 마지막 위치에 자식 노드를 추가합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 부모 엘리먼트 또는 id |
| node | Node | 추가할 노드 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
var li = document.createElement('li');
li.textContent = 'Grape';
syn.$m.appendChild('myList', li);
```

## 스타일 / 클래스

### setStyle(el, prop, val)

노드의 style 속성 하나를 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| prop | string | CSS 속성명(camelCase) |
| val | string | 설정할 값 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.setStyle('div1', 'color', 'red');
```

### addCssText(el, cssText)

노드의 style.cssText에 CSS 문자열을 추가합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| cssText | string | 추가할 CSS 문자열 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.addCssText('div1', 'background-color: lightblue;');
```

### addStyle(el, objects)

노드에 여러 style 속성을 한 번에 설정합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| objects | object | { cssProperty: value } 형태의 객체 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.addStyle('div1', { backgroundColor: 'blue', color: 'white' });
```

### getStyle(el, prop)

노드의 인라인 style 값을 조회합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| prop | string | 조회할 CSS 속성명 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | style 값 |

예시

```javascript
var color = syn.$m.getStyle('div1', 'color');
```

### hasHidden(el)

노드가 화면에서 숨겨져 있는지(offsetParent가 없거나 display:none) 확인합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| boolean | 숨김 여부 |

예시

```javascript
var isHidden = syn.$m.hasHidden('div1');
```

### getComputedStyle(el, prop)

브라우저가 계산한 style 값을 조회합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| prop | string | 조회할 CSS 속성명 |

반환값

| 타입 | 설명 |
| --- | --- |
| string \| null | 계산된 style 값 |

예시

```javascript
var color = syn.$m.getComputedStyle('div1', 'color');
```

### addClass(el, css)

공백으로 구분된 여러 className을 추가합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| css | string | 공백으로 구분된 className 목록 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.addClass('div1', 'badge active');
```

### hasClass(el, css)

노드에 특정 className이 설정되어 있는지 확인합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| css | string | 확인할 className |

반환값

| 타입 | 설명 |
| --- | --- |
| boolean | className 포함 여부 |

예시

```javascript
var has = syn.$m.hasClass('div1', 'active');
```

### toggleClass(el, css)

노드의 특정 className 설정을 토글합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| css | string | 토글할 className |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.toggleClass('div1', 'active');
```

### removeClass(el, css)

노드의 특정 className을 삭제하거나(생략 시) className 전체를 초기화합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| css | string (선택) | 삭제할 className. 생략하면 className 전체 삭제 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.removeClass('div1', 'active');
syn.$m.removeClass('div1'); // className 전체 초기화
```

### fade(el, options)

노드의 opacity를 지정한 시간 동안 애니메이션으로 변경합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| options | object (선택) | `{ duration, from, to, fps, callback }`. duration 기본값 1000ms, to 기본값 0, fps 기본값 60 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.addClass('div1', 'highlight').fade('div1', { duration: 1000, to: 0.5 });
```

### getClassRegEx(css)

지정된 className을 검색하기 위한 정규식(RegExp)을 생성합니다. 동일한 className은 캐시에서 재사용합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| css | string | className 문자열 |

반환값

| 타입 | 설명 |
| --- | --- |
| RegExp | className 검색용 정규식 |

예시

```javascript
var regex = syn.$m.getClassRegEx('badge');
```

## 구조 조작 (생성 / 삽입 / 삭제)

### append(baseEl, tag, elID, options)

지정된 태그명으로 새 엘리먼트를 생성하여 baseEl의 마지막 자식으로 추가합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| baseEl | HTMLElement \| string | 부모 엘리먼트 또는 id |
| tag | string | 생성할 태그명 |
| elID | string (선택) | 생성할 엘리먼트의 id |
| options | object (선택) | `{ type, styles, classNames, value, text, content, html }` |

반환값

| 타입 | 설명 |
| --- | --- |
| HTMLElement \| null | 생성되어 추가된 엘리먼트 |

예시

```javascript
syn.$m.append('div_append', 'input', 'txt1', { classNames: 'form-control', value: 'hello world' });
```

### prepend(el, baseEl)

지정된 노드를 baseEl의 첫 번째 자식으로 추가합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | Node | 추가할 노드 |
| baseEl | HTMLElement \| string | 부모 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
var el = syn.$m.create({ tag: 'div', text: 'hello' });
syn.$m.prepend(el, 'div_prepend');
```

### copy(el)

노드를 자식 노드를 포함하여 복제(cloneNode)합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| Node \| null | 복제된 노드 |

예시

```javascript
var copyEl = syn.$m.copy('div1');
```

### remove(el)

노드를 삭제합니다. `$webform.purge`가 정의되어 있으면 연결된 webform 상태도 함께 정리합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.remove('div1');
```

### hasChild(el)

노드에 자식 노드가 있는지 확인합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| boolean | 자식 노드 보유 여부 |

예시

```javascript
var has = syn.$m.hasChild('div1');
```

### insertBefore(el, targetEL)

지정된 노드를 targetEL 바로 앞에 삽입합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | Node | 삽입할 노드 |
| targetEL | HTMLElement \| string | 기준이 되는 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
var el = syn.$m.create({ text: 'new item' });
syn.$m.insertBefore(el, 'targetDiv');
```

### insertAfter(el, targetEL)

지정된 노드를 targetEL 바로 뒤에 삽입합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | Node | 삽입할 노드 |
| targetEL | HTMLElement \| string | 기준이 되는 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
var el = syn.$m.create({ text: 'new item' });
syn.$m.insertAfter(el, 'targetDiv');
```

## 표시 상태 / 생성 / 반복 유틸리티

### display(el, isShow)

노드의 표시 여부를 설정합니다(`display: block` 또는 `none`).

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| isShow | boolean \| string | true/"true" 이면 표시(block), 그 외에는 숨김(none) |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.display('div1', true);
```

### toggleDisplay(el)

노드의 표시 여부를 계산된 스타일 기준으로 토글합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |

반환값

| 타입 | 설명 |
| --- | --- |
| string | 토글 후 display 값('none' 등) |

예시

```javascript
syn.$m.toggleDisplay('div1');
```

### parent(el, id)

지정된 노드의 부모 엘리먼트, 또는 특정 id를 가진 상위 노드를 반환합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| id | string (선택) | 찾고자 하는 상위 노드의 id. 생략하면 바로 위 부모 엘리먼트만 반환 |

반환값

| 타입 | 설명 |
| --- | --- |
| HTMLElement \| null | 부모 엘리먼트 또는 id가 일치하는 상위 엘리먼트 |

예시

```javascript
var parentEl = syn.$m.parent('btn1');
var containerEl = syn.$m.parent('btn1', 'div_container');
```

### create(options)

JSON 옵션으로 새 HTML 엘리먼트를 생성합니다(문서에 추가하지 않음).

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| options | object (선택) | `{ tag, id, styles, className, classNames, attributes, data, value, text, content, html }` |

반환값

| 타입 | 설명 |
| --- | --- |
| HTMLElement \| null | 생성된 엘리먼트 |

예시

```javascript
var el = syn.$m.create({
    tag: 'div',
    className: 'form-control',
    attributes: { 'data-id': '1' },
    text: 'hello world'
});
```

### each(array, handler)

배열의 개수만큼 반복 함수를 실행합니다(`Array.prototype.forEach`의 래퍼).

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| array | Array | 반복할 배열 |
| handler | Function | 각 항목에 대해 실행할 함수(item, index, array) |

반환값

없음 (undefined)

예시

```javascript
var siblingELs = syn.$m.siblings('item1');
syn.$m.each(siblingELs, (item, index) => {
    console.log(item.nodeName, index);
});
```

## 폼 컨트롤 상태

### setActive(el, value)

노드에 `active` className을 설정하거나 삭제합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 엘리먼트 또는 id |
| value | boolean \| string | true/"true"면 active 추가, 그 외에는 제거 |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.setActive('div1', true);
```

### setSelected(el, value, multiple)

select option 등의 `selected` 상태를 설정합니다. `multiple`이 false이면 형제 옵션들의 선택을 자동으로 해제합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 option 엘리먼트 또는 id |
| value | boolean \| string | 선택 여부 |
| multiple | boolean (선택, 기본값 false) | true면 다중 선택 허용(형제 선택 해제 안 함) |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.setSelected('opt1', true, true);
syn.$m.setSelected('opt2', true, true);
```

### setChecked(el, value, multiple)

checkbox/radio 등의 `checked` 상태를 설정합니다. `multiple`이 false이면 동일 name/type의 형제 요소를 자동으로 해제합니다.

매개변수

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| el | HTMLElement \| string | 대상 checkbox/radio 엘리먼트 또는 id |
| value | boolean \| string | 체크 여부 |
| multiple | boolean (선택, 기본값 false) | true면 다중 체크 허용(형제 체크 해제 안 함) |

반환값

| 타입 | 설명 |
| --- | --- |
| $manipulation | 메서드 체이닝을 위한 모듈 자신(this) |

예시

```javascript
syn.$m.setChecked('chk1', true);
syn.$m.setChecked('chk2', true);
```
