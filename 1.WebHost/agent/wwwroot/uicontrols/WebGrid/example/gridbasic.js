'use strict';
let $gridbasic = {
    prop: {
        dataSet: [
            { ProdID: 'P001', ProdName: '모니터', Price: 250000, UseYN: true },
            { ProdID: 'P002', ProdName: '키보드', Price: 45000, UseYN: true },
            { ProdID: 'P003', ProdName: '마우스', Price: 25000, UseYN: false }
        ]
    },

    event: {
        btnLoadRows_click() {
            syn.uicontrols.$grid.setValue('grdBasic', $this.prop.dataSet);
            syn.$l.eventLog('btnLoadRows_click', '샘플 데이터 3건 로드');
        },

        btnInsertRow_click() {
            syn.uicontrols.$grid.insertRow('grdBasic', {
                index: syn.uicontrols.$grid.countRows('grdBasic'),
                amount: 1,
                values: [{ ProdID: '', ProdName: '', Price: 0, UseYN: false }]
            });
            syn.$l.eventLog('btnInsertRow_click', '행 추가 (Flag: C)');
        },

        btnRemoveRow_click() {
            var rowIndex = syn.uicontrols.$grid.getActiveRowIndex('grdBasic');
            if (rowIndex > -1) {
                syn.uicontrols.$grid.removeRow('grdBasic', 0, rowIndex);
                syn.$l.eventLog('btnRemoveRow_click', '행 삭제: ' + rowIndex);
            }
        },

        btnGetValue_click() {
            var rows = syn.uicontrols.$grid.getValue('grdBasic', 'List');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(rows));
        },

        btnClear_click() {
            syn.uicontrols.$grid.clear('grdBasic');
        },

        grdBasic_afterSelectionEnd(row, column, row2, column2, selectionLayerLevel) {
            syn.$l.eventLog('grdBasic_afterSelectionEnd', '{0},{1}'.format(row, column));
        }
    }
}
