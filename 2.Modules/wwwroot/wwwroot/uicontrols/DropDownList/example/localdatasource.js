'use strict';
let $localdatasource = {
    config: {
        dataSource: {}
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$select.getValue('ddlCity'));
        },

        btnDataRefresh_click() {
            syn.uicontrols.$select.dataRefresh('ddlCity', {
                storeSourceID: 'DDLEX01',
                local: true,
                sharedAssetUrl: './',
                deleteCache: true
            }, function () {
                syn.$l.eventLog('btnDataRefresh_click', '데이터를 다시 불러왔습니다.');
            });
        }
    }
}
