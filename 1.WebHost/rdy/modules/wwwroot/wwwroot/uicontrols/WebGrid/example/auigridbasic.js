'use strict';
let $auigridbasic = {
    prop: {
        dataSet: [
            { ProdID: 'P001', ProdName: '모니터', CategoryID: 'ELEC', UseYN: 'Y', CreateDate: '2026-01-05' },
            { ProdID: 'P002', ProdName: '키보드', CategoryID: 'ELEC', UseYN: 'Y', CreateDate: '2026-02-10' }
        ]
    },

    event: {
        btnLoadRows_click() {
            syn.uicontrols.$auigrid.setValue('grdMain', $this.prop.dataSet);
            syn.$l.eventLog('btnLoadRows_click', '샘플 데이터 2건 로드');
        },

        btnGetValue_click() {
            var rows = syn.uicontrols.$auigrid.getValue('grdMain', 'List');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(rows));
        },

        btnClear_click() {
            syn.uicontrols.$auigrid.clear('grdMain');
        },

        grdMain_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('grdMain_afterSelectionEnd', '{0},{1},{2}'.format(rowIndex, columnIndex, dataField));
        },

        grdMain_afterChange(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item) {
            syn.$l.eventLog('grdMain_afterChange', '{0}: {1} -> {2}'.format(dataField, oldValue, newValue));
        }
    }
}
