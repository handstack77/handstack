'use strict';
let $chartjsbasic = {
    prop: {
        dataSource: [{
            YEAR: '2022',
            AMOUNT1: 12,
            AMOUNT2: 20
        },
        {
            YEAR: '2023',
            AMOUNT1: 35,
            AMOUNT2: 15
        },
        {
            YEAR: '2024',
            AMOUNT1: 18,
            AMOUNT2: 30
        },
        {
            YEAR: '2025',
            AMOUNT1: 42,
            AMOUNT2: 25
        }],
        metaColumns: {
            YEAR: {
                FieldID: 'YEAR',
                DataType: 'string'
            },
            AMOUNT1: {
                FieldID: 'AMOUNT1',
                DataType: 'number'
            },
            AMOUNT2: {
                FieldID: 'AMOUNT2',
                DataType: 'number'
            }
        }
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$chartjs.setValue('chtChart', $this.prop.dataSource, $this.prop.metaColumns);
        }
    },
    event: {
        btnGetValue_click() {
            $this.method.print(syn.uicontrols.$chartjs.getValue('chtChart', 'List', $this.prop.metaColumns));
        },
        btnSetValue_click() {
            syn.uicontrols.$chartjs.setValue('chtChart', $this.prop.dataSource, $this.prop.metaColumns);
        },
        btnClear_click() {
            syn.uicontrols.$chartjs.clear('chtChart');
        },
        chtChart_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        }
    },
    method: {
        print(value) {
            syn.$l.get('preLog').textContent = JSON.stringify(value, null, 2);
        }
    }
}
