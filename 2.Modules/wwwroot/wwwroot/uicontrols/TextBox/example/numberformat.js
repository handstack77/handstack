'use strict';
let $numberformat = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', 'txtAmount = ' + syn.uicontrols.$textbox.getValue('txtAmount'));
        }
    },
}
