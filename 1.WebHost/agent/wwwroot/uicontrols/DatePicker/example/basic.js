'use strict';
let $basic = {
    event: {
        dtpBasic_onselect(elID, date) {
            syn.$l.eventLog('dtpBasic_onselect', elID + ' => ' + date);
        },

        dtpRangeStart_onselect(elID, date) {
            syn.$l.eventLog('dtpRangeStart_onselect', elID + ' => ' + date);
        },

        dtpRangeEnd_onselect(elID, date) {
            syn.$l.eventLog('dtpRangeEnd_onselect', elID + ' => ' + date);
        }
    }
}
