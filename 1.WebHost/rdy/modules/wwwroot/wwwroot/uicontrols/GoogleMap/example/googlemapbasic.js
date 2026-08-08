'use strict';
let $googlemapbasic = {
    hook: {
        pageLoad() {
            syn.uicontrols.$googlemap.setValue('mapBasic', {
                AS_NUM: 'SEOUL-CITY-HALL',
                LAT: 37.5665,
                LNG: 126.978,
                CT_NAME: '서울특별시청',
                CT_ADDRESS: '서울특별시 중구 세종대로 110'
            })
        }
    },
    event: {
        mapBasic_click(elID, event, selection) {
            $this.method.print({
                event: 'map click',
                selection
            })
        },
        mapBasic_poiClick(elID, detail, selection) {
            $this.method.print({
                event: 'poiClick',
                poi: detail.selection,
                selection
            })
        },
        mapBasic_selectionChange(elID, detail, selection) {
            $this.method.print({
                event: 'selectionChange',
                detail,
                selection
            })
        },
        mapBasic_error(elID, error) {
            $this.method.print(error)
        },
        btnCityHall_click() {
            syn.uicontrols.$googlemap.panTo('mapBasic', {
                lat: 37.5665,
                lng: 126.978
            })
        },
        btnZoom_click() {
            const api = syn.uicontrols.$googlemap;
            api.setZoom('mapBasic', api.getZoom('mapBasic') + 1)
        },
        btnValue_click() {
            $this.method.print(syn.uicontrols.$googlemap.getValue('mapBasic'))
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2)
        }
    }
};
