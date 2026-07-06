'use strict';
let $basic = {
    event: {
        ctxBasic_select(evt, ui) {
            // ui.cmd 값으로 어떤 메뉴 항목이 선택됐는지 구분합니다.
            syn.$l.eventLog('ctxBasic_select', ui.cmd);
            document.getElementById('preResult').textContent = '선택한 메뉴: ' + ui.cmd;
        }
    }
}
