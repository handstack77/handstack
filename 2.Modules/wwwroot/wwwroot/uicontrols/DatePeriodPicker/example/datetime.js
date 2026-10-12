'use strict';
let $datetime = {
    event: {
        dtpSearchPeriod_onselect(elID, type, date) {
            syn.$l.eventLog('dtpSearchPeriod_onselect', type + ' => ' + date);
        },

        dtpSearchPeriod_onconfirm(elID, startedAt, endedAt) {
            syn.$l.eventLog('dtpSearchPeriod_onconfirm', startedAt + ' ~ ' + endedAt);
        },

        dtpSearchPeriod_onreset(elID, startedAt, endedAt) {
            syn.$l.eventLog('dtpSearchPeriod_onreset', '초기화');
        }
    }
}
