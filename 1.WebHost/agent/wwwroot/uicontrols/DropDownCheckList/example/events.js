'use strict';
let $events = {
    config: {
        dataSource: {}
    },

    event: {
        ddlColor_change(evt) {
            syn.$l.eventLog('ddlColor_change', JSON.stringify(syn.uicontrols.$multiselect.getSelectedValue('ddlColor')));
        },

        btnGetSelectedValue_click() {
            syn.$l.eventLog('btnGetSelectedValue_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedValue('ddlColor')));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedText('ddlColor')));
        }
    }
}
