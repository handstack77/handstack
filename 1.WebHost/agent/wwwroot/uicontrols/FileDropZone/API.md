# FileDropZone API 참조

`syn.uicontrols.$filedropzone` (버전: `v2026.10.14`)

의존 라이브러리: [Dropzone](https://github.com/enyo/dropzone) 6.3.5 (`/lib/dropzone/dist/dropzone-min.js`, `/lib/dropzone/dist/dropzone.css`, 전역 `Dropzone`). 로더가 자동으로 불러오며, 직접 페이지에 넣을 때는 컨트롤보다 먼저 로드해야 합니다. 서버는 `repository` 모듈의 `/repository/api/storage/*` 입니다.

## 마크업

```html
<syn_filedropzone id="fdzAttach" syn-datafield="Attachments"
    syn-events="['ready','fileAdded','fileRejected','uploadSuccess','uploadError','fileRemoved','change']"
    syn-options="{
        repositoryID: 'TSTLM01',
        applicationID: 'HDS',
        dependencyID: 'POST_20261014_0001',
        height: '200px'
    }"></syn_filedropzone>
```

원본 요소가 업로드 영역(호스트)이 되며 `syn-filedropzone dropzone` 클래스가 붙고, 안에 Dropzone 안내 문구와 파일 카드가 생성됩니다. 호스트에는 상태에 따라 `fdz-readonly`, `fdz-disabled` 클래스가 붙습니다.

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `repositoryID` | string | `''` | **필수.** 저장소 ID(서버 정책 키) |
| `applicationID` | string | `''` | 생략하면 FileClient 와 같은 규칙으로 결정(`syn.$w.Variable`/`User`/`syn.Config.ApplicationID`) |
| `businessID` | string | `''` | 생략하면 `syn.Config.FileBusinessIDSource`(Cookie/SessionStorage) → `syn.$w.User.WorkCompanyNo` → `'0'` |
| `dependencyID` | string | `''` | 파일을 묶는 키. 지정하면 로드 시 해당 파일을 조회해 표시. 생략하면 임시 키(`TEMP_` + 24자리 16진수)를 만들고 조회하지 않음 |
| `tokenID` | string | `''` | 다운로드 요청의 `TokenID` |
| `customPath1`, `customPath2`, `customPath3` | string | `''` | 업로드 저장 하위 경로(`CustomPath1~3`). 값이 있을 때만 전송. 다운로드는 항목의 `CustomPath1~3` 기준 경로에서 검증(이전 버전 repository 모듈은 `customPath1` 에 ApplicationID 를 지정해야 동작, README 참고) |
| `fileManagerServer` | string | `''` | repository 서버 주소. 생략하면 `syn.Config.FileManagerServer` |
| `fileManagerPath` | string | `'/repository/api/storage'` | API 기본 경로 |
| `width` / `height` | string / string \| null | `'100%'` / `null` | 영역 너비 / 최소 높이(CSS 값) |
| `placeholder` | string | `'파일을 끌어다 놓거나 클릭하여 선택하세요'` | 안내 문구 |
| `autoLoad` | boolean | `true` | `dependencyID` 를 지정했을 때 로드 시 서버 파일을 조회해 표시 |
| `deleteOnRemove` | boolean | `true` | 카드의 삭제 버튼이 서버 파일도 삭제(`false` 이면 화면에서만 제거) |
| `confirmRemove` | boolean | `false` | 삭제 전에 확인창 표시 |
| `readOnly` | boolean | `false` | 업로드/삭제를 막고 다운로드만 허용 |
| `showDownload` | boolean | `true` | 카드에 다운로드 버튼 표시 |
| `thumbnails` | boolean | `true` | 이미지 썸네일 표시(10MB 이하 이미지) |
| `acceptedFiles` | string \| null | `null` | Dropzone 의 허용 형식(예: `'.txt,.pdf,image/*'`). 저장소 정책의 확장자 검사와 **함께** 적용 |
| `maxFilesize` | number \| null | `null` | 최대 파일 크기(MB). 저장소 `UploadSizeLimit` 보다 작을 때만 적용 |
| `maxFiles` | number \| null | `null` | 최대 파일 수. 저장소 `UploadCount` 보다 작을 때만 적용(단일 파일 저장소는 무시) |
| `parallelUploads` | number | `2` | 동시 업로드 수(단일 파일 저장소는 1) |
| `timeout` | number | `0` | 업로드 요청 제한 시간(ms). `0` 이면 제한 없음 |
| `headers` | object \| null | `null` | 모든 요청에 추가할 헤더(예: `{'X-Api-Key': '...'}`) |
| `withCredentials` | boolean | `false` | 쿠키를 포함해 요청(다른 도메인 서버 사용 시) |
| `rejectedDisplayMs` | number | `3000` | 업로드 전에 거부된 파일 카드를 보여주는 시간(ms). `0` 이면 직접 지울 때까지 유지 |
| `dataType` | string | `'object'` | 값의 데이터 타입 |
| `belongID`, `getter`, `setter`, `controlText`, `validators`, `transactConfig`, `triggerConfig` | | | 다른 컨트롤과 같은 공통 옵션 |

옵션은 페이지의 `hook.controlInit(elID, setting)` 으로도 바꿀 수 있습니다.

## 저장소 정책 적용

| 서버 정책(`get-repository`) | 컨트롤 동작 |
|---|---|
| `UploadExtensions`(`'gif;jpg'`, `'*/*'`) | 허용 확장자 검사(대소문자 무시). `'*/*'` 이면 제한 없음. 위반 시 `fileRejected` |
| `UploadSizeLimit`(bytes) | `maxFilesize` 로 변환해 검사. 서버도 검사하며 위반 시 `uploadError` |
| `UploadCount` | 최대 파일 수(기존 파일 포함). 초과 시 `fileRejected`. 단일 저장소는 해당 없음 |
| `IsMultiUpload: false` | 단일 파일: 업로드 성공 시 이전 파일 교체, 여러 파일을 놓으면 마지막 파일만 업로드 |

## 메서드

모든 메서드는 첫 인자로 컨트롤 `elID` 를 받습니다. 컨트롤이 준비되기 전(`ready` 전)에는 `getValue` 가 `[]` 를 반환하고 일부 메서드는 `false` 를 반환합니다.

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `controlLoad` | `controlLoad(elID, setting)` | 컨트롤 초기화(`<syn_filedropzone>` 가 자동 호출). 이미 로드되어 있으면 기존 항목 반환. Dropzone 이 없으면 예외. 정책 조회는 비동기로 진행 |
| `whenReady` | `whenReady(elID)` | 정책 조회와 기존 파일 표시가 끝나면 완료되는 Promise(실패해도 reject 하지 않으며 컨트롤 상태는 `getControl(elID).state` 가 `'error'`) |
| `getValue` | `getValue(elID, meta)` | 업로드가 끝난 파일 항목의 복제 배열. 없으면 `[]` |
| `setValue` | `setValue(elID, value, meta)` | 항목 배열(또는 ItemID 문자열 배열/쉼표 문자열/JSON 문자열)로 화면 목록 교체. `FileName` 이 없는 항목은 서버(`GetItem`)에서 조회. 서버에 업로드/삭제하지 않으며 `change` 없음. `Promise<boolean>` — 해석하지 못한 항목이 있으면 `false`(나머지는 표시) |
| `clear` | `clear(elID, isControlLoad)` | 화면 목록만 비움(서버 파일 유지, `change` 없음) |
| `load` | `load(elID, dependencyID)` | 서버에서 `dependencyID`(생략 시 현재 값)의 파일을 조회해 목록 교체. 조회한 항목 배열 반환(`Promise`). `dependencyID` 를 주면 이후 업로드도 그 키 사용 |
| `upload` | `upload(elID, files)` | `File` 객체(또는 배열/`FileList`)를 추가해 업로드(검증은 드롭과 동일). 읽기 전용/비활성/준비 전이면 `false` |
| `removeItem` | `removeItem(elID, itemID)` | 서버에서 삭제하고 목록에서 제거(`deleteOnRemove` 와 무관). `Promise<boolean>` |
| `removeAll` | `removeAll(elID)` | 현재 `dependencyID` 의 모든 파일을 서버에서 삭제하고 목록을 비움. `Promise<boolean>` |
| `download` | `download(elID, itemID)` | `download-file` 로 받아 브라우저 다운로드. `itemID` 대신 항목 객체도 가능. `Promise<boolean>` |
| `getDownloadUrl` | `getDownloadUrl(elID, itemID, disposition)` | `http-download-file` 주소(`'attachment'`/`'inline'`). 보호된 저장소는 같은 사이트 Referer 가 필요 |
| `getDependencyID` | `getDependencyID(elID)` | 현재 `dependencyID` |
| `setDependencyID` | `setDependencyID(elID, dependencyID)` | 이후 업로드/조회가 사용할 키만 바꿈(목록과 서버 항목은 그대로) |
| `updateDependencyID` | `updateDependencyID(elID, targetDependencyID)` | 서버 항목의 `dependencyID` 를 현재 값에서 대상 값으로 바꿈(임시 키 → 업무 키). 성공하면 현재 키와 항목의 `DependencyID` 도 갱신. `Promise<boolean>` |
| `isEmpty` | `isEmpty(elID)` | 업로드가 끝난 파일이 없으면 `true` |
| `isUploading` | `isUploading(elID)` | 업로드 중이거나 대기 중인 파일이 있으면 `true` |
| `setReadOnly` | `setReadOnly(elID, isReadOnly)` | 읽기 전용 전환(인자 생략 시 `true`). 업로드/삭제 불가, 다운로드 가능 |
| `setDisabled` | `setDisabled(elID, isDisabled)` | 비활성화 전환(인자 생략 시 `true`). 입력·삭제·다운로드 불가 + 흐리게 표시 |
| `toFileLengthString` | `toFileLengthString(bytes)` | 크기 문자열(`'0.0 KB'`, `'1.5 MB'`, `'2.0 GB'`). FileClient 와 같은 규칙 |
| `destroy` | `destroy(elID)` | Dropzone/이벤트를 정리하고 호스트를 원래대로 비움(서버 파일은 그대로) |
| `getControl` | `getControl(elID)` | 내부 항목 `{ id, host, setting, context, policy, dz, dependencyID, state, readOnly, disabled, ... }`. `dz` 는 Dropzone 인스턴스 |
| `addModuleList` | `addModuleList(el, moduleList, setting, controlType)` | 폼 컨트롤 목록에 등록(`syn.js` 가 호출) |
| `setLocale` | `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 (현재 구현은 빈 함수) |

## 이벤트 (syn-events)

`syn-events` 에 이름을 적으면 호스트 요소의 DOM 이벤트로 연결되어 페이지의 `<elID>_<eventName>(evt)` 핸들러가 호출됩니다.

| 이벤트 | 시점 | `evt.detail` |
|---|---|---|
| `ready` | 정책 조회와 기존 파일 표시가 끝났을 때 | `{ policy }` (`get-repository` 응답) |
| `fileAdded` | 파일을 추가했을 때(검증 전) | `{ file }` |
| `fileRejected` | 크기/확장자/개수 초과로 업로드 전에 거부됐을 때 | `{ file, reason }` |
| `uploadProgress` | 업로드 진행률이 바뀔 때 | `{ file, progress }` (0~100) |
| `uploadSuccess` | 파일 업로드가 성공했을 때 | `{ file, item }` (서버 항목) |
| `uploadError` | 서버가 거부했거나(`Result:false`, 크기 초과 등) 네트워크/HTTP 오류일 때 | `{ file, message }` |
| `queueComplete` | 대기 중인 업로드가 모두 끝났을 때 | `{}` |
| `fileRemoved` | 삭제 버튼/`removeItem` 으로 파일을 제거했을 때 | `{ item }` |
| `fileDownload` | 다운로드가 시작됐을 때 | `{ item }` |
| `change` | 업로드 성공, 삭제, `removeAll` 로 값이 바뀌었을 때 | `{ value }` (`getValue()` 와 같은 배열) |

`setValue`/`clear`/`load` 같은 코드 호출로는 `change` 가 발생하지 않습니다.

## 항목(파일) 객체

`getValue` 와 이벤트의 `item` 은 repository 의 항목 JSON 과 같습니다.

| 필드 | 설명 |
|---|---|
| `ItemID` | 파일 식별자(다운로드/삭제 키) |
| `RepositoryID`, `DependencyID` | 저장소 ID, 묶음 키 |
| `FileName`, `Extension`(`'.txt'`), `Size`, `MimeType`, `MD5` | 파일 정보 |
| `SortingNo`, `AbsolutePath`, `RelativePath`, `CustomPath1~3`, `PolicyPath` | 저장/주소 정보 |

## 참고

- 서버 오류(HTTP 200 이어도 `Result:false`)와 크기/확장자/개수 제한 메시지는 파일 카드에 표시됩니다. `alert` 는 사용하지 않습니다.
- 파일 이름은 서버가 저장소 정책(`IsFileNameEncrypt` 등)에 따라 `ItemID` 를 정하므로, 화면 표시와 다운로드에는 항목의 `FileName` 을 사용하세요.
- 단위 테스트가 필요한 화면은 `getControl(elID).dz` 의 `addFile(file)` 로 `File` 객체를 직접 추가할 수 있습니다.
