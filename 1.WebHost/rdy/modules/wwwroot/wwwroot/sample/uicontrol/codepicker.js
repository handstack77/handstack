'use strict';
let $codepicker = {
    hook: {
        frameEvent(eventName, jsonObject) {
            syn.$l.eventLog('ui_event', 'frameEvent - eventName: {0}, jsonObject: {1}'.format(eventName, JSON.stringify(jsonObject)));
        },
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$codepicker.getValue('chpSubjectID')));
        },

        btnSetValue_click() {
            syn.uicontrols.$codepicker.setValue('chpSubjectID', 'HELLO');
        },

        btnClear_click() {
            syn.uicontrols.$codepicker.clear('chpSubjectID');
        },

        btnOpen_click() {
            syn.uicontrols.$codepicker.open('chpSubjectID');


        },

        btnSetText_click() {
            syn.uicontrols.$codepicker.setText('chpSubjectID', 'WORLD');
        },

        btnToParameterString_click() {
            var parameterObject = syn.uicontrols.$codepicker.toParameterObject('@ApplicationID:1;@ApplicationName:HELLO WORLD;');
            syn.$l.eventLog('btnToParameterString_click', JSON.stringify(parameterObject));
        },

        btnToParameterObject_click() {
            var parameterObject = syn.uicontrols.$codepicker.toParameterObject('@ApplicationID:1;@ApplicationName:HELLO WORLD;');
            parameterObject.ApplicationID = '0';
            var parameterString = syn.uicontrols.$codepicker.toParameterString(parameterObject);
            syn.$l.eventLog('btnToParameterObject_click', parameterString);
        },

        chpSubjectID_change(previousValue, previousText, changeValue) {
        }
    }
}
