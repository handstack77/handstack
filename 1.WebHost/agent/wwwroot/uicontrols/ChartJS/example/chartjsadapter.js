'use strict';
let $chartjsadapter = {
    prop: {
        rows: [{
            TEAM: 'A',
            SALES: 90,
            PROFIT: 18,
            PEOPLE: 8
        },
        {
            TEAM: 'B',
            SALES: 140,
            PROFIT: 31,
            PEOPLE: 14
        },
        {
            TEAM: 'C',
            SALES: 115,
            PROFIT: 24,
            PEOPLE: 10
        }]
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$chartjs.setValue('chtBubble', $this.prop.rows);
        }
    },
    event: {
        btnShow_click() {
            syn.$l.get('preResult').textContent = JSON.stringify(syn.uicontrols.$chartjs.getValue('chtBubble'), null, 2);
        },
        chtBubble_selectionChange(elID, params, selections) {
            syn.$l.get('preResult').textContent = JSON.stringify(selections, null, 2);
        }
    },
    method: {
        bubbleAdapter(rows) {
            return {
                config: {
                    type: 'bubble',
                    data: {
                        datasets: [{
                            label: '팀 성과',
                            data: rows.map(row => ({
                                x: row.SALES,
                                y: row.PROFIT,
                                r: row.PEOPLE
                            }))
                        }]
                    }
                },
                rowIndexMap: [rows.map((row, index) => index)]
            };
        }
    }
}
