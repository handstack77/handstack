'use strict';
let $echartscustom = {
    prop: {
        rows: [{
            NAME: '설계',
            START: Date.UTC(2026, 0, 2),
            END: Date.UTC(2026, 0, 8),
            VALUE: 70
        },
        {
            NAME: '개발',
            START: Date.UTC(2026, 0, 7),
            END: Date.UTC(2026, 0, 18),
            VALUE: 85
        },
        {
            NAME: '검증',
            START: Date.UTC(2026, 0, 16),
            END: Date.UTC(2026, 0, 23),
            VALUE: 55
        }],
        alternate: false
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            return syn.uicontrols.$echarts.renderChart('chtCustom', {
                rows: rows,
                rowIndexMap: [rows.map((row, index) => index)],
                option: {
                    tooltip: {
                    },
                    grid: {
                        top: 100,
                        left: 80,
                        right: 40,
                        bottom: 60
                    },
                    xAxis: {
                        type: 'time'
                    },
                    yAxis: {
                        type: 'category',
                        data: rows.map(row => row.NAME)
                    },
                    graphic: [{
                        type: 'text',
                        left: 'center',
                        top: 24,
                        style: {
                            text: '함수형 option이 보존됩니다',
                            fontSize: 20,
                            fontWeight: 'bold',
                            fill: '#3154d8'
                        },
                        keyframeAnimation: {
                            duration: 1600,
                            loop: true,
                            keyframes: [{
                                percent: .5,
                                scaleX: 1.08,
                                scaleY: 1.08
                            },
                            {
                                percent: 1,
                                scaleX: 1,
                                scaleY: 1
                            }]
                        }
                    }],
                    series: [{
                        id: 'transition',
                        name: '일정',
                        type: 'custom',
                        universalTransition: true,
                        encode: {
                            x: [1,
                                2
                            ],
                            y: 0
                        },
                        data: rows.map((row, index) => [index,
                            row.START,
                            row.END,
                            row.VALUE
                        ]),
                        renderItem(params, api) {
                            const start = api.coord([api.value(1),
                            api.value(0)
                            ]);
                            const end = api.coord([api.value(2),
                            api.value(0)
                            ]);
                            const height = api.size([0,
                                1
                            ])[1] * .55;
                            const shape = echarts.graphic.clipRectByRect({
                                x: start[0],
                                y: start[1] - height / 2,
                                width: end[0] - start[0],
                                height: height
                            }, {
                                x: params.coordSys.x,
                                y: params.coordSys.y,
                                width: params.coordSys.width,
                                height: params.coordSys.height
                            });
                            return shape && {
                                type: 'rect',
                                name: 'scheduleBar',
                                transition: ['shape'],
                                shape: shape,
                                style: api.style({
                                    fill: api.visual('color')
                                })
                            };
                        }
                    }]
                }
            });
        }
    },
    event: {
        chtCustom_click(elID, params, selections) {
            $this.method.print({
                element: params.element,
                selections: selections
            });
        },
        btnTransition_click() {
            $this.prop.alternate = !$this.prop.alternate;
            const rows = $this.prop.rows;
            syn.uicontrols.$echarts.setOption('chtCustom', {
                xAxis: {
                    type: 'category',
                    data: rows.map(row => row.NAME)
                },
                yAxis: {
                    type: 'value'
                },
                series: [{
                    id: 'transition',
                    type: 'bar',
                    universalTransition: true,
                    data: rows.map(row => row.VALUE),
                    renderItem: null
                }]
            }, {
                notMerge: $this.prop.alternate,
                lazyUpdate: false
            });
            $this.method.print({
                universalTransition: true,
                mode: 'bar'
            });
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
