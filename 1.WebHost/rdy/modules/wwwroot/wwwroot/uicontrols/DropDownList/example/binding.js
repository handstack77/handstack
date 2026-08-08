'use strict';
var $binding = createControlBindingExample({
    adapterName: 'dropdownlist',
    initialValue: 'REQUEST',
    get: function () {
        return syn.uicontrols.$select.getValue('ddlBinding');
    },
    set: function (value) {
        syn.uicontrols.$select.setValue('ddlBinding', value);
    },
    nextValue: function (current) {
        return current === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    },
    events: {
        ddlBinding_change: null
    },
    business: {
        title: '결재 상태 저장',
        description: '표시 문구와 분리된 상태 코드를 결재 문서의 Status 필드에 저장합니다.',
        rules: ['정의된 결재 상태 코드만 저장할 수 있습니다.'],
        validate: function (value) {
            return ['REQUEST', 'APPROVED', 'REJECTED', 'CANCELED'].indexOf(value) > -1 ? true : '유효한 결재 상태를 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {DocumentID: 'APV-20260723-01', Status: value}};
        }
    }
});
