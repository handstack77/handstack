# syn.$v API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$v` (원본: `context.$validation`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 2351~2679번째 줄) |
| 예제 페이지 | `/sample/syn/validate.html` |
| 의존 모듈 | `syn.$l`(`getElement`, `eventLog`), `syn.$string`(`isNullOrEmpty`, `isNumber`, `toNumber`), `context.$this`(사용자 정의 검증 함수 조회용) |

## 속성

### `syn.$v.isContinue`
- 타입: `boolean`
- 설명: 검증 도중 실패가 발생해도 나머지 규칙을 계속 검사할지(true, 기본값) 아니면 첫 실패에서 즉시 중단할지(false) 여부입니다.

### `syn.$v.messages`
- 타입: `string[]`
- 설명: 검증 실패 시 등록된 message들이 누적되는 배열입니다. `toMessages()` 호출 시 비워집니다.

### `syn.$v.targetEL`
- 타입: `HTMLElement | null`
- 설명: `setElement()`로 마지막에 설정된 대상 노드입니다.

### `syn.$v.elements`
- 타입: `object`
- 설명: 노드 id를 key로, `{ pattern: {}, range: {}, custom: {} }` 형태의 검증 규칙 모음을 value로 갖는 맵입니다.

### `syn.$v.roles`
- 타입: `object` (`Object.freeze`)
- 설명: `Root`(0), `Administrator`(100), `Master`(200), `Architect`(300), `Manager`(400), `BusinessOwner`(500), `Operator`(600), `Developer`(700), `Designer`(800), `User`(900) 권한 등급 상수입니다.

### `syn.$v.valueType`
- 타입: `object` (`Object.freeze`)
- 설명: `valid`, `valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch` 값 검증 상태 코드입니다.

### `syn.$v.validType`
- 타입: `object` (`Object.freeze`)
- 설명: `required`(0), `pattern`(1), `range`(2), `custom`(3) 검증 종류 코드입니다.

### `syn.$v.regexs`
- 타입: `object` (`Object.freeze`)
- 설명: `pattern()` 검증에서 바로 사용할 수 있는 사전 정의된 정규식 모음입니다. (`alphabet`, `juminNo`, `numeric`, `email`, `url`, `ipAddress`, `date`, `mobilePhone`, `seoulPhone`, `areaPhone`, `onesPhone`, `float`, `isoDate`)

## 메서드

### `syn.$v.initializeValidObject(el)`
- 설명: 지정한 DOM 엘리먼트의 id에 대해 `elements` 맵에 `{ pattern: {}, range: {}, custom: {} }` 항목이 없으면 생성합니다. `setElement()` 내부에서 자동으로 호출되는 헬퍼로, 보통 직접 호출할 필요는 없습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | HTMLElement | Y | id를 가진 DOM 엘리먼트 |
- 반환값: `object` — 해당 노드의 검증 규칙 객체
- 예시
  ```js
  const el = document.getElementById('txt_userName');
  const validObject = syn.$v.initializeValidObject(el);
  ```

### `syn.$v.setElement(el)`
- 설명: 유효성 검사 대상 노드를 `targetEL`로 설정하고, 해당 노드의 검증 규칙 저장 공간을 초기화합니다. `required`/`pattern`/`range`/`custom` 내부에서 자동으로 호출됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | string \| HTMLElement | Y | 노드 id 또는 DOM 엘리먼트 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.setElement('txt_userName');
  ```

### `syn.$v.required(el, isRequired, message)`
- 설명: 지정한 노드에 필수 입력 검증 규칙을 설정합니다. `message`가 없으면 로그만 남기고 아무 작업도 하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | string \| HTMLElement | Y | 노드 id 또는 DOM 엘리먼트 |
  | isRequired | boolean | N | 필수 여부, 기본값 true |
  | message | string | Y | 검증 실패 시 표시할 메시지 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.required('txt_userName', true, '이름을 입력해 주세요.');
  ```

### `syn.$v.pattern(el, validID, options)`
- 설명: 지정한 노드에 정규식 패턴 검증 규칙을 추가합니다. `options.expr`와 `options.message`가 없으면 로그만 남기고 등록하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | string \| HTMLElement | Y | 노드 id 또는 DOM 엘리먼트 |
  | validID | string | Y | 규칙 식별자 (동일 노드에 여러 pattern 규칙을 등록할 때 구분용) |
  | options.expr | RegExp | Y | 검사할 정규식 |
  | options.message | string | Y | 검증 실패 시 표시할 메시지 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.pattern('txt_email', 'email', { expr: syn.$v.regexs.email, message: '이메일 형식이 아닙니다.' });
  ```

### `syn.$v.range(el, validID, options)`
- 설명: 지정한 노드에 숫자 범위 검증 규칙을 추가합니다. `options.min`, `options.max`가 숫자가 아니거나 연산자/메시지가 없으면 등록하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | string \| HTMLElement | Y | 노드 id 또는 DOM 엘리먼트 |
  | validID | string | Y | 규칙 식별자 |
  | options.min | number | Y | 최소값 |
  | options.max | number | Y | 최대값 |
  | options.minOperator | string | Y | 최소값 비교 연산자 (`>`, `>=`, `<`, `<=`, `==`, `!=`) |
  | options.maxOperator | string | Y | 최대값 비교 연산자 (`>`, `>=`, `<`, `<=`, `==`, `!=`) |
  | options.message | string | Y | 검증 실패 시 표시할 메시지 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.range('txt_age', 'ageRange', { min: 0, max: 100, minOperator: '<', maxOperator: '>', message: '1 ~ 100 사이 값을 입력해 주세요.' });
  ```

### `syn.$v.custom(el, validID, options)`
- 설명: 지정한 노드에 사용자 정의 함수 기반 검증 규칙을 추가합니다. `options.functionName`, `options.message`가 없으면 등록하지 않습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | string \| HTMLElement | Y | 노드 id 또는 DOM 엘리먼트 |
  | validID | string | Y | 규칙 식별자 |
  | options.functionName | string | Y | `$this.method` 또는 전역에 정의된 검증 함수 이름 |
  | options.message | string | Y | 검증 실패 시 표시할 메시지 |
  | options.* | any | N | 검증 함수에 전달할 추가 매개변수 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.custom('txt_custom', 'notEmpty', { functionName: 'customValidation', message: '검사에 실패했습니다.' });
  ```

### `syn.$v.removeValidate(validType, validID)`
- 설명: 현재 `targetEL`(마지막으로 `setElement()`한 노드)에서 지정한 종류(`pattern`/`range`/`custom`)의 규칙 하나를 제거합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | validType | string | Y | `'pattern'`, `'range'`, `'custom'` 중 하나 |
  | validID | string | Y | 제거할 규칙 식별자 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.setElement('txt_email');
  syn.$v.removeValidate('pattern', 'email');
  ```

### `syn.$v.remove(validID)`
- 설명: 현재 `targetEL`에서 `pattern`/`range`/`custom` 전체 종류를 대상으로 지정한 validID의 규칙을 모두 제거합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | validID | string | Y | 제거할 규칙 식별자 |
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.setElement('txt_age');
  syn.$v.remove('numeric');
  ```

### `syn.$v.clear()`
- 설명: `isContinue`를 true로, `messages`를 빈 배열로, `targetEL`을 null로, `elements`를 빈 객체로 초기화하여 모든 검증 상태를 리셋합니다.
- 매개변수: 없음
- 반환값: `syn.$v` — 메서드 체이닝을 위한 자기 자신
- 예시
  ```js
  syn.$v.clear();
  ```

### `syn.$v.validateControl(el)`
- 설명: 단일 노드에 등록된 required/pattern/range/custom 규칙을 순서대로 검사합니다. 실패한 규칙의 메시지는 `messages`에 누적됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | string \| HTMLElement | Y | 노드 id 또는 DOM 엘리먼트 |
- 반환값: `boolean` — 모든 규칙 통과 여부 (엘리먼트를 찾지 못하면 `true`)
- 예시
  ```js
  const isValid = syn.$v.validateControl('txt_userName');
  ```

### `syn.$v.validateControls(els)`
- 설명: 여러 노드를 한 번에 검사합니다. `isContinue`가 false이면 첫 실패 노드에서 검사를 중단합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | els | HTMLElement[] \| HTMLElement | Y | 노드 배열 또는 단일 노드 |
- 반환값: `boolean` — 모든 노드의 검증 통과 여부
- 예시
  ```js
  const isValid = syn.$v.validateControls(syn.$l.get('txt_userName', 'txt_email'));
  ```

### `syn.$v.validateForm()`
- 설명: `elements`에 등록된 모든 노드에 대해 `validateControl()`을 실행합니다.
- 매개변수: 없음
- 반환값: `boolean` — 모든 노드의 검증 통과 여부
- 예시
  ```js
  const isValid = syn.$v.validateForm();
  ```

### `syn.$v.toMessages()`
- 설명: 누적된 `messages` 배열을 줄바꿈(`\n`)으로 연결한 문자열로 반환하고, 내부 `messages` 배열을 비웁니다.
- 매개변수: 없음
- 반환값: `string` — 연결된 오류 메시지 문자열
- 예시
  ```js
  if (syn.$v.validateForm() == false) {
      alert(syn.$v.toMessages());
  }
  ```

### `syn.$v.getRoleValue(roleNames, isHighLow)`
- 설명: 역할 이름(들)을 `roles`에 정의된 값으로 변환합니다. 여러 개를 전달하면 `isHighLow`에 따라 최소값 또는 최대값을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | roleNames | string \| string[] | Y | 역할 이름 또는 이름 배열 |
  | isHighLow | boolean | N | true(기본값)면 최소값, false면 최대값 반환 |
- 반환값: `number` — 역할 값 (일치하는 이름이 없으면 `-1`)
- 예시
  ```js
  const value = syn.$v.getRoleValue('Manager'); // 400
  ```

### `syn.$v.getRoleName(roleValues, isHighLow)`
- 설명: 역할 값(들)을 `roles`에 정의된 이름으로 변환합니다. 여러 개를 전달하면 `isHighLow`에 따라 최소값 또는 최대값에 해당하는 이름을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | roleValues | number \| string \| Array | Y | 역할 값 또는 값 배열 |
  | isHighLow | boolean | N | true(기본값)면 최소값, false면 최대값 기준으로 이름 반환 |
- 반환값: `string | null` — 역할 이름 (일치하는 값이 없으면 `null`)
- 예시
  ```js
  const name = syn.$v.getRoleName(400); // 'Manager'
  ```
