'use strict';

(function () {
    var chart = initChart('grdGoalGauge', { series: [{ type: 'gauge', progress: { show: true }, detail: { valueAnimation: true, formatter: '{value}%' }, data: [{ value: 72, name: '달성률' }] }] });
    on('grdGoalGauge_value', 'change', function (e) {
        if (chart) { chart.setOption({ series: [{ data: [{ value: Number(e.target.value) || 0, name: '달성률' }] }] }); }
    });
})();
