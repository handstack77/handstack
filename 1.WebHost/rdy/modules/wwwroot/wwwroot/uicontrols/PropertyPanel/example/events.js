'use strict';
let $events = {
    prop: {
        dataSet: {
            NotifyYN: true,
            Volume: 50,
            Nickname: '길동'
        }
    },

    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$propertypanel.getValue('ppEvents');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
            document.getElementById('preLog').textContent = JSON.stringify(value, null, 2);
        },

        btnSetValue_click() {
            syn.uicontrols.$propertypanel.setValue('ppEvents', $events.prop.dataSet);
            syn.$l.eventLog('btnSetValue_click', '초기 데이터로 다시 채웠습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$propertypanel.clear('ppEvents');
            syn.$l.eventLog('btnClear_click', '패널을 비웠습니다.');
        }
    },

    method: {
        handleChange(element, name, value, control) {
            syn.$l.eventLog('ppEvents_change', name + ' = ' + JSON.stringify(value));
        }
    }
}
