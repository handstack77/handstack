'use strict';
let $options = {
    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$propertygrid.getValue('pgOptions');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
            document.getElementById('preLog').textContent = JSON.stringify(value, null, 2);
        }
    }
}
