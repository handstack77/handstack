'use strict';
let $htmleditor = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$htmleditor.getValue('txtHtmlEditor')));
        },

        btnSetValue_click() {
            syn.uicontrols.$htmleditor.setValue('txtHtmlEditor', '안녕하세요');
        },

        btnClear_click() {
            syn.uicontrols.$htmleditor.clear('txtHtmlEditor');
        },

        btnExecCommand_click() {
            syn.uicontrols.$htmleditor.execCommand('txtHtmlEditor', 'bold');
            syn.uicontrols.$htmleditor.execCommand('txtHtmlEditor', 'backColor', '#0000FF');
        },

        btnInsertImage_click() {
            syn.uicontrols.$htmleditor.execCommand('txtHtmlEditor', 'insertimage', 'http://www.qcn.co.kr/editor/assets/sample.png');
        },

        txtHtmlEditor_documentReady(elID, editor) {
            syn.$l.eventLog('txtHtmlEditor_documentReady', elID);
        }
    }
}
