'use strict';
let $shorthand = {
    hook: {
        pageLoad() {
            syn.$l.eventLog('dtpLast7Days 초기값', syn.uicontrols.$dateperiodpicker.getValue('dtpLast7Days'));
            syn.$l.eventLog('dtpAlertPeriod 초기값', syn.uicontrols.$dateperiodpicker.getValue('dtpAlertPeriod'));
            syn.$l.eventLog('dtpToday 초기값', syn.uicontrols.$dateperiodpicker.getValue('dtpToday'));
        }
    }
}
