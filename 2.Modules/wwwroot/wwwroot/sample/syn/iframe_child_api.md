# syn.$n API 참조 (rooms/channel - 자식 화면 관점)

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$n` |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 6056~6919번째 줄) |
| 예제 페이지 | `/sample/syn/iframe_child.html` |

## 메서드

### 채널 객체 `.bind(method, callback)`
- 설명: 상대(부모) 창이 `call()` 또는 `emit()`으로 보내는 `method` 이름에 대한 처리 함수를 등록합니다. 소스 위치: 약 6474~6489번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `method` | `string` | Y | 등록할 메서드 이름(예: `'request'`) |
| `callback` | `function` | Y | `call()`로 수신 시 `(transaction, params)`, `emit()`으로 수신 시 `(origin, params)` 형태로 호출됨 |

- 반환값: 채널 객체 자신(`this`, 체이닝 가능). 이미 등록된 `method`면 경고 로그 후 그대로 반환.
- 예시 (`iframe_child.js`)
```javascript
$this.prop.childrenChannel.bind('request', function (transaction, params) {
    alert('iframe_child request 수신: ' + JSON.stringify(params));
    return 'iframe_child 응답: ' + JSON.stringify(params); // 부모의 success(val)로 전달됨
});
```

### 트랜잭션 객체 (`bind`의 `call` 콜백 1번째 인자)
- 설명: `call()`로 수신된 요청 처리 중 응답을 제어하는 객체입니다. 소스 위치: 약 6269~6314번째 줄.
- 멤버

| 이름 | 설명 |
|---|---|
| `invoke(callbackName, value)` | 요청 측이 `params`에 넘긴 콜백 함수(`callbacks`)를 실행 |
| `error(error, message)` | 실패 응답 전송(요청 측 `error` 콜백 호출) |
| `complete(value)` | 성공 응답 전송(요청 측 `success` 콜백 호출) |
| `delayReturn(delay)` | `true`로 설정 시 콜백 반환값으로 자동 `complete()`하지 않고 비동기로 직접 `complete`/`error` 호출 가능 |
| `completed()` | 이미 응답을 보냈는지 여부 |

- 예시: 비동기 응답이 필요한 경우
```javascript
channel.bind('longRequest', function (transaction, params) {
    transaction.delayReturn(true);
    setTimeout(function () {
        transaction.complete('지연된 응답: ' + JSON.stringify(params));
    }, 1000);
});
```

### 채널 객체 `.emit({ method, params })`
- 설명: 상대에게 응답을 기대하지 않는 단방향 메시지를 전송합니다. 소스 위치: 약 6555~6561번째 줄.
- 매개변수

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `method` | `string` | Y | 상대에서 `bind`로 등록한 메서드 이름 |
| `params` | `any` | N | 전달할 데이터 |

- 반환값: 없음. `success`/`error` 콜백을 지정해도 무시됩니다(응답을 추적하지 않음).
- 예시 (`iframe_child.js`)
```javascript
$this.prop.childrenChannel.emit({
    method: 'response',
    params: ['response data']
});
```
