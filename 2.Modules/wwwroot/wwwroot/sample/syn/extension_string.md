# $string 사용법 ($string)

## 개요
`$string`는 자바스크립트 `String` 객체를 대상으로 하는 확장 함수 모음입니다. null/undefined 안전 처리, HTML 이스케이프, 문자열 템플릿 치환(interpolate), 타입 변환(Boolean/Number/Date 추론), CSV류 문자열 파싱과 검증, 통화/패딩 포맷팅까지 문자열을 다루는 대부분의 상용구 작업을 대체합니다. `syn.js`가 로드되면 전역 객체로 즉시 사용할 수 있으며, `syn.$string`과 같은 별도의 `syn.` 접두 별칭은 없습니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `$string`로 즉시 사용할 수 있습니다. 별도의 초기화나 `new` 호출이 필요하지 않습니다.

## 빠른 시작
```js
$string.toValue(null, '기본값'); // "기본값"
$string.interpolate('<span>#{name}</span>', { name: 'HandStack' });
```

## 주요 시나리오

### null-safe 문자열 처리
값이 null/undefined일 수 있는 상황에서 안전하게 문자열로 변환하거나 빈 값 여부를 확인합니다.
```js
$string.toValue(undefined, '-');      // "-"
$string.isNullOrEmpty('');            // true
$string.isNullOrWhiteSpace('   ');    // true
```

### 템플릿 문자열 치환
`#{key}` 형태의 플레이스홀더가 포함된 템플릿 문자열을 JSON 객체(또는 객체 배열)로 치환합니다.
```js
const json = { symbol: 'HandStack', price: 12345 };
$string.interpolate('<span>#{symbol}</span> <span>#{price}</span>', json);
```

### HTML 문자열 안전 처리
사용자 입력을 화면에 출력하기 전 태그를 제거하거나 특수문자를 이스케이프합니다.
```js
$string.sanitizeHTML('<b>hello</b>');      // "hello"
$string.toHtmlChar('<b>hello</b>');        // 특수문자가 HTML 엔티티로 치환된 문자열
```

### 값 타입 변환
문자열 값을 의도한 타입(Boolean/Number/Date) 또는 자동 추론된 타입으로 변환합니다.
```js
$string.toBoolean('Y');                    // true
$string.toNumber('-12,345.123');           // -12345.123
$string.toDynamic('2023-12-11T04:45:56.558Z'); // Date 객체로 추론
$string.toParseType('100', 'number');      // 100 (의도한 타입으로 강제 변환)
```

### CSV류 문자열 파싱과 검증
클립보드에서 붙여넣은 구분자 문자열을 JSON 배열/2차원 배열로 변환하고, 규칙(rules) 기반으로 검증합니다.
```js
const rows = $string.toJsv('System;Progress\nERP;80%', { delimiter: ';' });
const validate = $string.validateJsv(rows, {
    0: { name: 'System', required: true, enum: ['ERP', 'MES'] },
    1: { name: 'Progress', required: true, pattern: '^\\d+%$' }
}, { validateAll: true });
```

### 통화/자릿수 포맷팅
숫자를 통화 형식 문자열로, 문자열을 원하는 자릿수로 패딩합니다.
```js
$string.toCurrency(1234567.891);      // "1,234,567.891"
$string.pad('7', 5);                  // "00007"
```

## 실전 예제 페이지
`/sample/syn/extension_string.html` 예제에서 다음 항목을 실습할 수 있습니다.
- `$string.toValue()` - null/undefined 안전 문자열 변환
- `$string.br()` - 줄바꿈을 `<br />`로 변환
- `$string.interpolate()` - 템플릿 치환(단일 객체/배열 지원)
- `$string.isNullOrEmpty()` / `$string.isNullOrWhiteSpace()` - 공백/빈 값 확인
- `$string.sanitizeHTML()` / `$string.cleanHTML()` - HTML 태그 제거
- `$string.toHtmlChar()` / `$string.toCharHtml()` - HTML 문자 엔티티 상호 변환
- `$string.length()` - 바이트 기준 길이 계산
- `$string.split()` - 구분자 기준 배열 변환
- `$string.isNumber()` / `$string.toNumber()` - 숫자 판별/변환
- `$string.capitalize()` - 단어 첫 글자 대문자화
- `$string.toJson()` / `$string.toJsv()` / `$string.validateJsv()` - CSV류 문자열 파싱과 검증
- `$string.toParameterObject()` - `key:value` 문자열을 객체로 변환
- `$string.toBoolean()` / `$string.toDynamic()` / `$string.toParseType()` - 타입 변환
- `$string.toNumberString()` - 숫자 관련 문자만 추출
- `$string.toStringCounts()` - 글자수/단어수/문장수 계산
- `$string.toCurrency()` - 통화 형식 변환
- `$string.pad()` - 자릿수 패딩

## 주의 사항
- `toJson()`/`toJsv()`의 옵션 속성명은 `delimiter`(구분자), `newline`(줄바꿈), `meta`(컬럼별 타입 지정)입니다. `delimeter`처럼 오탈자로 전달하면 옵션이 무시되고 기본 구분자(`,`)가 사용되므로 주의하세요.
- `toStringCounts()`는 `Intl.Segmenter`를 사용할 수 있는 최신 브라우저에서 정확한 글자/단어/문장 수를 계산하며, 지원하지 않는 환경에서는 정규식 기반의 근사치를 반환합니다.
- `length()`는 문자열의 `.length`가 아니라 숫자/영어 1바이트, 그 외 문자 다바이트로 계산한 바이트 길이를 반환하므로 화면 폭 계산 등에 사용할 수 있습니다.
- 예제 페이지의 "속성" 카드에 있는 `$string.version` 값은 다른 syn.js 샘플 페이지와 동일하게 `syn.$m.version`(라이브러리 공용 버전 표시 관례)을 그대로 사용합니다.
- 과거 문자열 결합용으로 쓰이던 `syn.$sb`(StringBuilder)는 현재 syn.js에 구현되어 있지 않습니다. 문자열 조합/포맷팅에는 `$string.interpolate()`나 템플릿 리터럴을 사용하세요. 자세한 내용은 `stringbuilder.md`를 참고하세요.

## 관련 모듈
- API 상세: [`extension_string_api.md`](./extension_string_api.md)
