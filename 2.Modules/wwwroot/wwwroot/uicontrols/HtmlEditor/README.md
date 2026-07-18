# HtmlEditor (syn.uicontrols.$htmleditor)

## 이 컨트롤은 무엇인가요?

`HtmlEditor`는 [TinyMCE](https://www.tiny.cloud/)를 감싼 syn.uicontrols 컨트롤로, 게시판 본문이나 공지사항처럼 "서식 있는 문서(WYSIWYG)"를 편집할 때 사용합니다. 화면에 `<syn_htmleditor>` 태그를 배치하면 컨트롤이 초기화되면서 다음과 같은 일이 일어납니다.

1. 원래 배치했던 엘리먼트는 `id="<원래id>_hidden"`으로 이름이 바뀌고 화면에서 숨겨집니다(`display: none`). 이 엘리먼트에는 옵션 값(JSON)만 보관됩니다. 이때 원래 엘리먼트 안에 적어둔 HTML(태그 내부 콘텐츠)이 에디터의 초기 값으로 사용됩니다.
2. 같은 부모 아래 원래 `id`를 그대로 물려받은 새 `<div>`가 만들어지고, 그 안에 TinyMCE 에디터(`tinymce.init(setting)`)가 렌더링됩니다.
3. TinyMCE 엔진 자체(`/lib/tinymce/tinymce.min.js`)는 페이지에서 최초 1회만 비동기로 로드되며, 로드가 끝나기 전에 여러 개의 `<syn_htmleditor>`가 있으면 내부 대기열(`editorPendings`)에 쌓였다가 로드 완료 후 순서대로 초기화됩니다.
4. `syn-options`에 `repositoryID`를 지정하면, 에디터에 이미지를 붙여넣거나 드래그&드롭할 때 자동으로 파일 서버(`fileManagerServer`)에 업로드하고, 업로드된 이미지의 실제 경로로 `<img>` 태그를 교체해 줍니다.

### SourceEditor(코드 편집)와의 차이

| 구분 | HtmlEditor (`$htmleditor`) | SourceEditor (`$sourceeditor`) |
| --- | --- | --- |
| 기반 엔진 | [TinyMCE](https://www.tiny.cloud/) | [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code 편집 엔진) |
| 편집 대상 | 서식 있는 문서(HTML 리치 텍스트) — 굵게, 표, 이미지 삽입 등 | 소스 코드/구조화된 텍스트 — JavaScript, JSON, SQL, HTML 등 |
| 결과물 | HTML 마크업 문자열 | 언어 문법에 맞는 순수 텍스트(소스 코드) 문자열 |
| 대표 기능 | 툴바(굵게/이미지/표), 이미지 업로드(`repositoryID` + `fileManagerServer`) | 문법 강조(syntax highlight), 줄 번호, 미니맵, 코드 접기 |
| 용도 예 | 게시판 본문, 이메일 템플릿, 공지사항 | 스크립트/쿼리 편집, 설정 JSON 편집, 로그/코드 뷰어 |

즉, "사람이 읽는 문서를 예쁘게 꾸미고 이미지를 첨부하는 것"이 목적이면 HtmlEditor를, "코드나 JSON처럼 문법이 있는 텍스트를 정확하게 편집하는 것"이 목적이면 SourceEditor를 사용합니다.

## 언제 사용하나요?

- 게시판/공지사항 본문, 이메일 템플릿처럼 굵게/색상/표/이미지 등 서식이 필요한 긴 문서를 사용자가 직접 작성하게 할 때
- 문서 안에 이미지를 붙여넣거나 드래그&드롭으로 첨부해야 하고, 그 이미지를 파일 저장소(리포지토리)에 실제로 업로드해야 할 때
- 단순한 여러 줄 텍스트(메모 등)만 필요하다면 `TextArea`를, 소스 코드/JSON처럼 문법이 있는 텍스트를 편집해야 한다면 `SourceEditor`를 대신 검토하세요.

## 빠른 시작

1. 페이지에 `<syn_htmleditor>` 태그를 배치하고 `id`, `syn-datafield`, `syn-options` 속성을 지정합니다. 태그의 크기는 `style`의 `width`/`height`로 지정합니다.

```html
<syn_htmleditor id="edtComment" syn-datafield="Comment" style="width:100%; height:300px" syn-options="{
    repositoryID: 'BDLLE01', controlText: '메모', belongID: ['MD01'],
    plugins: ['autolink link image lists print hr anchor pagebreak searchreplace visualblocks visualchars code insertdatetime media nonbreaking table preview powerpaste advcode help'],
    toolbar: 'styleselect | bold forecolor backcolor table | alignleft aligncenter alignright | pagebreak link image | preview code help',
    resize: false
}"></syn_htmleditor>
```

2. 페이지 하단에 `syn.loader.js` 스크립트 한 줄만 추가하면, 로더가 필요한 CSS/JS(`HtmlEditor.js`, `HtmlEditor.css`, TinyMCE 엔진)를 자동으로 주입하고 컨트롤을 초기화합니다.

```html
<script src="/js/syn.loader.js"></script>
```

3. 값을 읽거나 설정할 때는 페이지 스크립트에서 `syn.uicontrols.$htmleditor`를 사용합니다.

```js
// 현재 값(HTML 문자열) 조회
var html = syn.uicontrols.$htmleditor.getValue('edtComment');

// 값 설정
syn.uicontrols.$htmleditor.setValue('edtComment', '<p>안녕하세요</p>');

// 값 초기화
syn.uicontrols.$htmleditor.clear('edtComment');
```

> TinyMCE는 비동기로 로드/초기화됩니다. 페이지 로드 직후 곧바로 `getValue`/`setValue`를 호출하기보다는, 버튼 클릭 등 사용자 이벤트 시점에 호출하거나 `{elID}_documentReady` 이벤트(아래 API.md 참고)가 발생한 뒤에 호출하는 것이 안전합니다.

> `repositoryID`를 지정하지 않으면 이미지 업로드 기능이 비활성화됩니다(붙여넣은 이미지는 `data:` URL 형태로 문서 안에 그대로 포함됩니다).

## 예제 실행하기

이 폴더의 `example` 디렉토리에 초보자용 실행 예제가 있습니다. 웹 서버를 통해 `/uicontrols/HtmlEditor/example/*.html` 경로로 접속해서 바로 확인할 수 있습니다.

- `basic.html`: 기본(default) 옵션 그대로 에디터를 배치하고 `getValue`/`setValue`/`clear` 버튼으로 값을 다루는 가장 단순한 예제
- `custom-toolbar.html`: `plugins`/`toolbar` 옵션을 직접 지정해 툴바를 목적에 맞게 구성하는 예제(실무 예시와 동일하게 표/미리보기/도움말 등을 추가)
- `events.html`: `{elID}_documentReady`, `{elID}_imageResized` 같은 컨트롤 고유 이벤트와 `isDirty`/`getValue`/`setValue`/`clear`를 함께 보여주는 예제
- `document.html`: 실무 전자결재/공지사항 본문의 흔한 패턴 - `validators:['require']` + 저장 시 `getValue() == ''` 재검증, 상신 후 `setMode(elID, 'readonly')`로 조회 전용 전환, 반려 시 다시 `'design'`으로 복귀

각 예제는 `<script src="/js/syn.loader.js"></script>` 한 줄만으로 동작하도록 만들어졌습니다.

## 더 알아보기

- 전체 옵션(Options), 메서드, 이벤트 목록은 같은 폴더의 [API.md](./API.md) 문서를 참고하세요.
- 실제 소스 코드는 `HtmlEditor.js`, `HtmlEditor.css` 파일에서 확인할 수 있습니다.
- `syn-options`에 지정한 값은 TinyMCE의 `tinymce.init(setting)`에 그대로 전달되므로, API.md에 표로 정리한 옵션 외에도 [TinyMCE 공식 설정 옵션](https://www.tiny.cloud/docs/tinymce/6/)을 함께 사용할 수 있습니다.
