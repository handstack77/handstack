'use strict';
let $options = {
    event: {
        btnGetGroupNames_click() {
            var groupNames = syn.uicontrols.$checkbox.getGroupNames();
            syn.$l.eventLog('btnGetGroupNames_click', JSON.stringify(groupNames));
        }
    }
}
