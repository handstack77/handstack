'use strict';
let $radiobutton = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$radio.getValue('rdoUseYN1')));
        },

        btnSetValue_click() {
            syn.uicontrols.$radio.setValue('rdoUseYN1', true);
        },

        btnClear_click() {
            syn.uicontrols.$radio.clear('rdoUseYN1');
        },

        btnSelectedValue_click() {
            syn.uicontrols.$radio.selectedValue('rdoUseYN', 'value 2');
        },

        btnGetGroupNames_click() {
            syn.$l.eventLog('btnGetGroupNames_click', JSON.stringify(syn.uicontrols.$radio.getGroupNames()));
        },

        rdoUseYN1_change() {
            console.log('rdoUseYN1_change');
        },

        rdoUseYN2_change() {
            console.log('rdoUseYN2_change');
        },

        rdoUseYN3_change() {
            console.log('rdoUseYN3_change');
        }
    }
}
