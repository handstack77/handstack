'use strict';
let $features = {
    event: {
        ddlPlaceholder_change() {
            syn.$l.eventLog('ddlPlaceholder_change', syn.uicontrols.$select.getValue('ddlPlaceholder'));
        },

        ddlStatus_change() {
            syn.$l.eventLog('ddlStatus_change', `${syn.uicontrols.$select.getValue('ddlStatus')} (${syn.uicontrols.$select.getSelectedText('ddlStatus')})`);
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify({
                Placeholder: syn.uicontrols.$select.getValue('ddlPlaceholder'),
                Required: syn.uicontrols.$select.getValue('ddlRequired'),
                Status: syn.uicontrols.$select.getValue('ddlStatus')
            }));
        },

        btnGetSelectedText_click() {
            syn.$l.eventLog('btnGetSelectedText_click', syn.uicontrols.$select.getSelectedText('ddlPlaceholder'));
        },

        btnGetSelectedIndex_click() {
            syn.$l.eventLog('btnGetSelectedIndex_click', String(syn.uicontrols.$select.getSelectedIndex('ddlPlaceholder')));
        },

        btnSetValue_click() {
            syn.uicontrols.$select.setValue('ddlPlaceholder', 'grape');
        },

        btnSetSelectedValue_click() {
            syn.uicontrols.$select.setSelectedValue('ddlPlaceholder', 'apple');
        },

        btnSetSelectedText_click() {
            syn.uicontrols.$select.setSelectedText('ddlPlaceholder', '바나나');
        },

        btnSetSelectedIndex_click() {
            syn.uicontrols.$select.setSelectedIndex('ddlPlaceholder', 3);
        },

        btnClear_click() {
            syn.uicontrols.$select.clear('ddlPlaceholder');
            syn.uicontrols.$select.clear('ddlStatus');
        },

        btnDisabled_click() {
            syn.uicontrols.$select.disabled('ddlPlaceholder', true);
        },

        btnEnabled_click() {
            syn.uicontrols.$select.disabled('ddlPlaceholder', false);
        },

        btnLockSelected_click() {
            syn.uicontrols.$select.setSelectedDisabled('ddlPlaceholder', true);
            syn.$l.eventLog('btnLockSelected_click', '현재 선택된 값 외의 옵션을 모두 선택 불가로 만들었습니다.');
        },

        btnUnlockSelected_click() {
            syn.uicontrols.$select.setSelectedDisabled('ddlPlaceholder', false);
        },

        btnLoadData_click() {
            syn.uicontrols.$select.loadData('ddlPlaceholder', {
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
            syn.uicontrols.$select.dataRefresh('ddlStatus', {
                storeSourceID: 'ORDERSTATUS',
                local: true,
                sharedAssetUrl: './',
                deleteCache: true
            }, function () {
                syn.$l.eventLog('btnDataRefresh_click', 'ORDERSTATUS.json 을 다시 불러왔습니다.');
            });
        },

        btnControlReload_click() {
            syn.uicontrols.$select.controlReload('ddlPlaceholder');
            syn.$l.eventLog('btnControlReload_click', 'UI 만 다시 그렸습니다(값/옵션 변경 없음).');
        },

        btnGetControl_click() {
            let control = syn.uicontrols.$select.getControl('ddlPlaceholder');
            syn.$l.eventLog('btnGetControl_click', `id: ${control.id}, picker: ${control.picker ? 'tail.select' : '(없음)'}, placeholder: ${control.setting.placeholder}`);
        }
    }
}
