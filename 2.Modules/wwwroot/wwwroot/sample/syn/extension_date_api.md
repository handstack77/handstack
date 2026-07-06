# $date API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `$date` (syn.$ 접두사 없음, 전역 변수) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 2683~3284번째 줄) |
| 예제 페이지 | `/sample/syn/extension_date.html` |
| 의존 모듈 | `$object`(`isString`, `isDate`), `$string`(`isNullOrEmpty`, `toNumber`), `$validation`(`regexs.isoDate`), `syn.$l`(오류 로깅) |

## 속성

### `$date.interval`
- 설명: 초 단위가 아닌, 밀리초 단위의 날짜/시간 간격 상수 모음입니다(`Object.freeze`로 동결).
- 값: `{ year, week, day, hour, minute, second }` (각 단위의 밀리초 값)

## 메서드

### `$date.now()`
- 설명: 현재 시각의 `Date` 객체를 반환합니다.
- 매개변수: 없음
- 반환값: `Date`
- 예시
  ```js
  const now = $date.now();
  ```

### `$date.clone(date)`
- 설명: `Date` 객체 또는 날짜 문자열을 새로운 `Date` 객체로 복제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` \| `string` | Y | 복제할 날짜 값 |
- 반환값: `Date` \| `null` — 변환 실패 시 `null`
- 예시
  ```js
  const cloned = $date.clone(new Date());
  ```

### `$date.isBetween(date, start, end)`
- 설명: `date`가 `start`와 `end` 사이(포함)에 있는지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 검사할 날짜 |
  | start | `Date` | Y | 기간 시작 |
  | end | `Date` | Y | 기간 종료 |
- 반환값: `boolean`
- 예시
  ```js
  $date.isBetween(new Date(), start, end);
  ```

### `$date.equals(date, targetDate)`
- 설명: 두 `Date` 값이 밀리초 단위까지 완전히 동일한지 비교합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 비교 대상 1 |
  | targetDate | `Date` | Y | 비교 대상 2 |
- 반환값: `boolean`
- 예시
  ```js
  $date.equals(a, b);
  ```

### `$date.equalDay(date, targetDate)`
- 설명: 두 `Date` 값의 연/월/일이 동일한지 비교합니다(`toDateString()` 비교).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 비교 대상 1 |
  | targetDate | `Date` | Y | 비교 대상 2 |
- 반환값: `boolean`
- 예시
  ```js
  $date.equalDay(a, b);
  ```

### `$date.isToday(date)`
- 설명: `date`가 오늘 날짜와 동일한지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 검사할 날짜 |
- 반환값: `boolean`
- 예시
  ```js
  $date.isToday(new Date());
  ```

### `$date.toString(date, format, options = {})`
- 설명: `Date` 값을 지정한 서식 코드로 변환합니다. 짧은 서식 코드(`d`, `t`, `a`, `i`, `f`, `s`, `n`, `nt`, `mdn`, `w`, `wn`, `m`, `y`, `ym`)와, 코드가 없을 때는 `yyyy`/`MM`/`dd`/`HH`/`mm`/`ss` 토큰 조합 서식을 지원합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` \| `string` | Y | 변환할 날짜 |
  | format | `string` | N | 서식 코드 또는 토큰 조합 문자열 |
  | options | `object` | N | `w` 서식에서 사용되는 `{ weekStartSunday }` 옵션 |
- 반환값: `string` — 변환 실패 시 빈 문자열
- 예시
  ```js
  $date.toString(new Date(), 'a');          // '2026-07-06 13:20:00'
  $date.toString(new Date(), 'yyyy/MM/dd'); // 'yyyy/MM/dd' 토큰 조합
  ```

### `$date.getAmPm(time, amText, pmText)`
- 설명: 시간 값(`Date`, `'HH:mm'` 문자열, ISO 문자열, 숫자 등)을 기준으로 오전/오후 텍스트를 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | time | `Date` \| `string` \| `number` | N | 시간 값 |
  | amText | `string` | N | 오전 표기 문자열(기본값 `'AM'`) |
  | pmText | `string` | N | 오후 표기 문자열(기본값 `'PM'`) |
- 반환값: `string`
- 예시
  ```js
  $date.getAmPm(new Date(), '오전', '오후');
  ```

### `$date.get12Time(time, amText, pmText)`
- 설명: 시간 값을 12시간제 `AM/PM HH:mm:ss` 형식 문자열로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | time | `Date` \| `string` \| `number` | N | 시간 값 |
  | amText | `string` | N | 오전 표기 문자열(기본값 `'AM'`) |
  | pmText | `string` | N | 오후 표기 문자열(기본값 `'PM'`) |
- 반환값: `string` — 예: `'PM 01:20:00'`
- 예시
  ```js
  $date.get12Time(new Date());
  ```

### `$date.addSecond(date, val)` / `$date.addMinute(date, val)` / `$date.addHour(date, val)`
- 설명: 각각 초/분/시 단위로 날짜에 값을 더한 새 `Date` 객체를 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 기준 날짜 |
  | val | `number` | Y | 더할 값(음수 가능) |
- 반환값: `Date` \| `null`
- 예시
  ```js
  $date.addMinute(new Date(), 30);
  ```

### `$date.addDay(date, val)` / `$date.addWeek(date, val)`
- 설명: 일/주 단위로 날짜를 이동합니다. `addWeek`는 내부적으로 `addDay(date, val * 7)`을 호출합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 기준 날짜 |
  | val | `number` | Y | 더할 일/주 값 |
- 반환값: `Date` \| `null`
- 예시
  ```js
  $date.addDay(new Date(), -7);
  ```

### `$date.addMonth(date, val)`
- 설명: 월 단위로 날짜를 이동합니다. 대상 월에 존재하지 않는 일자(예: 1월 31일 + 1개월)는 해당 월의 말일로 자동 보정됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 기준 날짜 |
  | val | `number` | Y | 더할 개월 수 |
- 반환값: `Date` \| `null`
- 예시
  ```js
  $date.addMonth(new Date('2026-01-31'), 1); // 2026-02-28
  ```

### `$date.addYear(date, val)`
- 설명: 년 단위로 날짜를 이동합니다. 윤년 2월 29일 기준 날짜는 대상 연도가 평년이면 2월 28일로 보정됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 기준 날짜 |
  | val | `number` | Y | 더할 연도 수 |
- 반환값: `Date` \| `null`
- 예시
  ```js
  $date.addYear(new Date('2024-02-29'), 1); // 2025-02-28
  ```

### `$date.getFirstDate(date)` / `$date.getLastDate(date)`
- 설명: 각각 `date`가 속한 달의 첫째 날/마지막 날을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 기준 날짜 |
- 반환값: `Date` \| `null`
- 예시
  ```js
  $date.getFirstDate(new Date());
  $date.getLastDate(new Date());
  ```

### `$date.diff(start, end, interval = 'day')`
- 설명: 두 날짜의 차이를 지정한 단위로 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | start | `Date` | Y | 시작 날짜 |
  | end | `Date` | Y | 종료 날짜 |
  | interval | `string` | N | `'year'`, `'week'`, `'day'`, `'hour'`, `'minute'`, `'second'`, `'month'` 중 하나(기본값 `'day'`) |
- 반환값: `number`
- 예시
  ```js
  $date.diff(start, end, 'month');
  ```

### `$date.toTicks(date)`
- 설명: `Date` 값을 .NET 스타일 ticks 값(100나노초 단위, 1601-01-01 기준)으로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | date | `Date` | Y | 변환할 날짜 |
- 반환값: `number` — 변환 실패 시 `0`
- 예시
  ```js
  $date.toTicks(new Date());
  ```

### `$date.isDate(val)`
- 설명: 값이 `Date` 인스턴스이거나 `Date`로 파싱 가능한 문자열인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  $date.isDate('2026-07-06');
  ```

### `$date.isISOString(val)`
- 설명: 문자열이 ISO 8601 날짜 형식(`$validation.regexs.isoDate`)과 일치하는지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | `any` | Y | 검사할 값 |
- 반환값: `boolean`
- 예시
  ```js
  $date.isISOString('2026-07-06T00:00:00.000Z');
  ```

### `$date.weekOfMonth(year, month, weekStartSunday = true)`
- 설명: 지정한 연/월의 주차별 시작일/종료일 목록을 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | year | `number` | Y | 연도 |
  | month | `number` | N | 월(미지정 시 현재 월) |
  | weekStartSunday | `boolean` | N | 주 시작 요일을 일요일로 할지 여부(기본값 `true`) |
- 반환값: `Array<{ weekStartDate: string, weekEndDate: string }>`
- 예시
  ```js
  $date.weekOfMonth(2026, 7);
  ```

### `$date.timeAgo(dateInput)`
- 설명: 과거 날짜와 현재 시각의 차이를 "N년/달/주/일/시간/분/초 전"과 같은 상대 시간 문자열로 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | dateInput | `Date` \| `string` | Y | 기준 과거 날짜 |
- 반환값: `string` — 1분 미만이면 `'방금 전'`, 미래 시각이면 `'in the future'`
- 예시
  ```js
  $date.timeAgo('2026-07-01T00:00:00');
  ```

### `$date.parseDate(dateInput)`
- 설명: 문자열, 숫자, `Date` 객체를 모두 받아 `Date` 객체로 정규화합니다. 변환할 수 없으면 `null`을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | dateInput | `Date` \| `string` \| `number` | Y | 변환할 값 |
- 반환값: `Date` \| `null`
- 예시
  ```js
  $date.parseDate('2026-07-06T00:00:00');
  ```

### `$date.dateConvert(inputValue, operationType)`
- 설명: 날짜(yyyyMMdd 숫자 또는 `Date` 객체)를 36진수 문자열로 인코딩(`'E'`)하거나, 인코딩된 문자열을 다시 숫자 문자열로 디코딩(`'D'`)합니다. 변환에 실패하면 오늘 날짜를 인코딩한 기본값을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | inputValue | `Date` \| `string` \| `number` | Y | 인코딩/디코딩할 값 |
  | operationType | `'E'` \| `'D'` | Y | `'E'`: 인코딩, `'D'`: 디코딩 |
- 반환값: `string`
- 예시
  ```js
  const encoded = $date.dateConvert(new Date(), 'E');
  const decoded = $date.dateConvert(encoded, 'D');
  ```
