# API 참조

## 모듈 정보
`template`은 자체 API 표면을 가진 `syn.js` 모듈이 아니라 새 예제 페이지 작성을 위한 스캐폴드 페이지입니다 (`2.Modules/wwwroot/wwwroot/sample/syn/template.html` / `template.js`). 이 페이지가 실제로 사용하는 API는 `extends: ['parsehtml']`로 가져오는 `parsehtml` mixin이 전부입니다.

## 속성/메서드
`template.js` 자체는 다음과 같은 빈 뼈대만 정의합니다.

| 구분 | 이름 | 설명 |
|---|---|---|
| `extends` | `['parsehtml']` | `parsehtml` mixin을 가져와 markdown/코드 하이라이트 렌더링을 사용합니다. |
| `hook` | `pageLoad()` | 현재는 빈 구현이며, 새 페이지 작성 시 초기화 로직을 채워 넣는 자리입니다. |
| `event` | (없음) | 현재는 빈 객체이며, 새 페이지 작성 시 `{id}_{이벤트명}` 핸들러를 채워 넣는 자리입니다. |

실제 노출되는 속성/메서드(예: `converter`, `hook.extendLoad`)에 대한 설명은 `parsehtml_api.md`를 참고하세요.
