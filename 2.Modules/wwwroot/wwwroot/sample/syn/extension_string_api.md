# $string API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `$string` (전역, `syn.$string` 별칭 없음) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 3286~3873번째 줄) |
| 예제 페이지 | `/sample/syn/extension_string.html` |
| 의존 모듈 | `$object`(`isNullOrUndefined`), `$date`(`toString`, `isDate`) |

## 메서드

### `$string.toValue(value, defaultValue = '')`
- 설명: 값이 `undefined`/`null`이 아니면 문자열로 변환하고, 그렇지 않으면 `defaultValue`를 문자열로 변환해 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | value | any | Y | 변환할 값 |
  | defaultValue | any | N | value가 없을 때 사용할 기본값(기본값 `''`) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.toValue(null, '기본값');
  ```

### `$string.br(val)`
- 설명: 문자열의 줄바꿈 문자(`\r\n`, `\r`, `\n`)를 `<br />` 태그로 치환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 변환할 값(내부에서 문자열로 변환) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.br('hello\nworld');
  ```

### `$string.interpolate(text, json, options = {})`
- 설명: `#{key}` 형태의 플레이스홀더가 포함된 템플릿 문자열을 JSON 객체(또는 객체 배열)의 값으로 치환합니다. 배열이면 각 항목별로 치환한 결과를 `separator`로 연결합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | string | Y | `#{key}` 플레이스홀더가 포함된 템플릿 문자열 |
  | json | Object \| Array\<Object\> | Y | 치환에 사용할 값 |
  | options.defaultValue | any | N | 값이 없을 때 사용할 기본값(기본값 `null`이면 플레이스홀더 유지) |
  | options.separator | string | N | 배열 치환 시 결과 연결 구분자(기본값 `\n`) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.interpolate('<span>#{name}</span>', { name: 'HandStack' });
  ```

### `$string.isNullOrEmpty(val)`
- 설명: 값이 `undefined`, `null`이거나 빈 문자열(`''`)인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 확인할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $string.isNullOrEmpty('');
  ```

### `$string.isNullOrWhiteSpace(val)`
- 설명: 값이 `undefined`, `null`이거나 공백 문자만으로 이루어져 있는지(`trim()` 결과가 빈 문자열인지) 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 확인할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $string.isNullOrWhiteSpace('   ');
  ```

### `$string.sanitizeHTML(val, removeSpecialChars = false)`
- 설명: 문자열에서 HTML 태그와 `&nbsp;`를 제거하고 앞뒤 공백을 트리밍합니다. `removeSpecialChars`가 true면 일부 특수문자도 함께 제거합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 문자열 반환) |
  | removeSpecialChars | boolean | N | 특수문자 제거 여부(기본값 false) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.sanitizeHTML('<b>hello</b>');
  ```

### `$string.cleanHTML(val)`
- 설명: 브라우저 환경에서 문자열의 HTML을 DOM으로 파싱해 텍스트만 추출하고, 연속 공백을 하나로 축약합니다(Node 환경에서는 원본을 그대로 반환).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열 |
- 반환값: `string`
- 예시
  ```js
  const result = $string.cleanHTML('<b>hello</b>   world');
  ```

### `$string.toHtmlChar(val, charStrings = "&'<>!\"#%()*+,./;=@[\\]^`{|}~")`
- 설명: 문자열에 포함된 지정 특수문자를 HTML 문자 엔티티(`&#nn;` 등)로 치환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 문자열 반환) |
  | charStrings | string | N | 치환 대상 문자 목록(기본값은 소스 참고) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.toHtmlChar('<b>hello</b>');
  ```

### `$string.toCharHtml(val, escapedChars = '&(amp|#39|lt|gt|...);')`
- 설명: `toHtmlChar()`로 치환된 HTML 엔티티 문자열을 원래 특수문자로 되돌립니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 문자열 반환) |
  | escapedChars | string | N | 엔티티 매칭 정규식 패턴(기본값은 소스 참고) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.toCharHtml('&lt;b&gt;hello&lt;/b&gt;');
  ```

### `$string.length(val)`
- 설명: 문자열 길이를 UTF-8 바이트 기준으로 계산합니다(ASCII 1바이트, 한글 등은 다바이트).
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 0 반환) |
- 반환값: `number`
- 예시
  ```js
  const result = $string.length('안녕 hello');
  ```

### `$string.split(val, char = ',')`
- 설명: 문자열을 구분자로 분리하고, 트리밍 후 빈 문자열 항목을 제거한 배열을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 배열 반환) |
  | char | string | N | 구분자(기본값 `,`) |
- 반환값: `Array<string>`
- 예시
  ```js
  const result = $string.split('1,2,3');
  ```

### `$string.isNumber(num)`
- 설명: 값이 숫자(천단위 구분 기호, 소수점, 음수 부호 포함)로 변환 가능한 형식인지 확인합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | num | any | Y | 확인할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $string.isNumber('-12,345.123');
  ```

### `$string.toNumber(val)`
- 설명: 문자열(천단위 구분 기호 포함 가능)을 숫자로 변환합니다. 변환에 실패하면 경고 로그를 남기고 0을 반환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 변환할 값 |
- 반환값: `number`
- 예시
  ```js
  const result = $string.toNumber('-12,345.123');
  ```

### `$string.capitalize(val)`
- 설명: 문자열 내 각 단어의 첫 글자(영문 소문자)를 대문자로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 문자열 반환) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.capitalize('aaa bbb ccc');
  ```

### `$string.toJson(val, options = {})`
- 설명: 구분자와 줄바꿈으로 구성된 문자열(CSV류)을 첫 줄을 헤더로 사용하는 JSON 객체 배열로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 배열 반환) |
  | options.delimiter | string | N | 열 구분자(기본값 `,`) |
  | options.newline | string | N | 줄 구분자(기본값 `\n`) |
  | options.meta | Object | N | 컬럼명별 타입 지정(`toParseType`에 사용) |
- 반환값: `Array<Object>`
- 예시
  ```js
  const result = $string.toJson('col1;col2\na;b', { delimiter: ';' });
  ```

### `$string.toJsv(val, options = {})`
- 설명: 구분자와 줄바꿈으로 구성된 문자열을 헤더 없이 행 단위 값 배열(2차원 배열)로 변환합니다. `toJson()`과 달리 첫 줄도 데이터 행으로 포함됩니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 배열 반환) |
  | options.delimiter | string | N | 열 구분자(기본값 `,`) |
  | options.newline | string | N | 줄 구분자(기본값 `\n`) |
  | options.meta | Object | N | 컬럼 인덱스별 타입 지정(`toParseType`에 사용) |
- 반환값: `Array<Array<any>>`
- 예시
  ```js
  const result = $string.toJsv('ERP;80%\nMES;120%', { delimiter: ';' });
  ```

### `$string.validateJsv(data, rules, options = {})`
- 설명: `toJsv()` 등으로 만들어진 2차원 배열 데이터를 컬럼 인덱스 기준 규칙(rules)으로 검증합니다. 필수값, 최소/최대 길이, 최소/최대값, 정규식 패턴, enum, 커스텀 validator 함수를 지원합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | data | Array<Array<any>> | Y | 검증할 2차원 배열 데이터 |
  | rules | Object \| Array | Y | 컬럼 인덱스를 키로 하는 규칙 객체(또는 배열) |
  | options.throwError | boolean | N | 검증 실패 시 예외를 던질지 여부(기본값 false) |
  | options.returnDetails | boolean | N | 상세 결과 객체 반환 여부(기본값 true) |
  | options.validateAll | boolean | N | 모든 행을 검증할지, 첫 행만 검증할지(기본값 false → 첫 행만) |
- 반환값: `Object` — `{ result, errorCount, errors, validatedRows, validatedColumns }` (또는 `returnDetails: false`이면 `{ result }`)
- 예시
  ```js
  const rows = $string.toJsv('ERP;80%', { delimiter: ';' });
  const result = $string.validateJsv(rows, {
      0: { name: 'System', required: true, enum: ['ERP', 'MES'] },
      1: { name: 'Progress', required: true, pattern: '^\\d+%$' }
  }, { validateAll: true });
  ```

### `$string.toParameterObject(parameters)`
- 설명: `@Name1:Value1;@Name2:Value2` 형태의 문자열을 `{ Name1: 'Value1', Name2: 'Value2' }` 형태의 객체로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | parameters | string | Y | `@이름:값;` 형식의 문자열 |
- 반환값: `Object`
- 예시
  ```js
  const result = $string.toParameterObject('@Name1:Value1;@Name2:Value2');
  ```

### `$string.toBoolean(val)`
- 설명: 문자열(또는 값)이 `true`, `y`, `1`, `ok`, `yes`, `on`(대소문자 무관) 중 하나인지 확인해 boolean으로 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 변환할 값 |
- 반환값: `boolean`
- 예시
  ```js
  const result = $string.toBoolean('Y');
  ```

### `$string.toDynamic(val, emptyIsNull = false)`
- 설명: 문자열 값을 boolean/number/Date/string 중 알맞은 타입으로 자동 추론하여 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 변환할 값 |
  | emptyIsNull | boolean | N | 빈 문자열을 `null`로 취급할지 여부(기본값 false → 빈 문자열 반환) |
- 반환값: `boolean \| number \| Date \| string \| null`
- 예시
  ```js
  const result = $string.toDynamic('2023-12-11T04:45:56.558Z');
  ```

### `$string.toParseType(val, metaType = 'string', emptyIsNull = false)`
- 설명: 문자열 값을 지정한 타입(`string`/`bool`/`boolean`/`number`/`numeric`/`int`/`date`/`datetime`)에 맞게 강제 변환합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 변환할 값 |
  | metaType | string | N | 변환할 타입(기본값 `string`) |
  | emptyIsNull | boolean | N | 빈 문자열을 `null`로 취급할지 여부(기본값 false) |
- 반환값: `string \| boolean \| number \| Date \| null`
- 예시
  ```js
  const result = $string.toParseType('100', 'number');
  ```

### `$string.toNumberString(val)`
- 설명: 문자열에서 숫자, 소수점(`.`), 마이너스 부호(`-`) 이외의 문자를 제거합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | string | Y | 대상 문자열(문자열이 아니면 빈 문자열 반환) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.toNumberString('f-1,234.12');
  ```

### `$string.toStringCounts(text, locale)`
- 설명: 문자열의 글자수, 단어수, 문장수를 계산합니다. `Intl.Segmenter`를 지원하는 환경에서는 grapheme/word/sentence 단위로 정확히 계산하고, 지원하지 않으면 정규식 기반 근사치를 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | string | Y | 대상 문자열 |
  | locale | string | N | `Intl.Segmenter`에 사용할 로케일(기본값 `syn.$b?.language` 또는 `ko-KR`) |
- 반환값: `{ characters: number, words: number, sentences: number }`
- 예시
  ```js
  const result = $string.toStringCounts('안녕하세요. hello world!');
  ```

### `$string.toCurrency(val, localeID, options = {})`
- 설명: 값을 숫자로 변환한 뒤 천단위 구분 기호가 포함된 통화 형식의 문자열로 변환합니다. `localeID`가 지정되고 `Intl.NumberFormat`을 사용할 수 있으면 해당 로케일 형식을 우선 사용합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 변환할 값 |
  | localeID | string | N | `Intl.NumberFormat`에 사용할 로케일(생략 시 수동 포맷 사용) |
  | options | Object | N | `Intl.NumberFormat` 옵션(기본값 `{ style: 'decimal', currency: 'KRW' }`과 병합) |
- 반환값: `string \| null` — 변환에 실패하면 `null`
- 예시
  ```js
  const result = $string.toCurrency(1234567.891, 'ko-KR');
  ```

### `$string.pad(val, length, fix = '0', isLeft = true)`
- 설명: 문자열을 지정한 길이가 될 때까지 지정한 문자로 좌측 또는 우측을 채웁니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | val | any | Y | 대상 값(내부에서 문자열로 변환) |
  | length | number | Y | 목표 길이 |
  | fix | string | N | 채울 문자(기본값 `0`) |
  | isLeft | boolean | N | true면 좌측 패딩, false면 우측 패딩(기본값 true) |
- 반환값: `string`
- 예시
  ```js
  const result = $string.pad('7', 5); // "00007"
  ```
