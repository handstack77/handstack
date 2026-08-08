'use strict';
var $binding = createControlBindingExample({
    adapterName: 'element',
    initialValue: '7월 정기점검은 23일 22시에 시작합니다.',
    get: function () {
        return syn.uicontrols.$element.getValue('elBinding');
    },
    set: function (value) {
        syn.uicontrols.$element.setValue('elBinding', value);
    },
    nextValue: function () {
        return '정기점검 일정이 7월 24일 22시로 변경되었습니다.';
    },
    events: {
        elBinding_input: null
    },
    business: {
        title: '운영 공지 저장',
        description: 'contenteditable 영역의 텍스트를 공지 본문으로 검증해 저장합니다.',
        rules: ['공지는 공백 제외 10자 이상 200자 이하여야 합니다.'],
        validate: function (value) {
            var text = String(value || '').trim();
            return text.length >= 10 && text.length <= 200 ? true : '공지 내용은 10~200자로 입력하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {NoticeID: 'OPS-202607', NoticeText: String(value).trim()}};
        }
    }
});
