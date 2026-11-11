'use strict';

(function () {
    var regions = sampleGeoRegions();
    initChart('grdGeoRegion', {
        tooltip: { formatter: function (p) { return p.data.name + ': ' + p.data.value; } },
        xAxis: { show: false, min: 0, max: 100 }, yAxis: { show: false, min: 0, max: 100 },
        series: [{
            type: 'scatter', symbolSize: function (val) { return Math.sqrt(val[2]) * 2; },
            data: regions.map(function (r) { return { name: r.name, value: [r.coord[0], r.coord[1], r.value] }; }),
            label: { show: true, formatter: function (p) { return p.data.name; }, position: 'top' }
        }]
    });
})();
