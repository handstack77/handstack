'use strict';
var $binding = createControlBindingExample({
    adapterName: 'textbox',
    initialValue: '7월 정기 구매 요청',
    get: function () {
        return syn.uicontrols.$textbox.getValue('txtBinding');
    },
    set: function (value) {
        syn.uicontrols.$textbox.setValue('txtBinding', value);
    },
    nextValue: function (current) {
        return current === '7월 정기 구매 요청(수정)' ? '7월 정기 구매 요청' : '7월 정기 구매 요청(수정)';
    },
    events: {
        txtBinding_input: null
    },
    business: {
        title: '요청 제목 저장',
        description: '입력 즉시 Proxy에 반영된 제목을 저장 전 길이와 공백 기준으로 검증합니다.',
        rules: ['제목은 앞뒤 공백을 제외하고 2~50자로 입력해야 합니다.'],
        validate: function (value) {
            var title = String(value || '').trim();
            return title.length >= 2 && title.length <= 50 ? true : '요청 제목은 2~50자로 입력하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {RequestID: 'REQ-20260723-01', RequestTitle: value.trim()}};
        }
    }
});
