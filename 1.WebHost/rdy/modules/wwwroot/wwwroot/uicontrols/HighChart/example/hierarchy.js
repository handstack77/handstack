'use strict';
let $hierarchy = {
    hook: {
        pageLoad() {
            return Promise.all([syn.uicontrols.$chart.renderChart('chtHeatmap', {
                option: {
                    chart: {
                        type: 'heatmap'
                    },
                    title: {
                        text: '요일·시간대 부하'
                    },
                    xAxis: {
                        categories: ['09시',
                            '12시',
                            '15시',
                            '18시'
                        ]
                    },
                    yAxis: {
                        categories: ['월',
                            '화',
                            '수',
                            '목'
                        ],
                        title: null
                    },
                    colorAxis: {
                        min: 0,
                        minColor: '#eef3ff',
                        maxColor: '#3154d8'
                    },
                    series: [{
                        name: '요청',
                        borderWidth: 1,
                        data: [[0,
                            0,
                            3
                        ],
                        [1,
                            0,
                            7
                        ],
                        [2,
                            0,
                            5
                        ],
                        [3,
                            0,
                            9
                        ],
                        [0,
                            1,
                            4
                        ],
                        [1,
                            1,
                            8
                        ],
                        [2,
                            1,
                            6
                        ],
                        [3,
                            1,
                            7
                        ],
                        [0,
                            2,
                            2
                        ],
                        [1,
                            2,
                            6
                        ],
                        [2,
                            2,
                            9
                        ],
                        [3,
                            2,
                            8
                        ],
                        [0,
                            3,
                            5
                        ],
                        [1,
                            3,
                            7
                        ],
                        [2,
                            3,
                            4
                        ],
                        [3,
                            3,
                            6
                        ]
                        ],
                        dataLabels: {
                            enabled: true
                        }
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtTrees', {
                option: {
                    title: {
                        text: '모듈 계층'
                    },
                    series: [{
                        type: 'treemap',
                        name: '비중',
                        layoutAlgorithm: 'squarified',
                        data: [{
                            id: 'host',
                            name: 'Host',
                            value: 6
                        },
                        {
                            id: 'modules',
                            name: 'Modules',
                            value: 10
                        },
                        {
                            name: 'Tools',
                            value: 4
                        }]
                    },
                    {
                        type: 'treegraph',
                        name: '의존',
                        visible: false,
                        data: [{
                            id: 'handstack',
                            name: 'HandStack'
                        },
                        {
                            id: 'ack',
                            parent: 'handstack'
                        },
                        {
                            id: 'wwwroot',
                            parent: 'ack'
                        },
                        {
                            id: 'transact',
                            parent: 'ack'
                        }]
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtNetwork', {
                option: {
                    chart: {
                        type: 'networkgraph'
                    },
                    title: {
                        text: '호스트·모듈 연결'
                    },
                    plotOptions: {
                        networkgraph: {
                            keys: ['from',
                                'to'
                            ],
                            layoutAlgorithm: {
                                enableSimulation: false
                            }
                        }
                    },
                    series: [{
                        data: [['ack',
                            'wwwroot'
                        ],
                        ['ack',
                            'transact'
                        ],
                        ['transact',
                            'dbclient'
                        ],
                        ['transact',
                            'function'
                        ],
                        ['transact',
                            'command'
                        ]
                        ]
                    }]
                }
            }),
            syn.uicontrols.$chart.renderChart('chtSankey', {
                option: {
                    title: {
                        text: '요청 라우팅 흐름'
                    },
                    series: [{
                        type: 'sankey',
                        keys: ['from',
                            'to',
                            'weight'
                        ],
                        data: [['Browser',
                            'wwwroot',
                            10
                        ],
                        ['wwwroot',
                            'transact',
                            10
                        ],
                        ['transact',
                            'dbclient',
                            5
                        ],
                        ['transact',
                            'function',
                            3
                        ],
                        ['transact',
                            'command',
                            2
                        ]
                        ]
                    }]
                }
            })
            ]);
        }
    }
};
