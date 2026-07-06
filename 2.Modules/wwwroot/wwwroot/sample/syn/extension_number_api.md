# $number API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `$number` (syn.$ 접두사 없음, 전역 변수) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 4039~4165번째 줄) |
| 예제 페이지 | `/sample/syn/extension_number.html` |
| 의존 모듈 | `$string`(`toNumber`, `aggregate` 내부에서 사용) |

## 메서드

### `$number.duration(ms)`
- 설명: 밀리초 값을 연/주/일/시/분/초/밀리초로 분해한 객체로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | ms | `number` | Y | 밀리초 값 |
- 반환값: `object` — `{ year, week, day, hour, minute, second, millisecond }`. 숫자가 아니면 `{}`
- 예시
  ```js
  const result = $number.duration(100000000);
  ```

### `$number.toByteString(num, precision = 3, addSpace = true)`
- 설명: 바이트 단위 숫자를 `B`, `KB`, `MB`, ... `YB` 단위의 사람이 읽기 쉬운 문자열로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | num | `number` | Y | 바이트 값 |
  | precision | `number` | N | 유효 자릿수(기본값 3) |
  | addSpace | `boolean` | N | 숫자와 단위 사이 공백 삽입 여부(기본값 true) |
- 반환값: `string`
- 예시
  ```js
  const result = $number.toByteString(100000000); // '95.4 MB'
  ```

### `$number.random(start = 0, end = 10)`
- 설명: `start`~`end` 범위(양 끝 포함)의 임의 정수를 반환합니다. 두 값의 순서는 자동으로 정렬되어 처리됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | start | `number` | N | 범위 시작(기본값 0) |
  | end | `number` | N | 범위 끝(기본값 10) |
- 반환값: `number`
- 예시
  ```js
  const result = $number.random(1, 10000);
  ```

### `$number.isRange(num, low, high)`
- 설명: `num`이 `low`~`high` 범위(포함) 안에 있는지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | num | `number` | Y | 검사할 값 |
  | low | `number` | Y | 최소값 |
  | high | `number` | Y | 최대값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $number.isRange(50, 30, 80);
  ```

### `$number.limit(num, low, high)`
- 설명: `num`이 `low`~`high` 범위를 벗어나면 가까운 경계값으로 보정합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | num | `number` | Y | 보정할 값 |
  | low | `number` | Y | 최소값 |
  | high | `number` | Y | 최대값 |
- 반환값: `number` — `num`이 숫자가 아니면 `low` 반환
- 예시
  ```js
  const result = $number.limit(120, 30, 80); // 80
  ```

### `$number.percent(num, total, precision = 0)`
- 설명: `total` 대비 `num`의 백분율 값을 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | num | `number` | Y | 부분 값 |
  | total | `number` | Y | 전체 값 |
  | precision | `number` | N | 소수점 자릿수(기본값 0) |
- 반환값: `number` — `total`이 `0`이거나 숫자가 아니면 `0`
- 예시
  ```js
  const result = $number.percent(30, 200); // 15
  ```

### `$number.amount(rate, total, precision = 0)`
- 설명: `total`에 대한 `rate`(%) 비율만큼의 실제 값을 계산합니다. `percent()`의 역연산에 해당합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | rate | `number` | Y | 비율(%) |
  | total | `number` | Y | 전체 값 |
  | precision | `number` | N | 소수점 자릿수(기본값 0) |
- 반환값: `number` — `total`이 `0`이거나 숫자가 아니면 `0`
- 예시
  ```js
  const result = $number.amount(15, 200); // 30
  ```

### `$number.aggregate(type, columnValues)`
- 설명: 콤마로 구분된 문자열 또는 배열로 전달된 숫자 값들을 집계합니다. 숫자로 변환할 수 없는 값은 집계에서 제외됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | type | `string` | Y | `'SUM'`, `'MIN'`, `'MAX'`, `'COUNT'`, `'AVG'`, `'MEDIAN'` 중 하나(대소문자 무관) |
  | columnValues | `string` \| `Array` | Y | 집계 대상 값 목록 |
- 반환값: `number` — 유효 값이 없고 `type`이 `'COUNT'`가 아니면 `0`
- 예시
  ```js
  const result = $number.aggregate('AVG', [10, 20, 30, 40]); // 25
  ```
