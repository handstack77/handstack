'use strict';
var $binding = createControlBindingExample({
    adapterName: 'contextmenu',
    initialValue: 'open',
    get: function () {
        return document.getElementById('ctxBinding').value || '';
    },
    set: function (value) {
        document.getElementById('ctxBinding').value = value;
        document.getElementById('spnSelectedCommand').textContent = value;
    },
    nextValue: function (current) {
        return current === 'delete' ? 'open' : 'delete';
    },
    events: {
        ctxBinding_select: function (evt, ui) {
            return ui.cmd;
        }
    },
    business: {
        title: '업무 명령 실행 준비',
        description: '우클릭 메뉴의 표시 문구가 아니라 허용된 command ID를 서버 명령으로 전달합니다.',
        rules: ['허용된 명령(open, rename, delete)만 실행할 수 있습니다.', '삭제는 실제 화면에서 별도 사용자 확인 후 호출해야 합니다.'],
        validate: function (value) {
            return ['open', 'rename', 'delete'].indexOf(value) > -1 ? true : '허용되지 않은 업무 명령입니다.';
        },
        buildPayload: function (value) {
            return {transactionID: 'CMD01', input: {TargetID: 'DOC-1001', CommandID: value, ConfirmRequired: value === 'delete'}};
        }
    }
});
