'use strict';
let $customToolbar = {
    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$htmleditor.getValue('edtCustom');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$htmleditor.setValue('edtCustom', '<table style="border-collapse: collapse; width: 100%;" border="1"><tbody><tr><td>1행 1열</td><td>1행 2열</td></tr><tr><td>2행 1열</td><td>2행 2열</td></tr></tbody></table>');
        },

        btnClear_click() {
            syn.uicontrols.$htmleditor.clear('edtCustom');
        },

        edtCustom_documentReady(elID, editor) {
            syn.$l.eventLog('edtCustom_documentReady', elID + ' 초기화 완료');
        },

        // 업로드 전 이미지 크기를 원하는 규격으로 직접 조정하고 싶을 때 정의합니다.
        // 정의하지 않으면 기본 리사이즈(최대 600px)가 적용됩니다.
        edtCustom_beforeUploadImageResize(elID, file, callback) {
            syn.uicontrols.$htmleditor.resizeImage(file, 320).then(function (adjustBlob) {
                callback(adjustBlob);
            });
        }
    }
}
