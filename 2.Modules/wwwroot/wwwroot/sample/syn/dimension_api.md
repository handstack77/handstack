# syn.$d API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$d` (원본: `context.$dimension`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 1058~1270번째 줄) |
| 예제 페이지 | `/sample/syn/dimension.html` |
| 의존 모듈 | `syn.$string`(toBoolean, toNumber), `syn.$l`(getElement), `syn.$object`(isNumber) |

## 속성
공개 속성이 없습니다. `syn.$d`는 전부 메서드로만 구성됩니다.

## 메서드
### `syn.$d.getDocumentSize(isTopWindow = false)`
- 설명: `scrollWidth`/`offsetWidth`/`clientWidth` 등을 비교한 최대값으로 문서 전체 크기와 뷰포트(frame) 크기를 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | isTopWindow | `boolean` | N | `true`이면 최상위(top) 문서를 기준으로 계산합니다. 기본값 `false`. |
- 반환값: `{ width, height, frameWidth, frameHeight }` — 모두 `number`.
- 예시
  ```js
  const size = syn.$d.getDocumentSize();
  ```

### `syn.$d.getWindowSize(isTopWindow = false)`
- 설명: 현재(또는 최상위) 윈도우의 `innerWidth`/`innerHeight`를 조회합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | isTopWindow | `boolean` | N | `true`이면 최상위(top) 윈도우를 기준으로 계산합니다. 기본값 `false`. |
- 반환값: `{ width, height }` — 모두 `number`.
- 예시
  ```js
  const size = syn.$d.getWindowSize();
  ```

### `syn.$d.getScrollPosition(el)`
- 설명: 지정한 노드(또는 생략 시 문서)의 스크롤 위치를 조회합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | N | 대상 노드 또는 노드 id. 생략 시 `document`의 스크롤 위치를 반환합니다. |
- 반환값: `{ left, top }` — 모두 `number`.
- 예시
  ```js
  const scroll = syn.$d.getScrollPosition('myElement');
  ```

### `syn.$d.getMousePosition(evt)`
- 설명: 이벤트 객체의 `pageX`/`pageY`(또는 `clientX`/`clientY` + 스크롤 보정)와 상대 좌표(`layerX`/`layerY` 또는 `offsetX`/`offsetY`)를 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | evt | `Event` | N | 마우스 이벤트 객체. 생략 시 `context.event`/`top.event`를 사용합니다. |
- 반환값: `{ x, y, relativeX, relativeY }` — 모두 `number`.
- 예시
  ```js
  el.addEventListener('click', (evt) => {
      const pos = syn.$d.getMousePosition(evt);
  });
  ```

### `syn.$d.offset(el)`
- 설명: `getBoundingClientRect()`와 문서 스크롤 위치를 합산하여 문서 기준 절대 좌표를 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 노드 또는 노드 id. |
- 반환값: `{ top, left } | null` — 대상이 없으면 `null`.
- 예시
  ```js
  const pos = syn.$d.offset('myElement');
  ```

### `syn.$d.offsetLeft(el)`
- 설명: `offsetParent`를 따라 올라가며 `offsetLeft`를 누적하여 최상위 노드까지의 left 거리 합계를 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 노드 또는 노드 id. |
- 반환값: `number`
- 예시
  ```js
  const left = syn.$d.offsetLeft('myElement');
  ```

### `syn.$d.parentOffsetLeft(el)`
- 설명: 대상 노드와 직속 부모 노드 간의 left 거리만 계산합니다. 생략 시 `document.documentElement` 또는 `document.body`를 기준으로 합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | N | 대상 노드 또는 노드 id. |
- 반환값: `number`
- 예시
  ```js
  const left = syn.$d.parentOffsetLeft('myElement');
  ```

### `syn.$d.offsetTop(el)`
- 설명: `offsetParent`를 따라 올라가며 `offsetTop`을 누적하여 최상위 노드까지의 top 거리 합계를 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 노드 또는 노드 id. |
- 반환값: `number`
- 예시
  ```js
  const top = syn.$d.offsetTop('myElement');
  ```

### `syn.$d.parentOffsetTop(el)`
- 설명: 대상 노드와 직속 부모 노드 간의 top 거리만 계산합니다. 생략 시 `document.documentElement` 또는 `document.body`를 기준으로 합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | N | 대상 노드 또는 노드 id. |
- 반환값: `number`
- 예시
  ```js
  const top = syn.$d.parentOffsetTop('myElement');
  ```

### `syn.$d.getSize(el)`
- 설명: `getComputedStyle`을 이용해 padding/margin을 반영한 콘텐츠 크기, client/offset/margin 크기를 함께 계산합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 노드 또는 노드 id. |
- 반환값: `{ width, height, clientWidth, clientHeight, offsetWidth, offsetHeight, marginWidth, marginHeight } | null`
- 예시
  ```js
  const size = syn.$d.getSize('myElement');
  ```

### `syn.$d.measureWidth(text, fontSize)`
- 설명: 화면에 보이지 않는 임시 `<div>`를 생성해 지정된 텍스트의 렌더링 폭을 측정합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | `string` | Y | 측정할 텍스트. |
  | fontSize | `string` | N | CSS font-size 값(예: `'14px'`). 생략 시 상속값(`inherit`)을 사용합니다. |
- 반환값: `string` — 계산된 CSS 너비 값(예: `'82px'`). `document.body`가 없으면 `'0px'`.
- 예시
  ```js
  const width = syn.$d.measureWidth('hello world', '14px');
  ```

### `syn.$d.measureHeight(text, width, fontSize)`
- 설명: 지정된 너비(`width`)로 줄바꿈된 텍스트의 렌더링 높이를 측정합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | `string` | Y | 측정할 텍스트. |
  | width | `string` | N | CSS width 값(예: `'200px'`). 생략 시 `'auto'`. |
  | fontSize | `string` | N | CSS font-size 값. 생략 시 상속값(`inherit`). |
- 반환값: `string` — 계산된 CSS 높이 값. `document.body`가 없으면 `'0px'`.
- 예시
  ```js
  const height = syn.$d.measureHeight('hello world', '200px', '14px');
  ```

### `syn.$d.measureSize(text, fontSize, maxWidth = '800px')`
- 설명: `measureWidth`와 `measureHeight`를 조합하여 `maxWidth`를 초과하지 않는 범위에서 텍스트의 너비/높이를 함께 측정합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | text | `string` | Y | 측정할 텍스트. `null`/`undefined`이면 `null`을 반환합니다. |
  | fontSize | `string` | N | CSS font-size 값. |
  | maxWidth | `string \| number` | N | 최대 너비. 숫자만 넘기면 `px` 단위로 처리합니다. 기본값 `'800px'`. |
- 반환값: `{ width, height } | null` — 각각 CSS 크기 문자열.
- 예시
  ```js
  const { width, height } = syn.$d.measureSize('안녕하세요', '14px', '400px');
  ```
