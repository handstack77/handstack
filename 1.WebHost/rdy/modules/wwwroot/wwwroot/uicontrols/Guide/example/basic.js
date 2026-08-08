'use strict';
let $basic = {
    event: {
        btnStartGuide_click() {
            // helpType: 'I' 투어는 페이지 로드시 자동 시작되지 않으므로 introStart를 직접 호출합니다.
            syn.uicontrols.$guide.introStart('hlpDataSource');
        },

        hlpDataSource_complete() {
            syn.$l.eventLog('hlpDataSource_complete', '투어를 끝까지 마쳤습니다.');
        },

        hlpDataSource_exit() {
            syn.$l.eventLog('hlpDataSource_exit', '투어를 닫았습니다(완료 또는 중간 종료).');
        }
    }
}
