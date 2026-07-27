'use strict';
let $echartsinteraction = {
    hook: {
        pageLoad() {
            const names = ['A',
                'B',
                'C',
                'D',
                'E',
                'F',
                'G',
                'H'
            ];
            const values = [18,
                42,
                31,
                67,
                55,
                73,
                29,
                61
            ];
            return syn.uicontrols.$echarts.renderChart('chtInteraction', {
                rows: names.map((name, index) => ({
                    NAME: name,
                    VALUE: values[index]
                })),
                option: {
                    baseOption: {
                        timeline: {
                            axisType: 'category',
                            autoPlay: false,
                            data: ['현재',
                                '예측'
                            ]
                        },
                        toolbox: {
                            feature: {
                                dataZoom: {
                                },
                                dataView: {
                                },
                                magicType: {
                                    type: ['line',
                                        'bar'
                                    ]
                                },
                                restore: {
                                },
                                saveAsImage: {
                                }
                            }
                        },
                        tooltip: {
                        },
                        brush: {
                            toolbox: ['rect',
                                'polygon',
                                'clear'
                            ],
                            xAxisIndex: 0
                        },
                        visualMap: {
                            min: 0,
                            max: 90,
                            right: 10,
                            top: 80,
                            calculable: true
                        },
                        dataZoom: [{
                            type: 'inside'
                        },
                        {
                            type: 'slider',
                            bottom: 45
                        }],
                        grid: {
                            top: 90,
                            left: 50,
                            right: 70,
                            bottom: 100
                        },
                        xAxis: {
                            type: 'category',
                            data: names
                        },
                        yAxis: {
                        },
                        series: [{
                            type: 'bar',
                            selectedMode: 'multiple',
                            data: values
                        }]
                    },
                    options: [{
                        title: {
                            text: '현재 값'
                        },
                        series: [{
                            data: values
                        }]
                    },
                    {
                        title: {
                            text: '예측 값'
                        },
                        series: [{
                            data: values.map(value => Math.round(value * 1.18))
                        }]
                    }]
                }
            });
        }
    },
    event: {
        btnHighlight_click() {
            syn.uicontrols.$echarts.dispatchAction('chtInteraction', {
                type: 'highlight',
                seriesIndex: 0,
                dataIndex: 3
            });
            $this.method.print({
                action: 'highlight',
                dataIndex: 3
            });
        },
        btnZoom_click() {
            syn.uicontrols.$echarts.dispatchAction('chtInteraction', {
                type: 'dataZoom',
                start: 20,
                end: 75
            });
        },
        chtInteraction_click(elID, params, selections) {
            $this.method.print({
                event: 'click(query series 0)',
                name: params.name,
                selections: selections
            });
        },
        chtInteraction_datazoom(elID, params) {
            $this.method.print({
                event: 'datazoom',
                params: params
            });
        },
        chtInteraction_brushselected(elID, params) {
            $this.method.print({
                event: 'brushselected',
                batch: params.batch
            });
        },
        chtInteraction_timelinechanged(elID, params) {
            $this.method.print({
                event: 'timelinechanged',
                index: params.currentIndex
            });
        },
        chtInteraction_zrContextmenu(elID, params) {
            $this.method.print({
                event: 'zrContextmenu',
                offsetX: params.offsetX,
                offsetY: params.offsetY
            });
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
