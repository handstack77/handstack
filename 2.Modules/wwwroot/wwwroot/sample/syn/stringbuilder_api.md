# stringbuilder (syn.$sb) API 참조 - 사용 중단

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$sb` (현재 syn.js에 미구현 - 아래 "확인 방법" 참고) |
| 소스 위치 | 없음 - `2.Modules/wwwroot/wwwroot/js/syn.js`(약 12,000줄) 전체에서 `stringbuilder`, `$sb`, `StringBuilder`, `appendFormat`, `convertToArray` 검색 결과 0건 |
| 예제 페이지 | `/sample/syn/stringbuilder.html` (사용 중단 안내만 포함) |
| 의존 모듈 | 해당 없음 |

## 확인 방법
아래 명령으로 현재 `syn.js`에 관련 구현이 없음을 직접 확인할 수 있습니다.
```bash
grep -ni "stringbuilder\|\$sb\b\|StringBuilder\|appendFormat\|convertToArray" 2.Modules/wwwroot/wwwroot/js/syn.js
```
이 검색은 매칭되는 코드를 찾지 못합니다(전역 모듈로 등록된 것은 `context.$array`, `context.$string`, `context.$date`, `context.$number`, `context.$object` 등뿐입니다).

## 과거 API (참고용, 현재 미동작)
아래는 `stringbuilder.js`가 과거 호출하던 API 시그니처를 문서화한 것으로, 현재 syn.js에서는 호출할 수 없습니다. 실제 코드에서는 사용하지 마세요.

### `syn.$sb.append(text)` — 미구현
- 문자열을 내부 버퍼에 누적하는 용도로 추정됩니다.

### `syn.$sb.appendFormat(format, ...args)` — 미구현
- `{0}`, `{1}` 형태의 포맷 플레이스홀더에 인자를 대입해 누적하는 용도로 추정됩니다.

### `syn.$sb.convertToArray(value)` — 미구현
- 누적된 버퍼 또는 인자를 배열로 변환하는 용도로 추정됩니다.

### `syn.$sb.clear()` — 미구현
- 내부 버퍼를 초기화하는 용도로 추정됩니다.

### `syn.$sb.toString()` — 미구현
- 누적된 버퍼를 최종 문자열로 반환하는 용도로 추정됩니다.

## 대체 방법
| 과거 stringbuilder API | 현재 대체 방법 |
|---|---|
| `append` | 문자열 연결(`+`, 템플릿 리터럴) 또는 배열 `push()` 후 `join()` |
| `appendFormat` | [`$string.interpolate(text, json, options)`](./extension_string_api.md#stringinterpolatetext-json-options--) |
| `convertToArray` | [`$string.split(val, char)`](./extension_string_api.md#stringsplitval-char--) 또는 [`$array.split(value, flag)`](./extension_array_api.md#arraysplitvalue-flag--) |
| `clear` | 새 변수/배열 재할당 |
| `toString` | 문자열 템플릿 리터럴 또는 배열 `join()` |

상세 사용법은 [`extension_string.md`](./extension_string.md), [`extension_string_api.md`](./extension_string_api.md)를 참고하세요.
