'use strict';
let $basic = {
    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$htmleditor.getValue('edtBasic');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$htmleditor.setValue('edtBasic', '<p><strong>안녕하세요</strong>, HtmlEditor 입니다.</p>');
        },

        btnClear_click() {
            syn.uicontrols.$htmleditor.clear('edtBasic');
        },

        edtBasic_documentReady(elID, editor) {
            syn.$l.eventLog('edtBasic_documentReady', elID + ' 초기화 완료');
        }
    }
}
