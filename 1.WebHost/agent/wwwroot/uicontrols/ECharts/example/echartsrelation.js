'use strict';
let $echartsrelation = {
    prop: {
        rows: [{
            KIND: 'node',
            NAME: '영업',
            VALUE: 10
        },
        {
            KIND: 'node',
            NAME: '기획',
            VALUE: 8
        },
        {
            KIND: 'node',
            NAME: '개발',
            VALUE: 12
        },
        {
            KIND: 'node',
            NAME: '운영',
            VALUE: 7
        },
        {
            KIND: 'edge',
            FROM: '영업',
            TO: '기획',
            VALUE: 8
        },
        {
            KIND: 'edge',
            FROM: '기획',
            TO: '개발',
            VALUE: 6
        },
        {
            KIND: 'edge',
            FROM: '개발',
            TO: '운영',
            VALUE: 5
        },
        {
            KIND: 'edge',
            FROM: '영업',
            TO: '운영',
            VALUE: 2
        }]
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            const nodes = rows.slice(0, 4);
            const edges = rows.slice(4);
            const nodeMap = nodes.map((row, index) => index);
            const edgeMap = edges.map((row, index) => index + 4);
            return Promise.all([syn.uicontrols.$echarts.renderChart('chtFlow', {
                rows: rows,
                rowIndexMap: [{
                    node: nodeMap,
                    edge: edgeMap
                },
                {
                    node: nodeMap,
                    edge: edgeMap
                }],
                option: {
                    tooltip: {
                    },
                    series: [{
                        type: 'graph',
                        left: '2%',
                        right: '54%',
                        top: 30,
                        bottom: 30,
                        layout: 'force',
                        roam: true,
                        label: {
                            show: true
                        },
                        data: nodes.map(row => ({
                            name: row.NAME,
                            value: row.VALUE,
                            symbolSize: 25 + row.VALUE
                        })),
                        links: edges.map(row => ({
                            source: row.FROM,
                            target: row.TO,
                            value: row.VALUE
                        }))
                    },
                    {
                        type: 'sankey',
                        left: '54%',
                        right: '2%',
                        top: 30,
                        bottom: 30,
                        data: nodes.map(row => ({
                            name: row.NAME
                        })),
                        links: edges.map(row => ({
                            source: row.FROM,
                            target: row.TO,
                            value: row.VALUE
                        })),
                        emphasis: {
                            focus: 'adjacency'
                        }
                    }]
                }
            }),
            syn.uicontrols.$echarts.renderChart('chtChord', {
                rows: rows,
                rowIndexMap: [{
                    edge: edgeMap
                },
                {
                    node: nodeMap,
                    edge: edgeMap
                }],
                option: {
                    tooltip: {
                    },
                    grid: {
                        left: '5%',
                        right: '55%',
                        top: 70,
                        bottom: 50
                    },
                    xAxis: {
                        min: 0,
                        max: 10
                    },
                    yAxis: {
                        min: 0,
                        max: 10
                    },
                    series: [{
                        name: 'Lines',
                        type: 'lines',
                        coordinateSystem: 'cartesian2d',
                        polyline: true,
                        data: edges.map((row, index) => ({
                            coords: [[1,
                                index * 2 + 1
                            ],
                            [4,
                                index + 2
                            ],
                            [8,
                                (index * 3) % 9 + 1
                            ]
                            ],
                            value: row.VALUE
                        }))
                    },
                    {
                        name: 'Chord',
                        type: 'chord',
                        center: ['76%',
                            '50%'
                        ],
                        radius: ['20%',
                            '38%'
                        ],
                        label: {
                            show: true
                        },
                        data: nodes.map(row => ({
                            name: row.NAME
                        })),
                        links: edges.map(row => ({
                            source: row.FROM,
                            target: row.TO,
                            value: row.VALUE
                        }))
                    }]
                }
            })
            ]);
        }
    },
    event: {
        chtFlow_click(elID, params, selections) {
            $this.method.print({
                dataType: params.dataType,
                selections: selections
            });
        },
        chtFlow_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        },
        chtChord_click(elID, params, selections) {
            $this.method.print({
                series: params.seriesType,
                dataType: params.dataType,
                selections: selections
            });
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
