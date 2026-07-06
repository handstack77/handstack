# 화면 개발 및 거래 업무 사용법 (syn.$w)

## 개요
`syn.$w`(별칭: `$webform`)는 syn.js에서 가장 큰 하위 모듈로, 화면 부트스트랩(페이지 로드/포커스 관리), 로컬/세션 스토리지, 동적 스크립트/스타일 로딩, IntersectionObserver 기반 지연 로딩, 그리고 HandStack 백엔드와 통신하는 거래(transaction) 엔진까지 화면 개발에 필요한 핵심 기능을 담당합니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$w`(별칭: `$webform`)로 즉시 사용할 수 있습니다. 화면(HTML) 진입 시 `syn.loader.js`가 `syn.$w.contentLoaded()`를 자동으로 1회 호출하여 페이지 부트스트랩을 수행합니다.

## 빠른 시작
```js
// 세션 스토리지에 값 저장/조회
syn.$w.setStorage('lastVisited', new Date());
var lastVisited = syn.$w.getStorage('lastVisited');

// 거래 요청/응답 매핑 설정(예: GD01)이 있는 화면에서 거래 실행
syn.$w.transactionAction('GD01');
```

## 주요 시나리오

### 페이지 부트스트랩(contentLoaded)
`contentLoaded()`는 `document`의 `DOMContentLoaded` 시점(또는 설정 파일 로드 완료 시점)에 자동으로 호출되어 다음을 처리합니다.
- `<form>` 제출(submit) 이벤트 가로채기 및 `hook.beforeSubmit` 연동
- SSO 사용자 정보(`syn.$w.User`)를 `hook.getSSOInfo()` 또는 기본값으로 초기화하고 `deepFreeze` 처리
- 미디어 쿼리 구간(`xs`~`xxl`) 변경 시 `hook.pageMatch()` 호출
- 화면 내 컨트롤의 탭 순서(tabOrderControls) 계산
- 완료 후 현재 페이지 모듈의 `hook.pageLoad()` 실행

페이지 진입 시 이미 자동 실행되므로, 직접 호출할 필요는 거의 없습니다. 현재 상태는 `syn.$w.pageScript`, `syn.$w.isPageLoad` 속성으로 확인할 수 있습니다.
```js
console.log(syn.$w.pageScript); // 예: '$webforms'
```

### 로컬/세션 스토리지 TTL 관리
`setStorage(prop, val, isLocal, ttl)` / `getStorage(prop, isLocal)` / `removeStorage(prop, isLocal)` / `getStorageKeys(isLocal)`는 브라우저 환경에서는 `sessionStorage`/`localStorage`를 그대로 사용하고, Node(디바이스) 환경에서 세션 저장(`isLocal`이 아닌 경우)은 `expiry`/`ttl` 필드를 포함한 래퍼 객체를 `localStorage`에 저장해 만료(TTL) 관리를 흉내냅니다. 조회 시 만료 시간이 지나면 자동으로 삭제되고, 만료 전이면 조회할 때마다 `expiry`가 갱신됩니다.
```js
syn.$w.setStorage('token', 'abcd1234');           // sessionStorage (브라우저)
syn.$w.setStorage('token', 'abcd1234', true);      // localStorage
var token = syn.$w.getStorage('token');
var keys = syn.$w.getStorageKeys();                // 저장된 전체 키 목록
syn.$w.removeStorage('token');
```

### 거래(transaction) 실행 흐름
화면 모듈에는 아래와 같은 형태로 거래별 입력/출력 매핑을 선언합니다(예시는 이 페이지의 `webforms.js`에 이미 존재하는 `GD01` 선언입니다).
```js
transaction: {
    GD01: {
        inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
        outputs: [{ type: 'Form', dataFieldID: 'MainForm' }]
    }
}
```
실행 흐름은 다음과 같습니다.
1. `transactionAction(functionID 또는 transactConfig, options)`를 호출하면 내부적으로 `tryAddFunction()`으로 화면의 거래 목록에 등록하고, `transaction(functionID, callback, options)`을 실행합니다.
2. `transaction()`은 화면 컨트롤(`synControls`)에서 `inputs` 매핑에 해당하는 값을 수집해 서버로 전송할 거래 객체(`transactionObject()`로 생성한 골격)를 구성합니다.
3. 서버 응답은 `outputs` 매핑에 따라 화면 컨트롤에 자동으로 반영되고, 완료 후 `hook.afterTransaction(error, functionID, result, additionalData, correlationID)`가 호출됩니다.
4. 화면 매핑 없이 값을 직접 지정해 호출하려면 `transactionDirect(directObject, callback, options)`를 사용합니다. 이 경우 `functionID`, `transactionID` 등 값을 직접 채워 넘깁니다.
5. 컨트롤 매핑 없이 요청/응답 원본 값만 다루려면 `getterValue(functionID)` / `setterValue(functionID, responseData)`를 사용합니다.

`options`에는 `message`, `dynamic`, `authorize`, `commandType`, `returnType`, `transactionScope`, `transactionLog`, `endpoint` 등의 공통 옵션이 병합되어 전달됩니다(모두 syn.js 소스에 정의된 기본값이며, 특정 업무 데이터 필드가 아닙니다).

### 동적 스크립트/스타일 로딩
- `loadScript(url, scriptID, callback)` / `loadStyle(url, styleID, callback)`: 외부 `<script>`/`<link>` 리소스를 중복 없이 `<head>`에 추가합니다.
- `getDynamicStyle(styleID)` / `addCssRule(rules, styleID)` / `removeCssRule(identifier, styleID)`: 런타임에 `<style>` 시트를 생성/조회하고 CSS 규칙을 추가·삭제합니다.
- `pseudoStyle(elID, selector, cssText)` / `pseudoStyles(elID, styles)`: 지정한 `<style>` 엘리먼트의 내용을 selector/cssText 조합으로 통째로 교체합니다.
```js
syn.$w.loadStyle('/sample/syn/style.css', 'demo-style');
syn.$w.addCssRule('.highlight { background: yellow; }', 'demo-style');
syn.$w.pseudoStyle('quick-style', '#target', 'color: red;');
```

### IntersectionObserver 기반 지연 로딩
`startIntersection(id, placeholder, loadMore, options)`는 `placeholder` 엘리먼트가 뷰포트(또는 지정한 `root`)에 들어오면 `loadMore(done)` 콜백을 실행하는 무한 스크롤/지연 로딩 헬퍼입니다. `done(true)`를 호출하면 해당 관찰이 자동으로 종료됩니다.
```js
syn.$w.startIntersection('list-scroll', '#loading-placeholder', function (done) {
    // 추가 데이터 로드 로직
    done(false); // 계속 관찰, true면 관찰 종료
}, { rootMargin: '100px' });

syn.$w.stopIntersection('list-scroll');
syn.$w.stopAllIntersections();
```

## 실전 예제 페이지
`/sample/syn/webforms.html` 예제에서 다음 항목을 실습할 수 있습니다.
- 속성: version
- 메서드: setStorage(), getStorage(), removeStorage(), getStorageKeys(), activeControl(), argumentsExtend(), contentLoaded(), getTriggerOptions(), triggerAction(), getControlModule(), tryAddFunction(), getterValue(), setterValue(), transactionAction(), transaction(), transactionDirect(), transactionObject(), scrollToTop(), scrollToElement(), setFavicon(), fileDownload(), sleep(), purge(), setServiceObject(), setServiceClientHeader(), xmlHttp(), xmlParser(), apiHttp(), loadScript(), loadStyle(), getDynamicStyle(), addCssRule(), removeCssRule(), pseudoStyle(), pseudoStyles(), fetchText(), fetchJson(), loadJson(), fetchImage(), startIntersection(), stopIntersection(), stopAllIntersections()

## 주의 사항
- `GD01` 행(거래 실행: `transactionAction()`/`transaction()`, `transactionDirect()`)은 실제 HandStack 백엔드/거래 모듈이 연결되어 있어야 정상 동작합니다. 이 예제 페이지를 백엔드 없이 단독으로 열면 해당 항목은 오류 메시지가 표시되거나 빈 결과가 반환됩니다 — 이는 정상적인 동작이며 페이지 자체의 오류가 아닙니다.
- `getterValue()`/`setterValue()`는 네트워크 요청 없이 화면-거래 매핑 설정과 컨트롤 값만 다루므로 백엔드 없이도 동작을 확인할 수 있습니다. 다만 실제 서버 응답 형태(응답 필드 구조)는 백엔드 거래 정의에 따라 달라지므로 이 문서에서는 임의의 업무 필드를 제시하지 않습니다.
- `Node`(디바이스) 환경과 브라우저 환경에서 `setStorage`/`getStorage`의 세션 스토리지 동작 방식(TTL 유무)이 다릅니다.
- `purge()`, `triggerAction()` 데모는 화면 조작 편의를 위한 예시이며, 운영 화면에서는 컨트롤 생명주기와 이벤트 바인딩 규칙을 함께 고려해야 합니다.
- `apiHttp()`(webform)와 `httpFetch()`(request 모듈, `syn.$r`)는 서로 다른 모듈의 별개 기능입니다. 이름이 유사하니 혼동하지 않도록 주의합니다.

## 관련 모듈
- API 상세: [`webforms_api.md`](./webforms_api.md)
