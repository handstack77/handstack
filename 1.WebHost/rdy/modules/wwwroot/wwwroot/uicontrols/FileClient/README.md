# FileClient (syn.uicontrols.$fileclient)

## 이 컨트롤은 무엇인가요?

FileClient는 파일을 업로드/다운로드하는 컨트롤입니다. 화면에 그려지는 것은 값(업로드된 파일의 `ItemID`, 다중일 경우 콤마로 연결된 문자열)을 담는 숨겨진 `<input type="hidden">` 하나뿐이며, 실제 업로드 UI(파일 선택, 진행 상태 등)는 별도의 팝업 다이얼로그(iframe)로 열립니다.

컨트롤이 초기화(`controlLoad`)될 때 서버(`fileManagerServer`)에 `repositoryID`로 지정한 저장소 정보를 조회해서, 그 저장소가 어떤 업로드 방식(`UploadType`: 단일/프로필 이미지/다중/에디터 이미지)인지, 허용 확장자·업로드 개수·용량 제한이 얼마인지를 자동으로 결정합니다. 즉 업로드 정책은 화면 코드가 아니라 `repositoryID`가 가리키는 서버 설정에 달려 있습니다.

## 언제 사용하나요?

- 회사 로고, 프로필 사진처럼 파일 1개를 업로드/교체해야 할 때 (`Single`, `Profile` 저장소)
- 첨부파일처럼 여러 개의 파일을 업로드해야 할 때 (`Multi` 저장소)
- 에디터(`HtmlEditor` 등) 안에 삽입할 이미지를 업로드해야 할 때 (`ImageLink` 저장소)
- 업로드된 파일을 다운로드하거나, 목록 조회/삭제/이름 변경/소속 변경(`dependencyID` 변경) 같은 파일 관리 기능이 필요할 때

버튼 클릭 등으로 업로드 창을 여는 것이 일반적인 사용 방식이며, 컨트롤 자체가 파일 선택 UI를 화면에 항상 그려주는 것은 아닙니다.

## 빠른 시작

```html
<syn_fileclient id="sfcCompanyImage" syn-datafield="CompanyImage" syn-options="{repositoryID: 'BDLLP01'}"></syn_fileclient>
<input type="button" id="btnUploadCompanyImage" value="이미지 업로드" syn-events="['click']" />
```

```js
let $mypage = {
    event: {
        btnUploadCompanyImage_click() {
            // 1. 이 컨트롤에 저장된 기본 업로드 옵션을 가져온다
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('sfcCompanyImage');

            // 2. 업로드 완료 후 결과를 받을 콜백, 소속 ID(dependencyID) 등을 필요에 맞게 덮어쓴다
            uploadOptions.fileUpdateCallback = 'sfcCompanyImage_callback';
            uploadOptions.dependencyID = syn.$w.User.CompanyID;
            uploadOptions.minHeight = 386;

            // 3. 업로드 팝업을 연다
            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        sfcCompanyImage_callback(action, result) {
            if (action == 'upload') {
                const item = result.items[0];
                syn.$l.get('hdnCompanyImageUrl').value = item.AbsolutePath;
            }
        }
    }
}
```

핵심 흐름은 "기본 설정을 가져온다(`getFileSetting`) → 필요한 값만 덮어쓴다 → `uploadUI`로 업로드 창을 연다 → 업로드가 끝나면 지정한 콜백 함수가 `(action, result)`로 호출된다"입니다. 업로드는 보통 이렇게 버튼 클릭에서 프로그램적으로(programmatically) 호출하며, 컨트롤이 페이지 로드 시 자동으로 업로드 UI를 그려주지는 않습니다.

`/js/syn.loader.js`가 `syn_fileclient` 태그를 자동으로 인식해 필요한 CSS/JS를 알아서 불러오므로, 페이지 맨 아래에 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 됩니다.

## 예제 실행하기

`example/` 폴더에 다음 예제가 있습니다. 실행 중인 사이트에서 아래 경로로 바로 열어볼 수 있습니다. (예제의 `repositoryID` 값은 서버에 미리 등록되어 있어야 실제로 동작합니다. 등록되지 않은 값이면 "파일 서버 저장 정보 확인 필요" 경고가 표시됩니다.)

- `example/basic.html` — 단일 파일 업로드/다운로드/삭제와 업로드 완료 콜백(`fileUpdateCallback`)으로 결과를 표시하는 가장 기본적인 사용법
- `example/settings.html` — `dependencyID`, `custom1`~`custom3`, `minHeight` 등 업로드 옵션을 상황에 맞게 커스터마이징하는 방법 (다중 파일 저장소 기준)
- `example/methods.html` — `getValue`/`setValue`/`clear`와 `getItem`/`getItems`/`deleteItem` 등 값 조회·관리 메서드 데모

## 더 알아보기

전체 옵션/메서드 목록은 [API.md](./API.md)를 참고하세요.
