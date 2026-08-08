# SourceEditor (syn.uicontrols.$sourceeditor)

## 이 컨트롤은 무엇인가요?

`SourceEditor`는 마이크로소프트의 [Monaco Editor](https://microsoft.github.io/monaco-editor/)(VS Code에서 사용하는 것과 같은 코드 편집 엔진)를 감싼 syn.uicontrols 컨트롤입니다. `<syn_sourceeditor>` 태그를 화면에 배치하면, 컨트롤이 초기화되면서 다음과 같은 동작이 일어납니다.

1. 원래 배치했던 엘리먼트는 `id="<원래id>_hidden"`으로 이름이 바뀌고 화면에서 숨겨집니다(`display: none`). 이 엘리먼트는 옵션 값을 보관하는 용도로만 남습니다.
2. 같은 부모 아래에 `id="<원래id>"`를 그대로 물려받은 새 `<div>`가 만들어지고, 그 안에 실제 Monaco 에디터(`monaco.editor.create(...)`)가 렌더링됩니다.
3. Monaco 엔진 자체(`/lib/monaco-editor/min/vs/loader.js`)는 최초 1회만 비동기로 로드되며, 로드가 끝나기 전에 여러 개의 `<syn_sourceeditor>`가 있으면 대기열(`editorPendings`)에 쌓였다가 로드 완료 후 순서대로 초기화됩니다.

HtmlEditor(WYSIWYG)와의 차이

| 구분 | HtmlEditor (`$htmleditor`) | SourceEditor (`$sourceeditor`) |
| --- | --- | --- |
| 기반 엔진 | [TinyMCE](https://www.tiny.cloud/) | [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code 편집 엔진) |
| 편집 대상 | 서식 있는 문서(HTML 리치 텍스트) — 굵게, 표, 이미지 삽입 등 | 소스 코드/구조화된 텍스트 — JavaScript, JSON, SQL, HTML 등 |
| 결과물 | HTML 마크업 문자열 | 언어 문법에 맞는 순수 텍스트(소스 코드) 문자열 |
| 대표 기능 | 툴바(굵게/이미지/표), 이미지 업로드(`fileManagerServer`) | 문법 강조(syntax highlight), 줄 번호, 미니맵, 코드 접기 |
| 용도 예 | 게시판 본문, 이메일 템플릿, 공지사항 | 스크립트/쿼리 편집, 설정 JSON 편집, 로그/코드 뷰어 |

즉, "사람이 읽는 문서를 예쁘게 꾸미는 것"이 목적이면 HtmlEditor를, "코드나 JSON처럼 문법이 있는 텍스트를 정확하게 편집하는 것"이 목적이면 SourceEditor를 사용합니다.

## 언제 사용하나요?

- JavaScript, JSON, SQL, HTML, XML 등 특정 언어 문법의 소스 코드를 화면에서 직접 편집해야 할 때
- 줄 번호, 문법 강조, 미니맵 같은 코드 편집기 UI가 필요할 때
- 설정 값(JSON)이나 쿼리문처럼 형식이 엄격한 텍스트를 사용자가 직접 입력/수정하게 할 때
- 단순한 여러 줄 텍스트(메모 등)만 필요하다면 `TextArea`(CodeMirror 기반, 더 가벼움)를, 서식 있는 문서 편집이 필요하다면 `HtmlEditor`(TinyMCE 기반)를 대신 검토하세요.

## 빠른 시작

1. 페이지에 `<syn_sourceeditor>` 태그를 배치하고 `id`, `syn-datafield`, `syn-options` 속성을 지정합니다.

```html
<syn_sourceeditor id="txtEditor1"
                   syn-datafield="SourceCode"
                   syn-options="{language: 'javascript', theme: 'vs-dark', minimap: {enabled: true}}"></syn_sourceeditor>
```

2. 페이지 하단에 `syn.loader.js` 스크립트 한 줄만 추가하면, 로더가 필요한 CSS/JS(`SourceEditor.js`, `SourceEditor.css`, Monaco 엔진 로더)를 자동으로 주입하고 컨트롤을 초기화합니다.

```html
<script src="/js/syn.loader.js"></script>
```

3. 값을 읽거나 설정할 때는 페이지 스크립트에서 `syn.uicontrols.$sourceeditor`를 사용합니다.

```js
// 현재 값 조회
var code = syn.uicontrols.$sourceeditor.getValue('txtEditor1');

// 값 설정
syn.uicontrols.$sourceeditor.setValue('txtEditor1', 'function hello() {\n\talert("Hello world!");\n}');

// 값 초기화
syn.uicontrols.$sourceeditor.clear('txtEditor1');
```

> Monaco 에디터는 비동기로 로드됩니다. 컨트롤이 아직 초기화되기 전(스크립트 로드 중)에는 `getValue`/`setValue`가 대상을 찾지 못할 수 있으므로, 페이지 로드 직후 곧바로 호출하기보다는 버튼 클릭 등 사용자 이벤트 시점에 호출하는 것이 안전합니다.

## 예제 실행하기

이 폴더의 `example` 디렉토리에 초보자용 실행 예제가 있습니다. 웹 서버를 통해 `/uicontrols/SourceEditor/example/*.html` 경로로 접속해서 바로 확인할 수 있습니다.

- `basic.html`: JavaScript 모드 기본 에디터를 배치하고 `getValue`/`setValue`/`clear` 버튼으로 값을 다루는 가장 단순한 예제
- `language-mode.html`: `language` 옵션을 JSON/HTML 등으로 바꿔가며 같은 컨트롤이 언어별로 어떻게 강조되는지 비교하는 예제
- `events.html`: Monaco 자체 이벤트 API(`getControl().editor.onDidChangeModelContent`)로 변경 이벤트를 감지하고, `getValue`/`setValue`/`clear`도 함께 보여주는 예제

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하도록 만들어졌습니다.

## 더 알아보기

- 전체 옵션(Options), 메서드, 이벤트(및 알려진 제약사항) 목록은 같은 폴더의 [API.md](./API.md) 문서를 참고하세요.
- 실제 소스 코드는 `SourceEditor.js`, `SourceEditor.css` 파일에서 확인할 수 있습니다.
- Monaco 에디터 자체의 옵션/API는 [Monaco Editor 공식 문서](https://microsoft.github.io/monaco-editor/docs.html)를 참고하세요. `syn-options`에 지정한 값은 `monaco.editor.create(container, setting)`에 그대로 전달되므로, 이 문서에 표로 정리한 옵션 외에도 Monaco가 지원하는 모든 생성 옵션(`IStandaloneEditorConstructionOptions`)을 사용할 수 있습니다.
