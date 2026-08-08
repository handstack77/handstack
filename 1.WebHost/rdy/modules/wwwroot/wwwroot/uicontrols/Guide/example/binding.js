'use strict';
var $binding = createControlBindingExample({
    adapterName: 'guide',
    initialValue: 'ready',
    get: function () {
        return syn.uicontrols.$guide.getValue('hlpBinding');
    },
    set: function (value) {
        syn.uicontrols.$guide.setValue('hlpBinding', value);
    },
    nextValue: function (current) {
        return current === 'model-updated' ? 'ready' : 'model-updated';
    },
    events: {
        btnStartGuide_click: function () {
            syn.uicontrols.$guide.introStart('hlpBinding');
            return syn.uicontrols.$guide.getValue('hlpBinding');
        },
        hlpBinding_complete: function () {
            return 'complete';
        },
        hlpBinding_exit: function () {
            return 'exit';
        }
    },
    business: {
        title: '온보딩 진행 상태 저장',
        description: '가이드 완료·중단 이벤트 상태를 사용자별 온보딩 이력에 저장합니다.',
        rules: ['저장 가능한 상태는 ready, model-updated, complete, exit입니다.'],
        validate: function (value) {
            return ['ready', 'model-updated', 'complete', 'exit'].indexOf(value) > -1 ? true : '알 수 없는 가이드 진행 상태입니다.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {UserID: 'U1001', GuideID: 'FIRST_LOGIN', Status: value, CompletedYN: value === 'complete' ? 'Y' : 'N'}};
        }
    }
});
