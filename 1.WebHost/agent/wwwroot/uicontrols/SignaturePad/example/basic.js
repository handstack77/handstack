'use strict';
let $basic = {
    event: {
        btnGetValue_click() {
            // 서명이 있으면 'data:image/png;base64,...' 문자열, 없으면 빈 문자열
            var value = syn.uicontrols.$signaturepad.getValue('sigBasic');
            syn.$l.eventLog('btnGetValue_click', value ? value.substring(0, 60) + '... (' + value.length + ' chars)' : '(빈 값)');

            var img = syn.$l.get('imgPreview');
            img.hidden = !value;
            if (value) {
                img.src = value;
            }
        },

        btnClear_click() {
            syn.uicontrols.$signaturepad.clear('sigBasic');
            syn.$l.get('imgPreview').hidden = true;
        }
    }
}
