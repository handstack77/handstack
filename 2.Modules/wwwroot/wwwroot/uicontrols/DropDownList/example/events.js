'use strict';
let $events = {
    config: {
        dataSource: {}
    },

    event: {
        ddlGender_change(evt) {
            syn.$l.eventLog('ddlGender_change', syn.uicontrols.$select.getSelectedValue('ddlGender'));
        },

        btnGetSelectedValue_click() {
            syn.$l.eventLog('btnGetSelectedValue_click', syn.uicontrols.$select.getSelectedValue('ddlGender'));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', syn.uicontrols.$select.getSelectedText('ddlGender'));
        },

        btnSetSelectedValue_click() {
            syn.uicontrols.$select.setSelectedValue('ddlGender', 'F');
        }
    }
}
