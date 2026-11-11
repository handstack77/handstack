'use strict';
let $datasource = {
    config: {
        dataSource: {}
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$multiselect.getValue('ddlFileExtension'));
        },

        btnDataRefresh_click() {
            syn.uicontrols.$multiselect.dataRefresh('ddlFileExtension', {
                storeSourceID: 'DCLEX01',
                local: true,
                sharedAssetUrl: './',
                deleteCache: true
            }, function () {
                syn.$l.eventLog('btnDataRefresh_click', '데이터를 다시 불러왔습니다.');
            });
        }
    }
}
