# syn.$k API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$k` (원본: `context.$keyboard`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 2153~2349번째 줄) |
| 예제 페이지 | `/sample/syn/keyboard.html` |
| 의존 모듈 | `syn.$l`(library, getElement/addEvent/random) |

## 속성
### `syn.$k.keyCodes`
- 타입: `Readonly<Record<string, number>>`
- 설명: `'backspace'`, `'enter'`, `'a'`, `'f1'` 등 키 이름 문자열과 브라우저 `keyCode` 숫자값의 매핑 테이블입니다. `Object.freeze`로 동결되어 있습니다.

### `syn.$k.keyNames`
- 타입: `Readonly<Record<string, string>>`
- 설명: `KeyboardEvent.code` 값(예: `'KeyA'`, `'ArrowLeft'`, `'Digit1'`)과 `keyCodes`에서 사용하는 키 이름 문자열의 매핑 테이블입니다. `Object.freeze`로 동결되어 있습니다.

### `syn.$k.targetEL`
- 타입: `HTMLElement | null`
- 설명: `setElement()`로 마지막으로 지정된 대상 노드입니다. 초기값은 `null`입니다.

### `syn.$k.elements`
- 타입: `Record<string, { keydown: object, keyup: object }>`
- 설명: `setElement()`로 이벤트가 등록된 노드의 `eventID`를 키로 하여, 각 노드별 `keydown`/`keyup` 콜백 맵을 저장하는 내부 상태입니다. 초기값은 빈 객체입니다.

## 메서드
### `syn.$k.setElement(el)`
- 설명: 지정한 노드를 키보드 단축키 수신 대상으로 설정합니다. 최초 호출 시 해당 노드에 `keydown`/`keyup` 리스너를 등록하고, `this.elements`에 콜백 저장소를 생성합니다. 이후 `addKeyCode`/`removeKeyCode`는 이 노드를 기준으로 동작합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 노드 또는 노드 id. |
- 반환값: `this` — 메서드 체이닝을 위해 `$keyboard` 자기 자신을 반환합니다. 유효한 노드가 아니면 대상 갱신 없이 그대로 반환합니다.
- 예시
  ```js
  syn.$k.setElement('myInput');
  ```

### `syn.$k.addKeyCode(keyType, keyCode, func)`
- 설명: 현재 `targetEL`에 등록된 콜백 맵에 `keyType`(`'keydown'` 또는 `'keyup'`)과 `keyCode`(숫자)에 대응하는 콜백 함수를 저장합니다. 콜백이 `false`를 반환하면 `preventDefault`/`stopPropagation`이 호출됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | keyType | `'keydown' \| 'keyup'` | Y | 대응할 이벤트 종류. |
  | keyCode | `number` | Y | `keyCodes` 테이블에서 조회한 키코드 숫자값. |
  | func | `function` | Y | 키 입력 시 실행할 콜백. `(evt) => ...` |
- 반환값: `this`
- 예시
  ```js
  syn.$k.setElement('myInput');
  syn.$k.addKeyCode('keydown', syn.$k.keyCodes.a, (evt) => {
      alert(evt.keyCode);
  });
  ```

### `syn.$k.removeKeyCode(keyType, keyCode)`
- 설명: 현재 `targetEL`에 등록된 `keyType`/`keyCode` 조합의 콜백을 삭제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | keyType | `'keydown' \| 'keyup'` | Y | 대응할 이벤트 종류. |
  | keyCode | `number` | Y | 삭제할 키코드 숫자값. |
- 반환값: `this`
- 예시
  ```js
  syn.$k.removeKeyCode('keydown', syn.$k.keyCodes.a);
  ```

### `syn.$k.getKeyCode(code)`
- 설명: 브라우저 표준 `KeyboardEvent.code` 값(예: `'KeyA'`)을 `keyNames` 테이블로 키 이름을 찾은 뒤, 다시 `keyCodes` 테이블에서 대응하는 숫자 코드로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | code | `string` | Y | `KeyboardEvent.code` 값(예: `'KeyA'`, `'Enter'`, `'ArrowLeft'`). |
- 반환값: `number | null` — 매핑되는 값이 없으면 `null`.
- 예시
  ```js
  const code = syn.$k.getKeyCode('KeyA'); // 65
  ```
