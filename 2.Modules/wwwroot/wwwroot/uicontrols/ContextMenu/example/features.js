'use strict';
let $features = {
    prop: {
        target: null
    },

    method: {
        show(title, data) {
            // 메뉴 항목 데이터에는 DOM 요소가 들어 있어 순환 참조가 생기므로, 요소는 [Element] 로 치환해 보여 준다.
            let seen = new WeakSet();
            let text = typeof data == 'string' ? data : JSON.stringify(data, (key, value) => {
                if (value instanceof Element || (typeof jQuery != 'undefined' && value instanceof jQuery)) {
                    return '[Element]';
                }
                if (typeof value == 'object' && value != null) {
                    if (seen.has(value) == true) {
                        return '[Circular]';
                    }
                    seen.add(value);
                }
                return value;
            }, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        }
    },

    event: {
        ctxOrder_create(evt, ui) {
            syn.$l.eventLog('ctxOrder_create', '컨텍스트 메뉴가 초기화되었습니다.');
        },

        // 메뉴가 열리기 직전: 우클릭한 항목의 상태에 따라 메뉴 항목을 동적으로 켜고 끈다.
        ctxOrder_beforeOpen(evt, ui) {
            // open() 으로 프로그램에서 열면 ui.target 이 없을 수 있어 evt.target 으로 대체한다.
            let target = ui.target || evt.target || $this.prop.target;
            $this.prop.target = target;
            let status = $(target).closest('li.menu-item').attr('data-status');
            syn.uicontrols.$contextmenu.enableEntry('ctxOrder', 'cancel', status != 'DONE');
            syn.uicontrols.$contextmenu.enableEntry('ctxOrder', 'status_ready', status != 'READY');
            syn.uicontrols.$contextmenu.enableEntry('ctxOrder', 'status_shipped', status != 'SHIPPED');
            syn.uicontrols.$contextmenu.enableEntry('ctxOrder', 'status_done', status != 'DONE');
            syn.$l.eventLog('ctxOrder_beforeOpen', `${target && target.textContent ? target.textContent.trim() : '(대상 없음)'} (상태 ${status})`);
        },

        ctxOrder_open(evt, ui) {
            syn.$l.eventLog('ctxOrder_open', '메뉴가 열렸습니다.');
        },

        ctxOrder_select(evt, ui) {
            syn.$l.get('spnSelected').innerText = ui.cmd;
            syn.$l.eventLog('ctxOrder_select', `${ui.cmd} (대상: ${$this.prop.target ? $this.prop.target.textContent.trim() : ''})`);
        },

        ctxOrder_close(evt, ui) {
            syn.$l.eventLog('ctxOrder_close', '메뉴가 닫혔습니다.');
        },

        btnOpen_click() {
            let first = syn.$l.querySelector('#ulItems li.menu-item');
            setTimeout(() => {
                syn.uicontrols.$contextmenu.open('ctxOrder', first);
            }, 0);
        },

        btnClose_click() {
            syn.uicontrols.$contextmenu.close('ctxOrder');
        },

        btnIsOpen_click() {
            $this.method.show('btnIsOpen_click', 'isOpen: ' + syn.uicontrols.$contextmenu.isOpen('ctxOrder'));
        },

        btnDisableCancel_click() { syn.uicontrols.$contextmenu.enableEntry('ctxOrder', 'cancel', false); },
        btnEnableCancel_click() { syn.uicontrols.$contextmenu.enableEntry('ctxOrder', 'cancel', true); },
        btnHideView_click() { syn.uicontrols.$contextmenu.showEntry('ctxOrder', 'view', false); },
        btnShowView_click() { syn.uicontrols.$contextmenu.showEntry('ctxOrder', 'view', true); },

        btnTitle_click() {
            syn.uicontrols.$contextmenu.setTitle('ctxOrder', 'view', '상세 조회');
        },

        btnIcon_click() {
            syn.uicontrols.$contextmenu.setIcon('ctxOrder', 'cancel', 'ui-icon-alert');
        },

        btnUpdate_click() {
            syn.uicontrols.$contextmenu.updateEntry('ctxOrder', 'remove', { disabled: false });
        },

        btnGetEntry_click() {
            $this.method.show('btnGetEntry_click', syn.uicontrols.$contextmenu.getEntry('ctxOrder', 'view'));
        },

        btnGetMenu_click() {
            $this.method.show('btnGetMenu_click', syn.uicontrols.$contextmenu.getMenu('ctxOrder'));
        }
    }
}
