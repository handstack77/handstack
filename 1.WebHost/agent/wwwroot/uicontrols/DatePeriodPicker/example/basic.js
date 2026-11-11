'use strict';
let $basic = {
    hook: {
        pageLoad() {
            syn.$l.eventLog('pageLoad', '초기값: ' + syn.uicontrols.$dateperiodpicker.getValue('dtpSearchPeriod'));
        }
    }
}
