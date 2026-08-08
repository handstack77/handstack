'use strict';
let $auipivotbasic = {
    prop: {
        dataSet: [
            { Region: '서울', Model: 'A', DateQuarter: '2026-Q1', Total: 1000 },
            { Region: '서울', Model: 'B', DateQuarter: '2026-Q1', Total: 800 },
            { Region: '부산', Model: 'A', DateQuarter: '2026-Q1', Total: 600 },
            { Region: '부산', Model: 'B', DateQuarter: '2026-Q2', Total: 900 }
        ]
    },

    event: {
        btnLoadRows_click() {
            syn.uicontrols.$auipivot.setValue('pvtSales', $this.prop.dataSet);
            syn.$l.eventLog('btnLoadRows_click', '샘플 데이터 4건 로드');
        },

        btnExpandAll_click() {
            syn.uicontrols.$auipivot.expandAll('pvtSales');
            syn.$l.eventLog('btnExpandAll_click', '모든 행 펼침');
        },

        btnClear_click() {
            syn.uicontrols.$auipivot.clear('pvtSales');
        },

        pvtSales_cellClick(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('pvtSales_cellClick', '{0}:{1}'.format(dataField, value));
        },

        pvtSales_sorting(elID) {
            syn.$l.eventLog('pvtSales_sorting', '정렬 변경');
        }
    }
}
