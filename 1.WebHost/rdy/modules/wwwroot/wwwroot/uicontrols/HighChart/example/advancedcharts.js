'use strict';
let $advancedcharts = {
    prop: {
        rows: [{
            FROM: '영업',
            TO: '기획',
            WEIGHT: 8
        },
        {
            FROM: '기획',
            TO: '개발',
            WEIGHT: 6
        },
        {
            FROM: '개발',
            TO: '운영',
            WEIGHT: 5
        },
        {
            FROM: '영업',
            TO: '운영',
            WEIGHT: 2
        }]
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$chart.setValue('chtFlow', $this.prop.rows);
        }
    },
    event: {
        btnShow_click() {
            syn.$l.get('preResult').textContent = JSON.stringify(syn.uicontrols.$chart.getValue('chtFlow'), null, 2);
        },
        chtFlow_selectionChange(elID, params, selections) {
            syn.$l.get('preResult').textContent = JSON.stringify(selections, null, 2);
        }
    },
    method: {
        sankeyAdapter(rows) {
            return {
                option: {
                    tooltip: {
                        pointFormat: '<b>{point.fromNode.name} → {point.toNode.name}: {point.weight}</b>'
                    },
                    series: [{
                        type: 'sankey',
                        name: '업무량',
                        keys: ['from',
                            'to',
                            'weight'
                        ],
                        data: rows.map(row => [row.FROM,
                        row.TO,
                        row.WEIGHT
                        ])
                    }]
                },
                rowIndexMap: [rows.map((row, index) => index)],
                selectionResolver(point) {
                    return point.isNode ? null : point.index;
                }
            };
        }
    }
}
