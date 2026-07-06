# syn.$n API 참조 (rooms/channel - 부모 화면 관점)

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$n` |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 6056~6919번째 줄) |
| 예제 페이지 | `/sample/syn/iframe_main.html` |

## 메서드

### `syn.$n.rooms.connect(options)`
- 설명: 다른 창(주로 `<iframe>`의 `contentWindow`)과 `postMessage` 기반 양방향 채널을 생성합니다. 소스 위치: 약 6197~6592번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `options.window` | `Window` | Y | 채널을 연결할 대상 창(예: `iframe.contentWindow`, `window.parent`) |
| `options.origin` | `string` | N | 허용할 origin. 기본값 `'*'`. `'*'`가 아니면 `http(s)://host[:port]` 형식이어야 함 |
| `options.scope` | `string` | N | 채널 식별자(`channelID`). 지정하지 않으면 랜덤 값 사용. `'::'` 포함 불가 |
| `options.debugOutput` | `boolean` | N | `true`이면 채널 송수신 로그를 `syn.$l.eventLog`로 출력 |
| `options.onReady` | `function(boundMessage)` | N | 상대와 핸드셰이크(`__ready`)가 끝나면 호출 |
| `options.gotMessageObserver` | `function(origin, data)` | N | 모든 수신 메시지에 대해 호출되는 관찰자 |
| `options.postMessageObserver` | `function(origin, message)` | N | 모든 송신 메시지에 대해 호출되는 관찰자 |

- 반환값: 채널 객체(`boundMessage`). 주요 멤버
  - `bind(method, callback)`: `method`로 들어오는 메시지에 대한 핸들러 등록. `emit`으로 온 메시지는 `callback(origin, params)`, `call`로 온 메시지는 `callback(transaction, params)` 형태로 호출됨(`transaction`은 `invoke`/`error`/`complete`/`delayReturn` 보유)
  - `unbind(method)`: 등록된 핸들러 해제
  - `call({ method, params, success, error, timeout })`: 상대의 `method` 핸들러를 호출하고 응답을 `success`/`error`로 수신
  - `emit({ method, params })`: 상대에게 응답을 기대하지 않는 메시지 전송(콜백 없음)
  - `destroy()`: 채널 연결 해제 및 등록된 리소스 정리
- 예시
```javascript
var connection = syn.$n.rooms.connect({
    debugOutput: true,
    window: syn.$l.get('ifmChildren').contentWindow,
    origin: '*',
    scope: 'channelID'
});

connection.bind('response', function (origin, params) {
    console.log('자식으로부터 응답 수신', params);
});
```

### `syn.$n.findChannel(channelID)`
- 설명: `scope`가 `channelID`와 일치하는 연결된 채널을 `$network.connections`에서 찾습니다. 소스 위치: 약 6597~6600번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `channelID` | `string` | Y | `rooms.connect({ scope })`에 지정했던 채널 식별자 |

- 반환값: 채널 객체(`boundMessage`) 또는 `undefined`(없으면)
- 예시
```javascript
var connection = syn.$n.findChannel('channelID');
if (connection == undefined) {
    // 아직 연결되지 않음 -> rooms.connect 필요
}
```

### 채널 객체 `.call({ method, params, success, error, timeout })`
- 설명: `rooms.connect()`가 반환한 채널 객체를 통해 상대 창에 등록된(`bind`) 메서드를 호출하고 결과를 비동기로 받습니다. 소스 위치: 약 6490~6554번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `method` | `string` | Y | 상대에서 `bind`로 등록한 메서드 이름 |
| `params` | `any` | N | 전달할 데이터(JSON 직렬화 가능해야 함) |
| `success` | `function(result)` | Y | 상대 처리 결과 수신 콜백 |
| `error` | `function(error, message)` | N | 실패 시 콜백 |
| `timeout` | `number` | N | 지정 시(ms) 응답이 없으면 `timeout_error`로 `error` 호출 |

- 반환값: 없음(콜백 기반)
- 예시: [`iframe_main.js`](./iframe_main.js)의 `btnParent2Children_click()` 참고
```javascript
connection.call({
    method: 'request',
    params: ['request data'],
    error(error, message) {
        alert('iframe_main request ERROR: ' + error + ' (' + message + ')');
    },
    success(val) {
        alert('iframe_main request function returns: ' + val);
    }
});
```
