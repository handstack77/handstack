'use strict';
let $auigridevents = {
    prop: {
        dataSet: [
            { GroupCode: 'MD01', GroupName: '메뉴 분류' },
            { GroupCode: 'DD01', GroupName: '부서 분류' }
        ]
    },

    event: {
        btnLoadRows_click() {
            syn.uicontrols.$auigrid.setValue('grdFlag', $this.prop.dataSet);
            syn.$l.eventLog('btnLoadRows_click', '샘플 데이터 2건 로드 (Flag: R)');
        },

        btnInsertRow_click() {
            syn.uicontrols.$auigrid.insertRow('grdFlag', {
                values: [{ GroupCode: '', GroupName: '' }],
                index: 'last'
            });
            syn.$l.eventLog('btnInsertRow_click', '행 추가 (Flag: C)');
        },

        btnRemoveRow_click() {
            var rowIndex = syn.uicontrols.$auigrid.getActiveRowIndex('grdFlag');
            if (rowIndex > -1) {
                syn.uicontrols.$auigrid.removeRow('grdFlag', 'GroupCode', rowIndex);
                syn.$l.eventLog('btnRemoveRow_click', '행 삭제 처리(Flag: D): ' + rowIndex);
            }
        },

        btnGetFlag_click() {
            var rowIndex = syn.uicontrols.$auigrid.getActiveRowIndex('grdFlag');
            if (rowIndex > -1) {
                var flag = syn.uicontrols.$auigrid.getFlag('grdFlag', rowIndex);
                syn.$l.eventLog('btnGetFlag_click', 'rowIndex ' + rowIndex + ' Flag: ' + flag);
            }
        },

        btnGetValue_click() {
            var rows = syn.uicontrols.$auigrid.getValue('grdFlag', 'List');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(rows));
        },

        grdFlag_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('grdFlag_afterSelectionEnd', '{0},{1}'.format(rowIndex, dataField));
        },

        grdFlag_cellEditEnd(elID, evt) {
            syn.$l.eventLog('grdFlag_cellEditEnd', JSON.stringify(evt.item));
        }
    }
}
