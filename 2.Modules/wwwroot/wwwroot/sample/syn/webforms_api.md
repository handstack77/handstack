# syn.$w API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$w` (원본: `context.$webform`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 6921~10990번째 줄) |
| 예제 페이지 | `/sample/syn/webforms.html` |
| 의존 모듈 | `syn.$l`(library, get/eventLog/addEvent 등), `syn.$d`(dimension, offset), `syn.$o`(object), `syn.$s`(string), `syn.$b`(browser, getIpAddress), `syn.$a`(array), `syn.uicontrols.*`(그리드/차트 등 컨트롤) |

## 스토리지

### `syn.$w.setStorage(prop, val, isLocal, ttl)`
- 설명: 값을 `sessionStorage`(기본) 또는 `localStorage`(`isLocal=true`)에 JSON 직렬화하여 저장합니다. Node(디바이스) 환경에서 세션 저장은 `ttl`(기본 1,200,000ms)을 적용한 만료 정보를 함께 저장합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | prop | `string` | Y | 저장 키 |
  | val | `any` | Y | 저장할 값(JSON 직렬화됨) |
  | isLocal | `boolean` | N | `true`이면 `localStorage` 사용(기본값 `false`) |
  | ttl | `number` | N | Node 환경 세션 저장 시 만료(ms), 기본 1,200,000 |
- 반환값: `syn.$w` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$w.setStorage('token', 'abcd1234');
  syn.$w.setStorage('token', 'abcd1234', true);
  ```

### `syn.$w.getStorage(prop, isLocal)`
- 설명: `sessionStorage`/`localStorage`에서 값을 조회해 JSON으로 역직렬화합니다. `prop`이 배열이면 해당 키들에 매칭되는 값들을 객체로 반환합니다. Node 환경의 세션 저장은 만료 시간이 지나면 자동 삭제 후 `null`을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | prop | `string \| string[]` | Y | 조회할 키(또는 키 배열) |
  | isLocal | `boolean` | N | `true`이면 `localStorage` 조회(기본값 `false`) |
- 반환값: `any | object | null` — 조회된 값(파싱 실패/미존재 시 `null`)
- 예시
  ```js
  var token = syn.$w.getStorage('token');
  ```

### `syn.$w.removeStorage(prop, isLocal)`
- 설명: `sessionStorage`/`localStorage`에서 지정한 키를 삭제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | prop | `string` | Y | 삭제할 키 |
  | isLocal | `boolean` | N | `true`이면 `localStorage` 대상(기본값 `false`) |
- 반환값: `syn.$w` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$w.removeStorage('token');
  ```

### `syn.$w.getStorageKeys(isLocal)`
- 설명: `sessionStorage`/`localStorage`에 저장된 전체 키 목록을 배열로 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | isLocal | `boolean` | N | `true`이면 `localStorage` 대상(기본값 `false`) |
- 반환값: `string[]` — 키 목록
- 예시
  ```js
  var keys = syn.$w.getStorageKeys();
  ```

## 페이지 라이프사이클

### `syn.$w.activeControl(evt)`
- 설명: 이벤트가 발생한 노드(`evt.target`) → 마지막으로 포커스했던 노드(`$this.context.focusControl`) → `document.activeElement` 순서로 현재 활성 컨트롤을 조회합니다. 조회된 노드는 이후 참조를 위해 `$this.context.focusControl`에 갱신됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | evt | `Event` | N | 이벤트 객체(생략 시 `window.event` 또는 마지막 활성 노드 사용) |
- 반환값: `HTMLElement | null` — 활성 컨트롤 엘리먼트
- 예시
  ```js
  var el = syn.$w.activeControl();
  ```

### `syn.$w.argumentsExtend(...args)`
- 설명: 여러 객체를 `Object.assign({}, ...args)`로 얕은 병합(shallow merge)합니다. syn.js 내부에서 옵션 병합에 광범위하게 사용됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | args | `object[]` | Y | 병합할 객체들(가변 인자) |
- 반환값: `object` — 병합된 새 객체
- 예시
  ```js
  var merged = syn.$w.argumentsExtend({ a: 0, b: '' }, { a: 1 });
  ```

### `syn.$w.contentLoaded()`
- 설명: 페이지 진입 시 `syn.loader.js`가 자동으로 1회 호출하는 화면 부트스트랩 함수입니다. 폼 submit 가로채기, SSO 사용자 정보(`syn.$w.User`) 초기화, 미디어 쿼리 구간 변경 이벤트 연결, 탭 순서(tabOrderControls) 계산 등을 수행한 뒤 현재 페이지 모듈의 `hook.pageLoad()`를 호출합니다.
- 매개변수: 없음
- 반환값: `Promise<void>`
- 예시
  ```js
  // 일반적으로 직접 호출하지 않으며, syn.loader.js가 DOMContentLoaded 시점에 자동 실행합니다.
  console.log(syn.$w.pageScript, syn.$w.isPageLoad);
  ```

### `syn.$w.getTriggerOptions(el)`
- 설명: 엘리먼트의 `triggerOptions` 속성(JSON 문자열)을 파싱해 객체로 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 엘리먼트(ID 또는 엘리먼트) |
- 반환값: `object | null` — 파싱된 옵션 객체, 속성이 없거나 파싱 실패 시 `null`
- 예시
  ```js
  var options = syn.$w.getTriggerOptions('btn_target');
  ```

### `syn.$w.triggerAction(triggerConfig)`
- 설명: `triggerConfig.triggerID`/`action` 조합(또는 `method` 문자열)으로 등록된 `event` 핸들러나 `syn.uicontrols.$*` 함수를 간접적으로 실행합니다. 실행 전후로 `hook.beforeTrigger`/`hook.afterTrigger`가 호출됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | triggerConfig | `object` | Y | `{ triggerID, action, method, params: { arguments, options } }` 형태 |
- 반환값: 없음(내부적으로 실행 결과는 `hook.afterTrigger`로 전달)
- 예시
  ```js
  syn.$w.triggerAction({ triggerID: 'btn_scrollToTop', action: 'click', params: { arguments: [], options: {} } });
  ```

### `syn.$w.getControlModule(modulePath)`
- 설명: `"syn.$l"`과 같은 점(dot) 표기 경로 문자열로 전역 컨텍스트에서 실제 모듈 객체 참조를 조회합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | modulePath | `string` | Y | 점(dot) 표기 모듈 경로 |
- 반환값: `object | null` — 조회된 모듈 참조, 없으면 `null`
- 예시
  ```js
  var lib = syn.$w.getControlModule('syn.$l');
  ```

## 거래 엔진
> 아래 항목들은 화면 모듈에 선언한 `transaction` 설정(`{ functionID: { inputs, outputs } }`)을 기반으로 동작하는 범용 구조를 설명합니다. 실제 업무 필드/응답 데이터는 연결된 HandStack 백엔드 거래 정의에 따라 달라지며, 이 문서와 예제는 그 실제 값을 임의로 정의하지 않습니다.

### `syn.$w.tryAddFunction(transactConfig)`
- 설명: `transactConfig`(`functionID`, `inputs`, `outputs`, `transactionResult`, `noProgress` 등)를 현재 화면의 거래 목록(`$this.config.transactions`)에 등록(중복 시 교체)합니다. 네트워크 요청을 수행하지 않는 로컬 등록 함수입니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | transactConfig | `object` | Y | `{ functionID, inputs: [{type, dataFieldID}], outputs: [{type, dataFieldID}], transactionResult?, noProgress? }` |
- 반환값: 없음
- 예시
  ```js
  syn.$w.tryAddFunction($webforms.transaction.GD01);
  ```

### `syn.$w.getterValue(functionID)`
- 설명: 화면-거래 매핑 설정(`transaction[functionID].inputs`)에 따라 현재 컨트롤 값을 수집해 요청 정보 형태로 반환합니다. 네트워크 요청은 수행하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | functionID | `string` | Y | 화면에 선언된 거래 식별자(예: `GD01`) |
- 반환값: `{ errors: string[], inputs: any[] }` — 수집된 입력 정보
- 예시
  ```js
  var result = syn.$w.getterValue('GD01');
  ```

### `syn.$w.setterValue(functionID, responseData)`
- 설명: 서버 응답 형태의 `responseData`를 화면-거래 매핑 설정(`transaction[functionID].outputs`)에 따라 화면 컨트롤에 적용합니다. 네트워크 요청은 수행하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | functionID | `string` | Y | 화면에 선언된 거래 식별자(예: `GD01`) |
  | responseData | `any[]` | Y | 출력 매핑(outputs) 순서에 대응하는 응답 데이터 배열 |
- 반환값: `{ errors: string[], outputs: any[] }` — 적용 결과 요약
- 예시
  ```js
  syn.$w.setterValue('GD01', dataSet);
  ```

### `syn.$w.transactionAction(transactConfigInput, options)`
- 설명: `functionID` 문자열 또는 거래 설정 객체를 받아 `tryAddFunction()`으로 등록 후 `transaction()`을 실행하는 상위 래퍼입니다. 완료/실패 시 화면 모듈의 `hook.afterTransaction(error, functionID, result, additionalData, correlationID)`을 호출합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | transactConfigInput | `string \| object` | Y | `functionID` 문자열 또는 거래 설정 객체 |
  | options | `object` | N | `message`, `dynamic`, `authorize`, `commandType`, `returnType`, `transactionScope`, `transactionLog`, `endpoint` 등 공통 옵션 |
- 반환값: 없음(결과는 `hook.afterTransaction` 콜백으로 전달)
- 예시
  ```js
  syn.$w.transactionAction('GD01', { message: '조회 중...' });
  ```
- 참고: 실제 서버 응답을 받으려면 HandStack 백엔드/거래 모듈 연결이 필요합니다. 연결되어 있지 않으면 `hook.afterTransaction`의 `error` 값이 채워지는 것이 정상입니다.

### `syn.$w.transaction(functionID, callback, options)`
- 설명: `transactionAction()` 내부에서 사용하는 저수준 함수로, 화면 컨트롤에서 입력값을 수집해 서버에 거래를 요청하고 응답을 컨트롤에 매핑합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | functionID | `string` | Y | 화면에 선언된 거래 식별자 |
  | callback | `function(result, additionalData, correlationID)` | N | 완료 콜백. `result`는 `{ errorText: string[], outputStat: any[] }` |
  | options | `object` | N | `transactionAction()`과 동일한 공통 옵션 |
- 반환값: 없음
- 예시
  ```js
  syn.$w.transaction('GD01', function (result) {
      console.log(result.errorText);
  });
  ```
- 참고: 실제 응답을 받으려면 HandStack 백엔드/거래 모듈 연결이 필요합니다.

### `syn.$w.transactionDirect(directObject, callback, options)`
- 설명: 화면 컨트롤 매핑 없이 `functionID`, `transactionID` 등 값을 직접 지정해 서버에 거래를 요청합니다. `Promise`를 반환하며 실패 시 reject 됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | directObject | `object` | Y | `{ functionID, programID?, moduleID?, businessID?, systemID?, transactionID, transactionToken?, dataMapInterface?, transactionResult?, screenID?, startTraceID?, inputObjects?, inputLists?, noProgress? }` |
  | callback | `function(responseData, additionalData)` | N | 응답 수신 콜백 |
  | options | `object` | N | `transactionAction()`과 동일한 공통 옵션 |
- 반환값: `Promise<{ responseData, additionalData }>`
- 예시
  ```js
  const result = await syn.$w.transactionDirect({ functionID: 'GD01', transactionID: 'GD01', inputObjects: {} });
  ```
- 참고: 실제 응답을 받으려면 HandStack 백엔드/거래 모듈 연결이 필요합니다. 연결되어 있지 않으면 이 호출은 오류(reject)로 종료되는 것이 정상입니다.

### `syn.$w.transactionObject(functionID, returnType)`
- 설명: 서버 전송용 거래 객체의 기본 골격을 생성합니다(`programID`, `businessID`, `systemID`, `transactionID` 등은 빈 값으로 초기화되며, 이후 호출부에서 채워집니다). 네트워크 요청을 수행하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | functionID | `string` | Y | 거래 식별자 |
  | returnType | `string` | N | 반환 형식(기본값 `'Json'`) |
- 반환값: `object` — `{ programID, businessID, systemID, transactionID, transactionToken, dataMapInterface, transactionResult, functionID, screenID, startTraceID, requestID, returnType, resultAlias, inputsItemCount, inputs }`
- 예시
  ```js
  var obj = syn.$w.transactionObject('GD01');
  ```

## 스크립트/스타일 로딩

### `syn.$w.loadScript(url, scriptID, callback)`
- 설명: 외부 `<script>` 리소스를 `<head>`에 동적으로 추가합니다. 동일한 `scriptID`가 이미 있으면 다시 추가하지 않고 `callback`만 실행합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 스크립트 URL |
  | scriptID | `string` | N | 중복 방지를 위한 엘리먼트 ID(생략 시 자동 생성) |
  | callback | `function()` | N | 로드 완료 콜백 |
- 반환값: `syn.$w`
- 예시
  ```js
  syn.$w.loadScript('https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.13.6/underscore-min.js');
  ```

### `syn.$w.loadStyle(url, styleID, callback)`
- 설명: 외부 `<link rel="stylesheet">` 리소스를 `<head>`에 동적으로 추가합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 스타일시트 URL |
  | styleID | `string` | N | 중복 방지를 위한 엘리먼트 ID(생략 시 자동 생성) |
  | callback | `function()` | N | 로드 완료 콜백 |
- 반환값: `syn.$w`
- 예시
  ```js
  syn.$w.loadStyle('/sample/syn/style.css');
  ```

### `syn.$w.getDynamicStyle(styleID)`
- 설명: `styleID`에 해당하는 `<style>` 엘리먼트를 조회하거나 없으면 생성한 뒤 해당 `CSSStyleSheet`를 반환합니다. `styleID`를 생략하면 문서의 마지막 스타일시트를 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | styleID | `string` | N | 대상 `<style>` 엘리먼트 ID |
- 반환값: `CSSStyleSheet | null`
- 예시
  ```js
  var sheet = syn.$w.getDynamicStyle('demo-style');
  ```

### `syn.$w.addCssRule(rules, styleID)`
- 설명: `getDynamicStyle(styleID)`로 얻은 시트에 CSS 규칙(문자열 또는 문자열 배열)을 `insertRule`로 추가합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | rules | `string \| string[]` | Y | 추가할 CSS 규칙 |
  | styleID | `string` | N | 대상 `<style>` 엘리먼트 ID |
- 반환값: `number[]` — 추가된 규칙들의 인덱스 배열
- 예시
  ```js
  syn.$w.addCssRule('.highlight { background-color: yellow; }', 'demo-style');
  ```

### `syn.$w.removeCssRule(identifier, styleID)`
- 설명: 인덱스(`number`) 또는 셀렉터 문자열(`string`)로 지정한 CSS 규칙을 삭제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | identifier | `number \| string` | Y | 삭제할 규칙의 인덱스 또는 셀렉터 |
  | styleID | `string` | N | 대상 `<style>` 엘리먼트 ID |
- 반환값: `boolean` — 삭제 성공 여부
- 예시
  ```js
  syn.$w.removeCssRule('.highlight', 'demo-style');
  ```

### `syn.$w.pseudoStyle(elID, selector, cssText)`
- 설명: `elID`의 `<style>` 엘리먼트 내용을 `selector { cssText }` 형태로 통째로 교체(생성)합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | elID | `string` | Y | 대상 `<style>` 엘리먼트 ID |
  | selector | `string` | Y | CSS 셀렉터 |
  | cssText | `string` | Y | 선언 블록 내용 |
- 반환값: 없음
- 예시
  ```js
  syn.$w.pseudoStyle('quick-style', '#target', 'color: red;');
  ```

### `syn.$w.pseudoStyles(elID, styles)`
- 설명: `elID`의 `<style>` 엘리먼트 내용을 여러 `{selector, cssText}` 조합으로 한 번에 교체(생성)합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | elID | `string` | Y | 대상 `<style>` 엘리먼트 ID |
  | styles | `{selector, cssText}[]` | Y | 적용할 스타일 목록 |
- 반환값: 없음
- 예시
  ```js
  syn.$w.pseudoStyles('quick-style', [{ selector: '#a', cssText: 'color:red;' }]);
  ```

## 기타 유틸리티

### `syn.$w.scrollToTop()`
- 설명: `requestAnimationFrame`을 이용해 화면 스크롤을 부드럽게 최상단으로 이동합니다.
- 매개변수: 없음
- 반환값: 없음
- 예시
  ```js
  syn.$w.scrollToTop();
  ```

### `syn.$w.scrollToElement(el, offset)`
- 설명: 지정한 엘리먼트 위치까지 ease-in-out 곡선으로 스크롤 이동합니다(200ms).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 엘리먼트(ID 또는 엘리먼트) |
  | offset | `number` | N | 목표 지점에서 뺄 여백(px), 기본값 0 |
- 반환값: 없음
- 예시
  ```js
  syn.$w.scrollToElement('#anchor_bottom', 80);
  ```

### `syn.$w.setFavicon(url)`
- 설명: 문서의 favicon(`link[rel="icon"]`)을 조회하거나 새로 생성해 `url`로 설정합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | favicon 이미지 URL |
- 반환값: 없음
- 예시
  ```js
  syn.$w.setFavicon('/img/logo.ico');
  ```

### `syn.$w.fileDownload(url, fileName)`
- 설명: 임시 `<a download>` 엘리먼트를 생성해 `url` 응답을 파일로 다운로드합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 다운로드할 리소스 URL |
  | fileName | `string` | N | 저장할 파일명(생략 시 URL에서 추출) |
- 반환값: 없음
- 예시
  ```js
  syn.$w.fileDownload('/sample/syn/webforms.html', 'download.txt');
  ```

### `syn.$w.sleep(ms, callback)`
- 설명: 지정한 시간(ms) 후 실행되는 지연 함수입니다. `callback`을 전달하면 `setTimeout` 방식으로 동작하고, 생략하면 `Promise`를 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | ms | `number` | Y | 대기 시간(ms) |
  | callback | `function()` | N | 콜백 함수 |
- 반환값: `Promise<void> | number` — 콜백 미지정 시 Promise, 지정 시 타이머 ID
- 예시
  ```js
  await syn.$w.sleep(1500);
  ```

### `syn.$w.purge(el)`
- 설명: 엘리먼트와 하위 노드에 연결된 `on*` 인라인 이벤트 핸들러를 재귀적으로 제거하고, `syn.$l.events.removeAllForElement()`로 등록된 이벤트 리스너도 함께 정리합니다(메모리 누수 방지 목적).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `HTMLElement` | Y | 정리할 엘리먼트 |
- 반환값: 없음
- 예시
  ```js
  syn.$w.purge(document.getElementById('temp'));
  ```

### `syn.$w.setServiceObject(value)`
- 설명: 거래 전송 시 참고할 서비스 객체 값을 문자열로 저장합니다(`syn.$w.serviceObject`). `value`가 문자열이 아니면 `JSON.stringify`로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | value | `string \| object` | Y | 저장할 서비스 객체 값 |
- 반환값: `syn.$w`
- 예시
  ```js
  syn.$w.setServiceObject({ demo: true });
  ```

### `syn.$w.setServiceClientHeader(xhr)`
- 설명: `XMLHttpRequest`에 인증 헤더(`CertificationKey`)를 설정합니다. `loadJson()` 등 내부 XHR 호출 전에 사용됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | xhr | `XMLHttpRequest` | Y | 헤더를 설정할 XHR 인스턴스 |
- 반환값: `boolean` — 항상 `true`
- 예시
  ```js
  var xhr = syn.$w.xmlHttp();
  xhr.open('GET', url, true);
  syn.$w.setServiceClientHeader(xhr);
  ```

### `syn.$w.xmlHttp()`
- 설명: 새 `XMLHttpRequest` 인스턴스를 생성해 반환합니다.
- 매개변수: 없음
- 반환값: `XMLHttpRequest`
- 예시
  ```js
  var xhr = syn.$w.xmlHttp();
  ```

### `syn.$w.xmlParser(xmlString)`
- 설명: XML 문자열을 `DOMParser`로 파싱해 `Document` 객체로 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | xmlString | `string` | Y | 파싱할 XML 문자열 |
- 반환값: `Document | null` — 파싱 결과, 미지원/오류 시 `null`
- 예시
  ```js
  var xmlDoc = syn.$w.xmlParser('<root><item>hello</item></root>');
  ```

### `syn.$w.apiHttp(url)`
- 설명: `Proxy` 기반으로 `send(raw, options)` 메서드를 제공하는 경량 `fetch` 래퍼를 반환합니다. `raw`가 객체(FormData 제외)이면 JSON으로 직렬화해 전송하고, 응답의 `Content-Type`에 따라 JSON/텍스트/Blob으로 파싱합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 요청 URL |
- 반환값: `{ send(raw?, options?): Promise<any> }` — `send()` 호출 시 실제 요청 수행
- 예시
  ```js
  var result = await syn.$w.apiHttp('sample.json').send();
  ```

### `syn.$w.loadScript`/`loadStyle`와 함께 자주 쓰이는 리소스 조회 함수

### `syn.$w.fetchText(url)`
- 설명: `fetch()`로 `url` 응답을 텍스트로 조회합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 조회할 URL |
- 반환값: `Promise<string>`
- 예시
  ```js
  var text = await syn.$w.fetchText('style.css');
  ```

### `syn.$w.fetchJson(url)`
- 설명: `fetch()`로 `url` 응답을 JSON 객체로 조회합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 조회할 URL |
- 반환값: `Promise<object>`
- 예시
  ```js
  var json = await syn.$w.fetchJson('sample.json');
  ```

### `syn.$w.loadJson(url, setting, success, callback, async, isForceCallback)`
- 설명: `XMLHttpRequest`로 JSON 주소를 동기(`async=false`) 또는 비동기 방식으로 요청하고, 성공 시 `success(setting, responseData)`를, 완료(성공/강제) 시 `callback()`을 실행합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 요청 URL |
  | setting | `any` | N | `success` 콜백에 그대로 전달되는 참조 값 |
  | success | `function(setting, responseData)` | N | 파싱 성공 시 콜백 |
  | callback | `function()` | N | 완료 콜백(성공 또는 `isForceCallback=true`인 실패 시 실행) |
  | async | `boolean` | N | 비동기 여부(기본값 `true`) |
  | isForceCallback | `boolean` | N | 실패 시에도 `callback` 강제 실행 여부(기본값 `false`) |
- 반환값: 없음
- 예시
  ```js
  syn.$w.loadJson('sample.json', null, function (setting, json) {
      console.log(json);
  });
  ```

### `syn.$w.fetchImage(url, fallbackUrl)`
- 설명: 이미지를 미리 로드(preload)하고, 로드 실패 시 `fallbackUrl` 이미지로 1회 재시도합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | url | `string` | Y | 로드할 이미지 URL |
  | fallbackUrl | `string` | N | 실패 시 대체 이미지 URL |
- 반환값: `Promise<HTMLImageElement>`
- 예시
  ```js
  var img = await syn.$w.fetchImage('/img/logo.ico', '/img/logo.ico');
  ```

### `syn.$w.startIntersection(id, placeholder, loadMore, options)`
- 설명: `IntersectionObserver`로 `placeholder` 엘리먼트가 뷰포트(또는 `options.root`)에 들어오면 `loadMore(done)`을 실행하는 무한 스크롤/지연 로딩 관찰자를 등록합니다. 이미 실행 중이면 중복 실행되지 않도록 `isLoading` 플래그로 제어됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | id | `string` | Y | 관찰자 고유 식별자 |
  | placeholder | `string \| HTMLElement` | Y | 관찰 대상 엘리먼트 |
  | loadMore | `function(done)` | Y | 교차 시 실행할 콜백. `done(isFinished)` 호출로 로딩 상태 해제/관찰 종료 |
  | options | `object` | N | `IntersectionObserver` 옵션(`root`, `rootMargin`, `threshold` 등), 기본값 `{ root: null, rootMargin: '0px', threshold: 0.01 }` |
- 반환값: `IntersectionObserver | null`
- 예시
  ```js
  syn.$w.startIntersection('list-scroll', '#loading-placeholder', function (done) {
      done(false);
  });
  ```

### `syn.$w.stopIntersection(id)`
- 설명: `id`로 등록된 `IntersectionObserver`를 해제하고 목록에서 제거합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | id | `string` | Y | 해제할 관찰자 식별자 |
- 반환값: 없음
- 예시
  ```js
  syn.$w.stopIntersection('list-scroll');
  ```

### `syn.$w.stopAllIntersections()`
- 설명: 현재 등록된 모든 `IntersectionObserver`를 해제합니다.
- 매개변수: 없음
- 반환값: 없음
- 예시
  ```js
  syn.$w.stopAllIntersections();
  ```
