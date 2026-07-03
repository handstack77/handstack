'use strict';
let $jsoneditor = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$jsoneditor.getValue('txtEditor')));
        },

        btnSetValue_click() {
            var defaultSetting = {
                width: '100%',
                height: '240px',
                mode: 'code',
                modes: ['code', 'tree'],
                indentation: 4,
                escapeUnicode: false,
                dataType: 'string',
                belongID: null,
                transactConfig: null,
                triggerConfig: null
            }
            syn.uicontrols.$jsoneditor.setValue('txtEditor', JSON.stringify(defaultSetting));
        },

        btnClear_click() {
            syn.uicontrols.$jsoneditor.clear('txtEditor');
        }
    }
}
