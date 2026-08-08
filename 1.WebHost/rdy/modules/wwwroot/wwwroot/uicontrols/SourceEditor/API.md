# SourceEditor API 참조

`syn.uicontrols.$sourceeditor`

## 마크업

```html
<syn_sourceeditor id="txtEditor1"
                   syn-datafield="SourceCode"
                   syn-options="{language: 'javascript', theme: 'vs-dark', minimap: {enabled: true}}"></syn_sourceeditor>
```

- 태그 이름 `syn_sourceeditor`는 `syn.loader.js`가 `SYN_` 접두사를 인식해 `sourceeditor` 타입 컨트롤로 매핑하는 규칙을 따릅니다(`case 'sourceeditor'` → `SourceEditor.js`/`SourceEditor.css` 로드).
- `syn-options` : JSON 형식의 문자열로 옵션(`defaultSetting`)을 덮어씁니다. 이 값은 그대로 `monaco.editor.create(container, setting)`에 전달됩니다.
- 컨트롤이 초기화되면 원래 태그는 `id="<원래id>_hidden"`으로 숨겨지고, 같은 `id`를 가진 새 `<div>`가 만들어져 그 안에 Monaco 에디터가 렌더링됩니다. 이후 `getValue`/`setValue` 등 API는 원래 지정했던 `id`를 그대로 사용합니다.

## Options (defaultSetting)

`SourceEditor.js`의 `defaultSetting`에 정의된 값입니다. `syn-options` 속성으로 필요한 값만 덮어써서 사용합니다. 여기 표에 없는 값이라도 Monaco의 [`IStandaloneEditorConstructionOptions`](https://microsoft.github.io/monaco-editor/docs.html)에 해당하는 옵션이면 함께 전달할 수 있습니다.

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `width` | `'100%'` | 에디터 컨테이너 너비. |
| `height` | `'360px'` | 에디터 컨테이너 높이. |
| `language` | `'javascript'` | 문법 강조에 사용할 언어 모드. Monaco가 지원하는 언어 id(`json`, `typescript`, `html`, `css`, `sql`, `xml`, `markdown`, `python` 등)를 사용할 수 있습니다. |
| `minimap` | `{ enabled: false }` | 코드 축소판(미니맵) 표시 여부. |
| `roundedSelection` | `false` | 선택 영역 모서리를 둥글게 표시할지 여부. |
| `scrollBeyondLastLine` | `false` | 마지막 줄 이후로도 스크롤이 가능하게 할지 여부. |
| `readOnly` | `false` | `true`이면 읽기 전용 에디터가 됩니다. |
| `lineNumbers` | `'on'` | 줄 번호 표시 방식(`'on'`, `'off'`, `'relative'`, `'interval'`). |
| `theme` | `'vs-dark'` | 에디터 테마. Monaco 내장 테마 `'vs'`(밝은 테마), `'vs-dark'`(어두운 테마), `'hc-black'`(고대비) 등을 사용할 수 있습니다. |
| `dataType` | `'string'` | 값의 데이터 타입 표기. |
| `basePath` | `'/lib/monaco-editor/min/vs'` | Monaco 엔진 로더 경로. `syn.Config.DomainBaseUrl`이 현재 origin과 다르면 자동으로 해당 도메인 기준 경로로 치환됩니다. |
| `belongID` | `null` | 소속 그룹/컨테이너 식별자. |
| `controlText` | `null` | 컨트롤에 표시할 보조 텍스트. |
| `validators` | `null` | 유효성 검증 설정. |
| `transactConfig` | `null` | 데이터 송수신(트랜잭션) 관련 설정. |
| `triggerConfig` | `null` | 트리거 동작 관련 설정. |

## 메서드

`syn.uicontrols.$sourceeditor.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 매개변수 | 반환값 | 설명 |
| --- | --- | --- | --- |
| `getValue` | `elID`, `meta` | `string` | 에디터의 현재 텍스트 값을 반환합니다. |
| `setValue` | `elID`, `value`, `meta` | 없음 | 에디터의 텍스트 값을 설정합니다. |
| `clear` | `elID`, `isControlLoad` | 없음 | 에디터 값을 빈 문자열로 초기화합니다. |
| `layoutResize` | `elID` | 없음 | 에디터 레이아웃을 다시 계산합니다(`editor.layout()`). 컨테이너 크기가 코드로 바뀐 직후 등에 사용합니다. 참고로 브라우저 창 크기 변경(`resize`)은 모든 SourceEditor 인스턴스에 대해 자동으로 처리됩니다. |
| `getActions` | `elID` | `array \| null` | Monaco `editor.getActions()` 결과(에디터에 등록된 액션 목록)를 반환합니다. |
| `getControl` | `elID` | `object \| null` | 내부 관리 객체 `{ id, editor, setting }`를 반환합니다. `editor`는 Monaco의 `IStandaloneCodeEditor` 인스턴스이므로, 아래 "참고"에서 설명하는 이유로 이 인스턴스를 통해 Monaco 공식 API를 직접 호출하는 것이 권장됩니다. |
| `controlLoad` | `elID`, `setting` | 없음 | 컨트롤 초기화 진입점입니다. syn 프레임워크가 페이지 로드 시 자동으로 호출하며, 직접 호출할 필요는 없습니다(Monaco 엔진이 아직 로드되지 않았으면 내부 대기열에 넣었다가 로드 완료 후 초기화합니다). |
| `setLocale` | `elID`, `translations`, `control`, `options` | 없음 | 다국어 텍스트 적용 훅입니다. 현재 구현은 빈 함수(별도 동작 없음)입니다. |

### ⚠️ 참고용 메서드 — 현재 구현에 알려진 제약(버그)이 있음

아래 메서드들은 `SourceEditor.js`(v2026.2.25) 소스에 정의는 되어 있지만, 함수 선언에 `elID` 매개변수가 없는 상태로 내부에서 `elID` 변수를 참조하고 있습니다. 즉, 호출 스코프에 전역 변수 `elID`가 존재하지 않는 한 실제로 호출하면 `ReferenceError: elID is not defined`가 발생합니다.

| 메서드 | 매개변수(선언부) | 의도된 기능 |
| --- | --- | --- |
| `applyEdits` | `text`, `position` | 지정 위치(또는 현재 커서 위치)에 텍스트를 삽입/치환 |
| `getValueInRange` | `position` | 지정 범위의 텍스트 조회 |
| `getContentLine` | `text` | 특정 문자열이 포함된 줄 번호 조회 |
| `setSelection` | `range` | 지정 범위를 선택 영역으로 지정 |
| `revealLine` | `line` | 지정한 줄로 스크롤 이동 |
| `findSelection` | `text` | 찾기 위젯을 열어 텍스트 검색 |

대안: 이 기능들이 필요하면 `getControl(elID).editor`로 Monaco 인스턴스를 직접 얻어, 위 메서드들이 내부적으로 호출하던 Monaco 공식 API를 그대로 사용하세요.

```js
var control = syn.uicontrols.$sourceeditor.getControl('txtEditor1');
if (control && control.editor) {
    var editor = control.editor;

    // revealLine(line) 대신
    editor.revealLine(3);

    // setSelection(range) 대신
    editor.setSelection(range);

    // getValueInRange(position) 대신
    var text = editor.getModel().getValueInRange(range);
}
```

## 이벤트 (syn-events)

SourceEditor는 다른 syn.uicontrols 컨트롤과 달리 `syn-events` 속성을 통한 이벤트 자동 연결을 지원하지 않습니다. `SourceEditor.js` 내부에는 `syn-events`를 읽어 `event.<id>_<이벤트명>` 핸들러에 연결하는 로직이 없으며, 자체적으로는 브라우저 `resize` 이벤트에 대한 내부 처리(`editor.layout()` 재호출)와 `Ctrl+Space` 키 입력 기본 동작 방지만 등록되어 있습니다.

변경 감지, 포커스/블러 감지 등이 필요하면 `getControl(elID).editor`로 얻은 Monaco 인스턴스에 Monaco의 공식 이벤트 API를 직접 등록하세요.

| Monaco 이벤트 API | 설명 |
| --- | --- |
| `editor.onDidChangeModelContent(handler)` | 에디터 내용이 변경될 때 발생합니다. (`change`에 해당) |
| `editor.onDidBlurEditorText(handler)` | 에디터가 포커스를 잃을 때 발생합니다. (`blur`에 해당) |
| `editor.onDidFocusEditorText(handler)` | 에디터가 포커스를 얻을 때 발생합니다. (`focus`에 해당) |
| `editor.onDidChangeCursorPosition(handler)` | 커서 위치가 바뀔 때 발생합니다. |

```js
var control = syn.uicontrols.$sourceeditor.getControl('txtEditor1');
if (control && control.editor) {
    control.editor.onDidChangeModelContent(function (evt) {
        syn.$l.eventLog('txtEditor1_change', control.editor.getValue());
    });
}
```

> 컨트롤이 비동기(Monaco 엔진 로드 후)로 초기화되므로, 위 이벤트 등록 코드는 `pageLoad` 직후가 아니라 버튼 클릭 등 사용자가 페이지를 조작한 이후(에디터 초기화가 끝난 시점) 또는 `getControl`이 `null`이 아님을 확인한 뒤에 실행하는 것이 안전합니다.

## 참고

- 실제 구현 파일: `SourceEditor.js`, `SourceEditor.css`
- 내부적으로 [Monaco Editor](https://microsoft.github.io/monaco-editor/)를 사용하며, 엔진 스크립트는 `basePath`(`/lib/monaco-editor/min/vs`)에서 최초 1회만 비동기로 로드됩니다.
- Monaco 엔진이 아직 로드되지 않은 상태에서 여러 `<syn_sourceeditor>`가 배치돼 있으면, 로드가 끝날 때까지 내부 대기열(`editorPendings`)에 쌓였다가 순서대로 초기화됩니다.
- `applyEdits`, `getValueInRange`, `getContentLine`, `setSelection`, `revealLine`, `findSelection` 메서드는 현재 소스 기준 `elID` 매개변수 누락 버그가 있어 직접 호출 시 오류가 발생합니다. 위 "참고용 메서드" 절의 대안(`getControl(elID).editor`로 Monaco API 직접 호출)을 사용하세요.
