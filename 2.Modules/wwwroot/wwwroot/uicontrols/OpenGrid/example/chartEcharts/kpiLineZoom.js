'use strict';

(function () {
    var data = sampleTimeSeries(60);
    initChart('grdKpiLineZoom', {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.map(function (d) { return d.date; }) },
        yAxis: { type: 'value' },
        dataZoom: [{ type: 'inside' }, { type: 'slider' }],
        series: [{ type: 'line', data: data.map(function (d) { return d.value; }), smooth: true }]
    });
})();
