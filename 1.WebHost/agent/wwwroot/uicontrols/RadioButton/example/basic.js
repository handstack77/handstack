'use strict';
let $basic = {
    event: {
        rdoDelivery1_change() {
            syn.$l.eventLog('rdoDelivery1_change', '일반 배송 선택됨');
        },

        rdoDelivery2_change() {
            syn.$l.eventLog('rdoDelivery2_change', '빠른 배송 선택됨');
        },

        rdoDelivery3_change() {
            syn.$l.eventLog('rdoDelivery3_change', '매장 픽업 선택됨');
        },

        rdoDelivery4_change() {
            syn.$l.eventLog('rdoDelivery4_change', '새벽 배송 선택됨');
        }
    }
}
