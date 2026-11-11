'use strict';
let $stock = {
    prop: {
        rows: []
    },
    hook: {
        pageLoad() {
            const day = 24 * 3600 * 1000;
            const start = Date.UTC(2026, 0, 1);
            let previous = 100;
            $this.prop.rows = Array.from({
                length: 64
            }, (_, index) => {
                const open = previous;
                const close = Math.round((open + Math.sin(index / 4) * 3 + 1.1) * 100) / 100;
                const row = {
                    DATE: start + index * day,
                    OPEN: open,
                    HIGH: Math.max(open, close) + 2,
                    LOW: Math.min(open, close) - 2,
                    CLOSE: close,
                    VOLUME: 800 + index * 17
                };
                previous = close;
                return row;
            });
            const rows = $this.prop.rows;
            return syn.uicontrols.$chart.renderChart('chtStock', {
                constructorType: 'stockChart',
                modules: ['stock-tools'],
                rows,
                selectionResolver(point, event, sourceRows) {
                    return sourceRows.findIndex(row => row.DATE === point.x);
                },
                option: {
                    stockTools: {
                        gui: {
                            enabled: true
                        }
                    },
                    navigation: {
                        bindingsClassName: 'highcharts-stocktools-wrapper'
                    },
                    rangeSelector: {
                        selected: 1
                    },
                    title: {
                        text: 'OHLC·SMA·Flags'
                    },
                    yAxis: [{
                        height: '72%',
                        resize: {
                            enabled: true
                        }
                    },
                    {
                        top: '76%',
                        height: '24%',
                        offset: 0
                    }],
                    series: [{
                        type: 'ohlc',
                        id: 'price',
                        name: '가격',
                        data: rows.map(row => [row.DATE,
                        row.OPEN,
                        row.HIGH,
                        row.LOW,
                        row.CLOSE
                        ])
                    },
                    {
                        type: 'sma',
                        linkedTo: 'price',
                        name: 'SMA'
                    },
                    {
                        type: 'column',
                        name: '거래량',
                        yAxis: 1,
                        data: rows.map(row => [row.DATE,
                        row.VOLUME
                        ])
                    },
                    {
                        type: 'flags',
                        name: '이벤트',
                        onSeries: 'price',
                        data: [{
                            x: rows[15].DATE,
                            title: 'A',
                            text: '계약 변경'
                        },
                        {
                            x: rows[45].DATE,
                            title: 'B',
                            text: '배포 완료'
                        }]
                    }]
                }
            });
        }
    },
    event: {
        chtStock_selectionChange(elID, params, selections) {
            syn.$l.get('preResult').textContent = JSON.stringify(selections, null, 2);
        }
    }
};
