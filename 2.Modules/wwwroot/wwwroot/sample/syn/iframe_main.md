# iframe 부모 화면 사용법 (syn.$n)

## 개요
`iframe_main.html`은 `$network` 모듈(`syn.$n`, 전역 별칭)이 제공하는 창(window) 간 메시지 채널 기능 중 "rooms" 영역을 부모 화면 관점에서 보여주는 예제입니다. 부모 화면이 `<iframe>`을 로드하고, 해당 iframe의 `contentWindow`와 `postMessage` 기반 채널을 연결한 뒤, 채널을 통해 자식 화면의 메서드를 호출(`call`)하고 자식 화면이 보내는 이벤트(`bind`)를 수신하는 전체 흐름을 다룹니다.

이 문서는 `rooms.connect` / `findChannel` / 채널 객체의 `call` · `bind`만 다룹니다. SSE·WebSocket 클라이언트 기능과, 페이지 하나에서 완결되는 `syn.$n.call` · `syn.$n.broadCast` · `syn.$n.emit` 같은 전역 편의 메서드는 [`network.md`](./network.md)에서 다룹니다.

## 로드 방법
```html
<script src="/js/syn.loader.js"></script>
```
`syn.loader.js`가 `syn.js`(모듈 전역: `syn.$n` 별칭 포함)를 로드하고, 같은 이름의 `iframe_main.js`를 페이지 스크립트로 연결합니다.

## 빠른 시작
1. `iframe 화면 로드` 버튼 클릭 → 화면 내 `<iframe id="ifmChildren">`에 `iframe_child.html`을 로드합니다.
2. `iframe 연결` 버튼 클릭 → `syn.$n.rooms.connect(options)`로 자식 iframe과 채널을 생성하고, 자식이 보내는 `response` 이벤트를 `bind`로 수신 대기합니다.
3. `iframe 호출하기` 버튼 클릭 → 연결된 채널의 `call({ method, params, success, error })`로 자식 화면의 `request` 핸들러를 호출하고 결과를 받습니다.

## 주요 시나리오
- 채널 생성: `syn.$n.rooms.connect({ window, origin, scope, debugOutput })`를 호출하면 지정한 `window`(자식 iframe의 `contentWindow`)와 `postMessage` 채널이 생성됩니다. `scope` 값이 채널을 구분하는 식별자(`channelID`)입니다.
- 중복 연결 방지: `syn.$n.findChannel(channelID)`로 이미 연결된 채널이 있는지 확인합니다. `$network.connections` 배열에서 `options.scope`가 일치하는 채널을 찾아 반환합니다.
- 요청-응답 호출: 연결 객체의 `call({ method, params, success, error })`는 상대 창에 등록된(`bind`) 메서드를 호출하고, 상대가 반환한 값(또는 `transaction.complete()`로 넘긴 값)을 `success` 콜백으로, 실패 시 `error` 콜백으로 받습니다.
- 이벤트 수신 등록: 연결 객체의 `bind(method, callback)`로 상대가 `emit` 또는 `call`로 보내는 메서드 이름에 대응하는 콜백을 등록합니다. `emit`으로 온 메시지는 `callback(origin, params)` 형태로, `call`로 온 메시지는 `callback(transaction, params)` 형태로 호출됩니다(자세한 내용은 [`iframe_child.md`](./iframe_child.md) 참고).

## 실전 예제 페이지
- `/sample/syn/iframe_main.html` + `iframe_main.js`
  - `btnChildrenLoad_click()`: 자식 iframe 문서 로드
  - `btnChildrenConnect_click()`: `syn.$n.findChannel('channelID')`로 중복 연결을 방지하며 `syn.$n.rooms.connect()`로 채널 생성 후 `response` 이벤트 바인딩
  - `btnParent2Children_click()`: `syn.$n.findChannel('channelID')`로 채널을 찾아 `call({ method: 'request', ... })` 호출

## 주의 사항
- 같은 문서(윈도우)를 대상으로 `rooms.connect`를 호출할 수 없습니다(`context === options.window`인 경우 오류 로그 후 종료).
- `origin`을 `'*'`가 아닌 특정 값으로 지정하면 `http(s)://host[:port]` 형태만 허용됩니다.
- 채널은 내부적으로 `__ready` 핸드셰이크가 끝나야(`ready === true`) 실제 메시지가 전송됩니다. 핸드셰이크 이전 메시지는 큐(`pendingQueue`)에 쌓였다가 순서대로 전송됩니다.
- `$network.connections`는 프로세스(윈도우) 전역 배열이므로, 같은 `scope`로 중복 연결하면 `findChannel`로 반드시 사전 확인해야 합니다(예제의 `btnChildrenConnect_click` 참고).

## 관련 모듈
- API 상세: [`iframe_main_api.md`](./iframe_main_api.md)
- 짝이 되는 자식 화면 예제: [`iframe_child.md`](./iframe_child.md)
- SSE, WebSocket, 전역 `call`/`broadCast`/`emit`/`findChannel` 편의 메서드: [`network.md`](./network.md)
