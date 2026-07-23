'use strict';
var $binding = createControlBindingExample({
    adapterName: 'colorpicker',
    initialValue: '#206bc4',
    get: function () {
        return syn.uicontrols.$colorpicker.getValue('clpBinding');
    },
    set: function (value) {
        syn.uicontrols.$colorpicker.setValue('clpBinding', value);
    },
    nextValue: function (current) {
        return current === '#d63939' ? '#206bc4' : '#d63939';
    },
    events: {
        clpBinding_change: null
    },
    business: {
        title: '브랜드 테마 저장',
        description: '관리자가 선택한 대표 색상을 테넌트 UI 설정으로 저장합니다.',
        rules: ['색상은 #RRGGBB 6자리 HEX 형식이어야 합니다.'],
        validate: function (value) {
            return /^#[0-9a-f]{6}$/i.test(value) ? true : '#RRGGBB 형식의 색상을 선택하세요.';
        },
        buildPayload: function (value) {
            return {transactionID: 'UD01', input: {ThemeID: 'PORTAL_DEFAULT', PrimaryColor: value.toUpperCase()}};
        }
    }
});
