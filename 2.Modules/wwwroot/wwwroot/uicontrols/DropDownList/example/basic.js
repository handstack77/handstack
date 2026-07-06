'use strict';
let $basic = {
    config: {
        dataSource: {}
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$select.getValue('ddlFruit'));
        },

        btnSetValue_click() {
            syn.uicontrols.$select.setValue('ddlFruit', 'banana');
        },

        btnClear_click() {
            syn.uicontrols.$select.clear('ddlFruit');
        }
    }
}
