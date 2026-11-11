'use strict';
let $navermapadvanced = {
    prop: {
        traffic: false
    },
    event: {
        mapAdvanced_initialized() {
            syn.uicontrols.$navermap.setDataStyle('mapAdvanced', {
                fillColor: '#0ea5e9',
                fillOpacity: .2,
                strokeColor: '#0284c7',
                strokeWeight: 2
            });
        },
        mapAdvanced_error(elID, error) {
            $this.method.print(error);
        },
        btnGeoJson_click() {
            const feature = {
                type: 'Feature',
                properties: {
                    name: '서울 중심'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[126.94,
                        37.54
                    ],
                    [127.02,
                        37.54
                    ],
                    [127.02,
                        37.60
                    ],
                    [126.94,
                        37.60
                    ],
                    [126.94,
                        37.54
                    ]
                    ]
                    ]
                }
            };
            $this.method.print(syn.uicontrols.$navermap.addGeoJson('mapAdvanced', feature));
        },
        btnCircle_click() {
            const circle = syn.uicontrols.$navermap.addOverlay('mapAdvanced', 'range', 'Circle', {
                center: {
                    lat: 37.5665,
                    lng: 126.978
                },
                radius: 1800,
                strokeColor: '#dc2626',
                fillColor: '#ef4444',
                fillOpacity: .12
            });
            $this.method.print({
                circle: !!circle
            });
        },
        btnTraffic_click() {
            const api = syn.uicontrols.$navermap;
            if (!api.getLayer('mapAdvanced', 'traffic')) api.createLayer('mapAdvanced', 'traffic', 'TrafficLayer');
            $this.prop.traffic = !$this.prop.traffic;
            api.setLayerVisible('mapAdvanced', 'traffic', $this.prop.traffic);
            $this.method.print({
                traffic: $this.prop.traffic
            });
        },
        async btnGeocode_click() {
            try {
                const result = await syn.uicontrols.$navermap.geocode({
                    query: '서울특별시청'
                });
                $this.method.print(result);
            } catch (error) {
                $this.method.print({
                    code: error.code,
                    message: error.message
                });
            }
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
