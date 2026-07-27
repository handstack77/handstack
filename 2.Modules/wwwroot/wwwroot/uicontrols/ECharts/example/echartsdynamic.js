'use strict';
let $echartsdynamic = {
    prop: {
        streamIndex: 4,
        connected: false
    },
    hook: {
        pageLoad() {
            const initial = [{
                NAME: 'A',
                VALUE: 12
            },
            {
                NAME: 'B',
                VALUE: 28
            },
            {
                NAME: 'C',
                VALUE: 21
            }];
            syn.uicontrols.$echarts.setGroup('chtAsync', 'dynamic-group');
            syn.uicontrols.$echarts.setValue('chtAsync', initial);
            return syn.uicontrols.$echarts.renderChart('chtStream', {
                group: 'dynamic-group',
                rows: initial,
                option: {
                    animation: false,
                    tooltip: {
                    },
                    xAxis: {
                        min: 0,
                        max: 20
                    },
                    yAxis: {
                        min: 0,
                        max: 100
                    },
                    series: [{
                        type: 'scatter',
                        large: true,
                        data: [[1,
                            12
                        ],
                        [2,
                            28
                        ],
                        [3,
                            21
                        ]
                        ]
                    }]
                }
            });
        }
    },
    event: {
        btnAsync_click() {
            const slow = [{
                NAME: '느린 응답',
                VALUE: 10,
                DELAY: 350
            }];
            const fast = [{
                NAME: '최신 응답',
                VALUE: 88,
                DELAY: 40
            }];
            syn.uicontrols.$echarts.setValue('chtAsync', slow);
            syn.uicontrols.$echarts.setValue('chtAsync', fast).then(() => $this.method.print({
                rawValue: syn.uicontrols.$echarts.getRawValue('chtAsync'),
                latestWins: true
            }));
        },
        btnAppend_click() {
            const x = $this.prop.streamIndex++;
            syn.uicontrols.$echarts.appendData('chtStream', {
                seriesIndex: 0,
                data: [[x,
                    (x * 19) % 93
                ]
                ]
            });
            syn.uicontrols.$echarts.setOption('chtStream', {
                title: {
                    text: 'appendData #' + x
                }
            });
            $this.method.print({
                appended: [x,
                    (x * 19) % 93
                ]
            });
        },
        btnConnect_click() {
            $this.prop.connected = !$this.prop.connected;
            if ($this.prop.connected) {
                syn.uicontrols.$echarts.connect('dynamic-group');
            } else {
                syn.uicontrols.$echarts.disconnect('dynamic-group');
            }
            $this.method.print({
                connected: $this.prop.connected,
                group: 'dynamic-group'
            });
        }
    },
    method: {
        asyncAdapter(rows) {
            return new Promise(resolve => setTimeout(() => resolve({
                dataset: {
                    source: rows
                }
            }), rows[0] && rows[0].DELAY || 0));
        },
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
