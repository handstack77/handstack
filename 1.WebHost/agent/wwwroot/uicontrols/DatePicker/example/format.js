'use strict';
let $format = {
    event: {
        dtpToday_onselect(elID, date) {
            syn.$l.eventLog('dtpToday_onselect', elID + ' => ' + date);
        },

        dtpWeekAgo_onselect(elID, date) {
            syn.$l.eventLog('dtpWeekAgo_onselect', elID + ' => ' + date);
        },

        dtpLimited_onselect(elID, date) {
            syn.$l.eventLog('dtpLimited_onselect', elID + ' => ' + date);
        },

        dtpTwoMonths_onselect(elID, date) {
            syn.$l.eventLog('dtpTwoMonths_onselect', elID + ' => ' + date);
        }
    }
}
