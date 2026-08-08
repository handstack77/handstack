'use strict';
var $binding = createControlBindingExample({
    adapterName: 'chart',
    initialValue: [{
        QUARTER: '1분기',
        AMOUNT: 20
    },
    {
        QUARTER: '2분기',
        AMOUNT: 28
    },
    {
        QUARTER: '3분기',
        AMOUNT: 32
    },
    {
        QUARTER: '4분기',
        AMOUNT: 40
    }],
    get: function () {
        return syn.uicontrols.$chart.getRawValue('chtBinding');
    },
    set: function (value) {
        syn.uicontrols.$chart.setValue('chtBinding', value);
    },
    nextValue: function (current) {
        return current.map(function (row, index) {
            return {
                QUARTER: row.QUARTER,
                AMOUNT: row.AMOUNT + (index + 1) * 2
            };
        });
    },
    events: {
        btnChartControlChange_click: function () {
            var rows = syn.uicontrols.$chart.getRawValue('chtBinding');
            rows[0].AMOUNT += 5;
            syn.uicontrols.$chart.setValue('chtBinding', rows);
            return rows;
        }
    },
    business: {
        title: 'KPI 차트 행 저장',
        description: '차트에 표시한 원본 행을 대시보드 위젯 데이터로 직렬화합니다.',
        rules: ['분기명은 필수입니다.',
            '금액은 숫자여야 합니다.'
        ],
        validate: function (value) {
            var invalid = (value || []).some(function (row) {
                return !row.QUARTER || !isFinite(Number(row.AMOUNT));
            });
            return invalid ? '모든 행에 분기명과 숫자 금액을 입력하세요.' : true;
        },
        buildPayload: function (value) {
            return {
                transactionID: 'UD_WIDGET',
                input: {
                    DashboardID: 'DASH-SALES',
                    WidgetID: 'KPI-01',
                    Rows: value
                }
            };
        }
    }
});
