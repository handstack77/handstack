'use strict';
let $contextmenu = {
    event: {
        btnGetControl_click() {
            var ctxButtonControl = syn.uicontrols.$contextmenu.getControl('ctxButtonControl');
            // https://github.com/mar10/jquery-ui-contextmenu
        },

        ctxButtonControl_close(evt, ui) {
            syn.$l.eventLog('ctxButtonControl_close', this.id);
        },

        ctxButtonControl_beforeOpen(evt, ui) {
            syn.$l.eventLog('ctxButtonControl_beforeOpen', evt.delegateTarget.id);
        },

        ctxButtonControl_open(evt, ui) {
            syn.$l.eventLog('ctxButtonControl_open', evt.delegateTarget.id);
        },

        ctxButtonControl_select(evt, ui) {
            syn.$l.eventLog('ctxButtonControl_select', ui.cmd);
        }
    }
}
