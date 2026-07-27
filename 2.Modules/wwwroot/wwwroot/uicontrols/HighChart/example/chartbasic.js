'use strict';
let $chartbasic = {
    prop: {
        rows: [{
            YEAR: '2023',
            AMOUNT: 120,
            PROFIT: 22
        },
        {
            YEAR: '2024',
            AMOUNT: 155,
            PROFIT: 35
        },
        {
            YEAR: '2025',
            AMOUNT: 182,
            PROFIT: 48
        },
        {
            YEAR: '2026',
            AMOUNT: 210,
            PROFIT: 61
        }],
        metaColumns: {
            YEAR: {
                FieldID: 'YEAR',
                DataType: 'string'
            },
            AMOUNT: {
                FieldID: 'AMOUNT',
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
            syn.uicontrols.$chart.setValue('chtSales', $this.prop.rows, $this.prop.metaColumns);
        }
    },
    event: {
        btnGetValue_click() {
            $this.method.print(syn.uicontrols.$chart.getValue('chtSales', 'List', $this.prop.metaColumns));
        },
        btnSetValue_click() {
            syn.uicontrols.$chart.setValue('chtSales', $this.prop.rows, $this.prop.metaColumns);
        },
        btnClear_click() {
            syn.uicontrols.$chart.clear('chtSales');
        },
        btnToImage_click() {
            syn.uicontrols.$chart.toImage('chtSales', 'sales-chart');
        },
        chtSales_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        }
    },
    method: {
        print(value) {
            syn.$l.get('preLog').textContent = JSON.stringify(value, null, 2);
        }
    }
}
