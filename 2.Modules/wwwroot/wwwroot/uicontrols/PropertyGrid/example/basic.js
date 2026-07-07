'use strict';
let $basic = {
    prop: {
        dataSet: {
            Name: '홍길동',
            Age: 32,
            UseYN: true,
            FavoriteColor: '#2563eb'
        }
    },

    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$propertygrid.getValue('pgBasic');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
            document.getElementById('preLog').textContent = JSON.stringify(value, null, 2);
        },

        btnSetValue_click() {
            syn.uicontrols.$propertygrid.setValue('pgBasic', $basic.prop.dataSet);
            syn.$l.eventLog('btnSetValue_click', '초기 데이터로 다시 채웠습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$propertygrid.clear('pgBasic');
            syn.$l.eventLog('btnClear_click', '그리드를 비웠습니다.');
        }
    }
}
