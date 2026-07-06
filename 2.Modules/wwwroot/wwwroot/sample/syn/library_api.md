# 공통 라이브러리 API 참조 (syn.$l)

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 별칭 | `syn.$l`, `syn.$library`, `context.$library` |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 4385 ~ 5553 줄) |
| 예제 경로 | `2.Modules/wwwroot/wwwroot/sample/syn/library.html`, `library.js` |
| 의존 모듈 | `$object`(존재/타입 판별), `$string`(TSD 파싱, Boolean 변환), `$date`(파일명 타임스탬프), `syn.$r`(내부 `urlToBase64`가 `httpFetch` 사용), `syn.getModuleLibrary`(`moduleEventLog`) |
| 실행 환경 제약 | DOM 계열 메서드(`addEvent`, `addEvents`, `addLive`, `removeEvent`, `hasEvent`, `trigger`, `triggerEvent`, `getValue`, `get`, `querySelector`, `getTagName`, `querySelectorAll`, `dispatchClick`)는 Node.js에서 제거됨. `getBasePath`, `moduleEventLog`는 브라우저에서 제거됨(Node.js 전용) |

---

## 식별자 / 유틸리티

### `syn.$l.guid()`
설명: RFC 4122 형식(8-4-4-4-12)을 준수하는 고유 식별자를 생성합니다. `crypto.randomUUID` → `crypto.getRandomValues` → `Math.random` 순으로 폴백합니다.

매개변수: 없음

반환값: `string` — 예: `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`

예시
```javascript
var id = syn.$l.guid();
```

### `syn.$l.random(len = 8, toLower = false)`
설명: 영문 대소문자와 숫자로 구성된 랜덤 문자열을 생성합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| len | number | 8 | 생성할 문자열 길이 |
| toLower | boolean | false | true면 소문자, false면 대문자로 반환 |

반환값: `string`

예시
```javascript
var token = syn.$l.random(32, true);
```

### `syn.$l.getElement(el)`
설명: 문자열 ID 또는 엘리먼트/EventTarget 계열 객체를 받아 실제 DOM 노드로 정규화합니다. 문자열이면 `get()`으로 우선 조회하고 실패 시 `querySelector()`로 재조회합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| el | string \| Element \| Window \| Document | 엘리먼트 ID 또는 엘리먼트/윈도우/문서 객체 |

반환값: `Element | null`

예시
```javascript
var el = syn.$l.getElement('txt_name');
```

### `syn.$l.execPrefixFunc(el, funcName)`
설명: 브라우저 벤더 접두사(`webkit`, `moz`, `ms`, `o`, 무접두사) 순서로 `el`에서 `funcName`에 해당하는 속성/메서드를 찾아 값을 반환하거나 실행합니다. `requestFullscreen`처럼 벤더별로 이름이 다른 API를 다룰 때 사용합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| el | object | 대상 객체(DOM 엘리먼트 등) |
| funcName | string | 접두사를 제외한 기준 이름(첫 글자 대문자 기준으로 결합) |

반환값: 실행 결과 값 또는 속성 값, 매칭 실패 시 `undefined`

예시
```javascript
var value = syn.$l.execPrefixFunc(document, 'Hidden'); // webkitHidden, mozHidden, hidden 순 탐색
```

---

## 인코딩 / 버퍼 변환

### `syn.$l.stringToArrayBuffer(value)`
설명: 문자열을 UTF-8 `ArrayBuffer`로 인코딩합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| value | string | 변환할 문자열 |

반환값: `ArrayBuffer`

예시
```javascript
var buffer = syn.$l.stringToArrayBuffer('hello world');
```

### `syn.$l.arrayBufferToString(buffer)`
설명: `ArrayBuffer`를 UTF-8 문자열로 디코딩합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| buffer | ArrayBuffer | 변환할 버퍼 |

반환값: `string` (실패 시 빈 문자열)

예시
```javascript
var text = syn.$l.arrayBufferToString(buffer);
```

---

## DOM 이벤트

### `syn.$l.dispatchClick(el, options = {})`
설명: 지정된 노드에 `MouseEvent('click')`을 생성하여 디스패치합니다. Node.js 환경 또는 `document.createEvent`가 없으면 무시됩니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| el | string \| Element | - | 대상 엘리먼트 또는 ID |
| options | object | `{}` | `MouseEvent` 생성자 옵션(override) |

반환값: 없음

예시
```javascript
syn.$l.dispatchClick('btn_submit');
```

### `syn.$l.addEvent(el, type, handler, options = {})`
설명: 지정된 노드에 이벤트 핸들러를 등록합니다. 내부 레지스트리에 (엘리먼트, 타입, 핸들러) 조합이 없을 때만 실제 `addEventListener`를 호출하여 중복 등록을 방지합니다. `type`이 `'resize'`이면 등록 즉시 핸들러를 1회 호출합니다. 메서드 체이닝을 지원합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| el | string \| Element | - | 대상 엘리먼트 또는 ID |
| type | string | - | 이벤트 타입 |
| handler | function | - | 이벤트 핸들러 |
| options | object | `{ capture: false, once: false, passive: false }` | addEventListener 옵션 |

반환값: `this`(체이닝용)

예시
```javascript
syn.$l.addEvent('txt_name', 'change', (evt) => { /* ... */ })
    .addEvent('txt_name', 'blur', (evt) => { /* ... */ });
```

### `syn.$l.addEvents(query, type, handler, options = {})`
설명: 셀렉터 문자열, 셀렉터/엘리먼트 배열, 단일 엘리먼트 중 하나를 받아 매칭되는 모든 노드에 동일한 이벤트 핸들러를 등록합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| query | string \| Array \| Element | 대상 셀렉터, 셀렉터/엘리먼트 배열 또는 엘리먼트 |
| type | string | 이벤트 타입 |
| handler | function | 이벤트 핸들러 |
| options | object | addEventListener 옵션 |

반환값: `this`

예시
```javascript
syn.$l.addEvents(['input[type="text"]', 'textarea'], 'focus', (evt) => { /* ... */ });
```

### `syn.$l.addLive(query, type, handler, options = {})`
설명: `document`에 이벤트를 위임 등록하여, 등록 시점 이후 동적으로 추가된 노드라도 `query`에 매칭되면 핸들러를 실행합니다(이벤트 위임/Live 바인딩).

| 매개변수 | 타입 | 설명 |
|---|---|---|
| query | string | `evt.target.closest()`에 사용할 셀렉터 |
| type | string | 이벤트 타입 |
| handler | function | 이벤트 핸들러(`this`가 매칭된 엘리먼트로 바인딩됨) |
| options | object | addEventListener 옵션 |

반환값: `this`

예시
```javascript
syn.$l.addLive('.dynamic-row', 'click', function (evt) { console.log(this); });
```

### `syn.$l.removeEvent(el, type, handler, options = {})`
설명: `addEvent`로 등록한 이벤트 핸들러를 해제합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| el | string \| Element | 대상 엘리먼트 또는 ID |
| type | string | 이벤트 타입 |
| handler | function | 등록 시 사용한 핸들러 참조(동일 참조여야 함) |
| options | object | addEventListener 옵션 |

반환값: `this`

예시
```javascript
syn.$l.removeEvent('txt_name', 'change', handlerRef);
```

### `syn.$l.hasEvent(el, type, handler)`
설명: 지정된 노드에 특정 타입(및 선택적으로 특정 핸들러)의 이벤트가 등록되어 있는지 확인합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| el | string \| Element | 대상 엘리먼트 또는 ID |
| type | string | 이벤트 타입 |
| handler | function (선택) | 특정 핸들러까지 일치하는지 확인 |

반환값: `boolean`

예시
```javascript
if (syn.$l.hasEvent('txt_name', 'change')) { /* ... */ }
```

### `syn.$l.trigger(el, type, value)`
설명: `addEvent`로 등록된(자체 레지스트리 기반) 핸들러들을 직접 호출합니다. 실제 브라우저 이벤트를 디스패치하지 않고 등록된 콜백만 실행합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| el | string \| Element | 대상 엘리먼트 또는 ID |
| type | string | 이벤트 타입 |
| value | any | 핸들러에 전달할 값(`evt` 자리에 전달) |

반환값: `boolean` — 하나 이상 실행되면 `true`

예시
```javascript
syn.$l.trigger('txt_name', 'change');
```

### `syn.$l.triggerEvent(el, type, customData)`
설명: 실제 `CustomEvent`(또는 `HTMLEvents`)를 생성하여 노드에 디스패치합니다. `trigger()`와 달리 브라우저 이벤트 버블링/캡처링 체계를 따릅니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| el | string \| Element | 대상 엘리먼트 또는 ID |
| type | string | 이벤트 타입 |
| customData | any | `CustomEvent.detail`로 전달될 데이터 |

반환값: `this`

예시
```javascript
syn.$l.triggerEvent('txt_name', 'change', { source: 'api' });
```

---

## DOM 조회

### `syn.$l.getValue(elID, defaultValue = '')`
설명: 엘리먼트 ID로 값을 조회합니다. 웹폼 런타임 컨텍스트(`$this.context.synControls`)가 있으면 해당 컨트롤 모듈의 `getValue()`를 통해 값을 가져오고, 그렇지 않으면 항상 `defaultValue`를 반환합니다(일반 DOM 페이지에서는 DOM 값을 직접 읽지 않는 구현상의 제약이 있습니다).

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| elID | string | - | 컨트롤/엘리먼트 ID |
| defaultValue | any | `''` | 조회 실패 시 반환할 기본값 |

반환값: 조회된 값 또는 `defaultValue`

예시
```javascript
var name = syn.$l.getValue('txt_name', '');
```

### `syn.$l.get(...ids)`
설명: 하나 이상의 엘리먼트 ID로 `document.getElementById`를 수행합니다. 인자가 1개면 단일 노드(`Element | null`)를, 2개 이상이면 배열을 반환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| ids | ...string | 조회할 엘리먼트 ID 목록 |

반환값: `Element | null` (단일) 또는 `Element[]` (다중)

예시
```javascript
var el = syn.$l.get('txt_name');
var [a, b] = syn.$l.get('txt_a', 'txt_b');
```

### `syn.$l.querySelector(...queries)`
설명: 하나 이상의 CSS 셀렉터(또는 `//`, `.//`로 시작하는 XPath)로 각각 첫 번째 매칭 노드를 조회합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| queries | ...string | CSS 셀렉터 또는 XPath 문자열 목록 |

반환값: `Element | null` (단일 쿼리) 또는 `Element[]` (다중 쿼리)

예시
```javascript
var el = syn.$l.querySelector('#txt_name');
```

### `syn.$l.getTagName(...tagNames)`
설명: 하나 이상의 태그 이름으로 `getElementsByTagName` 결과를 모두 합쳐 반환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| tagNames | ...string | 조회할 태그 이름 목록 |

반환값: `Element[]`

예시
```javascript
var buttons = syn.$l.getTagName('button', 'input');
```

### `syn.$l.querySelectorAll(...queries)`
설명: 하나 이상의 CSS 셀렉터(또는 XPath)로 매칭되는 모든 노드를 조회하여 합쳐서 반환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| queries | ...string | CSS 셀렉터 또는 XPath 문자열 목록 |

반환값: `Element[]`

예시
```javascript
var textInputs = syn.$l.querySelectorAll('input[type="text"]');
```

---

## Enum 변환

### `syn.$l.toEnumValue(enumObject, value)`
설명: enum 형태의 객체에서 키(`value`로 전달한 문자열)와 일치하는 항목의 값을 조회합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| enumObject | object | enum 객체 |
| value | string | 찾을 키 |

반환값: 매칭된 값 또는 `null`

예시
```javascript
var value = syn.$l.toEnumValue(syn.$v.valueType, 'String');
```

### `syn.$l.toEnumText(enumObject, value)`
설명: enum 형태의 객체에서 값(`value`)과 일치하는 항목의 키를 조회합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| enumObject | object | enum 객체 |
| value | any | 찾을 값 |

반환값: 매칭된 키(`string`) 또는 `null`

예시
```javascript
var key = syn.$l.toEnumText(syn.$v.valueType, 0);
```

---

## CSV / TSD 데이터 변환

### `syn.$l.prettyTSD(tsd, isFormat = false)`
설명: `＾`(메타 구분자) / `｜`(컬럼 구분자) / `↵`(줄바꿈 구분자)로 이루어진 TSD 문자열을 JSON으로 파싱합니다. `＾`가 있으면 앞부분을 `column:type;...` 형태의 메타 정보로 해석하여 타입 변환에 사용합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| tsd | string | - | TSD 형식 문자열 |
| isFormat | boolean | false | true면 들여쓰기된 JSON 문자열로, false면 JS 객체로 반환 |

반환값: `object[] | string`

예시
```javascript
var json = syn.$l.prettyTSD('AAA:string;BBB:number＾AAA｜BBB↵hello｜123', true);
```

### `syn.$l.text2Json(data, delimiter = ',', newLine = '\n')`
설명: CSV 형식 문자열(첫 줄 헤더)을 JSON 객체 배열로 변환합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| data | string | - | CSV 문자열 |
| delimiter | string | `,` | 컬럼 구분자 |
| newLine | string | `\n` | 줄 구분자 |

반환값: `object[]`

예시
```javascript
var json = syn.$l.text2Json('AAA,BBB\n1,2');
```

### `syn.$l.json2Text(arr, columns, delimiter = ',', newLine = '\n')`
설명: JSON 객체 배열을 CSV 형식 문자열로 변환합니다. 값에 구분자/줄바꿈/큰따옴표가 있으면 자동으로 이스케이프 처리합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| arr | object[] | - | 변환할 객체 배열 |
| columns | string[] | - | 출력할 컬럼(키) 목록과 순서 |
| delimiter | string | `,` | 컬럼 구분자 |
| newLine | string | `\n` | 줄 구분자 |

반환값: `string`

예시
```javascript
var csv = syn.$l.json2Text(json, ['AAA', 'BBB']);
```

---

## 트리 데이터 변환

### `syn.$l.nested2Flat(data, itemID, parentItemID, childrenID = 'items')`
설명: 트리(중첩) 구조 객체를 평면 배열로 변환합니다. 루트 객체도 결과 배열에 포함되며 `parentItemID` 값은 `null`로 설정됩니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| data | object | - | 루트 트리 객체 |
| itemID | string | - | 각 항목의 고유 키 이름 |
| parentItemID | string | - | 부모 참조 키로 사용할 이름(결과에 추가됨) |
| childrenID | string | `items` | 자식 배열 속성 이름 |

반환값: `object[]`

예시
```javascript
var flat = syn.$l.nested2Flat(tree, 'id', 'parentId', 'items');
```

### `syn.$l.flat2Nested(data, itemID, parentItemID, childrenID = 'items')`
설명: 평면 배열을 트리(중첩) 구조로 변환합니다. `parentItemID` 값이 `null`인 항목을 루트로 인식합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| data | object[] | - | 평면 배열 |
| itemID | string | - | 각 항목의 고유 키 이름 |
| parentItemID | string | - | 부모 참조 키 이름 |
| childrenID | string | `items` | 결과에 채워질 자식 배열 속성 이름 |

반환값: `object` — 루트 노드(자식은 `childrenID` 속성에 중첩)

예시
```javascript
var tree = syn.$l.flat2Nested(flatArray, 'id', 'parentId');
```

### `syn.$l.findNestedByID(data, findID, itemID, childrenID = 'items')`
설명: 트리(또는 트리 배열)에서 `itemID` 값이 `findID`와 일치하는 첫 번째 노드를 재귀적으로 검색합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| data | object \| object[] | - | 검색 대상 트리 또는 트리 배열 |
| findID | any | - | 찾을 ID 값 |
| itemID | string | - | 각 항목의 고유 키 이름 |
| childrenID | string | `items` | 자식 배열 속성 이름 |

반환값: 매칭된 노드 객체 또는 `null`

예시
```javascript
var node = syn.$l.findNestedByID(tree, 10, 'id', 'items');
```

---

## 객체 고정

### `syn.$l.deepFreeze(object)`
설명: 객체와 그 하위 객체 속성 전체를 재귀적으로 `Object.freeze()` 처리합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| object | object | 고정할 객체 |

반환값: 고정된 동일 객체(참조 유지)

예시
```javascript
var frozen = syn.$l.deepFreeze({ value: 'hello' });
```

---

## Blob / DataURI / Base64 / File 변환

### `syn.$l.createBlob(data, type)`
설명: 데이터로부터 `Blob`을 생성합니다. `Blob` 생성자가 없는 구형 환경에서는 `BlobBuilder` 폴백을 시도합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| data | any | Blob 내용(문자열, ArrayBuffer 등) |
| type | string | MIME 타입 |

반환값: `Blob | null`

예시
```javascript
var blob = syn.$l.createBlob('hello world', 'text/plain');
```

### `syn.$l.dataUriToBlob(dataUri)`
설명: `data:` DataURI 문자열을 `Blob`으로 변환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| dataUri | string | `data:mime;base64,...` 형식 문자열 |

반환값: `Blob | null`

예시
```javascript
var blob = syn.$l.dataUriToBlob('data:text/plain;base64,aGVsbG8=');
```

### `syn.$l.dataUriToText(dataUri)`
설명: DataURI 문자열을 디코딩하여 `{ value, mime }` 형태로 반환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| dataUri | string | `data:mime;base64,...` 형식 문자열 |

반환값: `{ value: string, mime: string } | null`

예시
```javascript
var { value, mime } = syn.$l.dataUriToText('data:text/plain;base64,aGVsbG8=');
```

### `syn.$l.blobToDataUri(blob, callback)`
설명: `FileReader`를 사용해 `Blob`을 DataURI 문자열로 변환합니다(비동기, 콜백 기반).

| 매개변수 | 타입 | 설명 |
|---|---|---|
| blob | Blob | 변환할 Blob |
| callback | function | `(dataUri) => void` |

반환값: 없음(콜백으로 결과 전달)

예시
```javascript
syn.$l.blobToDataUri(blob, (dataUri) => console.log(dataUri));
```

### `syn.$l.blobToDownload(blob, fileName)`
설명: `Blob`을 파일로 즉시 다운로드합니다(IE의 `msSaveOrOpenBlob` 폴백 포함). Node.js 환경에서는 동작하지 않습니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| blob | Blob | 다운로드할 Blob |
| fileName | string | 저장 파일 이름 |

반환값: 없음

예시
```javascript
syn.$l.blobToDownload(blob, 'hello.txt');
```

### `syn.$l.blobUrlToBlob(url, callback)`
설명: Blob URL(`blob:...`)이나 일반 URL을 `fetch`로 조회하여 `Blob`으로 반환합니다(비동기, 콜백 기반).

| 매개변수 | 타입 | 설명 |
|---|---|---|
| url | string | 조회할 URL |
| callback | function | `(blob) => void` |

반환값: 없음(콜백으로 결과 전달)

예시
```javascript
syn.$l.blobUrlToBlob(blobUrl, (blob) => console.log(blob.size));
```

### `syn.$l.blobUrlToDataUri(url, callback)`
설명: `blobUrlToBlob` + `blobToDataUri`를 연달아 수행하여 URL을 DataURI로 변환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| url | string | 조회할 URL |
| callback | function | `(dataUri) => void` |

반환값: 없음(콜백으로 결과 전달)

예시
```javascript
syn.$l.blobUrlToDataUri(blobUrl, (dataUri) => console.log(dataUri));
```

### `syn.$l.blobToBase64(blob, base64Only = false)`
설명: `Blob`을 Base64(또는 전체 DataURI) 문자열로 변환합니다. Node.js에서는 `Buffer`, 브라우저에서는 `FileReader`를 사용합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| blob | Blob | - | 변환할 Blob |
| base64Only | boolean | false | true면 순수 Base64만, false면 `data:...;base64,...` 전체 문자열 반환 |

반환값: `Promise<string | null>`

예시
```javascript
var base64 = await syn.$l.blobToBase64(blob, true);
```

### `syn.$l.base64ToBlob(b64Data, contentType = '', sliceSize = 512)`
설명: 순수 Base64 문자열을 `Blob`으로 변환합니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| b64Data | string | - | Base64 인코딩 문자열(DataURI 접두사 제외) |
| contentType | string | `''` | 생성할 Blob의 MIME 타입 |
| sliceSize | number | 512 | 내부 청크 처리 크기(바이트) |

반환값: `Blob | null`

예시
```javascript
var blob = syn.$l.base64ToBlob(base64Data, 'text/plain');
```

### `syn.$l.blobToFile(blob, fileName, mimeType)`
설명: `Blob`을 `File` 객체로 변환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| blob | Blob | 변환할 Blob |
| fileName | string | 파일 이름(생략 시 `blob-<timestamp>`) |
| mimeType | string | MIME 타입(생략 시 `blob.type`) |

반환값: `Promise<File | null>`

예시
```javascript
var file = await syn.$l.blobToFile(blob, 'hello.txt');
```

### `syn.$l.fileToBase64(file)`
설명: `File` 객체(브라우저) 또는 로컬 경로/URL 문자열(Node.js)을 Base64 DataURI 문자열로 변환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| file | File \| string | 브라우저에서는 `File` 객체, Node.js에서는 파일 경로 또는 http(s) URL |

반환값: `Promise<string | null>`

예시
```javascript
var base64 = await syn.$l.fileToBase64(fileObject);
```

### `syn.$l.fileToBlob(file)`
설명: `fileToBase64` 결과를 다시 `base64ToBlob`으로 변환하여 `Blob`을 반환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| file | File \| string | `fileToBase64`와 동일 |

반환값: `Promise<Blob | null>`

예시
```javascript
var blob = await syn.$l.fileToBlob(fileObject);
```

### `syn.$l.urlToBase64(url)`
설명: `syn.$r.httpFetch(url).send()`로 원격 리소스를 조회한 뒤 Base64 문자열(순수 Base64)로 변환합니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| url | string | 조회할 URL |

반환값: `Promise<string | null>`

예시
```javascript
var base64 = await syn.$l.urlToBase64('/images/logo.png');
```

### `syn.$l.resizeImage(blob, maxSize)`
설명: 이미지 `Blob`을 `<canvas>`로 그려 긴 변 기준 `maxSize` 이하로 축소한 새 `Blob`(JPEG, 품질 0.9)을 반환합니다. Node.js 환경 또는 이미지가 아닌 Blob에는 사용할 수 없습니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| blob | Blob | - | `image/*` 타입의 Blob |
| maxSize | number | 80 | 축소 기준이 되는 최대 변 길이(px) |

반환값: `Promise<{ blob: Blob, width: number, height: number }>`

예시
```javascript
var result = await syn.$l.resizeImage(imageBlob, 120);
```

---

## 로깅

### `syn.$l.logLevel`
설명: `eventLog`/`moduleEventLog`에서 사용하는 로그 레벨 열거자입니다. `{ Verbose: 0, Debug: 1, Information: 2, Warning: 3, Error: 4, Fatal: 5 }`

### `syn.$l.eventLog(event, data, logLevelInput = 'Verbose', logStyle = null)`
설명: syn.js 전반에서 사용하는 중앙 로거입니다. 지정한 로그 레벨이 `syn.Config.UIEventLogLevel`보다 낮으면 무시됩니다. 브라우저에서는 레벨에 따라 `console.log/info/warn/error`로 출력하고(`logStyle` 지정 시 `%c` 스타일 적용), `id="eventlogs"` 엘리먼트가 있으면 로그 내용을 해당 엘리먼트에 append합니다. Node.js에서는 `globalRoot.$logger`로 위임됩니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| event | string | - | 로그 출처(모듈.메서드 등) |
| data | string \| Error | - | 로그 메시지 또는 Error 객체 |
| logLevelInput | string \| number | `'Verbose'` | `logLevel` 열거자의 키 또는 값 |
| logStyle | string | null | 브라우저 콘솔용 CSS 스타일 문자열 |

반환값: 없음

예시
```javascript
syn.$l.eventLog('library.html', '경고 메시지', 'Warning');
```

### `syn.$l.getBasePath(basePathInput, defaultPath)` (Node.js 전용)
설명: Node.js 실행 환경에서 상대/절대 경로를 현재 작업 디렉터리(`process.cwd()`) 기준의 절대 경로로 정규화합니다. 브라우저 환경에서는 `basePathInput || defaultPath || ''`를 그대로 반환하지만, 브라우저에서는 이 메서드 자체가 로드 시 삭제되어 존재하지 않습니다.

| 매개변수 | 타입 | 설명 |
|---|---|---|
| basePathInput | string | 기준이 될 입력 경로(상대/절대) |
| defaultPath | string | `basePathInput`이 없을 때 사용할 기본 경로 |

반환값: `string` — 정규화된 절대 경로

### `syn.$l.moduleEventLog(moduleID, event, data, logLevelInput = 'Verbose')` (Node.js 전용)
설명: `syn.getModuleLibrary(moduleID)`로 조회한 모듈 전용 로거(`logger.debug/info/warn/error/fatal/trace`)에 로그를 기록합니다. Node.js 실행 환경에서만 동작하며, 브라우저에서는 이 메서드가 로드 시 삭제되어 존재하지 않습니다.

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| moduleID | string | - | 대상 모듈 ID |
| event | string | - | 로그 출처 |
| data | string \| object | - | 로그 메시지 또는 message/stack을 가진 객체 |
| logLevelInput | string | `'Verbose'` | `logLevel` 열거자의 키 |

반환값: 없음
