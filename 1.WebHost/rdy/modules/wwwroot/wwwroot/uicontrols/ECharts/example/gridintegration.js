'use strict';
let $gridintegration = {
    prop: {
        fallbackRows: [{
            PRODUCT: 'A',
            AMOUNT: 30
        },
        {
            PRODUCT: 'B',
            AMOUNT: 55
        },
        {
            PRODUCT: 'C',
            AMOUNT: 42
        }]
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$echarts.setValue('chtGrid', $this.prop.fallbackRows);
        }
    },
    event: {
        btnAUIGrid_click() {
            let rows = syn.uicontrols.$auigrid && syn.uicontrols.$auigrid.getGridData ? syn.uicontrols.$auigrid.getGridData('grdSource') : $this.prop.fallbackRows;
            syn.uicontrols.$echarts.setValue('chtGrid', rows);
            $this.method.log(rows);
        },
        btnWebGrid_click() {
            let grid = syn.uicontrols.$grid && syn.uicontrols.$grid.getGridControl ? syn.uicontrols.$grid.getGridControl('grdSource') : null;
            let rows = grid && grid.getSourceData ? grid.getSourceData() : $this.prop.fallbackRows;
            syn.uicontrols.$echarts.setValue('chtGrid', rows);
            $this.method.log(rows);
        }
    },
    method: {
        log(rows) {
            syn.$l.get('preResult').textContent = JSON.stringify(rows, null, 2);
        }
    }
}
