'use strict';
let $integration = {
    prop: {
        rows: [{
            DATE: '2026-07-01',
            SALES: 120,
            PROFIT: 32
        },
        {
            DATE: '2026-07-02',
            SALES: 155,
            PROFIT: 46
        },
        {
            DATE: '2026-07-03',
            SALES: 148,
            PROFIT: 41
        },
        {
            DATE: '2026-07-04',
            SALES: 190,
            PROFIT: 63
        }]
    },
    hook: {
        pageLoad() {
            const operations = syn.uicontrols.$chart.renderChart('chtOperations', {
                modules: ['export-data',
                    'full-screen'
                ],
                option: {
                    title: {
                        text: '명시적 엔진 API'
                    },
                    xAxis: {
                        categories: ['A',
                            'B',
                            'C',
                            'D'
                        ]
                    },
                    exporting: {
                        enabled: true
                    },
                    series: [{
                        type: 'column',
                        name: '처리량',
                        data: [5,
                            8,
                            6,
                            10
                        ]
                    }]
                }
            });
            return Promise.all([operations,
                syn.uicontrols.$chart.setValue('chtAsync', $this.prop.rows)
            ]);
        }
    },
    event: {
        chtAsync_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        },
        btnAppend_click() {
            const chart = syn.uicontrols.$chart.getChartInstance('chtAsync');
            const point = [chart.series[0].data.length,
                175
            ];
            syn.uicontrols.$chart.addPoint('chtAsync', 0, point, true, false);
        },
        btnRow_click() {
            $this.method.print(syn.uicontrols.$chart.getValue('chtAsync', 'Row'));
        },
        btnList_click() {
            $this.method.print(syn.uicontrols.$chart.getValue('chtAsync', 'List'));
        },
        btnSelectNative_click() {
            syn.uicontrols.$chart.selectPoint('chtOperations', 0, 1, true, false);
            $this.method.print('개발자가 selectPoint를 명시적으로 호출했습니다.');
        },
        btnClearNative_click() {
            syn.uicontrols.$chart.selectPoint('chtOperations', 0, 1, false, false);
            $this.method.print('개발자가 네이티브 선택을 해제했습니다.');
        },
        async btnCSV_click() {
            $this.method.print(await syn.uicontrols.$chart.getCSV('chtOperations'));
        },
        btnFullscreen_click() {
            syn.uicontrols.$chart.toggleFullscreen('chtOperations');
        }
    },
    method: {
        adapter(rows) {
            return Promise.resolve({
                option: {
                    chart: {
                        type: 'line'
                    },
                    title: {
                        text: 'Promise dataAdapter'
                    },
                    xAxis: {
                        categories: rows.map(row => row.DATE)
                    },
                    series: [{
                        name: '매출',
                        data: rows.map((row, index) => ({
                            y: row.SALES,
                            custom: {
                                handstackRowIndex: index
                            }
                        }))
                    },
                    {
                        name: '이익',
                        data: rows.map((row, index) => ({
                            y: row.PROFIT,
                            custom: {
                                handstackRowIndex: index
                            }
                        }))
                    }]
                },
                rowIndexMap: [rows.map((_, index) => index),
                rows.map((_, index) => index)
                ]
            });
        },
        print(value) {
            syn.$l.get('preResult').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        }
    }
};
