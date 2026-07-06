'use strict';
let $getset = {
    config: {
        dataSource: {}
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$multiselect.getValue('ddlGrade'));
        },

        btnGetSelectedValue_click() {
            syn.$l.eventLog('btnGetSelectedValue_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedValue('ddlGrade')));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedText('ddlGrade')));
        },

        btnSetValue_click() {
            // setValue는 기존 선택 위에 값을 더하는 것처럼 동작할 수 있으므로,
            // 완전히 새로 선택하고 싶을 때는 clear를 먼저 호출합니다.
            syn.uicontrols.$multiselect.clear('ddlGrade');
            syn.uicontrols.$multiselect.setValue('ddlGrade', ['A', 'C']);
        },

        btnClear_click() {
            syn.uicontrols.$multiselect.clear('ddlGrade');
        },

        btnLoadData_click() {
            var dataSource = {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    { CodeID: 'S', CodeValue: '특급' },
                    { CodeID: 'A', CodeValue: 'A등급' },
                    { CodeID: 'B', CodeValue: 'B등급' }
                ]
            };

            syn.uicontrols.$multiselect.loadData('ddlGrade', dataSource, false);
        }
    }
}
