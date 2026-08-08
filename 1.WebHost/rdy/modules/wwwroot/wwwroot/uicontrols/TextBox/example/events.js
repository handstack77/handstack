'use strict';
let $events = {
    event: {
        txtComment_focus(evt) {
            syn.$l.eventLog('txtComment_focus', '입력 필드에 포커스가 들어왔습니다.');
        },

        txtComment_change(evt) {
            syn.$l.eventLog('txtComment_change', syn.uicontrols.$textbox.getValue('txtComment'));
        },

        txtComment_blur(evt) {
            syn.$l.eventLog('txtComment_blur', syn.uicontrols.$textbox.getValue('txtComment'));
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$textbox.getValue('txtComment')));
        },

        btnSetValue_click() {
            syn.uicontrols.$textbox.setValue('txtComment', '안녕하세요');
        },

        btnClear_click() {
            syn.uicontrols.$textbox.clear('txtComment');
        }
    },
}
