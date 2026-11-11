# FileDropZone (syn.uicontrols.$filedropzone)

## 이 컨트롤은 무엇인가요?

FileDropZone은 파일을 끌어다 놓거나 클릭해서 선택하면 `repository` 모듈로 업로드하고, 업로드한 파일 목록에서 바로 다운로드·삭제할 수 있는 컨트롤입니다. 오픈소스 [Dropzone](https://github.com/enyo/dropzone)(v6.3.5, MIT)을 기반으로 하며, 파일별 진행률·썸네일·오류 표시를 제공합니다.

값은 **업로드가 끝난 파일 항목 객체 배열**입니다(repository 가 돌려주는 항목 JSON: `ItemID`, `FileName`, `Size`, `Extension`, `DependencyID`, ...).

- `getValue` : 업로드가 끝난 파일 항목 배열(없으면 `[]`)
- `setValue` : 항목 배열(또는 ItemID 문자열 배열/쉼표 문자열/JSON 문자열)로 화면 목록을 교체. 서버에 업로드/삭제하지 않음

## FileClient 와 무엇이 다른가요?

| 구분 | FileDropZone | FileClient |
|---|---|---|
| 업로드 화면 | 화면 안에 직접 표시(끌어놓기/클릭) | 팝업 iframe 페이지 |
| 진행률/썸네일/목록 내 다운로드·삭제 | 있음 | 없음 |
| 값 | 파일 항목 객체 배열 | ItemID 문자열(쉼표 구분) |
| 서버 | repository 모듈(`/repository/api/storage`) — 동일 | 동일 |

## 언제 사용하나요?

- 게시글, 계약서, 점검 결과처럼 화면에서 여러 파일을 첨부하고 바로 확인/삭제해야 할 때
- 업로드 상태(진행률, 크기/확장자/개수 제한 오류)를 사용자에게 바로 보여줘야 할 때

## 빠른 시작

```html
<syn_filedropzone id="fdzAttach" syn-datafield="Attachments" syn-events="['change']" syn-options="{
    repositoryID: 'TSTLM01',
    applicationID: 'HDS',
    dependencyID: 'POST_20261014_0001'
}"></syn_filedropzone>
```

```javascript
'use strict';
let $mypage = {
    event: {
        fdzAttach_change(evt) {
            // 업로드 성공 / 삭제 시 발생. evt.detail.value 는 getValue() 와 같은 항목 배열
        },

        btnSave_click() {
            if (syn.uicontrols.$filedropzone.isUploading('fdzAttach') == true) {
                return;
            }

            // [{ItemID, FileName, Size, Extension, DependencyID, ...}]
            var files = syn.uicontrols.$filedropzone.getValue('fdzAttach');
        },

        btnDownload_click() {
            syn.uicontrols.$filedropzone.download('fdzAttach', itemID);
        }
    }
}
```

`/js/syn.loader.js`가 `syn_filedropzone` 태그를 인식해 Dropzone 라이브러리(`/lib/dropzone/dist/dropzone-min.js`, `dropzone.css`)와 컨트롤 파일을 자동으로 불러옵니다. 라이브러리는 `libman.json`에 등록되어 있으며 `libman restore`로 내려받습니다.

## 저장소(repository) 연동 방식

- 컨트롤이 로드되면 `get-repository` 로 저장소 정책(확장자, 크기, 개수, 단일/다중)을 조회합니다. 조회가 끝나야 사용할 수 있으며, 끝나면 `ready` 이벤트가 발생합니다(`whenReady(elID)` 로도 기다릴 수 있음). 저장소가 없으면 컨트롤에 오류가 표시됩니다.
- 파일은 파일마다 `upload-file`(multipart, 필드 `file`)로 올라가며, 같은 `dependencyID` 로 묶입니다.
- `dependencyID` 를 지정하면 로드할 때 그 키의 파일을 `GetItems` 로 조회해 보여줍니다. 지정하지 않으면 임시 키(`TEMP_...`)를 만들어 쓰며, 저장 시 `updateDependencyID(elID, 업무키)` 로 실제 키로 옮깁니다.
- 다운로드는 `download-file`(POST)로 받아 브라우저 다운로드로 저장합니다. 삭제는 `remove-item` 입니다.
- 서버 주소는 `fileManagerServer` 옵션 → `syn.Config.FileManagerServer` 순서로 정합니다. `applicationID`/`businessID` 는 FileClient 와 같은 규칙으로 결정합니다.

## 알아 둘 점

- **확장자/개수 제한은 서버가 강제하지 않습니다.** repository 는 파일 크기만 서버에서 검사하므로, 확장자(`UploadExtensions`)와 개수(`UploadCount`)는 컨트롤이 업로드 전에 검사해 거부합니다(`fileRejected` 이벤트).
- **단일 파일 저장소**(`IsMultiUpload: false`)는 새 파일을 올리면 서버가 이전 파일을 지우므로, 화면에서도 새 파일 업로드가 성공하면 이전 파일을 교체합니다. 여러 파일을 한꺼번에 놓으면 마지막 파일만 올라갑니다.
- **저장 경로(`customPath1~3`)**: 파일은 `PhysicalPath/{customPath1}/{customPath2}/{customPath3}/{정책 경로(연도 등)}` 에 저장되고, repository 모듈의 다운로드는 항목에 기록된 `CustomPath1~3` 으로 같은 위치를 계산해 검증합니다. 따라서 `customPath1~3` 을 지정하든 안 하든 다운로드됩니다. 이전 버전 repository 모듈은 `PhysicalPath/{ApplicationID}` 아래 파일만 허용해서 기본 설정에서 `파일 경로 확인 필요`(400)가 났으며, 이 경우 `customPath1: 'ApplicationID 값'` 으로 우회할 수 있습니다(예제는 이 값을 지정해 두 버전 모두에서 동작합니다).
- 보호된 저장소(`AccessMethod: protected`)의 썸네일/다운로드는 `fetch` 로 받아 표시하므로 Referer 조건과 무관하게 동작합니다(다른 도메인의 repository 를 쓰려면 서버 CORS 허용이 필요).
- `setValue`/`clear` 는 화면 목록만 바꾸며 `change` 이벤트도 발생하지 않습니다. 서버 파일을 지우려면 `removeItem`/`removeAll` 을 사용합니다.

## 예제 실행하기

`example/` 폴더에 다음 예제가 있습니다. repository 모듈이 포함된 `ack` 에서 아래 경로로 열 수 있으며(샘플 저장소 `TSTLM01`/`TSTLS01`/`TSTLE01`, 앱 `HDS`), 페이지 주소의 호스트는 `FileManagerServer` 와 같아야 합니다(예: `localhost`).

- `example/basic.html` — 기본 업로드/다운로드/삭제, `getValue` 로 목록 확인
- `example/getset.html` — `getValue`/`setValue`/`clear`/`load`(항목 배열, ItemID 배열, 잘못된 값)
- `example/features.html` : 전체 기능 확인 - 모든 옵션/메서드/이벤트를 한 화면에서 확인하는 예제
- `example/practical.html` : 게시글 첨부파일(실무형) - 임시 키로 업로드 → 저장 시 게시글 키로 이동 → 다시 조회하는 흐름

별도 샘플 페이지는 `/sample/uicontrol/filedropzone.html` 입니다.

## 더 알아보기

전체 옵션/메서드/이벤트 목록은 [API.md](./API.md)를 참고하세요.
