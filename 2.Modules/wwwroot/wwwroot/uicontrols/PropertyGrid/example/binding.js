'use strict';
var $binding = createControlBindingExample({
    adapterName: 'propertygrid',
    initialValue: {NotifyYN: true, Volume: 50, Nickname: '길동'},
    get: function () {
        return syn.uicontrols.$propertygrid.getValue('pgBinding');
    },
    set: function (value) {
        syn.uicontrols.$propertygrid.setValue('pgBinding', value);
    },
    nextValue: function (current) {
        return current.Nickname === '영희'
            ? {NotifyYN: true, Volume: 50, Nickname: '길동'}
            : {NotifyYN: false, Volume: 80, Nickname: '영희'};
    },
    afterMount: function (page) {
        var element = document.getElementById('pgBinding');
        ['input', 'change'].forEach(function (eventName) {
            element.addEventListener(eventName, function () {
                page.method.controlToModel();
            });
        });
    },
    business: {
        title: '사용자 환경설정 저장',
        description: '서로 다른 타입의 속성을 한 객체로 읽어 개인화 설정 거래를 구성합니다.',
        rules: ['볼륨은 0~100 범위여야 합니다.', '별칭은 2~20자로 입력해야 합니다.'],
        validate: function (value) {
            if (Number(value.Volume) < 0 || Number(value.Volume) > 100) {
                return '볼륨은 0~100 범위로 입력하세요.';
            }
            var nickname = String(value.Nickname || '').trim();
            return nickname.length >= 2 && nickname.length <= 20 ? true : '별칭은 2~20자로 입력하세요.';
        },
        buildPayload: function (value) {
            return {
                transactionID: 'UD01',
                input: {UserID: 'U1001', NotifyYN: Boolean(value.NotifyYN), Volume: Number(value.Volume), Nickname: value.Nickname.trim()}
            };
        }
    }
});
