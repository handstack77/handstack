'use strict';
var $binding = createControlBindingExample({
    adapterName: 'datasource',
    initialValue: {Name: '홍길동', Age: 30},
    get: function () {
        return syn.uicontrols.$data.getValue('srcBinding', true);
    },
    set: function (value) {
        syn.uicontrols.$data.setValue('srcBinding', value);
    },
    nextValue: function (current) {
        return current.Name === '이영희' ? {Name: '홍길동', Age: 30} : {Name: '이영희', Age: 27};
    },
    events: {
        txtDataName_change: null,
        txtDataAge_change: null
    },
    business: {
        title: '사원 기본정보 저장',
        description: '여러 입력 컨트롤을 하나의 Form 객체로 묶어 저장 전 검증과 거래 입력을 수행합니다.',
        rules: ['이름은 필수입니다.', '나이는 18세 이상 65세 이하여야 합니다.'],
        validate: function (value) {
            if (!value.Name || !String(value.Name).trim()) {
                return '이름을 입력하세요.';
            }
            var age = Number(value.Age);
            return age >= 18 && age <= 65 ? true : '나이는 18세 이상 65세 이하로 입력하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', inputs: [{type: 'Row', dataFieldID: 'Employee', row: {Name: value.Name.trim(), Age: Number(value.Age)}}]};
        }
    }
});
