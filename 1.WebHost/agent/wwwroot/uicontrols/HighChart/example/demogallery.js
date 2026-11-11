'use strict';
let $demogallery = {
    prop: {
        current: 'combination',
        recipes: null
    },
    hook: {
        pageLoad() {
            $this.prop.recipes = $this.method.createRecipes();
            return $this.method.renderDemo('combination');
        }
    },
    event: {
        selDemo_change() {
            return $this.method.renderDemo(syn.$l.get('selDemo').value);
        },
        btnSelected_click() {
            $this.method.print({
                selection: syn.uicontrols.$chart.getSelection('chtGallery'),
                row: syn.uicontrols.$chart.getValue('chtGallery', 'Row'),
                list: syn.uicontrols.$chart.getValue('chtGallery', 'List')
            });
        },
        btnCSV_click() {
            syn.uicontrols.$chart.getCSV('chtGallery').then(function (csv) {
                $this.method.print({
                    csv: csv.split('\n').slice(0, 8).join('\n')
                });
            }).catch($this.method.printError);
        },
        btnNative_click() {
            var recipe = $this.prop.recipes[$this.prop.current];
            syn.uicontrols.$chart.invoke('chtGallery', 'chart', 'setTitle', [{
                text: recipe.title
            },
            {
                text: 'invoke()로 호출한 Highcharts.Chart#setTitle'
            }]);
            $this.method.print({
                method: 'Chart#setTitle',
                target: 'chart',
                result: '호출 완료'
            });
        },
        chtGallery_selectionChange(elID, params, selections) {
            $this.method.print({
                event: 'selectionChange',
                selections: selections
            });
        },
        chtGallery_drilldown(elID, params) {
            $this.method.print({
                event: 'drilldown',
                point: params && params.point ? params.point.name : null
            });
        },
        chtGallery_axisAfterSetExtremes(elID, params) {
            $this.method.print({
                event: 'axisAfterSetExtremes',
                min: params.min,
                max: params.max
            });
        },
        chtGallery_recreated(elID, params) {
            $this.method.print({
                event: 'recreated',
                constructorType: params.constructorType
            });
        },
        chtGallery_error(elID, error) {
            $this.method.printError(error);
        }
    },
    method: {
        renderDemo(name) {
            var recipe = $this.prop.recipes[name] || $this.prop.recipes.combination;
            $this.prop.current = name;
            syn.$l.get('lblProduct').textContent = recipe.product;
            syn.$l.get('lblTitle').textContent = recipe.title;
            syn.$l.get('lblDescription').textContent = recipe.description;
            syn.$l.get('preResult').textContent = '로컬 Highcharts 모듈을 준비하는 중입니다.';
            return syn.uicontrols.$chart.renderChart('chtGallery', recipe.descriptor()).then(function (chart) {
                var modules = syn.uicontrols.$chart.getLoadedModules();
                syn.$l.get('lblModules').textContent = modules.length ? modules.join(' · ') : 'core';
                $this.method.print({
                    demo: name,
                    constructorType: syn.uicontrols.$chart.getControl('chtGallery').config.constructorType,
                    series: chart.series.filter(function (series) {
                        return !series.options.isInternal;
                    }).map(function (series) {
                        return {
                            name: series.name,
                            type: series.type,
                            points: series.points.length
                        };
                    }),
                    modules: modules
                });
                return chart;
            }).catch($this.method.printError);
        },
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        },
        printError(error) {
            var value = {
                error: error && error.message ? error.message : String(error)
            };
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
            return null;
        },
        findRowByPoint(point, event, rows) {
            var custom = point.options && point.options.custom;
            if (custom && typeof custom.handstackRowIndex === 'number') {
                return custom.handstackRowIndex;
            }
            for (var i = 0; i < rows.length; i++) {
                if (rows[i].DATE === point.x) {
                    return i;
                }
            }
            return point.isNode ? null : point.index;
        },
        createRecipes() {
            var salesRows = [{
                YEAR: '2023',
                SALES: 120,
                PROFIT: 22
            },
            {
                YEAR: '2024',
                SALES: 155,
                PROFIT: 35
            },
            {
                YEAR: '2025',
                SALES: 182,
                PROFIT: 48
            },
            {
                YEAR: '2026',
                SALES: 210,
                PROFIT: 61
            }];
            var heatRows = [{
                DAY: '월',
                HOUR: '09',
                VALUE: 21
            },
            {
                DAY: '월',
                HOUR: '13',
                VALUE: 28
            },
            {
                DAY: '월',
                HOUR: '17',
                VALUE: 25
            },
            {
                DAY: '화',
                HOUR: '09',
                VALUE: 19
            },
            {
                DAY: '화',
                HOUR: '13',
                VALUE: 31
            },
            {
                DAY: '화',
                HOUR: '17',
                VALUE: 27
            },
            {
                DAY: '수',
                HOUR: '09',
                VALUE: 23
            },
            {
                DAY: '수',
                HOUR: '13',
                VALUE: 34
            },
            {
                DAY: '수',
                HOUR: '17',
                VALUE: 29
            }];
            var flowRows = [{
                FROM: '영업',
                TO: '기획',
                WEIGHT: 8
            },
            {
                FROM: '기획',
                TO: '개발',
                WEIGHT: 6
            },
            {
                FROM: '개발',
                TO: '운영',
                WEIGHT: 5
            },
            {
                FROM: '영업',
                TO: '운영',
                WEIGHT: 2
            }];
            var stockRows = [[2026,
                0,
                2,
                100,
                108,
                96,
                104,
                1200
            ],
            [2026,
                0,
                3,
                104,
                112,
                101,
                110,
                1350
            ],
            [2026,
                0,
                4,
                110,
                115,
                106,
                108,
                980
            ],
            [2026,
                0,
                5,
                108,
                118,
                107,
                116,
                1420
            ],
            [2026,
                0,
                6,
                116,
                121,
                112,
                119,
                1280
            ],
            [2026,
                0,
                7,
                119,
                124,
                115,
                117,
                1100
            ],
            [2026,
                0,
                8,
                117,
                126,
                116,
                124,
                1540
            ],
            [2026,
                0,
                9,
                124,
                129,
                120,
                127,
                1600
            ],
            [2026,
                0,
                10,
                127,
                132,
                123,
                125,
                1380
            ],
            [2026,
                0,
                11,
                125,
                134,
                124,
                131,
                1720
            ]
            ].map(function (value) {
                return {
                    DATE: Date.UTC(value[0], value[1], value[2]),
                    OPEN: value[3],
                    HIGH: value[4],
                    LOW: value[5],
                    CLOSE: value[6],
                    VOLUME: value[7]
                };
            });
            var mapRows = [{
                CODE: 'NW',
                NAME: '북서',
                VALUE: 12
            },
            {
                CODE: 'NE',
                NAME: '북동',
                VALUE: 28
            },
            {
                CODE: 'SW',
                NAME: '남서',
                VALUE: 19
            },
            {
                CODE: 'SE',
                NAME: '남동',
                VALUE: 36
            }];
            var topology = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {
                        code: 'NW',
                        name: '북서'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[0,
                            2
                        ],
                        [2,
                            2
                        ],
                        [2,
                            4
                        ],
                        [0,
                            4
                        ],
                        [0,
                            2
                        ]
                        ]
                        ]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        code: 'NE',
                        name: '북동'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[2,
                            2
                        ],
                        [4,
                            2
                        ],
                        [4,
                            4
                        ],
                        [2,
                            4
                        ],
                        [2,
                            2
                        ]
                        ]
                        ]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        code: 'SW',
                        name: '남서'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[0,
                            0
                        ],
                        [2,
                            0
                        ],
                        [2,
                            2
                        ],
                        [0,
                            2
                        ],
                        [0,
                            0
                        ]
                        ]
                        ]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        code: 'SE',
                        name: '남동'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[2,
                            0
                        ],
                        [4,
                            0
                        ],
                        [4,
                            2
                        ],
                        [2,
                            2
                        ],
                        [2,
                            0
                        ]
                        ]
                        ]
                    }
                }]
            };
            var ganttRows = [{
                ID: 'design',
                NAME: '설계',
                START: Date.UTC(2026, 0, 2),
                END: Date.UTC(2026, 0, 6),
                DEPENDENCY: null
            },
            {
                ID: 'build',
                NAME: '구현',
                START: Date.UTC(2026, 0, 7),
                END: Date.UTC(2026, 0, 15),
                DEPENDENCY: 'design'
            },
            {
                ID: 'test',
                NAME: '검증',
                START: Date.UTC(2026, 0, 16),
                END: Date.UTC(2026, 0, 20),
                DEPENDENCY: 'build'
            },
            {
                ID: 'release',
                NAME: '배포',
                START: Date.UTC(2026, 0, 21),
                END: Date.UTC(2026, 0, 23),
                DEPENDENCY: 'test'
            }];
            return {
                combination: {
                    product: 'Core',
                    title: '혼합 차트와 drilldown',
                    description: 'column과 spline을 결합하고 점을 클릭하면 drilldown series를 표시합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'chart',
                            modules: [],
                            rows: salesRows,
                            option: {
                                chart: {
                                    type: 'column'
                                },
                                title: {
                                    text: '연도별 매출과 이익'
                                },
                                xAxis: {
                                    type: 'category'
                                },
                                tooltip: {
                                    shared: true
                                },
                                series: [{
                                    name: '매출',
                                    colorByPoint: true,
                                    data: salesRows.map(function (row, index) {
                                        return {
                                            name: row.YEAR,
                                            y: row.SALES,
                                            drilldown: 'year-' + row.YEAR,
                                            custom: {
                                                handstackRowIndex: index
                                            }
                                        };
                                    })
                                },
                                {
                                    type: 'spline',
                                    name: '이익',
                                    data: salesRows.map(function (row, index) {
                                        return {
                                            name: row.YEAR,
                                            y: row.PROFIT,
                                            custom: {
                                                handstackRowIndex: index
                                            }
                                        };
                                    })
                                }],
                                drilldown: {
                                    series: salesRows.map(function (row, index) {
                                        return {
                                            id: 'year-' + row.YEAR,
                                            name: row.YEAR + ' 분기 매출',
                                            data: [['1Q',
                                                row.SALES * 0.2
                                            ],
                                            ['2Q',
                                                row.SALES * 0.24
                                            ],
                                            ['3Q',
                                                row.SALES * 0.26
                                            ],
                                            ['4Q',
                                                row.SALES * 0.3
                                            ]
                                            ].map(function (item) {
                                                return {
                                                    name: item[0],
                                                    y: item[1],
                                                    custom: {
                                                        handstackRowIndex: index
                                                    }
                                                };
                                            })
                                        };
                                    })
                                }
                            }
                        };
                    }
                },
                polar: {
                    product: 'Highcharts More',
                    title: 'Polar 역량 프로필',
                    description: 'chart.polar 옵션을 감지해 highcharts-more 모듈을 자동 로드합니다.',
                    descriptor: function () {
                        var rows = [{
                            SKILL: '설계',
                            SCORE: 82
                        },
                        {
                            SKILL: '개발',
                            SCORE: 94
                        },
                        {
                            SKILL: '검증',
                            SCORE: 76
                        },
                        {
                            SKILL: '운영',
                            SCORE: 88
                        },
                        {
                            SKILL: '문서',
                            SCORE: 72
                        }];
                        return {
                            constructorType: 'chart',
                            modules: [],
                            rows: rows,
                            option: {
                                chart: {
                                    polar: true,
                                    type: 'line'
                                },
                                title: {
                                    text: '팀 역량 프로필'
                                },
                                xAxis: {
                                    categories: rows.map(function (row) {
                                        return row.SKILL;
                                    }),
                                    tickmarkPlacement: 'on',
                                    lineWidth: 0
                                },
                                yAxis: {
                                    gridLineInterpolation: 'polygon',
                                    min: 0,
                                    max: 100
                                },
                                series: [{
                                    name: '점수',
                                    data: rows.map(function (row, index) {
                                        return {
                                            y: row.SCORE,
                                            custom: {
                                                handstackRowIndex: index
                                            }
                                        };
                                    }),
                                    pointPlacement: 'on'
                                }]
                            }
                        };
                    }
                },
                threeD: {
                    product: '3D',
                    title: '3D Column',
                    description: 'options3d를 감지해 highcharts-3d 모듈을 로드하며 원근과 회전 옵션을 그대로 전달합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'chart',
                            modules: [],
                            rows: salesRows,
                            option: {
                                chart: {
                                    type: 'column',
                                    options3d: {
                                        enabled: true,
                                        alpha: 12,
                                        beta: 18,
                                        depth: 60,
                                        viewDistance: 25
                                    }
                                },
                                title: {
                                    text: '3D 연도별 매출'
                                },
                                xAxis: {
                                    categories: salesRows.map(function (row) {
                                        return row.YEAR;
                                    })
                                },
                                plotOptions: {
                                    column: {
                                        depth: 32
                                    }
                                },
                                series: [{
                                    name: '매출',
                                    data: salesRows.map(function (row, index) {
                                        return {
                                            y: row.SALES,
                                            custom: {
                                                handstackRowIndex: index
                                            }
                                        };
                                    })
                                }]
                            }
                        };
                    }
                },
                gauge: {
                    product: 'Gauge',
                    title: 'Solid gauge',
                    description: 'solidgauge type에서 solid-gauge와 highcharts-more 의존성을 순서대로 로드합니다.',
                    descriptor: function () {
                        var rows = [{
                            METRIC: '가동률',
                            VALUE: 86
                        }];
                        return {
                            constructorType: 'chart',
                            modules: [],
                            rows: rows,
                            option: {
                                chart: {
                                    type: 'solidgauge'
                                },
                                title: {
                                    text: '서비스 가동률'
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
                                    stops: [[0.1,
                                        '#df5353'
                                    ],
                                    [0.5,
                                        '#dddf0d'
                                    ],
                                    [0.9,
                                        '#55bf3b'
                                    ]
                                    ],
                                    lineWidth: 0,
                                    tickWidth: 0,
                                    minorTickInterval: null,
                                    labels: {
                                        y: 16
                                    }
                                },
                                plotOptions: {
                                    solidgauge: {
                                        dataLabels: {
                                            y: -24,
                                            borderWidth: 0,
                                            format: '<div style="text-align:center"><span style="font-size:28px">{y}%</span></div>'
                                        }
                                    }
                                },
                                series: [{
                                    name: '가동률',
                                    data: [{
                                        y: rows[0].VALUE,
                                        custom: {
                                            handstackRowIndex: 0
                                        }
                                    }]
                                }]
                            }
                        };
                    }
                },
                heatmap: {
                    product: 'Heatmap',
                    title: '시간대별 온도 Heatmap',
                    description: 'heatmap series와 colorAxis를 자동 감지하고 각 셀을 원본 행에 연결합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'chart',
                            modules: [],
                            rows: heatRows,
                            rowIndexMap: [heatRows.map(function (row, index) {
                                return index;
                            })
                            ],
                            option: {
                                chart: {
                                    type: 'heatmap'
                                },
                                title: {
                                    text: '요일·시간대별 온도'
                                },
                                xAxis: {
                                    categories: ['09',
                                        '13',
                                        '17'
                                    ],
                                    title: {
                                        text: '시각'
                                    }
                                },
                                yAxis: {
                                    categories: ['월',
                                        '화',
                                        '수'
                                    ],
                                    title: {
                                        text: '요일'
                                    },
                                    reversed: true
                                },
                                colorAxis: {
                                    min: 18,
                                    minColor: '#e8f1ff',
                                    maxColor: '#e53935'
                                },
                                tooltip: {
                                    pointFormat: '<b>{point.value}°C</b>'
                                },
                                series: [{
                                    name: '온도',
                                    borderWidth: 1,
                                    data: heatRows.map(function (row) {
                                        return [['09',
                                            '13',
                                            '17'
                                        ].indexOf(row.HOUR),
                                        ['월',
                                            '화',
                                            '수'
                                        ].indexOf(row.DAY),
                                        row.VALUE
                                        ];
                                    })
                                }]
                            }
                        };
                    }
                },
                sankey: {
                    product: 'Network',
                    title: 'Sankey 업무 흐름',
                    description: 'edge는 원본 행으로 선택하고 자동 생성된 node는 선택 Row에서 제외합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'chart',
                            modules: [],
                            rows: flowRows,
                            rowIndexMap: [flowRows.map(function (row, index) {
                                return index;
                            })
                            ],
                            selectionResolver: function (point) {
                                return point.isNode ? null : point.index;
                            },
                            option: {
                                title: {
                                    text: '부서 간 업무 흐름'
                                },
                                series: [{
                                    type: 'sankey',
                                    name: '업무량',
                                    keys: ['from',
                                        'to',
                                        'weight'
                                    ],
                                    data: flowRows.map(function (row) {
                                        return [row.FROM,
                                        row.TO,
                                        row.WEIGHT
                                        ];
                                    })
                                }]
                            }
                        };
                    }
                },
                stock: {
                    product: 'Stock',
                    title: 'OHLC와 SMA 기술 지표',
                    description: 'stockChart 생성자와 indicators-all을 자동 로드하며 navigator, rangeSelector, 다중 축을 지원합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'stockChart',
                            modules: [],
                            rows: stockRows,
                            selectionResolver: $this.method.findRowByPoint,
                            option: {
                                rangeSelector: {
                                    selected: 1
                                },
                                stockTools: {
                                    gui: {
                                        enabled: true
                                    }
                                },
                                title: {
                                    text: 'HandStack Stock'
                                },
                                yAxis: [{
                                    height: '68%',
                                    resize: {
                                        enabled: true
                                    }
                                },
                                {
                                    top: '72%',
                                    height: '28%',
                                    offset: 0
                                }],
                                series: [{
                                    type: 'ohlc',
                                    id: 'price',
                                    name: '가격',
                                    data: stockRows.map(function (row) {
                                        return [row.DATE,
                                        row.OPEN,
                                        row.HIGH,
                                        row.LOW,
                                        row.CLOSE
                                        ];
                                    })
                                },
                                {
                                    type: 'column',
                                    id: 'volume',
                                    name: '거래량',
                                    yAxis: 1,
                                    data: stockRows.map(function (row) {
                                        return [row.DATE,
                                        row.VOLUME
                                        ];
                                    })
                                },
                                {
                                    type: 'sma',
                                    linkedTo: 'price',
                                    name: 'SMA(3)',
                                    params: {
                                        period: 3
                                    },
                                    marker: {
                                        enabled: false
                                    }
                                }]
                            }
                        };
                    }
                },
                map: {
                    product: 'Maps',
                    title: 'Inline GeoJSON 지역 현황',
                    description: 'mapChart 생성자, mapNavigation, colorAxis와 사용자 GeoJSON을 외부 요청 없이 사용합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'mapChart',
                            modules: [],
                            rows: mapRows,
                            selectionResolver: $this.method.findRowByPoint,
                            option: {
                                chart: {
                                    map: topology
                                },
                                title: {
                                    text: '지역별 처리량'
                                },
                                mapNavigation: {
                                    enabled: true
                                },
                                colorAxis: {
                                    min: 0,
                                    minColor: '#e8efff',
                                    maxColor: '#3154d8'
                                },
                                series: [{
                                    type: 'map',
                                    name: '처리량',
                                    mapData: topology,
                                    joinBy: ['code',
                                        'code'
                                    ],
                                    data: mapRows.map(function (row, index) {
                                        return {
                                            code: row.CODE,
                                            value: row.VALUE,
                                            custom: {
                                                handstackRowIndex: index
                                            }
                                        };
                                    }),
                                    dataLabels: {
                                        enabled: true,
                                        format: '{point.name}'
                                    }
                                }]
                            }
                        };
                    }
                },
                gantt: {
                    product: 'Gantt',
                    title: '작업 의존성 Gantt',
                    description: 'ganttChart 생성자와 dependency 연결을 사용하며 각 작업을 원본 일정 행으로 반환합니다.',
                    descriptor: function () {
                        return {
                            constructorType: 'ganttChart',
                            modules: [],
                            rows: ganttRows,
                            option: {
                                title: {
                                    text: '릴리스 계획'
                                },
                                navigator: {
                                    enabled: true
                                },
                                scrollbar: {
                                    enabled: true
                                },
                                rangeSelector: {
                                    enabled: true
                                },
                                series: [{
                                    name: '프로젝트',
                                    data: ganttRows.map(function (row, index) {
                                        return {
                                            id: row.ID,
                                            name: row.NAME,
                                            start: row.START,
                                            end: row.END,
                                            dependency: row.DEPENDENCY,
                                            custom: {
                                                handstackRowIndex: index
                                            }
                                        };
                                    })
                                }]
                            }
                        };
                    }
                }
            };
        }
    }
};
