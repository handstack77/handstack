'use strict';
var $binding = createControlBindingExample({
    adapterName: 'dropdownchecklist',
    initialValue: 'EMAIL,WEB',
    get: function () {
        return syn.uicontrols.$multiselect.getValue('ddlBinding');
    },
    set: function (value) {
        syn.uicontrols.$multiselect.setValue('ddlBinding', value);
    },
    nextValue: function (current) {
        return current === 'SMS,PUSH' ? 'EMAIL,WEB' : 'SMS,PUSH';
    },
    events: {
        ddlBinding_change: null
    },
    business: {
        title: '알림 채널 저장',
        description: '다중 선택 문자열을 서버 계약의 채널 코드 배열로 변환합니다.',
        rules: ['알림 채널을 한 개 이상 선택해야 합니다.', '허용된 채널 코드만 저장합니다.'],
        validate: function (value) {
            var channels = value ? value.split(',') : [];
            var allowed = ['EMAIL', 'SMS', 'PUSH', 'WEB'];
            return channels.length > 0 && channels.every(function (item) {
                return allowed.indexOf(item) > -1;
            }) ? true : '알림 채널을 한 개 이상 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {UserID: 'U1001', NotificationChannels: value.split(',')}};
        }
    }
});
