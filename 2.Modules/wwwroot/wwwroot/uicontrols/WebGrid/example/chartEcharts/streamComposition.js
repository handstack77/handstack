'use strict';

(function () {
    var days = sampleTimeSeries(30).map(function (d) { return d.date; });
    function series(name) { return { name: name, type: 'line', stack: 'total', areaStyle: {}, data: days.map(function () { return Math.round(Math.random() * 100); }) }; }
    initChart('grdStreamComposition', {
        tooltip: { trigger: 'axis' }, legend: {}, xAxis: { type: 'category', data: days }, yAxis: { type: 'value' },
        series: [series('음료'), series('스낵'), series('생활용품')]
    });
})();
