'use strict';
let $events = {
    event: {
        ctxEvents_create(evt, ui) {
            syn.$l.eventLog('ctxEvents_create', '메뉴가 초기화되었습니다.');
        },

        ctxEvents_beforeOpen(evt, ui) {
            syn.$l.eventLog('ctxEvents_beforeOpen', '메뉴가 열리기 직전입니다.');
            // 조건에 따라 항목을 동적으로 켜고 끌 수 있습니다.
            syn.uicontrols.$contextmenu.enableEntry('ctxEvents', 'delete', true);
        },

        ctxEvents_open(evt, ui) {
            syn.$l.eventLog('ctxEvents_open', '메뉴가 열렸습니다.');
        },

        ctxEvents_select(evt, ui) {
            syn.$l.eventLog('ctxEvents_select', '선택한 cmd: ' + ui.cmd);
        },

        ctxEvents_close(evt, ui) {
            syn.$l.eventLog('ctxEvents_close', '메뉴가 닫혔습니다.');
        },

        btnOpenMenu_click() {
            var target = document.querySelector('#divEventTarget span.event-target');
            syn.uicontrols.$contextmenu.open('ctxEvents', target);
        },

        btnIsOpen_click() {
            var opened = syn.uicontrols.$contextmenu.isOpen('ctxEvents');
            syn.$l.eventLog('btnIsOpen_click', 'isOpen: ' + opened);
        }
    }
}
