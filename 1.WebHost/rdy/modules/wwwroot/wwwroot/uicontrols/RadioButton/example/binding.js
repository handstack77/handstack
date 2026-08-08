'use strict';
var $binding = createControlBindingExample({
    adapterName: 'radio',
    initialValue: 'standard',
    get: function () {
        var selected = document.querySelector('input[name="rdoBinding"]:checked');
        return selected ? selected.value : '';
    },
    set: function (value) {
        syn.uicontrols.$radio.selectedValue('rdoBinding', value);
    },
    nextValue: function (current) {
        return current === 'express' ? 'pickup' : 'express';
    },
    events: {
        rdoBinding1_change: null,
        rdoBinding2_change: null,
        rdoBinding3_change: null
    },
    business: {
        title: '배송 방법 저장',
        description: '라디오 그룹의 단일 선택 코드를 주문 배송 방식으로 저장합니다.',
        rules: ['일반배송, 빠른배송, 방문수령 중 하나를 선택해야 합니다.'],
        validate: function (value) {
            return ['standard', 'express', 'pickup'].indexOf(value) > -1 ? true : '배송 방법을 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {OrderID: 'ORD-20260723-01', DeliveryMethod: value}};
        }
    }
});
