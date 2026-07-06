'use strict';
let $nestedMenu = {
    event: {
        ctxNested_beforeOpen(evt, ui) {
            // 우클릭한 li 요소마다 다르게 메뉴를 제어하고 싶다면 evt.currentTarget / ui.target을 확인합니다.
            syn.$l.eventLog('ctxNested_beforeOpen', ui.target ? ui.target.textContent.trim() : '');
        },

        ctxNested_select(evt, ui) {
            syn.$l.eventLog('ctxNested_select', ui.cmd);
            document.getElementById('preResult').textContent = '선택한 메뉴: ' + ui.cmd;
        }
    }
}
