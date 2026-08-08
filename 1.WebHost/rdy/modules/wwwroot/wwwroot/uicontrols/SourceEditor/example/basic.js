'use strict';
let $basic = {
    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$sourceeditor.getValue('txtEditor1');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$sourceeditor.setValue('txtEditor1', 'function hello() {\n\talert("Hello world!");\n}');
        },

        btnClear_click() {
            syn.uicontrols.$sourceeditor.clear('txtEditor1');
        }
    }
}
