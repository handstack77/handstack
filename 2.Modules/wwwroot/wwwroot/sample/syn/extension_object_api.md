# $object API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `$object` (syn.$ 접두사 없음, 전역 변수) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 4165~4385번째 줄) |
| 예제 페이지 | `/sample/syn/extension_object.html` |
| 의존 모듈 | `$string`(`toValue`, `toDynamic`, `toBoolean`) |

## 메서드

### `$object.isNullOrUndefined(val)`
- 설명: 값이 `undefined` 또는 `null`인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isNullOrUndefined(null); // true
  ```

### `$object.toCSV(obj, options = {})`
- 설명: 객체 또는 객체 배열을 중첩 속성까지 평탄화하여 CSV 문자열로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | obj | `object` \| `Array<object>` | Y | 변환할 객체 또는 객체 배열 |
  | options | `object` | N | `{ scopechar = '/', delimiter = ',', newline = '\n' }` |
- 반환값: `string` \| `null` — `obj`가 객체가 아니면 `null`
- 예시
  ```js
  const result = $object.toCSV([{ a: 1, b: 2 }, { a: 3, b: 4 }], { delimiter: ';' });
  ```

### `$object.toParameterString(jsonObject)`
- 설명: JSON 객체를 `@key:value;` 형태의 파라미터 문자열로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | jsonObject | `object` | Y | 변환할 객체 |
- 반환값: `string`
- 예시
  ```js
  const result = $object.toParameterString({ symbol: 'hello', price: 12345 });
  ```

### `$object.getType(val)`
- 설명: 값의 타입을 문자열로 반환합니다(`'null'`, `'array'`, `'date'`, `'element'`, `'object'`와 기본 `typeof` 결과를 포함).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `string`
- 예시
  ```js
  const result = $object.getType(new Date()); // 'date'
  ```

### `$object.defaultValue(type)`
- 설명: 지정한 타입 이름의 기본값을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | type | `string` | Y | `'boolean'`, `'function'`, `'null'`, `'number'`/`'numeric'`/`'int'`, `'object'`, `'date'`/`'datetime'`, `'string'`, `'symbol'`, `'undefined'`, `'array'` 중 하나 |
- 반환값: `any` — 알 수 없는 타입은 빈 문자열(`''`)
- 예시
  ```js
  const result = $object.defaultValue('number'); // 0
  ```

### `$object.isDefined(val)`
- 설명: 값이 `undefined`가 아닌지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isDefined(undefined); // false
  ```

### `$object.isNull(val)`
- 설명: 값이 `null`인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isNull(null); // true
  ```

### `$object.isArray(val)`
- 설명: 값이 배열인지 확인합니다(`Array.isArray` 래핑).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isArray([]); // true
  ```

### `$object.isDate(val)`
- 설명: 값이 유효한 `Date` 인스턴스인지 확인합니다(Invalid Date는 `false`).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isDate(new Date()); // true
  ```

### `$object.isString(val)`
- 설명: 값이 문자열 타입인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isString('hello'); // true
  ```

### `$object.isNumber(val)`
- 설명: 값이 `NaN`이 아닌 숫자 타입인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isNumber(12345); // true
  ```

### `$object.isFunction(val)`
- 설명: 값이 함수 타입인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isFunction(() => {}); // true
  ```

### `$object.isObject(val)`
- 설명: 값이 `null`이 아닌 객체 타입인지 확인합니다(배열, Date 등도 포함).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isObject({}); // true
  ```

### `$object.isObjectEmpty(val)`
- 설명: 값이 순수 객체(plain object)이면서 속성이 하나도 없는지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isObjectEmpty({}); // true
  ```

### `$object.isBoolean(val)`
- 설명: 값이 boolean 타입이거나, boolean으로 해석 가능한 문자열(`'TRUE'`, `'FALSE'`, `'T'`, `'F'`, `'Y'`, `'N'`, `'1'`, `'0'`, 대소문자 무관)인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isBoolean('Y'); // true
  ```

### `$object.isEmpty(val)`
- 설명: 값이 `undefined`/`null`/`NaN`/공백 문자열/빈 배열/빈 순수 객체 중 하나인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $object.isEmpty([]); // true
  ```

### `$object.clone(val, isNested = true)`
- 설명: 객체, 배열, `Date`, `HTMLElement`를 복사합니다. `isNested`가 `true`이면 중첩 구조까지 재귀적으로 복사(깊은 복사)하고, `false`이면 최상위 속성만 복사(얕은 복사)합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 복사할 값 |
  | isNested | `boolean` | N | 재귀(깊은) 복사 여부(기본값 true) |
- 반환값: `any` — 객체가 아니면 원본 값을 그대로 반환
- 예시
  ```js
  const result = $object.clone({ a: { b: 1 } });
  ```

### `$object.extend(to, from, overwrite = true)`
- 설명: `from` 객체의 속성을 `to` 객체에 재귀적으로 병합합니다. 중첩 객체는 재귀적으로 병합되고, 배열/Date/HTMLElement는 병합 대상에서 제외되어 값 자체가 복제되어 대입됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | to | `object` | Y | 병합 대상 객체 |
  | from | `object` | Y | 병합할 원본 객체 |
  | overwrite | `boolean` | N | 기존 키를 덮어쓸지 여부(기본값 true) |
- 반환값: `object` — 병합된 `to` 객체
- 예시
  ```js
  const result = $object.extend({ a: 1 }, { a: 2, b: 3 }); // { a: 2, b: 3 }
  ```

### `$object.excludeKeys(sourceObject, keysToExclude)`
- 설명: `sourceObject`에서 `keysToExclude`에 포함된 키를 제외한 나머지 속성만으로 새 객체를 만듭니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | sourceObject | `object` | Y | 원본 객체 |
  | keysToExclude | `Array<string>` | Y | 제외할 키 목록 |
- 반환값: `object`
- 예시
  ```js
  const result = $object.excludeKeys({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }
  ```

### `$object.parseJsonValue(value, jsonType)`
- 설명: 문자열 등의 값을 지정한 JSON 타입으로 캐스팅합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | value | `any` | Y | 변환할 값 |
  | jsonType | `string` | Y | `'integer'`, `'number'`, `'boolean'`, `'object'`, `'array'`, `'string'`(기본값) |
- 반환값: `any` — `value`가 `null`/`undefined`이면 그대로 반환
- 예시
  ```js
  const result = $object.parseJsonValue('123', 'integer'); // 123
  ```
