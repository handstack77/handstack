'use strict';
var $binding = createControlBindingExample({
    adapterName: 'codepicker',
    initialValue: 'CUST-1000',
    get: function () {
        return syn.uicontrols.$codepicker.getValue('chpBinding');
    },
    set: function (value) {
        syn.uicontrols.$codepicker.setValue('chpBinding', value);
    },
    nextValue: function (current) {
        return current === 'CUST-2000' ? 'CUST-1000' : 'CUST-2000';
    },
    events: {
        chpBinding_change: null
    },
    business: {
        title: '거래처 코드 저장',
        description: '코드 도우미에서 선택한 거래처 키만 주문 Form 입력에 포함합니다.',
        rules: ['거래처 코드는 필수입니다.', '화면에 표시되는 거래처명 대신 안정적인 코드 값을 저장합니다.'],
        validate: function (value) {
            return /^CUST-\d{4}$/.test(value) ? true : 'CUST-0000 형식의 거래처 코드를 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'ID01', input: {OrderID: 'ORD-20260723-01', CustomerID: value}};
        }
    }
});
