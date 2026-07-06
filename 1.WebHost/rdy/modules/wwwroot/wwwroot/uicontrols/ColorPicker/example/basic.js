'use strict';
let $basic = {
    event: {
        clpBackgroundColor_change(evt) {
            syn.$l.eventLog('clpBackgroundColor_change', syn.uicontrols.$colorpicker.getValue('clpBackgroundColor'));
        },

        clpAccentColor_change(evt) {
            syn.$l.eventLog('clpAccentColor_change', syn.uicontrols.$colorpicker.getValue('clpAccentColor'));
        }
    }
}
