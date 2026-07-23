'use strict';
var $binding = createControlBindingExample({
    adapterName: 'htmleditor',
    initialValue: '<h3>서비스 점검 안내</h3><p>7월 23일 22시부터 정기점검을 진행합니다.</p>',
    get: function () {
        return syn.uicontrols.$htmleditor.getValue('edtBinding');
    },
    set: function (value) {
        syn.uicontrols.$htmleditor.setValue('edtBinding', value);
    },
    nextValue: function (current) {
        return current.indexOf('변경') > -1
            ? '<h3>서비스 점검 안내</h3><p>7월 23일 22시부터 정기점검을 진행합니다.</p>'
            : '<h3>서비스 점검 일정 변경</h3><p>점검 시작 시각이 7월 24일 22시로 변경되었습니다.</p>';
    },
    afterMount: function (page) {
        var attempts = 0;
        var attachChangeHandler = function () {
            var editor = syn.uicontrols.$htmleditor.getHtmlEditor('edtBinding');
            if (editor) {
                editor.setContent(page.prop.mounted.store.data.value);
                editor.on('change input undo redo', function () {
                    page.method.controlToModel();
                });
            } else if (attempts++ < 100) {
                setTimeout(attachChangeHandler, 50);
            }
        };
        attachChangeHandler();
    },
    business: {
        title: 'HTML 공지 템플릿 저장',
        description: '편집기의 HTML 원문을 공지 템플릿으로 저장하되 실제 서비스에서는 서버측 HTML 정제도 함께 수행해야 합니다.',
        rules: ['태그를 제외한 본문이 비어 있지 않아야 합니다.', 'HTML 원문은 10,000자를 넘을 수 없습니다.'],
        validate: function (value) {
            var text = String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            if (!text) {
                return '공지 본문을 입력하세요.';
            }
            return String(value).length <= 10000 ? true : 'HTML 원문은 10,000자 이하로 입력하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {TemplateID: 'OPS_NOTICE', Subject: '서비스 점검 안내', HtmlBody: value}};
        }
    }
});
