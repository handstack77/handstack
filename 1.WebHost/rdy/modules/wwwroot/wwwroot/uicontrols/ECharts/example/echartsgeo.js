'use strict';
let $echartsgeo = {
    prop: {
        rows: [{
            NAME: '북서',
            VALUE: 12,
            COORD: [1,
                3
            ]
        },
        {
            NAME: '북동',
            VALUE: 28,
            COORD: [3,
                3
            ]
        },
        {
            NAME: '남서',
            VALUE: 19,
            COORD: [1,
                1
            ]
        },
        {
            NAME: '남동',
            VALUE: 36,
            COORD: [3,
                1
            ]
        }],
        geoJSON: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {
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
        }
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            syn.uicontrols.$echarts.registerMap('handstack-demo', $this.prop.geoJSON);
            return syn.uicontrols.$echarts.renderChart('chtGeo', {
                rows: rows,
                rowIndexMap: [rows.map((row, index) => index),
                rows.map((row, index) => index),
                rows.map((row, index) => index),
                [0,
                    1,
                    2
                ]
                ],
                option: {
                    tooltip: {
                    },
                    visualMap: {
                        min: 0,
                        max: 40,
                        calculable: true,
                        left: 10,
                        bottom: 10
                    },
                    geo: {
                        map: 'handstack-demo',
                        roam: true,
                        left: '48%',
                        right: '3%',
                        top: 20,
                        bottom: 20,
                        itemStyle: {
                            areaColor: '#dce7ff'
                        }
                    },
                    series: [{
                        name: 'Map',
                        type: 'map',
                        map: 'handstack-demo',
                        left: '3%',
                        right: '55%',
                        top: 20,
                        bottom: 20,
                        data: rows.map(row => ({
                            name: row.NAME,
                            value: row.VALUE
                        }))
                    },
                    {
                        name: 'Heat',
                        type: 'heatmap',
                        coordinateSystem: 'geo',
                        pointSize: 18,
                        blurSize: 22,
                        data: rows.map(row => [row.COORD[0],
                        row.COORD[1],
                        row.VALUE
                        ])
                    },
                    {
                        name: 'Point',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        symbolSize: value => 8 + value[2] / 3,
                        data: rows.map(row => [row.COORD[0],
                        row.COORD[1],
                        row.VALUE,
                        row.NAME
                        ])
                    },
                    {
                        name: 'Route',
                        type: 'lines',
                        coordinateSystem: 'geo',
                        effect: {
                            show: true,
                            symbol: 'arrow'
                        },
                        data: [{
                            coords: [rows[0].COORD,
                            rows[1].COORD
                            ]
                        },
                        {
                            coords: [rows[1].COORD,
                            rows[3].COORD
                            ]
                        },
                        {
                            coords: [rows[2].COORD,
                            rows[3].COORD
                            ]
                        }]
                    }]
                }
            });
        }
    },
    event: {
        chtGeo_click(elID, params, selections) {
            $this.method.print({
                point: params.name || params.value,
                selections: selections
            });
        },
        chtGeo_georoam(elID, params) {
            $this.method.print({
                event: 'georoam',
                zoom: params.zoom || null
            });
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
