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
            var value = syn.uicontrols.$propertygrid.getValue('pgEvents');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
            document.getElementById('preLog').textContent = JSON.stringify(value, null, 2);
        },

        btnSetValue_click() {
            syn.uicontrols.$propertygrid.setValue('pgEvents', $events.prop.dataSet);
            syn.$l.eventLog('btnSetValue_click', '초기 데이터로 다시 채웠습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$propertygrid.clear('pgEvents');
            syn.$l.eventLog('btnClear_click', '그리드를 비웠습니다.');
        }
    },

    method: {
        handleChange(element, name, value, control) {
            syn.$l.eventLog('pgEvents_change', name + ' = ' + JSON.stringify(value));
        }
    }
}
