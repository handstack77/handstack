'use strict';
let $echartsadapter = {
    prop: {
        rows: [{
            ID: 'root',
            PARENT_ID: null,
            NAME: '전체',
            VALUE: 100
        },
        {
            ID: 'sales',
            PARENT_ID: 'root',
            NAME: '영업',
            VALUE: 65
        },
        {
            ID: 'rnd',
            PARENT_ID: 'root',
            NAME: '연구',
            VALUE: 35
        }]
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$echarts.setValue('chtTree', $this.prop.rows);
        }
    },
    event: {
        btnShow_click() {
            syn.$l.get('preResult').textContent = JSON.stringify(syn.uicontrols.$echarts.getValue('chtTree'), null, 2);
        },
        chtTree_selectionChange(elID, params, selections) {
            syn.$l.get('preResult').textContent = JSON.stringify(selections, null, 2);
        }
    },
    method: {
        treeAdapter(rows, metaColumns, currentOption) {
            let nodes = {
            };
            rows.forEach((row, rowIndex) => nodes[row.ID] = {
                name: row.NAME,
                value: row.VALUE,
                rowIndex: rowIndex,
                children: []
            });
            let roots = [];
            rows.forEach(row => {
                if (row.PARENT_ID && nodes[row.PARENT_ID]) {
                    nodes[row.PARENT_ID].children.push(nodes[row.ID]);
                } else {
                    roots.push(nodes[row.ID]);
                }
            });
            return {
                series: [{
                    data: roots
                }]
            };
        },
        treeSelectionResolver(params, rows) {
            return params.data && typeof params.data.rowIndex === 'number' ? params.data.rowIndex : null;
        }
    }
}
