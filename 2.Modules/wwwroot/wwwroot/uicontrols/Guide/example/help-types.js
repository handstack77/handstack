'use strict';
let $helptypes = {
    event: {
        btnOpenHelpLink_click() {
            // items 중 첫 번째 helpType:'U' 항목(contentType:'link')을 새 창으로 엽니다.
            syn.$l.eventLog('btnOpenHelpLink_click', '온라인 문서 새 창 열기 시도');
            syn.uicontrols.$guide.openUIHelp('hlpHelpLink');
        },

        btnOpenHelpPopup_click() {
            // items 중 첫 번째 helpType:'U' 항목(contentType:'html')을 팝업 창에 표시합니다.
            syn.$l.eventLog('btnOpenHelpPopup_click', '도움말 팝업 열기 시도');
            syn.uicontrols.$guide.openUIHelp('hlpHelpPopup');
        }
    }
}
