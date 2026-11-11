'use strict';
let $settings = {
    event: {
        btnUploadAttachFiles_click() {
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('sfcAttachFiles');

            // 화면 입력값으로 소속 키와 부가 경로(custom1)를 덮어쓴다.
            // custom1~3은 서버 업로드 API에 custompath1~3 이름으로 함께 전달된다.
            uploadOptions.dependencyID = syn.$l.get('txtAttachDependencyID').value;
            uploadOptions.custom1 = syn.$l.get('txtAttachCustom1').value;
            uploadOptions.fileUpdateCallback = 'sfcAttachFiles_callback';

            // 다중 업로드 팝업은 파일 목록이 늘어나므로 기본값(360)보다 넉넉하게 높이를 지정
            uploadOptions.minHeight = 420;

            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        sfcAttachFiles_callback(action, result) {
            syn.$l.eventLog('sfcAttachFiles_callback', action + ', ' + JSON.stringify(result));
        },

        btnGetValueAttachFiles_click() {
            // 다중 업로드 컨트롤의 값은 콤마로 연결된 ItemID 목록 문자열이다.
            syn.$l.eventLog('btnGetValueAttachFiles_click', syn.uicontrols.$fileclient.getValue('sfcAttachFiles'));
        }
    }
}
