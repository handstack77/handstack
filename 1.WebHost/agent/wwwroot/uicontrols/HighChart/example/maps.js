'use strict';
let $maps = {
    prop: {
        rows: [{
            KEY: 'west',
            NAME: '서부',
            VALUE: 12
        },
        {
            KEY: 'east',
            NAME: '동부',
            VALUE: 27
        },
        {
            KEY: 'center',
            NAME: '센터',
            VALUE: 19
        }]
    },
    hook: {
        pageLoad() {
            const geojson = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {
                        'hc-key': 'west',
                        name: '서부'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[0,
                            0
                        ],
                        [4,
                            0
                        ],
                        [4,
                            5
                        ],
                        [0,
                            5
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
                        'hc-key': 'east',
                        name: '동부'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[4,
                            0
                        ],
                        [8,
                            0
                        ],
                        [8,
                            5
                        ],
                        [4,
                            5
                        ],
                        [4,
                            0
                        ]
                        ]
                        ]
                    }
                }]
            };
            const rows = $this.prop.rows;
            return syn.uicontrols.$chart.renderChart('chtMap', {
                constructorType: 'mapChart',
                rows,
                selectionResolver(point, event, sourceRows) {
                    const key = point['hc-key'] || (point.properties && point.properties['hc-key']) || point.options.key;
                    return sourceRows.findIndex(row => row.KEY === key || row.NAME === point.name);
                },
                option: {
                    chart: {
                        map: geojson
                    },
                    title: {
                        text: '인라인 업무 권역'
                    },
                    mapNavigation: {
                        enabled: true
                    },
                    colorAxis: {
                        min: 0,
                        minColor: '#eaf0ff',
                        maxColor: '#3154d8'
                    },
                    series: [{
                        type: 'map',
                        name: '처리량',
                        mapData: geojson,
                        joinBy: 'hc-key',
                        data: rows.slice(0, 2).map(row => ({
                            'hc-key': row.KEY,
                            value: row.VALUE
                        }))
                    },
                    {
                        type: 'mapline',
                        name: '경계',
                        mapData: geojson,
                        color: '#202636',
                        enableMouseTracking: false
                    },
                    {
                        type: 'mappoint',
                        name: '센터',
                        data: [{
                            name: '센터',
                            x: 4,
                            y: 2.5,
                            key: 'center'
                        }]
                    },
                    {
                        type: 'mapbubble',
                        name: '규모',
                        minSize: 8,
                        maxSize: 26,
                        data: [{
                            name: '센터',
                            x: 4,
                            y: 2.5,
                            z: 19,
                            key: 'center'
                        }]
                    }]
                }
            });
        }
    },
    event: {
        chtMap_selectionChange(elID, params, selections) {
            syn.$l.get('preResult').textContent = JSON.stringify(selections, null, 2);
        }
    }
};
