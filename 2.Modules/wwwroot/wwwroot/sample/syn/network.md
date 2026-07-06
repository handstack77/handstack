# network 사용법 (syn.$n)

## 개요
`$network` 모듈(전역 별칭 `syn.$n`)은 세 가지 통신 기능을 제공합니다.
1. rooms/channel: `postMessage` 기반 창(window) 간 요청-응답 채널(`rooms.connect`, `findChannel`, `call`, `broadCast`, `emit`)
2. SSE 클라이언트: `EventSource` 기반 서버 푸시 수신(`startSse`, `stopSse`, `stopAllSse`, `getSseConnection`)
3. WebSocket 클라이언트: 양방향 소켓 통신, 자동 재연결 포함(`startSocket`, `sendSocketMessage`, `stopSocket`, `stopAllSockets`, `getSocket`)

이 문서(및 `network.html` 예제)는 2번(SSE), 3번(WebSocket), 그리고 1번 중 두 번째 창 없이도 동일 화면에서 바로 쓸 수 있는 전역 편의 메서드(`findChannel`, `call`, `broadCast`, `emit`)를 다룹니다.
`rooms.connect()`로 부모/자식 iframe 두 화면을 직접 연결하고 채널 객체의 `bind()`/`call()`/`emit()`을 사용하는 저수준 흐름은 이미 [`iframe_main.md`](./iframe_main.md) / [`iframe_child.md`](./iframe_child.md)에서 다루므로 이 문서에서는 반복하지 않습니다.

## 로드 방법
```html
<script src="/js/syn.loader.js"></script>
```
`syn.loader.js`가 `syn.js`(모듈 전역: `syn.$n` 별칭 포함)를 로드하고, 같은 이름의 `network.js`를 페이지 스크립트로 연결합니다.

## 빠른 시작
- rooms 편의 메서드: `findChannel`/`call`/`broadCast`/`emit` 버튼 중 아무거나 클릭하면, 화면 뒤에 숨겨진 `<iframe>`을 자동으로 만들고 `scope: 'network-demo'`로 채널을 연결한 뒤 호출을 수행합니다(자세한 구현은 아래 "주의 사항" 참고).
- SSE: `syn.$n.startSse(id, url, eventHandlers, options)` 입력창에 본인이 확인한 SSE 엔드포인트 주소를 넣고 연결을 시작합니다. 주소를 비워두면 안내 메시지만 출력됩니다.
- WebSocket: `syn.$n.startSocket(id, url, eventHandlers, options)` 입력창에 본인이 확인한 WebSocket 엔드포인트 주소(`wss://...`)를 넣고 연결을 시작합니다.

## 주요 시나리오
- 채널 조회: `syn.$n.findChannel(channelID)`는 이미 `rooms.connect({ scope: channelID })`로 연결된 채널 객체를 찾습니다. 연결이 없으면 `undefined`를 반환합니다.
- 특정 채널 호출: `syn.$n.call(channelID, evt, params)`는 `findChannel(channelID)`로 채널을 찾은 뒤, 내부적으로 채널 객체의 `call()`을 호출합니다. 성공/실패 콜백은 모듈이 자체적으로 `debugOutput` 옵션에 따라 로그만 남기므로, 응답 값을 직접 받아 화면에 쓰고 싶다면 `rooms.connect()`가 반환한 채널 객체의 `call({ method, params, success, error })`을 직접 사용해야 합니다([`iframe_main.md`](./iframe_main.md) 참고).
- 전체 방송: `syn.$n.broadCast(evt, params)`는 현재 화면에 연결된 모든 채널에 동일한 `evt`를 호출합니다.
- 내 채널로 통보: `syn.$n.emit(evt, params)`는 `syn.$n.myChannelID`에 해당하는 채널을 찾아 응답을 기대하지 않는 메시지를 보냅니다. `myChannelID`는 보통 화면 URL의 `channelID` 쿼리 문자열로 자동 설정됩니다(자식 iframe 화면에서 주로 사용).
- SSE 수신: `startSse(id, url, eventHandlers, options)`로 연결을 열면 `open`/`message`/`error` 기본 핸들러가 제공되며, `eventHandlers`로 커스텀 이벤트 이름(`heartbeat`, `notice` 등 서버가 보내는 이벤트 이름)에 대한 핸들러를 추가로 등록할 수 있습니다.
- WebSocket 통신: `startSocket(id, url, eventHandlers, options)`은 기본적으로 `autoReconnect: true`(3초 간격)로 동작합니다. `sendSocketMessage(id, message)`는 연결이 열려 있을 때만(`readyState === OPEN`) 전송에 성공합니다.

## 실전 예제 페이지
- `/sample/syn/network.html` + `network.js`
  - `btn_findChannel_click()` / `btn_call_click()` / `btn_broadCast_click()` / `btn_emit_click()`: 숨겨진 데모 iframe과의 채널을 대상으로 전역 편의 메서드 시연
  - `btn_startSse_click()` / `btn_getSseConnection_click()` / `btn_stopSse_click()` / `btn_stopAllSse_click()`: SSE 연결 수명주기
  - `btn_startSocket_click()` / `btn_sendSocketMessage_click()` / `btn_getSocket_click()` / `btn_stopSocket_click()` / `btn_stopAllSockets_click()`: WebSocket 연결 수명주기

## 주의 사항
- 이 저장소에는 실제 SSE/WebSocket 서버가 없습니다. `network.html`의 SSE·WebSocket 입력창은 기본값이 비어 있으며 `placeholder`로만 예시 주소(`https://example.com/sse`, `wss://example.com/socket`)를 표시합니다. 실제 확인 가능한 서버 주소를 직접 입력해야 연결이 이루어지며, 실패 시 `error`/`close` 이벤트가 출력창(textarea)에 그대로 표시됩니다.
- rooms 편의 메서드 데모의 한계: `syn.$n.call`/`syn.$n.broadCast`/`syn.$n.emit`은 실제로 연결된 채널이 있어야 동작합니다. 이 페이지 혼자서는 상대 창이 없으므로, `network.js`가 화면 뒤에 보이지 않는 `<iframe>`을 하나 생성해 `syn.js`를 그대로 로드시키고 `rooms.connect()`로 반대편 채널을 만들어 시연용 상대로 사용합니다. 이는 예제를 위한 자체 구성이며, 실제 서비스에서는 iframe_main/iframe_child 예제처럼 실제로 별도의 화면(부모/자식)이 존재합니다.
- `syn.$n.emit()`은 `syn.$n.myChannelID`가 설정되어 있어야 동작합니다. 데모에서는 버튼 클릭 시 `syn.$n.myChannelID = 'network-demo'`로 임시 지정합니다. 실제 화면에서는 URL의 `channelID`(또는 `ChannelID`/`CHANNELID`/`channelid`) 쿼리 문자열로 페이지 로드 시 자동 설정됩니다.
- SSE/WebSocket 연결은 페이지를 벗어나도 자동으로 정리되지 않으므로, 예제를 반복 실행할 때는 `stopSse`/`stopSocket` 계열 메서드로 정리하는 습관을 들이는 것이 좋습니다.

## 관련 모듈
- API 상세: [`network_api.md`](./network_api.md)
- rooms/channel의 저수준 흐름(부모 화면 관점): [`iframe_main.md`](./iframe_main.md)
- rooms/channel의 저수준 흐름(자식 화면 관점): [`iframe_child.md`](./iframe_child.md)
