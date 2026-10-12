'use strict';
let $datetime = {
    event: {
        dtpDateTime_onselect(elID, date) {
            syn.$l.eventLog('dtpDateTime_onselect', elID + ' => ' + date);
        },

        dtpNow_onselect(elID, date) {
            syn.$l.eventLog('dtpNow_onselect', elID + ' => ' + date);
        }
    }
}
