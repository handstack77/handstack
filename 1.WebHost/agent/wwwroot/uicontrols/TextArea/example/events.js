'use strict';
let $events = {
    event: {
        // CodeMirror의 change 이벤트: (cm, change) 형태로 전달됩니다.
        txtEvent_change(cm, change) {
            syn.$l.eventLog('txtEvent_change', cm.getValue());
        },

        // CodeMirror의 focus 이벤트: (cm, evt) 형태로 전달됩니다.
        txtEvent_focus(cm, evt) {
            syn.$l.eventLog('txtEvent_focus', '포커스를 얻었습니다');
        },

        // CodeMirror의 blur 이벤트: (cm, evt) 형태로 전달됩니다.
        txtEvent_blur(cm, evt) {
            syn.$l.eventLog('txtEvent_blur', '포커스를 잃었습니다');
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$textarea.getValue('txtEvent');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$textarea.setValue('txtEvent', '버튼을 눌러 값을 변경했습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$textarea.clear('txtEvent');
        }
    }
}
