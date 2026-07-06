# stringbuilder 사용법 (syn.$sb) - 사용 중단

## 개요
`stringbuilder.html`/`stringbuilder.js` 예제는 과거 `syn.$sb`(StringBuilder)라는 이름으로 문자열을 누적(append)하고, 포맷 문자열(`appendFormat`)을 적용하고, 배열로 변환(`convertToArray`)하고, 초기화(`clear`)하고, 최종 문자열을 얻는(`toString`) 기능을 시연하기 위해 작성되었습니다.

이 문서 작성 시점 기준으로 현재 `2.Modules/wwwroot/wwwroot/js/syn.js`(약 12,000줄)에는 `syn.$sb`, `StringBuilder`, `appendFormat`, `convertToArray` 등 관련 구현이 전혀 존재하지 않습니다. `syn.js` 전체를 대상으로 `stringbuilder`, `$sb`, `StringBuilder`, `appendFormat`, `convertToArray` 키워드로 검색해도 일치하는 코드가 없으며, `2.Modules/wwwroot/wwwroot/js/syn.js`에서 전역에 등록되는 모듈은 `$array`, `$string`, `$date`, `$number`, `$object` 등 확장 네임스페이스뿐입니다. 즉 `stringbuilder.html`/`stringbuilder.js`가 호출하던 API는 현재 라이브러리에서 제거되었거나, 애초에 별도 배포판에만 존재했던 기능으로 보입니다.

## 예제 페이지의 현재 상태
`/sample/syn/stringbuilder.html`과 `stringbuilder.js`는 삭제하지 않고 남겨두되, 다음과 같이 처리했습니다.
- `stringbuilder.html` 상단에 빨간색 굵은 글씨로 "본 예제는 더 이상 유효하지 않습니다"라는 한국어 안내 문구를 추가했습니다.
- `stringbuilder.js`의 각 버튼 클릭 핸들러는 더 이상 존재하지 않는 `syn.$sb.*`를 호출하지 않도록 수정되었고, 대신 사용 중단 안내 메시지만 표시합니다(콘솔/런타임 예외가 발생하지 않습니다).
- 예제 페이지 자체의 마크업 구조(테이블, 버튼 id 등)는 과거 기록을 위해 그대로 유지했습니다.

## 지금은 무엇을 써야 하나
문자열을 조합하거나 포맷팅해야 한다면 전역 `$string` 확장을 사용하세요.
```js
// 과거(동작하지 않음): syn.$sb.append('Hello '); syn.$sb.append('World');
// 대체 1: 템플릿 리터럴로 직접 연결
const message = 'Hello ' + 'World';

// 대체 2: $string.interpolate()로 템플릿 치환
const message2 = $string.interpolate('#{greeting} #{name}', { greeting: 'Hello', name: 'World' });
```
배열 변환이 필요하다면 `$array`/`$string`의 `split()`을, 여러 줄의 값을 조합해야 한다면 배열의 `join()`을 사용하는 것으로 충분합니다.

## 실전 예제 페이지
- `/sample/syn/stringbuilder.html` - 사용 중단 안내만 확인하는 레거시 페이지
- `/sample/syn/extension_string.html` - `$string`의 실제 동작하는 대체 기능(특히 `interpolate()`)을 실습할 수 있는 페이지

## 주의 사항
- `syn.$sb`를 참조하는 기존 코드가 있다면 반드시 `$string` 기반 코드로 교체해야 합니다. 그대로 두면 `TypeError: Cannot read properties of undefined` 등의 런타임 오류가 발생합니다.
- 이 문서는 기능을 새로 구현한 것이 아니라, 현재 `syn.js`에 없는 기능임을 확인하고 안내하기 위한 문서입니다.

## 관련 모듈
- API 상세: [`stringbuilder_api.md`](./stringbuilder_api.md)
- 대체 기능 사용법: [`extension_string.md`](./extension_string.md)
