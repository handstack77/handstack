'use strict';
let $specialcharts = {
    hook: {
        pageLoad() {
            return Promise.all([syn.uicontrols.$chart.renderChart('chtFunnelPie', {
                option: {
                    title: {
                        text: '전환 Funnel과 기여도'
                    },
                    series: [{
                        type: 'funnel',
                        name: '전환',
                        center: ['25%',
                            '50%'
                        ],
                        width: '42%',
                        data: [['방문',
                            100
                        ],
                        ['조회',
                            70
                        ],
                        ['신청',
                            38
                        ],
                        ['완료',
                            22
                        ]
                        ]
                    },
                    {
                        type: 'variablepie',
                        name: '기여',
                        center: ['75%',
                            '50%'
                        ],
                        size: '52%',
                        minPointSize: 30,
                        zMin: 0,
                        data: [{
                            name: '웹',
                            y: 45,
                            z: 90
                        },
                        {
                            name: '모바일',
                            y: 35,
                            z: 70
                        },
                        {
                            name: 'API',
                            y: 20,
                            z: 40
                        }]
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtRangeTimeline', {
                option: {
                    title: {
                        text: '배포 일정과 이력'
                    },
                    xAxis: {
                        type: 'datetime'
                    },
                    yAxis: [{
                        categories: ['개발',
                            '검증',
                            '배포'
                        ],
                        reversed: true
                    },
                    {
                        visible: false,
                        min: -1,
                        max: 1
                    }],
                    series: [{
                        type: 'xrange',
                        name: '일정',
                        pointWidth: 18,
                        data: [{
                            x: Date.UTC(2026, 6, 1),
                            x2: Date.UTC(2026, 6, 8),
                            y: 0
                        },
                        {
                            x: Date.UTC(2026, 6, 8),
                            x2: Date.UTC(2026, 6, 15),
                            y: 1
                        },
                        {
                            x: Date.UTC(2026, 6, 15),
                            x2: Date.UTC(2026, 6, 18),
                            y: 2
                        }]
                    },
                    {
                        type: 'timeline',
                        name: '이력',
                        yAxis: 1,
                        data: [{
                            x: Date.UTC(2026, 6, 1),
                            name: '시작',
                            label: '개발 시작'
                        },
                        {
                            x: Date.UTC(2026, 6, 15),
                            name: '승인',
                            label: '배포 승인'
                        }]
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtWordcloud', {
                option: {
                    title: {
                        text: 'HandStack 키워드'
                    },
                    series: [{
                        type: 'wordcloud',
                        name: '빈도',
                        data: [['HandStack',
                            16
                        ],
                        ['Module',
                            12
                        ],
                        ['Contract',
                            10
                        ],
                        ['Transact',
                            9
                        ],
                        ['UI Control',
                            8
                        ],
                        ['Workflow',
                            6
                        ],
                        ['Deploy',
                            5
                        ]
                        ].map(item => ({
                            name: item[0],
                            weight: item[1]
                        }))
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtVenn', {
                option: {
                    title: {
                        text: '호스트 구성 집합'
                    },
                    series: [{
                        type: 'venn',
                        data: [{
                            sets: ['ACK'],
                            value: 4,
                            name: '동적 모듈'
                        },
                        {
                            sets: ['RDY'],
                            value: 4,
                            name: '정적 모듈'
                        },
                        {
                            sets: ['ACK',
                                'RDY'
                            ],
                            value: 2,
                            name: '공통 계약'
                        }]
                    }]
                }
            })
            ]);
        }
    }
};
