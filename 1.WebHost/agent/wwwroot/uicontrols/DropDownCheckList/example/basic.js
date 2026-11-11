'use strict';
let $basic = {
    config: {
        dataSource: {}
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$multiselect.getValue('ddlFruit'));
        },

        btnSetValue_click() {
            // 먼저 clear로 기존 선택을 지운 뒤, 원하는 값들만 다시 선택합니다.
            syn.uicontrols.$multiselect.clear('ddlFruit');
            syn.uicontrols.$multiselect.setValue('ddlFruit', ['banana', 'grape']);
        },

        btnClear_click() {
            syn.uicontrols.$multiselect.clear('ddlFruit');
        }
    }
}
