'use strict';
var $binding = createControlBindingExample({
    adapterName: 'checkbox',
    initialValue: 'Y',
    get: function () {
        return syn.uicontrols.$checkbox.getValue('chkBinding');
    },
    set: function (value) {
        syn.uicontrols.$checkbox.setValue('chkBinding', value);
    },
    nextValue: function (current) {
        return current === 'Y' ? 'N' : 'Y';
    },
    events: {
        chkBinding_change: null
    },
    business: {
        title: '사용 여부 저장',
        description: '체크 상태를 업무 데이터의 UseYN 필드로 변환해 수정 거래를 준비합니다.',
        rules: ['사용 여부는 Y 또는 N이어야 합니다.'],
        validate: function (value) {
            return ['Y', 'N'].indexOf(value) > -1 ? true : '사용 여부 값이 올바르지 않습니다.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {SettingID: 'AUTO_APPROVAL', UseYN: value}};
        }
    }
});
