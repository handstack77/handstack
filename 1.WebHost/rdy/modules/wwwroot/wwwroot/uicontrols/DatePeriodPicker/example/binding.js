'use strict';
var $binding = createControlBindingExample({
    adapterName: 'dateperiodpicker',
    initialValue: '2026-07-01,2026-07-31',
    get: function () {
        var value = syn.uicontrols.$dateperiodpicker.getValue('dtpBinding') || '';
        return value.replace(' ~ ', ',');
    },
    set: function (value) {
        syn.uicontrols.$dateperiodpicker.setValue('dtpBinding', value);
    },
    nextValue: function (current) {
        return current === '2026-12-01,2026-12-31' ? '2026-07-01,2026-07-31' : '2026-12-01,2026-12-31';
    },
    events: {
        dtpBinding_onselect: null,
        dtpBinding_onconfirm: null
    },
    business: {
        title: '조회 기간 조건 만들기',
        description: '한 개의 기간 컨트롤 값을 거래 입력의 FromDate와 ToDate로 분리합니다.',
        rules: ['시작일과 종료일을 모두 선택해야 합니다.', '시작일은 종료일보다 늦을 수 없습니다.', '온라인 조회 범위는 최대 92일입니다.'],
        validate: function (value) {
            var dates = value.split(',');
            if (dates.length !== 2 || !/^\d{4}-\d{2}-\d{2}$/.test(dates[0]) || !/^\d{4}-\d{2}-\d{2}$/.test(dates[1])) {
                return '조회 시작일과 종료일을 선택하세요.';
            }
            var days = Math.round((new Date(dates[1]) - new Date(dates[0])) / 86400000);
            if (days < 0) {
                return '시작일은 종료일보다 늦을 수 없습니다.';
            }
            return days <= 92 ? true : '조회 기간은 최대 92일까지 허용합니다.';
        },
        buildPayload: function (value) {
            var dates = value.split(',');
            return {transactionID: 'LD01', input: {FromDate: dates[0], ToDate: dates[1], Status: 'ALL'}};
        }
    }
});
