'use strict';
let $events = {
    hook: {
        frameEvent(eventName, jsonObject) {
            syn.$l.eventLog('frameEvent', 'eventName: {0}, jsonObject: {1}'.format(eventName, JSON.stringify(jsonObject)));
        }
    },

    event: {
        chpSubjectID_change(value, text, result) {
            syn.$l.eventLog('chpSubjectID_change', JSON.stringify({ value: value, text: text, result: result }));
        },

        chpSubjectID_buttonClick(elID, synOptions) {
            syn.$l.eventLog('chpSubjectID_buttonClick', JSON.stringify({ elID: elID, searchValue: synOptions.searchValue, searchText: synOptions.searchText }));
        },

        chpSchoolCD_change(value, text, result) {
            syn.$l.eventLog('chpSchoolCD_change', JSON.stringify({ value: value, text: text, result: result }));
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$codepicker.getValue('chpSubjectID'));
        },

        btnSetValue_click() {
            syn.uicontrols.$codepicker.setValue('chpSubjectID', 'HELLO');
        },

        btnSetText_click() {
            syn.uicontrols.$codepicker.setText('chpSubjectID', 'WORLD');
        },

        btnClear_click() {
            syn.uicontrols.$codepicker.clear('chpSubjectID');
        }
    }
}
