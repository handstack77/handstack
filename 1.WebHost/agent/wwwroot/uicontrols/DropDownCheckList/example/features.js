'use strict';
let $features = {
    event: {
        ddlGrade_change() {
            syn.$l.eventLog('ddlGrade_change', syn.uicontrols.$multiselect.getValue('ddlGrade') || '(선택 없음)');
        },

        ddlCategory_change() {
            syn.$l.eventLog('ddlCategory_change', syn.uicontrols.$multiselect.getSelectedText('ddlCategory').join(', ') || '(선택 없음)');
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$multiselect.getValue('ddlGrade')));
        },

        btnGetSelectedValue_click() {
            syn.$l.eventLog('btnGetSelectedValue_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedValue('ddlGrade')));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedText('ddlGrade')));
        },

        btnGetSelectedIndex_click() {
            syn.$l.eventLog('btnGetSelectedIndex_click', JSON.stringify(syn.uicontrols.$multiselect.getSelectedIndex('ddlGrade')));
        },

        // setValue 는 기존 선택을 모두 해제한 뒤 지정한 값만 선택한다(콤마 문자열 또는 배열).
        btnSetValue_click() {
            syn.uicontrols.$multiselect.setValue('ddlGrade', 'A,C');
        },

        btnSetSelectedValue_click() {
            syn.uicontrols.$multiselect.setSelectedValue('ddlGrade', ['B', 'D']);
        },

        btnSetSelectedText_click() {
            syn.uicontrols.$multiselect.setSelectedText('ddlGrade', 'A등급');
        },

        // 지정한 인덱스(숫자 또는 숫자 배열)의 옵션만 선택하고 나머지는 해제한다.
        btnSetSelectedIndex_click() {
            syn.uicontrols.$multiselect.setSelectedIndex('ddlGrade', [0, 2]);
        },

        btnClear_click() {
            syn.uicontrols.$multiselect.clear('ddlGrade');
            syn.uicontrols.$multiselect.clear('ddlCategory');
        },

        btnDisabled_click() {
            syn.uicontrols.$multiselect.disabled('ddlGrade', true);
        },

        btnEnabled_click() {
            syn.uicontrols.$multiselect.disabled('ddlGrade', false);
        },

        btnLockSelected_click() {
            syn.uicontrols.$multiselect.setSelectedDisabled('ddlGrade', true);
            syn.$l.eventLog('btnLockSelected_click', '선택된 항목을 제외한 나머지 옵션을 선택 불가로 만들었습니다.');
        },

        btnUnlockSelected_click() {
            syn.uicontrols.$multiselect.setSelectedDisabled('ddlGrade', false);
        },

        btnLoadData_click() {
            syn.uicontrols.$multiselect.loadData('ddlGrade', {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    { CodeID: 'S', CodeValue: '소형' },
                    { CodeID: 'M', CodeValue: '중형' },
                    { CodeID: 'L', CodeValue: '대형' }
                ]
            }, false);
            syn.$l.eventLog('btnLoadData_click', '이미 가지고 있는 데이터로 옵션을 교체했습니다.');
        },

        btnDataRefresh_click() {
            syn.uicontrols.$multiselect.dataRefresh('ddlCategory', {
                storeSourceID: 'CATEGORY',
                local: true,
                sharedAssetUrl: './',
                deleteCache: true
            }, function () {
                syn.$l.eventLog('btnDataRefresh_click', 'CATEGORY.json 을 다시 불러왔습니다.');
            });
        }
    }
}
