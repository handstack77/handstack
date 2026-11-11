'use strict';
let $echartsbasic = {
    prop: {
        rows: [{
            YEAR: '2022',
            SALES: 120,
            PROFIT: 32
        },
        {
            YEAR: '2023',
            SALES: 180,
            PROFIT: 61
        },
        {
            YEAR: '2024',
            SALES: 150,
            PROFIT: 48
        },
        {
            YEAR: '2025',
            SALES: 230,
            PROFIT: 84
        }],
        metaColumns: {
            YEAR: {
                FieldID: 'YEAR',
                DataType: 'string'
            },
            SALES: {
                FieldID: 'SALES',
                DataType: 'number'
            },
            PROFIT: {
                FieldID: 'PROFIT',
                DataType: 'number'
            }
        }
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$echarts.setValue('chtSales', $this.prop.rows, $this.prop.metaColumns);
        }
    },
    event: {
        chtSales_click(elID, params, selections) {
            $this.method.print({
                event: 'click',
                point: params.name,
                selections: selections
            });
        },
        chtSales_selectionChange(elID, params, selections) {
            $this.method.print({
                event: 'selectionChange',
                selections: selections
            });
        },
        chtSales_dataBound(elID, params) {
            $this.method.print({
                event: 'dataBound',
                rowCount: params.rows.length
            });
        },
        btnGetRow_click() {
            $this.method.print(syn.uicontrols.$echarts.getValue('chtSales', 'Row', $this.prop.metaColumns));
        },
        btnGetList_click() {
            $this.method.print(syn.uicontrols.$echarts.getValue('chtSales', 'List', $this.prop.metaColumns));
        },
        btnSelection_click() {
            $this.method.print(syn.uicontrols.$echarts.getSelection('chtSales'));
        },
        btnClear_click() {
            syn.uicontrols.$echarts.clearSelection('chtSales');
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
}
