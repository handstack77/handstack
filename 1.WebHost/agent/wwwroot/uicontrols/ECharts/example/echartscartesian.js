'use strict';
let $echartscartesian = {
    prop: {
        rows: [{
            KIND: 'sales',
            NAME: '1월',
            SALES: 120,
            PROFIT: 32
        },
        {
            KIND: 'sales',
            NAME: '2월',
            SALES: 182,
            PROFIT: 54
        },
        {
            KIND: 'sales',
            NAME: '3월',
            SALES: 150,
            PROFIT: 41
        },
        {
            KIND: 'sales',
            NAME: '4월',
            SALES: 232,
            PROFIT: 78
        },
        {
            KIND: 'stock',
            NAME: '월',
            OPEN: 100,
            CLOSE: 108,
            LOW: 96,
            HIGH: 111
        },
        {
            KIND: 'stock',
            NAME: '화',
            OPEN: 108,
            CLOSE: 105,
            LOW: 101,
            HIGH: 114
        },
        {
            KIND: 'stock',
            NAME: '수',
            OPEN: 105,
            CLOSE: 116,
            LOW: 103,
            HIGH: 119
        },
        {
            KIND: 'stock',
            NAME: '목',
            OPEN: 116,
            CLOSE: 121,
            LOW: 112,
            HIGH: 124
        },
        {
            KIND: 'stat',
            NAME: 'A',
            MIN: 12,
            Q1: 20,
            MEDIAN: 31,
            Q3: 42,
            MAX: 55
        },
        {
            KIND: 'stat',
            NAME: 'B',
            MIN: 18,
            Q1: 27,
            MEDIAN: 35,
            Q3: 48,
            MAX: 61
        }]
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            const sales = rows.slice(0, 4);
            const stocks = rows.slice(4, 8);
            const stats = rows.slice(8);
            return syn.uicontrols.$echarts.renderChart('chtCartesian', {
                rows: rows,
                rowIndexMap: [[0,
                    1,
                    2,
                    3
                ],
                [0,
                    1,
                    2,
                    3
                ],
                [0,
                    1,
                    2,
                    3
                ],
                [0,
                    1,
                    2,
                    3
                ],
                [4,
                    5,
                    6,
                    7
                ],
                [8,
                    9
                ]
                ],
                option: {
                    animationDuration: 500,
                    tooltip: {
                        trigger: 'item'
                    },
                    legend: {
                        top: 2
                    },
                    grid: [{
                        left: '7%',
                        right: '54%',
                        top: 55,
                        height: 180
                    },
                    {
                        left: '55%',
                        right: '6%',
                        top: 55,
                        height: 180
                    },
                    {
                        left: '10%',
                        right: '10%',
                        top: 330,
                        height: 120
                    }],
                    xAxis: [{
                        type: 'category',
                        gridIndex: 0,
                        data: sales.map(row => row.NAME)
                    },
                    {
                        type: 'category',
                        gridIndex: 1,
                        data: stocks.map(row => row.NAME)
                    },
                    {
                        type: 'category',
                        gridIndex: 2,
                        data: stats.map(row => row.NAME)
                    }],
                    yAxis: [{
                        gridIndex: 0
                    },
                    {
                        gridIndex: 1,
                        scale: true
                    },
                    {
                        gridIndex: 2
                    }],
                    series: [{
                        name: '매출 Bar',
                        type: 'bar',
                        xAxisIndex: 0,
                        yAxisIndex: 0,
                        data: sales.map(row => row.SALES)
                    },
                    {
                        name: '이익 Line',
                        type: 'line',
                        xAxisIndex: 0,
                        yAxisIndex: 0,
                        smooth: true,
                        data: sales.map(row => row.PROFIT)
                    },
                    {
                        name: 'Scatter',
                        type: 'scatter',
                        xAxisIndex: 0,
                        yAxisIndex: 0,
                        symbolSize: 16,
                        data: sales.map(row => row.PROFIT)
                    },
                    {
                        name: 'Pictorial',
                        type: 'pictorialBar',
                        xAxisIndex: 0,
                        yAxisIndex: 0,
                        symbol: 'diamond',
                        symbolRepeat: true,
                        symbolSize: [12,
                            6
                        ],
                        data: sales.map(row => Math.round(row.SALES / 3))
                    },
                    {
                        name: 'Candlestick',
                        type: 'candlestick',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        data: stocks.map(row => [row.OPEN,
                        row.CLOSE,
                        row.LOW,
                        row.HIGH
                        ])
                    },
                    {
                        name: 'Boxplot',
                        type: 'boxplot',
                        xAxisIndex: 2,
                        yAxisIndex: 2,
                        data: stats.map(row => [row.MIN,
                        row.Q1,
                        row.MEDIAN,
                        row.Q3,
                        row.MAX
                        ])
                    }]
                }
            });
        }
    },
    event: {
        chtCartesian_click(elID, params, selections) {
            $this.method.print({
                point: params.name,
                selections: selections
            });
        },
        chtCartesian_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        },
        btnCartesianRow_click() {
            $this.method.print(syn.uicontrols.$echarts.getValue('chtCartesian', 'Row'));
        },
        btnCartesianList_click() {
            $this.method.print(syn.uicontrols.$echarts.getValue('chtCartesian', 'List'));
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
