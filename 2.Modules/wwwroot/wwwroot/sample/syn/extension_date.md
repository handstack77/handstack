# Date 확장 사용법 ($date)

## 개요
`$date`는 JavaScript `Date` 객체를 다루기 위한 확장 함수를 제공합니다. 날짜 비교, 문자열 변환, 가산/감산, 상대 시간 표시, 주차 계산 등 화면에서 자주 필요한 날짜 처리 기능을 하나의 전역 객체로 모아 제공합니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `$date`로 즉시 사용할 수 있습니다. (`syn.` 접두사 없이 전역 변수로 노출됨에 유의)

## 빠른 시작
```js
const today = $date.now();
const tomorrow = $date.addDay(today, 1);
$date.toString(today, 'yyyy-MM-dd'); // '2026-07-06' 형식 문자열
```

## 주요 시나리오
### 날짜 문자열로 표시하기
`toString(date, format, options)`은 자주 쓰는 서식 코드(`d`, `t`, `a`, `n`, `w` 등)뿐 아니라 `yyyy`, `MM`, `dd`, `HH`, `mm`, `ss` 조합 서식도 지원합니다.
```js
$date.toString(new Date(), 'n');   // '2026년 07월 06일 (월)'
$date.toString(new Date(), 'yyyy-MM-dd HH:mm');
```

### 날짜 가산/감산과 기간 비교
`addDay`, `addMonth`, `addYear` 등으로 날짜를 이동하고, `diff(start, end, interval)`로 두 날짜의 차이를 계산합니다.
```js
const nextWeek = $date.addWeek($date.now(), 1);
$date.diff($date.now(), nextWeek, 'day'); // 7
```

### 상대 시간 표시
`timeAgo(dateInput)`는 과거 시점과 현재의 차이를 "3분 전", "2일 전"과 같은 한국어 문자열로 반환합니다.
```js
$date.timeAgo('2026-07-01T00:00:00'); // 예: '5일 전'
```

### 문자열/숫자를 Date로 안전하게 변환
`parseDate(dateInput)`는 문자열, 숫자, Date 객체를 모두 받아 Date 객체로 정규화합니다. 변환할 수 없으면 `null`을 반환합니다.
```js
$date.parseDate('2026-07-06T00:00:00');
```

### 짧은 코드로 날짜값 인코딩/디코딩
`dateConvert(inputValue, operationType)`는 날짜(yyyyMMdd) 숫자 값을 36진수 문자열로 압축(`'E'`)하거나 되돌립니다(`'D'`). 짧은 식별자나 URL 파라미터에 날짜를 담을 때 유용합니다.
```js
const encoded = $date.dateConvert(new Date(), 'E');
$date.dateConvert(encoded, 'D');
```

## 실전 예제 페이지
`/sample/syn/extension_date.html` 예제에서 다음 항목을 실습할 수 있습니다.
- `$date.version`, `$date.interval` 속성 조회
- `now()`, `clone()`, `isBetween()`, `equals()`, `equalDay()`, `isToday()`
- `toString()` (다양한 서식 코드)
- `addSecond()`, `addMinute()`, `addHour()`, `addDay()`, `addWeek()`, `addMonth()`, `addYear()`
- `getFirstDate()`, `getLastDate()`, `diff()`, `toTicks()`
- `isDate()`, `isISOString()`, `weekOfMonth()`
- `getAmPm()`, `get12Time()`, `timeAgo()`, `parseDate()`, `dateConvert()`

## 주의 사항
- 대부분의 메서드는 인자가 `Date` 인스턴스가 아니면 `null` 또는 `false`/`0`을 반환하도록 방어 코드가 들어 있습니다. 문자열을 바로 넘기지 말고 `parseDate()`로 변환한 뒤 사용하세요.
- `addMonth()`, `addYear()`는 말일/윤년 보정을 자동으로 수행합니다(예: 1월 31일 + 1개월은 2월 28/29일로 보정).
- `diff()`의 `interval` 인자는 `year`, `week`, `day`, `hour`, `minute`, `second` 또는 `month` 문자열을 사용합니다. `month`는 별도 계산식을 사용하므로 다른 단위와 혼동하지 않도록 주의합니다.
- `toString()`의 `'w'` 서식은 내부적으로 `weekOfMonth()`를 호출하므로 연산 비용이 상대적으로 큽니다. 반복 렌더링(그리드 셀 등)에서 남용하지 않도록 합니다.

## 관련 모듈
- API 상세: [`extension_date_api.md`](./extension_date_api.md)
