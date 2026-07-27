'use strict';
let $advancedfeatures = {
    hook: {
        pageLoad() {
            return Promise.all([syn.uicontrols.$chart.renderChart('chtPolar3D', {
                option: {
                    chart: {
                        polar: true,
                        type: 'column'
                    },
                    title: {
                        text: 'Polar 역량 프로필'
                    },
                    pane: {
                        size: '80%'
                    },
                    xAxis: {
                        categories: ['속도',
                            '품질',
                            '안정성',
                            '접근성',
                            '확장성'
                        ],
                        tickmarkPlacement: 'on'
                    },
                    yAxis: {
                        min: 0,
                        max: 100,
                        endOnTick: false
                    },
                    series: [{
                        name: '현재',
                        data: [82,
                            91,
                            87,
                            94,
                            89
                        ],
                        pointPlacement: 'on'
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtGauge', {
                option: {
                    chart: {
                        type: 'solidgauge'
                    },
                    title: {
                        text: '서비스 상태'
                    },
                    pane: {
                        center: ['50%',
                            '70%'
                        ],
                        size: '120%',
                        startAngle: -90,
                        endAngle: 90,
                        background: {
                            innerRadius: '60%',
                            outerRadius: '100%',
                            shape: 'arc'
                        }
                    },
                    yAxis: {
                        min: 0,
                        max: 100,
                        stops: [[0.3,
                            '#df5353'
                        ],
                        [0.7,
                            '#dddf0d'
                        ],
                        [0.9,
                            '#55bf3b'
                        ]
                        ],
                        lineWidth: 0,
                        tickWidth: 0
                    },
                    tooltip: {
                        enabled: false
                    },
                    series: [{
                        name: '가동률',
                        data: [93],
                        dataLabels: {
                            format: '{y}%'
                        }
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtDrilldown', {
                option: {
                    title: {
                        text: '제품군 매출 Drilldown'
                    },
                    annotations: [{
                        labels: [{
                            point: {
                                x: 1,
                                y: 7,
                                xAxis: 0,
                                yAxis: 0
                            },
                            text: '상세 보기'
                        }]
                    }],
                    xAxis: {
                        type: 'category'
                    },
                    series: [{
                        type: 'column',
                        name: '제품군',
                        colorByPoint: true,
                        data: [{
                            name: '플랫폼',
                            y: 8,
                            drilldown: 'platform'
                        },
                        {
                            name: '모듈',
                            y: 7,
                            drilldown: 'module'
                        }]
                    }],
                    drilldown: {
                        series: [{
                            id: 'platform',
                            data: [['ACK',
                                5
                            ],
                            ['RDY',
                                3
                            ]
                            ]
                        },
                        {
                            id: 'module',
                            data: [['wwwroot',
                                4
                            ],
                            ['transact',
                                3
                            ]
                            ]
                        }]
                    }
                }
            }),
            syn.uicontrols.$chart.renderChart('chtStyled', {
                option: {
                    chart: {
                        styledMode: true,
                        options3d: {
                            enabled: true,
                            alpha: 12,
                            beta: 18,
                            depth: 45,
                            viewDistance: 25
                        }
                    },
                    accessibility: {
                        enabled: true,
                        description: '3D column styled mode example'
                    },
                    title: {
                        text: '3D·Styled mode'
                    },
                    xAxis: {
                        categories: ['A',
                            'B',
                            'C',
                            'D'
                        ]
                    },
                    series: [{
                        type: 'column',
                        name: '처리량',
                        depth: 30,
                        data: [4,
                            7,
                            6,
                            9
                        ]
                    }]
                }
            })
            ]);
        }
    }
};
