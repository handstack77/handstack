'use strict';
let $basic = {
    event: {
        btnUploadCompanyImage_click() {
            // 1. 컨트롤에 저장된 기본 업로드 옵션(저장소 조회 결과 포함)을 가져온다
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('sfcCompanyImage');

            // 2. 업로드 완료 콜백과 소속 키(dependencyID)를 지정한다
            //    dependencyID가 없는 신규 등록 화면이라면 getTemporaryDependencyID로 임시 키를 만들어 쓴다
            uploadOptions.fileUpdateCallback = 'sfcCompanyImage_callback';
            uploadOptions.dependencyID = syn.uicontrols.$fileclient.getTemporaryDependencyID('sfcCompanyImage');
            uploadOptions.minHeight = 386;

            // 3. 업로드 팝업을 연다
            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        // 업로드 팝업이 닫히면서 호출되는 콜백. action은 보통 'upload'이며,
        // result.items에 업로드된 파일들의 ItemID/AbsolutePath 등이 담겨 온다.
        sfcCompanyImage_callback(action, result) {
            syn.$l.eventLog('sfcCompanyImage_callback', action + ', ' + JSON.stringify(result));

            if (action == 'upload' && result.items.length > 0) {
                var item = result.items[0];
                syn.$l.eventLog('sfcCompanyImage_callback', '업로드 완료: ' + item.ItemID);
            }
        },

        btnDownloadCompanyImage_click() {
            // 컨트롤의 현재 값(ItemID)을 그대로 다운로드
            syn.uicontrols.$fileclient.fileDownload('sfcCompanyImage');
        },

        btnGetValueCompanyImage_click() {
            syn.$l.eventLog('btnGetValueCompanyImage_click', syn.uicontrols.$fileclient.getValue('sfcCompanyImage'));
        },

        btnDeleteCompanyImage_click() {
            var itemID = syn.uicontrols.$fileclient.getValue('sfcCompanyImage');
            if (itemID == '') {
                syn.$l.eventLog('btnDeleteCompanyImage_click', '삭제할 파일이 없습니다');
                return;
            }

            syn.uicontrols.$fileclient.deleteItem('sfcCompanyImage', itemID, function (result) {
                syn.$l.eventLog('btnDeleteCompanyImage_click', JSON.stringify(result));
            });
        }
    }
}
