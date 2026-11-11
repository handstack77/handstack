'use strict';

(function () {
    var m = sampleHeatMatrix();
    var max = 0;
    m.data.forEach(function (d) { if (d[2] > max) { max = d[2]; } });
    initChart('grdDensityHeatmap', {
        tooltip: { position: 'top' },
        grid: { height: '60%', top: '10%' },
        xAxis: { type: 'category', data: m.days, splitArea: { show: true } },
        yAxis: { type: 'category', data: m.hours, splitArea: { show: true } },
        visualMap: { min: 0, max: max, calculable: true, orient: 'horizontal', bottom: 0 },
        series: [{ type: 'heatmap', data: m.data, label: { show: true } }]
    });
})();
