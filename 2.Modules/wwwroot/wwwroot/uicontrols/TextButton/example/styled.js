'use strict';
let $styled = {
    event: {
        btnPrimary_click() {
            syn.$l.eventLog('btnPrimary_click', 'class="' + syn.$l.get('btnPrimary').className + '"');
        },

        btnDanger_click() {
            syn.$l.eventLog('btnDanger_click', 'class="' + syn.$l.get('btnDanger').className + '"');
        },

        btnPlain_click() {
            syn.$l.eventLog('btnPlain_click', 'class="' + syn.$l.get('btnPlain').className + '" (toSynControl이 false라 클래스가 추가되지 않았습니다)');
        },

        btnCheckClass_click() {
            syn.$l.eventLog('btnCheckClass_click', JSON.stringify({
                btnPrimary: syn.$l.get('btnPrimary').className,
                btnDanger: syn.$l.get('btnDanger').className,
                btnPlain: syn.$l.get('btnPlain').className
            }));
        }
    }
}
