'use strict';
let $getset = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$colorpicker.getValue('clpColor'));
        },

        btnSetValue_click() {
            syn.uicontrols.$colorpicker.setValue('clpColor', '#FF00FF');
        },

        btnClear_click() {
            syn.uicontrols.$colorpicker.clear('clpColor');
        }
    }
}
