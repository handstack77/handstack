'use strict';

(function () {
    var data = sampleRegionSales();
    initChart('grdRegionBar', {
        tooltip: {}, xAxis: { type: 'category', data: data.map(function (d) { return d.name; }) }, yAxis: { type: 'value' },
        series: [{ type: 'bar', data: data.map(function (d) { return d.value; }), itemStyle: { color: '#2563eb' } }]
    });
})();
