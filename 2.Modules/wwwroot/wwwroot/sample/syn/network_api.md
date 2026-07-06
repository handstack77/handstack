# syn.$n API 참조 (rooms 전역 편의 메서드 / SSE / WebSocket)

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$n` |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 6056~6919번째 줄) |
| 예제 페이지 | `/sample/syn/network.html` |

이 문서에서 다루지 않는 `rooms.connect()`, 채널 객체의 `bind()`/`.call()`/`.emit()`은 [`iframe_main_api.md`](./iframe_main_api.md) / [`iframe_child_api.md`](./iframe_child_api.md)를 참고하세요.

## 메서드

### `syn.$n.findChannel(channelID)`
- 설명: `scope`가 `channelID`와 일치하는, 이미 연결된 채널을 `$network.connections`에서 찾습니다. 소스 위치: 약 6597~6600번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `channelID` | `string` | Y | `rooms.connect({ scope })`에 지정했던 채널 식별자 |

- 반환값: 채널 객체 또는 `undefined`
- 예시
```javascript
var connection = syn.$n.findChannel('network-demo');
```

### `syn.$n.call(channelID, evt, params)`
- 설명: `channelID`로 채널을 찾아 `evt` 메서드를 호출합니다. 성공/실패 시 `connection.options.debugOutput`이 `true`이면 `syn.$l.eventLog`로 로그만 남기는 내장 콜백을 사용합니다(커스텀 `success`/`error` 콜백이 필요하면 채널 객체의 `.call()`을 직접 사용). 소스 위치: 약 6602~6624번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `channelID` | `string` | Y | 대상 채널 식별자(scope) |
| `evt` | `string` | Y | 상대에서 `bind`로 등록한 메서드 이름 |
| `params` | `any` | N | 전달할 데이터 |

- 반환값: 없음. 채널을 찾지 못하면 경고 로그만 남기고 종료합니다.
- 예시
```javascript
syn.$n.call('network-demo', 'ping', { message: 'hello' });
```

### `syn.$n.broadCast(evt, params)`
- 설명: 현재 화면에 연결된 모든 채널(`$network.connections`)에 대해 동일한 `evt`를 호출합니다. 소스 위치: 약 6626~6644번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `evt` | `string` | Y | 각 채널에서 `bind`로 등록한 메서드 이름 |
| `params` | `any` | N | 전달할 데이터(모든 채널에 동일하게 전달) |

- 반환값: 없음
- 예시
```javascript
syn.$n.broadCast('ping', { message: 'to all channels' });
```

### `syn.$n.emit(evt, params)`
- 설명: `syn.$n.myChannelID`에 해당하는 채널을 찾아 응답을 기대하지 않는 메시지를 전송합니다. `myChannelID`가 설정되지 않았거나 해당 채널이 없으면 경고 로그 후 종료합니다. 소스 위치: 약 6646~6667번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `evt` | `string` | Y | 상대에서 `bind`로 등록한 메서드 이름 |
| `params` | `any` | N | 전달할 데이터 |

- 반환값: 없음
- 예시
```javascript
syn.$n.myChannelID = 'network-demo'; // 보통은 URL의 channelID 쿼리 문자열로 자동 설정됨
syn.$n.emit('note', { message: 'hello parent' });
```

### `syn.$n.startSse(id, url, eventHandlers, options = {})`
- 설명: `EventSource`로 SSE(Server-Sent Events) 연결을 생성합니다. 이미 같은 `id`로 연결이 있으면 기존 연결을 그대로 반환합니다. 소스 위치: 약 6687~6739번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | `string` | Y | 연결을 구분하는 고유 식별자 |
| `url` | `string` | Y | SSE 엔드포인트 주소 |
| `eventHandlers` | `object` | N | 이벤트 이름별 핸들러(`open`, `message`, `error` 기본 제공, 서버 정의 커스텀 이벤트 이름도 등록 가능) |
| `options.withCredentials` | `boolean` | N | 기본값 `false` |

- 반환값: `EventSource` 인스턴스 또는 브라우저 미지원/생성 실패 시 `null`
- 예시
```javascript
syn.$n.startSse('realtime-updates', '/api/events', {
    open() { console.log('SSE 연결 성공!'); },
    message(evt) { console.log('일반 메시지:', JSON.parse(evt.data)); },
    heartbeat(evt) { console.log('서버 상태:', evt.data, '마지막 이벤트 ID:', evt.lastEventId); }
});
```

### `syn.$n.stopSse(id)`
- 설명: `id`로 등록된 SSE 연결을 닫고 목록에서 제거합니다. 소스 위치: 약 6742~6752번째 줄.
- 매개변수: `id` (`string`, 필수)
- 반환값: 연결을 찾아 닫았으면 `true`, 없으면 `false`
- 예시
```javascript
syn.$n.stopSse('realtime-updates');
```

### `syn.$n.stopAllSse()`
- 설명: 등록된 모든 SSE 연결을 순회하며 `stopSse`를 호출합니다. 소스 위치: 약 6754~6758번째 줄.
- 매개변수: 없음
- 반환값: 없음

### `syn.$n.getSseConnection(id)`
- 설명: `id`로 등록된 `EventSource` 인스턴스를 반환합니다. 소스 위치: 약 6760~6762번째 줄.
- 매개변수: `id` (`string`, 필수)
- 반환값: `EventSource` 인스턴스 또는 `undefined`
- 예시
```javascript
var connection = syn.$n.getSseConnection('realtime-updates');
console.log(connection?.readyState);
```

### `syn.$n.startSocket(id, url, eventHandlers = {}, options = {})`
- 설명: `WebSocket` 연결을 생성합니다. 이미 같은 `id`로 연결이 있으면 기존 소켓을 그대로 반환합니다. 소스 위치: 약 6785~6871번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | `string` | Y | 연결을 구분하는 고유 식별자 |
| `url` | `string` | Y | WebSocket 엔드포인트 주소(`ws://` 또는 `wss://`) |
| `eventHandlers.open` | `function(event)` | N | 연결 성공 시 호출 |
| `eventHandlers.message` | `function(data, event)` | N | 메시지 수신 시 호출. `options.json`이 `true`(기본값)이면 `data`는 JSON 파싱된 값 |
| `eventHandlers.close` | `function(event)` | N | 연결 종료 시 호출 |
| `eventHandlers.error` | `function(event)` | N | 오류 발생 시 호출 |
| `options.autoReconnect` | `boolean` | N | 기본값 `true`. 비정상 종료 시 자동 재연결 |
| `options.reconnectInterval` | `number` | N | 기본값 `3000`(ms) |
| `options.json` | `boolean` | N | 기본값 `true`. 수신 메시지를 JSON으로 파싱 시도 |

- 반환값: `WebSocket` 인스턴스 또는 브라우저 미지원 시 `null`
- 예시
```javascript
syn.$n.startSocket('chat', 'wss://example.com/chat', {
    open() { syn.$n.sendSocketMessage('chat', { type: 'join', user: 'alex' }); },
    message(data) { console.log(data); },
    close(evt) { console.log('연결 끊김. 코드:', evt.code); }
});
```

### `syn.$n.sendSocketMessage(id, message)`
- 설명: `id`로 연결된 WebSocket이 열려 있을 때(`readyState === WebSocket.OPEN`) 메시지를 전송합니다. `options.json`이 `true`이고 `message`가 객체이면 `JSON.stringify`로 직렬화합니다. 소스 위치: 약 6874~6890번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | `string` | Y | 대상 연결 식별자 |
| `message` | `string \| object` | Y | 전송할 메시지 |

- 반환값: 전송 성공 시 `true`, 연결이 없거나 열려 있지 않거나 전송 실패 시 `false`
- 예시
```javascript
syn.$n.sendSocketMessage('chat', { type: 'message', text: 'hello' });
```

### `syn.$n.stopSocket(id)`
- 설명: `id`로 등록된 WebSocket 연결을 의도적으로 종료합니다(자동 재연결 타이머도 함께 정리). 소스 위치: 약 6893~6906번째 줄.
- 매개변수: `id` (`string`, 필수)
- 반환값: 없음

### `syn.$n.stopAllSockets()`
- 설명: 등록된 모든 WebSocket 연결을 순회하며 `stopSocket`을 호출합니다. 소스 위치: 약 6908~6910번째 줄.
- 매개변수: 없음
- 반환값: 없음

### `syn.$n.getSocket(id)`
- 설명: `id`로 등록된 원시 `WebSocket` 인스턴스를 반환합니다. 소스 위치: 약 6912~6914번째 줄.
- 매개변수: `id` (`string`, 필수)
- 반환값: `WebSocket` 인스턴스 또는 `undefined`
- 예시
```javascript
var socket = syn.$n.getSocket('chat');
console.log(socket?.readyState);
```
