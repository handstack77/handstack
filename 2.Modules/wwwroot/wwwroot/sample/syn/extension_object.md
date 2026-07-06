# Object 확장 사용법 ($object)

## 개요
`$object`는 일반 객체를 다루기 위한 확장 함수를 제공합니다. 값의 타입 판별(`isString`, `isNumber`, `isDate` 등), 깊은 복사, 객체 병합, CSV/파라미터 문자열 변환, JSON 값 캐스팅 등 여러 모듈에서 공통으로 사용하는 유틸리티가 모여 있습니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `$object`로 즉시 사용할 수 있습니다. (`syn.` 접두사 없이 전역 변수로 노출됨에 유의)

## 빠른 시작
```js
$object.isString('hello');   // true
$object.clone({ a: 1 });     // { a: 1 } (새 객체)
```

## 주요 시나리오
### 값의 타입 판별
`isNullOrUndefined`, `isDefined`, `isNull`, `isArray`, `isDate`, `isString`, `isNumber`, `isFunction`, `isObject`, `isObjectEmpty`, `isBoolean`, `isEmpty` 등으로 값의 타입과 상태를 판별합니다.
```js
$object.isEmpty([]);        // true
$object.isBoolean('Y');     // true ('TRUE'/'FALSE'/'T'/'F'/'Y'/'N'/'1'/'0' 문자열도 인식)
```

### 깊은 복사와 객체 병합
`clone(val, isNested)`은 객체/배열/Date/HTMLElement를 복사하고, `extend(to, from, overwrite)`는 중첩 객체까지 재귀적으로 병합합니다.
```js
const copy = $object.clone({ a: { b: 1 } });
$object.extend({ a: 1 }, { a: 2, b: 3 }); // { a: 2, b: 3 }
```

### 객체를 CSV/파라미터 문자열로 변환
`toCSV(obj, options)`는 중첩 객체를 평탄화하여 CSV 문자열로, `toParameterString(jsonObject)`는 `@key:value;` 형태의 파라미터 문자열로 변환합니다.
```js
$object.toCSV([{ a: 1, b: 2 }], { delimiter: ';' });
$object.toParameterString({ name: 'hong', age: 20 });
```

### 타입 기본값과 JSON 값 캐스팅
`defaultValue(type)`로 타입별 기본값을 얻고, `parseJsonValue(value, jsonType)`로 문자열 값을 지정한 타입으로 캐스팅합니다.
```js
$object.defaultValue('number');            // 0
$object.parseJsonValue('123', 'integer');  // 123
```

### 특정 키를 제외한 객체 만들기
`excludeKeys(sourceObject, keysToExclude)`로 민감한 필드나 불필요한 속성을 제외한 새 객체를 만들 수 있습니다.
```js
$object.excludeKeys({ a: 1, password: '*' }, ['password']);
```

## 실전 예제 페이지
`/sample/syn/extension_object.html` 예제에서 다음 항목을 실습할 수 있습니다.
- `$object.version` 속성 조회
- `isNullOrUndefined()`, `toCSV()`, `toParameterString()`, `getType()`, `defaultValue()`
- `isDefined()`, `isNull()`, `isArray()`, `isDate()`, `isString()`, `isNumber()`, `isFunction()`, `isObject()`, `isObjectEmpty()`, `isBoolean()`
- `isEmpty()`, `clone()`, `extend()`, `excludeKeys()`, `parseJsonValue()`

## 주의 사항
- `clone(val, isNested)`은 `isNested`가 `false`이면 얕은 복사(1단계)만 수행합니다. 중첩 객체까지 완전히 분리하려면 기본값(`true`)을 그대로 사용하세요.
- `extend(to, from, overwrite)`는 `overwrite`가 `false`이면 `to`에 이미 존재하는 키는 덮어쓰지 않습니다.
- `isBoolean()`은 실제 `boolean` 타입 외에도 `'TRUE'/'FALSE'/'T'/'F'/'Y'/'N'/'1'/'0'` 문자열을 boolean으로 인식할 수 있는지 여부를 판별하는 함수이지 boolean 값 자체를 반환하는 변환 함수가 아닙니다.
- `toCSV()`는 두 번째 인자로 배열이 아닌 `{ scopechar, delimiter, newline }` 형태의 옵션 객체를 받습니다(과거 예제처럼 배열/구분자를 개별 인자로 넘기지 않도록 주의).

## 관련 모듈
- API 상세: [`extension_object_api.md`](./extension_object_api.md)
