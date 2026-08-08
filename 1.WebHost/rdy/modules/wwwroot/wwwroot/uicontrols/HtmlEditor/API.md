# HtmlEditor API 참조

`syn.uicontrols.$htmleditor`

## 마크업

```html
<syn_htmleditor id="edtComment" syn-datafield="Comment" style="width:100%; height:300px" syn-options="{
    repositoryID: 'BDLLE01', controlText: '메모', belongID: ['MD01'],
    plugins: ['autolink link image lists print hr anchor pagebreak searchreplace visualblocks visualchars code insertdatetime media nonbreaking table preview powerpaste advcode help'],
    toolbar: 'styleselect | bold forecolor backcolor table | alignleft aligncenter alignright | pagebreak link image | preview code help',
    resize: false
}"></syn_htmleditor>
```

- 태그 이름 `syn_htmleditor`는 `syn.loader.js`가 `SYN_` 접두사를 인식해 `htmleditor` 타입 컨트롤로 매핑하는 규칙을 따릅니다(`HtmlEditor.js`/`HtmlEditor.css` 및 TinyMCE 엔진을 자동 로드).
- `style`의 `width`/`height`가 에디터 컨테이너의 크기가 됩니다(지정하지 않으면 기본 320×240).
- 태그 내부에 적어둔 HTML(자식 엘리먼트/텍스트)은 에디터의 초기 콘텐츠로 그대로 사용됩니다.
- `syn-options` : JSON 형식의 문자열로 옵션(`defaultSetting`)을 덮어씁니다. 이 값은 그대로 `tinymce.init(setting)`에 전달되므로, 아래 표에 없는 TinyMCE 옵션도 함께 사용할 수 있습니다.
- 컨트롤이 초기화되면 원래 태그는 `id="<원래id>_hidden"`으로 숨겨지고, 같은 `id`를 가진 새 `<div>`가 만들어져 그 안에 TinyMCE 에디터가 렌더링됩니다. 이후 `getValue`/`setValue` 등 API는 원래 지정했던 `id`를 그대로 사용합니다.

## Options (defaultSetting)

`HtmlEditor.js`의 `defaultSetting`에 정의된 값입니다. `syn-options` 속성으로 필요한 값만 덮어써서 사용합니다.

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `repositoryID` | `null` | 이미지 업로드를 저장할 파일 저장소(리포지토리) 식별자. 지정해야 에디터 안에서 이미지 붙여넣기/업로드가 동작합니다(자세한 내용은 아래 "참고" 참고). |
| `dependencyID` | `null` | 업로드된 이미지들을 묶어 관리하는 임시 그룹 식별자. 지정하지 않으면 `isNumberTempDependency`에 따라 자동 생성됩니다. |
| `isNumberTempDependency` | `true` | `dependencyID`를 지정하지 않았을 때, 현재 시각 틱(tick) 값으로 임시 발급(`true`)할지, `$fileclient.getTemporaryDependencyID`로 발급(`false`)할지 결정합니다. |
| `fileManagerServer` | `''` | 이미지 업로드/조회 요청을 보낼 파일 서버 주소. 비어 있으면 `syn.Config.FileManagerServer` 값을 사용합니다. |
| `fileManagerPath` | `'/repository/api/storage'` | 파일 서버 API 경로. |
| `pageUploadFile` | `'upload-file'` | 이미지 업로드 요청 액션 이름. |
| `pageActionHandler` | `'action-handler'` | 업로드된 파일 조회/의존관계 변경 등에 사용하는 액션 핸들러 이름. |
| `imageFileSizeLimit` | `6291456`(6MB) | 에디터에 삽입 가능한 이미지 최대 크기(byte). 초과 시 알림창을 띄우고 업로드를 취소합니다. |
| `images_file_types` | `'jpeg,jpg,png,gif,bmp,webp,...'` | 업로드 허용 이미지 확장자. |
| `paste_data_images` | `true` | 클립보드에서 이미지를 붙여넣기(data URL)로 허용할지 여부. |
| `plugins` | `['autolink link image lists print hr anchor pagebreak searchreplace visualblocks visualchars code insertdatetime media nonbreaking table paste help']` | TinyMCE 플러그인 목록. |
| `toolbar` | `'styleselect \| bold italic forecolor backcolor table \| alignleft aligncenter alignright \| link image \| code help'` | TinyMCE 툴바 구성. |
| `menubar` | `false` | 상단 메뉴바(파일/편집/보기 등) 표시 여부. |
| `height` | `300` | 에디터 높이(값이 없을 때 기본값). 실제로는 태그의 `style.height`가 우선 적용됩니다. |
| `resize` | `false` | 사용자가 에디터 하단을 드래그해 크기를 조절할 수 있게 할지 여부. |
| `language` | `'ko_KR'` | TinyMCE UI 언어. 컨트롤이 한국어 번역 리소스를 내장하고 있습니다. |
| `content_style` | 본문 폰트를 `'Noto Sans KR'` 등으로 지정하는 CSS 문자열 | 에디터 iframe 내부(본문 영역)에 적용할 스타일. |
| `defaultHtmlContent` | `null` | 지정하면 초기화 시 태그 내부 콘텐츠 대신 이 HTML을 초기 값으로 사용합니다. |
| `verify_html` | `false` | TinyMCE의 HTML 검증(스키마 필터링) 사용 여부. |
| `table_default_attributes` | `{ border: '1', width: '100%' }` | 표 삽입 시 기본 속성. |
| `table_default_styles` | `{ 'border-collapse': 'collapse', width: '100%' }` | 표 삽입 시 기본 스타일. |
| `table_sizing_mode` | `'fixed'` | 표 크기 조정 모드. |
| `table_responsive_width` | `false` | 표 너비를 반응형(%)으로 둘지 여부. |
| `limitTableWidth` | `null` | 지정하면 `getValue()` 호출 시, `width` 속성이 없는 `<table>`에 이 값을 강제로 채워 넣습니다. |
| `limitGuideLineWidth` | `''` | 지정하면 편집 영역에 세로 가이드라인(빨간 선)을 그려 이 폭을 넘는지 시각적으로 표시합니다. |
| `allowExternalLink` | `false` | `readonly`이면서 이 옵션이 `true`이면 문서 내 iframe(임베드된 외부 콘텐츠)을 선택 가능한 상태로 표시합니다. |
| `prefixHtml` / `suffixHtml` | `''` | `getValue()` 결과 앞/뒤에 항상 붙일 고정 HTML. `setValue()` 호출 시에는 값에 이 문자열이 포함돼 있으면 자동으로 제거하고 반영합니다. |
| `powerpaste_word_import` / `powerpaste_googledocs_import` | `'merge'` | Word/Google 문서에서 붙여넣을 때 서식 처리 방식(PowerPaste 플러그인 사용 시). |
| `deprecation_warnings` | `false` | TinyMCE 사용 중단 경고를 콘솔에 출력할지 여부. |
| `dataType` | `'string'` | 값의 데이터 타입 표기. |
| `belongID` | `null` | 소속 그룹/컨테이너 식별자. |
| `getter` / `setter` | `false` | 값 조회/설정 시 커스텀 훅 사용 여부(프레임워크 공통 옵션). |
| `controlText` | `null` | 컨트롤에 표시할 라벨/보조 텍스트. |
| `validators` | `null` | 유효성 검증 설정. |
| `transactConfig` / `triggerConfig` | `null` | 데이터 송수신(트랜잭션)/트리거 동작 관련 설정. |

> 위 표에 없더라도 TinyMCE가 지원하는 생성 옵션(예: `statusbar`, `branding`, `readonly`, `placeholder` 등)은 `syn-options`에 그대로 추가해 사용할 수 있습니다. `syn-options`로 전달한 값이 `tinymce.init(setting)`의 `setting` 그 자체이기 때문입니다.

## 메서드

`syn.uicontrols.$htmleditor.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 매개변수 | 반환값 | 설명 |
| --- | --- | --- | --- |
| `getValue` | `elID`, `meta` | `string` | 에디터의 현재 HTML 값을 반환합니다. `limitTableWidth`/`prefixHtml`/`suffixHtml` 옵션이 있으면 결과에 자동 반영됩니다. |
| `setValue` | `elID`, `value`, `meta` | 없음 | 에디터의 HTML 값을 설정합니다. 에디터가 아직 초기화되지 않았다면 값을 태그에 임시 보관해 두었다가 초기화 완료 시점에 자동으로 반영합니다. |
| `clear` | `elID`, `isControlLoad` | 없음 | 에디터 내용을 빈 문자열로 초기화합니다. |
| `isDirty` | `elID` | `boolean` | 사용자가 초기 값 이후로 내용을 수정했는지 여부(TinyMCE `editor.isDirty()`). |
| `setMode` | `elID`, `mode` | 없음 | 에디터 모드를 전환합니다. `mode`는 `'design'`(편집 가능) 또는 `'readonly'`(읽기 전용). |
| `insertContent` | `elID`, `content` | 없음 | 현재 커서 위치에 HTML 조각을 삽입합니다. |
| `execCommand` | `elID`, `command`, `uiState`, `value`, `args` | `boolean` | TinyMCE 명령을 실행합니다(예: `'bold'`, `'backColor'`). [TinyMCE 명령 목록](https://www.tiny.cloud/docs-3x/reference/TinyMCE3x@Command_identifiers/) 참고. |
| `getHtmlEditor` | `elID` | `object \| null` | 내부 TinyMCE 에디터 인스턴스(원본 API)를 반환합니다. 표에 없는 세부 기능이 필요하면 이 인스턴스로 TinyMCE 공식 API를 직접 호출하세요. |
| `getHtmlSetting` | `elID` | `object \| null` | 해당 에디터 초기화에 사용된 병합된 옵션 객체를 반환합니다. |
| `getDependencyID` | `elID` | `string` | 현재 이미지 업로드에 사용 중인 임시 `dependencyID` 값을 반환합니다. |
| `setDependencyID` | `elID`, `dependencyID` | 없음 | `dependencyID` 값을 변경합니다(주로 신규 저장 후 실제 키 값으로 교체할 때 사용). |
| `updateDependencyID` | `elID`, `targetDependencyID`, `callback` | 없음 | 임시 `dependencyID`로 업로드된 파일들을, 저장이 끝난 뒤 실제 레코드 식별자(`targetDependencyID`)로 옮겨 연결합니다(서버의 `UpdateDependencyID` 액션 호출). 신규 등록 폼에서 임시로 이미지를 올려두었다가, 저장 성공 후 실제 PK로 소속을 변경할 때 사용합니다. |
| `resizeImage` | `file`, `maxSize` | `Promise` | 업로드 전 이미지를 캔버스로 리사이즈합니다(내부적으로 `images_upload_handler`가 사용). `maxSize`가 0 이하이면 600px 기준으로 축소합니다. |
| `controlLoad` | `elID`, `setting` | 없음 | 컨트롤 초기화 진입점입니다. syn 프레임워크가 페이지 로드 시 자동으로 호출하며, 직접 호출할 필요는 없습니다. |
| `setLocale` | `elID`, `translations`, `control`, `options` | 없음 | 다국어 텍스트 적용 훅입니다. 현재 구현은 빈 함수(별도 동작 없음)입니다. |

### ⚠️ 참고용 메서드 — 현재 구현에 알려진 제약(버그)이 있음

`getEditorSetting(elID)`는 대기열(`editorPendings`)에서 아직 초기화되지 않은 컨트롤의 설정을 조회하려는 용도로 보이지만, 대기열에 항목을 넣을 때는 `elID` 속성명으로 저장하면서(`{ elID: elID, setting, intervalID }`) 조회 시에는 `item.id`(존재하지 않는 속성)와 비교합니다. 따라서 이 메서드는 항상 `null`을 반환합니다. 직접 호출할 필요는 없으며(프레임워크 내부에서도 사용되지 않음), 초기화된 컨트롤의 설정이 필요하면 `getHtmlSetting(elID)`을 사용하세요.

## 이벤트

HtmlEditor는 다른 syn.uicontrols 컨트롤처럼 태그에 `syn-events` 속성을 선언하는 방식이 아니라, 페이지 스크립트의 `event` 객체에 정해진 이름의 함수를 선언해 두면 프레임워크가 자동으로 찾아서 호출하는 방식입니다. `syn-events` 속성은 필요 없습니다.

| 이벤트(함수명 규칙) | 매개변수 | 발생 시점 |
| --- | --- | --- |
| `{elID}_documentReady` | `(elID, editor)` | 에디터 초기화가 끝나고 초기 값 반영까지 마친 직후 1회 호출됩니다. `getValue`/`setValue`를 안전하게 호출할 수 있는 시점을 알기 위한 용도로 사용하세요. |
| `{elID}_beforeUploadImageResize` | `(elID, file, callback)` | 이미지 업로드 직전, 기본 리사이즈 로직(`resizeImage`) 대신 커스텀 리사이즈를 적용하고 싶을 때 정의합니다. 정의돼 있으면 기본 리사이즈 대신 이 함수가 호출되며, 처리 후 `callback({ blob, width, height })`를 호출해 업로드를 이어가야 합니다. 정의하지 않으면 기본 리사이즈(최대 600px)가 적용됩니다. |
| `{elID}_imageResized` | `(elID, evt, editor, selectedImage)` | 사용자가 에디터 안에서 이미지 크기를 드래그로 조절한 직후(TinyMCE `ObjectResized`) 호출됩니다. `evt.width`/`evt.height`를 검사해 원하는 최대 크기로 강제 조정하는 등의 용도로 사용합니다. |

```js
let $myPage = {
    event: {
        edtComment_documentReady(elID, editor) {
            syn.$l.eventLog('edtComment_documentReady', elID);
        },

        edtComment_imageResized(elID, evt, editor, selectedImage) {
            if (evt.width > 600) {
                var ratio = evt.width / evt.height;
                evt.width = 600;
                evt.height = parseFloat(evt.width / ratio);
                editor.dom.setStyle(selectedImage, 'width', evt.width);
                editor.dom.setStyle(selectedImage, 'height', evt.height);
                selectedImage.setAttribute('width', evt.width);
                selectedImage.setAttribute('height', evt.height);
            }
        }
    }
}
```

TinyMCE 자체의 다른 이벤트(예: 내용 변경 감지)가 필요하면 `getHtmlEditor(elID)`로 얻은 인스턴스에 TinyMCE 공식 이벤트 API를 직접 등록하세요.

```js
var editor = syn.uicontrols.$htmleditor.getHtmlEditor('edtComment');
if (editor) {
    editor.on('change', function () {
        syn.$l.eventLog('edtComment_change', editor.getContent());
    });
}
```

## 참고

- 실제 구현 파일: `HtmlEditor.js`, `HtmlEditor.css`
- 내부적으로 [TinyMCE](https://www.tiny.cloud/)를 사용하며, 엔진 스크립트(`/lib/tinymce/tinymce.min.js`)는 페이지에서 최초 1회만 비동기로 로드됩니다. TinyMCE가 아직 로드되지 않은 상태에서 여러 `<syn_htmleditor>`가 배치돼 있으면, 로드가 끝날 때까지 내부 대기열(`editorPendings`)에 쌓였다가 순서대로 초기화됩니다.
- 이미지 업로드와 `repositoryID`의 관계: `syn-options`에 `repositoryID`를 지정하면, 컨트롤이 TinyMCE의 `images_upload_handler`를 자동으로 구성합니다. 사용자가 이미지를 붙여넣거나 드래그&드롭하면 다음 순서로 처리됩니다.
  1. 이미지 크기가 `imageFileSizeLimit`(기본 6MB)을 넘으면 업로드를 취소하고 알림을 띄웁니다.
  2. `{elID}_beforeUploadImageResize` 이벤트가 정의돼 있으면 그 함수로, 아니면 기본 `resizeImage`(최대 600px)로 이미지를 축소합니다.
  3. `fileManagerServer` + `fileManagerPath`(`/repository/api/storage`) + `pageUploadFile`(`upload-file`)로 `RepositoryID`/`DependencyID`와 함께 업로드합니다. `DependencyID`는 `dependencyID` 옵션 값이며, 지정하지 않으면 자동으로 임시 값이 발급됩니다(`isNumberTempDependency`).
  4. 업로드 성공 후 서버에 파일의 실제 경로를 다시 조회(`pageActionHandler`의 `GetItem` 액션)해서 `<img src>`를 그 경로로 교체합니다.
  5. `repositoryID`를 지정하지 않으면 이미지 업로드 핸들러 자체가 등록되지 않아, 붙여넣은 이미지는 브라우저 로컬 `data:` URL 형태로 문서 안에 그대로 포함됩니다(서버에 저장되지 않음).
  - 신규 등록 화면처럼 저장 전에는 실제 레코드 식별자가 없어 임시 `dependencyID`로 이미지를 올려두고, 저장이 성공한 뒤에는 `updateDependencyID(elID, targetDependencyID, callback)`을 호출해 실제 레코드 식별자로 파일 소속을 옮기는 패턴을 사용합니다.
- `getEditorSetting` 메서드는 현재 소스 기준으로 항상 `null`을 반환하는 알려진 버그가 있습니다. 초기화된 컨트롤의 설정 조회에는 `getHtmlSetting(elID)`을 사용하세요.
