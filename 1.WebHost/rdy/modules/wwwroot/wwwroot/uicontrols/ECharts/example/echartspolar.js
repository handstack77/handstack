'use strict';
let $echartspolar = {
    prop: {
        rows: [{
            NAME: '검색',
            VALUE: 48
        },
        {
            NAME: '추천',
            VALUE: 32
        },
        {
            NAME: '직접',
            VALUE: 20
        },
        {
            NAME: '파트너',
            VALUE: 15
        }]
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            return syn.uicontrols.$echarts.renderChart('chtPolar', {
                rows: rows,
                rowIndexMap: [rows.map((row, index) => index),
                [0],
                rows.map((row, index) => index),
                [0]
                ],
                option: {
                    tooltip: {
                    },
                    legend: {
                        top: 2
                    },
                    radar: {
                        center: ['25%',
                            '72%'
                        ],
                        radius: 90,
                        indicator: rows.map(row => ({
                            name: row.NAME,
                            max: 60
                        }))
                    },
                    series: [{
                        name: '유입',
                        type: 'pie',
                        radius: ['20%',
                            '36%'
                        ],
                        center: ['25%',
                            '28%'
                        ],
                        data: rows.map(row => ({
                            name: row.NAME,
                            value: row.VALUE
                        }))
                    },
                    {
                        name: 'Radar',
                        type: 'radar',
                        data: [{
                            name: '채널 점수',
                            value: rows.map(row => row.VALUE)
                        }]
                    },
                    {
                        name: 'Funnel',
                        type: 'funnel',
                        left: '50%',
                        top: 35,
                        width: '44%',
                        height: 210,
                        data: rows.map(row => ({
                            name: row.NAME,
                            value: row.VALUE
                        }))
                    },
                    {
                        name: '달성률',
                        type: 'gauge',
                        center: ['73%',
                            '76%'
                        ],
                        radius: 90,
                        progress: {
                            show: true
                        },
                        data: [{
                            name: '달성',
                            value: 82
                        }]
                    }]
                }
            });
        }
    },
    event: {
        chtPolar_click(elID, params, selections) {
            $this.method.print({
                series: params.seriesType,
                point: params.name,
                selections: selections
            });
        },
        chtPolar_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
