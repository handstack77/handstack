'use strict';
var $binding = createControlBindingExample({
    adapterName: 'sourceeditor',
    initialValue: 'function validate(order) {\n    return order.totalAmount > 0;\n}',
    get: function () {
        return syn.uicontrols.$sourceeditor.getValue('srcBinding');
    },
    set: function (value) {
        syn.uicontrols.$sourceeditor.setValue('srcBinding', value);
    },
    nextValue: function (current) {
        return current.indexOf('customerGrade') > -1
            ? 'function validate(order) {\n    return order.totalAmount > 0;\n}'
            : 'function validate(order) {\n    return order.totalAmount > 0 && order.customerGrade !== "BLOCK";\n}';
    },
    afterMount: function (page) {
        var attempts = 0;
        var attachChangeHandler = function () {
            var control = syn.uicontrols.$sourceeditor.getControl('srcBinding');
            if (control && control.editor) {
                control.editor.setValue(page.prop.mounted.store.data.value);
                control.editor.onDidChangeModelContent(function () {
                    page.method.controlToModel();
                });
            } else if (attempts++ < 100) {
                setTimeout(attachChangeHandler, 50);
            }
        };
        attachChangeHandler();
    },
    business: {
        title: '업무 규칙 스크립트 저장',
        description: '코드 변경을 모델에 반영하고 저장 전에 JavaScript 구문만 컴파일 검증합니다. 이 예제는 스크립트를 실행하지 않습니다.',
        rules: ['스크립트가 비어 있지 않아야 합니다.', 'JavaScript 구문 오류가 없어야 합니다.', '운영에서는 별도 샌드박스와 권한 검토가 필요합니다.'],
        validate: function (value) {
            if (!String(value || '').trim()) {
                return '업무 규칙 스크립트를 입력하세요.';
            }
            try {
                new Function(String(value));
                return true;
            } catch (error) {
                return 'JavaScript 구문 오류: ' + error.message;
            }
        },
        buildPayload: function (value) {
            return {transactionID: 'UD_RULE', input: {RuleID: 'ORDER_VALIDATE', Language: 'JavaScript', Source: value}};
        }
    }
});
