# syn.$res API 참조

## 모듈 정보
| 항목 | 내용 |
|---|---|
| 전역 별칭 | `syn.$res` (원본: `context.$resource`) |
| 소스 위치 | `2.Modules/wwwroot/wwwroot/js/syn.js` (약 11618~11939번째 줄) |
| 예제 페이지 | `/sample/syn/resources.html` |
| 의존 모듈 | `syn.$l`(get, querySelector), `syn.$object`(isString, isNullOrUndefined, isObject, isArray), `syn.$string`(isNullOrEmpty, toBoolean), `syn.$w`(pageScript, argumentsExtend, fetchJson, getSSOInfo — `getSSOInfo`는 `syn.domain.js`에서만 정의됨), `syn.uicontrols`(모듈 컨트롤 번역 시) |

## 속성
| 이름 | 기본값 | 설명 |
|---|---|---|
| `localeID` | `'ko-KR'` | 현재 적용된 로케일 ID. `setLocale()` 호출 시 갱신됩니다. |
| `fullyQualifiedLocale` | `{ ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' }` | 축약 언어 코드 → 정식 로케일 문자열 매핑 테이블. |
| `translations` | `{}` | `add()`/`remove()`로 관리되는 번역 키-값 저장소. |
| `translateControls` | `[]` | 페이지 로드 시 `[syn-i18n]` 엘리먼트를 스캔하여 등록된 컨트롤 설명 배열. 각 항목은 `{ elID, key, bindSource, tag, module, type, options }` 형태입니다. |

## 메서드

### `syn.$res.add(id, val)`
- 설명: `translations` 저장소에 번역 키-값을 등록(덮어쓰기)합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | id | `string` | Y | 번역 키. |
  | val | `string \| string[] \| { Text: string }` | Y | 번역 값. `translateText()`는 문자열/배열(첫 요소)/`{ Text }` 객체 형태를 모두 처리합니다. |
- 반환값: 없음.
- 예시
  ```js
  syn.$res.add('greeting', '안녕하세요, HandStack!');
  ```

### `syn.$res.remove(id)`
- 설명: `translations` 저장소에서 지정 키를 삭제합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | id | `string` | Y | 삭제할 번역 키. |
- 반환값: 없음.
- 예시
  ```js
  syn.$res.remove('greeting');
  ```

### `syn.$res.interpolate(message, interpolations)`
- 설명: `message` 문자열 내 `#{key}` 형태의 플레이스홀더를 `interpolations` 객체의 동일 키 값으로 치환합니다. 키별 정규식을 내부 캐시(`interpolationRegexCache`)에 보관하여 재사용합니다. 화면 요소와 무관한 순수 문자열 함수입니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | message | `string` | Y | 플레이스홀더가 포함된 원본 문자열. |
  | interpolations | `object` | Y | 치환할 키-값 쌍. |
- 반환값: `string` — 치환된 문자열.
- 예시
  ```js
  const text = syn.$res.interpolate('환영합니다, #{name}님!', { name: '홍길동' });
  ```

### `syn.$res.getControl(el)`
- 설명: 엘리먼트(또는 id 문자열)로 `translateControls` 배열에서 대응하는 컨트롤 설명 객체를 찾습니다. `el.id`가 없으면 `tag`+`i18n-key` 조합으로, 있으면 `elID`+`tag`+`i18n-key` 조합으로 조회합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 엘리먼트 또는 id. |
- 반환값: `object | null` — 컨트롤 설명 객체(`{ elID, key, bindSource, tag, module, type, options }`) 또는 찾지 못하면 `undefined`/`null`.
- 예시
  ```js
  const control = syn.$res.getControl('demo_greeting');
  ```

### `syn.$res.translatePage()`
- 설명: `translateControls`에 등록된 모든 컨트롤에 대해 `translateControl()`을 순회 호출하여 화면 전체를 현재 `translations` 값으로 갱신합니다.
- 매개변수: 없음.
- 반환값: 없음.
- 예시
  ```js
  syn.$res.translatePage();
  ```

### `syn.$res.translateElement(el, options)`
- 설명: 지정한 엘리먼트 하나에 대해서만 `getControl()` + `translateControl()`을 호출하여 번역을 반영합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | el | `string \| HTMLElement` | Y | 대상 엘리먼트 또는 id. |
  | options | `object` | N | `translateText()`의 플레이스홀더 치환에 사용할 추가 값(내부적으로 `getSSOInfo()` 결과와 병합 시도). |
- 반환값: 없음. 대응하는 컨트롤이 없으면 아무 동작도 하지 않습니다.
- 예시
  ```js
  syn.$res.translateElement('demo_greeting');
  ```

### `syn.$res.translateControl(control, options)`
- 설명: 컨트롤 설명 객체를 받아 실제 DOM에 번역을 반영합니다. `control.module`이 없으면 `getBindSource(control)`로 얻은 DOM 속성(textContent 등)에 `translateText()` 결과를 대입하고, `control.module`이 있으면(UI 컨트롤 모듈) `syn.uicontrols['$' + control.module].setLocale(...)`을 호출합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | control | `object` | Y | `getControl()`로 얻은 컨트롤 설명 객체. |
  | options | `object` | N | 플레이스홀더 치환용 추가 값. |
- 반환값: 없음.
- 예시
  ```js
  const control = syn.$res.getControl('demo_greeting');
  syn.$res.translateControl(control);
  ```

### `syn.$res.translateText(control, options)`
- 설명: `control.key`에 대응하는 `translations` 값을 조회하여 실제로 표시될 텍스트를 계산합니다(DOM에는 반영하지 않는 순수 계산). 번역 값이 문자열/배열(첫 요소)/`{ Text }` 객체인 경우를 모두 처리합니다. 텍스트에 `#{key}` 패턴이 있으면 `syn.$w.getSSOInfo()`를 호출해 기본 interpolation 값으로 사용하려 시도합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | control | `object` | Y | `getControl()`로 얻은 컨트롤 설명 객체. |
  | options | `object` | N | `getSSOInfo()` 결과와 병합할 추가 interpolation 값. |
- 반환값: `string` — 계산된 표시 텍스트.
- 주의: 텍스트에 `#{key}` 패턴이 포함되어 있으면 `options` 유무와 무관하게 `syn.$w.getSSOInfo()`가 무조건 호출됩니다. `syn.js`만 로드된 환경(`syn.domain.js` 미로드)에서는 이 함수가 정의되어 있지 않아 `TypeError`가 발생할 수 있습니다.
- 예시
  ```js
  const control = syn.$res.getControl('demo_greeting');
  const text = syn.$res.translateText(control);
  ```

### `syn.$res.getBindSource(control)`
- 설명: `control.bindSource` 값을 실제 DOM 속성 이름으로 매핑합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | control | `object` | Y | `bindSource` 속성을 가진 객체(`{ bindSource: 'text' | 'content' | 'html' | 'url' | 'placeholder' | 'control' | 'value' }`). |
- 반환값: `string | null` — `text`→`innerText`, `content`→`textContent`, `html`→`innerHTML`, `url`→`src`, `placeholder`→`placeholder`, `control`→`controlText`, `value`→`value`. 매칭되지 않으면 `null`.
- 예시
  ```js
  const prop = syn.$res.getBindSource({ bindSource: 'content' }); // 'textContent'
  ```

### `syn.$res.setLocale(localeID)` (참고)
- 설명: 지정한 `localeID`의 로케일 JSON 파일(`syn.Config.LocaleAssetUrl` 또는 `SharedAssetUrl + 'language/'` 경로)을 fetch하여 `translations`에 병합한 뒤 `document.documentElement.lang`을 갱신하고 `translatePage()`를 호출하는 비동기 메서드입니다. 요청 대상 파일이 없거나 CORS 등으로 실패해도 내부적으로 예외를 잡아(`Warning` 로그) 페이지 동작에는 영향을 주지 않습니다. 이 문서의 필수 공개 API 목록에는 포함되지 않지만 소스 범위 내 실존하는 메서드로, 참고용으로 기재합니다.
- 매개변수
  | 이름 | 타입 | 필수 | 설명 |
  |---|---|---|---|
  | localeID | `string` | Y | 적용할 로케일 ID(예: `'en-US'`). |
- 반환값: `Promise<void>`
- 예시
  ```js
  await syn.$res.setLocale('en-US');
  ```
