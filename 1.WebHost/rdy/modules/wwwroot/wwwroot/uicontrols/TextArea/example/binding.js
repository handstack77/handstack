'use strict';
var $binding = createControlBindingExample({
    adapterName: 'textarea',
    initialValue: '요청 범위와 예상 효과를 검토했습니다.',
    get: function () {
        return syn.uicontrols.$textarea.getValue('txtBinding');
    },
    set: function (value) {
        syn.uicontrols.$textarea.setValue('txtBinding', value);
    },
    nextValue: function (current) {
        return current.indexOf('보완') > -1 ? '요청 범위와 예상 효과를 검토했습니다.' : '보완 자료를 확인했으며\n해당 요청을 승인합니다.';
    },
    events: {
        txtBinding_change: null
    },
    business: {
        title: '결재 의견 저장',
        description: '여러 줄 결재 의견을 공백 정리 후 승인 거래에 포함합니다.',
        rules: ['결재 의견은 10자 이상 500자 이하여야 합니다.'],
        validate: function (value) {
            var text = String(value || '').trim();
            return text.length >= 10 && text.length <= 500 ? true : '결재 의견은 10~500자로 입력하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'AP01', input: {DocumentID: 'APV-20260723-01', Decision: 'APPROVED', Comment: value.trim()}};
        }
    }
});
