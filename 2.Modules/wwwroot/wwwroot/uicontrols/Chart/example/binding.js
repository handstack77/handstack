'use strict';
var $binding = createControlBindingExample({
    adapterName: 'chart',
    initialValue: [
        {name: '2025', data: [20, 28, 32, 40]}
    ],
    get: function () {
        return syn.uicontrols.$chart.getValue('chtBinding');
    },
    set: function (value) {
        syn.uicontrols.$chart.setValue('chtBinding', value);
    },
    nextValue: function (current) {
        return current.length > 1
            ? [{name: '2025', data: [20, 28, 32, 40]}]
            : current.concat([{name: '2026 예상', data: [25, 35, 38, 48]}]);
    },
    events: {
        btnChartControlChange_click: function () {
            var chart = syn.uicontrols.$chart.getChartControl('chtBinding');
            var point = chart.series[0].points[0];
            point.update(point.y + 5);
            return syn.uicontrols.$chart.getValue('chtBinding');
        }
    },
    business: {
        title: 'KPI 차트 구성 저장',
        description: '차트에서 수정된 series를 대시보드 위젯 설정으로 직렬화합니다.',
        rules: ['계열명은 필수입니다.', '각 계열은 4개 분기의 숫자 값을 가져야 합니다.'],
        validate: function (value) {
            var invalid = (value || []).some(function (series) {
                return !series.name || !Array.isArray(series.data) || series.data.length !== 4 || series.data.some(function (point) {
                    return !isFinite(Number(point));
                });
            });
            return invalid ? '모든 계열에 이름과 4개 분기 숫자 값을 입력하세요.' : true;
        },
        buildPayload: function (value) {
            return {transactionID: 'UD_WIDGET', input: {DashboardID: 'DASH-SALES', WidgetID: 'KPI-01', Series: value}};
        }
    }
});
