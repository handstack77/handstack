# iframe 자식 화면 사용법 (syn.$n)

## 개요
`iframe_child.html`은 `$network` 모듈(`syn.$n`)의 "rooms" 채널 기능을 자식(iframe) 화면 관점에서 보여주는 예제입니다. 자식 화면이 로드되는 시점에 `window.parent`를 대상으로 채널을 연결하고, 부모가 `call`로 호출하는 메서드(`bind`)에 응답하거나, 부모에게 이벤트를 통보(`emit`)하는 흐름을 다룹니다. [`iframe_main.html`](./iframe_main.html)과 한 쌍으로 동작합니다.

이 문서는 `rooms.connect` / 채널 객체의 `bind` · `emit`만 다룹니다. SSE·WebSocket 클라이언트 기능과 전역 편의 메서드 `syn.$n.call` · `syn.$n.broadCast` · `syn.$n.emit` · `syn.$n.findChannel`는 [`network.md`](./network.md)에서 다룹니다.

## 로드 방법
`iframe_main.html`이 `<iframe id="ifmChildren">`의 `src`에 `iframe_child.html`을 지정하면서 로드됩니다(직접 브라우저 주소로 열면 `window == window.parent`이므로 채널이 생성되지 않습니다).
```html
<script src="/js/syn.loader.js"></script>
```

## 빠른 시작
1. 부모 화면에서 iframe이 로드되면, `$iframe_child.hook.pageLoad()`가 실행되어 `window != window.parent`를 확인하고 `syn.$n.rooms.connect({ window: window.parent, origin: '*', scope: channelID })`로 채널을 생성합니다.
2. 같은 시점에 `request` 메서드를 `bind`로 등록해, 부모가 `connection.call({ method: 'request', ... })`을 호출하면 응답 값을 반환합니다.
3. `부모 화면 호출하기` 버튼 클릭 → 채널의 `emit({ method: 'response', params })`으로 부모에게 결과를 통보합니다(응답을 기다리지 않는 단방향 전송).

## 주요 시나리오
- 자식 쪽 채널 연결: 자식은 항상 `window: window.parent`로 연결합니다. `scope`(channelID)는 부모와 반드시 동일해야 서로의 채널이 매칭됩니다.
- 부모 요청에 응답하기: `bind('request', function (transaction, params) { ... })`로 등록한 콜백은 부모가 `call()`로 호출할 때 `(transaction, params)` 형태로 실행됩니다. 콜백이 반환하는 값이 `transaction.complete()`를 통해 자동으로 부모의 `success` 콜백에 전달됩니다. 응답을 지연하려면 `transaction.delayReturn(true)` 후 필요한 시점에 `transaction.complete(value)` 또는 `transaction.error(name, message)`를 직접 호출합니다.
- 부모에게 이벤트 통보하기: `emit({ method, params })`은 응답을 요구하지 않는 단방향 메시지입니다. `call()`과 달리 `success`/`error` 콜백을 지원하지 않으므로 지정해도 무시됩니다.

## 실전 예제 페이지
- `/sample/syn/iframe_child.html` + `iframe_child.js`
  - `hook.pageLoad()`: `syn.$n.rooms.connect({ window: window.parent, ... })`로 연결 후 `request` 메서드 바인딩(응답 값을 `return`)
  - `btnChildren2Parent_click()`: 연결된 채널의 `emit({ method: 'response', params: ['response data'] })` 호출

## 주의 사항
- `emit()`에는 `success`/`error` 콜백이 없습니다. 요청-응답이 필요하면 반드시 `call()`을 사용하세요(부모 쪽 예제는 [`iframe_main.md`](./iframe_main.md) 참고).
- `bind('request', ...)` 콜백의 첫 번째 인자는 DOM 이벤트가 아니라 트랜잭션 객체(`transaction`)입니다. `emit`으로 수신되는 메시지의 콜백 첫 번째 인자는 `origin` 정보 객체입니다. 메서드 등록 방식(`call`/`emit`)에 따라 첫 번째 인자의 의미가 다르므로 주의하세요.
- 채널의 `scope`는 부모/자식 양쪽에서 동일한 문자열이어야 합니다.

## 관련 모듈
- API 상세: [`iframe_child_api.md`](./iframe_child_api.md)
- 짝이 되는 부모 화면 예제: [`iframe_main.md`](./iframe_main.md)
- SSE, WebSocket, 전역 `call`/`broadCast`/`emit`/`findChannel` 편의 메서드: [`network.md`](./network.md)
