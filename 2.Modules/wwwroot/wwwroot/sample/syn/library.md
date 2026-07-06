# 공통 라이브러리 사용법 (syn.$l)

## 개요
`syn.$l`(별칭: `syn.$library`)은 HandStack 클라이언트 스크립트(`syn.js`) 전반에서 사용하는 공통 유틸리티 모듈입니다. GUID/난수 생성, DOM 엘리먼트 조회 및 이벤트 바인딩, CSV·TSD·트리 형태의 데이터 변환, Blob/DataURI/Base64/File 상호 변환, 그리고 syn.js 내부 로깅(`eventLog`)까지 폭넓은 범용 기능을 제공합니다.

이 모듈은 브라우저와 Node.js 두 실행 환경을 모두 지원합니다. 다만 `addEvent`, `get`, `querySelector` 등 DOM 관련 메서드는 Node.js 환경에서 제거되며, 반대로 `getBasePath`, `moduleEventLog`는 Node.js 전용 메서드로 브라우저 환경에서는 제공되지 않습니다.

## 로드 방법
`syn.$l`은 `syn.js`가 로드되는 즉시 전역에 등록됩니다. 별도의 초기화 없이 페이지에 `syn.js`(또는 이를 번들링한 `syn.loader.js`)만 포함하면 바로 사용할 수 있습니다.

```html
<script src="/js/syn.loader.js"></script>
<script>
    syn.$l.eventLog('page', 'syn.$l 로드 완료', 'Information');
</script>
```

동적 모듈 페이지(예: 이 저장소의 `sample/syn/*.html`)에서는 `$library` 전역 객체를 통해 `hook`/`event`/`method`를 선언하고 `syn.loader.js`가 이를 자동으로 `syn.$l`과 연결/실행합니다.

## 빠른 시작

```javascript
// 1) 고유 식별자 생성
var id = syn.$l.guid();

// 2) DOM 조회 + 이벤트 바인딩
syn.$l.addEvent('btn_save', 'click', (evt) => {
    var el = syn.$l.get('txt_name');
    syn.$l.eventLog('btn_save.click', `저장 값: ${el.value}`, 'Information');
});

// 3) CSV 문자열 <-> JSON 변환
var json = syn.$l.text2Json('AAA,BBB\n1,2');
var csv = syn.$l.json2Text(json, ['AAA', 'BBB']);
```

## 주요 시나리오

### 1. GUID 생성
```javascript
var id = syn.$l.guid();
// crypto.randomUUID -> crypto.getRandomValues -> Math.random 순서로 폴백하며
// 항상 RFC 4122 형식(8-4-4-4-12)의 문자열을 반환합니다.
```

### 2. DOM 이벤트 바인딩 (addEvent / addLive / trigger)
```javascript
// 특정 노드에 이벤트 등록 (체이닝 지원)
syn.$l
    .addEvent('txt_addEvent', 'click', (evt) => { /* ... */ })
    .addEvent('txt_addEvent', 'blur', (evt) => { /* ... */ });

// 여러 노드에 동일 이벤트 등록
syn.$l.addEvents('input[type="text"]', 'click', (evt) => { /* ... */ });

// 동적으로 추가되는 노드까지 반응하는 위임(delegation) 이벤트
syn.$l.addLive('.dynamic-row', 'click', (evt) => { /* ... */ });

// 등록된 핸들러 존재 여부 확인 및 강제 실행
if (syn.$l.hasEvent('txt_addEvent', 'change')) {
    syn.$l.trigger('txt_addEvent', 'change');
}

// 브라우저 CustomEvent 디스패치
syn.$l.triggerEvent('txt_addEvent', 'change');

// 이벤트 해제
syn.$l.removeEvent('txt_addEvent', 'change', handler);
```
내부적으로 `addEvent`/`removeEvent`는 등록된 (엘리먼트, 타입, 핸들러) 조합을 자체 레지스트리에서 관리하므로, 중복 등록을 막고 `unload` 시점에 일괄 해제(flush)할 수 있습니다.

### 3. CSV <-> JSON 변환
```javascript
var json = syn.$l.text2Json('AAA,BBB,CCC\n111,222,333', ',', '\n');
// [{ AAA: '111', BBB: '222', CCC: '333' }]

var csv = syn.$l.json2Text(json, ['AAA', 'BBB', 'CCC'], ',', '\n');
// 'AAA,BBB,CCC\n111,222,333'
```
값에 구분자/줄바꿈/큰따옴표가 포함되면 `json2Text`가 자동으로 큰따옴표로 감싸고 이스케이프 처리합니다.

### 4. 트리 데이터 변환 (flat2Nested / nested2Flat)
```javascript
// 평면(Flat) 배열 -> 트리(Nested) 구조
var tree = syn.$l.flat2Nested(flatArray, 'id', 'parentId', 'items');

// 트리(Nested) 구조 -> 평면(Flat) 배열
var flat = syn.$l.nested2Flat(tree, 'id', 'parentId', 'items');

// 트리에서 ID로 노드 검색
var node = syn.$l.findNestedByID(tree, 10, 'id', 'items');
```
조직도, 트리 메뉴, 폴더 구조와 같이 부모-자식 관계를 가지는 데이터를 다룰 때 사용합니다. `flat2Nested`는 `parentId`가 `null`인 항목을 루트로 인식합니다.

### 5. Blob / DataURI 변환
```javascript
var blob = syn.$l.createBlob('hello world', 'text/plain');

syn.$l.blobToDataUri(blob, (dataUri) => {
    console.log(dataUri); // data:text/plain;base64,...
});

var restoredBlob = syn.$l.dataUriToBlob('data:text/plain;base64,aGVsbG8=');

syn.$l.blobToDownload(blob, 'hello.txt'); // 브라우저에서 파일 다운로드

var base64 = await syn.$l.blobToBase64(blob, true); // base64Only = true
var blobAgain = syn.$l.base64ToBlob(base64, 'text/plain');
```
File <-> Base64/Blob 상호 변환(`fileToBase64`, `fileToBlob`, `blobToFile`), 원격 URL 다운로드(`urlToBase64`, `blobUrlToBlob`, `blobUrlToDataUri`), 이미지 리사이즈(`resizeImage`)도 함께 제공됩니다.

### 6. eventLog를 이용한 로깅
```javascript
syn.$l.eventLog('moduleName.methodName', '처리 완료', 'Information');
syn.$l.eventLog('moduleName.methodName', error, 'Error');
```
`eventLog(event, data, logLevel, logStyle)`는 syn.js 내부 전반(약 각 모듈의 catch 블록)에서 오류/경고를 표준화된 형식으로 기록하는 중앙 로거입니다. 로그 레벨은 `syn.$l.logLevel`(Verbose=0 ~ Fatal=5) 열거자를 사용하며, `syn.Config.UIEventLogLevel`보다 낮은 레벨은 출력되지 않습니다. 브라우저에서는 `console`에 출력하고(레벨에 따라 log/info/warn/error 자동 매핑), `id="eventlogs"` 엘리먼트가 있으면 화면에도 로그를 append합니다. Node.js 환경에서는 `globalRoot.$logger`로 위임되고, `moduleEventLog(moduleID, event, data, logLevel)`을 통해 모듈별 로거로 기록할 수 있습니다(Node.js 전용).

## 실전 예제 페이지
`2.Modules/wwwroot/wwwroot/sample/syn/library.html`, `library.js` 파일에 위 시나리오를 포함한 40여 개 메서드의 인터랙티브 데모가 구현되어 있습니다. 브라우저에서 해당 페이지를 열어 각 버튼을 클릭하며 실제 동작을 확인할 수 있습니다.

## 주의 사항
- `getValue(elID, defaultValue)`는 웹폼 런타임의 `synControls` 컨텍스트가 존재할 때만 컨트롤 모듈을 통해 값을 조회합니다. `synControls`가 없는 일반 페이지(이 샘플 포함)에서는 DOM 값을 조회하지 않고 항상 `defaultValue`를 반환하므로, 값이 기대와 다르면 우선 웹폼 컨텍스트 여부를 확인하십시오.
- `getBasePath()`, `moduleEventLog()`는 Node.js 런타임 전용 메서드입니다. 이 두 메서드는 브라우저 환경에서는 로드 시점에 `$library` 객체에서 삭제되어 존재하지 않으므로 클라이언트 스크립트에서 호출하면 오류가 발생합니다.
- 반대로 `addEvent`, `addEvents`, `addLive`, `removeEvent`, `hasEvent`, `trigger`, `triggerEvent`, `getValue`, `get`, `querySelector`, `getTagName`, `querySelectorAll`, `dispatchClick`는 브라우저 전용 메서드로, Node.js 실행 환경에서는 제거됩니다.
- `prettyTSD(tsd, isFormat)`가 사용하는 TSD 포맷은 `＾`(메타 구분자), `｜`(컬럼 구분자), `↵`(줄바꿈 구분자)라는 특수 유니코드 문자를 사용합니다. 일반적인 콤마/개행이 아니므로 데이터 원본 포맷을 확인하십시오.
- `deepFreeze()`로 고정한 객체는 strict mode에서 속성 변경 시 `TypeError`가 발생할 수 있습니다(비-strict 모드에서는 조용히 무시됩니다).
- Blob/File 관련 비동기 메서드(`blobToBase64`, `blobToFile`, `fileToBase64`, `fileToBlob`, `urlToBase64`, `resizeImage`)는 모두 Promise를 반환하므로 `await` 또는 `.then()`으로 처리해야 합니다.

## 관련 모듈
- DOM 조작: `syn.$m`(manipulation)
- 웹폼 컨트롤: `syn.$w`(webform)
- 네트워크 요청/Blob URL: `syn.$r`(request)
- 문자열 파싱(TSD 등): `syn.$string`
- API 상세: [`library_api.md`](./library_api.md)
