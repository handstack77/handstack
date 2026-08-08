# TextArea API 참조

`syn.uicontrols.$textarea`

## 마크업

```html
<textarea id="txtMemo"
          syn-options="{width: '100%', height: '200px', lineNumbers: true}"
          syn-events="['change', 'blur']"
          maxlengthB="200">기본값</textarea>
```

- `syn-options` : JSON 형식의 문자열로 옵션(`defaultSetting`)을 덮어씁니다.
- `syn-events` : 이 요소에서 사용할 이벤트 이름 배열(문자열)입니다. 페이지 스크립트의 `event.<엘리먼트ID>_<이벤트명>` 핸들러와 자동으로 연결됩니다. (`toSynControl: true`일 때만 동작, 아래 "이벤트" 참고)
- `maxlength` / `maxlengthB` : 입력 가능한 최대 길이를 제한합니다. `maxlengthB`가 있으면 이 값이 우선하며 바이트 기준(한글 등 비영문 문자는 3바이트로 계산)으로 초과 여부를 검사합니다. `maxlengthB`가 있으면 실제 `maxlength` 속성값으로 복사되어 적용됩니다.

## Options (defaultSetting)

`TextArea.js`의 `defaultSetting`에 정의된 값 그대로입니다. `syn-options` 속성으로 필요한 값만 덮어써서 사용합니다.

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `width` | `'100%'` | 컨트롤 너비. 엘리먼트에 인라인 `style.width`가 지정돼 있으면 그 값이 우선됩니다. |
| `height` | `'240px'` | 컨트롤 높이. 엘리먼트에 인라인 `style.height`가 지정돼 있으면 그 값이 우선됩니다. |
| `indentUnit` | `4` | `toSynControl: true`(CodeMirror 모드)일 때 들여쓰기 폭(칸 수). |
| `lineNumbers` | `true` | `toSynControl: true`(CodeMirror 모드)일 때 줄 번호 표시 여부. |
| `toSynControl` | `true` | `true`이면 `<textarea>`를 CodeMirror 에디터로 변환합니다(줄 번호, 들여쓰기 등 코드 편집 UI 제공). `false`이면 순수 HTML `<textarea>` 그대로 사용하고, `maxlength`/`maxlengthB` 초과 알림 기능만 덧붙습니다. |
| `resize` | `false` | `false`이면 `el.style.resize = 'none'`으로 설정해 사용자가 크기를 조절하지 못하게 막습니다. |
| `dataType` | `'string'` | 값의 데이터 타입 표기. |
| `belongID` | `null` | 소속 그룹/컨테이너 식별자. |
| `getter` | `false` | 값 조회 시 사용할 커스텀 로직 연결 여부. |
| `setter` | `false` | 값 설정 시 사용할 커스텀 로직 연결 여부. |
| `controlText` | `null` | 컨트롤에 표시할 보조 텍스트. |
| `validators` | `null` | 유효성 검증 설정. |
| `transactConfig` | `null` | 데이터 송수신(트랜잭션) 관련 설정. |
| `triggerConfig` | `null` | 트리거 동작 관련 설정. |

## 메서드

`syn.uicontrols.$textarea.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 매개변수 | 반환값 | 설명 |
| --- | --- | --- | --- |
| `getValue` | `elID` | `string` | 현재 입력된 텍스트를 반환합니다. `toSynControl: true`이면 CodeMirror 에디터의 값을, 아니면 `<textarea>`의 `value`를 반환합니다. |
| `setValue` | `elID`, `value` | 없음 | 텍스트 값을 설정합니다. |
| `clear` | `elID`, `isControlLoad` | 없음 | 텍스트 값을 빈 문자열로 초기화합니다. |
| `countLines` | `elID` | `number` | 현재 텍스트를 `\n` 기준으로 나눈 줄 수를 반환합니다. |
| `getControl` | `elID` | `object \| null` | 내부 관리 객체(`{ id, editor, setting }`)를 반환합니다. `editor`는 `toSynControl: true`일 때 CodeMirror 인스턴스입니다. CodeMirror 자체 API가 필요할 때 사용합니다. |
| `controlLoad` | `elID`, `setting` | 없음 | 컨트롤 초기화 로직입니다. syn 프레임워크가 페이지 로드 시 자동으로 호출하며, 직접 호출할 필요는 없습니다. |
| `setLocale` | `elID`, `translations`, `control`, `options` | 없음 | 다국어 텍스트 적용 훅입니다. 현재 구현은 빈 함수(별도 동작 없음)입니다. |

## 이벤트 (syn-events)

`syn-events="[...]"`에 나열한 이벤트 이름은 `toSynControl: true`(기본값, CodeMirror 모드)일 때만 동작합니다. 각 이름은 CodeMirror 에디터의 `editor.on(이벤트명, handler)`에 그대로 전달되므로, [CodeMirror 5 이벤트](https://codemirror.net/5/doc/manual.html#events) 이름을 사용할 수 있습니다. 자주 쓰는 이벤트는 다음과 같습니다.

| 이벤트 | 설명 |
| --- | --- |
| `change` | 텍스트 내용이 변경되었을 때 발생합니다. |
| `blur` | 컨트롤이 포커스를 잃을 때 발생합니다. |
| `focus` | 컨트롤이 포커스를 얻을 때 발생합니다. |
| `cursorActivity` | 커서 위치나 선택 영역이 바뀔 때 발생합니다. |

이벤트 핸들러는 페이지 스크립트에서 다음과 같이 정의합니다.

```js
let $pagename = {
    event: {
        txtMemo_change(cm, change) {
            syn.$l.eventLog('txtMemo_change', cm.getValue());
        }
    }
}
```

> 참고: `maxlength` 또는 `maxlengthB` 속성이 지정되어 있으면, `syn-events`에 `blur`를 등록하지 않아도 내부적으로 blur 시 글자 수(바이트 수) 초과 여부를 검사해 알림을 띄우는 동작이 항상 추가됩니다.
>
> `toSynControl: false`(순수 `<textarea>` 모드)로 설정하면 `syn-events`로 등록한 커스텀 이벤트는 연결되지 않으며, `maxlength`/`maxlengthB`에 의한 blur 시 초과 알림만 동작합니다.

## 참고

- 실제 구현 파일: `TextArea.js`, `TextArea.css`
- `toSynControl: true`일 때 내부적으로 [CodeMirror 5](https://codemirror.net/5/)를 사용합니다. 세부 옵션은 CodeMirror 공식 문서를 참고하세요.
- 글자 수 제한 검사는 UTF-8 바이트 기준으로 계산되며, 한글 등 비영문 문자는 3바이트로 계산됩니다.
