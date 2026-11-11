'use strict';
let $googlemapmonitoring = {
    hook: {
        controlInit(elID) {
            if (elID !== 'mapMonitor')
                return;
            return {
                markerOptionsResolver(row) {
                    return { content: `<div class="marker-monitor">${row.CT_NAME}</div>` }
                },
                infoWindowContentResolver(row) {
                    return `<div style="padding:12px"><strong>${row.CT_NAME}</strong><br>${row.CT_ADDRESS}<br>상태: ${row.STATUS}</div>`
                }
            }
        },
        pageLoad() {
            syn.uicontrols.$googlemap.setValue('mapMonitor', [
                {
                    AS_NUM: 'A-100',
                    LAT: 37.5665,
                    LNG: 126.978,
                    CT_NAME: '서울 센터',
                    CT_ADDRESS: '서울특별시 중구',
                    STATUS: '정상'
                },
                {
                    AS_NUM: 'A-200',
                    LAT: 37.4563,
                    LNG: 126.7052,
                    CT_NAME: '인천 센터',
                    CT_ADDRESS: '인천광역시 남동구',
                    STATUS: '점검'
                },
                {
                    AS_NUM: 'A-300',
                    LAT: 37.2636,
                    LNG: 127.0286,
                    CT_NAME: '수원 센터',
                    CT_ADDRESS: '경기도 수원시',
                    STATUS: '정상'
                }
            ])
        }
    },
    event: {
        mapMonitor_poiClick(elID, detail, selection) {
            $this.method.print({
                event: 'click',
                poi: detail.selection,
                selection
            })
        },
        mapMonitor_poiMouseover(elID, detail) {
            $this.method.print({
                event: 'mouseover',
                poi: detail.selection
            })
        },
        mapMonitor_poiMouseout(elID, detail) {
            $this.method.print({
                event: 'mouseout',
                poi: detail.selection
            })
        },
        mapMonitor_dataBound(elID, detail) {
            $this.method.print(detail)
        },
        mapMonitor_error(elID, error) {
            $this.method.print(error)
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2)
        }
    }
};
