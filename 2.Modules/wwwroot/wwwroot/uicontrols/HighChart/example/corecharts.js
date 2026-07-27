'use strict';
let $corecharts = {
    prop: {
        rows: [{
            MONTH: '1월',
            SALES: 120,
            PROFIT: 34,
            SIZE: 18
        },
        {
            MONTH: '2월',
            SALES: 165,
            PROFIT: 48,
            SIZE: 25
        },
        {
            MONTH: '3월',
            SALES: 142,
            PROFIT: 39,
            SIZE: 21
        },
        {
            MONTH: '4월',
            SALES: 210,
            PROFIT: 71,
            SIZE: 32
        },
        {
            MONTH: '5월',
            SALES: 188,
            PROFIT: 61,
            SIZE: 28
        }]
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            const categories = rows.map(row => row.MONTH);
            return Promise.all([syn.uicontrols.$chart.renderChart('chtLineArea', {
                rows,
                rowIndexMap: [rows.map((_, index) => index),
                rows.map((_, index) => index)
                ],
                option: {
                    title: {
                        text: '월별 매출과 이익'
                    },
                    xAxis: {
                        categories
                    },
                    tooltip: {
                        shared: true
                    },
                    series: [{
                        type: 'spline',
                        name: '매출',
                        data: rows.map(row => row.SALES)
                    },
                    {
                        type: 'areaspline',
                        name: '이익',
                        data: rows.map(row => row.PROFIT),
                        fillOpacity: 0.25
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtCombination', {
                option: {
                    title: {
                        text: 'Column·Pie 조합'
                    },
                    xAxis: {
                        categories
                    },
                    series: [{
                        type: 'column',
                        name: '매출',
                        data: rows.map(row => row.SALES)
                    },
                    {
                        type: 'spline',
                        name: '이익',
                        data: rows.map(row => row.PROFIT)
                    },
                    {
                        type: 'pie',
                        name: '비중',
                        center: [70,
                            45
                        ],
                        size: 90,
                        showInLegend: false,
                        data: rows.map(row => ({
                            name: row.MONTH,
                            y: row.SALES
                        }))
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtScatterBubble', {
                rows,
                rowIndexMap: [rows.map((_, index) => index),
                rows.map((_, index) => index)
                ],
                option: {
                    chart: {
                        type: 'scatter',
                        zoomType: 'xy'
                    },
                    title: {
                        text: '수익성과 규모'
                    },
                    xAxis: {
                        title: {
                            text: '매출'
                        }
                    },
                    yAxis: {
                        title: {
                            text: '이익'
                        }
                    },
                    series: [{
                        name: 'Scatter',
                        data: rows.map(row => [row.SALES,
                        row.PROFIT
                        ])
                    },
                    {
                        type: 'bubble',
                        name: 'Bubble',
                        data: rows.map(row => [row.SALES,
                        row.PROFIT,
                        row.SIZE
                        ])
                    }]
                }
            })
            ]);
        }
    },
    event: {
        chtScatterBubble_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        },
        btnCoreRow_click() {
            $this.method.print(syn.uicontrols.$chart.getValue('chtScatterBubble', 'Row'));
        },
        btnCoreList_click() {
            $this.method.print(syn.uicontrols.$chart.getValue('chtScatterBubble', 'List'));
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
