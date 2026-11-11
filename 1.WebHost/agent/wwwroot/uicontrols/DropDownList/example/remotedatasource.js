'use strict';
let $remotedatasource = {
    config: {
        dataSource: {}
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$select.getValue('ddlBusinessRank'));
        },

        btnDataRefresh_click() {
            // local: false 이므로 syn.$w.getDataSource를 통해 서버에서 다시 조회합니다.
            syn.uicontrols.$select.dataRefresh('ddlBusinessRank', {
                dataSourceID: 'CH000',
                storeSourceID: 'MS002',
                parameters: '@GROUPCODE:MS002;',
                local: false,
                deleteCache: true
            }, function () {
                syn.$l.eventLog('btnDataRefresh_click', '원격 데이터를 다시 조회했습니다.');
            });
        }
    }
}
