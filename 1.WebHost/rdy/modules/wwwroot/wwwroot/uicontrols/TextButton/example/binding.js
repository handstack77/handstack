'use strict';
var bindingClickCount = 0;
var $binding = createControlBindingExample({
    adapterName: 'textbutton',
    initialValue: '승인 처리',
    get: function () {
        return syn.uicontrols.$button.getValue('btnBinding');
    },
    set: function (value) {
        syn.uicontrols.$button.setValue('btnBinding', value);
    },
    nextValue: function () {
        return '재승인 처리';
    },
    events: {
        btnBinding_click: function () {
            bindingClickCount += 1;
            return '승인 요청 ' + bindingClickCount + '회';
        }
    },
    business: {
        title: '버튼 명령 상태 저장',
        description: '버튼의 현재 텍스트 상태를 명령 로그와 함께 업무 요청으로 구성합니다.',
        rules: ['실행할 명령 문구가 비어 있지 않아야 합니다.'],
        validate: function (value) {
            return String(value || '').trim() ? true : '실행할 버튼 명령이 없습니다.';
        },
        buildPayload: function (value) {
            return {transactionID: 'CMD01', input: {DocumentID: 'APV-20260723-01', CommandText: value, ClickCount: bindingClickCount}};
        }
    }
});
