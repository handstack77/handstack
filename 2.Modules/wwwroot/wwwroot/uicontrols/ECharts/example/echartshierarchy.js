'use strict';
let $echartshierarchy = {
    prop: {
        rows: [{
            ID: 'root',
            PARENT: null,
            NAME: '전체',
            VALUE: 100
        },
        {
            ID: 'sales',
            PARENT: 'root',
            NAME: '영업',
            VALUE: 42
        },
        {
            ID: 'online',
            PARENT: 'sales',
            NAME: '온라인',
            VALUE: 25
        },
        {
            ID: 'offline',
            PARENT: 'sales',
            NAME: '오프라인',
            VALUE: 17
        },
        {
            ID: 'rnd',
            PARENT: 'root',
            NAME: '연구',
            VALUE: 35
        },
        {
            ID: 'ops',
            PARENT: 'root',
            NAME: '운영',
            VALUE: 23
        }]
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            const data = $this.method.buildTree(rows);
            const descriptor = chartType => ({
                rows: rows,
                selectionResolver: '$echartshierarchy.method.resolveNode',
                option: {
                    tooltip: {
                        trigger: 'item'
                    },
                    series: [{
                        type: chartType,
                        data: data,
                        roam: chartType === 'tree',
                        radius: chartType === 'sunburst' ? [20,
                            '88%'
                        ] : undefined,
                        label: {
                            show: true
                        }
                    }]
                }
            });
            return Promise.all([syn.uicontrols.$echarts.renderChart('chtTree', descriptor('tree')),
            syn.uicontrols.$echarts.renderChart('chtTreemap', descriptor('treemap')),
            syn.uicontrols.$echarts.renderChart('chtSunburst', descriptor('sunburst'))
            ]);
        }
    },
    event: {
        chtTree_click(elID, params, selections) {
            $this.method.print(selections);
        },
        chtTreemap_click(elID, params, selections) {
            $this.method.print(selections);
        },
        chtSunburst_click(elID, params, selections) {
            $this.method.print(selections);
        }
    },
    method: {
        buildTree(rows) {
            const nodes = {
            };
            rows.forEach((row, index) => nodes[row.ID] = {
                name: row.NAME,
                value: row.VALUE,
                rowIndex: index,
                children: []
            });
            const roots = [];
            rows.forEach(row => row.PARENT && nodes[row.PARENT] ? nodes[row.PARENT].children.push(nodes[row.ID]) : roots.push(nodes[row.ID]));
            return roots;
        },
        resolveNode(params) {
            return params.data && typeof params.data.rowIndex === 'number' ? params.data.rowIndex : null;
        },
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
