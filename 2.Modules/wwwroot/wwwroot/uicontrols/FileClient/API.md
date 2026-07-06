# FileClient API 참조

`syn.uicontrols.$fileclient` (버전: `v2025.9.16`)

## 마크업

```html
<syn_fileclient id="sfcCompanyImage" syn-datafield="CompanyImage" syn-options="{
    repositoryID: 'BDLLP01',
    dialogTitle: '회사 이미지 업로드'
}"></syn_fileclient>
```

`controlLoad` 실행 시 다음이 일어납니다.

1. `fileManagerServer` + `fileManagerPath`(기본 `/repository/api/storage`) + `pageGetRepository`(기본 `get-repository`) 경로로 서버에 `repositoryID`의 저장소 정보를 조회합니다.
2. 조회 결과(`RepositoryName`, `UploadType`, `UploadExtensions`, `UploadCount`, `UploadSizeLimit` 등)를 `setting`에 병합하고, `UploadType`(`Single`/`Profile`/`Multi`/`ImageLink`)에 따라 실제 업로드 팝업이 열 페이지(`uploadUrl`)를 결정합니다.
3. 원본 `<syn_fileclient>` 엘리먼트는 `id`가 `<elID>_hidden`으로 바뀌고 `display:none` 처리되며, 그 자리에 실제 값을 담는 `<input type="hidden" id="<elID>">`가 새로 생성됩니다. 이 hidden input의 `value`가 업로드된 파일의 `ItemID`(다중이면 콤마로 연결한 문자열)입니다.
4. 저장소 조회에 실패하면(등록되지 않은 `repositoryID` 등) 경고창과 함께 `uploadUrl`이 비워집니다.

## Options (defaultSetting)

| 옵션명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `elementID` | string \| null | `null` | 내부적으로 자동 설정되는 엘리먼트 ID (직접 지정할 필요 없음) |
| `dialogTitle` | string | `'파일 업로드'` | 업로드 팝업 제목. 저장소 조회 후 `RepositoryName`으로 자동 대체됨 |
| `tokenID` | string | `''` | 다운로드 시 사용하는 토큰 값 |
| `repositoryID` | string | `''` | 필수. 서버에 등록된 저장소(업로드 정책) ID. 이 값에 따라 업로드 방식/허용 확장자/개수/용량 제한이 결정됨 |
| `dependencyID` | string | `''` | 업로드된 파일이 속하는 소속 키(예: 게시글 ID, 사용자 ID 등). 업로드/조회/삭제 시 이 값으로 파일 그룹을 구분 |
| `businessID` | string | `''` | 내부적으로 사용되는 사업장/회사 구분 값(대부분 자동 결정됨) |
| `applicationID` | string | `''` | 내부적으로 사용되는 애플리케이션 구분 값(대부분 자동 결정됨) |
| `fileUpdateCallback` | string \| null | `null` | 업로드 완료 후 호출할 콜백 함수명. 페이지 스크립트의 `event.<이름>` 또는 `$this.event.<이름>`에서 찾음. 시그니처: `callback(action, result)` |
| `accept` | string | `'*/*'` | 허용 파일 확장자(MIME 패턴). 저장소 조회 후 서버의 `UploadExtensions`로 대체됨 |
| `uploadUrl` | string | `''` | 실제 업로드 팝업 페이지 경로. 저장소의 `UploadType`에 따라 자동 결정됨(`Single`→`upload/SingleFile.html`, `Profile`→`upload/ProfilePicture.html`, `Multi`→`upload/MultiFiles.html`, `ImageLink`→`upload/ImageLinkFiles.html`) |
| `fileChangeHandler` | function \| undefined | `undefined` | 파일 선택 변경 시 직접 연동할 핸들러(저수준 API, 일반적인 사용에서는 잘 쓰이지 않음) |
| `custom1`, `custom2`, `custom3` | any \| undefined | `undefined` | 업로드 요청에 함께 전달되는 사용자 정의 경로/값(서버에서 `custompath1~3`으로 수신) |
| `minHeight` | number | `360` | 업로드 팝업 다이얼로그의 최소 높이(px). `uploadUI` 호출 시 오버라이드하는 경우가 많음 |
| `fileManagerServer` | string | `''` | 파일 저장소 API 서버 주소. 비어 있으면 `syn.Config.FileManagerServer` 값을 사용 |
| `fileManagerPath` | string | `'/repository/api/storage'` | 파일 저장소 API 기본 경로 |
| `pageGetRepository` | string | `'get-repository'` | 저장소 정보 조회 API 경로명 |
| `pageUploadFile` | string | `'upload-file'` | 단일 파일 업로드(Blob/DataUri 등) API 경로명 |
| `pageUploadFiles` | string | `'upload-files'` | 다중 파일 업로드(폼 submit) API 경로명 |
| `pageActionHandler` | string | `'action-handler'` | 조회/변경(GetItem, GetItems, UpdateDependencyID, UpdateFileName 등) API 경로명 |
| `pageRemoveItem` | string | `'remove-item'` | 단일 항목 삭제 API 경로명 |
| `pageRemoveItems` | string | `'remove-items'` | 복수 항목 삭제 API 경로명 |
| `pageDownloadFile` | string | `'download-file'` | 파일 다운로드(POST + Blob 응답) API 경로명 |
| `pageHttpDownloadFile` | string | `'http-download-file'` | iframe 기반 직접 다운로드 API 경로명 |
| `pageVirtualDownloadFile` | string | `'virtual-download-file'` | 가상 경로 파일 다운로드 API 경로명 |
| `pageVirtualDeleteFile` | string | `'virtual-delete-file'` | 가상 경로 파일 삭제 API 경로명 |
| `sharedAssetUrl` | string | `''` | 업로드 팝업 페이지(html)들이 위치한 공유 자산 경로. 비어 있으면 `syn.Config.SharedAssetUrl` 사용 |
| `dataType` | string | `'string'` | 값의 데이터 타입 |
| `belongID` | string \| string[] \| null | `null` | 이 필드가 속한 트랜잭션 함수 ID |
| `getter` | boolean \| function | `false` | 값을 가져올 때 커스텀 변환 함수 |
| `setter` | boolean \| function | `false` | 값을 설정할 때 커스텀 변환 함수 |
| `controlText` | string \| null | `null` | 컨트롤 라벨/설명 텍스트(검증 메시지 등에 사용) |
| `validators` | array \| null | `null` | 값 검증 규칙 |
| `transactConfig` | object \| null | `null` | 트랜잭션 관련 설정 |
| `triggerConfig` | object \| null | `null` | 다른 컨트롤에 의해 트리거되는 동작 설정 |

저장소 조회 응답을 통해 추가로 채워지는 값(직접 지정하지 않아도 됨): `storageType`, `isMultiUpload`, `isAutoPath`, `policyPathID`, `uploadType`, `uploadExtensions`, `uploadCount`, `uploadSizeLimit`.

## 메서드

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `controlLoad` | `controlLoad(elID, setting)` | 컨트롤 초기화(마크업 상 `<syn_fileclient>`가 자동으로 호출) |
| `getValue` | `getValue(elID, meta)` | hidden input의 현재 값(`ItemID`, 다중이면 콤마로 연결된 문자열) 반환 |
| `setValue` | `setValue(elID, value, meta)` | hidden input 값을 직접 지정(예: 서버에서 내려온 기존 `ItemID`로 초기화할 때) |
| `clear` | `clear(elID, isControlLoad)` | hidden input 값을 빈 문자열로 초기화 |
| `getFileSetting` | `getFileSetting(elID)` | 해당 컨트롤의 저장소 조회가 끝난 뒤 저장된 옵션 객체(복제본)를 반환. 업로드를 열기 전에 이 메서드로 기본 옵션을 가져와 필요한 값만 덮어쓰는 것이 표준 패턴 |
| `getFileManagerSetting` | `getFileManagerSetting()` | 페이지에 등록된 첫 번째 FileClient 컨트롤의 설정을 반환(공용 API 경로 계산 등에 사용되는 내부 헬퍼) |
| `setPageSetting` | `setPageSetting(pageSettings)` | 페이지의 모든 FileClient 컨트롤에 대해 API 경로명(`pageUploadFile` 등)을 일괄 재정의 |
| `uploadUI` | `uploadUI(uploadOptions)` | `uploadOptions.repositoryID`/`uploadUrl`이 설정된 업로드 옵션으로 업로드 팝업 다이얼로그를 연다. `repositoryID` 또는 `uploadUrl`이 비어 있으면 경고 후 중단 |
| `fileDownload` | `fileDownload(elIDOrOptions)` | 파일을 다운로드한다. 문자열(`elID`)을 넘기면 그 컨트롤의 현재 값(`ItemID`)을 다운로드하고, `{repositoryID, itemID, fileMD5, tokenID}` 객체를 넘기면 임의의 파일을 다운로드(다중 업로드에서 특정 항목만 받을 때 사용) |
| `httpDownloadFile` | `httpDownloadFile(repositoryID, itemID, fileMD5, tokenID)` | 숨김 iframe의 `src`를 설정해 브라우저가 직접 처리하는 방식으로 다운로드(팝업 차단 등에 영향받지 않는 대안) |
| `virtualDownloadFile` | `virtualDownloadFile(repositoryID, fileName, subDirectory)` | 저장소에 등록되지 않은 가상 경로의 파일을 다운로드 |
| `virtualDeleteFile` | `virtualDeleteFile(repositoryID, fileName, subDirectory)` | 가상 경로의 파일을 삭제 |
| `getItem` | `getItem(elID, itemID, callback)` | 업로드된 파일 1건의 상세 정보 조회. `callback(result)` |
| `getItems` | `getItems(elID, dependencyID, callback)` | `dependencyID`에 속한 업로드 파일 목록 조회. `callback(result)` |
| `deleteItem` | `deleteItem(elID, itemID, callback)` | 파일 1건 삭제. 삭제 성공 시 컨트롤 값(`ItemID` 목록)에서 해당 항목을 자동으로 제거. `callback(response)` |
| `deleteItems` | `deleteItems(elID, dependencyID, callback)` | `dependencyID`에 속한 파일 전체 삭제. 성공 시 컨트롤 값을 빈 문자열로 초기화. `callback(response)` |
| `updateDependencyID` | `updateDependencyID(elID, sourceDependencyID, targetDependencyID, callback)` | 임시로 업로드한 파일들의 소속 키(`dependencyID`)를 실제 키로 변경(예: 신규 등록 화면에서 임시 ID로 올려두고, 저장 시 실제 PK로 변경) |
| `updateFileName` | `updateFileName(elID, itemID, fileName, callback)` | 업로드된 파일의 파일명을 변경 |
| `uploadBlob` | `uploadBlob(options, callback)` | Blob 객체를 직접 업로드(팝업 없이). `options: {repositoryID, dependencyID, blobInfo, mimeType, fileName}` |
| `uploadDataUri` | `uploadDataUri(options, callback)` | Data URI(`data:...;base64,...`) 문자열을 Blob으로 변환 후 업로드. `options: {repositoryID, dependencyID, dataUri, fileName}` |
| `uploadBlobUri` | `uploadBlobUri(options, callback)` | Blob URL(`blob:...`)을 Blob으로 변환 후 업로드. `options: {repositoryID, dependencyID, blobUri, fileName}` |
| `fileUpload` | `fileUpload(el, repositoryID, dependencyID, callback, uploadUrl)` | `<input type="file">` 엘리먼트(또는 그 id)의 선택된 파일들을 팝업 없이 즉시 업로드(저수준 API) |
| `getTemporaryDependencyID` | `getTemporaryDependencyID(prefix)` | 신규 등록 화면 등에서 실제 PK가 없을 때 사용할 임시 `dependencyID`를 생성(GUID 또는 `prefix + 랜덤값`) |
| `getRepositoryID` / `getDependencyID` / `setDependencyID` | `(elID)` / `(elID, dependencyID)` | `init`/`addFileUI` 기반의 구형 다중 첨부 UI(`fileManagers`)에서 저장소/소속 키를 조회·변경하는 내부 헬퍼 |
| `toFileLengthString` | `toFileLengthString(fileLength)` | 바이트 크기를 `'123 KB'`/`'1.2 MB'` 형태 문자열로 변환 |
| `setLocale` | `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용(현재 구현은 빈 함수) |

`init`, `addFileUI`, `getFileManager`, `getFileMaxIndex`, `prependChild`, `doUpload`, `getUploadUrl`, `getFileAction`, `executeProxy`, `getFileMimeType`는 팝업 없이 폼에 파일 입력행을 직접 추가하는 구형(레거시) 다중 첨부 UI를 위한 내부 구현 세부사항입니다. 신규 화면에서는 `getFileSetting` + `uploadUI` 조합을 사용하는 것이 표준 패턴이며, 위 내부 메서드들을 직접 호출할 일은 거의 없습니다.

## 이벤트 (syn-events)

FileClient가 실제로 화면에 렌더링하는 것은 `<input type="hidden">`이므로, 일반적인 `syn-events="['change']"` 방식의 네이티브 DOM 이벤트 와이어링은 값 변경 시점을 감지하는 용도로는 사용되지 않습니다(업로드 완료 시 `el.value`가 코드로 직접 대입되며 `change` 이벤트가 발생(dispatch)되지 않습니다).

대신 값이 바뀌는 시점(업로드 완료)을 알아야 한다면 `fileUpdateCallback` 옵션을 사용하세요.

```js
uploadOptions.fileUpdateCallback = 'sfcCompanyImage_callback';
syn.uicontrols.$fileclient.uploadUI(uploadOptions);
```

이 콜백은 업로드 팝업(iframe)이 부모 창으로 `postMessage`를 보내면, `$fileclient`가 이를 가로채(`window`의 `message` 이벤트) 페이지 스크립트 객체(`window[syn.$w.pageScript]`)의 `event.<콜백이름>` 함수를 찾아 `(action, result)` 형태로 호출하는 방식으로 동작합니다. 콜백이 호출되고 나면 열려 있던 업로드 다이얼로그도 자동으로 닫힙니다(`$.modal.close()`).

## 참고: 업로드 콜백(fileUpdateCallback) 결과 객체 구조

콜백은 `callback(action, result)` 형태로 호출되며, 업로드 완료 시 `action`은 `'upload'`, `result`는 다음 구조입니다.

```js
{
    elID: 'sfcCompanyImage',       // 업로드를 요청한 컨트롤의 엘리먼트 ID
    repositoryID: 'BDLLP01',       // 업로드된 저장소 ID
    items: [                       // 업로드된 파일 목록(다중 업로드면 여러 건)
        {
            ItemID: 'e9259ffe12534c83957906bdb2ff7d6b',
            AbsolutePath: 'https://.../e9259ffe12534c83957906bdb2ff7d6b.png',
            // 그 외 서버가 내려주는 파일 메타데이터 필드(파일명, 크기, 저장 경로 등)
        }
        // ...
    ]
}
```

콜백 처리와 별개로, `$fileclient`는 업로드된 항목들의 `ItemID`를 콤마로 연결해 자동으로 원본 hidden input(`elID`)의 `value`에 채워 넣습니다. 즉 `getValue(elID)`만 호출해도 업로드 결과(ItemID 목록)를 즉시 얻을 수 있으며, `fileUpdateCallback`은 주로 업로드 직후 화면에 파일명/미리보기 등을 갱신하거나 후속 처리를 트리거하는 용도로 사용합니다.
