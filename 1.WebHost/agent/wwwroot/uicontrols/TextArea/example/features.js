'use strict';
let $features = {
    event: {
        txtCode_change() {
            syn.$l.eventLog('txtCode_change', `줄 수: ${syn.uicontrols.$textarea.countLines('txtCode')}`);
        },

        txtCode_blur() {
            syn.$l.eventLog('txtCode_blur', '포커스 이탈');
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$textarea.getValue('txtCode')));
        },

        btnSetValue_click() {
            syn.uicontrols.$textarea.setValue('txtCode', 'SELECT *\nFROM Orders\nWHERE Status = \'PAY\'\nORDER BY OrderNo;');
        },

        btnCountLines_click() {
            syn.$l.eventLog('btnCountLines_click', `${syn.uicontrols.$textarea.countLines('txtCode')}줄`);
        },

        btnGetControl_click() {
            let control = syn.uicontrols.$textarea.getControl('txtCode');
            syn.$l.eventLog('btnGetControl_click', `id: ${control.id}, editor: ${control.editor ? 'CodeMirror ' + control.editor.lineCount() + '줄' : '(없음)'}`);
        },

        btnClear_click() {
            syn.uicontrols.$textarea.clear('txtPlain');
            syn.uicontrols.$textarea.clear('txtBytes');
            syn.uicontrols.$textarea.clear('txtCode');
            syn.uicontrols.$textarea.clear('txtNoLines');
        },

        btnPlainValue_click() {
            syn.$l.eventLog('btnPlainValue_click', JSON.stringify({
                Plain: syn.uicontrols.$textarea.getValue('txtPlain'),
                Bytes: syn.uicontrols.$textarea.getValue('txtBytes')
            }));
        }
    }
}
