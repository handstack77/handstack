# API 참조

## 모듈 정보
- 전역 변수: `$object` (별도 `syn.$` alias 없음)
- 위치: `2.Modules/wwwroot/wwwroot/js/syn.js` 약 4165~4385번째 줄 (`$object.extend({...})`)
- 이 문서는 `extension_object_api.md`와 동일한 `$object` 모듈을 다룹니다. 두 문서는 같은 API 표면을 설명하므로 내용이 겹치는 것이 정상이며, `reflection.html`은 레거시 `$w.initializeScript` 등록 방식으로, `extension_object.html`은 최신 등록 방식으로 이 모듈을 시연합니다.

## 속성/메서드

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `getType` | `getType(val)` | 값의 타입을 문자열로 반환합니다 (`'null'`, `'array'`, `'date'`, `'element'`, `'object'` 등 세분화 포함). |
| `isDefined` | `isDefined(val)` | 값이 `undefined`가 아닌지 확인합니다. |
| `isNull` | `isNull(val)` | 값이 `null`인지 확인합니다. |
| `isArray` | `isArray(val)` | 값이 배열인지 확인합니다 (`Array.isArray`). |
| `isDate` | `isDate(val)` | 값이 유효한 `Date` 인스턴스인지 확인합니다. |
| `isString` | `isString(val)` | 값이 문자열 타입인지 확인합니다. |
| `isNumber` | `isNumber(val)` | 값이 `NaN`이 아닌 숫자 타입인지 확인합니다. |
| `isFunction` | `isFunction(val)` | 값이 함수 타입인지 확인합니다. |
| `isObject` | `isObject(val)` | 값이 `null`이 아닌 객체 타입인지 확인합니다. |
| `isObjectEmpty` | `isObjectEmpty(val)` | 값이 순수 객체(`{}`)이며 키가 없는(빈) 객체인지 확인합니다. |
| `isBoolean` | `isBoolean(val)` | 값이 boolean 이거나 `'TRUE'/'FALSE'/'T'/'F'/'Y'/'N'/'1'/'0'` 형태의 boolean 표현 문자열인지 확인합니다. |
| `isEmpty` | `isEmpty(val)` | `undefined`, `null`, `NaN`, 빈 문자열, 빈 배열, 빈 객체 등 "빈 값"인지 확인합니다. |
| `clone` | `clone(val, isNested = true)` | 객체/배열/`Date`/`HTMLElement`를 포함해 값의 사본을 반환합니다 (`isNested`가 `true`면 재귀적으로 복제). |

같은 모듈에 존재하지만 `reflection.html`에서는 시연하지 않고 `extension_object.html`에서 시연하는 메서드:

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `isNullOrUndefined` | `isNullOrUndefined(val)` | 값이 `undefined` 또는 `null`인지 확인합니다. |
| `toCSV` | `toCSV(obj, options = {})` | 객체(배열)를 CSV 문자열로 변환합니다. |
| `toParameterString` | `toParameterString(jsonObject)` | JSON 객체를 `@key:value;` 형태의 파라미터 문자열로 변환합니다. |
| `defaultValue` | `defaultValue(type)` | 타입 이름 문자열에 대응하는 기본값을 반환합니다. |
| `extend` | `extend(to, from, overwrite = true)` | 두 객체를 재귀적으로 병합합니다. |
| `excludeKeys` | `excludeKeys(sourceObject, keysToExclude)` | 지정한 키를 제외한 새 객체를 반환합니다. |
| `parseJsonValue` | `parseJsonValue(value, jsonType)` | 지정한 JSON 타입에 맞게 값을 파싱/변환합니다. |

> 참고: 과거 버전의 `reflection.js`에는 `$object.method(...)`를 이용해 동적으로 메서드를 추가하는 데모가 있었으나, 현재 `syn.js`의 `$object`에는 그런 `method` 함수가 존재하지 않아 본 갱신 작업에서 제거했습니다.
