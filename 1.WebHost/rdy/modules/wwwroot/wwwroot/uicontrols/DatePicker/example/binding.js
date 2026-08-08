'use strict';
var $binding = createControlBindingExample({
    adapterName: 'datepicker',
    initialValue: '2026-07-23',
    get: function () {
        return syn.uicontrols.$datepicker.getValue('dtpBinding');
    },
    set: function (value) {
        syn.uicontrols.$datepicker.setValue('dtpBinding', value);
    },
    nextValue: function (current) {
        return current === '2026-12-25' ? '2026-07-23' : '2026-12-25';
    },
    events: {
        dtpBinding_onselect: null
    },
    business: {
        title: '납기일 저장',
        description: '선택한 날짜를 주문 수정 거래의 ISO 날짜 필드로 전달합니다.',
        rules: ['납기일은 YYYY-MM-DD 형식의 유효한 날짜여야 합니다.'],
        validate: function (value) {
            var date = new Date(value + 'T00:00:00');
            return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(date.getTime()) ? true : '유효한 납기일을 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {OrderID: 'ORD-20260723-01', DueDate: value}};
        }
    }
});
