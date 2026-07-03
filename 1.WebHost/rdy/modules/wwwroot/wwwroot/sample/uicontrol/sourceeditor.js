'use strict';
let $sourceeditor = {
    hook: {
        pageLoad() {

        }
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$sourceeditor.getValue('txtEditor1')));
        },

        btnSetValue_click() {
            syn.uicontrols.$sourceeditor.setValue('txtEditor1', 'function hello() {\n\talert("Hello world!");\n}');
        },

        btnClear_click() {
            syn.uicontrols.$sourceeditor.clear('txtEditor1');
        }
    }
}
