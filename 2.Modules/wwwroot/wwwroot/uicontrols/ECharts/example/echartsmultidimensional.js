'use strict';
let $echartsmultidimensional = {
    hook: {
        pageLoad() {
            const parallelRows = [{
                NAME: 'A',
                SPEED: 82,
                QUALITY: 76,
                COST: 42,
                RISK: 18
            },
            {
                NAME: 'B',
                SPEED: 65,
                QUALITY: 91,
                COST: 58,
                RISK: 25
            },
            {
                NAME: 'C',
                SPEED: 92,
                QUALITY: 72,
                COST: 66,
                RISK: 38
            },
            {
                NAME: 'D',
                SPEED: 74,
                QUALITY: 84,
                COST: 35,
                RISK: 12
            }];
            const river = [['2026-01-01',
                12,
                '검색'
            ],
            ['2026-01-02',
                18,
                '검색'
            ],
            ['2026-01-03',
                15,
                '검색'
            ],
            ['2026-01-01',
                8,
                '추천'
            ],
            ['2026-01-02',
                14,
                '추천'
            ],
            ['2026-01-03',
                21,
                '추천'
            ]
            ];
            const calendarData = Array.from({
                length: 31
            }, (item, index) => ['2026-01-' + String(index + 1).padStart(2, '0'),
            (index * 17) % 80
            ]);
            return Promise.all([syn.uicontrols.$echarts.renderChart('chtMulti', {
                rows: parallelRows,
                rowIndexMap: [parallelRows.map((row, index) => index)],
                option: {
                    tooltip: {
                    },
                    parallel: {
                        top: 45,
                        height: 190,
                        left: 70,
                        right: 40
                    },
                    parallelAxis: ['SPEED',
                        'QUALITY',
                        'COST',
                        'RISK'
                    ].map((name, index) => ({
                        dim: index,
                        name: name,
                        max: 100
                    })),
                    singleAxis: {
                        top: 310,
                        height: 100,
                        type: 'time',
                        axisPointer: {
                            animation: true
                        }
                    },
                    series: [{
                        name: 'Parallel',
                        type: 'parallel',
                        lineStyle: {
                            width: 3
                        },
                        data: parallelRows.map(row => [row.SPEED,
                        row.QUALITY,
                        row.COST,
                        row.RISK
                        ])
                    },
                    {
                        name: 'ThemeRiver',
                        type: 'themeRiver',
                        singleAxisIndex: 0,
                        data: river
                    }]
                }
            }),
            syn.uicontrols.$echarts.renderChart('chtMatrix', {
                option: {
                    tooltip: {
                    },
                    visualMap: [{
                        min: 0,
                        max: 80,
                        calculable: true,
                        orient: 'horizontal',
                        left: 'center',
                        top: 225,
                        seriesIndex: [0,
                            1
                        ]
                    }],
                    calendar: {
                        top: 45,
                        left: 55,
                        right: 25,
                        height: 130,
                        range: '2026-01',
                        cellSize: ['auto',
                            18
                        ],
                        yearLabel: {
                            show: false
                        }
                    },
                    matrix: {
                        x: {
                            data: [{
                                value: '제품',
                                children: ['A',
                                    'B',
                                    'C'
                                ]
                            }]
                        },
                        y: {
                            data: ['품질',
                                '속도'
                            ]
                        },
                        top: 300,
                        bottom: 35,
                        left: 90,
                        right: 35
                    },
                    series: [{
                        name: 'Calendar',
                        type: 'heatmap',
                        coordinateSystem: 'calendar',
                        data: calendarData
                    },
                    {
                        name: 'Matrix',
                        type: 'heatmap',
                        coordinateSystem: 'matrix',
                        label: {
                            show: true
                        },
                        data: [['A',
                            '품질',
                            70
                        ],
                        ['A',
                            '속도',
                            55
                        ],
                        ['B',
                            '품질',
                            42
                        ],
                        ['B',
                            '속도',
                            77
                        ],
                        ['C',
                            '품질',
                            62
                        ],
                        ['C',
                            '속도',
                            68
                        ]
                        ]
                    }]
                }
            })
            ]);
        }
    }
};
