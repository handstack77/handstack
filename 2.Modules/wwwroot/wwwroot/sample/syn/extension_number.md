# Number 확장 사용법 ($number)

## 개요
`$number`는 숫자 값을 다루는 확장 함수를 제공합니다. 밀리초 값을 사람이 읽기 쉬운 기간으로 변환하거나, 바이트 크기 문자열 변환, 난수 생성, 범위 검사/보정, 백분율·금액 계산, 다중 값 집계(SUM/AVG/MIN/MAX 등)와 같은 화면 로직에서 자주 쓰는 숫자 연산을 모아 둔 모듈입니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `$number`로 즉시 사용할 수 있습니다. (`syn.` 접두사 없이 전역 변수로 노출됨에 유의)

## 빠른 시작
```js
$number.random(1, 100);          // 1~100 사이의 임의 정수
$number.toByteString(1048576);   // '1 MB'
```

## 주요 시나리오
### 밀리초 값을 기간 정보로 변환
`duration(ms)`는 밀리초 값을 연/주/일/시/분/초/밀리초로 분해한 객체로 반환합니다. 경과 시간 표시 UI에 활용할 수 있습니다.
```js
$number.duration(90061000); // { year:0, week:0, day:1, hour:1, minute:1, second:1, millisecond:0 }
```

### 값의 범위 검증과 보정
`isRange(num, low, high)`로 범위 포함 여부를 확인하고, `limit(num, low, high)`로 범위를 벗어난 값을 경계값으로 강제 보정합니다.
```js
$number.isRange(120, 0, 100); // false
$number.limit(120, 0, 100);   // 100
```

### 백분율과 금액 계산
`percent(num, total, precision)`은 백분율을, `amount(rate, total, precision)`은 비율에 따른 실제 금액(수량)을 계산합니다.
```js
$number.percent(30, 200);     // 15
$number.amount(15, 200);      // 30
```

### 여러 값 집계하기
`aggregate(type, columnValues)`는 콤마 문자열 또는 배열로 전달된 숫자들을 SUM, MIN, MAX, COUNT, AVG, MEDIAN 중 원하는 방식으로 집계합니다. 그리드 컬럼 합계 등에 활용합니다.
```js
$number.aggregate('SUM', [10, 20, 30]);   // 60
$number.aggregate('AVG', '10,20,30');     // 20
```

## 실전 예제 페이지
`/sample/syn/extension_number.html` 예제에서 다음 항목을 실습할 수 있습니다.
- `$number.version` 속성 조회
- `duration()`, `toByteString()`
- `random()`, `isRange()`, `limit()`
- `percent()`, `amount()`
- `aggregate()` (SUM/AVG/MIN/MAX/COUNT/MEDIAN)

## 주의 사항
- `aggregate()`는 숫자로 변환할 수 없는 값을 집계 대상에서 제외합니다. `COUNT`를 제외한 나머지 타입은 유효한 값이 하나도 없으면 `0`을 반환합니다.
- `percent()`, `amount()`는 `total`이 `0`이거나 숫자가 아니면 `0`을 반환하도록 방어 처리되어 있습니다.
- `toByteString()`은 1 미만 값은 단위 변환 없이 `B` 단위로 표시합니다.
- `random(start, end)`는 `start`/`end` 순서에 상관없이 두 값 중 작은 값과 큰 값을 각각 최소/최대로 사용합니다.

## 관련 모듈
- API 상세: [`extension_number_api.md`](./extension_number_api.md)
