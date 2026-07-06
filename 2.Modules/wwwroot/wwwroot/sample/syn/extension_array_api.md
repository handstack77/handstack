# $array API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `$array` (전역, `syn.$array` 별칭 없음) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 3878~4039번째 줄) |
| 예제 페이지 | `/sample/syn/extension_array.html` |
| 의존 모듈 | `$string` (`ranks()` 내부에서 `context.$string.toNumber()` 사용) |

## 메서드

### `$array.distinct(arr)`
- 설명: 배열에서 중복된 항목을 제거한 새 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 대상 배열 |
- 반환값: `Array` — 중복이 제거된 배열. 배열이 아니면 빈 배열을 반환합니다.
- 예시
  ```js
  const result = $array.distinct(['Apple', 'Banana', 'Banana', 'Mango']);
  ```

### `$array.sort(arr, ascending = true)`
- 설명: 배열 항목을 오름차순 또는 내림차순으로 정렬한 새 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 대상 배열 |
  | ascending | boolean | N | true면 오름차순, false면 내림차순(기본값 true) |
- 반환값: `Array` — 정렬된 배열
- 예시
  ```js
  const result = $array.sort(['Banana', 'Apple', 'Mango'], false);
  ```

### `$array.objectSort(arr, prop, ascending = true)`
- 설명: 객체 배열을 지정한 속성값 기준으로 정렬한 새 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array\<Object\> | Y | 대상 객체 배열 |
  | prop | string | Y | 정렬 기준이 되는 속성명 |
  | ascending | boolean | N | true면 오름차순, false면 내림차순(기본값 true) |
- 반환값: `Array<Object>` — 정렬된 객체 배열
- 예시
  ```js
  const result = $array.objectSort([{ name: 'Apple', price: 10 }, { name: 'Banana', price: 5 }], 'price', true);
  ```

### `$array.groupBy(data, predicate)`
- 설명: 배열 항목을 지정한 속성명 또는 함수의 반환값 기준으로 그룹화한 객체를 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | data | Array | Y | 대상 배열 |
  | predicate | string \| Function | Y | 그룹 키로 사용할 속성명 또는 `(item) => key` 함수 |
- 반환값: `Object` — 그룹 키를 속성으로 갖고 값은 해당 그룹에 속한 항목 배열인 객체
- 예시
  ```js
  const result = $array.groupBy([{ name: 'Apple', price: 10 }, { name: 'Banana', price: 5 }], ({ price }) => price <= 5 ? 'buy' : 'not buy');
  ```

### `$array.shuffle(arr)`
- 설명: 배열 항목의 순서를 무작위로 섞은 새 배열을 반환합니다(Fisher–Yates 셔플).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 대상 배열 |
- 반환값: `Array` — 순서가 섞인 배열
- 예시
  ```js
  const result = $array.shuffle([0, 1, 2, 3, 4, 5]);
  ```

### `$array.addAt(arr, index, val)`
- 설명: 지정한 위치에 값을 추가한 새 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 대상 배열 |
  | index | number | Y | 삽입할 위치(범위를 벗어나면 0 또는 배열 길이로 보정) |
  | val | any | Y | 추가할 값 |
- 반환값: `Array` — 값이 추가된 배열
- 예시
  ```js
  const result = $array.addAt(['Apple', 'Banana', 'Mango'], 1, 'Cherry');
  ```

### `$array.removeAt(arr, index)`
- 설명: 지정한 위치의 항목을 삭제한 새 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 대상 배열 |
  | index | number | Y | 삭제할 위치(0 이상, 배열 길이 미만인 경우만 삭제) |
- 반환값: `Array` — 항목이 삭제된 배열
- 예시
  ```js
  const result = $array.removeAt(['Apple', 'Banana', 'Mango'], 1);
  ```

### `$array.contains(arr, val)`
- 설명: 배열에 지정된 값이 포함되어 있는지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 대상 배열 |
  | val | any | Y | 포함 여부를 확인할 값 |
- 반환값: `boolean` — 포함 여부
- 예시
  ```js
  const result = $array.contains(['Apple', 'Banana'], 'Banana'); // true
  ```

### `$array.merge(arr, brr, predicate = (a, b) => a === b)`
- 설명: predicate 조건으로 중복 여부를 판단하여 두 배열을 병합한 새 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | arr | Array | Y | 기준 배열 |
  | brr | Array | Y | 병합할 배열 |
  | predicate | Function | N | 중복 판단 함수 `(bItem, cItem) => boolean` (기본값: 완전 일치) |
- 반환값: `Array` — 병합된 배열
- 예시
  ```js
  const result = $array.merge(['Apple', 'Banana'], ['Grape', 'Banana']);
  ```

### `$array.union(sourceArray, targetArray)`
- 설명: 두 배열의 합집합(중복 제거)을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | sourceArray | Array | Y | 첫 번째 배열 |
  | targetArray | Array | Y | 두 번째 배열 |
- 반환값: `Array` — 합집합 배열
- 예시
  ```js
  const result = $array.union(['Apple', 'Banana'], ['Banana', 'Mango']);
  ```

### `$array.difference(sourceArray, targetArray)`
- 설명: sourceArray에서 targetArray에 존재하지 않는 항목만 남긴 차집합을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | sourceArray | Array | Y | 기준 배열 |
  | targetArray | Array | Y | 제외할 값이 담긴 배열 |
- 반환값: `Array` — 차집합 배열
- 예시
  ```js
  const result = $array.difference(['Apple', 'Banana'], ['Banana']);
  ```

### `$array.intersect(sourceArray, targetArray)`
- 설명: 두 배열에 공통으로 존재하는 항목의 교집합을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | sourceArray | Array | Y | 첫 번째 배열 |
  | targetArray | Array | Y | 두 번째 배열 |
- 반환값: `Array` — 교집합 배열
- 예시
  ```js
  const result = $array.intersect(['Apple', 'Banana'], ['Banana', 'Mango']);
  ```

### `$array.symmetryDifference(sourceArray, targetArray)`
- 설명: 두 배열 중 한쪽에만 존재하는 항목(대칭차집합)을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | sourceArray | Array | Y | 첫 번째 배열 |
  | targetArray | Array | Y | 두 번째 배열 |
- 반환값: `Array` — 대칭차집합 배열
- 예시
  ```js
  const result = $array.symmetryDifference(['Apple', 'Banana'], ['Banana', 'Mango']);
  ```

### `$array.getValue(items, parameterName, defaultValue, parameterProperty, valueProperty)`
- 설명: 파라미터 형태의 객체 배열에서 이름으로 값을 찾아 반환합니다. 항목을 찾지 못하면 기본값을 반환합니다. 기본적으로 `ParameterName`/`parameterName` 속성을 이름으로, `Value`/`value` 속성을 값으로 사용하며, `parameterProperty`/`valueProperty`로 다른 속성명을 지정할 수 있습니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | items | Array\<Object\> | Y | 파라미터 객체 배열 |
  | parameterName | string | Y | 찾을 파라미터 이름 |
  | defaultValue | any | N | 값을 찾지 못했을 때 반환할 기본값(생략 시 `''`) |
  | parameterProperty | string | N | 이름 속성명을 직접 지정(생략 시 `ParameterName`/`parameterName` 사용) |
  | valueProperty | string | N | 값 속성명을 직접 지정(생략 시 `Value`/`value` 사용) |
- 반환값: `any` — 찾은 값 또는 기본값
- 예시
  ```js
  const items = [{ ParameterName: 'MaxCount', Value: '100' }];
  const result = $array.getValue(items, 'MaxCount', '0');
  ```

### `$array.ranks(values, asc = false)`
- 설명: 배열 값들의 순위를 계산하여 원본 순서에 대응하는 순위 배열을 반환합니다. 동일한 값은 같은 순위로 처리됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | values | Array | Y | 순위를 계산할 값 배열 |
  | asc | boolean | N | true면 오름차순 기준 순위, false면 내림차순 기준 순위(기본값 false) |
- 반환값: `Array<number>` — 원본 배열의 각 위치에 대응하는 순위 배열
- 예시
  ```js
  const result = $array.ranks([79, 5, 18, 5, 32]);
  ```

### `$array.split(value, flag = ',')`
- 설명: 구분자로 분리된 문자열을 트리밍 후 빈 항목을 제거한 배열로 변환합니다. 입력값이 문자열이 아니면 빈 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | value | string | Y | 분리할 문자열 |
  | flag | string | N | 구분자(기본값 `,`) |
- 반환값: `Array<string>` — 분리된 문자열 배열
- 예시
  ```js
  const result = $array.split('Apple, Banana ,Mango');
  ```
