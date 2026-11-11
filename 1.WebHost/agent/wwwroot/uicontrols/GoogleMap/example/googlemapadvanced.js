'use strict';
let $googlemapadvanced = {
    prop: { traffic: false },
    event: {
        mapAdvanced_initialized() {
            syn.uicontrols.$googlemap.setDataStyle('mapAdvanced', {
                fillColor: '#4285f4',
                fillOpacity: .2,
                strokeColor: '#1967d2',
                strokeWeight: 2
            })
        },
        mapAdvanced_error(elID, error) {
            $this.method.print(error)
        },
        btnGeoJson_click() {
            const feature = {
                type: 'Feature',
                properties: { name: '서울 중심' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [126.94, 37.54],
                            [127.02, 37.54],
                            [127.02, 37.60],
                            [126.94, 37.60],
                            [126.94, 37.54]
                        ]
                    ]
                }
            };
            $this.method.print(syn.uicontrols.$googlemap.addGeoJson('mapAdvanced', feature))
        },
        btnCircle_click() {
            const circle = syn.uicontrols.$googlemap.addOverlay('mapAdvanced', 'range', 'Circle', {
                center: {
                    lat: 37.5665,
                    lng: 126.978
                },
                radius: 1800,
                strokeColor: '#dc2626',
                fillColor: '#ef4444',
                fillOpacity: .12
            });
            $this.method.print({ circle: !!circle })
        },
        btnTraffic_click() {
            const api = syn.uicontrols.$googlemap;
            if (!api.getLayer('mapAdvanced', 'traffic'))
                api.createLayer('mapAdvanced', 'traffic', 'TrafficLayer');
            $this.prop.traffic = !$this.prop.traffic;
            api.setLayerVisible('mapAdvanced', 'traffic', $this.prop.traffic);
            $this.method.print({ traffic: $this.prop.traffic })
        },
        async btnGeocode_click() {
            try {
                $this.method.print(await syn.uicontrols.$googlemap.geocode({ query: '서울특별시청' }))
            }
            catch (error) {
                $this.method.print({
                    code: error.code,
                    message: error.message
                })
            }
        },
        btnPano_click() {
            const pano = syn.uicontrols.$googlemap.createPanorama('mapAdvanced', 'pano', 'pano', {
                position: {
                    lat: 37.5665,
                    lng: 126.978
                },
                pov: {
                    heading: 0,
                    pitch: 0
                },
                visible: true
            });
            $this.method.print({ streetView: !!pano })
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2)
        }
    }
};
