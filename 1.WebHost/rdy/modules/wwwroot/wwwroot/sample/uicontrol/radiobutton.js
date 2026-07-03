'use strict';
let $radiobutton = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$radio.getValue('rdoEnabledYN1')));
        },

        btnSetValue_click() {
            syn.uicontrols.$radio.setValue('rdoEnabledYN1', true);
        },

        btnClear_click() {
            syn.uicontrols.$radio.clear('rdoEnabledYN1');
        },

        btnSelectedValue_click() {
            syn.uicontrols.$radio.selectedValue('rdoEnabledYN', 'value 2');
        },

        btnGetGroupNames_click() {
            syn.$l.eventLog('btnGetGroupNames_click', JSON.stringify(syn.uicontrols.$radio.getGroupNames()));
        },

        rdoEnabledYN1_change() {
            console.log('rdoEnabledYN1_change');
        },

        rdoEnabledYN2_change() {
            console.log('rdoEnabledYN2_change');
        },

        rdoEnabledYN3_change() {
            console.log('rdoEnabledYN3_change');
        }
    }
}
